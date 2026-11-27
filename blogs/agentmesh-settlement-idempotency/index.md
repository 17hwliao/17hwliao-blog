[AgentMesh 项目展示](/projects/agentmesh#project-articles) · [系列目录](/blog/lake-282376218) · 9 / 12

从已预留的会话进入 Complete，核对 attempt 证据、最终 flush、取消或结算分支，以及 Redis 和 MySQL 的幂等边界。

> 实现说明与运行记录基于 2026-09-29 更新的原稿。正文中的文件行号、实现状态与验证结果按该历史快照理解。

## 实现概览

- 额度 unit 是预算单位，不直接等同于模型 token 账单。
- 是否发生 Provider attempt 决定后续结算方向。
- Redis 额度操作与 MySQL 状态证据需要分别保证幂等。

## 实现细节
先立三个地基概念，后面全靠它们：

1. **单位（unit）是预算，不是 token**。500、100 这些都是配额池里的整数，跟真实 token 账单无关（决策 004 明确写了）
2. **Redis 管"钱"（可用余额），MySQL 管"证据"（状态机）**。Redis 先动钱，MySQL 后落证据，两边都要幂等
3. **版本号 = 防并发的钥匙**。`quota_reservations.version` 每次状态迁移 +1

所有 UPDATE 都带 `WHERE version = 期望值`（CAS），改不到 1 行就报 `CodeVersionConflict`

---

## 第 0 步：状态机长什么样

```text
creating (v1) → reserved (v2) → [每开一个 attempt: version+1] → settled / cancelled
```

MySQL 三个终态门禁（persistence.go: 613-621）：

- `markSettledSQL`：要求 `EXISTS attempt` —— 有开过 provider 才能 settled
- `markCancelledSQL`：要求 `NOT EXISTS attempt` —— 没开过才能 cancelled

这就是"Redis 操作选 Settle 还是 Cancel"的持久化兜底：

Coordinator 在内存里判断，MySQL 用 SQL 再验一遍

```text
Coordinator.Begin (internal/reservation/coordinator.go:79)

作用：启动一个 reservation session，负责创建 reservation 并初始化 session 状态
实现：调用 newPreDeductor.Begin 创建 PersistentReservation
返回 coordinatorSession 包含 reservation 和  会话状态

PreDeductor.Begin (internal/reservation/pre_deduction.go:25)
作用：执行 reservation 的创建与预扣减操作
实现：
1. 调用 records.Create 创建 "creating" 状态的 reservation 
2. 调用 quota.Reserve 预扣 Redis 余额 
3. 调用 records.MarkReserved 更新 reservation 状态为 "reserved"
4. 返回 PersistentReservation 实例
两者关系：Coordinator.Begin 调用 PreDeductor.Begin 作为内部实现步骤
形成 reservation 创建到 session 初始化的完整流程
```

```text
调用关系是一条直线：Gateway.handleChat → Coordinator.Begin → PreDeductor.Begin → 三步存储操作。
两个 Begin 的分工不同：
调用链
server.go:276 里 
s.reservations.Begin(ctx, tenantID, model, messages) 实现的是 StreamGate 接口，
落到 Coordinator.Begin：
Coordinator.Begin (coordinator.go:79)
  ├─ 入参校验 + 生成两个 ID（reservationID、requestID，来自 NextID，默认 crypto/rand）
  ├─ 组装 CreatePersistentReservation（ReservedUnits 取自配置，即"预留 100"这个数字的来源）
  ├─ 委托 newPreDeductor(records, quota).Begin(input)   ← 关键一步
  └─ 成功后把返回的 reservation 包进 coordinatorSession（深拷贝 messages，记录 lastFlush）
PreDeductor.Begin（pre_deduction.go:30）负责的是跨存储的严格顺序，就三行主体：
1. records.Create(...)        MySQL：插一行 state='creating', version=1
2. quota.Reserve(...)         Redis Lua：读余额 → DECRBY → 写幂等结果 + reserve marker
3. records.MarkReserved(...)  MySQL CAS：state='creating' AND version 匹配 → 'reserved',
version+1
每一步必须上一步成功才继续。
为什么拆成两个
文件头注释写得很清楚（pre_deduction.go:5）：
PreDeductor 只拥有 "creating → Redis reserve → durable reserved" 这个下单序列；
Coordinator 拥有后续的流式 hooks（BeforeAttempt/AfterEmit）和 Complete() 结算
PreDeductor 是无状态的、每次 Begin 内联新建的包装器，
纯粹为了这个两步持久化序列能被单独测试。
Coordinator 是请求范围的长生命周期对象（session 一直活到流结束）。

交互里的关键语义
返回值在失败时也有意义。Redis 预扣失败或 MarkReserved 失败时
PreDeductor.Begin 把 MySQL 里那行 creating 记录连同错误一起返回（pre_deduction.go:37-44）
注释写明了：这一行是留给 Reconciler 的证据
不是给 Coordinator 用的  ——  Coordinator 收到错误就返回 nil, err，
Gateway 按 quota_exhausted 转 429、其它转 503。
"Redis 成功 / MySQL 失败"的撕裂窗口是故意留下的：MySQL 停在 creating、Redis 已经扣钱。
恢复靠 Reconciler 调 ReserveApplied（redis.go:91）读 reserve marker 判断扣没扣：
扣了就 Cancel 退回，没扣就只标 cancelled。这个判断入口是 PreDeductor 阶段埋下的 marker
不是 Coordinator 埋的
版本（version）是交互的接力棒：
MarkReserved 成功后返回的 reserved（version=2）被 Coordinator 存进 session
之后每次 BeforeAttempt 的 StartAttempt 都带着这个 version 做 CAS（persistence.go:241），
保证同一笔预留上并发写只有一个赢家
```

```text
一、每个名词是什么
1. CreatePersistentReservation — 一个入参 struct（数据，不是行为）

type CreatePersistentReservation struct {
    ID            string    // reservation 主键（随机 32 位 hex）
    TenantID      string    // 哪个租户
    RequestID     string    // 这次网关请求的 ID（用于幂等：同请求重放不建第二行）
    Model         string    // 请求的模型名
    ReservedUnits uint64    // 要预扣多少单位（来自配置 ReservationUnits）
}
它只是"创建一条 reservation 记录所需的全部字段"。
作用：把散落的参数打包成一份清晰的输入，两个 Begin 都围绕它传递数据。

2. quota — 一个接口（Redis 侧的余额操作抽象）

type quotaReserver interface {
    Reserve(context.Context, string, string, uint64, uint64) (QuotaOperationResult, error)
}
它只有一个方法 Reserve：从租户的 Redis 余额里扣掉 N 单位。
生产实现是 RedisQuotaStore（跑 Lua 脚本 DECRBY 余额 + 写幂等结果），测试里是 fake。
作用：把"扣钱"这个动作抽象出来。Coordinator/PreDeductor 只认接口
不认 Redis，方便单测注入假实现

3. PreDeductor — 预扣减执行器（只管 3 步顺序）

type PreDeductor struct {
    records persistentCreator   // MySQL 侧：Create + MarkReserved
    quota   quotaReserver       // Redis 侧：Reserve
}

func (d *PreDeductor) Begin(ctx, input) (PersistentReservation, error) {
    created, _ := d.records.Create(ctx, input)        // ① MySQL 插 creating 行
    d.quota.Reserve(ctx, ...)                         // ② Redis 扣余额
    d.records.MarkReserved(ctx, ...)                  // ③ MySQL 改 reserved 行
    return reserved, nil
}

作用：保证"先写 MySQL 凭证、再扣 Redis、最后落 reserved 状态"的固定顺序
让任何一步失败都能靠那行 MySQL 记录恢复。它不管流式过程，只管"预扣"这一个动作

4. Coordinator — 顶层协调者（整个请求的预扣+结算都归它）

type Coordinator struct {
    records coordinatorRecords  // MySQL 全套：Create/MarkReserved/StartAttempt/RecordProgress/FinishAttempt/MarkSettled/MarkCancelled/ClaimExpired
    quota   coordinatorQuota    // Redis 全套：Reserve/Settle/Cancel/ReserveApplied
    config  CoordinatorConfig   // ReservationUnits / FlushChunks / FlushInterval / NextID
    now     func() time.Time
}
作用：持有上面两者的全部能力，对外只暴露两个方法：

Begin() → 调 PreDeductor 完成预扣，返回一个 coordinatorSession（请求级句柄）
那个 session 实现了 router.AttemptHook（BeforeAttempt/BeforeEmit/AfterEmit/FinishAttempt）
并带一个终态方法 Complete() → 调 quota.Settle/Cancel + MarkSettled/MarkCancelled
二、两个 Begin 怎么交互（调用链）
Gateway handleChat (server.go:276)
  └─ s.reservations.Begin(ctx, tenantID, model, messages)
       = Coordinator.Begin (coordinator.go:79)
           ├─ 校验入参；NextID() 生成 reservationID + requestID
           ├─ newPreDeductor(c.records, c.quota).Begin(input)   ← PreDeductor.Begin (pre_deduction.go:30)
           │      ├─ records.Create     → MySQL 插 'creating' 行（凭证先行）
           │      ├─ quota.Reserve      → Redis Lua 扣余额（失败则返回 creating 行给 reconciler 兜底）
           │      └─ records.MarkReserved → MySQL 改 'reserved'
           └─ 返回 &coordinatorSession{reservation, messages, lastFlush}
                = router.AttemptHook + Complete() 的句柄
关系一句话：Coordinator.Begin 是"请求入口"，PreDeductor.Begin 是它内部委托的"预扣执行步骤"。Coordinator 把 records/quota 两个依赖喂给 PreDeductor，拿到结果后包成 session 返回给 Gateway。

三、职责边界（谁管什么）
名词	层	管的事	不管的事
CreatePersistentReservation	数据	打包建行的字段	无行为
quota（接口）	依赖抽象	定义"怎么动 Redis 余额"	不关心 MySQL
PreDeductor	执行	预扣 3 步顺序	不管流式、不管结算
Coordinator	协调	整个请求生命周期：Begin + 流式 hook + Complete 结算	不直接碰 Redis/MySQL（通过 records/quota 接口）
coordinatorSession	请求级状态	攒 attempts、算 settled/estimated、触发终态	无
```

## 0. 开局快照：`Begin()` 成功之后

`Begin()`（coordinator.go:79）= `PreDeductor.Begin`（pre\_deduction.go:30），执行顺序是刻意的三步：

| 步骤 | 存储变化 |
| --- | --- |
| ① `records.Create` | MySQL 插入 `quota_reservations`<br>行，`state='creating'`<br>, `version=1`<br>（persistence.go:577） |
| ② `quota.Reserve` | Redis Lua：`DECRBY balance 100`<br>（500→400），写幂等结果键 + reserve 标记（redis.go:215） |
| ③ `records.MarkReserved` | MySQL CAS：`creating → reserved`<br>，`version 1→2`<br>（persistence.go:586） |

开局后固定状态：

- **Redis 余额：400**，两个键：`operation:{tenant}:{res}:2:reserve`（结果 JSON）和 `reservation:{res}:reserved`（标记=1）
- **MySQL 行**：`reserved / version=2 / reserved_units=100`
- **内存 session**：`attempts=[]`, `current=nil`

②③之间挂了不要紧：留下的 creating 行就是给 Reconciler 认的尸，`ReserveApplied` 能区分"Redis 已扣"还是"根本没扣"（redis.go:91）。

## 1. 流式阶段：证据是怎么攒进内存的

Router 每调一个 provider，先触发 `BeforeAttempt`（coordinator.go:127）：

1. 防超卖闸门：`estimatedConsumed() + 本次输入 rune 数 > 100` 就 `quota_exhausted`（第 132 行）
2. `StartAttempt`：MySQL 事务里 `version +1` 并插入 `provider_attempts` 行（persistence.go:231）——**这就是"attempt 已启动"的持久证据，后面 Complete 的分叉全靠它**
3. 内存记一个 `attemptMeter{inputRunes: ...}`

之后每个 chunk：

- `AfterEmit`（coordinator.go:158）：`forwardedRunes += rune(Delta)`，chunk 带 `Usage` 就存进 `meter.providerUsage`
- 攒满 16 个 chunk 或跨 1s 时间窗才 `flush()` 一次写 MySQL（`RecordProgress` 用 `GREATEST` 只前进不后退，persistence.go:599)

注意：`forwardedRunes` 是**网关自己数的 rune 下界**，不是 token 账单（决策 004）

```text
字段	含义	何时更新	用途
s.attempts（[]*attemptMeter）	本请求内所有 attempt 的原始记录	BeforeAttempt 新增	Complete() 遍历判断是否有可信 usage、估算消耗下界
s.current（*attemptMeter）	正在跑的 attempt（最后一个）	BeforeAttempt 设置、AfterEmit 累加	AfterEmit 需要它来累加 forwardedRunes、providerUsage
attemptMeter.inputRunes	本次 prompt 的 rune 数	BeforeAttempt 设置	estimatedConsumed()（超卖闸门）
attemptMeter.forwardedRunes	网关已成功转发的 rune 下界	每条 AfterEmit 累加、flush 写 MySQL 后不清零（仅清零 chunks）	决策 004 下界证据、RecordProgress 持久化
attemptMeter.providerUsage	若 chunk 带 usage，最后一次非 nil 的值	AfterEmit 存入	settlement() 判断是否全部 attempt 有可信 usage
attemptMeter.chunks	本轮未 flush 的 chunk 计数	AfterEmit 加 1、flush 清零	达到 FlushChunks 时触发落盘
s.lastFlush	上次成功落盘的时间	flush 更新	达到 FlushInterval 时触发落盘
关键点：

attempts 长度 > 0 即代表
「曾启动过 attempt」→ Complete() 必须走 Settle 路径（即便中途错误或客户端取消）。
只有当 全部 attempt.providerUsage 均非 nil 且 !Usage.Estimated 时
才按真实 token 合计消耗；否则按 全额留存（consumed = reserved_units，released = 0）结算。
forwardedRunes 永远只能作下界参考
实际扣款与它无关（除非所有 attempt 都带了可信 usage，此时 token 才是决定因素）。
```

## 2. Router 返回后，Gateway 的三路收口

server.go:324-341：只要创建过 session，无论成功、provider 报错、客户端断开，都会调一次：

```go
reservationSession.Complete(ctx, streamErrorCode(err), isClientCancel)
```

- 后两个参数：错误码字符串 + 是否客户端取消。**当前** `Complete(ctx, _ string, _ bool)` **根本没读它们**（coordinator.go:181），结算金额完全由内存里的 attempts/usage 证据决定——这是要背的点，别被签名骗了。
- `Complete` 成功 → 正常收口（`[DONE]` / JSON 错误 / SSE 内嵌错误）
- `Complete` **本身失败**（Redis 或 MySQL 挂了）→ Gateway 先记 `quota_unavailable`，已开始流则走 SSE 错误路径，否则 503（server.go:326-340）。此时数据留在非终态，交给 reconciler。

## 3. `Complete()` 内部逐段走

### 3.1 幂等闸门（第 182 行）

`completed` 为真直接返回 nil。同一 session 只结算一次。

### 3.2 最后一次 flush（第 186-190 行）

把内存里没落盘的最后几片进度写 MySQL。**写失败不中止，只置**`persistenceUncertain=true`——后面结算一律按最保守处理。

### 3.3 核心分叉（第 191 行）

`len(s.attempts) == 0` → **Cancel 路径**（Redis `INCRBY 100` 全退 + `MarkCancelled`）。 哪怕 `>` 0，无论 provider 最后成没成功 → **Settle 路径**。理由：模型只要启动过，上游就可能已消耗，不能凭"没成功"退款。

### 3.4 `settlement()` 三种结果（coordinator.go:226）

| 条件 | consumed | released | kind |
| --- | --- | --- | --- |
| `persistenceUncertain` | 100（全预留额） | 0 | estimated |
| **每个** attempt 都有 `providerUsage`<br>且非 `Estimated` | `min(Σ(input+output), 100)` | 100−consumed | provider\_usage |
| 任一 attempt 缺 usage（**包括 fallback 掉的那次**） | 100 | 0 | estimated |

容易漏的细节：primary 首块前失败、fallback 成功 → primary 也是一次 attempt，它的 usage 缺失会让整笔走 estimated。这是决策 004 的"对租户保守"策略。

### 3.5 Redis 结算（coordinator.go:202）

- Settle 路径 → `Settle(reserved=100, consumed=X)`：`settleLua` 里 `INCRBY balance (100−X)`，把结果 JSON 写进 `operation:{tenant}:{res}:{version}:settle` 键（redis.go:226）
- Cancel 路径 → `Cancel(100)`：`INCRBY 100`，写 `:cancel` 键

### 3.6 MySQL 终态 + 双 outbox（persistence.go:313）

**Redis 成功之后**才做。`MarkSettled` 一个事务里：

1. CAS：`state='settled'`, `version+1`, 写 `settled_units/released_units/usage_observed/settlement_kind`，`WHERE version=expectedVersion AND state IN ('reserved','expired_pending')`，且**要求 attempt 行存在**（persistence.go:613）
2. 同事务插 `usage_outbox`（从刚更新的行 SELECT 快照）
3. 同事务插 `usage_kafka_outbox`（`event_id = SHA2(reservation:version)` 做事件幂等键，persistence.go:629）

`MarkCancelled` 同理，但 `NOT EXISTS(attempt)` 为真才允许（persistence.go:618）。CAS 用 `expectedVersion` 防止并发 reconciler 已经动过这行——`RowsAffected != 1` 就报 `CodeVersionConflict`（persistence.go:506）。

## 4. 三个数字场景代入

**4. 三个数字场景代入（预留 100，初始余额 500）**

| 场景 | 触发分支 | Redis 余额 | MySQL 终态 | 释放额度 | 租户最终余额 |
| --- | --- | --- | --- | --- | --- |
| **A** 零 attempt（未启动或 BeforeAttempt 直接 quota\_exhausted） | Cancel → `INCRBY 100` | 500 | `cancelled`<br>, version 3 | 100 | 500 |
| **B** 全部 attempt 有可信 usage（例如 input 15 + output 20 = 35） | Settle → `INCRBY (100‑35)=65` | 465 | `settled`<br>, `provider_usage`<br>, version 3 | 65 | 465 |
| **C** 任意 attempt 缺 usage（当前 Ark/Ollama/mock 实际走这条） | Settle（但因缺 usage 走 estimated 分支） | 400 | `settled`<br>, `estimated`<br>, version 3 | 0 | 400 |
| **C’** 与 C 相同但最后一次 flush 也失败 → `persistenceUncertain=true` | Settle（直接走第一行） | 400 | `settled`<br>, `estimated`<br>, version 3 | 0 | 400 |

关键细节：即使 primary 首块前失败、fallback 成功，**primary 本身也是一次 attempt**（它的 `providerUsage` 为 nil），于是整笔仍落入“任意 attempt 缺 usage”分支，按保守策略全额扣除，差额由平台承担——这正是决策 004“**对租户更保守**”的直接体现。

## 5. 幂等回放演示

同一 reservation、同一 version 重放 `Settle`：`settleLua` 第一行就 `GET operation...:settle`，命中直接 `cjson.decode` 返回旧结果，**不再 INCRBY**（redis.go:226-227）。所以 465 不会变成 530。

但注意边界：reconciler 认领过期行会 `version+1`，幂等键随之改变——**Lua 幂等只保护"同 version 同操作"，不自动修复"Redis 已退 65、MySQL 终态失败"的跨存储窗口**。那个窗口靠：MySQL 行卡在非终态 → 超时后 `ClaimExpired` 认领（`FOR UPDATE SKIP LOCKED` 保证并发只认一次）→ 按 `ReserveApplied` 决定补 Settle/Cancel（coordinator.go:290）。Reconciler 没有内置定时器，靠调用方显式驱动。

## 6. 测试对照（每组对应上面哪个分支）

| 测试（coordinator\_test.go） | 覆盖点 |
| --- | --- |
| `TestCoordinatorPersistsAttemptProgressAndEstimatedSettlement` | C：缺 usage → estimated，全扣 |
| `TestCoordinatorStopsOnProgressFailureAndSettlesConservatively` | C'：flush 失败 → 保守 |
| `TestCoordinatorReleasesOnlyProviderObservedUsage` | B：可信 usage 退差 |
| `TestCoordinatorRejectsBeforeAttemptAndCancelsReservation` | A：零 attempt → Cancel 全退 |
| `TestCoordinatorAccumulatesFallbackAttemptInputsWithinReservation` | 1.2 的超卖闸门：fallback 的输入 rune 也计入 100 额度 |
| `TestReconcilerSettlesStartedAndCancelsOnlyAppliedUnstarted` | 第 5 节的过期认领 |

---

上一篇：[AgentMesh：Provider 调用、Attempt Hook 与取消传播](/blog/agentmesh-provider-stream-cancellation)

下一篇：[AgentMesh：终态持久化与跨存储恢复](/blog/agentmesh-terminal-state-recovery)
