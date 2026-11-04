[AgentMesh 项目展示](/projects/agentmesh#project-articles) · [系列目录](/blog/lake-282376218) · 10 / 12

围绕 MySQL 终态事务、版本条件与双 Outbox，分析 Redis 已完成操作但持久化失败时的恢复路径。

> 实现说明与运行记录基于 2026-09-30 更新的原稿。正文中的文件行号、实现状态与验证结果按该历史快照理解。

## 实现概览

- MySQL 事务保护终态与 Outbox 的原子提交，不覆盖 Redis。
- 版本检查防止错误状态迁移，但需要结合实际失败时点理解。
- Reconciler 根据保留的执行证据推进补偿，而非盲目退款。

## 实现细节
**Complete() 的执行流程（以预留 100 单位、初始余额 200 为例）**

1. **谁调用它**

```go
reservationSession.Complete(
    request.Context(),
    streamErrorCode(err),   // 转换后的错误码
    errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded),
)
```

1. **进入 Complete()** (`coordinator.go:181`)

1. **settlement() 决定消耗量** (`coordinator.go:226-245`)

| 证据情况 | consumed | released | 最终 Redis 余额 |
| --- | --- | --- | --- |
| 零 attempt | 0 (走 Cancel) | 100 | 200 |
| 单次 attempt 有 usage 35 | 35 | 65 | 165 |
| 两次 attempt usage 合计 50 | 50 | 50 | 150 |
| 任意 attempt 缺 usage（Ark/Ollama/mock 实际走这条） | 100 | 0 | 100 |
| 最后一次 flush 失败 → persistenceUncertain=true | 100 | 0 | 100 |

1. **Redis 结算** (`coordinator.go:202`, `redis.go:226-235`)

```lua
released = reserved - consumed          -- 要退还的额度
available = INCRBY balance released   -- 把额度加回租户余额
```

1. **MySQL 终态 + 双 outbox**（仅在 Redis 结算成功后执行）

1. **客户端断开或跨存储失败的边界**

1. **对应的单元测试**（`coordinator_test.go`）

**一句话总结**：  
`Complete()` 先看是否曾启动过 Provider attempt；未启动就取消并全额退回，已启动则根据每次 attempt 的 Provider usage 结算。证据缺失或进度持久化不可靠时保守占用预留额度。Redis Lua 用操作结果键防止同一结算重试时重复退款，MySQL 随后写入终态；跨存储窗口需靠 Reconciler 手动补偿。

## 终态事务与恢复

## 1. `Complete()` 的两条路径（代码直接对应）

```go
// coordinator.go:181
func (s *coordinatorSession) Complete(ctx context.Context, _ string, _ bool) error
```

| 条件 | Redis 操作 | MySQL 操作 | 资金流向（例：预留 100，余额 200→100） |
| --- | --- | --- | --- |
| `len(s.attempts) == 0` | `Cancel(100)`<br>→ INCRBY 100 | `MarkCancelled()`<br>→ state=cancelled | 余额 100 → **200**（全退） |
| `len(s.attempts) > 0` | `Settle(100, consumed)`<br>→ INCRBY (100−consumed) | `MarkSettled()`<br>→ state=settled | 余额 100 → **100+(100−consumed)** |

关键点：**后两个参数**`_ string, _ bool`**当前完全不参与金额计算**，只看内存里的 attempt/usage 证据。

---

## 2. MySQL 终态事务到底原子保护了什么

### 2.1 `MarkSettled()` 完整流程（persistence.go:313-338）

```go
func (r *SQLRepository) MarkSettled(...) (PersistentReservation, error) {
    tx, _ := r.db.BeginTx(ctx, nil)
    defer tx.Rollback()

    // ① 终态 CAS 更新
    result, _ := tx.ExecContext(ctx, markSettledSQL, 
        settledUnits, releasedUnits, usageObserved, kind, now, now,
        reservationID, tenantID, expectedVersion)   // persistence.go:613
    if exactlyOne(result) != nil { return err }     // 恰好 1 行，否则 VersionConflict

    // ② 同事务插 usage_outbox（快照当前行）
    r.insertUsageOutbox(ctx, tx, tenantID, reservationID, expectedVersion)

    // ③ 同事务插 usage_kafka_outbox（event_id = SHA2(reservation:version)）
    // persistence.go:350-354

    // ④ 读回最新行 + Commit
    value, _ := scanReservation(tx.QueryRowContext(ctx, reservationByIDSQL, ...))
    tx.Commit()
    return value, nil
}
```

### 2.2 两条终态 SQL 的关键 WHERE 条件（persistence.go:613, 618）

```sql
-- MarkSettled：要求 attempt 行存在
UPDATE quota_reservations ...
WHERE version = ? AND state IN ('reserved','expired_pending')
  AND EXISTS (SELECT 1 FROM provider_attempts WHERE reservation_id = ?)

-- MarkCancelled：要求 attempt 行 NOT 存在
UPDATE quota_reservations ...
WHERE version = ? AND state IN ('creating','reserved','expired_pending')
  AND NOT EXISTS (SELECT 1 FROM provider_attempts WHERE reservation_id = ?)
```

**硬约束**：

调用过 Provider（有 attempt 行）**不能**走 Cancel 全退；

没调用过 Provider（无 attempt 行）**不能**走 Settle。这不只是业务约定，是数据库层面的 CHECK。

### 2.3 同事务双 Outbox

| 表 | 作用 | 幂等键 |
| --- | --- | --- |
| `usage_outbox` | 终态快照，供 DrainUsageOutbox 投影成 `usage_records` | 无（由 reservation\_id + operation\_version 唯一） |
| `usage_kafka_outbox` | 发给 Kafka 的事件 | `event_id = SHA2(reservation_id:operation_version)` |

**任何一条 Outbox 插入失败 → 整个事务回滚，终态也不提交。**

---

## 3. 跨存储边界：Redis 与 MySQL 不是同一事务

```text
时间轴
─────────────────────────────────────────────────────►
Redis Settle 成功 (INCRBY 65, 余额 165)
       │
       ▼
MySQL MarkSettled 事务开始
       │
       ├─ 成功 → Commit，终态落库，Outbox 入库 ✅
       │
       └─ 失败/超时 → Rollback，**Redis 已退 65 不自动回滚** ❌
```

- Redis 幂等键 = `operation:{tenant}:{res}:{version}:settle`
- MySQL 终态成功后 version +1
- **若中间失败，Redis 已退款、MySQL 仍非终态** → 跨存储不一致窗口

---

## 4. Reconciler 如何补偿（coordinator.go:279-325）

```go
func (r *Reconciler) Reconcile(ctx, before, limit) (int, error) {
    candidates, _ := r.records.ClaimExpired(ctx, before, limit) // FOR UPDATE SKIP LOCKED
    for _, c := range candidates {
        if c.AttemptStarted || c.ForwardedRunes > 0 {
            // 有 attempt 或已转发数据 → 保守全额 Settle
            r.quota.Settle(..., reservedUnits, reservedUnits)  // consumed=reserved, released=0
            r.records.MarkSettled(..., reservedUnits, 0, false, "estimated")
        } else {
            // 无 attempt → 查 Redis 是否真扣了
            applied, _ := r.quota.ReserveApplied(ctx, tenantID, reservationID)
            if applied {
                r.quota.Cancel(..., reservedUnits)   // 退回全额
                r.records.MarkCancelled(...)
            } else {
                r.records.MarkCancelled(...)         // Redis 根本没扣，只标 cancelled
            }
        }
    }
}
```

- **无内置定时器**，需外部显式调用（如 cron 任务）
- `ClaimExpired` 用 `FOR UPDATE SKIP LOCKED` 保证并发唯一认领
- **不修复**“Redis 已退 65、MySQL 终态失败、version 已推进”的窗口（见下）

---

## 5. 三个数字场景完整走一遍（原余额 200、预留 100）

| 场景 | Redis 余额 | MySQL 终态 | Outbox | 说明 |
| --- | --- | --- | --- | --- |
| **正常**&lt;br&gt;Settle 35，MarkSettled 成功 | 165 (退 65) | settled, consumed=35, released=65 | 双写入 | 完美终结 |
| **Redis 成、MySQL 败**&lt;br&gt;Settle 35 成功，MarkSettled Commit 前失败 | 165 (已退 65) | 仍 reserved/creating | 无 | **跨库不一致窗口**；需 Reconciler 介入，但 version 已变，幂等键失效，可能再次 Settle(100) → consumed=100, released=0，MySQL 记 100，Redis 仍 165 |
| **零 attempt 中断**&lt;br&gt;Redis 预扣 100 (余额 100)，MySQL 还在 creating | 100 | creating | 无 | 过期后 Reconciler 确认 ReserveApplied=true → Cancel 退 100 → MarkCancelled，最终余额 200 |

---

## 6. 版本变化导致的潜在账实不一致（面试必讲）

```text
原请求 version=2：Settle(100, 35) → Redis 退 65，键 operation:...:2:settle
MySQL MarkSettled 失败
        │
        ▼ 过期，Reconciler ClaimExpired
        更新 state=expired_pending，version 2→3
        │
        ▼ Reconciler 用 version=3 再次 Settle
        Settle(100, 100) → released=0，键 operation:...:3:settle（新键，不命中旧幂等）
        Redis 不再退款，余额仍 165
        MySQL MarkSettled(version=3) 成功 → consumed=100, released=0
结果：Redis 余额 165，MySQL 记录 consumed=100 → **账实不一致 65**
```

现有测试 **未覆盖** 此精确窗口；代码逻辑推演存在该风险，面试时应主动说明“当前实现无法宣称完全修复跨库失败”。

---

## 7. 测试怎么读（只抓四个断言方向）

| 测试文件 | 行号 | 验证点 |
| --- | --- | --- |
| `persistence_test.go` | 110+ | ① 版本冲突 → `CodeVersionConflict`<br>&lt;br&gt;② 正常终态 → 双 Outbox 同事务提交&lt;br&gt;③ Outbox 插入失败 → 事务回滚，终态不提交&lt;br&gt;④ 模拟 Commit 失败 → 不能视为已成功提交 |
| `coordinator_test.go` | 178+ | Reconciler：有 attempt → 保守 Settle；无 attempt 但 ReserveApplied → Cancel 退款 |

---

## 8. 终态事务与恢复机制小结

**MySQL 事务保证“终态 + 双 Outbox”原子提交，不会出现终态已落库而对应事件丢失的情况。**  
**但 Redis 结算与 MySQL 终态没有共同事务；Redis 成功、MySQL 失败会产生跨库不一致窗口。**  
**Reconciler 能处理过期未终结记录，但对“已退款后 version 推进导致幂等键失效”的窗口，当前实现无法保证完全修复，也没有内置定时调度。**

DrainUsageOutbox 在同一事务中读取未投递的 usage\_outbox 行，然后在同一事务里为每条记录插入 usage\_records 并更新 outbox 的 projected\_at，同时向 usage\_kafka\_outbox 写入事件。  
因为所有写入都在同一个事务里，要么全部成功提交，要么全部回滚，保证 Reservation 终态与两条 Outbox 同时提交或全部回滚。  
这样 MySQL 能保证 Reservation 终态与两条 Outbox 一起提交，而 Redis 结算与 MySQL 并非同一事务，恢复时需依赖幂等键和 Reconciler 手动处理。

---

上一篇：[AgentMesh：Complete 结算分支与幂等控制](/blog/agentmesh-settlement-idempotency)

下一篇：[AgentMesh：双 Outbox、异步落账与 Kafka 可靠投递](/blog/agentmesh-dual-outbox-delivery)
