[AgentMesh 项目展示](/projects/agentmesh#project-articles) · [系列目录](/blog/lake-282376218) · 11 / 12

从一笔已结算调用出发，分别追踪本地账本落地与 Kafka 事件投递，拆解事务、领取、租约、重试和崩溃接管。

> 实现说明与运行记录基于 2026-10-07 更新的原稿。正文中的文件行号、实现状态与验证结果按该历史快照理解。

## 实现概览

- usage_outbox 与 usage_kafka_outbox 服务不同路径。
- 本地 drain 负责账本写入，Relay 负责 Kafka 事件投递。
- 投递后打标与消费端去重共同处理重复发送窗口，不以此宣称全链路 exactly-once。

## 实现细节
## 0. 先建立一个贯穿全文的锚点

拿同一笔调用，把每个时刻数据库里各表长什么样，从头到尾串一遍。

```text
reservation_id = res-001
tenant_id       = tenant-a
预留额度        = 100
确认消耗        = 35
退回额度        = 65
最终状态        = settled
```

**记住一个核心事实**：请求结束的那一刻（`MarkSettled` 事务提交），数据库里已经有 3 样东西；`usage_records` 是**之后**才由 drain 命令生成的。

| 时刻 | `quota_reservations` | `usage_outbox` | `usage_kafka_outbox` | `usage_records` |
| --- | --- | --- | --- | --- |
| 终态事务提交后 | settled, 35/65, v+1 | 快照入库, `projected_at=NULL` | 事件入库，等 Relay | **还没有** |
| drain 成功提交 | 不变 | `projected_at`<br>有值 | 独立推进 | 1 条记录 |

---

## 1. `MarkSettled()`：终态 + 两份 Outbox 在同一个 MySQL 事务里

### 代码在哪

MarkSettled (persistence.go:313)

### 逐行拆解

```go
func (r *SQLRepository) MarkSettled(ctx, tenantID, reservationID, expectedVersion,
    settledUnits, releasedUnits uint64, usageObserved bool, kind string) (...) {

    // ① 开一个 MySQL 事务，从这一步开始到 Commit 都是原子的
    tx, err := r.db.BeginTx(ctx, nil)
    defer tx.Rollback()   // 任何 panic 或提前 return 都会回滚

    // ② 终态 CAS 更新（关键行）
    //    SQL 在 persistence.go:613
    result, _ := tx.ExecContext(ctx, markSettledSQL,
        settledUnits, releasedUnits, usageObserved, kind, now, now,
        reservationID, tenantID, expectedVersion)
    exactlyOne(result)   // RowsAffected 必须 == 1，否则 CodeVersionConflict

    // ③ 关键一步：把自己持有的 tx 传进去
    //    没有另开事务，没有单独 Commit
    r.insertUsageOutbox(ctx, tx, tenantID, reservationID, expectedVersion)

    // ④ 读回最新行
    value, _ := scanReservation(tx.QueryRowContext(ctx, reservationByIDSQL, ...))

    // ⑤ 统一提交
    tx.Commit()
    return value, nil
}
```

`tx`**参数是这里的灵魂。** 如果把事务传下去，`insertUsageOutbox` 里的两条 SQL 就和终态更新走同一条提交路径。

### `insertUsageOutbox` 内部（persistence.go:342）

```go
func (r *SQLRepository) insertUsageOutbox(ctx, tx, tenantID, reservationID, operationVersion) error {
    // 先插 usage_outbox（快照）
    tx.ExecContext(ctx, insertUsageOutboxSQL, ...)
    // 再插 usage_kafka_outbox（事件）
    tx.ExecContext(ctx, insertUsageKafkaOutboxSQL, reservationID)
}
```

整条链路在事务里的执行顺序：

```text
同一个 MySQL 事务（一个 Commit）
 ├─ UPDATE quota_reservations    → state='settled', version+1
 ├─ INSERT usage_outbox          → 终态快照
 ├─ INSERT usage_kafka_outbox    → Kafka 事件
 └─ Commit()                     ← 原子提交点
```

**任何一步失败** → `defer tx.Rollback()` → 三步全部撤销 → 不会出现"业务已终态、任务没存"的中间态。

### 一个容易混淆的细节：`expectedVersion` 传入的是什么

调用 `MarkSettled` 时，传进去的 `expectedVersion` 是**调用时**的版本（比如 v2）。但 SQL 里 `version = ?` 匹配的是旧值，更新后变成 v3。所以 `usage_outbox.operation_version` 存的是 **v2**（触发这次终态的操作版本），不是 v3。后面 Kafka 事件幂等键就是这个 v2 参与计算的。

---

## 2. `usage_outbox`：结算结果的固定快照

### SQL 在哪

insertUsageOutboxSQL (persistence.go:623)

```sql
INSERT INTO usage_outbox
    (reservation_id, tenant_id, request_id, model, final_state, operation_version,
     reserved_units, settled_units, released_units, usage_observed, settlement_kind,
     finalized_at, projected_at, created_at)
SELECT
    r.reservation_id, r.tenant_id, r.request_id, r.model, r.state, ?,
    r.reserved_units, r.settled_units, r.released_units,
    r.usage_observed, r.settlement_kind,
    r.updated_at, NULL, r.updated_at
FROM quota_reservations AS r
WHERE r.reservation_id = ? AND r.tenant_id = ?
  AND r.state IN ('settled', 'cancelled')
```

### 为什么用 `INSERT ... SELECT` 而不是 `INSERT ... VALUES`

这是关键点。如果是 `VALUES`，需要 Go 层手动把字段一个个填进来；但这里直接从 `quota_reservations`**现读刚更新过的行**，保证：

1. 读到的 `state = 'settled'` 是 CAS 刚改的
2. 读到的 `settled_units = 35`、`released_units = 65` 是刚算好的
3. 同一个事务，读写一致，不需要跨事务

### 快照里存了什么（对 res-001）

```text
reservation_id  = res-001
final_state     = settled
reserved_units  = 100
settled_units   = 35
released_units  = 65
projected_at    = NULL   ← 表示还没进 usage_records
created_at      = 终态写入时间
```

### 表结构（002\_usage\_ledger.sql:3）

migrations/002\_usage\_ledger.sql:3

```sql
CREATE TABLE IF NOT EXISTS usage_outbox (
    reservation_id  CHAR(36) NOT NULL,
    ...
    projected_at    DATETIME(6) NULL,     ← 关键：NULL 就是"未投影"
    ...
    PRIMARY KEY (reservation_id),                              -- 一笔一快照
    KEY ix_usage_outbox_unprojected (projected_at, created_at), -- 专给 drain 用
    CHECK (final_state IN ('settled', 'cancelled'))
)
```

那个 `KEY ix_usage_outbox_unprojected (projected_at, created_at)` 索引不是随便建的——它精确对应 drain 里 `WHERE projected_at IS NULL ORDER BY created_at` 的查询模式，MySQL 会直接走这个索引扫未投影行。

**这里没有重新扣额度。** 额度已经在 Redis 结算；`usage_outbox` 保存的是结算**结果**，不是触发新扣减。

---

## 3. Kafka 事件：从快照生成，但此时**没有**发 Kafka

### SQL 在哪

insertUsageKafkaOutboxSQL (persistence.go:629)

```sql
INSERT INTO usage_kafka_outbox (event_id, reservation_id, operation_version, topic, payload, ...)
SELECT
    SHA2(CONCAT(u.reservation_id, ':', u.operation_version), 256) AS event_id,
    u.reservation_id, u.operation_version,
    'agentmesh.usage.v1' AS topic,
    JSON_OBJECT(
        'schema_version', 1,
        'event_id', SHA2(CONCAT(u.reservation_id, ':', u.operation_version), 256),
        'attempt', COALESCE((SELECT MAX(a.ordinal) FROM provider_attempts AS a
                              WHERE a.reservation_id = u.reservation_id), 1),
        'reservation_id', u.reservation_id,
        'tenant_id', u.tenant_id,
        'model', u.model,
        'final_state', u.final_state,
        'operation_version', u.operation_version,
        'reserved_units', u.reserved_units,
        'settled_units', u.settled_units,
        'released_units', u.released_units,
        'usage_observed', ...,
        'settlement_kind', u.settlement_kind,
        'finalized_at', ...
    ),
    u.created_at, u.created_at
FROM usage_outbox AS u WHERE u.reservation_id = ?
```

### 三个值得记的点

**① 幂等键**`event_id = SHA2(reservation_id + ':' + operation_version)`

同一笔 reservation、同一个操作版本，永远算出同一个 ID。Relay 如果重发了这条消息，消费者可以靠 `event_id` 去重，不会重复入账。

**②**`attempt`**字段取的是**`MAX(ordinal)`

如果这笔请求走了 primary → fallback 两个 attempt，`MAX(ordinal)` 就是 fallback 那个（最后尝试的）。`COALESCE(..., 1)` 兜底 Cancel 路径（零 attempt 时没有 `provider_attempts` 行，fallback 成 1）。

**③ 读的是**`usage_outbox`**，不是**`quota_reservations`

事件以**已持久化的结算快照**为唯一依据，不是重新算。如果 Redis 结算了 35/65，快照里就是 35/65，事件也带着 35/65。

### 表结构（004\_usage\_kafka.sql:4）

migrations/004\_usage\_kafka.sql:4

`PRIMARY KEY (event_id)` —— 同一事件物理上只能存一条，`Relay` 发出去之后消费者去重靠的就是这个。

### 重要边界

**"事件已准备好" ≠ "Kafka 已收到"。**  
这一步只写 MySQL，没有任何网络调用。Kafka 消息的实际发布是由 Relay 进程做的，那是完全独立的代码路径。

---

## 4. `DrainUsageOutbox()`：把快照投进本地账本

### 代码在哪

DrainUsageOutbox (persistence.go:359)

### 领取 SQL 逐词拆解

unprojectedUsageOutboxSQL (persistence.go:646)

```sql
SELECT [usage_outbox 的所有列]
FROM usage_outbox
WHERE projected_at IS NULL      -- 只挑没进账本的
ORDER BY created_at ASC         -- FIFO，老账先处理
LIMIT ?                         -- 单批上限（drain 命令里写死 100）
FOR UPDATE SKIP LOCKED          -- 行锁 + 跳过已锁
```

| 子句 | 作用 | 为什么这么写 |
| --- | --- | --- |
| `projected_at IS NULL` | 只要未投影的 | 避免重复处理 |
| `ORDER BY created_at ASC` | 按时间顺序 | FIFO，保证先发生先入账 |
| `LIMIT ?` | 控制批量 | 防止单次事务过大锁太多行 |
| `FOR UPDATE` | 锁住选中的行 | 其他进程在事务提交前不能碰这些行 |
| `SKIP LOCKED` | 已锁的行跳过 | 两个 drain 并发时不互相等待 |

### 并发场景推演

```text
drain A：SELECT ... FOR UPDATE SKIP LOCKED → 锁住 res-001
drain B：SELECT ... FOR UPDATE SKIP LOCKED → res-001 已锁 → 跳过，去锁 res-002
drain A：INSERT usage_records + UPDATE projected_at + COMMIT → res-001 行锁释放
drain B：COMMIT → res-002 处理完
```

**没有 "processing" 状态字段**，领取完全靠 InnoDB 行锁表达，这是比加状态字段更简洁的方案。

### Go 循环部分（persistence.go:386-401）

```go
for _, item := range items {
    // 第一步：写 usage_records（VALUES 插入）
    tx.ExecContext(ctx, insertUsageRecordSQL,
        item.ReservationID, item.TenantID, ...,
        item.FinalizedAt, r.now().UTC(),
    )

    // 第二步：打 projected_at
    result, _ := tx.ExecContext(ctx, markUsageOutboxProjectedSQL,
        r.now().UTC(), item.ReservationID)
    exactlyOne(result)   // 必须恰好 1 行
}
tx.Commit()
return len(items), nil
```

### `rows.Close()` 的细节

`rows.Close()` 只关闭结果集游标，**不会释放事务持有的行锁**。行锁在 `tx.Commit()` 或 `tx.Rollback()` 时才真正释放。所以即使循环中途出错，`defer tx.Rollback()` 保证锁也不会泄漏。

---

## 5. 每条记录：先入账，再打标

### 第一步：INSERT INTO usage\_records

insertUsageRecordSQL (persistence.go:651)

```sql
INSERT INTO usage_records
    (reservation_id, tenant_id, request_id, model, final_state, operation_version,
     reserved_units, settled_units, released_units, usage_observed, settlement_kind,
     finalized_at, recorded_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE reservation_id = reservation_id
```

**注意：这里是**`VALUES`**，不是**`INSERT ... SELECT`**。** 字段的搬运发生在 Go 的 `for` 循环里（persistence.go:387-390），SQL 层只是执行写入。

`usage_records` 的主键：

migrations/002\_usage\_ledger.sql:24

```sql
CREATE TABLE usage_records (
    ...
    PRIMARY KEY (reservation_id),
    FOREIGN KEY (reservation_id) REFERENCES usage_outbox (reservation_id),
    CHECK (final_state IN ('settled', 'cancelled'))
)
```

主键是 `reservation_id`，**同一笔 reservation 物理上只能有一条账本记录**。

### `ON DUPLICATE KEY UPDATE reservation_id = reservation_id` 在做什么

字面上是"遇到主键冲突时，把 reservation\_id 更新为它自己"，即**什么都不改，只是让语句成功返回而不是报错**。效果是：

- 第一次 drain：正常 INSERT，`RowsAffected = 1`
- 重复 drain（理论上不该发生）：主键冲突，走 UPDATE 分支，值不变，`RowsAffected = 1`，不报错

这就是幂等设计。但注意：**它没有比较新旧字段是否一致**，即使快照内容变了也不会覆盖，因为 UPDATE 语句里只有 `reservation_id = reservation_id`。

### 第二步：UPDATE usage\_outbox

markUsageOutboxProjectedSQL (persistence.go:656)

```sql
UPDATE usage_outbox
SET projected_at = ?
WHERE reservation_id = ?
  AND projected_at IS NULL
```

`exactlyOne` 断言保证恰好更新 1 行。如果这行已经被标过（`projected_at IS NOT NULL`），`WHERE` 条件不满足，`RowsAffected = 0`，会返回 `CodeVersionConflict`。

### 执行顺序的保护作用

`insertUsageRecordSQL` 失败 → 直接 `return`，**第二步根本不会执行**。所以不会出现"打标了但没入账"的中间态。

---

## 6. 事务把"入账"和"打标"绑在一起

```text
批次：领取了 100 条（res-001 到 res-100）
处理到第 50 条时 UPDATE projected_at 失败
→ 函数返回错误
→ defer tx.Rollback()
→ 前 49 条的 INSERT + UPDATE 全部撤销
→ 这 100 条下次会被重新领取
```

**整批共用一个事务**，不是逐条原子。这是设计选择：简化错误处理，代价是大批次失败时前功尽弃。

### 状态变化对照表

| 时刻 | `usage_outbox.projected_at` | `usage_records` | `usage_kafka_outbox` |
| --- | --- | --- | --- |
| 终态事务提交后 | `NULL` | 无记录 | 事件已存 |
| drain 处理中（未提交） | 本事务内看着有值，**其他事务看不到** | 同事务内插入，未提交 | 独立推进 |
| drain 正常提交 | 有处理时间戳 | 1 条记录 | 独立推进 |
| drain 在标记前失败回滚 | 撤销回 `NULL` | 本次插入撤销 | 独立推进 |

---

## 7. 谁调用 drain？一次性命令，无调度

cmd/usage-outbox-drain/main.go:11

```go
func main() {
    config, _ := reservation.LoadUsageLedgerConfig(os.Getenv)
    repository, _, cleanup, _ := reservation.OpenUsageLedger(context.Background(), config)
    defer cleanup()
    projected, err := repository.DrainUsageOutbox(context.Background(), 100)  // 硬编码 100
    report := UsageLedgerCommandReport{Status: "completed", Projected: projected}
    json.NewEncoder(os.Stdout).Encode(report)
    if err != nil { os.Exit(1) }
}
```

**没有 for 循环、没有 ticker、没有 cron 注册。** 进程跑一次就退出，要持续运行必须靠外部调度（比如 `systemd timer` 或 `k8s CronJob`）。

当前 `compose.yml` 配了 Kafka Relay 和 Worker，但**没有配 drain 为常驻服务**。

### 两条完全独立的路径

```text
路径 A（本地账本）：
  usage_outbox
  → (手动运行) usage-outbox-drain
  → usage_records

路径 B（Kafka 投影）：
  usage_kafka_outbox
  → Kafka Relay（读 outbox，发 Kafka 消息）
  → Kafka 消费者（Worker）
  → usage_kafka_projections
```

两条路径**互不等待**。`usage_kafka_projections` 已经有数据时，`usage_records` 完全可能还是空的。

---

## 8. 测试：证明了什么，没证明什么

persistence\_test.go 里 drain 相关测试用的 fake 数据库对象，记录的是"调了几条 SQL、是否 Commit/Rollback"。

| 测试 | 验证的是什么 |
| --- | --- |
| `TestSQLRepositoryDrainProjectsAndMarksOutboxInSingleTransaction` | ① 领取 SQL 文本里确实有 `SKIP LOCKED`<br>；② INSERT 和 UPDATE 用的是**同一个 tx 对象** |
| rollback 测试 | 任一步失败 → `tx.rolledBack == true`<br>且 `tx.committed == false` |
| concurrent claim 测试 | 模拟第二个 drain 的 `SKIP LOCKED`<br>跳过已锁行 |
| record failure 测试 | `INSERT usage_records`<br>失败 → 不走 `UPDATE projected_at`<br>→ `tx.rolledBack` |

**没证明的**：

- 真实 MySQL 的行锁竞争行为（`FOR UPDATE SKIP LOCKED` 在 InnoDB 下的实际并发效果）
- 大批量（如 10 万条）下的事务膨胀和锁持有时间
- `INSERT ... SELECT` 在 MySQL 8 下的事务隔离级别对可见性的影响

**结论**：测试名不代表"真实并发已验证"，它们验证的是**代码调用顺序和失败处理合同**，是 unit test，不是 integration test。

## 0. 全局锚点：E1 的一生

整节只追一条事件。

```text
event_id       = E1
reservation_id = R1
topic          = agentmesh.usage.v1   ← model.go:18
payload        = {schema_version:1, event_id:E1, ...} 的 JSON
attempts       = 0
available_at   = 已到期
published_at   = NULL
lease_owner    = NULL
lease_until    = NULL
```

**表中没有**`state='pending'`**这样的状态列。** "可处理"是三个字段组合出来的谓词，这一整节的核心就是反复回到这条谓词：

```sql
published_at IS NULL
AND available_at <= now
AND (lease_until IS NULL OR lease_until <= now)
```

---

## 1. 调用链地图

| 顺序 | 源码 | 职责 |
| --- | --- | --- |
| 1 | cmd/usage-kafka-relay/main.go:41 `main`<br>/ `run` | 信号边界、依赖组装 |
| 2 | internal/usagekafka/poller.go:19 `RunPolling` | 把单次执行变成常驻循环 |
| 3 | internal/usagekafka/runtime.go:22 `Relay.RunOnce` | 一轮：抢占→逐条发→写回 |
| 4 | internal/usagekafka/mysql.go:12 `MySQLStore.Claim` | 事务 + `FOR UPDATE SKIP LOCKED`<br>抢占 |
| 5 | internal/usagekafka/runtime.go:137 `KafkaWriter.Publish` | 网络发送 |
| 6 | internal/usagekafka/mysql.go:57 `MarkPublished` | 成功打标 / 失败退避 |

```text
main
 └─ run(os.Getenv, ctx)                     ← 配置 + 组装
     ├─ loadConfig
     ├─ reservation.OpenMySQLRepository     ← 复用 reservation 包的 DSN 解析
     ├─ segmentkafka.NewWriter(Hash balancer)
     └─ RunPolling(ctx, interval, relay.RunOnce, observe)
         └─ for { relay.RunOnce(ctx) → observe }
             ├─ Store.Claim                 ← MySQL 事务，锁 + 写租约
             ├─ Publisher.Publish           ← Kafka，事务之外
             └─ Store.MarkPublished         ← 成功/失败两条路径
```

---

## 2. Relay 处理的是哪张表

回到用量落账专题 的产出点 insertUsageOutbox (persistence.go:342)：终态事务同时写两张 outbox。

```text
usage_outbox         → usage-outbox-drain（一次性命令）→ usage_records        本地账本
usage_kafka_outbox   → usage-kafka-relay（常驻）→ Kafka → Worker → usage_kafka_projections
```

**Relay 只扫**`usage_kafka_outbox`**，完全不碰**`usage_outbox`**。** 表结构在 migrations/004\_usage\_kafka.sql:4，`PRIMARY KEY (event_id)`。

事件 payload 的 JSON 结构由 Event (model.go:24) 定义，`event_id` 就是 `SHA2(reservation_id:operation_version)`，写入时由 insertUsageKafkaOutboxSQL (persistence.go:629) 算好并塞进 JSON 的 `event_id` 字段——所以 DB 列和 payload 里的 ID 是同一个值。

---

## 3. 第一步：main 怎么把进程拉起来

cmd/usage-kafka-relay/main.go:41

```go
func main() {
    ctx, stop := signalContext()
    defer stop()
    if err := run(os.Getenv, ctx); err != nil {
        log.Printf("usage kafka relay stopped with error: %v", err)
        os.Exit(1)
    }
}
```

### 3.1 `signalContext()` 只监听两个信号

main.go:135

```go
signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
```

**只有**`Ctrl+C`**（**`os.Interrupt`**）和**`SIGTERM`**。**`SIGHUP`、`SIGINT` 之外的信号不在此列——K8s 发的是 SIGTERM，所以容器优雅退出走的就是这条路。

### 3.2 `os.Getenv` 传的是**函数本身**

```go
func run(lookup func(string) string, ctx context.Context) error
```

传入的是 `func(string) string`，不是字符串。这样 `loadConfig(lookup)` 里 `lookup(mysqlDSNEnvironment)` 才是"读某个环境变量"。测试可以传 `func(s string) string { return fake[s] }`，不需要真的改进程环境变量。

### 3.3 环境变量与默认值（main.go:23-39, 79-133）

| 环境变量 | 常量 | 默认 |
| --- | --- | --- |
| `AGENTMESH_USAGE_KAFKA_MYSQL_DSN` | `mysqlDSNEnvironment` | **必填** |
| `AGENTMESH_USAGE_KAFKA_BROKERS` | `brokersEnvironment` | **必填**，逗号分隔 |
| `AGENTMESH_USAGE_KAFKA_RELAY_INTERVAL` | `intervalEnvironment` | `1s` |
| `AGENTMESH_USAGE_KAFKA_RELAY_BATCH_SIZE` | `batchEnvironment` | `16` |
| `AGENTMESH_USAGE_KAFKA_RELAY_LEASE` | `leaseEnvironment` | `30s` |
| `AGENTMESH_USAGE_KAFKA_RELAY_OWNER` | `ownerEnvironment` | `主机名-PID` |

两个容易踩的点：

- `brokersRaw` 用 `strings.Split(brokersRaw, ",")` 分割并逐个 `TrimSpace`，空段被丢弃；分割后为空 → 报错。
- `owner` 长度上限 **128 字符**，超长直接报错（对应 `usage_kafka_outbox.lease_owner` 的列宽）。
- 所有 duration 解析后必须 `> 0`，`<=0` 一律拒绝。

### 3.4 Kafka Writer 用 Hash balancer

main.go:64

```go
segmentkafka.NewWriter(segmentkafka.WriterConfig{
    Brokers:  cfg.Brokers,
    Balancer: &segmentkafka.Hash{},   // ← 关键
})
```

`Hash` balancer 按 message key 哈希选分区，所以同一个 `event_id` 永远进同一个分区。**但这只是分区有序，不是去重。**

### 3.5 组装是接口，不是具体类型

main.go:66

```go
relay := usagekafka.Relay{
    Store:     &usagekafka.MySQLStore{DB: db},
    Publisher: usagekafka.KafkaWriter{Writer: writer},
    BatchSize: cfg.Batch, Owner: cfg.Owner, LeaseFor: cfg.LeaseFor,
}
```

接口定义在 model.go:91-97：

```go
type OutboxStore interface {
    Claim(context.Context, int, time.Time, string, time.Duration) ([]OutboxRecord, error)
    MarkPublished(context.Context, string, string, time.Time, error) error
}
type Publisher interface {
    Publish(context.Context, string, string, []byte) error
}
```

`Relay.RunOnce` 里只有 `r.Store.Claim` / `r.Store.MarkPublished` / `r.Publisher.Publish`，**没有任何 SQL 和 Kafka 细节**。测试替换为内存实现即可，不需要起 MySQL。

### 3.6 顺带：`observe` 回调是静默设计

main.go:68-76

```go
func(result usagekafka.PollResult) {
    if result.Err != nil { log.Printf("scan failed published=%d error=%v", ...) }
    if result.Published > 0 { log.Printf("scan completed published=%d", ...) }
}
```

`published == 0`**且无错误时完全不打日志。** 空扫是常态，避免日志噪声。

### 3.7 `defer` 与 `os.Exit` 的真实交互

`defer stop()` 在 `main` 里；`run` 返回前，`run` 自己的 `defer db.Close()` / `defer writer.Close()` 已执行完毕。`os.Exit(1)` 之后 `main` 的 `defer stop()` 不再执行——但这只是信号监听资源的清理，不影响退出码。

启动失败与运行失败的区分：

- `loadConfig` / `OpenMySQLRepository` / `PingContext` 失败 → `run` 返回错误 → 打印后 `os.Exit(1)`，**从未进入轮询**
- `RunPolling` 里某一轮报错 → **只打日志，继续下一轮**，进程不退

---

## 4. 第二步：`RunPolling` 为什么能常驻

poller.go:19

```go
func RunPolling(ctx context.Context, interval time.Duration,
    runOnce func(context.Context) (int, error), observe func(PollResult)) error {
    if runOnce == nil  { return errors.New("relay run-once function is required") }
    if interval <= 0   { return errors.New("relay poll interval must be positive") }
    if ctx == nil      { return errors.New("relay context is required") }

    ticker := time.NewTicker(interval)
    defer ticker.Stop()
    for {
        published, err := runOnce(ctx)
        if observe != nil {
            observe(PollResult{Published: published, Err: err})
        }
        if ctx.Err() != nil { return nil }
        select {
        case <-ctx.Done(): return nil
        case <-ticker.C:
        }
    }
}
```

### 4.1 先执行、再等待

`runOnce(ctx)` 在 `select`**之前**。所以：

```text
启动 → 立刻扫第一轮 → observe → 等 ticker → 第二轮
```

**不是先睡 1 秒。** 如果启动后立刻有一条待发布事件，它不用等。

### 4.2 一轮失败不会终止进程

拿到 `err` 后**没有**`return err`，只是交给 `observe` 打日志，然后继续 `select`。Kafka 短暂不可用时：

```text
本轮 Publish 报错 → observe 打 "scan failed" → 等下一拍 → 重试
```

但注意：`observe` 本身可能为 nil（有 `if observe != nil` 保护），而 `observe` 返回 nil 是**正常**路径。

### 4.3 同进程内严格串行

`runOnce(ctx)` 同步返回后才进入 `select`。所以：

```text
第一轮完成 → 等 ticker → 第二轮开始
```

**不会因为一轮超过 1 秒就并发启动多轮。**

`ticker.C` 是非缓冲通道，容量 1。如果一轮耗时超过 `interval`，期间到期的 tick 会被丢弃，下一轮立即开始（不会补跑）。所以 `interval` 是**最小间隔**，不是精确节拍——这是 `time.NewTicker` 的标准语义，不是 bug。

### 4.4 `return nil` 是刻意设计

```go
if ctx.Err() != nil { return nil }
```

`ctx` 被取消（收到 SIGTERM）时，`RunPolling` 返回 `nil` 而不是 `ctx.Err()`。于是 `run` 返回 `nil`，`main`**不**执行 `os.Exit(1)`，进程以退出码 0 结束。这是为了让编排系统（K8s）把正常停机识别为成功。

真正的错误只来自三个前置校验；循环体里 `runOnce` 的错误被吞掉转日志。

---

## 5. 第三步：`RunOnce` 一轮到底做什么

runtime.go:22

```go
func (r Relay) RunOnce(ctx context.Context) (int, error) {
    if r.Store == nil || r.Publisher == nil { return 0, errors.New("relay store and publisher are required") }
    if r.BatchSize < 1 { r.BatchSize = 16 }
    if r.Now == nil    { r.Now = time.Now }
    if r.Owner == ""   { r.Owner = "usage-relay" }
    if r.LeaseFor <= 0 { r.LeaseFor = 30 * time.Second }

    now := r.Now().UTC()
    rows, err := r.Store.Claim(ctx, r.BatchSize, now, r.Owner, r.LeaseFor)
    if err != nil { return 0, err }

    count := 0
    for _, row := range rows {
        pubErr := r.Publisher.Publish(ctx, row.Topic, row.EventID, row.Payload)
        if err := r.Store.MarkPublished(ctx, row.EventID, r.Owner, r.Now().UTC(), pubErr); err != nil {
            return count, err
        }
        if pubErr != nil {
            return count, fmt.Errorf("publish event %s: %w", row.EventID, pubErr)
        }
        count++
    }
    return count, nil
}
```

### 5.1 头部那五段兜底是干什么的

`Relay` 是普通结构体，字段可能没被填。这五段让零值 `Relay{}` 也能跑起来，同时保证 `Claim` 拿到的参数**必然合法**（`limit >= 1`、`owner != ""`、`leaseFor > 0`）——否则 `Claim` 会在 `mysql.go:19-21` 报 `outbox lease owner and duration are required`。

`Now` 可注入是测试的关键：注入 `func() time.Time { return fakeNow }` 就能精确控制"退避到期"和"租约到期"两个时刻，不需要真等 30 秒。

### 5.2 `Claim` 在事务内完成，`Publish` 在事务之外

这是整节最重要的时序决策。`Claim` 内部有自己的 `tx`，`Commit` 在 `mysql.go:51` 完成才 `return records`。也就是说：

```text
Claim 返回 → 抢占事务已提交、行锁已释放 → 开始 Publish（可能几秒到几十秒）
```

Kafka 网络往返**不持有**抢占事务的行锁。否则所有其他 Relay 在这一轮发送期间全部阻塞，退化为全局互斥。

代价是：一旦 `Claim` 提交，"这条归我"这个事实就落在 `lease_owner`/`lease_until` 两列上，而不是靠数据库锁维持。这就是第 6.4 节要讲的双层保护。

### 5.3 失败也会调 `MarkPublished`——这是刻意的

```go
pubErr := r.Publisher.Publish(...)
r.Store.MarkPublished(..., r.Owner, r.Now().UTC(), pubErr)   // pubErr 可能就是 error
```

`MarkPublished` 的函数名会误导人。它内部按 `publishErr == nil` 分两个完全不同的分支（见第 8 节）。所以准确的说法是：

`MarkPublished` 是"发送结果的回写"，不是"标记成功"。

### 5.4 `count` 只统计**已确认落库**的成功数

```go
pubErr := Publish(...)
MarkPublished(...)        // ← 这里可能返回 ErrLeaseLost
if pubErr != nil { ... }
count++                   // ← 只有走到这里才 +1
```

如果 Kafka 已收到但 `MarkPublished` 因租约丢失失败，函数在 `count++`**之前**返回。所以 `PollResult.Published` 表示"数据库已确认成功"的数量，不是"Kafka 已收到"的数量。这两个数字在故障场景下会不等，运维监控要理解这一点。

### 5.5 中途失败即停，剩余事件靠租约兜底

```go
for _, row := range rows { ... return count, err }   // 第 3 条失败，第 4~16 条不处理
```

已 `Claim` 但本轮没处理的事件，此刻状态是：`published_at=NULL`、`lease_owner=自己`、`lease_until=now+30s`。

它们**不会被本轮认领事务之外的任何 Relay 抢走**（租约还有效），30 秒后重新变成可认领状态。外层 `RunPolling` 继续跑，下一轮会重新认领。所以"批量抢占 + 中途停"是安全的。

---

## 6. 第四步：`Claim` 怎么防并发重复抢占

mysql.go:12

### 6.1 事务骨架

```go
tx, err := s.DB.BeginTx(ctx, nil)
defer tx.Rollback()
```

`defer tx.Rollback()` 是兜底：中途 `return` 未提交则释放。正常 `Commit` 之后再次调 `Rollback` 是幂等的空操作，**不会回滚已提交数据**。

### 6.2 领取 SQL 逐词拆解

mysql.go:27

```sql
SELECT event_id, reservation_id, topic, payload, attempts, available_at
FROM usage_kafka_outbox
WHERE published_at IS NULL
  AND available_at <= ?                       -- 参数 1: now
  AND (lease_until IS NULL OR lease_until <= ?)  -- 参数 2: now
ORDER BY created_at
LIMIT ?                                       -- 参数 3: batch
FOR UPDATE SKIP LOCKED
```

| 子句 | 作用 | 备注 |
| --- | --- | --- |
| `published_at IS NULL` | 只挑未确认成功的 | 成功即永久排除 |
| `available_at <= now` | 退避到期才可见 | 首次创建时就是写入时间，通常立即可见 |
| `lease_until IS NULL OR lease_until <= now` | 无有效占用 | 新行和租约到期的行都满足 |
| `ORDER BY created_at` | FIFO | 保证顺序处理 |
| `LIMIT ?` | 单批上限 | 防止一次锁太多行、事务过大 |
| `FOR UPDATE` | 对选中行加排他锁 | 其他事务的 SELECT FOR UPDATE / UPDATE 会阻塞 |
| `SKIP LOCKED` | 跳过已被别的事务锁住的行 | 并发 Relay 互不等待 |

两个 Relay 并发：

```text
Relay A：SELECT ... FOR UPDATE SKIP LOCKED → 拿到并锁住 E1
Relay B：SELECT ... FOR UPDATE SKIP LOCKED → E1 被锁，跳过，去拿 E2
```

### 6.3 写租约的 UPDATE 为什么没有 `lease_owner` 条件

mysql.go:47

```sql
UPDATE usage_kafka_outbox
SET lease_owner = ?, lease_until = ?
WHERE event_id = ? AND published_at IS NULL
```

**注意这里只校验**`published_at IS NULL`**，没有校验**`lease_owner`**。** 看起来像漏洞，其实是安全的：

- SELECT 已经用 `FOR UPDATE` 锁住了这些行，本事务提交前其他事务改不了它们
- `MarkPublished` 的成功分支 UPDATE 会阻塞在这把锁上，所以不可能在 Claim 事务内出现"我们刚 SELECT、别人已 published"的情况
- 事务内先 SELECT 后 UPDATE，两者看到的是一致的锁保护视图

这是"SELECT 负责筛选 + 事务内 UPDATE 负责落定"的经典写法，UPDATE 只需要最小必要条件。

### 6.4 为什么行锁和租约都要

```text
阶段 A：Claim 事务内
  → 行锁保证"选中并写入 owner"期间无并发写入

阶段 B：Claim 事务提交后 → Kafka 发送期间
  → 行锁已释放，靠 lease_owner/lease_until 两列表达占用
```

如果只有行锁：发送期间锁已释放，另一个 Relay 下一轮会重复认领。 如果只有租约：写入租约的瞬间存在竞态窗口，两个 Relay 可能同时认领同一行。

**两者覆盖的是不同阶段，缺一不可。**

### 6.5 Relay 崩溃后的接管时序

A 在发送中途崩溃，`E1` 留在：

```text
published_at = NULL
lease_owner  = relay-A
lease_until  = 12:00:30
```

12:00:30 前，`lease_until > now`，E1 不满足领取条件。 12:00:30 后，`lease_until <= now`，条件成立。

**"租约到期"不会自动触发发送**——它只是让 E1 重新进入候选集，真正的发送仍依赖某个 Relay 的下一轮扫描。这是"到期即候选"，不是"到期即执行"。

---

## 7. 第五步：`KafkaWriter.Publish` 怎么发

runtime.go:137

```go
type KafkaWriter struct{ Writer *segmentkafka.Writer }

func (p KafkaWriter) Publish(ctx context.Context, topic, key string, value []byte) error {
    if p.Writer == nil { return errors.New("kafka writer is required") }
    return p.Writer.WriteMessages(ctx, segmentkafka.Message{
        Topic: topic,
        Key:   []byte(key),
        Value: append([]byte(nil), value...),   // ← 复制
    })
}
```

字段对应：

```text
row.Topic   → Message.Topic        agentmesh.usage.v1
row.EventID → Message.Key          E1（分区路由依据）
row.Payload → Message.Value        事件 JSON
```

`append([]byte(nil), value...)` 是**分配新切片并拷贝**，不共享 `Claim` 返回的底层数组。虽然当前代码里 `row.Payload` 之后没人再用，但这个拷贝让 `Publisher` 接口可以安全持有任意切片，是边界防御。

### 两个必须澄清的误区

**① Kafka key 不去重。** 同一个 key 可以有 N 条消息，Kafka 只保证同 key 进同分区（有序），不保证唯一。真正去重靠下游 MySQLStore.Project (mysql.go:97)：先 `SELECT ... FOR UPDATE` 查 `usage_kafka_projections`，同 `event_id` 直接提交返回（幂等），不同 `event_id` 报 `ErrConflict`。

**② 网络报错 ≠ broker 没收到。** Kafka 客户端超时、连接断开时，broker 可能已经写入 partition log。这就是为什么整条链路选"允许重复 + 下游幂等"，而不是"确认失败即重试"。

---

## 8. 第六步：`MarkPublished` 的两条路径

mysql.go:57

```go
func (s *MySQLStore) MarkPublished(ctx context.Context, eventID, owner string,
    now time.Time, publishErr error) error {
    if s == nil || s.DB == nil { return errors.New("usage kafka DB is required") }
    if owner == "" { return errors.New("outbox lease owner is required") }

    if publishErr == nil {
        return s.markSuccess(ctx, eventID, owner, now)   // 分支 A
    }
    return s.markFailure(ctx, eventID, owner, now, publishErr)  // 分支 B
}
```

### 8.1 分支 A：成功（mysql.go:64-77）

```sql
UPDATE usage_kafka_outbox
SET published_at = ?, last_error = '', lease_owner = NULL, lease_until = NULL
WHERE event_id = ?
  AND published_at IS NULL
  AND lease_owner = ?
  AND lease_until > ?          -- ← 关键：租约必须仍然有效
```

**这个 UPDATE 没有包在事务里**——因为它是单条语句，MySQL 天然原子，不需要额外事务。

`WHERE` 里那两个 owner/租约条件是**所有权复核**：

- `lease_owner = ?`：我认领时写的是自己
- `lease_until > ?`：我现在回来写成功时，租约还没过期

如果 `RowsAffected == 0` → 返回 ErrLeaseLost (model.go:115)。

典型触发场景：

```text
12:00:00  A 认领 E1，lease_until = 12:00:30
12:00:30  A 的 Kafka 请求卡住（TCP 半死），一直不返回
12:00:30+ B 扫到 E1 满足条件（租约到期），重新认领
12:01:00  A 的请求终于超时返回，A 调 MarkPublished
          → UPDATE WHERE lease_owner='A' AND lease_until>now
          → lease_owner 已是 'B'，匹配 0 行
          → ErrLeaseLost
```

**拒绝旧 owner 写回 ≠ 撤回已发到 Kafka 的消息。** A 那条消息已经在 Kafka 里了，B 还会再发一次。整条链路的正确性靠 `event_id` 幂等投影兜底，而不是"避免重复发送"。

### 8.2 分支 B：失败（mysql.go:78-94）

这条路径**需要事务**，因为它要先读 `attempts` 再据此计算退避：

```go
tx, _ := s.DB.BeginTx(ctx, nil)
defer tx.Rollback()

// ① 加锁读当前 attempts（同时复核租约）
SELECT attempts FROM usage_kafka_outbox
WHERE event_id = ? AND published_at IS NULL
  AND lease_owner = ? AND lease_until > ?
FOR UPDATE
```

`sql.ErrNoRows` → `ErrLeaseLost`（我已被顶替）。

```go
// ② 递增 + 设置退避 + 释放租约
UPDATE usage_kafka_outbox
SET attempts = attempts + 1,
    last_error = ?,
    available_at = ?,
    lease_owner = NULL, lease_until = NULL
WHERE event_id = ? AND published_at IS NULL AND lease_owner = ?
```

注意这个 UPDATE **没有再查**`lease_until > now`，看起来不对称，其实是安全的：`SELECT ... FOR UPDATE` 已经持有这行的排他锁，`lease_until` 在本事务内不可能被其他事务修改。

`truncate(publishErr)` 把错误截断到 256 字符（model.go:149），避免异常长错误撑爆 `last_error` 列。

### 8.3 退避怎么算

RetryDelay (model.go:132)

```go
func RetryDelay(base, max time.Duration, attempt int) time.Duration {
    if attempt < 1 { attempt = 1 }
    d := base
    for i := 1; i < attempt && d < max; i++ {
        if d > max/2 { return max }
        d *= 2
    }
    if d > max { return max }
    return d
}
```

调用处传的是 `attempts+1`，`attempts` 是**递增前**的 DB 值：

| 第几次失败 | attempts（DB 里） | 传入 | 结果 |
| --- | --- | --- | --- |
| 1 | 0 | 1 | 1s |
| 2 | 1 | 2 | 2s |
| 3 | 2 | 3 | 4s |
| 4 | 3 | 4 | 8s |
| 5 | 4 | 5 | 16s |
| 6 | 5 | 6 | 32s |
| 7 | 6 | 7 | 60s（封顶，因 32 &gt; 60/2） |

**Relay 这条路径没有**`MaxAttempts`**上限**——`Worker` 的 `Config.MaxAttempts` 是给 Worker.Run (runtime.go:77) 用的，用于触发 DLQ。Relay 会一直退避重试，直到成功或事件被人工处理。**不要把 Worker 的 DLQ 逻辑套到 Relay 上。**

### 8.4 三个时间参数别混

| 参数 | 谁控制 | 默认 |
| --- | --- | --- |
| `interval` | `RunPolling`<br>的 ticker | 1s |
| `available_at` | 事件行，退避结果 | 写入时即创建时间 |
| `lease_until` | 事件行，`Claim`<br>写入 | `now + 30s` |

一句话：

`interval`**决定什么时候扫，**`available_at`**决定这条能不能被扫到，**`lease_until`**决定这条现在归谁。**

---

## 9. 把 E1 的正常与故障过程串起来

### 9.1 正常路径

```text
① 终态事务提交，usage_kafka_outbox 出现 E1
   published_at=NULL, lease_owner=NULL, attempts=0, available_at=T0
② RunPolling → RunOnce → Claim
   SELECT 命中 E1，加行锁，UPDATE 写 lease_owner=A, lease_until=T0+30s，Commit
③ KafkaWriter.Publish(E1) → broker 接收
④ MarkPublished(publishErr=nil)
   UPDATE 复核 lease_owner=A 且 lease_until>now → published_at=T1
⑤ 后续 SELECT：published_at IS NOT NULL → E1 永久排除
⑥ observe 收到 PollResult{Published:1, Err:nil}，打日志
```

### 9.2 故障位置矩阵

| 崩溃/失败位置 | 留下的行状态 | 后续处理 |
| --- | --- | --- |
| Claim 事务内崩溃 | 未提交，全部回滚 | 下一轮可再次认领 |
| Claim 已提交、Publish 前崩溃 | `published_at=NULL, lease_owner=A, lease_until=T+30s` | 30s 后租约失效，B 认领 |
| Publish 返回错误、`MarkPublished`<br>写失败成功 | `attempts+1`<br>, `last_error`<br>, `available_at`<br>延后，`lease_owner=NULL` | 退避到期后重新认领 |
| Publish 成功、`MarkPublished`<br>崩溃 | 仍是 `published_at=NULL`<br>，租约有效 | 租约到期后可能重复发送 |
| `MarkPublished`<br>成功但进程崩溃 | `published_at`<br>有值 | 永不再选中 |
| 租约过期后旧 owner 才回来写成功 | UPDATE 匹配 0 行 → `ErrLeaseLost` | 旧 owner 结果被丢弃，已由新 owner 接管 |

### 9.3 为什么必须先发 Kafka 再标成功

```text
方案一（先标后发）：MarkPublished 成功 → 崩溃 → 消息从未发出
  → 数据库认为已完成，永远不再重试 → 事件丢失

方案二（先发后标，当前实现）：Publish 成功 → 崩溃 → 未标
  → 租约到期后重复发送 → 下游按 event_id 幂等
```

选方案二，代价是**可能重复**，收益是**不丢**。所以整条链路的语义是 **at-least-once + 下游幂等**，**不能称为 exactly-once**。

### 9.4 与 Reservation Reconciler 的边界

必须区分两条独立的恢复路径：

| 组件 | 恢复什么 | 依据 |
| --- | --- | --- |
| `usage-kafka-relay` | 已在 `usage_kafka_outbox`<br>、未完成发布的事件 | Outbox 行 |
| `Reconciler.Reconcile` | 尚未达到终态的 Reservation | `quota_reservations`<br>过期行 |

**如果终态事务根本没提交，**`usage_kafka_outbox`**里就没有这条事件，Relay 无法凭空补出它。** 这是终态事务专题 讲的"MySQL 事务边界"的直接后果：Relay 的输入集合只可能是已经成功提交的终态集合的子集。

---

## 10. 测试怎么读

只需 CPU 内存，不用起 MySQL/Kafka：

```powershell
Set-Location 'C:\Users\17hwliao\Desktop\Go-Agent-Projects\01-AgentMesh'
go test -count=1 -v ./internal/usagekafka -run 'TestRunPolling|TestRelayPublishFailureUsesBackoffThenPublishes|TestRelayLeasePreventsConcurrentClaimAndRecoversAfterExpiry|TestMySQLPendingAndPublishFailureUseOutboxBackoff|TestMySQLMarkPublishedRejectsStaleRelay'
```

| 测试文件 | 验证的是代码合同 |
| --- | --- |
| poller\_test.go | 启动即执行、失败后继续、ctx 取消返回 nil |
| runtime\_test.go | 用内存 Store/Publisher + 可控 `Now`<br>，证明退避到期前不发布、租约到期后可被新 owner 接管 |
| mysql\_test.go | SQL mock 核对 SELECT 条件、UPDATE 字段、事务边界、`ErrLeaseLost`<br>分支 |

**关键：这些是 unit test，不是端到端验收。**

它们**不证明**：

- 真实 MySQL InnoDB 下 `FOR UPDATE SKIP LOCKED` 的并发竞争效果
- 真实 Kafka broker 宕机/网络分区时的实际重投延迟
- Kafka 已接收但 ack 丢失时的重复率
- 大批量（limit=10000）下 Claim 事务的行锁开销

`runtime_test.go` 能测退避和租约，靠的是 `Relay.Now` 可注入（第 5.1 节）——注入假时钟把 30 秒压成 0，这是这套代码可测试性的核心设计。

---

## 11. 可靠投递的五个关键问题

不看代码，能答下面五题就算完成：

1. **哪个函数把**`RunOnce`**变成常驻服务？** → `RunPolling`：ticker 循环 + context 退出，且**先执行再等待**，一轮失败只打日志继续。
2. **行锁和租约分别保护哪个阶段？** → 行锁保护 Claim 事务内"选中+写 owner"；租约保护事务提交后到 Publish 完成之间的占用。行锁随事务释放，租约靠两列维持。
3. **Kafka 失败后哪几个字段变化？** → `attempts+1`、`last_error` 写入截断错误、`available_at = now + RetryDelay(1s, 60s, attempts+1)`、`lease_owner=NULL`、`lease_until=NULL`。`published_at`**仍为 NULL**，所以这条永远不退出候选集。
4. **Publish 成功、MarkPublished 前崩溃，为什么会重复？** → Kafka 已收到但 `published_at` 未写，30s 后租约失效，别的 Relay 重新认领并再发一次。**这就是设计意图**：宁可重复，不可丢失。
5. **为什么 Relay 能恢复未发布事件，却不能修复没提交的 Reservation？** → Relay 的输入是 `usage_kafka_outbox` 行。终态事务未提交则该行不存在，Relay 无输入可扫。补这个缺口的是 `Reconciler`，两者输入集合不同。

---

## 12. 投递链路小结

AgentMesh 的用量 Relay 是独立常驻进程。`main` 建立 SIGTERM/中断的取消边界，`run` 读环境变量组装 `MySQLStore` 和 `KafkaWriter`，交给 `RunPolling` 按间隔反复调用 `RunOnce`——启动即扫，一轮失败只打日志继续，收到取消信号才返回 nil 退出。

每轮 `RunOnce` 先在 MySQL 事务内用 `FOR UPDATE SKIP LOCKED` 认领一批未发布、退避已到期、无有效租约的事件，把 `lease_owner` 和 `lease_until` 写进去并提交，行锁随即释放；然后**在事务之外**逐条发 Kafka，发送结果一律回写。

成功路径用单条 UPDATE 复核 owner 和租约仍然有效，通过后写 `published_at` 并清空租约；`RowsAffected==0` 时返回 `ErrLeaseLost`，拒绝覆盖已被接管的行。失败路径在事务里加锁读 `attempts`，递增后按 `RetryDelay(1s, 60s, attempts+1)` 设置指数退避的 `available_at` 并释放租约，事件等到退避到期才重新可认领。

Kafka 发送在网络层，事务锁之外，所以 Relay 崩溃后未发布事件靠租约到期被其他实例接管。如果 Kafka 已接收但 `MarkPublished` 前崩溃，会重复投递——**这是刻意选择**：靠下游按 `event_id` 幂等投影承接，整条链路是 at-least-once 语义。

Relay 只处理 `usage_kafka_outbox` 里已经存在的事件。终态事务没提交就没有这条事件，那是 `Reconciler` 的范畴，两者输入集合不同。

核心调用链：

```text
run → RunPolling → RunOnce → Claim → Publish → MarkPublished
   组装      常驻循环    一轮      认领       发送      回写
```

---

上一篇：[AgentMesh：终态持久化与跨存储恢复](/blog/agentmesh-terminal-state-recovery)

下一篇：[AgentMesh：项目介绍与一致性追问](/blog/agentmesh-project-interview)
