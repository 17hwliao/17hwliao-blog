[AgentMesh 项目展示](/projects/agentmesh#project-articles) · [系列目录](/blog/lake-282376218) · 6 / 12

进入 handleChat，按顺序拆解方法与请求体校验、路由、额度预留、SSE 写出以及执行结束后的结算收口。

> 实现说明与运行记录基于 2026-09-21 更新的原稿。正文中的文件行号、实现状态与验证结果按该历史快照理解。

## 实现概览

- 认证与限流先于业务处理，进入 handleChat 后继续进行请求和模型校验。
- 配额门禁与真实 Reservation 预扣不是同一个动作。
- 成功、错误和取消最终回到同一套会话收口边界。

## 实现细节
请求经过的调用顺序：

```text
root mux
→ protected
→ AuthenticatedHandler
→ auth.Authenticate
→ withRateLimit
→ handleChat
```

## 认证、限流与路由嵌套

先纠正一个容易混淆的点：

```text
创建一个租户校验路由 + 可观测的指标记录器 + 资源预留限流的网关实例
AuthenticatedHandler() 不是每次请求都执行的中间件。
它在服务启动时执行一次，用来创建 protected mux。
```

### 一、启动时发生什么

在 `cmd/api/main.go:127`：

```text
protected := server.AuthenticatedHandler(func(next http.Handler) http.Handler {
    return auth.Authenticate(store, next)
})

root := http.NewServeMux()
root.Handle("/", protected)
```

`server.AuthenticatedHandler(...)` 返回一个内部 `ServeMux`，赋给变量 `protected`。

在 `internal/gateway/server.go:124` 中，它注册聊天路由：

```text
mux.Handle(
    chatPath,
    authenticate(
        s.withRateLimit(
            http.HandlerFunc(s.handleChat),
        ),
    ),
)
```

这行可以从里向外读：

```text
最内层：handleChat
外面包一层：withRateLimit
最外面包一层：auth.Authenticate
最终挂到：/v1/chat/completions
```

这是 internal/gateway/server.go 的核心：聊天处理、trace 查询、SSE 写出。逐段拆：

## `handleChat` —— 请求流水线

```text
方法校验 → body 解码 → 租户解析 → 观测 session → 模型路由校验 → 配额门禁
→ reservation 预扣 → 选 streamer → 流式执行 → 错误/取消/正常 三路收口
```

### 1. 方法 + body 校验（开头）

```go
if request.Method != http.MethodPost { ... }   // 只接 POST
input, err := decodeChatRequest(request)        // 400 invalid_chat_request
```

### 2. 租户路由 + 观测

```go
if s.tenantResolver != nil {
    tenantID, ok = auth.TenantID(request.Context())   // 鉴权中间件已塞进 ctx
    if !ok → 401 auth_failed

    if s.recorder != nil {
        session = s.recorder.Start(tenantID, input.Model)
        if session.TraceID() != "" {
            w.Header().Set(traceHeader, session.TraceID())   // X-AgentMesh-Trace-ID
        }
    }
```

关键点：

- **trace header 在 SSE 之前**就设好（SSE 是流，header 一旦发出就改不了），所以必须在写第一个 data 前 `Set`。
- **类型断言** `observedTenantResolver`：路由可能支持"带 observer"的版本。如果有，就把 `session` 传进去，让 Router 的每次 Provider attempt 都能挂到 trace 上；否则退回无 observer 的普通版本。**这是可选增强，不影响基本流程。**

```go
streamer, allowed = ...Streamer(...)
    if !allowed → 403 model_not_allowed + completeTrace
```

### 3. 配额门禁

```go
if !s.quota.Allow(request.Context(), tenantID, input.Model) {
    completeTrace(session, quotaExhausted, false)
    → 429 quota_exhausted
}
```

`quota` 是 `QuotaGate` 接口，默认 allow-only，只有显式 `AGENTMESH_QUOTA_MODE=reservation` 才真启用。

### 4. streamer 兜底

```go
if streamer == nil {
    completeTrace(session, "provider_unavailable", false)
    → 503 provider_unavailable
}
```

没有可用 Provider 直接挡掉。

### 5. Reservation 预扣

```go
if s.reservations != nil {
    reservationSession, err = s.reservations.Begin(...)
    if err != nil {
        分两种：
          - Code(err)==quota_exhausted → 429
          - 其他 → 503 quota_unavailable   // 依赖（MySQL/Redis）不可用
    }
}
```

`Begin` 是预扣的入口：向配额池"借"一个额度，拿到 `StreamSession`，流结束后 `Complete` 结算。

### 6. 选 streamer + 执行

```go
if reservationSession != nil {
    hooked, ok := streamer.(router.HookedStreamer)   // 必须支持 attempt hook
    if !ok → 503 quota_unavailable
    err = hooked.StreamWithAttemptHook(ctx, chat, emit, reservationSession)
} else {
    err = streamer.Stream(ctx, chat, emit)
}
```

**为什么 reservation 必须走**`HookedStreamer`**？** 因为预扣需要知道"实际尝试了哪个 Provider、结果如何"作为结算证据（attempt 持久证据），所以 Router 要暴露 `StreamWithAttemptHook`。没有 reservation 时走普通 `Stream` 即可。

### 7. SSE 写出机制（`start` / `emit`）

```go
started := false
start := func() {
    if started { return }
    started = true
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")
}
chat := provider.ChatRequest{Model: input.Model, Messages: input.Messages}
emit := func(chunk provider.Chunk) error {
    start()   // 首个 chunk 时懒启动 SSE
    return writeSSE(w, map[string]any{
        "choices": []map[string]any{{"delta": map[string]string{"content": chunk.Delta}}},
        "usage":   chunk.Usage,
    })
}
```

**这是整个函数最巧的设计**：

- **SSE 懒启动**：`start()` 在 `emit` 被首次调用时才设 header。意味着如果 Provider 还没出第一个 chunk 就失败，**header 从未发出**，还能走 JSON 错误路径（`writeJSONError`）。一旦 `start()` 执行了（发出了 `Content-Type: text/event-stream`），就只能走 SSE 错误路径。
- **这是"首块前可 fallback、首块后只报 interrupted"的实现核心**：Router 内部判断"有没有 emit 过"，没 emit 过就能切下一个 Provider；emit 过就只能 `stream_interrupted`。

### 8. 结算 + 三路收口

```go
// 结算
if reservationSession != nil {
    if completeErr := reservationSession.Complete(ctx, streamErrorCode(err),
        errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded)); completeErr != nil {
        // 结算本身失败（依赖挂了）
        分 started 与否：
          - 已出过流 → SSE 写 quota_unavailable + DONE
          - 没出过流 → JSON 503 quota_unavailable
    }
}

// 正常
if err == nil {
    completeTrace(session, "success", false)
    if !started { start() }   // 即使没数据也要开 SSE
    _ = writeDone(w)         // 发 [DONE]
    return
}

// 取消
if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
    completeTrace(session, "cancelled", true)
    return
}

// 其他错误
if started {
    completeTrace(session, streamErrorCode(err), false)
    _ = writeSSE(w, map[string]any{"error": map[string]string{"code": streamErrorCode(err)}})
    _ = writeDone(w)
    return
}
completeTrace(session, streamErrorCode(err), false)
writeJSONError(w, http.StatusServiceUnavailable, streamErrorCode(err))
```

**三路收口的判定依据始终是**`started`**（是否已发出 SSE 首块）**：

| 情况 | `started` | 行为 |
| --- | --- | --- |
| `err == nil` | 可能 false | 开 SSE + `[DONE]` |
| 取消（客户端断/超时） | 任意 | 标记 `cancelled`<br>，不再写 |
| 流中错误 | true | SSE 写 `error`<br>+ `[DONE]` |
| 流中错误 | false | JSON 503 |

`streamErrorCode` 把 error 映射到语义码：

```go
reservation.Code(err)==quotaExhausted → "quota_exhausted"
errors.Is(err, router.ErrStreamInterrupted) → "stream_interrupted"
其他 → "provider_unavailable"
```

---

## `handleTrace` —— 查 trace

```go
只 GET；tenantID 从 ctx 取（鉴权中间件塞的），没有就 404 trace_not_found
recorder.Get(tenantID, traceID)  → 没有也 404（跨租户/未知/未完成统一 404，不暴露记录是否存在）
命中 → JSON 输出
```

**安全设计**：无论 trace 是"不存在"、"别的租户的"还是"还没完成"，都返回同一个 404 `trace_not_found`，**不区分**，避免泄漏记录存在性。

## `completeTrace`

```go
if session != nil { session.Complete(resultCode, cancelled) }
```

就是个 nil 保护。

## `decodeChatRequest` / `streamErrorCode` / `writeJSONError`

前面已经讲过，这里是完整定义，逻辑一致。

## `writeSSE` / `writeDone`

```go
func writeSSE(w, payload) {
    data, _ := json.Marshal(payload)
    fmt.Fprintf(w, "data: %s\n\n", data)
    w.(http.Flusher).Flush()   // 立刻推给客户端（SSE 的关键）
}
func writeDone(w) {
    io.WriteString(w, "data: [DONE]\n\n")   // OpenAI 协议的终止标记
    w.(http.Flusher).Flush()
}
```

**SSE 协议核心**：每个事件是 `data: <json>\n\n`，最后用 `data: [DONE]\n\n` 收尾（OpenAI 兼容）。`Flush` 必须每次调用，否则客户端攒不到实时数据。

### 二、一条真实请求如何运行

```text
POST /v1/chat/completions
→ root mux 命中 "/"
→ 进入 protected mux
→ protected mux 精确命中 "/v1/chat/completions"
→ auth.Authenticate
→ withRateLimit
→ handleChat
```

`root` 的 `/healthz`、`/readyz` 是公开的，不经过 `protected`；`/admin/` 有自己的管理处理器。

### 三、tenant ID 在哪里写入、哪里读取

实际过程 :

这个在 使用 auth.Authenticate函数中实现认证之后实现传入内部的tenant 参数

```text
t, ok := store.Authenticate(
    r.Context(),
    key[:8],
    sha256.Sum256([]byte(key)),
)
```

这里传给 `store.Authenticate` 的是：

```text
context
API Key 前缀
完整 API Key 的哈希
```

写入在 `internal/auth/auth.go:48` 第 66 行：

```text
next.ServeHTTP(
    w,
    r.WithContext(
        context.WithValue(r.Context(), contextKey{}, t.ID),
    ),
)
```

认证流程是：

```text
Authorization: Bearer <raw-key>
→ 拆出 raw key
→ 取前 8 位 prefix
→ 对完整 key 做 SHA-256
→ store.Authenticate(prefix, hash)
→ 得到可信 tenant t
→ 将 t.ID 写入 request.Context
```

下游读取在两处：

```text
tenantID, ok := auth.TenantID(request.Context())
```

- `internal/gateway/server.go:144`：限流读取 tenant。
- `internal/gateway/server.go:230`：聊天处理读取 tenant。

这里的 `contextKey{}` 是 auth 包私有类型，其他包不能随便伪造同一个 key。

### 四、为什么限流必须在认证后

因为限流按可信 tenant 生效：

```text
decision := s.rateLimit.Admit(request.Context(), tenantID)
```

认证前：

```text
没有可信 tenant
→ 不能准确把流量归属到某个租户
→ 客户端若在 body 里自报 tenant，可伪造身份或借用别人额度
```

所以先认证得到 tenant，才允许按 tenant 的桶限流。

- 按 IP：公司、学校、NAT 后的多个正常用户会互相影响。
- 相信请求体里的 `tenant_id`：攻击者可以伪造 `tenant_a`、`tenant_b`，不断切换身份绕过限流。
- 认证后：服务端根据 API Key 得到真实 tenant，才能正确扣对应 tenant 的 Token Bucket。

### 五、为什么被限流后不应解析 body "入口消峰"

继续解析然后传回大量的无效的 JSON 数据失去了之前的 消峰的 策略 ;

只需要保证当前的检查 用户 余额 的大小是否足够花销即可 , 返回一个 http 参数 : 429

`internal/gateway/server.go:149`：

```text
if decision.Allowed {
    next.ServeHTTP(w, request)
    return
}

writeJSONError(w, http.StatusTooManyRequests, rateLimited)
```

拒绝时根本不调用 `next.ServeHTTP`，也就是不会进入 `handleChat`，因此不会：

```text
读取 body
解析 JSON
查询 tenant route
执行 quota 检查
Reservation.Begin
调用 Provider
```

这不仅是性能优化，也是入口防护。

测试 `internal/gateway/rate_limit_test.go:19` 用 `trackingBody` 验证：

```text
未认证请求：
→ 401
→ body 没被读取
→ 限流器也没被调用

认证成功但限流拒绝：
→ 429 + Retry-After: 60
→ body 没被读取
→ resolver / quota / reservation / provider 调用次数都为 0
```

---

## `handleChat()` 前半段逐行解释

入口在 `internal/gateway/server.go:214`。

### 1. 先限制请求方法

```text
if request.Method != http.MethodPost {
    writeJSONError(w, http.StatusMethodNotAllowed, "method_not_allowed")
    return
}
```

即使路由已经是聊天路径，也必须再次限制 HTTP 方法，避免 `GET /v1/chat/completions` 进入聊天业务。

### 2. 解码并校验请求体

```text
input, err := decodeChatRequest(request)
```

实际校验在 `internal/gateway/server.go:366`：

```text
最多读取 64 KiB
→ 禁止未知 JSON 字段
→ 禁止请求中拼接第二段 JSON
→ model 不能为空
→ messages 不能为空
→ stream 必须是 true
→ 每条 message 的 role 不能为空
```

失败统一返回：

```text
400 invalid_chat_request
```

注意：JSON 合法之前，系统不会创建 trace。因为非法数据不应该被视为一次可追踪的模型调用。

### 3. 初始化 streamer、trace 与 tenant

```text
streamer := s.router
var session *observability.Session
var tenantID string
```

`streamer := s.router` 是为兼容旧的静态路由模式准备的默认值。

但当前 `main.go` 创建的是带 `tenantResolver` 的 Server，因此会进入：

```text
tenantID, ok = auth.TenantID(request.Context())
```

这一步再次读取认证层写入的可信 tenant。理论上认证层已经做过校验；这里仍检查 `ok`，保证 Gateway 自己不依赖“外层一定正确”的假设。

### 4. 创建 trace，再判断 model 是否允许

```text
session = s.recorder.Start(tenantID, input.Model)
w.Header().Set(traceHeader, session.TraceID())
```

然后才调用：

```text
streamer, allowed = s.tenantResolver.Streamer(
    request.Context(),
    tenantID,
    input.Model,
)
```

顺序是：

```text
合法 JSON
→ 有可信 tenant
→ 创建 trace
→ 校验 tenant 是否允许该 model
```

因此，即使 model 不允许，客户端仍会拿到 trace ID；trace 会被标记为 `model_not_allowed`。

测试 `internal/gateway/contract_test.go:49` 证明：

```text
请求 model=not-routed
→ 403 model_not_allowed
→ 响应里已有 X-AgentMesh-Trace-ID
→ Provider 调用次数为 0
```

### 5. tenant/model 路由

这里有两个分支：

```text
if observed, ok := s.tenantResolver.(observedTenantResolver); ok && session != nil {
    streamer, allowed = observed.StreamerWithObserver(...)
} else {
    streamer, allowed = s.tenantResolver.Streamer(...)
}
```

含义是：

```text
普通 Resolver：
→ 返回可调用的 Provider 路由

支持 observedTenantResolver 的 Resolver：
→ 除了返回路由，也把 trace session 作为 Observer 传入
→ 之后 Provider attempt、首块、成功/失败会被 trace 记录
```

若 `allowed == false`：

```text
trace 完成：model_not_allowed
→ 403 model_not_allowed
→ 不会预扣额度
→ 不会调用 Provider
```

### 6. `quota.Allow`：早期准入边界

```text
if !s.quota.Allow(request.Context(), tenantID, input.Model) {
    ...
    429 quota_exhausted
}
```

这是一个可替换的早期准入接口，适合做便宜的“允许/拒绝”判断。

但要按真实代码说：当前 `main.go` 没有额外传入 `QuotaGate`，因此此处使用默认 `allowQuotaGate`。当前真正的额度预扣和结算由下一步 `reservations.Begin()` 负责。

也就是说：

```text
quota.Allow
= 可测试的早期拒绝接口 / 扩展点

reservations.Begin
= 当前运行时真正的 Reservation 状态机与额度预扣入口
```

### 7. 检查路由结果，再开始 Reservation

```text
if streamer == nil {
    503 provider_unavailable
    return
}
```

这一步发生在预扣额度之前，避免“没有可调用 Provider，却已经冻结额度”。

然后：

```text
reservationSession, err = s.reservations.Begin(
    request.Context(),
    tenantID,
    input.Model,
    input.Messages,
)
```

四个输入的意义：

| 输入 | 含义 |
| --- | --- |
| `request.Context()` | 客户端断开时，Reservation 流程也能感知取消 |
| `tenantID` | 额度属于哪个可信租户 |
| `input.Model` | 这次额度预留对应哪个模型 |
| `input.Messages` | 后续记录 Provider attempt 与计算/估计用量所需请求内容 |

成功后只得到一个 `StreamSession`，此时：

```text
还没有调用 Provider
还没有写 SSE
还没有向客户端发送任何 token
```

失败分两类：

```text
Reservation 返回 quota_exhausted
→ 429 quota_exhausted

Reservation 返回其他错误，例如 Redis/MySQL 不可用
→ 503 quota_unavailable
```

测试 `internal/gateway/auth_test.go:72` 证明：

```text
Reservation 拒绝
→ 返回 429
→ mock Provider 调用次数为 0

Reservation 存储错误
→ 返回 503
→ mock Provider 调用次数仍为 0
```

这就是“先保证额度状态可控，再允许模型生成”的代码证据。

---

## 三条测试各自证明什么

| 测试 | 证明的顺序 | 若顺序错了 |
| --- | --- | --- |
| `TestRateLimitRejectsAfterAuthBeforeBodyOrDownstream` | 认证 → 限流 → body/下游 | 被拒绝流量仍可消耗解析、数据库或模型资源 |
| `TestReservationGateRejectsBeforeProviderAttempt` | 路由/额度预留 → Provider | 额度不足时仍调用模型，形成未授权消耗 |
| `TestHTTPContractTraceHeaderPrecedesModelAuthorization` | JSON 合法 → trace → model 路由校验 | 被拒绝请求无法关联 trace，排障缺失证据 |

---

## 请求处理链路小结

你可以按下面这段讲：

一条聊天请求先进入 root mux，再进入启动时构造好的 protected mux。聊天路由最外层是 API Key 认证；认证会校验 Bearer Key，并将服务端确认的 tenant ID 写入 request context。随后限流器按这个可信 tenant 限流，若拒绝则直接返回 429，不读取请求体，也不触发路由、额度预扣或模型调用。通过限流后，handleChat 才严格解析 JSON、创建 trace、校验 tenant 是否允许请求模型，并在 Provider 调用前执行 Reservation.Begin。Reservation 拒绝时，Provider 调用次数必须为零。

---

上一篇：[AgentMesh：服务启动与依赖组装](/blog/agentmesh-startup-assembly)

下一篇：[AgentMesh：租户路由与配额预扣边界](/blog/agentmesh-tenant-quota-reservation)
