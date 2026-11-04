[SQL Sentinel 项目展示](/projects/sql-sentinel#project-articles) · [系列目录](/blog/lake-282383607) · 2 / 6

从 CLI 与 Webhook 两种输入出发，追踪签名验证、SQL 提取、候选结构校验及管线调用，划清输入检查与数据库验证的边界。

> 实现说明与运行记录基于 2026-10-09 更新的原稿。正文中的文件行号、实现状态与验证结果按该历史快照理解。

## 实现概览

- 原始请求体先验签，再进入解析和业务处理。
- SQL 准入与结构化候选校验阻止不受控输入直接变成 DDL。
- 管线编排测试与真实影子库 EXPLAIN 具有不同的证明范围。

## 实现细节
## 输入验证的阅读边界

1. **看见**`return`**，把后面的链路划掉。** Go 没有隐式 continue。
2. **看见函数赋值给字段，记住"还没执行"。** `RunPipeline: func(...)` 是造了一个值，不是调用。
3. **跟踪数据用"这坨字节现在在谁手里"的问法。** 不看结构体字段表，只看传参和返回值。
4. **测试断言是最诚实的文档。** 每节末尾我会指出"哪一行断言证明了我刚才说的话"。
5. **本节的调用边界**：`shadowgate.Gate.Run`（S2）、`AsyncEnqueue` 之后的 Kafka/Worker（S4）。相关实现分别在后续专题展开。

---

## 验证管线的两类输入

整条链只有两个输入，全程跟踪它们，别引入新概念。

**输入 A —— 请求里的 PR 事件**（走 HTTP body）：

```json
{
  "delivery_id": "delivery-demo-001",
  "pr_number": 12,
  "diff": "diff --git a/q.sql b/q.sql\n+SELECT id, amount_cents FROM orders WHERE status = 'paid' ORDER BY amount_cents DESC LIMIT 20;\n"
}
```

`diff` 是 **unified diff 文本**，不是 SQL。SQL 要从里面**抠出来**。

**输入 B —— 启动时读到的 CandidateSpec 文件**（走本地磁盘）：

```json
{
  "table": "orders",
  "index_name": "idx_cand_status_amount",
  "columns": [
    { "name": "status" },
    { "name": "amount_cents", "direction": "DESC" }
  ]
}
```

这两个输入的**来源不同、生命周期不同、校验时机不同**：

|  | 输入 A | 输入 B |
| --- | --- | --- |
| 来源 | 每个 HTTP 请求 | 进程启动一次 |
| 载体 | HTTP body 的 `diff`<br>字段 | 本地文件 |
| 什么时候被读 | 收到请求时 | `ListenAndServe`<br>之前 |
| 谁来校验 | 验签 → 事件 schema → 提 SQL → 准入 | `DecodeStrict`<br>+ `Validate`<br>（启动时 + 每请求各一次） |
| 换掉它要重启吗 | 不要 | 要（除非重跑校验路径） |

**记住一句话：SQL 来自请求的 diff，候选索引方案来自启动时读的本地文件。不是每次收到请求就调模型生成候选。**

---

## 第 1 节：两个入口怎样汇合

打开 main.go:183 和 main.go:191，只看这两个 `case` 分发到谁：

- `pipeline` → `runPipeline`（cmd/sentinel/pipeline.go:19）
- `webhook-serve` → `runWebhookServe`（cmd/sentinel/webhook\_serve.go:20）

两个入口最终汇合在同一个函数：`pipeline.Run`。

### 分支一：CLI `pipeline`

打开 cmd/sentinel/pipeline.go:31-47。四行核心：

```go
sqlRaw, err := os.ReadFile(*sqlPath)        // 输入 A 的等价物：SQL 文件
candidateRaw, err := os.ReadFile(*candidatePath)  // 输入 B
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
report, err := pipeline.Run(ctx, pipeline.Input{
    SQL: sqlRaw, CandidateSpec: candidateRaw,
    OutputDir: *outDir, RunExplain: pipelineExplainRunner(*chunk),
})
```

注意第 40 行：CLI 给整条管线套了 30 分钟超时。Webhook 路径没有自己造超时，用的是 `r.Context()`（请求级）。这是两条入口唯一的超时策略差异。

### 分支二：CLI `webhook-serve`

打开 webhook\_serve.go:43-62。三行核心：

```go
candidateRaw, err := os.ReadFile(*candidatePath)          // 读输入 B
spec, err := candidate.DecodeStrict(bytes.NewReader(candidateRaw))  // 解析
if err := candidate.Validate(spec); err != nil { return err }       // 校验
```

失败就直接 `return err`，**进程不启动**。这是"进程级门禁"：候选文件是死的，服务就不该起来。

然后是全场最关键的一段（webhook\_serve.go:56-61）：

```go
RunPipeline: func(ctx context.Context, sql []byte, artifacts string) (pipeline.Report, error) {
    return pipeline.Run(ctx, pipeline.Input{
        SQL: sql, CandidateSpec: candidateRaw, OutputDir: artifacts,
        RunExplain: pipelineExplainRunner(*chunk),
    })
},
```

**保姆级拆解这段为什么能工作：**

- 这是**函数字面量**（anonymous function）。`func(...) {...}` 在 Go 里是一个**值**，可以像整数一样赋值给字段。
- 它被赋给结构体字段 `webhook.Config.RunPipeline`。这一行**没有调用** `pipeline.Run`，只是说"以后你要用这个函数"。
- 字段类型是 `PipelineRunner func(context.Context, []byte, string) (pipeline.Report, error)`（webhook.go:80）。函数值必须是这个签名，编译器保证。
- **为什么它能看见** `candidateRaw`**？** Go 的闭包捕获的是**变量本身（引用语义）**，不是那个时刻的拷贝。`candidateRaw` 定义在 `runWebhookServe` 里；而 `runWebhookServe` 在第 73 行卡在 `ListenAndServe()` 上不返回，所以整个进程存续期内这个变量都活着。
- **为什么它必须看见** `candidateRaw`**？** 因为 `sql` 是每次请求变的（参数传进来），而候选方案在整个进程期间不变（启动时定死）。参数给变化的，闭包包不变的。

打个比方：这是**提前装好的验证按钮**。按钮本体（候选方案 + chunk 大小）启动时焊死，按下时只往里面塞"本次的 SQL 和输出目录"。

### 依赖注入的两个层次

项目里有**两层**同类手法，层次不同，容易混：

```text
第 1 层  webhook.Server.RunPipeline  → pipeline.Run          谁提供？runWebhookServe
第 2 层  pipeline.Input.RunExplain   → pipelineExplainRunner → Gate.Run   谁提供？CLI
```

同一个 `pipeline.Run` 因此可以有两种用法：CLI 直接调、Webhook 间接调。**管线本身不知道调用方是谁**，它只认 `Input` 里给它的函数。这就是为什么 Webhook 和 CLI 能共用一条管线而不互相污染。

### 本节只回答三问

1. **SQL 从哪来？** CLI 路径：`--sql` 文件。Webhook 路径：HTTP body 的 `diff` 字段，经 `ExtractAddedSQL` 提取。
2. **CandidateSpec 从哪来？** 两条路径都来自本地文件。CLI 每次命令读一次；Webhook 启动时读一次并闭包持有。
3. **谁提供** `RunExplain` **的实现？** pipelineExplainRunner，由 CLI 的两个入口各自调用 `pipelineExplainRunner(*chunk)` 构造。`pipeline.Run` 内部**没有任何连数据库的代码**。

---

## 第 2 节：HTTP 请求先经过哪些检查

打开 webhook.go:132。这个函数实现了 `http.Handler` 接口——`ServeHTTP(ResponseWriter, *Request)` 是标准库约定的两个方法，Go 的 HTTP 服务器收到请求就会调它。

三个角色先认清：

- `w http.ResponseWriter`：**出口**。往客户端写响应。
- `r *http.Request`：**入口**。方法、Header、Body 都从这里取。
- `s *Server`：**启动时组装好的零件盒**。`secret`、`outputRoot`、`runPipeline`、`sem` 都在里面。

### 门 1：HTTP 方法（:133-136）

```go
if r.Method != http.MethodPost {
    writeRejection(w, http.StatusMethodNotAllowed, ReasonMethodNotAllowed)
    return
}
```

405。注意 `writeRejection` 只回一个 `{"rejection_code": "..."}`（webhook.go:380）。**所有失败路径都返回稳定机器可读的 code，不是给人读的报错文本。** 这条约定贯穿全项目。

### 门 2：拿签名，但不验证（:137-141）

```go
provided, ok := parseSignature(r.Header.Get(SignatureHeader))
```

`parseSignature`（webhook.go:346）只做**格式检查**：

- Header 必须以 `sha256=` 开头；
- 后面的 hex 必须能解码；
- 解码后长度必须恰好 32 字节（`sha256.Size`）。

它**不知道**签名对不对。这一步只是"这个值长得像个 SHA-256"。返回 `ok=false` → 401 `signature_missing`。

这里有个细节值得品：webhook\_test.go:24 的 `TestMissingSignatureDoesNotReadOrProcessBody` 断言 `body.read == false`。也就是说，**签名缺失时 body 一个字节都没读**。为什么重要？因为读 body 是有成本的操作，而且读 body 之后你可能"顺手"解码了 JSON——那就等于在验签之前处理了不可信数据。顺序是：先看有没有签名，再看签名对不对，最后才碰 body。

### 门 3：读原始 body，限制大小（:142-150）

```go
body, tooLarge, err := readBody(r.Body)
```

`readBody`（webhook.go:357）的关键是一行：

```go
data, err := io.ReadAll(io.LimitReader(body, MaxBodyBytes+1))
```

`MaxBodyBytes = 1 << 20` = 1 MiB（webhook.go:30）。注意读 `+1` 个字节，然后用 `len > MaxBodyBytes` 判断。这是**先限流再读**的标准写法——如果直接 `io.ReadAll(body)`，一个 2GB 的 body 会把内存吃满。`+1` 保证超限能被观察到，而不是被悄悄截断。超限 → 413 `body_too_large`。

### 门 4：验签（:151-156）—— 本节最重要

```go
mac := hmac.New(sha256.New, s.secret)
_, _ = mac.Write(body)
if !hmac.Equal(mac.Sum(nil), provided) {
    writeRejection(w, http.StatusUnauthorized, ReasonInvalidSignature)
    return
}
```

**保姆级理解 HMAC-SHA256：** 它需要两样东西——一把**双方共享的秘密**（`s.secret`）和**一份原始字节**（`body`）。把 body 喂进去，得到 32 字节摘要。发送方用同一把 secret 算出同样的值，放在 Header 里；服务端重算一遍比对。

**为什么必须对原始 body 算，而不是解码 JSON 再编码？** 因为发送方签的是**那一份具体字节**。JSON 有无数种等价写法：

```json
{"delivery_id":"a","pr_number":1,"diff":"x"}
{ "diff":"x", "pr_number":1 , "delivery_id":"a"}
```

这两份字节不同，但解码成 Go 结构体再重新 `json.Marshal`，字段顺序会被重排、空白会被规范化。你算出来的签名就不是发送方签的那个了，**好请求会被误拒**。所以规则是：**验签前不改变任何一个字节。**

**为什么用**`hmac.Equal`**而不是**`==`**？**`hmac.Equal` 是常数时间比较（constant-time），`bytes.Equal`/`==` 会在第一个不同的字节就短路返回。差别让攻击者能测出"前 N 个字节猜对了"，逐步猜出签名。这里是安全敏感的比较点，所以用标准库的常数时间版本。

**验签成功证明了什么？** 只证明：**这份 body 是我持有 secret 的人发的，而且没被中途改动。** 它**不证明**：

- SQL 是安全的（签名正确的 body 里可以是 `DROP TABLE`）；
- 请求不是重放（同一份合法 body 可以无限次重发，secret 没变）。

重复 delivery 靠**后面**的机制处理（第 3 节会看到），不是靠验签。

### 门 5：并发门 sem（:158-164）

```go
select {
case s.sem <- struct{}{}:
    defer func() { <-s.sem }()
default:
    writeRejection(w, http.StatusTooManyRequests, ReasonQueueFull)
    return
}
```

这段代码第一次看会懵，拆四步：

1. `s.sem` 是一个**带缓冲的 channel**，容量在 webhook.go:128 设为 `config.MaxConcurrent`（1–4）。
2. `select` 里两个分支：往 channel 放一个东西，或者 `default`。
3. **能放进去** → 说明还有空位 → 拿到名额。
4. **放不进**（channel 满）→ `default` 立刻执行 → 429 `queue_full`。

`select` 在 channel 满时会**立刻走**`default`**，不阻塞**。这就是"满了立即拒绝"的实现，没有排队、没有无界队列。

`defer func() { <-s.sem }()` 是**从 channel 取一个东西**，归还名额。`defer` 保证无论 `process` 正常返回还是 panic 都会归还。

**保姆级类比**：`sem` 是 4 个座位。进去先坐下，出来必须离座。座位满就不许进，当场给 429。

**关键：这个座位在同步分支里坐了多久？** 从坐下到 `ServeHTTP` 返回——也就是**覆盖整段管线执行**（准入 + EXPLAIN + 计划对照 + 诊断）。因为 `process` → `s.runPipeline` → `pipeline.Run` 全是同步调用链，没有 goroutine、没有队列。

这就是 `max-concurrent` 上限设 4 而不是 100 的原因：**影子库是共享资源**，同时跑 4 个 EXPLAIN 已经会互相干扰，测出来的数据就没意义了。并发门在这里不是防 DDoS，是**保护测量环境**。

### 门 6：解码事件（:166-174）

```go
event, err := decodeEvent(body)
```

现在才把 JSON 变成 Go 对象。`decodeEvent`（webhook.go:366）做了**三件事**：

```go
dec := json.NewDecoder(bytes.NewReader(body))
dec.DisallowUnknownFields()   // ① 未知字段拒绝
var event Event
if err := dec.Decode(&event); err != nil { return ... }  // ② 正常解码
var trailing any
if err := dec.Decode(&trailing); err != io.EOF { ... }   // ③ 尾随值拒绝
```

第 ③ 件事最容易漏：标准库的 `json.Unmarshal` 对 `{"a":1}{"b":2}` 这种**拼接的两个 JSON 值**是宽容的（只解析第一个）。用 `json.Decoder` 连续解码两次，第二次没遇到 `io.EOF` 就说明有尾随内容 → 拒绝。

同样地，`DisallowUnknownFields()` 让 `{"delivery_id":"a","unknown":1}` 报错。这两条一起构成"**严格 JSON**"：**不多字段、不少字段、不拼接**。项目里这个模式出现了三次：`decodeEvent`、`candidate.DecodeStrict`、`pipeline` 的 summary 校验。这是统一约定。

然后（:171）：

```go
if !deliveryID.MatchString(event.DeliveryID) || event.PRNumber < 1 {
```

`deliveryID` 是 `^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$`（webhook.go:47）。**这个正则不是白凑的**——`DeliveryID` 后面要拼进文件路径（`outputRoot/DeliveryID/`）。如果允许 `..`、`/`、`\`，就能路径穿越写出 `out-dir` 之外。长度上限 64 也是同理。

### 门 7：进入业务（:175-184）

```go
report, err := s.process(r.Context(), event)
if err != nil {
    log.Printf(...)
    writeRejection(w, http.StatusConflict, deliveryErrorCode(err))
    return
}
writeJSON(w, http.StatusAccepted, map[string]any{
    "delivery_id": event.DeliveryID, "verification_status": report.VerificationStatus,
    "job_id": report.JobID, "duplicate": report.Duplicate,
})
```

**注意这里**`r.Context()`**被传下去了。** 这是 HTTP 请求的取消上下文：客户端断连、`ReadTimeout` 到、服务端关闭，`ctx` 就会变 canceled，管线里的每一步都能感知到并提前退出。上下文穿透整条链是 Go 的约定。

**保姆级关键结论：**`:181`**这个 202 是在**`process`**成功返回后写的。** 而同步分支里 `process` 内部**已经等管线跑完了**。所以：

202 只表示"我接收并处理完了这次投递，结果在本地文件里"。它**不**表示"我马上在后台跑"，也**不**表示"验证通过了"。

### 顺序为什么是这样

把七道门排一遍，理解为什么是这个顺序：

| 门 | 成本 | 为什么要放这里 |
| --- | --- | --- |
| 方法 | 零 | 最便宜的拒绝先做 |
| 签名格式 | 零 | 不需要读 body |
| 读 body + 限流 | 低 | 必须先有字节才能验签 |
| HMAC | 低 | 必须先验证来源，再处理内容 |
| sem | 零 | 必须先拿到名额，才允许耗资源的处理 |
| 解码 JSON | 低 | 验签之后才解析内容 |
| `process` | **高**（含影子库） | 最后才做贵的 |

**原则：越便宜、越不需要信任的操作越靠前；需要处理不可信数据的越靠后。** 验签放在读 body 之后、解码之前，就是这个原则的直接体现。

### 本节证据

- 验签失败不碰业务：webhook\_test.go:48 断言 `calls == 0 && deliveryEntries(root) == 0`。
- 缺签名不读 body：webhook\_test.go:40 用 `readTracker` 包装 body，断言 `body.read == false`。
- 并发门真的挡住第二个：webhook\_test.go:193 第一个 runner 用 channel 挂住不放，第二个请求断言 429 + `calls == 1` + 第二个 delivery 目录不存在。

---

## 第 3 节：diff 怎样变成待验证 SQL

打开 webhook.go:187 的 `process`。

### 先看它怎么初始化 report（:189-194）

```go
report := DeliveryReport{
    DeliveryID: event.DeliveryID, PRNumber: event.PRNumber,
    VerificationStatus: "verification_unavailable", EvidenceLevel: "",
    EligibleForPerformanceClaim: false, Admissions: []sqladmit.Result{},
    CompletedSteps: []string{}, RejectionReasons: []Reason{}, Artifacts: []pipeline.Artifact{},
}
```

**两个细节必须记住：**

1. **默认值是悲观的。** `VerificationStatus` 起始就是 `"verification_unavailable"`，`EvidenceLevel` 是空字符串，`Eligible` 是 `false`。只有后面明确走到 `:243-245` 才会改成 `verification_completed`。**没有成功就必须明确写"没验证"**，而不是留空让人猜。
2. **切片用** `[]T{}` **而不是** `nil`**。** 这样 JSON 序列化出 `"admissions": []` 而不是 `null`，下游不用判空。全项目统一这个习惯。

### 第一步：提取 SQL（:188）

```go
sqls := ExtractAddedSQL(event.Diff)
```

打开 webhook.go:282。**注意返回类型是**`[]string`**，不是"一条 SQL"**。为什么是切片？因为一个 PR 的 diff 里可能有多个 `.sql` 文件、每个文件可能有多段新增。

逐行拆：

```go
var sqls []string
var current strings.Builder
inSQLFile := false
flush := func() {
    if sql := strings.TrimSpace(current.String()); sql != "" {
        sqls = append(sqls, sql)
    }
    current.Reset()
}
```

`flush` 是**收集器**：把当前缓冲里的内容收进 `sqls`，然后清空。两个调用点：遇到下一个文件边界时、整个循环结束时（:304）。这是"遍历完才收尾"的标准模式——最后一份文件也要被收集。

```go
for _, line := range strings.Split(diff, "\n") {
```

**按**`\n`**拆行**。注意：如果 diff 用 `\r\n`（Windows），每行末尾会带个 `\r`。这里没处理，但下游 `sqladmit` 的 `TrimSpace` 和 token 扫描会把它当普通空白，所以不炸。

```go
if strings.HasPrefix(line, "diff --git ") {
    flush()
    parts := strings.Fields(line)
    inSQLFile = len(parts) == 4 && strings.HasSuffix(strings.ToLower(parts[3]), ".sql")
    continue
}
```

`diff --git a/q.sql b/q.sql` 按空白拆是 4 个字段：`diff`、`--git`、`a/q.sql`、`b/q.sql`。取第 4 个（`parts[3]`）判断是否 `.sql` 结尾。**只处理**`.sql`**文件**——这正是"输入一"的例子，`.go` 文件里的 SQL 不走这个入口。

```go
if inSQLFile && strings.HasPrefix(line, "+") && !strings.HasPrefix(line, "+++") {
    current.WriteString(strings.TrimPrefix(line, "+"))
    current.WriteByte('\n')
}
```

三段条件缺一不可：

- `inSQLFile`：当前在 `.sql` 文件区域；
- `HasPrefix(line, "+")`：这是新增行（unified diff 里 `+` 开头 = 新增）；
- `!HasPrefix(line, "+++")`：排除 `+++ b/q.sql` 这个**文件头**。

第三个条件是最容易忽略的一行。unified diff 的文件头长这样：

```diff
diff --git a/q.sql b/q.sql
--- a/q.sql
+++ b/q.sql
+SELECT id FROM orders;
```

`+++` 也是 `+` 开头。不排除的话，`++b/q.sql` 会被拼进 SQL，准入必炸。

### 用"输入一"实际走一遍

```text
diff --git a/q.sql b/q.sql     → flush()（空，丢弃），parts=4，第4个 q.sql → inSQLFile=true
+SELECT id, amount_cents ...   → 非 +++，写 "SELECT id, amount_cents ..." + "\n"
（循环结束）                     → flush() → sqls = ["SELECT id, amount_cents FROM orders WHERE status = 'paid' ORDER BY amount_cents DESC LIMIT 20;"]
```

**得到 1 条。** 注意保留了结尾的分号——`ExtractAddedSQL` 不做任何 SQL 清理，只拼接。分号交给 `sqladmit` 判（半角分号 ≤1 个允许）。

### 第二步：对每段做准入（:195-197）

```go
for _, sql := range sqls {
    report.Admissions = append(report.Admissions, sqladmit.Admit(sql))
}
```

**注意：准入结果全部记录，不做 short-circuit。** 即使第一段就被拒，后面几段也照样跑。这样报告里能看到**每一段**的结论，而不是只看到第一个错误。

### 第三步：三分支判断（:198-213）

**顺序很重要**，因为一旦有 `RejectionReasons` 就返回，后面的分支不会执行：

```text
① :198  len(sqls) == 0        → no_sql_candidates
② :202  任何 admission 不通过  → sql_admission_rejected + 具体 code
③ :207  有任何拒绝原因         → 落盘返回
④ :210  len(sqls) != 1        → multiple_sql_candidates
⑤ :214  继续
```

**① 在 ② 之前**：没提取到 SQL，就不该去判准入。 **② 在 ④ 之前**：如果两个 SQL 都非法，只会报"准入拒绝"，**不会**额外报"多个候选"。这是有意的优先级——先说 SQL 本身有问题，再说数量有问题。

每个分支都走 `s.persist(report)`（webhook.go:249）：建目录 → 写 `webhook_report.json` + `comment.md`。**拒绝不是消失，拒绝是数据。**

### 第四步：两个分支（:214）

```go
if s.asyncEnqueue != nil {
    // 入队 Kafka，返回 queued + JobID
    return report, nil
}
```

配了 `AsyncEnqueue` 就走这里：SQL 和候选 spec 都放进 `kafka.ReceiveInput`（:215-218），返回后 **不落任何本地文件**，HTTP 回 `queued`。这是 S4 的入口，**本节不展开其内部实现**。

没配就走同步分支（:228-246）：

```go
deliveryDir, err := s.createDeliveryDir(event.DeliveryID)
```

打开 webhook.go:257：

```go
dir := filepath.Join(s.outputRoot, id)
if err := os.Mkdir(dir, 0o755); err != nil {
    if errors.Is(err, os.ErrExist) {
        return "", errDeliveryOutputExists
    }
    ...
}
```

**这是幂等的全部实现：**`os.Mkdir`**撞上**`ErrExist`**就返回稳定错误。** 同一个 `delivery_id` 第二次投递 → 409 `delivery_output_exists`。没有 Redis、没有数据库去重表，单机版把幂等绑在文件系统上。

注意 `os.Mkdir`（不是 `MkdirAll`）——父目录必须由 `New()` 在启动时建好（webhook.go:119 用 `MkdirAll`）。这样"中间路径被人塞进来"和"delivery 重复"能被区分开。

```go
pipelineReport, runErr := s.runPipeline(ctx, []byte(sqls[0]), filepath.Join(deliveryDir, "artifacts"))
```

**这一行把两个入口接起来了。** 左边 `s.runPipeline` 是启动时闭包存进来的函数值，右边三个参数就是当时约定的三个：请求级 ctx、提取出的第一段 SQL 的字节、输出目录。

- `sqls[0]`：切片第 0 个。前面已经保证 `len == 1`，所以这里安全。
- `filepath.Join(deliveryDir, "artifacts")`：工件放在 delivery 目录**下面**的子目录。这个层级后面第 5 节会用到。

### 第五步：合并结果（:233-246）

```go
report.EvidenceLevel = pipelineReport.EvidenceLevel
report.EligibleForPerformanceClaim = pipelineReport.EligibleForPerformanceClaim
report.CompletedSteps = append(report.CompletedSteps, pipelineReport.CompletedSteps...)
report.Artifacts = append(report.Artifacts, pipelineReport.Artifacts...)
for _, reason := range pipelineReport.RejectionReasons {
    report.RejectionReasons = append(report.RejectionReasons, Reason{Code: reason.Code})
}
if runErr != nil {
    report.RejectionReasons = append(report.RejectionReasons, Reason{Code: ReasonPipelineFailed})
}
if runErr == nil && pipelineReport.StoppedStep == "" {
    report.VerificationStatus = "verification_completed"
}
```

**这一段是全场最容易被误读的 14 行**，逐条说：

1. `:233-236` 无条件拷贝。`runErr != nil` **时也在拷贝。** 也就是说：管线失败了，只要它产出了 report，其中的 evidence level 和 artifacts 就**会**出现在 webhook 报告里。
2. `:240-242` `runErr != nil` 只**追加**一个 `pipeline_unavailable` 拒绝码。它**不改变** `VerificationStatus` 的默认值 `"verification_unavailable"`。
3. `:243-245` 只有 `runErr == nil` **且** `StoppedStep == ""` 才置 `verification_completed`。两个条件缺一不可。
4. `StoppedStep` **本身没有被拷进** `DeliveryReport`——它只用来做上面的判断。这是个观测性缺口：webhook 报告里看不到"停在哪个阶段"，只能看到一串 rejection code。CLI 路径的 `pipeline_report.json` 才有完整信息。

**结论：**`runErr != nil`**时，HTTP 仍然是 202**（回到 `ServeHTTP` :181），`VerificationStatus` 是 `verification_unavailable`，拒绝原因里多一个 `pipeline_unavailable`。

### 落盘（:246 → webhook.go:268）

写两个文件：

- `webhook_report.json`：结构化报告（给机器消费）；
- `comment.md`：`renderComment(report)` 生成的 Markdown（给人看）。

`renderComment`（webhook.go:308）有个关键默认：

```go
evidenceLevel := report.EvidenceLevel
if evidenceLevel == "" {
    evidenceLevel = "none"
}
```

**空 evidence level 显示为**`none`**，不显示为**`L1`**。** 这就是"没有证据时不伪造 L1"的实现。

`comment.md`**是本地产物。这条链不调 GitHub API、不发布任何远程评论。** 想上 GitHub 是另一件事。

### 本节证据

webhook\_test.go:86 断言得最狠，逐条读：

- `rec.Code != http.StatusAccepted` → **准入拒绝也回 202**，不是错误码；
- `calls != 0` → **runner 一次都没被调**；
- `os.Stat(.../artifacts)` 必须 `IsNotExist` → **拒绝时不创建** `artifacts/` **目录**。

第三条尤其重要：`artifacts/` 是 `pipeline.Run` 内部 `prepareOutputDir` 建的。拒绝发生在 `process` 里、`runPipeline` 之前，所以这个目录**根本不存在**。`comment.md` 里能看到拒绝码，但工件目录是空的。

---

## 第 4 节：SQL 与候选分别如何准入

### 4.1 SQL 准入：admit.go:16

```go
func Admit(sql string) Result {
    tokens, semis, tokenAfterSemicolon, err := scan(sql)
```

**四个返回值**，先认清楚：

- `tokens []string`：真正的 SQL token（关键字、标识符、运算符），全部大写。
- `semis int`：分号数量。
- `tokenAfterSemicolon bool`：分号之后还有 token。
- `err`：扫描失败。

**为什么扫描而不是**`strings.Contains(sql, "DROP")`**？** 因为字符串里的内容和真 token 长得一样：

```sql
SELECT * FROM orders WHERE note = '; DROP TABLE x'
```

`Contains` 会命中 `DROP`。但这里的 `DROP` 是字符串字面量的内容，不是语句。所以必须先扫描、把字符串和注释**排除掉**，再在 token 层面判断。

#### 看主干（:21-52），逐条

```go
if len(tokens) == 0 { return reject("empty_sql") }
```

空 SQL、纯注释、纯字符串都归到"无 token"。

```go
if semis > 1 || tokenAfterSemicolon { return reject("multiple_statements") }
```

**注意是**`> 1`**而不是**`> 0`**。** 结尾单个分号是合法的（`;` 是 MySQL 的语句终止符，不是内容）。`SELECT 1;` 通过；`SELECT 1; SELECT 2` 拒绝。

`tokenAfterSemicolon` 是第二道保险：即使分号只有一个（`SELECT 1; /* 注释 */ SELECT 2`），只要后面还有 token 就拒绝。

```go
first := tokens[0]
if first != "SELECT" && first != "WITH" { return reject("not_readonly_select") }
```

只放行 `SELECT` 和 `WITH ... SELECT` 开头的。

```go
joined := " " + strings.Join(tokens, " ") + " "
for _, forbidden := range []struct{code, phrase string}{...} {
    if strings.Contains(joined, forbidden.phrase) { return reject(forbidden.code) }
}
```

**看首尾两个空格**`+ " "`——这是故意的。`" FOR UPDATE "` 前后各留一格，避免 `SELECT FORUPDATE` 这种拼接误判，也避免 `SELECTFOR` 之类被误命中。

拒绝表（:32-37）：

| code | 命中短语 |
| --- | --- |
| `locking_read` | `FOR UPDATE`<br>、`LOCK IN SHARE MODE` |
| `write_or_ddl_statement` | `INSERT`<br>、`UPDATE`<br>、`DELETE`<br>、`CREATE`<br>、`ALTER`<br>、`DROP` |
| `select_into_file` | `INTO OUTFILE`<br>、`INTO DUMPFILE` |

然后是 signals（:42-51）——**注意 signals 不拒绝，只记录**：

```go
return Result{Accepted: true, EvidenceLevel: "L0", Signals: signals}
```

三种 signal：`select_star`、`leading_wildcard_like`、`function_on_probable_column`。

#### Result 三个字段的语义必须分开

| 字段 | 含义 | 什么时候有 |
| --- | --- | --- |
| `Accepted` | 是否通过准入 | 总是 |
| `ReasonCode` | 拒绝原因 | 仅拒绝时 |
| `Signals` | 待调查线索 | 仅接受时 |

**有 signal ≠ 拒绝。通过准入 ≠ 性能已验证。**`Accepted: true, EvidenceLevel: "L0"`**的意思是"静态没发现问题，但完全没测过性能"。**

#### 四个例子实际推演（对照测试表）

对照 admit\_test.go:5，四个 case 各走一遍：

**①**`SELECT * FROM orders WHERE note='; DROP'`**→ 接受**

扫描器进到 `'` 时切到单引号状态（admit.go:169-171），后面的 `;` 和 `DROP` 都写进 `literal`（:112），到闭合 `'` 时整体作为一个 token `'; DROP'` 加入（:108）。所以 `semis == 0`，`tokens` 里没有 `DROP`。

→ `tokens = [SELECT * FROM ORDERS WHERE '; DROP']`，`semis = 0`，通过。 → signals：`hasSelectStar` 命中（`SELECT` 后紧跟 `*`）→ `["select_star"]`。

**②**`SELECT 1; SELECT 2`**→ 拒绝**`multiple_statements`

遇到第一个 `;`：`flush()` 收走 `SELECT 1`，`semis = 1`（:185-187）。继续扫描，第二个 `SELECT 2` 在结尾 `flush` 时通过 `appendToken` 发现 `semis > 0` → `tokenAfterSemicolon = true`（:78-80）。`semis == 2`，两个条件都中。

**③**`SELECT * FROM orders FOR UPDATE`**→ 拒绝**`locking_read`

这里有个微妙点：`WITH` 允许，但**锁定读不允许**。它确实以 `SELECT` 开头，所以 ①②③ 检查都过。走到 forbidden 循环，`joined` 里含 `" FOR UPDATE "` → 命中。

**④**`/* DELETE */ SELECT * FROM orders`**→ 接受**

遇到 `/*`（:160-167）切到 `/` 状态，`DELETE` 被整段吞掉，直到 `*/` 回到正常状态。所以 `tokens = [SELECT * FROM ORDERS]`，`DELETE` 不在里面。

→ 接受，signals `["select_star"]`。

**⑤（测试表第 19 行，值得知道）**`SELECT * FROM orders LOCK IN /* no-op */ SHARE MODE`**→ 拒绝**`locking_read`

注释在 `IN` 和 `SHARE` 中间，但注释内容不进 token，拼出来的 `joined` 仍然是 `LOCK IN SHARE MODE` → 命中。**注释不能用来绕过 forbidden 检查。**

**⑥**`SELECT 1 /*!50000 INTO OUTFILE 'unsafe' */`**→ 拒绝**`executable_comment_not_supported`

MySQL 的 `/*!...*/` 是**可执行注释**——注释语法但内容是 SQL。admit.go:162 看到 `/*` 后面紧跟 `!` 就直接报错，不解析。这是**保守拒绝**：与其理解错，不如拒绝。

**⑦**`SELECT 'it''s safe'`**→ 接受**

`''` 是 SQL 里转义单引号的方式（两个单引号 = 一个字面单引号）。admit.go:102-104 处理这个：遇到 `''` 就写入一个引号并跳过。

#### 关于 scan 的补充说明（只理解，不用背）

状态机有 6 种状态：普通、单引号 `'`、双引号 `"`、反引号 `` ` ``、行注释 `-`（也处理 `#`）、块注释 `/`。

- 字符串内的分号/关键字 → 归入 literal，不产生 token；
- 注释内的内容 → 直接丢弃；
- `#` 被映射到 `-` 状态（:157-158），因为两者都是行注释，用同一个状态处理；
- 循环结束时如果状态还停在字符串或注释里 → `unterminated_literal_or_comment`（:205）；
- UTF-8 BOM 在开头被剥掉（:71），注释写了原因：Windows 编辑器写的 SQL 文件常带 BOM，不剥的话第一个 token 会变。

**这是一套轻量扫描 + 规则准入，不是完整 SQL AST 解析器。** 它不检查表名是否存在、不检查列是否存在、不检查语法是否合法、不证明 SQL 一定能在 MySQL 执行、更不证明它一定便宜。

### 4.2 CandidateSpec 准入：spec.go:22

```go
type Spec struct {
    Table     string   `json:"table"`
    IndexName string   `json:"index_name"`
    Columns   []Column `json:"columns"`
}
```

**只有三个字段，而且没有**`ddl`**/**`sql`**字段。** 注释（:20-21）写明了意图：这是 Agent 唯一能交给执行器的形态。

#### DecodeStrict（:28-43）

```go
dec := json.NewDecoder(r)
dec.DisallowUnknownFields()
```

和 `decodeEvent` 一样的双检模式。对照 spec\_test.go:46 三个 case：

| 输入 | 拒绝原因 |
| --- | --- |
| `"sql": "DROP TABLE orders"` | 未知字段 |
| `"ddl": "CREATE INDEX evil"` | 未知字段 |
| `} {}` | 尾随 JSON 值 |

**为什么这个检查这么重要？** 想象 LLM 返回一个 JSON，里面有你想看的字段，也偷偷塞了个 `ddl`。如果解码器宽容，`ddl` 会被静默忽略——看起来没事，但如果哪天有人加了个字段映射，它就是**任意 SQL 通道**。严格解码把这条路在格式层面就堵死了。

#### Validate（:60-87）

五条规则，逐条说为什么：

```go
validateIdentifier("table", spec.Table)         // 正则 ^[A-Za-z_][A-Za-z0-9_]{0,63}$
validateIdentifier("index_name", spec.IndexName)
strings.HasPrefix(spec.IndexName, "idx_cand_")  // 索引名前缀
len(spec.Columns) in [1, 4]                     // 列数范围
方向只能是 ASC/DESC/空                            // 白名单
```

- **标识符正则**：不允许分号、空格、反引号、括号。对照 spec\_test.go:29 的 `orders; DROP TABLE orders` → 被拒。
- `idx_cand_` **前缀**：候选索引必须一眼可辨。生产库里所有 `idx_cand_` 开头的索引都是"待验证、可删除"的，不会和真实业务索引混淆。
- **1–4 列**：MySQL 单表二级索引最多 16 列，但 4 列以上的复合索引极少有正收益。限定 4 列是**限制 Agent 的输出空间**，不是 MySQL 的硬限制。
- **不重复列**：`(a, a)` 在 MySQL 里合法但无意义。
- **方向白名单**：空 = 默认 ASC（MySQL 默认）。`DESC; DROP` 这种被拒。

**保姆级理解：Validate 是白名单校验，不是黑名单过滤。** 它不试图识别"哪些 DDL 是危险的"，而是只允许"我明确知道安全的形状"。这是整个项目的安全哲学。

#### CompileCreateIndex（:45-58）

```go
func CompileCreateIndex(spec Spec) (string, error) {
    if err := Validate(spec); err != nil { ... }   // 自己再校验一次
    ...
    return "CREATE INDEX " + quoteIdentifier(...) + " ON " + ... , nil
}
```

**自己再调一次**`Validate`，不依赖调用方先校验过。函数自洽。

对照测试（spec\_test.go:12），输入三个列的输出是：

```sql
CREATE INDEX `idx_cand_user_status_created` ON `orders` (`user_id` ASC, `status` ASC, `created_at` DESC)
```

**反引号**`是`**quoteIdentifier\` 加上去的（:96）。** 但注意：标识符本身已经被正则限制，不含反引号，所以引号只是防御性的。

#### 拿项目里的例子对照

`examples/candidate-explain-index.json` 的编译结果是：

```sql
CREATE INDEX `idx_cand_status_amount` ON `orders` (`status` ASC, `amount_cents` DESC)
```

配 `examples/candidate-explain-query.sql`：

```sql
SELECT id, amount_cents
FROM orders
WHERE status = 'paid'
ORDER BY amount_cents DESC
LIMIT 20;
```

候选索引的设计逻辑：查询按 `status` 过滤、按 `amount_cents DESC` 排序。索引顺序 `(status ASC, amount_cents DESC)` 正好让优化器**用索引同时完成过滤和排序**，避免 filesort。

**但结构校验不证明**`orders`**表存在、不证明**`status`**/**`amount_cents`**列存在。** 数据库层的检查在 `shadowgate` 里，是 S2。本节不展开。

---

## 第 5 节：管线调用与报告

打开 pipeline.go:67-74。先认两个类型：

```go
type ExplainRunner func(context.Context, string, []byte) (shadowgate.Report, []byte, error)

type Input struct {
    SQL           []byte
    CandidateSpec []byte
    OutputDir     string
    RunExplain    ExplainRunner
}
```

**前三个是数据，第四个是函数。** 和第 1 节的 `RunPipeline` 完全同一种手法，只是层次更深：

```text
webhook.Server.RunPipeline  —— Webhook 注入整条管线
pipeline.Input.RunExplain   —— 管线注入数据库那一阶段
```

`pipeline`**包里没有一行连数据库的代码。** 你可以 grep 确认：`internal/pipeline/pipeline.go` 的 import 里没有 `database/sql`，只有 `shadowgate`（为了用它的 `Report` 类型做返回值签名）。

### 第 1 步：输入检查 + 准备输出目录（:77-88）

```go
if len(input.SQL) == 0 { ... }
if len(input.CandidateSpec) == 0 { ... }
if input.RunExplain == nil { ... }
if err := prepareOutputDir(input.OutputDir); err != nil { return Report{}, err }
```

注意**前三个错误返回的是空**`Report{}`——还没开始写任何文件。

`prepareOutputDir`（pipeline.go:232）的逻辑：

- 目录不存在 → `MkdirAll` 建好；
- 存在但不是目录 → 报错；
- 存在且**非空** → 报错 `output directory must be empty`。

**"必须空"这条为什么重要？** 防脏数据。如果上次跑失败留下半份工件，这次再往同目录写，报告会混着两次的东西，SHA-256 对不上但没人知道。宁可拒绝。

注意这一步和 Webhook 的 `createDeliveryDir` 是**两个不同的目录**：

```text
webhook-deliveries/delivery-demo-001/          ← createDeliveryDir 建
webhook-deliveries/delivery-demo-001/artifacts/ ← prepareOutputDir 建
```

前者保证 delivery 幂等，后者保证工件目录干净。

### 第 2 步：初始化 Report（:90-97）

```go
report := Report{
    EvidenceLevel:               "L1",
    EligibleForPerformanceClaim: false,
    CompletedSteps: []string{},
    ...
}
```

**注意：**`EvidenceLevel`**从一开始就写死**`"L1"`**。** 这不是说它已经验证到 L1——而是说**管线的产物上限就是 L1**。管线不做性能测量，所以它永远不可能达到 L2。这个"上限声明"写在初始化里，而不是在 finish 时算，保证任何一条路径都不会出现更高的等级。

`EligibleForPerformanceClaim: false` 同样从一开始就是 `false`，**整条管线没有任何一处把它改成 true**。这不是巧合，是设计：证据等级的提升只发生在 `admit-series`（S 之外的功能）。

### 第 3 步：阶段一 —— 准入并落证据（:99-108）

```go
started := time.Now()
admission := sqladmit.Admit(string(input.SQL))
admission.InputSHA256 = digest(input.SQL)
if _, err := writeStage(input.OutputDir, AdmissionFile, admission, StepSQLAdmit, &report); err != nil {
    return report, err
}
recordDuration(&report, StepSQLAdmit, started)
if !admission.Accepted {
    return stop(input.OutputDir, report, StepSQLAdmit, admission.ReasonCode, nil)
}
```

**"为什么两次 Admit？"** 因为 `pipeline.Run` 是个**可独立调用的边界**。CLI 直接调它，不经 Webhook。如果管线假设调用方已经准入过，CLI 路径就没有保护。所以每个边界自己守一遍。

**注意顺序：先写盘（:102），再判断（:106）。** 这意味着：

即使准入拒绝，`sql_admission.json` 也已经写出来了。

这是"拒绝也是数据"的具体实现。拒绝原因、输入 SHA-256 都留在文件里，事后可审计。

### 第 4 步：阶段二 —— 调用数据库验证（:110-122）

```go
started = time.Now()
candidateReport, baselineRaw, err := input.RunExplain(ctx, string(input.SQL), input.CandidateSpec)
if err != nil {
    recordDuration(&report, StepCandidateExplain, started)
    return stop(input.OutputDir, report, StepCandidateExplain, "candidate_explain_rejected", err)
}
```

**两个返回值，后面各给一个消费者：**

| 返回值 | 内容 | 后面交给谁 |
| --- | --- | --- |
| `candidateReport` | 结构化候选报告（含 `ExplainJSON`<br>、MySQL 版本、快照、候选索引元数据） | 阶段三当元数据来源 + 写盘 |
| `baselineRaw` | 基线侧的 EXPLAIN JSON **原始字节** | 阶段三当对比输入 |

`baselineRaw` 是 `[]byte` 而不是结构体——因为它是从数据库 `Scan` 出来的原始 JSON 字符串，管线**不解析它**，原样传给 `plancompare`。这是"信任下一层解析"的分层。

注意失败路径也调 `recordDuration`（:113）——**失败的阶段也要记录耗时**，而且 `stop` 之前调，保证耗时进了 report。

#### 打开实际实现：pipelineExplainRunner

```go
func pipelineExplainRunner(chunk int) pipeline.ExplainRunner {
    return func(ctx context.Context, sql string, rawSpec []byte) (shadowgate.Report, []byte, error) {
        spec, err := candidate.DecodeStrict(bytes.NewReader(rawSpec))   // ① 再次严格解码
        prepared, err := shadowgate.Prepare(sql, spec)                   // ② 准备
        dbs, closeAll, err := openBoth(ctx)                             // ③ 连两个库
        defer closeAll()
        candidateReport, err := (shadowgate.Gate{...}).Run(ctx, prepared)  // ④ ★ 停在这里
        var baselineExplain string
        if err := dbs["baseline"].QueryRowContext(ctx,
            "EXPLAIN FORMAT=JSON "+prepared.SQL).Scan(&baselineExplain); err != nil { ... }
        return candidateReport, []byte(baselineExplain), nil
    }
}
```

**这里能看清三件事：**

1. `DecodeStrict` **每个请求再跑一次**（:64）。启动时那次是进程级门禁，这里是请求级门禁。为什么跑两次？因为启动后文件**可能被改**。运行期重新读、重新校验，才能保证运行的是校验过的候选。
2. `baseline` **只跑** `EXPLAIN FORMAT=JSON`（:82），永不接收 DDL。`Gate.Run` 才是执行候选 DDL 的地方，只在 candidate 侧。
3. `ctx` **从 HTTP 请求一路传到这里**，`QueryRowContext` 会响应取消。

**④**`Gate.Run`**是 S2。本节不展开其内部实现。**

**再补一个细节：候选 JSON 在整条链上有三种形态。**

```text
启动时文件读到的 []byte (candidateRaw)
  → DecodeStrict 解成的 candidate.Spec 结构体
  → shadowgate.Prepare 返回的 prepared
  → CompileCreateIndex 生成的 DDL 字符串
  → candidateReport.Candidate.DDL（又变回字符串，落盘）
```

同一份信息反复在"字节 ↔ 结构体 ↔ DDL 文本"之间转换。每一层都重新校验，这是有意的冗余。

### 第 5 步：阶段三 —— 计划对照（:124-145）

```go
comparison, err := plancompare.BuildReport(plancompare.Metadata{
    GeneratedAt:  candidateReport.GeneratedAt,
    MySQLVersion: candidateReport.MySQLVersion,
    Snapshot:     ...,
    SQL:          ...,
    CandidateIndex: ...,
}, baselineRaw, candidateReport.ExplainJSON)
```

**看元数据的来源：全部从**`candidateReport`**里取。** 管线不自己算 MySQL 版本、不自己算快照——它信任阶段二的产物。

两个输入计划 + 一份元数据 → 一份对照报告。

写完盘后立刻补两个哈希（:139-140）：

```go
comparison.InputCandidateExplainSHA256 = digest(candidateBytes)
comparison.InputBaselineExplainSHA256 = digest(baselineRaw)
```

**注意顺序**：`:141` 先 `writeStage` 写盘，`:139-140` 在写盘**之后**赋哈希，然后 `:141` 再写一次？不，看仔细：`:139-140` 在 `writeStage`**之前**（第 139 行 &lt; 第 141 行）。顺序是：构造 comparison → 补输入哈希 → 写盘。

（我刚才读代码时特意核对了行号，`:134` BuildReport 返回，`:135-138` 判错，`:139-140` 补哈希，`:141` writeStage。写盘的是已经带上输入哈希的版本。）

**这两个哈希是溯源的关键**：`explain_comparison_report.json` 记录了"我基于哪一份 candidate EXPLAIN 和哪一份 baseline EXPLAIN 得出对照结论"。事后即使原始报告被删，也能通过哈希证明对照结论的来源。

### 第 6 步：阶段四 —— 诊断（:147-157）

```go
diagnosisReport, err := diagnosis.Analyze(comparisonBytes)
```

**看参数：**`comparisonBytes`**，是阶段三**`writeStage`**返回的字节。** 不是内存里的 `comparison` 对象。

这个细节很重要：诊断消费的是**已经写盘、已经被哈希的那一份**。所以诊断报告的 `Source.SHA256` 能对得上磁盘上的文件。测试断言了这点（pipeline\_test.go:126：`diagnosisReport.Source.SHA256 != digest(comparisonRaw)`）。

**如果传内存对象，哈希可能对不上磁盘文件**（比如中间被改了）。用磁盘字节保证"我诊断的就是你看到的那一份"。

### 第 7 步：汇总（:157 → pipeline.go:179）

```go
func finish(outputDir string, report Report) (Report, error) {
    report.Artifacts = append(report.Artifacts, Artifact{
        Step: "pipeline_summary", File: SummaryFile,
        DigestScope: "pipeline_report_with_own_sha256_blank",
    })
    self := len(report.Artifacts) - 1
    report.Artifacts[self].SHA256 = digest(canonicalSummary(report))
```

**这是全场最精巧的一段，值得单独讲。**

`pipeline_report.json` 里记录了它自己的 SHA-256。但一个文件的哈希包含它自己的哈希字段，就会陷入自引用悖论：算哈希的时候用哪个值？

解法是 `canonicalSummary`（pipeline.go:195）：

```go
copy := report
copy.Artifacts = append([]Artifact(nil), report.Artifacts...)   // 浅拷贝切片
for i := range copy.Artifacts {
    if copy.Artifacts[i].Step == "pipeline_summary" {
        copy.Artifacts[i].SHA256 = ""      // 把自己的 SHA 字段置空
    }
}
data, _ := json.MarshalIndent(copy, "", "  ")
return append(data, '\n')
```

**把 summary 自己的 SHA 字段清空后再算哈希。**`DigestScope` 字段名 `pipeline_report_with_own_sha256_blank` 就是**公开说明这个约定**——消费者看到这个 scope，就知道校验时也要先把那个字段置空再算。

**这是诚实的自引用哈希，不是伪造的。** 如果不写 scope 字段，消费者可能误以为这是对整个文件的哈希，算出来对不上就会以为报告被篡改。

测试 pipeline\_test.go:132 的 `assertCanonicalSummaryDigest` 验证的就是这个约定。

### 第 8 步：stop() 的语义（:166-177）

```go
func stop(outputDir string, report Report, step, code string, cause error) (Report, error) {
    report.StoppedStep = step
    report.RejectionReasons = append(report.RejectionReasons, Reason{Code: code})
    finished, err := finish(outputDir, report)
    if err != nil { return finished, err }
    if cause != nil { return finished, fmt.Errorf("%s: %w", step, cause) }
    return finished, fmt.Errorf("%s rejected: %s", step, code)
}
```

`stop`**永远返回非 nil error。** 不管什么原因停止，调用方收到的 `err` 都不为空。同时返回**已完成部分的 report**。

所以调用方的正确写法是（Webhook 就是这么写的）：

```go
report, err := runPipeline(...)
if err != nil { ... 但 report 仍然有效，要合并 ... }
```

**只看**`err`**会以为什么都没做；只看**`report`**会以为成功了。两个都要看。**

### 四个变量，全程跟下来

按第 5 节开头的要求，只跟四个：

| 变量 | 谁产生 | 谁消费 |
| --- | --- | --- |
| `input.SQL` | Webhook 的 `sqls[0]` | `Admit`<br>、`RunExplain` |
| `input.CandidateSpec` | 启动时闭包持有的 `candidateRaw` | `RunExplain`<br>（内部再 DecodeStrict） |
| `candidateReport`<br>/ `baselineRaw` | `RunExplain`<br>返回 | 前者→对照的元数据 + 写盘；后者→对照的另一侧输入 |
| 最终 `report` | `Run`<br>里累积 | Webhook 的 `process`<br>合并 → `DeliveryReport`<br>→ HTTP + 文件 |

**注意第 3 行**：阶段二的两个返回值走向不同消费者。`candidateReport` 是结构化的、可拆解的；`baselineRaw` 是原样的字节。

### 三个必须知道的报告语义

1. `CompletedSteps` 记录成功完成的阶段，按顺序。4 步全跑 = `["sql_admit","candidate_explain","plan_compare","diagnosis"]`。
2. `StoppedStep` 只在 `stop()` 被调用时有值。
3. `Artifacts` 每个元素带 `Step`、`File`、`SHA256`。`pipeline_summary` 是最后追加的，带 `DigestScope`。

`StepDurations`**是阶段编排耗时，不是 SQL 查询基准。** 字段注释（:46-47）明确写了 "not a benchmark result"。测试断言 `WallClockMS < 0` 是无效值，不断言任何性能阈值。

**这条管线不做**`bench`**性能测量。** 它输出的是**计划和诊断证据**，上限 L1。要声称性能收益，得走 `admit-series`。

### 本节证据

pipeline\_test.go:16 逐条断言：

- `runnerCalled == false` → 准入拒绝时**不调用** `RunExplain`；
- `report.StoppedStep != StepSQLAdmit` → 停在准入阶段；
- `len(report.CompletedSteps) != 1` → 但准入阶段算**已完成**（因为已经写盘）；
- `len(report.Artifacts) != 2` → 准入工件 + 汇总工件；
- `report.Artifacts[0].SHA256 != digest(admissionRaw)` → 汇总里的哈希和磁盘文件一致；
- 最后循环检查 `CandidateFile`/`ComparisonFile`/`DiagnosisFile` **必须不存在**。

pipeline\_test.go:72 断言成功路径：`CompletedSteps == 4`、`Artifacts == 5`（4 阶段 + 1 汇总）、`StepDurations == 4`，且两个 provenance 哈希非空。

---

## 第 6 节：测试与完成标准

### 实际跑了一遍（2026-10-07）

```text
ok  sqlsentinel/internal/webhook     0.327s
ok  sqlsentinel/internal/sqladmit    0.295s
ok  sqlsentinel/internal/candidate   0.361s
ok  sqlsentinel/internal/pipeline    0.347s
```

7 个顶层测试全 PASS（`TestRejectedAndMultipleSQLNeverReachPipeline` 含 2 个子测试）。**本次未启动数据库或 Kafka。**

### 测试的边界要说清楚

- Webhook 测试注入的是**模拟 runner**（`newTestServer` 传闭包），不碰 MySQL。它证明的是"入口/编排/报告行为"。
- Pipeline 测试同样注入模拟 `RunExplain`。
- `TestAsyncEnqueueUsesDurableDeliveryIdempotency` 用的是 `kafka.NewMemoryStore()`，不是真 Kafka。

**所以：测试证明"编排正确"，不证明"影子库验证正确"。** 真跑一次 EXPLAIN 需要起两个 MySQL 容器。原稿记录中未执行该项验证。

---

## 输入验证调用链与 CandidateSpec 注入点

```text
┌─ 启动（一次性）─────────────────────────────────────────────────────────┐
│  runWebhookServe                                                       │
│    ├─ os.ReadFile(*candidatePath)        → candidateRaw  []byte        │
│    ├─ candidate.DecodeStrict(candidateRaw)                            │
│    ├─ candidate.Validate(spec)              失败 → 进程不启动           │
│    ├─ pipelineExplainRunner(*chunk)        → 函数值（闭包）             │
│    └─ webhook.New(Config{ RunPipeline: func(ctx, sql, artifacts) {    │
│              return pipeline.Run(ctx, Input{                          │
│                SQL: sql,                     ← 每次请求变               │
│                CandidateSpec: candidateRaw, ← ★ 闭包捕获，进程级不变    │
│                OutputDir: artifacts,         ← 每次请求变               │
│                RunExplain: <上面的函数值>,                              │
│              })                                                        │
│           }})                                                          │
│    └─ http.Server.ListenAndServe()              ← 阻塞，持有 candidateRaw │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼  （收到 POST）
ServeHTTP
  ① 方法检查                → 405
  ② parseSignature          → 401 signature_missing
  ③ readBody（≤1MiB）       → 400 / 413
  ④ HMAC-SHA256 + hmac.Equal→ 401 invalid_signature
  ⑤ sem 并发门（容量 1–4）  → 429 queue_full
  ⑥ decodeEvent（严格 JSON）→ 400 invalid_event
  ⑦ deliveryID 正则 + PR 号 → 400 invalid_delivery
  ⑧ process(r.Context(), event)
        ├─ ExtractAddedSQL(diff)  → []string
        ├─ for each: sqladmit.Admit  → report.Admissions
        ├─ 0 条 / 被拒 / 多条  → persist() ──┐
        ├─ asyncEnqueue != nil → 入队（S4，今天不跟）
        └─ 同步分支：
           ├─ createDeliveryDir(id)   已存在 → 409 delivery_output_exists
           ├─ s.runPipeline(ctx, sqls[0], <dir>/artifacts)
           │     └─ pipeline.Run
           │          ├─ prepareOutputDir   非空 → 报错
           │          ├─ sqladmit.Admit      → 写 sql_admission.json
           │          │     拒绝 → stop → 写 pipeline_report.json → 返回 err
           │          ├─ input.RunExplain(ctx, sql, candidateRaw)
           │          │     ├─ candidate.DecodeStrict   ← 请求级再校验一次
           │          │     ├─ shadowgate.Prepare
           │          │     ├─ openBoth                 ← 双库句柄
           │          │     ├─ Gate.Run(ctx, prepared)  ← ★★★ S2 停在这里
           │          │     └─ baseline: EXPLAIN FORMAT=JSON（永不 DDL）
           │          │     返回 (candidateReport, baselineRaw)
           │          ├─ 写 candidate_explain_report.json
           │          ├─ plancompare.BuildReport(meta, baselineRaw, cand.ExplainJSON)
           │          │     写 explain_comparison_report.json
           │          ├─ diagnosis.Analyze(<磁盘上的 comparisonBytes>)
           │          │     写 diagnostic_hypotheses.json
           │          └─ finish → 写 pipeline_report.json（含规范化自摘要）
           ├─ 合并：EvidenceLevel / Eligible / CompletedSteps /
           │        Artifacts / RejectionReasons
           ├─ runErr != nil → 追加 pipeline_unavailable
           └─ runErr==nil && StoppedStep=="" → verification_completed
        ├─ writeDelivery: webhook_report.json + comment.md
        └─ 返回 report
  ⑨ writeJSON 202 {delivery_id, verification_status, job_id, duplicate}
```

**CandidateSpec 的注入点只有一个**：`Config.RunPipeline` 的闭包。它从启动时的 `candidateRaw` 闭包捕获，在每个请求调用 `pipeline.Run` 时作为 `Input.CandidateSpec` 传入。SQL 走参数，候选走闭包——**变化的走参数，不变的走闭包**。

---

## 现象、机制与代码依据

### 笔记 1：签名错误不进入处理

- **现象**：请求带 `sha256=<64 个 0>`，收到 401 `invalid_signature`。`out-dir` 下没有任何文件，runner 一次都没被调用。
- **机制**：`ServeHTTP` 的五个拒绝分支全部**在** `process` **之前**。签名的计算顺序是"读 body → HMAC → 比对"，比对失败直接 `return`。body 从未被 `json.Decode`，`delivery_id` 从未被用于建目录。
- **代码**：webhook.go:151-156。
- **测试**：webhook\_test.go:48 断言 `calls == 0 && deliveryEntries(root) == 0`；webhook\_test.go:24 用 `readTracker` 断言缺签名时 body **一个字都没读**。

### 笔记 2：锁定 SQL 不调用 Explain

- **现象**：diff 里是 `SELECT * FROM orders FOR UPDATE`，收到 **202**（不是错误码），`comment.md` 里写 `verification_unavailable` + `locking_read`，`artifacts/` 目录**不存在**。
- **机制**：`FOR UPDATE` 不影响 `ExtractAddedSQL`（它只按 `+` 行拼接）。`sqladmit.Admit` 扫描出 token 后，在 forbidden 循环里命中 `" FOR UPDATE "` → `Accepted: false, ReasonCode: "locking_read"`。`process` 在 `:207` 看到拒绝原因就 `persist()` 返回，**根本不调** `s.runPipeline`，所以 `artifacts/`（由 `pipeline.Run` 内部的 `prepareOutputDir` 创建）从未被创建。
- **代码**：webhook.go:202-209；准入判定在 admit.go:38。
- **测试**：webhook\_test.go:86 的 `locking` 子测试，断言 `rec.Code == 202 && calls == 0` **且** `os.Stat(.../artifacts)` 是 `IsNotExist`。

### 笔记 3：正常输入按顺序生成工件

- **现象**：diff 里是 `SELECT * FROM orders`，收到 202。`artifacts/` 下有 5 个文件，`webhook_report.json` 里 `CompletedSteps` 有 4 个，`comment.md` 里能看到每个工件的 SHA-256。
- **机制**：准入通过 → 调 `RunExplain` 拿 `(candidateReport, baselineRaw)` → 用 `candidateReport` 的元数据 + 两侧 EXPLAIN 建对照 → 用**磁盘上的对照字节**做诊断 → `finish` 写汇总。每阶段 `writeStage` 先写盘再记账，所以"写盘的哈希"和"报告里记的哈希"天然一致。
- **代码**：pipeline.go:99-157，注意 `:148` 传的是 `comparisonBytes` 不是内存对象。
- **测试**：pipeline\_test.go:72 断言 `CompletedSteps == 4 && Artifacts == 5 && StepDurations == 4`，且诊断报告的 `Source.SHA256` 等于磁盘上对照文件的实际哈希。

---

## 输入验证链路小结

三个问题的答案，每个 30 秒。

**Q1：为什么验签不能替代 SQL 准入？**

验签证明的是"这份请求是真的、没被改动"，不是"这份请求的内容是安全的"。签名是由 secret + 原始字节算出来的——一个持有 secret 的合法发送方完全可以签一份 `SELECT * FROM orders FOR UPDATE`，签名照样匹配。验签是**传输层真实性**，准入是**内容层安全性**，两者解决不同问题。项目里 `TestRejectedAndMultipleSQLNeverReachPipeline` 就是拿**签名正确**的请求跑 `FOR UPDATE`，结果仍然被拒。另外验签也不防重放——同一份合法 body 可以无限重发，重复投递靠的是 `createDeliveryDir` 的目录存在性检查返回 409。

**Q2：为什么不用任意原始 DDL 表达候选？**

因为候选索引最终会变成一条真执行的 `CREATE INDEX`。如果让调用方（尤其是 LLM）直接写 DDL 字符串，那这个字段就是一个任意 SQL 通道——若允许直接写 `CREATE INDEX`，后续就能写 `DROP TABLE` 加注释混过去。所以 `Spec` 只保留 `table`/`index_name`/`columns` 三个结构化字段，`DecodeStrict` 用 `DisallowUnknownFields` 加尾随值检查把 `ddl`、`sql` 这类字段在格式层面就拒掉，`Validate` 用标识符正则、`idx_cand_` 前缀、1–4 列、方向白名单限制形状，最后由 `CompileCreateIndex`**确定性**地拼出 DDL。外部只表达"想试什么索引"，程序决定"怎么生成 DDL"。`TestValidateRejectsUnsafeSpecs` 里 `orders; DROP TABLE orders` 和 `LOWER(user_id)` 都是这么被挡住的。

**Q3：为什么管线成功不直接等于性能优化成功？**

因为管线做的四件事是**准入 → EXPLAIN → 计划对照 → 诊断**，全是**计划级证据**。`EXPLAIN FORMAT=JSON` 说的是优化器**打算**怎么走，不是它**实际**跑多快。计划对照报告里能看出 baseline 全表扫描 + filesort、candidate 走索引 + 无 filesort，这只证明"计划变了"。要证明"更快"，必须在受控数据上真实执行多次、测中位数和 MAD 噪声比、且噪声低于阈值、跨多次独立标定都合格——那是 `bench` + `admit-series` 的活。所以管线的 `EvidenceLevel` 从初始化起就写死 `L1`、`EligibleForPerformanceClaim` 从初始化起就写死 `false`，整条管线**没有任何一处**能把它改成 `true`。`StepDurations` 也明确注明是编排耗时不是基准。这是这个项目最核心的诚实性约束：**计划的改善不等于性能的改善，证据等级不能靠编排成功来升级。**

---

**S1 完成。** 下一任务 S2 从 pipelineExplainRunner 第 77 行的 `Gate.Run(ctx, prepared)` 入口开始，讲双库校验、候选索引创建和 EXPLAIN 的真实执行过程。

---

上一篇：[SQL Sentinel：SQL 优化验证架构与证据链](/blog/lake-282383607)

下一篇：[SQL Sentinel：候选索引验证与执行计划对比](/blog/sql-sentinel-index-plan-validation)
