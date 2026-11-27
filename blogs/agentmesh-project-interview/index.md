[AgentMesh 项目展示](/projects/agentmesh#project-articles) · [系列目录](/blog/lake-282376218) · 12 / 12

用问答形式串联模型网关的核心链路，并回答 Redis 成功而 MySQL 失败时的一致性追问，便于从实现事实组织项目表达。

> 实现说明与运行记录基于 2026-10-06 更新的原稿。正文中的文件行号、实现状态与验证结果按该历史快照理解。

## 实现概览

- 项目介绍以统一模型接入、租户控制与流式用量处理为主线。
- 回答需要区分同步返回、配额结算与 Kafka 异步处理。
- 故障恢复以持久化状态、attempt 证据与幂等操作为依据，同时保留原稿提出的未解决窗口。

## 实现细节
## 第一问：AgentMesh 的项目定位与端到端请求链路

**答** : AgentMesh 是我用 Go 实现的多租户大模型网关，主要解决多模型服务的统一接入，以及多租户场景下的访问控制、流式响应和用量管理问题。

我实现的核心部分包括 API Key 认证、租户模型路由、SSE 流式转发、首块前 fallback、以及 Redis 配额预留、MySQL 持久化和 Kafka 异步用量处理。

从一次聊天请求来看，客户端先携带 API Key 请求网关。网关认证后确定可信的 tenant，再通过 Redis Lua 原子执行租户级 Token Bucket 限流。通过后，校验请求并根据 tenant 和 model 选择 Provider。

在真正调用模型之前，系统先在 MySQL 创建 Reservation，再通过 Redis 原子预留配额，并将预留成功的状态写回 MySQL。每次调用 Provider 前，还会持久化 attempt，留下执行证据。

Provider 返回的内容由网关逐块转换成 SSE 并发送给客户端。如果 primary 在首块前失败，可以切换 fallback；首块后不再切换，避免混合两个模型的回答。客户端断开时，取消信号也会传播给 Provider，请求过程会记录 trace。

生成结束后，系统先在 Redis 完成配额结算，再在同一个 MySQL 事务中更新 Reservation 终态并写入用量 Outbox。独立 Relay 将事件投递到 Kafka，Worker 消费后幂等生成 MySQL 用量投影。

所以，Redis 负责限流和配额的原子操作，MySQL 保存持久化状态与事件证据，Kafka 负责异步传递用量事件。聊天响应不需要等待 Kafka 发布和消费完成。

## 第二问 :  Redis 和 MySQL 并不在同一个事务里。假设 Redis 已经结算成功，但随后 MySQL 写入失败，甚至进程直接崩溃，你的系统怎么办？

**答** :

先区分两层保证：MySQL 的终态事务把 Reservation 状态、用量快照与 Kafka Outbox 一起提交，但它不包含 Redis。Redis 已经成功结算、MySQL 随后失败时，Redis 不会随 MySQL 回滚，因此确实存在跨存储不一致窗口。

正常请求通过带版本的操作键约束 Redis 幂等，并在 MySQL 中保留状态与 attempt 证据。发生中断后，Reconciler 可以认领过期但未终结的记录：已有 attempt 或已转发内容时走保守结算；没有 attempt 时，先确认 Redis 是否实际预扣，再决定取消退款或仅更新状态。这个恢复入口需要外部显式调用，原稿中的实现没有内置定时调度。

需要主动说明一个已知边界：原稿推演了“Redis 已退回未消耗额度，MySQL 终态提交失败，恢复认领又推进版本”的窗口。新版本对应新的 Redis 幂等键，恢复路径可能无法还原此前的精确结算金额，造成账实不一致；原稿同时说明，现有测试未覆盖这个精确场景。因此，这套实现具有恢复机制，但不能据此宣称已经彻底解决所有跨库失败。

以上补充回答整理自本系列《[终态持久化与跨存储恢复](/blog/agentmesh-terminal-state-recovery)》，没有新增当前源码或运行验证结论。

---

上一篇：[AgentMesh：双 Outbox、异步落账与 Kafka 可靠投递](/blog/agentmesh-dual-outbox-delivery)
