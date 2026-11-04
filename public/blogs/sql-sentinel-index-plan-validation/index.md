[SQL Sentinel 项目展示](/projects/sql-sentinel#project-articles) · [系列目录](/blog/lake-282383607) · 3 / 6

围绕同一 SQL、相同数据和 MySQL 版本，检查候选索引如何通过影子库门禁进入 EXPLAIN，以及两份计划如何形成可核对的证据。

> 实现说明与运行记录基于 2026-10-09 更新的原稿。正文中的文件行号、实现状态与验证结果按该历史快照理解。

## 实现概览

- Prepare、Gate 与实际执行各自承担不同职责。
- 优化器的访问路径、排序与覆盖索引变化属于计划证据。
- 独立 bench 入口使用自己的固定查询，不应把本例 EXPLAIN 当作实测提速。

## 实现细节
**核心问题**：相同数据 + 相同 MySQL 版本下，加了 `idx_cand_status_amount` 之后，优化器计划变了吗？

---

## 索引验证的范围与证据口径

1. **每个函数都问四件事**：输入是什么、做了什么、结果交给谁、失败后是否继续。
2. **区分"门禁"和"执行"。** 门禁失败 = 不改数据库就返回；执行失败 = 数据库可能已经被改了。
3. **区分"计划证据"和"测量证据"。** `EXPLAIN` 说优化器打算怎么走，`bench` 说它实际跑多快。
4. **用真实报告里的数字对表。** 本次记录中项目里有三份真实产物，我会拿真实数值来讲，不举假数字。
5. **本次记录中只到一个门口停下**：`bench` 的内部循环。它不在 `pipeline.Run` 的调用链上。

---

## 验证使用的输入与报告

先把项目里真实跑出来的关键数字放这儿，后面每一步都要对得上：

| 项 | 值 | 来源 |
| --- | --- | --- |
| MySQL 版本 | `8.4.11` | 两侧一致 |
| 数据行数 | `1,000,000` | 两侧一致 |
| 快照摘要 | `5f2ed9465c96fccc45f288e102cffd9c49000f43b03fc12f0c839d1dc1a66fbd` | 两侧一致 |
| 候选索引 | `CREATE INDEX idx_cand_status_amount ON orders (status ASC, amount_cents DESC)` |  |
| 候选静态信号 | `[]`<br>（空） | 这条 SQL 没有 select\*、没有前置通配 LIKE |
| 报告等级 | `L1` |  |
| 性能声称资格 | `false` |  |

**这三个"两侧一致"的数字是整场实验的地基。** 版本一致、行数一致、摘要一致，缺一个，后面的计划差异就无法归因于索引。

---

## 一、候选验证的两个输入

**输入 A ——****candidate-explain-query.sql**

```sql
SELECT id, amount_cents
FROM orders
WHERE status = 'paid'
ORDER BY amount_cents DESC
LIMIT 20;
```

业务含义：已支付订单里，按金额从大到小取前 20 条。

**注意结构：筛选 1 列（**`status`**）+ 排序 1 列（**`amount_cents`**）+ 返回 2 列。** 后面判断索引有没有用，全部围绕这三件事。

**输入 B ——****candidate-explain-index.json**

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

你的讲稿说"`status` 放前面符合筛选结构，`amount_cents` 是排序考虑"——**方向对，但要精确一点。** 等下看真实 EXPLAIN 会看到：

- `used_key_parts: ["status"]` —— **只有** `status` **被用作查找键**，`amount_cents` 没有参与二级查找；
- `using_index: true` —— 索引是**覆盖索引**，`id`/`status`/`amount_cents` 全在索引里，不用回表；
- `using_filesort: false` —— **额外排序消失了**。

所以第二列在这里起的作用是两件事：**覆盖**（避免回表）和**索引序天然有序**（`status='paid'` 的索引条目本身按 `amount_cents DESC` 排列，扫一遍就是排好序的，不需要 filesort）。

**不是"第二列也能拿来查"。** 联合索引的列顺序决定查找方式，但排序能力来自"索引里数据的物理排列顺序"。这个区别后面诊断阶段会用到。

**记住：这只是候选。代码不保证优化器用它，也不保证更快。**

---

## 二、第一步：`pipelineExplainRunner` 是组织者，不是执行者

打开 pipeline.go:62。

```go
func pipelineExplainRunner(chunk int) pipeline.ExplainRunner {
    return func(ctx context.Context, sql string, rawSpec []byte) (shadowgate.Report, []byte, error) {
        ...
    }
}
```

**外层收**`chunk`**，返回一个符合**`pipeline.ExplainRunner`**签名的回调。** 这就是 S1 讲过的"工厂 + 闭包"手法：

```text
组装阶段（CLI 启动时）：  pipelineExplainRunner(5000)  →  得到一个"怎样执行验证"的函数
执行阶段（每次请求时）：  把本次 sql + rawSpec 交给这个函数
```

四个东西先分清：

|  | 内容 |  |
| --- | --- | --- |
| `chunk` | 算数据摘要时每批读多少行（默认 5000）。**不是 RAG 切片大小。** |  |
| `sql` | 输入 A |  |
| `rawSpec` | 输入 B 的**原始字节**（不是结构体） |  |
| 返回 | `(candidate 报告, baseline 原始计划 JSON, error)` |  |

**返回两个不同形态的东西**，后面各给一个消费者：

- `shadowgate.Report` —— **结构化的**，管线拿去写盘、提取元数据；
- `[]byte` —— **原样的字节**，直接交给 `plancompare` 解析。

为什么 baseline 不给结构体？因为 baseline 的计划不需要拆成字段，它是"对照的那一份原始证据"，管线不解释它，只传递它。**信任下一层去解析。**

这个回调的组织顺序：

```text
DecodeStrict → Prepare → openBoth → Gate.Run → baseline EXPLAIN → 返回两侧证据
```

**一句要写下来的话：**`pipelineExplainRunner`**不统计性能收益，它负责组织这次双库计划验证。**

---

## 三、第二步：`Prepare` 把输入变成执行材料

回调开头（pipeline.go:64）：

```go
spec, err := candidate.DecodeStrict(bytes.NewReader(rawSpec))
```

**注意：这里**`DecodeStrict`**是第三次了。** 启动时一次（进程级门禁）、请求进管线一次（其实不在这里，是 `PipelineRunner` 闭包传进来的原始字节）、这里是请求级。运行期重读重校验，是因为**启动后文件可能被换掉**。

紧接着（pipeline.go:68）：

```go
prepared, err := shadowgate.Prepare(sql, spec)
```

打开 gate.go:41。四道检查，**全部在连数据库之前**：

### 检查 1：SQL 准入（:42-45）

```go
admission := sqladmit.Admit(sql)
if !admission.Accepted {
    return Prepared{}, fmt.Errorf("%w: %s", ErrSQLRejected, admission.ReasonCode)
}
```

**"S1 的管线不是已经 Admit 过了吗？"** 已经过过了。**但**`Prepare`**自己也是一个可被独立调用的边界**，它不能假设调用方守过。所以每个边界自守一遍。项目里这叫"每个入口都是完整边界"。

对我们的输入 A，`Admit` 返回 `Accepted: true, Signals: []`——真实报告里 `sql_input.signals` 就是空数组。

### 检查 2：绑定占位符（:46-48）

```go
if hasBindPlaceholder(sql) {
    return Prepared{}, ErrPlaceholderUnsupported
}
```

这个入口**只有 SQL 文本，没有对应的绑定参数**。如果 SQL 里有 `?`，我们无法给出完整、可复现的计划。

看 hasBindPlaceholder 的写法——**它复用和**`sqladmit.scan`**同一套状态机**：单引号、双引号、反引号、行注释、块注释五种状态。

- `WHERE status = ?` → 命中，拒绝；
- `WHERE note = '?'` → 问号在字符串里，**不算**；
- `-- select ?` → 注释里的问号，**不算**。

注释写得很直白（:274-275）：*"A question mark in a literal, quoted identifier or comment is data."*

**保姆级理解**：项目里所有"识别 SQL 结构"的地方都不做字符串包含判断，都先过同一个状态机。这是同一套基础设施复用三次（`sqladmit.scan`、`hasBindPlaceholder`，还有 S1 里的 forbidden 短语匹配）。

### 检查 3：表范围（:49-51）

```go
if spec.Table != "orders" {
    return Prepared{}, fmt.Errorf("%w: %q", ErrUnsupportedTable, spec.Table)
}
```

**硬编码**`orders`**。** 错误信息里写的是 `orders-v1 shadow scope`——这说明项目明确知道自己验证的是**受控的单一场景**，不是任意数据库任意表。

这是个诚实的边界声明。项目 README 也写了"当前环境不足以声称读收益"。

### 检查 4：编译 DDL（:52-56）

```go
ddl, err := candidate.CompileCreateIndex(spec)
```

得到：

```sql
CREATE INDEX `idx_cand_status_amount` ON `orders` (`status` ASC, `amount_cents` DESC)
```

**注意**`status`**没写**`direction`**，编译时补了**`ASC`（`CompileCreateIndex` 里空方向默认 ASC）。真实报告的 `ddl` 字段就是这个字符串，一字不差。

### 结果：`Prepared`

```go
Prepared{
    SQL:        sql,
    SQLSignals: admission.Signals,
    Spec:       spec,
    DDL:        ddl,
}
```

四个字段 = **执行材料包**：待分析查询 + 准入信号 + 结构化候选 + 程序生成的 DDL。

`Prepared`**表示材料准备好了，不表示索引已创建。** 注意结构体注释（:31-32）：*"It intentionally contains compiled DDL rather than accepting raw DDL."* —— DDL 是**程序生成的**，不是外部传来的。S1 讲过这条设计哲学，这里再次落实。

**失败后是否继续？** 四道检查任一失败都直接 `return`。关键点：**到这里**`openBoth`**还没被调用，所以输入错误不会触碰数据库。** 这也是检查顺序的意义——便宜的、不改状态的前面做。

---

## 四、第三步：为什么要两个库

回到回调（pipeline.go:72）：

```go
dbs, closeAll, err := openBoth(ctx)
defer closeAll()
```

打开 bench.go:59 的 `openBoth`：

```go
for _, name := range []string{"baseline", "candidate"} {
    db, err := open(ctx, name)
    if err != nil {
        closeAll()
        return nil, func() {}, err
    }
    dbs[name] = db
}
```

**注意两个失败处理细节**：

1. 任一侧打开失败 → **调用** `closeAll()` **把已经打开的关掉**。否则 baseline 开了但 candidate 失败，会泄漏连接。
2. 返回的 `closeAll` 是一个**已知的空函数** `func(){}`，避免调用方拿到 nil 函数然后 panic。

`defer closeAll()` 保证后续无论在哪一步 `return`，句柄都会释放。

`*sql.DB`**是连接池句柄，不是把数据库装进内存。**

两侧分工：

|  | baseline | candidate |
| --- | --- | --- |
| 索引方案 | 保留原有方案 | 原有 + 本次候选 |
| 提供 | 对照计划 | 实验计划 |
| 收到 DDL | 从不 | 可能 |

**baseline 不等于"完全没有索引"** —— 它有主键 `id`（二级索引和主键的聚集索引天然存在）。它的 `access_type: ALL` 意思是"没有合适的二级索引可用，所以全表扫"。

**为什么不用一个库，测一次、建索引、再测一次？** 因为建索引会改变数据库状态，反复增删索引会污染实验过程（统计信息、缓冲池、索引文件布局都可能受影响）。分成两侧，两个方案**同时存在**，各自独立。

**一个必须诚实说明的边界**：代码里的"只写 candidate"体现在 `Gate.Run` 只用 `g.Candidate` 发 DDL。但**这不等于数据库账号被配成了只读**。包注释说 *"It never ... receives a writable baseline connection"* —— 这是**调用约定的意图声明**，不是数据库层的强制。要真的强制，得在 MySQL 用户权限上做。

---

## 五、第四步：`Gate.Run` 的门禁顺序

gate.go:101。

```go
func (g Gate) Run(ctx context.Context, p Prepared) (Report, error) {
    if g.Baseline == nil || g.Candidate == nil { ... }
    version, err := sameServerVersion(ctx, g.Baseline, g.Candidate)
    gate, err := identicalSnapshots(ctx, g.Baseline, g.Candidate, g.Chunk)
    if err := requireSchema(ctx, g.Candidate, p.Spec); err != nil { ... }
    created, err := ensureCandidateIndex(ctx, g.Candidate, p)
    if _, err := g.Candidate.ExecContext(ctx, "ANALYZE TABLE `orders`"); err != nil { ... }
    ... EXPLAIN ...
}
```

**这个顺序是整个 S2 最重要的结构。** 从上到下：

```text
不连库的检查（Prepare 已完成）
  → 连库但只读的检查：版本
  → 连库但只读的检查：数据摘要
  → 连库但只读的检查：表/列存在
  → ★ 第一个有副作用的操作：CREATE INDEX
  → ★ 第二个有副作用的操作：ANALYZE TABLE
  → 只读操作：EXPLAIN
```

**原则：不可逆的操作排最后。** 前三个门禁全部只读，全过了才允许改数据库。

### 5.1 版本（gate.go:149）

```go
var baselineVersion, candidateVersion string
baseline.QueryRowContext(ctx, "SELECT VERSION()").Scan(&baselineVersion)
candidateDB.QueryRowContext(ctx, "SELECT VERSION()").Scan(&candidateVersion)
if baselineVersion != candidateVersion {
    return "", fmt.Errorf("%w: baseline=%s candidate=%s", ...)
}
```

**字符串精确比较**，两侧都是 `8.4.11` 才通过。

**为什么查数据库而不看 Docker 镜像配置？** 因为配置说的是"打算跑什么"，`SELECT VERSION()` 说的是"**现在实际跑的是什么**"。镜像 tag、`my.cnf` 都没用——运行时现场取证才是证据。这也是整个项目的核心原则：**证据来自运行现场，不来自意图声明。**

**注意错误信息里带了两侧版本号。** 失败时你能直接看到 `baseline=8.0.36 candidate=8.4.11` 这种信息，不用再去连库查。项目的错误信息一贯带足够上下文。

**为什么这个门禁重要？** 优化器是数据库的一部分。版本不同，成本模型、统计信息精度、可选执行路径都可能不同。计划有差异但版本也不同，就**无法把差异归因于索引**。

### 5.2 快照（gate.go:163）

```go
b, err := snapshot.Compute(ctx, baseline, "baseline", chunk)
c, err := snapshot.Compute(ctx, candidateDB, "candidate", chunk)
if b.Rows != c.Rows || b.Digest != c.Digest {
    return ..., fmt.Errorf("%w: baseline rows=%d digest=%s candidate rows=%d digest=%s", ...)
}
```

**只比行数为什么不够？** 你的讲稿举的例子对。两侧都是 2 行，但 baseline 两条 `paid`、candidate 一条 `paid` 一条 `unpaid` —— 行数相同，但 `WHERE status = 'paid'` 的选择性完全不同，两侧计划差异就混进了"数据不同"这个变量。

所以**行数 + 摘要都要比**。

**错误信息里带四样东西**：两侧的行数和两侧完整的 64 位摘要。这样一份失败报告就够了，不用重连数据库复现。

#### 摘要怎么算的：snapshot/compare.go:33

```go
const selectChunk = `SELECT id, user_id, status, created_at, amount_cents, note, payload
FROM orders WHERE id > ? ORDER BY id LIMIT ?`
```

**主键游标分页（keyset pagination），不是 OFFSET。** 代码注释（:10-11）写明了为什么：*"OFFSET 在大表上是 O(n²)"* —— 每次 `OFFSET 500000` 都要先扫过前 50 万行再扔掉。

主循环（:41-50）：

```go
var lastID uint64
for {
    n, next, err := scanChunk(ctx, db, h, lastID, chunk)
    lastID = next
    if n < chunk { break }     // 这一批不够 chunk 行 = 到表尾了
}
```

**终止条件：某一批返回的行数少于请求数。** 不用额外查 `SELECT COUNT(*)`。

`scanChunk`**为什么单独成一个函数？** 注释（:56-58）说得很直白：*"单独成函数是为了让 rows.Close 在每块结束时确定发生 —— 连接池只有一条连接，未关闭的 rows 会让下一次查询直接阻塞。"*

这是个实战细节。`defer rows.Close()` 写在**每块**的函数里，而不是外层循环里。如果放在外层，前面某块的 `rows` 没关闭，下一条查询会卡在连接池上。

#### 哈希本身：snapshot/digest.go

这是整段最容易出错的地方，逐条看规范化逻辑：

```go
const (
    fieldSep = 0x1f // Unit Separator
    rowSep   = 0x1e // Record Separator
    noteNull    = 0x00
    notePresent = 0x01
)
const timeLayout = "2006-01-02T15:04:05.000000Z"
```

**四个规范化的要点，每个都有明确的失败场景：**

**① 字段之间加分隔符**`0x1f`**。** 否则不同切分会拼出相同字节流：

```text
(user_id=1, note="23")   → "123"
(user_id=12, note="3")   → "123"
```

没有分隔符，这两行哈希相同 → 两侧数据不一致却判定一致。注释（:12-13）写了选择 ASCII 控制符的原因：`orders` 各列的取值（数字、状态词、十六进制串、`note-xxxx`）都不可能含这些字节。

**② 时间规范化到微秒 + UTC。**

```go
dst = r.CreatedAt.UTC().AppendFormat(dst, timeLayout)
```

`DATETIME(6)` 精度到微秒。如果格式化成秒，两侧相差几微秒的数据会被判为一致。注释（:22-23）明确写了这个风险。`.UTC()` 还消除了时区差异。

**③ NULL 和空字符串必须产生不同字节。**

```go
if r.Note.Valid {
    dst = append(dst, notePresent)   // 0x01 + 内容
} else {
    dst = append(dst, noteNull)      // 0x00
}
```

注释（:50）：*"否则 note IS NULL 与 note='' 会互相冒充。"* 在 SQL 语义里 `NULL ≠ ''`，`note IS NULL` 和 `note = ''` 匹配的行集不同。

**④ 字段顺序即字节顺序。**`Row` 结构体的字段顺序就是摘要里的字节顺序，注释（:26）写了：*"调换会改变摘要。"*

**顺序也参与摘要。**`Hasher.Add` 的注释（:74）：*"顺序参与摘要，因此调用方必须按主键升序调用。"* 这正是 `selectChunk` 里 `ORDER BY id` 存在的理由。

`Hasher`**不保留整表。** 只持有一个 `sha256.Hash` 和一个 512 字节的复用 buffer：

```go
func (h *Hasher) Add(r Row) {
    h.buf = normalize(h.buf[:0], r)   // 复用 buffer，不累积
    h.h.Write(h.buf)
    h.rows++
}
```

`h.buf[:0]` 是清空但保留底层数组。**100 万行也不会把整表读进内存。**

**结果**：`Digest()` 返回两侧共同的摘要（measure/gate.go:71），只返回 `Baseline` 那一份——因为门禁通过后它们必然相等。`Report.Snapshot` 里记的就是这一份，真实报告里是那个 64 位的 `5f2ed946...`。

**"快照"这个词要小心理解**：这里主要是**数据一致性检查**，不是跨两个数据库的同一事务时刻快照。代码注释和 README 都用了"数据摘要"的说法。两侧数据是 `seed` 阶段用相同 `(seed, rowIndex)` 确定性生成的，不需要 dump/restore。

**门禁顺序的一个问题值得想**：为什么快照检查放在**创建索引之前**？

`CREATE INDEX` 不会改数据行，所以技术上顺序不影响正确性。但这是防御性的：**先确立"两侧可比"这个前提，再允许任何副作用。** 而且 candidate 侧可能已经有上次运行留下的索引，先确认数据一致，再处理索引。

### 5.3 表/列存在（gate.go:182）

```go
SELECT COUNT(*) FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
```

先确认表存在（`tableCount != 1` → `ErrTableMissing`），再逐列确认：

```go
for _, col := range spec.Columns {
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
}
```

**为什么这一步不能省？** S1 讲过 `candidate.Validate` 只证明 `status`、`amount_cents` 是**合法标识符**。它不证明当前数据库里有这两列。数据库层的确认是另一回事。

**注意：只查 candidate 侧，不查 baseline 侧。** 因为 DDL 只会在 candidate 上执行；baseline 只做 `EXPLAIN`，列名拼错会在那里报错。不过实际上 `requireSchema` 的查询是发给 `g.Candidate` 的（:113）。

**一个小不一致**：`existingIndex` 里的查询把表名**硬编码在 SQL 字符串里**（`TABLE_NAME = 'orders'`，gate.go:229），而 `requireSchema` 用的是 `?` 绑定。同一个文件里两种风格。功能上没差别（都是常量），但风格不统一。

---

## 执行计划验证阶段小结

到这里 `Gate.Run` 的前三个门禁全部只读。用一张表总结门禁：

| 门禁 | 代码位置 | 读还是写 | 失败返回 |
| --- | --- | --- | --- |
| SQL 准入 | `Prepare`<br>:42 | 不连库 | `ErrSQLRejected`<br>+ 原因码 |
| 绑定占位符 | `Prepare`<br>:46 | 不连库 | `ErrPlaceholderUnsupported` |
| 表范围 | `Prepare`<br>:49 | 不连库 | `ErrUnsupportedTable` |
| MySQL 版本 | :149 | 只读 | `ErrServerVersionMismatch`<br>+ 两侧版本 |
| 数据摘要 | :163 | 只读（扫全表） | `ErrSnapshotMismatch`<br>+ 两侧行数与摘要 |
| 表/列存在 | :182 | 只读 | `ErrTableMissing`<br>/ `ErrColumnMissing` |
| **创建索引** | :209 | **写** | 见后半段 |
| **ANALYZE** | :120 | **写** | 见后半段 |

**七个只读门禁全部通过，才允许第一个写操作。**

---

## 六、第五步：已有索引怎么处理

ensureCandidateIndex :209。三个分支，返回 `(created bool, err error)`：

```go
actual, err := existingIndex(ctx, db, p.Spec.IndexName)
expected := expectedIndex(p.Spec)
if len(actual) > 0 {
    if !sameIndex(actual, expected) {
        return false, fmt.Errorf("%w: %s", ErrIndexDefinitionConflict, p.Spec.IndexName)
    }
    return false, nil
}
if _, err := db.ExecContext(ctx, p.DDL); err != nil {
    return false, fmt.Errorf("create candidate index %q: %w", p.Spec.IndexName, err)
}
return true, nil
```

| 当前情况 | 行为 | `created` |
| --- | --- | --- |
| 没有同名索引 | 执行 DDL | `true` |
| 同名且定义一致 | 复用，不建 | `false` |
| 同名但定义不同 | 返回冲突错误 | 不生成成功报告 |

### 6.1 怎么读已有定义

existingIndex :227：

```go
SELECT COLUMN_NAME, COLLATION FROM information_schema.STATISTICS
WHERE ... INDEX_NAME = ?
ORDER BY SEQ_IN_INDEX
```

`ORDER BY SEQ_IN_INDEX`**是这段的灵魂。** 索引的第 1、2、3 列在 `STATISTICS` 表里是**多行**，每行带一个 `SEQ_IN_INDEX`。不排序的话，读出来的列顺序是乱的，`(status, amount_cents)` 可能被读成 `(amount_cents, status)`。

方向从 `COLLATION` 字段读：

```go
var collation sql.NullString
direction := "ASC"
if collation.Valid && collation.String == "D" {
    direction = "DESC"
}
```

**MySQL 8.0 的**`STATISTICS.COLLATION`**列装的是**`'A'`**/**`'D'`**/**`NULL`**，表示索引列方向，不是字符串的字符校对规则。** 这是 MySQL 文档里最反直觉的字段之一。用 `sql.NullString` 是因为老版本这个列可为 NULL。

### 6.2 为什么不能只看索引名

```go
func sameIndex(actual, expected []indexColumn) bool {
    if len(actual) != len(expected) { return false }
    for i := range actual {
        if actual[i] != expected[i] { return false }
    }
    return true
}
```

**逐列比较列名 + 方向**（`indexColumn` 结构体直接 `!=`）。

这两个索引同名但**不是同一个方案**：

```text
(status ASC, amount_cents DESC)
(amount_cents DESC, status ASC)
```

只看名字就会误判为"已存在，复用"，然后 EXPLAIN 出的计划会被当成"本次候选的效果"——**其实是错的索引的效果**。

`ErrIndexDefinitionConflict`**是拒绝，不是降级。** 不会试图删掉重建。原因：删除是破坏性操作，可能影响其他依赖它的查询。让上层看到冲突，人来决定。

### 6.3 这个三分支解决了什么问题

- **重复运行不重复建索引**（同一候选第二次跑，直接复用）；
- **不能用"已存在"偷渡另一个定义**（定义不符就报错）；
- **不会偷偷删重建**（避免破坏性操作）。

**用真实报告验证这个分支确实生效了。** 项目里有两份报告：

| 报告 | `candidate_index.created` | 生成时间 |
| --- | --- | --- |
| `candidate_explain_report.json` | `true` | 12:38:14 |
| `explain_comparison_report.json` | `false` | 13:12:43 |

**第一份是真的执行了**`CREATE INDEX`**，第二份是复用已有的。** 13:12 那次跑的时候，索引已经在 12:38 那次建好了。这就是中间分支的证据。

**一个必须记住的副作用**：创建索引**已经实际改变了 candidate**。如果后面的 `ANALYZE` 或 `EXPLAIN` 失败，**索引不会自动撤销**。下一次运行会再次看到"同名索引已存在"，走复用分支。这是有意的——保留证据状态，让人能看到上一次跑了什么。

**这里比较的只是列名、顺序、方向。** 不要笼统说成"检查了所有索引属性"（`CARDINALITY`、`VISIBLE`、`STATS` 都没比）。

---

## 七、第六步：为什么建完索引还要 `ANALYZE TABLE`

gate.go:120：

```go
if _, err := g.Candidate.ExecContext(ctx, "ANALYZE TABLE `orders`"); err != nil {
    return Report{}, fmt.Errorf("analyze candidate table: %w", err)
}
```

**三个操作必须分清：**

| 操作 | 做什么 |
| --- | --- |
| `CREATE INDEX` | 增加访问结构 |
| `ANALYZE TABLE` | 刷新统计信息 |
| `EXPLAIN` | 看优化器打算怎么走 |

**优化器选计划靠成本估计，成本估计靠统计信息。** 刚建好的索引，如果没有统计信息，优化器可能认为它没价值，或者用错误的基数估计。`ANALYZE` 让 MySQL 重新采集键分布并存入统计。

**特别不要把这两个当成同一件事：**

```sql
ANALYZE TABLE orders;              -- 刷新统计信息
EXPLAIN ANALYZE SELECT ...;        -- 实际执行并带运行期统计的计划
```

**前者是元数据操作，后者会真的执行查询。** 项目里两处都用的是不带 `ANALYZE` 的 `EXPLAIN FORMAT=JSON`——**普通 EXPLAIN，不执行查询**。这个区别在安全约束里很重要：只读 SQL 准入保证不写，`EXPLAIN`（无 `ANALYZE`）保证不改。

**一个值得注意的不对称**：`ANALYZE`**只在 candidate 侧执行**，baseline 没有。为什么？

- candidate 刚加了新索引，必须重新采集新索引的统计，否则优化器可能不用它；
- baseline 没加索引，它的 `ALL` 全表扫描估计来自表级统计（行数、选择性 10%），本来就在那儿。

但这也意味着**两侧的统计采集时机不完全对称**。这是当前实现的现实，不是理论上的最优。

---

## 八、第七步：取两侧 EXPLAIN

### 8.1 candidate 计划（gate.go:123-129）

```go
var explain string
if err := g.Candidate.QueryRowContext(ctx, "EXPLAIN FORMAT=JSON "+p.SQL).Scan(&explain); err != nil {
    return Report{}, fmt.Errorf("explain admitted SQL: %w", err)
}
if !json.Valid([]byte(explain)) {
    return Report{}, errors.New("MySQL returned invalid EXPLAIN JSON")
}
```

`Scan(&explain)` 把数据库返回的**计划文本**放进 Go 字符串。

**这里返回的是计划，不是那 20 条订单。** 真实报告里 `explain_json` 是一段描述执行计划的 JSON，没有一条 `orders` 的业务数据。

**多一道**`json.Valid`**检查。** 为什么要？因为下一步 `json.RawMessage(explain)` 只是字节包装，不验证。这里提前拦下"数据库返回了非 JSON"的情况，避免错误延后到写盘阶段才暴露。

### 8.2 组装 `Report`（:130-139）

```go
return Report{
    GeneratedAt:                 time.Now().UTC().Format(time.RFC3339),
    EvidenceLevel:               "L1",
    EligibleForPerformanceClaim: false,
    MySQLVersion:                version,
    Snapshot:                    Snapshot{Digest: gate.Digest(), Rows: gate.Rows()},
    SQL:                         SQLInput{SQL: p.SQL, Signals: p.SQLSignals},
    Candidate:                   CandidateIndex{... Created: created},
    ExplainJSON:                 json.RawMessage(explain),
}, nil
```

**注意**`EvidenceLevel: "L1"`**和**`EligibleForPerformanceClaim: false`**在这里就写死了。** 和 S1 讲过的管线一致——**结构体注释（:84-85）直接说明原因**：*"Report deliberately has no performance verdict. EXPLAIN plus schema is L1 plan evidence, not a benchmark result."*

**这个**`Report`**里没有 baseline 的 EXPLAIN。** 因为 baseline 的计划在下一步才取。

### 8.3 回到外层取 baseline 计划（pipeline.go:81-85）

```go
var baselineExplain string
if err := dbs["baseline"].QueryRowContext(ctx, "EXPLAIN FORMAT=JSON "+prepared.SQL).Scan(&baselineExplain); err != nil {
    return shadowgate.Report{}, nil, fmt.Errorf("explain baseline SQL: %w", err)
}
return candidateReport, []byte(baselineExplain), nil
```

**所以真实执行顺序是：candidate 计划 → baseline 计划。** 架构图上 baseline 画在左边不代表它先执行。

**注意 baseline 侧没有**`json.Valid`**检查。**`PlanCompare` 的 `Parse` 会验证。这是个轻微的不一致，但下游会兜住。

**注意 baseline 的 EXPLAIN 用的是**`prepared.SQL`**，和 candidate 完全相同的字符串**——包含结尾的分号。真实报告里 `sql_input.sql` 结尾就是 `LIMIT 20;\n`。MySQL 接受 `EXPLAIN` 后跟带分号的 SQL。

---

## 九、用真实数字看计划变了什么

现在打开项目里的 `explain_comparison_report.json`，两份计划的对照：

| 项 | baseline | candidate |
| --- | --- | --- |
| `access_type` | `ALL`<br>（全表扫描） | `ref`<br>（索引查找） |
| `key` | *(无)* | `idx_cand_status_amount` |
| `possible_keys` | *(无)* | `[idx_cand_status_amount]` |
| `used_key_parts` | *(无)* | `[status]` |
| `rows_examined_per_scan` | `992595` | `496809` |
| `rows_produced_per_join` | `99259` | `496809` |
| `filtered` | `10.00` | `100.00` |
| `using_index` | `false` | `true` |
| `using_filesort` | `true` | `false` |
| `query_cost` | `100982.00` | `54649.98` |
| `data_read_per_join` | `131M` | `655M` |

**逐条翻译：**

**① 访问方式：**`ALL`**→**`ref`**。** baseline 全表扫 99 万行；candidate 走索引按 `status='paid'` 查找。这是访问路径的根本变化。

**②**`used_key_parts: ["status"]`**。** 只有 `status` 参与查找。`amount_cents`**没参与二级查找**——它的作用是覆盖和排序，不是查找。

**③**`using_index: true`**。** 覆盖索引。`id`（主键隐式在二级索引叶子节点里）、`status`、`amount_cents` 三列全在索引里，**不用回表**。`data_read_per_join` 从 `131M` 变成 `655M`——这个数字**反而变大**，因为它表示"为了产出这些行，索引里要读的字节数"；索引条目本身要读，但不用再去堆里读整行。这个数字的解读要看上下文，不能单独当好坏指标。

**④**`using_filesort: false`**。** baseline 有额外排序，candidate 没有。机制：`status='paid'` 的索引条目本身按 `amount_cents DESC` 排列（因为第二列方向是 DESC），扫描索引就是有序输出，优化器判定不需要 filesort。

**⑤**`rows_examined_per_scan`**：**`992595`**→**`496809`**。** 这是**估计扫描行数**，不是实际行数。

**⑥ 这里有个值得停下来看的矛盾**：baseline 用 `filtered: 10.00` 估算出 99259 行 `paid`；candidate 用 `filtered: 100.00` 估算出 496809 行 `paid`。**同一个问题"有多少行是 paid"，两侧给出 99259 和 496809 两个差 5 倍的估计。**

原因是估计方法不同：baseline 用表级统计猜"10% 的行是 paid"；candidate 用索引里 `status` 的实际分布。**索引统计通常更准，但两侧的计划估计口径不同，所以行数不能直接当成"真实 paid 行数"比较。**

这也解释了为什么 `rows_examined_per_scan` 的比较叫"估计扫描减少"，而不是"实际扫描减少"。

**⑦**`query_cost`**：**`100982.00`**→**`54649.98`**，约 54%。** 但这是优化器的成本模型输出，**不是测量**。

### 一个非常重要的诚实观察

项目里有两份报告的 candidate 数字**不一样**：

| 报告 | `rows_examined_per_scan` | `query_cost` |
| --- | --- | --- |
| `candidate_explain_report.json`<br>（12:38） | `495956` | `54556.15` |
| `explain_comparison_report.json`<br>（13:12） | `496809` | `54649.98` |

**两次运行、同一份数据、同一个索引，估计值就漂移了。** 这就是为什么单份 EXPLAIN 报告**不能用来声称性能收益**——连优化器的估计数字都不稳定，测量必须靠重复采样。

---

## 十、`BuildReport` 提取什么

compare.go:87。

```go
baseline, err := Parse(baselineRaw)
candidate, err := Parse(candidateRaw)
```

包注释（:1-3）说明了定位：*"extracts a deliberately small, stable view from MySQL EXPLAIN FORMAT=JSON output. The raw plans remain in the report because this package is not a complete MySQL plan AST."*

**故意只提取一个小而稳定的视图，原始计划完整保留。** 因为它不是 MySQL 计划 AST 解析器——MySQL 的 EXPLAIN JSON 结构复杂且版本相关，全解析既做不到也不稳定。

### `Parse` 的两个细节（compare.go:116）

```go
dec := json.NewDecoder(bytes.NewReader(raw))
dec.UseNumber()
```

`UseNumber()`**很重要。** 默认 `encoding/json` 把所有数字解成 `float64`，会丢精度。EXPLAIN 里的行数估计可能是大整数，用 `float64` 会有精度问题。`UseNumber` 保留原始数字表示。

后面 `int64Field`（:177）同时处理 `json.Number` 和 `string` 两种形态——因为 MySQL 不同字段可能返回数字或字符串（比如 `cost_info` 全是字符串，`rows_examined_per_scan` 是数字）。

```go
var trailing any
if err := dec.Decode(&trailing); err == nil {
    return Plan{}, fmt.Errorf("trailing JSON value")
}
```

**又是尾随值检查。** 项目里的严格 JSON 双检模式，第四次出现了。

### `walk`：递归提取（:132）

```go
func walk(node any, summary *Summary) {
    switch value := node.(type) {
    case map[string]any:
        if filesort, ok := value["using_filesort"].(bool); ok && filesort {
            summary.UsesFilesort = true
        }
        if tableName, ok := value["table_name"].(string); ok {
            summary.Tables = append(summary.Tables, TableAccess{...})
        }
        for _, child := range value { walk(child, summary) }
    case []any:
        for _, child := range value { walk(child, summary) }
    }
}
```

**递归遍历整棵 JSON 树，不预设结构。** MySQL 计划的结构在不同版本、不同查询形态下差别很大（`ordering_operation`、`nested_loop`、`materialization`...），硬编码路径会碎。递归扫描 + 遇到关键字段就提取，是**对不确定的输入结构的稳健应对**。

注释（:115）：*"Unknown plan nodes are intentionally ignored."* —— 不认识的节点直接忽略，不报错。

`using_filesort`**用 OR 累积**（`if ... && filesort { summary.UsesFilesort = true }`）—— 计划里**任何一层**出现 filesort，就认为有 filesort。保守方向：宁可报有，不报没有。

`RowsExaminedPerScan`**是**`*int64`**（指针）。** 解析不出来就是 `nil`，而不是 `0`。**区分"没有这个字段"和"值是 0"**，这在诊断阶段会用到。

### `Diff`（:203）

```go
BaselineUsesFilesort  bool
CandidateUsesFilesort bool
FilesortChanged       bool
BaselineKeys          []string
CandidateKeys         []string
CandidateOnlyKeys     []string
```

**注意**`CandidateOnlyKeys`**的含义**：candidate 用了、baseline 没用的索引。

真实报告的 `difference`：

```json
{
  "baseline_uses_filesort": true,
  "candidate_uses_filesort": false,
  "filesort_changed": true,
  "baseline_keys": [],
  "candidate_keys": ["idx_cand_status_amount"],
  "candidate_only_keys": ["idx_cand_status_amount"]
}
```

**三个事实：filesort 消失了、访问索引变了、优化器选了候选索引。**

`uniqueKeys`**最后**`sort.Strings(out)`**（:237）。** 去重后排序，保证输出顺序稳定。否则 map 遍历顺序随机，报告不可复现。

**注意**`BuildReport`**只比较**`Summary`**，不比较**`Raw`**。**`Raw` 原样保留在报告里供人查。

`Report`**里补的两个哈希**（S1 讲过）：

```go
comparison.InputCandidateExplainSHA256 = digest(candidateBytes)
comparison.InputBaselineExplainSHA256 = digest(baselineRaw)
```

对照报告记录了"我基于哪两份计划得出结论"。

`BuildReport`**失败后是否继续？** 返回 `error`，管线 `stop("plan_compare", "plan_compare_rejected", err)`。但**前两步的工件已经写盘**。

---

## 十一、`Analyze` 是谁在分析

diagnosis.go:63。**确定性规则代码，这一步不调用大模型。**

包注释（:1-3）：*"It never connects to MySQL and never recommends or applies an index."*

### 先过三道输入门禁（:64-76）

```go
if input.EvidenceLevel != "L1" { return ... ErrEvidenceLevel }
if input.EligibleForPerformanceClaim { return ... ErrPerformanceEligible }
if strings.TrimSpace(input.SQL.SQL) == "" || input.Snapshot.Digest == "" {
    return ... errors.New("comparison report lacks SQL or snapshot evidence")
}
```

**第三道特别值得注意：输入已经**`EligibleForPerformanceClaim == true`**就拒绝。** 意思是：诊断不接受"已经声称性能收益"的报告作为输入。防止诊断阶段反过来给已有结论背书。

`decodeStrict`**又是双检**（:98-112）——`DisallowUnknownFields` + 尾随值。第五次。

`Source.SHA256`**是输入的哈希**（:78-85）：

```go
sum := sha256.Sum256(raw)
...
Source: Source{SHA256: hex.EncodeToString(sum[:]), ...}
```

诊断报告记录了"我基于哪一份对照报告得出假设"。S1 讲过管线传的是磁盘字节而不是内存对象，就是为了这个哈希能对得上。

### 三条推导规则（derive :115）

```go
if diff.BaselineUsesFilesort && !diff.CandidateUsesFilesort {
    out = append(out, hypothesis(CodeFilesortRemoved, ..., []Fact{
        {Field: "difference.baseline_uses_filesort", Value: "true"},
        {Field: "difference.candidate_uses_filesort", Value: "false"},
    }))
}
```

**每条假设都带着**`Facts`——字段路径 + 值。事后可追溯"为什么提出这个判断"。

三条：

| 代码 | 触发条件 | 真实报告的触发情况 |
| --- | --- | --- |
| `candidate_index_removes_filesort` | baseline 有 filesort 且 candidate 没有 | ✅ 触发 |
| `candidate_index_changes_access_path` | `CandidateOnlyKeys`<br>非空 | ✅ 触发 |
| `candidate_index_reduces_estimated_scan` | 估计扫描可比较且 candidate 更少 | ✅ 触发 |

**真实报告里三条全部触发。**

### 第三条有个保守的门槛

comparableEstimatedRows :156：

```go
if len(baseline.Tables) == 0 || len(baseline.Tables) != len(candidate.Tables) {
    return 0, 0, false
}
for i := range baseline.Tables {
    b, c := baseline.Tables[i], candidate.Tables[i]
    if b.TableName != c.TableName || b.RowsExaminedPerScan == nil || c.RowsExaminedPerScan == nil {
        return 0, 0, false
    }
}
```

**只在"一一对应的表序列、表名相同、两侧都有估计值"时才比较。** 计划结构形状不同（比如一侧是 `nested_loop` 另一侧是全表扫）、或者缺字段，就**不出结论**。

注释（:154-155）：*"Unknown or differently shaped plans yield no claim."*

**返回**`bool`**而不是 panic 或默认值。** 未知形状 = 不出结论。这和前面 `RowsExaminedPerScan` 用指针是同一个思路：**区分"没有数据"和"数据是 0"。**

### 每条假设都带着"下一步要做什么"

```go
RequiredVerification: []string{
    "controlled_ab_measurement",
    "series_admission",
},
```

**机器可读的后续步骤。** 假设不是终点，它明确说"要做受控 A/B 测量 + 系列准入"。

### `Report` 里的 `Unresolved`（:91-94）

```go
Unresolved: []string{
    "EXPLAIN differences are plan evidence, not measured latency or write-cost evidence.",
    "Each hypothesis requires controlled_ab_measurement and series_admission before a performance claim.",
},
```

**报告自己声明"我没有证明什么"。** 这不是文档注释，是 JSON 里的字段，消费者必须读到。

\*\*`Report` 注释（:51-52）写得很直白：*"Report deliberately does not contain a recommendation."* —— 没有"建议建这个索引"这种字段。只有事实 + 假设 + 待验证项。

**失败后是否继续？**`Analyze` 返回 error → 管线 `stop("diagnosis", "diagnosis_rejected", err)`。前三份工件已写盘。

---

## 十二、把 EXPLAIN 和 bench 分开

这一阶段的实际调用链是：

```text
输入 → 候选索引 → 双侧计划 → 比较 → 诊断
```

独立的 `bench` 做的是：

```text
环境检查 → 预热 → 交替采样(B→C→B→C) → 完整消费查询结果 → 统计 → 方向判定 + 证据准入
```

runner.go:90 的 `execOnce` 注释写得很清楚：

必须走 QueryContext 并真正遍历、Scan、检查 rows.Err、关闭 rows：只发出查询而不读取，测到的只是服务端开始响应的时间，而候选索引省掉的 filesort 与随机回表恰恰体现在取回这 20 行的过程中。

**这句话正好解释了本例记录的现象**：`using_filesort` 从 `true` 变成 `false`、`using_index: true` 避免回表——这些"省下来的工作"发生在**取回结果的过程中**。如果只测"服务端开始响应"的时间，这个收益测不到。

**两个必须分清的调用关系：**

1. `pipeline.Run` **不调用** `bench`**。** 确认过：`internal/pipeline/pipeline.go` 的 import 里没有 `measure`，只有 `shadowgate`/`plancompare`/`diagnosis`/`sqladmit`。
2. `bench` **用的是固定的** `DefaultCase()`**，不是本例 SQL。** runner.go:51：

```go
func DefaultCase() QueryCase {
    return QueryCase{
        Name: "hot_user_paid_recent_desc",
        SQL:  defaultSQL,
        Args: []any{caseUserID, caseStatus, caseCreatedAtFrom},
    }
}
```

这是**另一个查询**（三参数的 `hot_user_paid_recent_desc`），不是本节的 `status='paid' ORDER BY amount_cents DESC LIMIT 20`。

**你要把这两条入口读清楚，不要在脑里补出一条不存在的调用。** 本例 SQL 只走过 EXPLAIN 路径，从没被 bench 测量过。

**还有一处架构上的呼应**：`shadowgate` 的 `Gate.Run` 和 `measure` 的门禁用的是**同一套**`SnapshotGate`、`ErrSnapshotMismatch`、`ErrServerVersionMismatch`（`shadowgate` import 了 `measure`）。意思是：**EXPLAIN 和 bench 都不能跳过环境和数据一致性门禁。** L1 和 L2 共享同一个前提检查。

---

## 执行计划验证的结果与边界

### 三条机制笔记

**1. 两侧快照不同 → 返回错误，不创建候选索引。**

- 机制：`identicalSnapshots` 分别调 `snapshot.Compute`，比较 `Rows` 和 `Digest` 两个值。
- 关键：这是**第三个只读门禁**，排在 `ensureCandidateIndex` 之前。
- 证据：失败信息带两侧行数和完整 64 位摘要，如 `baseline rows=1000000 digest=... candidate rows=999999 digest=...`。
- 代码：gate.go:163、snapshot/compare.go:33。
- 摘要为什么可靠：字段间加 `0x1f` 分隔、时间规范化到微秒 UTC、NULL 和空串用 `0x00`/`0x01` 区分、按主键升序、游标分页避免 O(n²)。

**2. 索引同名但列序/方向不同 → 拒绝复用。**

- 机制：`existingIndex` 从 `information_schema.STATISTICS` 按 `SEQ_IN_INDEX` 读出实际列序和 `COLLATION`（`'D'` = DESC）；`expectedIndex` 从候选 spec 构造期望；`sameIndex` 逐列比较列名 + 方向。
- 关键：三分支是**建 / 复用 / 拒绝**，没有"删了重建"这个分支。
- 证据：项目里两份报告的 `candidate_index.created` 分别是 `true` 和 `false`，证明建和复用两个分支都真实执行过。
- 代码：gate.go:209。
- 副作用：`CREATE INDEX` 一旦执行就不撤销；后续步骤失败，索引留在 candidate 上，下次走复用分支。

**3. 计划变化 → 生成诊断假设，不自动声明性能收益。**

- 机制：`BuildReport` 提取 `access_type`/`key`/`rows_examined_per_scan`/`using_index`/`using_filesort` 五个字段；`Diff` 算出 `filesort_changed` 和 `candidate_only_keys`；`derive` 生成三条假设，每条带 `Facts`（字段路径 + 值）和 `RequiredVerification`（`controlled_ab_measurement`、`series_admission`）。
- 关键：`Analyze` **拒绝** `EligibleForPerformanceClaim == true` 的输入；`Report.Unresolved` 显式声明未证明的部分；`Report` 结构里**没有 recommendation 字段**。
- 证据：两份 candidate 报告的 `rows_examined_per_scan` 分别是 `495956` 和 `496809`——同一份数据、同一个索引，估计值就漂移了。单份 EXPLAIN 连优化器自己的估计都不稳定。
- 代码：compare.go:87、diagnosis.go:63。

---

### 候选索引验证链路小结

SQL Sentinel 把原有方案和候选方案放在 baseline、candidate 两个独立数据库里，避免增删索引反复污染实验过程。

输入先过四道不连库的检查——SQL 准入、绑定占位符、表范围、DDL 编译——然后连两个库，过三道只读门禁：MySQL 版本字符串精确一致、两侧数据行数和按主键升序算出的 SHA-256 摘要都一致、候选引用的表和列在当前库里真实存在。七个只读检查全过，才允许第一个写操作。

接着只在 candidate 上处理候选索引：同名索引不存在就执行编译好的 DDL，存在且列名与方向逐列匹配就复用，存在但定义不同就直接拒绝，不会删了重建。之后 `ANALYZE TABLE` 刷新统计，让优化器有依据评估新索引，然后分别取两侧 `EXPLAIN FORMAT=JSON`——只取计划，不执行查询。

代码从两份计划里递归提取五个字段并算出差异，再由确定性规则生成带事实引用的诊断假设，每条假设都声明"还需要受控测量和系列准入才能声称性能收益"。整个报告固定为 L1、不可声称性能收益，并且显式列出未证明的内容。

计划的改善只提供验证方向。要声称性能收益，必须走独立的 bench 入口做重复采样和证据准入——而 `pipeline.Run` 并不调用 bench，bench 用的是自己的固定查询样例，不是本例 SQL。

---

**S2 完成。** 下一任务 S3 如果要走，建议方向有两个：`bench` 的交替采样与 MAD 噪声标定（对应 `internal/measure`），或 `shadowgate` 与 `measure` 共享门禁的具体边界（`SnapshotGate` 的复用点）。

---

上一篇：[SQL Sentinel：SQL 输入接入与准入校验](/blog/sql-sentinel-input-admission)

下一篇：[SQL Sentinel：受限模型提案与 RAG 检索](/blog/sql-sentinel-model-rag)
