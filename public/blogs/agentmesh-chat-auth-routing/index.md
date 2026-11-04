[AgentMesh 项目展示](/projects/agentmesh#project-articles) · [系列目录](/blog/lake-282376218) · 3 / 12

沿一次聊天请求追踪认证、租户识别、令牌桶限流、模型路由与 SSE 返回，说明首块前 fallback 和取消传播的边界。

> 实现说明与运行记录基于 2026-09-15 更新的原稿。正文中的文件行号、实现状态与验证结果按该历史快照理解。

## 实现概览

- 外部契约、启动入口和实际请求处理分别承担不同职责。
- 认证建立可信租户，路由根据租户与模型选择 Provider。
- 首块后不混合模型回答，断连信号沿调用链传播。

## 实现细节
在整体架构之上，这一部分聚焦 AgentMesh 聊天入口，说明认证、路由、流式输出与取消传播。Reservation、Outbox、Kafka 和 Embedding 在各自的专题中继续展开。

```latex
Client
  → POST /v1/chat/completions
  → API Key 认证，服务端确定 tenant
  → 本地 per-tenant Token Bucket
  → tenant/model 路由
  → primary Provider 的 SSE
  → trace + context 取消传播
  └→ 首块前失败才使用 fallback Provider
```

## 请求主链的关键行为

这条请求链需要明确以下四个行为边界：

1. 为什么认证必须在路由和业务处理之前？
2. 为什么 fallback 只能发生在 SSE 首块发送之前？
3. 为什么客户端取消必须传播到 Provider？
4. trace 记录了什么，它为什么不是 usage ledger？

## 架构关系与职责回顾

架构关系可以拆为以下三条链路：

```latex
AgentMesh：聊天链、用量异步链、Embedding 链
SQL Sentinel：SQL 证据链、RAG 知识旁路、Webhook Kafka 异步链
```

然后口述一句定位：

- AgentMesh 是 **Go 多租户 LLM Gateway**，不是自动规划工具调用的聊天 Agent。
- SQL Sentinel 是 **受控 SQL 诊断 Agent**，不是自动执行 SQL/DDL 的改库工具。

三条链路分别说明同步响应、用量处理与 SQL 验证，不应合并为一条阻塞调用链。

## 聊天主链的运行与证据记录

项目目录：

```latex
C:\Users\17hwliao\Documents\Codex\2026-09-09\new-chat\work\agentmesh-interview-complete
```

运行：

```powershell
Set-Location C:\Users\17hwliao\Documents\Codex\2026-09-09\new-chat\work\agentmesh-interview-complete

.\scripts\demo-stage-1.ps1
go test -count=1 ./internal/gateway/...
```

记录三条事实：

1. primary 在首块前失败时，fallback 成功的 trace 是怎样记录 attempts 的？
2. `trace_query` 返回了哪些字段？
3. cancellation 测试证明了哪一段 context 被取消？

不要记录整段日志，只记录“现象 → 对应机制 → 对应代码/测试”。

已运行成功。三条记录如下：

1. **primary 首块前失败，fallback 成功**

属于 router 包，负责AI模型多提供者的路由与故障降级重试逻辑，不关心HTTP细节，专注模型调用的候选提供者轮转、钩子回调、事件观测，是AgentMesh网关的核心调度模块。

1. 自定义错误

-  ErrNoProvider ：没有配置可用模型提供者

-  ErrProvidersUnavailable ：全部候选提供者都失败，且没有输出任何数据分片

-  ErrStreamInterrupted ：已经向客户端返回部分流数据，此时禁止切换到下一个后端

核心约束：一旦已经发出第一个数据块，就不能再fallback切换其他模型，避免客户端收到混合不同模型的输出，保证流式语义正确性。

2. 接口定义

1. Streamer：基础接口，定义流式对话调用 Stream

2. AttemptHook（同步钩子）：调用生命周期同步回调，用于配额预留这类强可靠业务，会阻塞调用流程。

-  BeforeAttempt ：发起调用前

-  BeforeEmit ：每个分片向外发送前

-  AfterEmit ：每个分片向外发送后

-  FinishAttempt ：单次调用尝试结束

3. HookedStreamer：扩展接口，在 Streamer 之上增加带钩子的调用 StreamWithAttemptHook

4. Observer / NonBlockingObserver：事件观测器，只做日志、监控、指标采集，禁止改变路由逻辑。普通观察者启动goroutine异步执行；标记 NonBlockingObserver 直接在当前协程执行，内部必须保证无阻塞。

3. 数据结构与常量

-  AttemptEvent ：路由生命周期事件，记录提供者名称、事件类型、结果、用量信息，不携带请求报文、原始错误详情，做安全的观测上报。

- 事件常量： AttemptStarted 调用开始、 AttemptFirstChunk 收到首个分片、 AttemptFinished 调用结束。

-  Router 结构体：保存候选提供者数组、观测器实例。

-  New() 、 NewWithObserver() ：构造Router实例。

4. 核心业务函数  StreamWithAttemptHook

1. 如果提供者列表为空，直接返回 ErrNoProvider 。

2. 按顺序遍历候选provider：

1. 检查上下文是否已经取消；执行 BeforeAttempt 钩子。

2. 触发 AttemptStarted 观测事件。

3. 调用provider的 Stream 进行流式请求；在分片回调中：

- 执行 BeforeEmit 钩子；收到第一个分片触发 AttemptFirstChunk 事件，标记 emitted=true 。

- 将分片转发给上层 emit 回调，执行 AfterEmit 钩子。

4. 调用结果分支处理

- 成功：执行结束钩子，上报成功事件，函数返回，不再尝试下一个provider。

- 上下文被取消：上报cancelled事件，返回取消错误。

-  emitted=true （已经输出内容）：上报interrupted，返回 ErrStreamInterrupted ，终止，不做重试。

- 失败但还未输出任何分片：上报 failed\_before\_first\_chunk ，继续循环尝试下一个候选提供者。

3. 全部提供者尝试完毕均失败，返回 ErrProvidersUnavailable 。

4.  hookFailureAfterProgress ：钩子执行失败的统一处理，完成结束钩子后返回原始错误。

5. observe 事件分发

- 观测器为空直接跳过。

- 如果是 NonBlockingObserver ，包装recover捕获panic，当前协程执行Observe。

- 普通Observer：新开goroutine异步执行观测逻辑，加recover防止观测代码panic把整个请求搞崩。

整体功能概括

Router实现有序多模型候选策略：仅在还没有输出任何流分片时，才允许失败重试切换下一个模型后端；一旦有内容流出，就禁止fallback。

同时支持同步生命周期钩子（配额预留）和异步观测器（监控指标），将路由策略和底层provider实现解耦。

结合上一份 main.go ，main会组装Router，作为网关内部模型调度的核心组件。

1. `trace_query`**返回字段**

1. **cancellation 取消的 context**

## 外部契约、启动组装与请求入口

阅读顺序：

1. `specs/001-local-mock-stream-gateway/spec.md`
2. `cmd/api/main.go`
3. `internal/gateway/server.go`

每个文件只回答一个问题：

| 文件 | 要找到的答案 |
| --- | --- |
| `spec.md` | 对 HTTP、SSE、fallback 的外部合同是什么？ |
| `main.go` | Provider、tenant route、trace recorder、handler 在哪里被组装？ |
| `server.go` | 认证、限流、路由、调用 Provider、写 SSE、记录 trace 的先后顺序是什么？ |

输出一张时序图：

```latex
client → gateway → auth/tenant → rate gate → router → primary provider
                                                     ↘ fallback provider
gateway → trace recorder
```

### 1. `spec.md`：外部合同

- HTTP：提供 `POST /v1/chat/completions`；初版只允许回环监听，`/healthz` 可用。
- SSE：每块格式为 `data: {json}\n\n`，成功结束为 `data: [DONE]\n\n`。
- fallback：仅当 primary 在首个 SSE 块前失败，才按 Router 顺序切换；一旦已发送首块，后续失败只返回规范化流错误，绝不切换。
- 取消：请求 Context 必须传给 Provider，客户端取消要终止 mock 流。

### 2. `main.go`：在哪里组装

- Provider：`runtime.Selection` 校验逻辑 Provider 顺序，`runtime.Build` 创建 mock／Ark／Ollama Provider。
- tenant route：`auth.OpenConfiguredRuntime` 创建身份 Store；`tenant.NewResolver(...)` 把 Store、逻辑 Provider 与真实 Provider 组装为租户路由 Resolver。
- trace recorder：`observability.NewRecorder(...)`。
- handler：`gateway.NewWithTenantRoutingAndRecorderAndReservations(...)` 创建 Gateway；再设置 Rate Gate、Embedding Handler；最后用 `AuthenticatedHandler(...)` 套上认证，交给 `http.Server` 启动。

### 3. `server.go`：实际执行顺序

```text
client
  │ POST /v1/chat/completions
  ▼
gateway.AuthenticatedHandler
  │
  ├─ auth.Authenticate：验证 API Key，写入 tenantID 到 request.Context
  ▼
rate gate
  │ 依据 tenantID 限流；拒绝则直接 429
  ▼
handleChat
  │
  ├─ decodeChatRequest：校验 JSON、model、messages、stream=true
  ├─ trace recorder.Start：创建 trace，写 X-AgentMesh-Trace-ID
  ├─ tenant resolver：按 tenant + model 找到 Provider Router
  ├─ quota gate / reservation.Begin：先预留配额
  ▼
router.Stream(request.Context)
  │
  ├─ primary provider
  │    ├─ 首块前失败 → trace attempt=failed_before_first_chunk
  │    └─ 首块成功 → gateway 写 SSE；后续失败不 fallback
  │
  └─ fallback provider（仅 primary 首块前失败）
       └─ 成功 → trace attempt=succeeded
  ▼
gateway
  ├─ reservation.Complete
  ├─ trace recorder.Complete
  └─ 写 data: [DONE]\n\n
```

对应顺序的核心代码是

`cmd/api/main.go`、

`internal/gateway/server.go:124`、

`internal/router/router.go:89`。

## 首块边界与取消传播

阅读：

1. `internal/gateway/auth_test.go`
2. `internal/gateway/providers_test.go`
3. `internal/gateway/context_propagation_test.go`
4. `internal/gateway/trace_test.go`

写出下面两个问题的标准答案：

### 追问 A：为什么首块后不能 fallback？

答案必须含有：HTTP 响应已经提交、SSE 内容已经被客户端消费、切换会导致一条回答混入两个 Provider、无法可靠回滚已发送 token。

### 追问 B：为什么取消要传播给 Provider？

答案必须含有：客户端断开后继续生成会浪费模型配额和连接资源、context 是 Go 的取消边界、trace 需要记录 cancelled 结果。

### 追问 A：为什么首块后不能 fallback？

首块后不能 fallback，因为这时 HTTP 响应已经提交，Gateway 已经写出并 flush 了 SSE 数据，SSE 内容已经被客户端消费。

如果此时从 primary 切换到 fallback，一条回答会混入两个 Provider 的输出：前半段来自 primary，后半段来自 fallback。两者的上下文、采样结果和 token 序列都无法保证连续一致；更关键的是，已发送 token 无法可靠回滚。

所以项目把 fallback 边界定在“首块前”：首块前 primary 失败可切换；首块后失败记录 `stream_interrupted` 并返回流错误，不调用 fallback。

证据：

- `internal/gateway/providers_test.go:38` 验证 Ark 已发出 `ark partial` 后，Ollama 调用次数仍为 0。
- `internal/router/router.go:154` 对已产生首块的错误返回 `ErrStreamInterrupted`；只有首块前失败才继续下一 Provider。
- `internal/gateway/server.go:331` 已开始 SSE 后把错误作为流内错误处理。

### 追问 B：为什么取消要传播给 Provider？

客户端断开后，如果 Provider 仍继续生成，会白白消耗模型配额和连接资源，也会占用服务端 goroutine、HTTP/SSE 连接及下游连接池。

在 Go 里，`context` 是请求级取消边界。Gateway 将 `request.Context()` 传给 Router，Router 再将同一个 `ctx` 传给 `candidate.Stream(...)`；因此客户端取消能让 Provider 立即结束阻塞或生成。

同时，trace 必须记录 `cancelled` 结果，否则运维侧无法区分“Provider 不可用”“流中断”和“用户主动取消”。

证据：

- `internal/gateway/context_propagation_test.go:16` 证明已取消的 request context 会传到认证和 tenant route。
- `internal/router/router.go:106` 将同一 `ctx` 传给 Provider。
- `internal/gateway/server.go:327` 捕获 `context.Canceled`／DeadlineExceeded 后写入 `trace.cancelled=true`。
- `internal/gateway/trace_test.go:14` 验证 trace 查询仅返回安全摘要且受租户隔离。

## 认证、限流、配额与路由的职责

完成表格：

| 概念 | 当前主链中的作用 | 不应该怎么理解 |
| --- | --- | --- |
| API Key | 认证并获得服务端可信 tenant 上下文 | 不是客户端自报 tenant 的“双重认证”。 |
| Router | 按 tenant/model 配置选择 Provider；支持首块前 fallback | 不是已实现的实时健康度智能调度。 |
| Token Bucket | 单进程、按 tenant 进行入口削峰 | 不是用户余额或用量账本。 |
| trace | 记录 provider attempts、耗时、结果与取消 | 不是财务级 usage ledger。 |

| 概念 | 当前主链中的作用 | 不应该怎么理解 |
| --- | --- | --- |
| API Key | 认证请求，并从服务端 Key Store 得到可信的 `tenantID`<br>，写入 `request.Context`<br>。 | 不是客户端自报 tenant 的“双重认证”；请求体没有资格决定租户身份。 |
| Router | 根据已认证 tenant 和 model 的 route 配置选择 Provider；primary 首块前失败时可尝试 fallback。 | 不是已实现的实时健康度智能调度；当前没有基于动态健康分数自动选路。 |
| Token Bucket | 单进程内、按 tenant 的入口削峰；超额请求在调用 Provider 前被拒绝。 | 不是用户余额、配额结算或用量账本；多 API 副本间也不共享状态。 |
| trace | 记录 Provider attempts、首块／总耗时、结果码、取消状态和是否观察到 usage。 | 不是财务级 usage ledger；不用于余额扣减、账单对账，也不保存 prompt、SSE 内容或密钥。 |

## 请求链路的关键问题

录一段 90 秒介绍：

AgentMesh 是一个 Go 多租户 LLM Gateway。聊天请求先通过 API Key 认证并由服务端确定 tenant，再经过本地 Token Bucket 限流和 tenant/model 路由调用 Provider。网关通过 SSE 流式返回结果；如果 primary 在第一块数据发送前失败，才能安全切换到 fallback Provider，首块后不会切换，以避免混合两个模型的输出。请求全过程记录 trace，并将客户端取消传播到 Provider，避免无效生成和资源浪费。

请求链路的四个关键问题：

1. AgentMesh 为什么是网关而不是 Agent？
2. 认证、限流、路由为什么要按此顺序？
3. fallback 为什么有“首块前”条件？
4. 客户端取消时系统为什么还要关心 Provider？

### 90 秒介绍稿

AgentMesh 是一个用 Go 实现的多租户 LLM Gateway，不负责自主规划和工具调用，更像是模型能力的统一接入与治理层。

一次聊天请求进入后，首先通过 API Key 认证。API Key 不只是校验身份，服务端还会根据它查到可信的 tenant，上游请求不能自行声明 tenant。然后进入按 tenant 的本地 Token Bucket 限流，先在入口削峰，避免请求直接压到下游模型。通过限流后，系统按照 tenant 和 model 的路由配置选择 Provider，例如 mock、Ark 或 Ollama。

返回层使用 SSE 流式转发。Router 有一个关键边界：只有 primary 在第一个数据块发送前失败，才允许切换 fallback；如果已经发出首块，就不能切换，因为客户端已经消费了部分内容，切换会把两个 Provider 的结果混在同一条回答中，而且已发 token 无法回滚。

整个过程会记录 trace，包括 Provider attempts、首块延迟、总耗时、结果码、取消状态和 usage 是否被观察到。客户端断开时，请求 Context 会继续传给 Provider，让下游停止生成，避免浪费模型配额、连接和计算资源。

### 四个问题的回答与实现依据

1. **为什么是网关而不是 Agent？**

它没有自主目标分解、规划循环、工具选择和记忆决策。它的核心职责是认证、限流、路由、流式转发、可观测性和可靠性边界，所以定位是 LLM Gateway。

1. **认证、限流、路由为什么按此顺序？**

先认证，才能从服务端得到可信 tenant；限流依赖 tenant 维度，所以必须在认证后；路由和 Provider 调用成本更高，应放在限流通过后。这样无效或超额请求不会消耗路由、配额或模型资源。

1. **fallback 为什么有首块前条件？**

首块前还没向客户端提交实际回答，切换 Provider 不会破坏响应语义。首块后 HTTP/SSE 内容已被客户端消费，切换会混入两个 Provider 的输出，已发送 token 也无法可靠回滚，所以只能返回流中断错误。

1. **客户端取消时为什么还要关心 Provider？**

客户端已经离开，但 Provider 可能仍在生成。若不取消，会继续消耗模型配额、连接资源和服务端 goroutine。Go 的 `context` 是取消边界，Gateway 将请求 Context 传到 Provider；同时 trace 会记录 `cancelled`，便于区分用户取消与 Provider 故障。

## 请求链路复盘附录（原稿模板）

```latex
任务 0 的六条流程图：
demo/test 的三条证据：
聊天请求时序图：
两个高频追问的标准答案：
90 秒录音后的不足：
今天最答不出的一个问题：
```

## 接口行为与验证范围

- 能在纸上复现聊天请求主链。
- 能指出 `specs/001`、`cmd/api/main.go`、`internal/gateway/server.go` 的职责。
- 能用“响应是否已经提交”解释 fallback 边界。
- 请求主链明确后，可继续追踪 Reservation 状态机与配额结算。

---

上一篇：[AgentMesh：模型调用与用量处理的整体链路](/blog/agentmesh-call-usage-flow)

下一篇：[AgentMesh：Outbox 投递与 Kafka 故障恢复](/blog/agentmesh-outbox-kafka-recovery)
