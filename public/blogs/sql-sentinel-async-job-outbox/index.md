[SQL Sentinel 项目展示](/projects/sql-sentinel#project-articles) · [系列目录](/blog/lake-282383607) · 5 / 6

沿一个 Webhook 诊断任务追踪 Job 与 Outbox 的事务写入、Relay 发布、Worker 领取，以及执行结果的重试或终态处理。

> 实现说明与运行记录基于 2026-10-12 更新的原稿。正文中的文件行号、实现状态与验证结果按该历史快照理解。

## 实现概览

- 接收请求与执行 Shadow、EXPLAIN 和测量被拆为不同阶段。
- Job 与 Outbox 同事务落库，Relay 允许重复发布。
- 任务领取、租约和终态区分防止把暂时失败写成永久失败。

## 实现细节
## 1. 先认识三个角色：工作单、待发送通知、消息

假设一个 Webhook 提交了一条待验证 SQL。

执行 Shadow、EXPLAIN、比较和测量可能较慢，因此适合把“接收任务”和“执行任务”分开。

三个核心对象是：

| 对象 | 通俗理解 | 保存什么 |
| --- | --- | --- |
| Job | 工作单档案 | SQL、候选、状态、尝试次数、租约等 |
| Outbox | 待发送通知清单 | 需要通知 Worker 的事件 |
| Kafka Event | 通知消息 | 主要是 Job ID 等引用信息 |

因此 Worker 收到 Kafka 消息后，不是直接相信消息里携带了一切，而是通过 Job ID 去 MySQL 获取持久化任务。

顺序可以理解为：

```text
Webhook 验证并准入
→ MySQL 事务写 Job＋Outbox
→ Relay 发布 Kafka
→ Worker 抢占 Job
→ Runner 执行
→ 持久化处理结果或重试安排
→ 提交 Kafka offset
```

先把当前装配状态说明一次：上述异步组件逻辑已经存在，但 `webhook_serve` 目前仍装配同步 `RunPipeline`；独立 Kafka Worker 入口中的 Runner 当前返回 `ErrRejected`，没有接入真实验证管线。

下面讲的是已有异步代码如何工作，而不是将它说成已经完整上线运行。

## 2. Webhook：为什么先验签，再解析和处理？

入口在 `internal/webhook/webhook.go:132`。

顺序是：

```text
检查 POST 方法和签名格式
→ 有大小限制地读取原始请求体
→ HMAC 校验
→ 并发准入
→ JSON 解码与字段校验
→ 提取新增 SQL
→ SQL Admit
→ 进入同步或异步分支
```

HMAC 可以通俗理解为：

双方持有同一份秘密，发送方对消息生成签名，接收方重新计算并比较。

它用于验证消息与共享密钥的关系、检测内容篡改，不是加密请求内容。

为什么用原始请求体？

因为重新解析再序列化 JSON，空格、字段顺序等可能改变。签名校验应对发送方实际签名的那份字节进行。

HMAC 也不自动防止一份合法请求被再次发送。重复投递的处理，还要靠 delivery ID 幂等。

通过准入后，异步分支调用 `AsyncEnqueue`。当前这条分支要求只有一条通过准入的 SQL。

## 3. 接收任务：为什么 Job 和 Outbox 必须同事务？

数据库实现是 `internal/kafka/mysql.go:81`。

它在一个事务里完成：

```text
创建 RECEIVED Job
→ 记录接收历史
→ 写入 Outbox 事件
→ 更新为 QUEUED
→ 记录排队历史
→ 提交
```

为什么不能先保存 Job，再直接发 Kafka？

因为可能出现：

```text
Job 已保存
→ Kafka 发送失败
→ 数据库里有任务，但 Worker 不知道
```

反过来先发 Kafka，也可能：

```text
消息已发送
→ Job 保存失败
→ Worker 找不到任务
```

Outbox 的核心思想是：

先在同一个数据库事务中保存业务状态和“必须发送通知”的意图，再由 Relay 异步完成外部发送。

它没有让 MySQL 和 Kafka 变成一个跨系统原子事务，而是把发送责任持久化下来。

### 三个 ID 不要混淆

```text
delivery_id：外部这次投递的身份
job_id：业务任务的身份
event_id：一次通知的身份
```

同一个 delivery 重复到达，数据库唯一约束使它返回原有 Job，而不是创建新任务。

同一个 Job 需要重试时，可以产生新的 event ID。通知变了，任务还是原来的任务。

## 4. Relay：为什么允许重复发布？

核心逻辑在 `internal/kafka/runtime.go:25`：

```text
查询到期、未发布的 Outbox
→ 发布 Kafka
→ 根据结果更新 Outbox
```

失败后会增加尝试次数，设置退避后的 `available_at`，稍后再尝试。常驻入口负责周期调用。

这里有一个经典面试问题：

Kafka 已经接受消息，但 Relay 还没更新 published 就崩溃，会怎样？

答案是：恢复后可能再次发布同一事件。

为什么先发布、后标记？

如果先标记成功再发送，标记后崩溃就可能让通知永久漏发。先发送后标记保留了重发机会，但存在重复窗口。

因此：

Outbox 的正常设计必须结合下游幂等，不能把“用了 Outbox”直接说成绝不重复。

当前 SQL Sentinel Relay 的 pending 扫描也不能套用 AgentMesh 的 Relay claim/lease 机制；两边实现需要分别记忆。

## 5. Worker 抢任务：这才是状态机的实质

入口是 `internal/kafka/runtime.go:62`。

第一步解析事件，第二步用 Job ID 调用 `internal/kafka/mysql.go:126`。

Claim 不是“查一下没在执行，就更新”。

它通过带条件的 UPDATE 原子判断：

当前状态是否允许领取？重试是否到期？运行租约是否过期？

成功更新的 Worker 才获得这次处理权，并进入 `RUNNING`、增加 attempts、记录 owner 和 lease。

### 为什么这就是状态机？

不是因为有七个状态名称，而是因为存在：

```text
当前状态
＋ 触发事件
＋ 转换条件
＋ 更新动作
```

例如：

```text
QUEUED + 成功抢占 → RUNNING
RUNNING + Runner 成功 → COMPLETED
RUNNING + 不可重试拒绝 → REJECTED
RUNNING + 普通失败且未达上限 → RETRYING
RUNNING + 普通失败且达到上限 → DEAD_LETTER
```

这套规则约束了“谁可以什么时候把任务改成什么状态”。

状态机的价值是防止随意更新，例如已经完成的任务，不应该被一条重复通知重新执行。

### 租约又是什么？

可以把它理解为一张有有效期的处理权凭证。

Worker 获得任务后，如果崩溃，不能让任务永远处于 RUNNING。租约到期后，代码允许再次 Claim。

但必须记住：

租约到期只是满足重新领取条件，不会自己产生执行触发。

仍需要新的消息或恢复扫描来发起 Claim。当前代码不能仅凭 lease 字段就宣称崩溃任务会自动被定时捞回。

此外，数据库租约也不会自动停止旧 Worker 的外部操作。多实例下的唯一持有者身份、fencing 和外部副作用幂等，是更进一步的可靠性问题。

## 6. Runner 返回后：成功、拒绝和重试为什么分开？

Worker 调用 Runner 后，按结果更新状态。

### 成功：COMPLETED

Runner 返回 nil，Worker 尝试写入完成终态。

写终态时会检查：

```text
仍然是 RUNNING
owner 匹配
lease 仍有效
```

不是任何 Worker 都能随意把 Job 标成完成。

### 不可重试：REJECTED

Runner 返回 `ErrRejected` 时，进入 REJECTED。

通俗理解：

这次任务不允许继续处理，原样再执行通常没有意义。

例如某种明确不满足业务规则的输入。这里说的是这类错误的语义，不代表当前占位 Runner 已完成这些真实判断。

### 暂时失败：RETRYING

数据库暂时不可用之类的错误，可能适合稍后重试。

`internal/kafka/mysql.go:175` 在事务里完成：

```text
将 Job 更新为 RETRYING
→ 保存错误和下一次执行时间
→ 清除当前 lease
→ 为同一个 Job 写入新的 Outbox
→ 提交
```

新 Outbox 的可发送时间与重试时间对应。

这就是持久化重试安排，而不是：

什么也不保存，单纯不 ACK，希望 Kafka 再发一次。

### 达到上限：DEAD\_LETTER

普通失败达到尝试上限后，任务进入 DEAD\_LETTER，不再无限循环。

当前 SQL Sentinel 这里是数据库任务终态和历史记录，**不是发布到独立 Kafka DLQ topic**。不要和 AgentMesh 的 DLQ 实现混记。

## 7. ACK：为什么重试安排成功后也可以提交原消息？

`internal/kafka/runtime.go:124` 的基本顺序是：

```text
Receive
→ Handle
→ Handle 成功返回
→ Commit offset
```

这里的“Handle 成功”不一定等于业务任务执行成功。

它也可能表示：

本次失败已经被可靠记录，下一次重试通知也已持久化。

所以原消息可以提交，因为它已经完成了自己的职责。

### 两种崩溃窗口

**先提交 offset，后保存处理结果：**

进程在中间崩溃，Kafka 认为处理完了，但数据库没有结果，容易丢失处理机会。

**先保存处理结果，后提交 offset：**

进程在中间崩溃，消息可能重投。但 Job 已经是终态，再次 Claim 不成功，就不会重复调用 Runner。

这也是为什么系统通常选择：

先把处理结果或后续处理责任落到数据库，再提交消费进度。

不过不要把它扩大成“任意操作都 exactly-once”。如果 Runner 进行了外部操作，在写终态前崩溃，该操作仍可能重复，需要外部副作用自己的幂等机制。

当前 Worker 遇到处理错误会返回并退出运行循环，也不能理解为它会永远在进程内部自动恢复。

### S4 的面试口述版本

SQL Sentinel 的异步组件以 MySQL Job 作为持久化任务，以 Kafka 事件作为执行通知。接收时，通过事务同时保存 Job 和 Outbox，并通过 delivery ID 唯一约束处理重复投递。Relay 发布到 Kafka，Worker 通过条件更新和租约领取任务，依据 Runner 结果进入完成、拒绝、重试或死信状态。重试状态与下一次 Outbox 通知同事务保存，随后才提交原消息 offset，因此重试责任不会只依赖未提交消息。重复通知通过 Job 状态和 Claim 规则避免重复领取，外部副作用仍需要单独保证幂等。

最后你要真正吃透的是这两个区别：

S3：找到了资料，不等于资料能支持结论；模型给了候选，不等于候选有效。  
S4：收到了消息，不等于有权执行任务；提交了 offset，不一定表示业务成功，也可能表示重试责任已经可靠转移。

---

上一篇：[SQL Sentinel：受限模型提案与 RAG 检索](/blog/sql-sentinel-model-rag)

下一篇：[SQL Sentinel：从计划证据到优化收益测量](/blog/sql-sentinel-benchmark-evidence)
