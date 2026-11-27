[AgentMesh 项目展示](/projects/agentmesh#project-articles) · [系列目录](/blog/lake-282376218) · 4 / 12

把同步聊天响应与异步事件投递分开，说明 MySQL Outbox 如何保留业务事实，以及 Kafka 不可用时的积压、重试和恢复。

> 实现说明与运行记录基于 2026-09-17 更新的原稿。正文中的文件行号、实现状态与验证结果按该历史快照理解。

## 实现概览

- 终态记录与 Outbox 在 MySQL 事务内提交。
- Relay 负责投递与退避，消费端以幂等机制处理重复事件。
- 原稿的 Compose 验证属于本地运行记录，不等同于公网生产部署。

## 实现细节
## 实现范围与可靠性问题

能从一次聊天请求讲清楚：同步响应为什么不依赖 Kafka、MySQL Outbox 如何保证最终投递、Kafka 故障如何恢复、以及项目当前的生产导向边界。

## 已验证事实

- Compose 已真实启动 MySQL、Redis、Kafka、迁移、API、Relay、Worker。
- 正常请求已验证 `Reservation/ledger/Outbox → Relay → Kafka → Projection`。
- Kafka 停止时，终态 Outbox 仍写入 MySQL；Relay 的 `attempts` 增加并更新 `available_at`。
- Kafka 恢复后，Relay 自动重发，`published_at` 写入；Worker 由 Compose 自动重启。
- 这是本地单机、生产导向参考架构，不宣称公网生产级部署。

## 可靠性闭环的源码入口

阅读：

1. `internal/reservation/persistence.go`
2. `internal/usagekafka/mysql.go`
3. `internal/usagekafka/runtime.go`
4. `cmd/usage-kafka-relay/main.go`
5. `cmd/usage-kafka-worker/main.go`

输出以下图，并逐箭头解释“谁负责、失败如何处理”：

```latex
chat terminal state
  → MySQL transaction: reservation + ledger + usage_outbox + usage_kafka_outbox
  → Relay polling: Pending(available_at) → Kafka publish → MarkPublished
  → Kafka consumer group → Worker → idempotent projection
```

必须回答：

- 为什么不能在 HTTP 请求内直接同时写 MySQL 和 Kafka？
- 为什么 Relay 要先 publish、后标记 `published_at`？
- 为什么允许 Kafka 重复消息，却不允许重复 projection？
- `available_at` 与 poll interval 分别解决什么问题？

## 从结算终态到用量投影的可靠性链路

chat terminal state  
  ↓ reservation.SQLRepository.MarkSettled / MarkCancelled  
MySQL transaction  
  quota\_reservations 终态

+ usage\_outbox 终态用量快照

+ usage\_kafka\_outbox Kafka 事件  
  ↓ commit 后  
Relay polling  
  Claim(Pending &amp;&amp; available\_at 到期)  
  → Kafka publish  
  → MarkPublished(published\_at)  
  ↓  
Kafka consumer group  
  → Worker  
  → MySQL idempotent projection

严格说，当前事务中写入的是 usage\_outbox（用量终态快照）和 usage\_kafka\_outbox（Kafka 事件）；usage\_records 是后续从 usage\_outbox 投影得到的账本记录，不应表述成三者都在同一个终态事务里写入。  
箭头	谁负责	失败如何处理  
chat terminal state → MySQL transaction	reservation.SQLRepository.MarkSettled/MarkCancelled	任一 SQL 写入失败，整个事务回滚；Reservation 终态不会单独成功。  
MySQL transaction → Relay polling	usage-kafka-relay 常驻进程	事件已安全落到 Outbox；Relay 宕机或 Kafka 不可用，不影响已提交的聊天终态，后续继续扫描。  
Pending → Kafka publish	usagekafka.Relay.RunOnce + Kafka Writer	发布失败时不写 published\_at，attempts + 1，并以指数退避更新 available\_at。  
Kafka publish → MarkPublished	Relay 的 MySQLStore.MarkPublished	Kafka 已成功但写标记前崩溃，会导致事件再次发布；这是允许的“至少一次投递”窗口。  
Kafka consumer group → Worker	usage-kafka-worker 的 consumer group	成功投影后才提交 offset；处理失败不提交，重启/重试后会再次消费。  
Worker → idempotent projection	MySQLStore.Project	usage\_kafka\_projections.reservation\_id 唯一约束阻止重复记录；同一事件重复到达是成功幂等，不同事件却占同一 reservation 会报冲突。

对应代码：

- `internal/reservation/persistence.go:313`
- `internal/usagekafka/mysql.go:27`
- `internal/usagekafka/runtime.go:22`
- `cmd/usage-kafka-relay/main.go:1`
- `cmd/usage-kafka-worker/main.go:1`
- 四个必须回答的问题

1. 为什么不能在 HTTP 请求内直接同时写 MySQL 和 Kafka？  
   因为 MySQL 提交与 Kafka publish 是两个独立资源，没有普通本地事务能保证二者原子成功。可能出现 MySQL 成功、Kafka 失败，导致账本已结算但下游没有事件；也可能 Kafka 成功、MySQL 回滚，产生幽灵事件。Outbox 把“业务终态 + 待投递事件”放进一个 MySQL 事务，再异步可靠投递。
2. 为什么 Relay 要先 publish、后标记 published\_at？  
   如果先标记已发布、再发 Kafka，Relay 在两步之间崩溃就会永久丢消息。先发后标记最多造成重复投递，但不会静默丢失；重复由消费端幂等处理。
3. 为什么允许 Kafka 重复消息，却不允许重复 projection？  
   Kafka 与数据库之间无法轻易做到端到端 exactly-once。系统选择“投递至少一次”，优先保证不丢事件；但业务侧的 projection 必须稳定，因此按 reservation\_id 做唯一约束和幂等写入，重复事件不会产生两条用量投影。
4. available\_at 与 poll interval 分别解决什么？

## 运行验证的复现步骤

```powershell
Set-Location C:\Users\17hwliao\Documents\Codex\2026-09-09\new-chat\work\agentmesh-interview-complete
docker compose ps
.\scripts\verify-reference-runtime.ps1
Invoke-RestMethod -Uri http://127.0.0.1:18080/admin/usage/outbox-summary -Headers @{ Authorization = 'Bearer local-demo-admin-token-only' }
```

只记录：请求状态、published outbox 数、projection 数。不要记录 API Key、请求正文或完整日志。

## 原稿记录的运行验证结果

本地 Compose 中 API、MySQL、Redis、Kafka、Relay、Worker 均为 healthy。

- 请求状态：`200 / verified`
- 已发布 Outbox：`61`
- Projection：`61`

说明当前参考运行时已经完成了至少 61 条“Outbox → Kafka → Projection”的闭环。

## Kafka 故障与恢复机制

Kafka 不可用时的处理过程如下：

1. API 聊天响应与 MySQL 终态事务仍可完成。
2. Relay publish 失败，Outbox 不会标记 `published_at`。
3. `attempts` 增加，`available_at` 用指数退避延后下次尝试。
4. Kafka 恢复后，Relay 扫描到期事件并重发。
5. 若 publish 成功后 Relay 崩溃，可能重复投递；Worker 以 reservation 唯一约束保证 projection 幂等。

Kafka 不可用时的链路说明  
“AgentMesh 把聊天主链和 Kafka 投递解耦。聊天请求完成后，Reservation 的终态、用量快照和 Kafka Outbox 事件在同一个 MySQL 事务中提交。因此即使 Kafka 当时不可用，API 的聊天响应和 MySQL 终态仍然可以完成，不会因为消息系统故障把已经完成的业务结果回滚掉。

之后由独立 Relay 扫描 usage\_kafka\_outbox。如果 Kafka publish 失败，Relay 不会写入 published\_at，而是增加 attempts，记录错误，并通过指数退避把 available\_at 延后。这样失败事件会保留在 MySQL 中，而不是丢失或高频重试。

Kafka 恢复后，Relay 再次扫描到 available\_at 已到期且未发布的事件，自动重新发布。这里存在一个正常的重复窗口：Kafka publish 成功后，如果 Relay 在写 published\_at 前崩溃，恢复后可能再次投递同一个事件。  
系统接受 Kafka 的至少一次投递，但 Worker 写 projection 时以 reservation\_id 唯一约束实现幂等：同一个 reservation 的重复事件不会生成第二条 projection。因此最终保证是不丢业务事件，同时避免重复用量记录。”

## 可靠性设计的五个关键问题

1. Outbox 模式解决的原子性问题是什么？
2. 为什么“至少一次投递 + 消费端幂等”比声称 exactly-once 更现实？
3. Kafka 宕机时，为什么聊天 API 仍可能成功？
4. Relay 为什么是独立进程，而不是 API 内 goroutine？
5. 当前多实例的两个边界是什么？

标准边界：多 Relay 尚未实现 claim/lease；限流当前是单进程 Token Bucket，多 API 实例时需要 Redis/Lua 或等价共享方案。

## 可靠性问题的回答与依据

1. **Outbox 模式解决什么原子性问题？**  
   解决业务数据库状态与异步消息事件不能原子提交的问题。业务终态和待发送事件同事务写 MySQL，后续由 Relay 可靠投递。
2. **为什么“至少一次投递 + 消费端幂等”比 exactly-once 更现实？**  
   Kafka publish、数据库提交、进程崩溃之间总会存在不可消除的边界。追求端到端 exactly-once 成本高且约束多；至少一次确保不丢，消费端通过唯一键和幂等写入消除重复影响，是更常见的工程折中。
3. **Kafka 宕机时，为什么聊天 API 仍可能成功？**  
   API 成功依赖的是 Provider 调用和 MySQL 终态事务；Kafka 只是终态后的异步下游。Kafka 失败会让事件保留在 Outbox 中等待 Relay 重试，不必阻塞聊天响应。
4. **Relay 为什么是独立进程，而不是 API 内 goroutine？**  
   API 应专注低延迟请求处理；Relay 的重试、退避、Kafka 可用性和恢复是后台可靠性职责。独立进程可独立重启、扩缩容和观测，也避免 API 重启导致后台投递直接停止。
5. **当前多实例边界是什么？**

这里要纠正旧任务卡：当前代码已经不是“多 Relay 未实现 claim/lease、限流仅单进程”的状态。

- 多 Relay：已使用 `lease_owner`、`lease_until` 与 `SELECT ... FOR UPDATE SKIP LOCKED` claim；Relay 崩溃后 lease 到期可被其他实例接管。
- 多 API 限流：当前 Compose 配置的是 Redis Lua 共享 Token Bucket，不是内存桶；Redis 的 `TIME` 还避免了多实例时钟偏差。
- 仍需诚实说明的边界：Kafka 到 MySQL 是“至少一次 + 幂等”，不是端到端 exactly-once；Worker 的连续失败计数目前在进程内存，Worker 重启会重置这段失败计数。

## 验证与说明要点

- 能不看代码画出可靠性闭环。
- 故障恢复说明应覆盖积压、重试、恢复投递与消费端去重。
- 能准确说出“已验证单机 Compose”与“待演进多实例”的区别。

---

上一篇：[AgentMesh：聊天请求的认证、路由与流式响应](/blog/agentmesh-chat-auth-routing)

下一篇：[AgentMesh：服务启动与依赖组装](/blog/agentmesh-startup-assembly)
