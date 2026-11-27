[AgentMesh 项目展示](/projects/agentmesh#project-articles) · [系列目录](/blog/lake-282376218) · 1 / 12

<details>
<summary>展开系列目录（12 篇）</summary>

1. [AgentMesh：模型网关架构与用量闭环](/blog/lake-282376218)
2. [AgentMesh：模型调用与用量处理的整体链路](/blog/agentmesh-call-usage-flow)
3. [AgentMesh：聊天请求的认证、路由与流式响应](/blog/agentmesh-chat-auth-routing)
4. [AgentMesh：Outbox 投递与 Kafka 故障恢复](/blog/agentmesh-outbox-kafka-recovery)
5. [AgentMesh：服务启动与依赖组装](/blog/agentmesh-startup-assembly)
6. [AgentMesh：handleChat 请求处理与响应收口](/blog/agentmesh-handle-chat)
7. [AgentMesh：租户路由与配额预扣边界](/blog/agentmesh-tenant-quota-reservation)
8. [AgentMesh：Provider 调用、Attempt Hook 与取消传播](/blog/agentmesh-provider-stream-cancellation)
9. [AgentMesh：Complete 结算分支与幂等控制](/blog/agentmesh-settlement-idempotency)
10. [AgentMesh：终态持久化与跨存储恢复](/blog/agentmesh-terminal-state-recovery)
11. [AgentMesh：双 Outbox、异步落账与 Kafka 可靠投递](/blog/agentmesh-dual-outbox-delivery)
12. [AgentMesh：项目介绍与一致性追问](/blog/agentmesh-project-interview)

</details>

统一模型接入、租户路由和流式响应构成同步主链；Reservation、Outbox 与 Kafka 连接用量处理。本文整理项目的整体职责及其与 SQL Sentinel 的协作边界。

> 实现说明与运行记录基于 2026-09-11 更新的原稿。正文中的文件行号、实现状态与验证结果按该历史快照理解。

## 实现概览

- 模型网关将客户端请求统一到租户、路由和 Provider 接口。
- 用量预留、结算与异步投影属于不同阶段，不能混为一次跨存储事务。
- Embedding 是统一向量化入口，SQL Sentinel 仍负责自己的检索与验证流程。

## 实现细节
## 1.实现模型的基础设施

```text
Client → API key/tenant → Router → Provider/SSE → trace
```

`Router` : 根据 tenant(独立客户空间) 可用模型、路由策略和 Provider 健康状态，决定调用哪个 Provider( 真正帮你调用大模型的“供应商/适配器")，例如 Mock、Ollama 或 Ark。

`fallback` :    备用 Provider,  主 Provider 在“还没有向用户输出内容前”失败，系统自动换备用 Provider，提升可用性。

## 2.实现配额,账本 和 kafka

```text
Router → Reservation → MySQL outbox → Kafka → projection
```

`Reservation`: 在真正调用模型前，先预留 tenant 的配额。调用结束后进入 `settled`、`cancelled`终态

`MySQL outbox`:  Reservation 进入终态时，终态记录、`usage ledger`( `usage ledger = 用量账本`) 和 `Kafka outbox`( `Kafka outbox = 准备发送到 Kafka 的待发事件表` ) 在同一个 MySQL 事务里写入

```text
Mysql中设置一条待发送记录,下游的kafka实现信息的消费之后,使用独立的relay程序(防止使用kafka长时间验证影响用户体验) :
MySQL usage_kafka_outbox
        ↓
relay 定时扫描 pending 记录
        ↓
发送到 Kafka topic
        ↓
Kafka 确认收到
        ↓
MySQL 标记该 outbox 为 published
```

## 3.向量化统一网关

```text
Client → /v1/embeddings → embedding provider → OpenAI-compatible(兼容) response
```

为了 `RAG` 提供"文本变向量"的统一的 入口 , 通过客户端实现请求 到 /v1/embeddings 实现先通过 API Key + tenant (个体的独立用户) 实现双重控制 ,然后再选择 embedding provider实现向量化控制 ;

```text
SQL Sentinel 文档切片
  → 调 AgentMesh /v1/embeddings
  → AgentMesh 认证 API key、确认 tenant (embedding 同样消耗模型资源，也可能泄露数据)
  → 根据路由选择 embedding provider
  → 得到向量
  → SQL Sentinel 写入 vector store
用户提问
  → SQL Sentinel 将问题调 AgentMesh 转向量
  → vector store 搜索相近 chunk
  → 返回 citation + untrusted context
```

```text
{
  "data": [
    {
      "index": 0,
      "embedding": [0.12, -0.08]
    }
  ]
}
data：允许一次请求对多段文本批量生成向量；
index：对应输入文本的原始顺序；
embedding：最终向量；
model：可选地标明本次使用的 embedding 模型。
```

---

下一篇：[AgentMesh：模型调用与用量处理的整体链路](/blog/agentmesh-call-usage-flow)
