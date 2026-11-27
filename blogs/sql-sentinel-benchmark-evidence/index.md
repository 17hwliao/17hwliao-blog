[SQL Sentinel 项目展示](/projects/sql-sentinel#project-articles) · [系列目录](/blog/lake-282383607) · 6 / 6

把输入准入、候选计划、诊断报告与独立 bench 串联起来，解释什么只能支持进一步验证，什么才能支持性能收益结论。

> 实现说明与运行记录基于 2026-10-14 更新的原稿。正文中的文件行号、实现状态与验证结果按该历史快照理解。

## 实现概览

- pipeline.Run 形成计划与诊断证据，不自动证明实际耗时改善。
- bench 需要明确版本、数据、查询、参数、预热与重复采样。
- 性能结论保留等价性、噪声和证据准入条件。

## 实现细节
前面的文章分别介绍输入准入、候选计划、模型提案与异步任务。这一部分将它们连接到性能验证，集中回答一个核心问题：

“你说这个 SQL 优化了，怎么证明？不会只是模型说好、EXPLAIN 看起来好吧？”

这一部分说明系统如何从源码层面区分“值得尝试的建议”和“有测量依据的收益”。

下面依据原稿更新时的源码与调用关系展开。

---

## 一、用固定查询串联优化验证过程

当前测量代码中，固定的查询是：

```text
SELECT id, amount_cents, created_at
FROM orders
WHERE user_id = ?
  AND status = ?
  AND created_at >= ?
ORDER BY created_at DESC
LIMIT 20
```

对应源码：`internal/measure/runner.go`。

通俗地说：

找某个用户近期已支付的订单，按照创建时间倒序，取最近 20 条。

一种值得验证的索引方案是：

```text
(user_id, status, created_at)
```

为什么值得尝试？

`user_id` 和 `status` 是等值过滤条件，`created_at` 同时参与范围过滤和排序。这个组合有机会减少扫描和额外排序。

但注意措辞是“有机会”。

实际效果还受数据分布、过滤比例、回表成本、缓存状态和优化器选择影响。因此，系统需要完成三个不同层次的判断：

| 层次 | 回答的问题 |
| --- | --- |
| 候选建议 | 这个方案是否值得尝试？ |
| 执行计划分析 | 数据库准备怎样执行，计划发生了什么变化？ |
| 实际测量 | 在明确的实验条件下，它究竟有没有更快？ |

**三个问题不能用同一份证据代替。**

---

## 二、第一条链：`pipeline.Run` 到底证明了什么？

阅读：`internal/pipeline/pipeline.go`。

它目前串起来的是：

```text
SQL Admit
→ Candidate EXPLAIN
→ Plan Compare
→ Diagnosis
→ Pipeline Report
```

把它理解成一次检查流程。

### 1. SQL Admit：先判断能不能进入检查

先检查 SQL 是否属于当前允许处理的范围。

如果不通过，系统保存准入结果，记录停止阶段，不再执行后面的数据库分析。

这里体现一个你需要掌握的模式：

拒绝不只是返回一个错误，还要留下“在哪里停止、为什么停止”的证据。

### 2. Candidate EXPLAIN：观察候选方案下的计划

通过注入的 `RunExplain`，进入前面 S2 学过的 Shadow Gate。

在满足相应门禁后，获取 baseline 与 candidate 的执行计划证据。

它关心的是：

原方案怎么执行？候选方案怎么执行？

例如索引选择、访问方式、估计扫描量、排序相关信息是否发生变化。

### 3. Plan Compare：把两份计划变成可比较的信息

不是让模型随意阅读两份 JSON 后说“我觉得更好”。

代码通过 `plancompare.BuildReport` 生成结构化比较报告。

这样后续诊断依赖的是明确的计划信号，而不是只有一段自然语言评价。

### 4. Diagnosis：形成需要继续验证的假设

例如：

候选索引可能减少扫描或排序，因此值得继续测量。

“诊断假设”的意思是解释观察结果，提出下一步验证方向，不是提前宣布收益。

### 5. Pipeline Report：记录这次具体做了什么

你主要看这些字段：

```text
completed_steps
stopped_step
rejection_reasons
artifacts
evidence_level
eligible_for_performance_claim
```

当前管线报告初始化为：

```text
evidence_level = L1
eligible_for_performance_claim = false
```

即使四个阶段都完成，也不会自动变成性能收益结论。

为什么？

因为这条函数链没有运行实际 benchmark。

还有一个容易看错的字段：`step_durations_ms`。

它记录的是各阶段的编排耗时，例如 EXPLAIN 阶段花了多久。**不是目标 SQL 的 benchmark 延迟，更不能拿它计算索引收益。**

面试可以这样回答：

我的 pipeline 先完成准入、计划比较和诊断，输出可追溯的 L1 分析证据。实际性能通过独立测量入口验证，避免把计划变化直接当作性能提升。

---

## 三、第二条链：真正测量从 `runBench` 开始

阅读：`cmd/sentinel/bench.go`。

调用顺序可以记成：

```text
runBench
→ 打开 baseline/candidate
→ 校验版本、数据快照、候选索引
→ 创建测量 Session
→ 预热
→ 标定
→ 正式测量
→ buildResult
→ 输出报告
```

这里先记一个当前实现事实：

这个 bench 使用固定的 QueryCase 和约定的候选索引，不是自动测量任意模型生成的 CandidateSpec。

这样你就不会把 S3 的候选生成与 bench 说成已经自动连接的优化循环。

### 1. 为什么先检查版本和数据？

假设：

```text
baseline：100 万行
candidate：10 万行
```

candidate 更快，完全可能只是数据更少。

再假设两侧 MySQL 版本不同，优化器行为也可能不同。即使测到了差异，也不容易归因到索引。

因此代码先检查：

```text
两侧 MySQL 版本一致
两侧数据快照一致
candidate 存在目标候选索引
```

这些门禁是为了控制明显的混杂因素，不代表已经控制了所有环境影响。

通俗理解：

想证明换鞋跑得更快，至少不能让一个人在平地跑，另一个人在上坡跑。

### 2. 为什么查询和参数要固定？

两侧必须运行同一个查询和同一组参数。

否则：

```text
baseline 查热门用户
candidate 查几乎没有订单的用户
```

差异可能来自查询对象，而不是索引。

当前 `DefaultCase` 固定 SQL 与绑定参数，就是为了让实验对象可复现。

### 3. 为什么要预热？

第一次执行可能包含冷缓存和首次执行等额外开销。

当前代码先执行若干轮预热，丢弃这些结果，再进行后续采样。

这意味着你测的是预热后的查询表现，不应该直接把结果描述为冷启动性能。

### 4. 为什么交替测两侧？

代码采用：

```text
baseline → candidate → baseline → candidate
```

而不是先测完所有 baseline，再测所有 candidate。

因为后台负载、缓存、机器状态会随时间变化。交替采样让两侧尽量经历相近的时间窗口，减少时间漂移偏向某一侧。

但是不要说它“彻底消除了环境噪声”。

更准确的说法是：

通过交替采样降低时间漂移影响，再用标定噪声判断这次实验是否适合下结论。

---

## 四、为什么必须把结果集读完？

继续看 `internal/measure/runner.go` 中的：

```text
Session.Once
→ executeRound
→ execOnce
```

`execOnce` 不只是调用 `QueryContext`。

它还会：

```text
遍历 rows
→ Scan
→ 读到结束
→ 检查 rows.Err()
→ 关闭结果集
```

为什么如此较真？

因为发出查询并获得 `rows`，不代表结果已经完整获取。

如果只测到开始返回响应的时刻，就遗漏了后续读取和处理结果的时间，测量边界与真实查询使用方式不一致。

你可以这样回答：

我把一次测量定义为完整执行并消费结果集，包含遍历、Scan 和错误检查，避免只测到查询开始响应的时间。

这里测到的是程序侧这一完整操作的耗时，**不是纯粹的数据库内部执行时间**。

这个区别讲清楚，面试官通常会觉得你真正理解了测量代码。

---

## 五、测到 candidate 更快，为什么还不能立即宣布成功？

这是收益判定的核心边界。

源码把判断分成两步：

```text
Decide：差异方向是否超过项目设定的噪声门槛？
Admit：这次实验是否有资格支持收益结论？
```

分别阅读：

- `internal/measure/verdict.go`
- `internal/measure/admission.go`

### 1. `Decide`：比较中位数和噪声门槛

当前方向判定采用：

```text
相对变化 = (candidate 中位数 - baseline 中位数)
           / baseline 中位数

判定门槛 = 2 × 两侧较大的标定噪声比
```

假设：

```text
baseline 中位数：100 ms
candidate 中位数：96 ms
两侧较大噪声比：3%
```

candidate 看起来快了 4%，但门槛是 6%。

所以结论是：

```text
NotSignificant
```

不是“肯定没收益”，而是：

按项目当前的判定规则，这个差异还不足以和测量波动区分开。

如果 candidate 是 80 ms，差异为 20%，严格超过 6% 门槛，方向判定才是 `Better`。

等于门槛也不算通过。

这里是项目定义的工程判定规则，不要说成已经做了带置信水平的统计假设检验。

### 2. `Admit`：还要检查实验噪声是否合格

当前代码要求两侧标定噪声比都不超过 10%。

如果某侧噪声很大，即使方向判定为 Better，也不允许直接宣称收益。

例如：

```text
baseline 中位数：100 ms
candidate 中位数：60 ms
较大标定噪声比：15%
```

40% 的改善超过 30% 的方向门槛，可以得到 Better。

但噪声比超过 10% 准入线，因此：

```text
direction_verdict = Better
eligible_for_performance_claim = false
```

两个字段为什么必须分开？

因为它们回答不同问题：

Better：按当前样本和规则，方向是什么？  
Eligible：实验条件和结果是否满足项目的收益准入要求？

### 3. 什么时候进入 L2？

当前准入逻辑要求：

```text
有正式测量
＋ 两侧标定噪声合格
＋ 方向为 Better
```

全部满足才会得到：

```text
evidence_level = L2
eligible_for_performance_claim = true
```

这个 L2 是基准实验条件下的证据，不会自动升级成线上实际收益。

另外，只有标定、没有正式测量时，方向判定是空值，不是 NotSignificant。

因为：

“没有测”和“测了但不明显”，是两种不同状态。

---

## 六、把 S1—S4 放回正确的位置

按照验证责任，项目可以分为四个部分：

| 部分 | 主要职责 | 不能替代什么 |
| --- | --- | --- |
| 模型候选、RAG | 提供建议和参考知识 | 不能代替实测 |
| Shadow、EXPLAIN、诊断 | 验证约束、观察计划、形成假设 | 不能直接证明延迟收益 |
| Bench、判定、准入 | 在固定条件下测量并形成结论 | 不能自动证明线上收益 |
| Job、Outbox、Kafka | 可靠递交和管理验证任务 | 不能证明候选本身有效 |

尤其要回答这两个问题：

**“Job 是 COMPLETED，说明优化成功了吗？”**

不一定。

COMPLETED 表示 Runner 按其成功合同完成了任务。是否有性能收益，还要看验证报告。

**“RAG 找到了支持索引设计的文档，说明索引有效了吗？”**

也不一定。

资料能支持“为什么值得尝试”，实际收益仍然由对应实验决定。

所以，你项目里其实有两种独立的成功：

执行成功：该做的流程完成了。  
优化成功：证据支持这个方案在明确条件下有收益。

面试时能区分这两个概念，你对项目的介绍就不会停留在“调用了哪些技术”。

---

## 七、优化验证链路的核对要点

下面列出收益判定涉及的主要入口与核对问题。

| 实现入口 | 核对问题 |
| --- | --- |
| `pipeline.Run`<br>、`Report` | 四个阶段完成后，报告到底证明什么？ |
| `runBench`<br>、`buildResult` | 实验如何保证两侧尽量可比？ |
| `Session.Once`<br>、`execOnce` | 一次测量从哪里开始，到哪里结束？ |
| `Decide`<br>、`Admit` | Better 为什么可能不能宣称收益？ |
| 验证链路小结 | 串起“建议 → 计划 → 测量 → 结论” |

可以运行这些针对性单测，不需要启动 MySQL/Kafka：

```text
Set-Location 'C:\Users\17hwliao\Desktop\Go-Agent-Projects\02-SQL-Sentinel'

go test -count=1 -v ./internal/measure -run 'TestThresholdIsTwiceMaxOfBothSidesNotGlobalFloor|TestDeltaExactlyAtThresholdIsNotSignificant|TestAdmit_CandidateNoiseExceeds_BetterDirection|TestAdmit_AllPass_Better_IsEligible|TestAdmit_NoMeasurement_NoDirectionVerdict'
```

原稿这一部分仅核对源码，没有重新执行所列测试；测试命令在此保留为复现入口，不作为本次整理新增的验证结果。

验证结论可以归纳为三条：

1. EXPLAIN 变化 → 为什么仍是分析证据 → `pipeline.Run`。
2. 中位数下降但差异不够 → 为什么是 NotSignificant → `Decide`。
3. 方向 Better 但噪声超标 → 为什么不允许声称收益 → `Admit`。

### 最后的面试口述版本

SQL Sentinel 把候选建议、计划分析和性能验证分开。模型负责提出受约束的候选，Shadow 和 EXPLAIN 管线输出计划比较与诊断证据；实际性能由独立 bench 验证。测量前检查两侧版本、数据快照和候选索引，使用固定查询与参数，预热后交替采样，并完整消费结果集。最终根据中位数变化和标定噪声做方向判定，再单独检查收益准入条件，避免把计划变化或偶然波动包装成优化成果。

项目说明应围绕建议、计划、测量与结论组织，并为每个结论保留可定位的函数或报告依据。

---

上一篇：[SQL Sentinel：异步 Job、Outbox 与 Kafka 任务链路](/blog/sql-sentinel-async-job-outbox)
