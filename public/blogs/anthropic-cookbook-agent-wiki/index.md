> 相关笔记：[Agent 记忆：Transcript、Notes 与 Wiki 的分层设计](/blog/agent-memory-wiki-dreaming)。这一篇更偏工程实现，主要对照 Anthropic 的 knowledge-wiki 与 dreaming 两条 cookbook。

如果把 RAG 理解成“每次提问都去资料里现查”，那么 Anthropic 的 Agent Wiki 更像“提前把资料读成一张带索引、带出处、带冲突标记的笔记网”。

这两者解决的不是同一个问题。RAG 优化的是**检索路径**，Wiki 优化的是**知识组织**。前者让模型更容易找到相关段落，后者让模型不用每次重新理解同一批资料。

## 一、为什么从 RAG 走向 Wiki

向量 RAG 的典型链路是：切块、embedding、相似度召回、塞进上下文。它擅长找“相关段落”，但有三类事实很难靠单段召回得到：

- 两个文档对同一个指标用了不同口径，需要比较后才能回答。
- 同一家公司在不同文件里有不同名字，需要实体归一。
- 后一份文件修正了前一份文件的数字，需要判断当前值和历史值。

这些问题的共同点是：**答案不在任何单个 chunk 里，而在 chunk 之间的关系里。**

所以 cookbook 的思路不是提高召回率，而是提前把关系读出来、写下来。

Anthropic 用了一个认知科学类比：海马体在经历发生时快速记录，睡眠期间大脑重放近期经历，把重要的部分巩固到新皮层。对应到 Agent：

- **Session / transcript**：当下的经历。
- **Memory notes**：当下判断“值得记”的片段。
- **Dreaming**：会话之间的离线整理。
- **Wiki / memory representations**：巩固后的长期知识。
- **Injected context**：下次会话自动带上的少量索引。

这个类比决定了一个关键设计：**写入和整理分开。** 会话中只做快速记录，不做大规模重构；整理放到会话之外，用独立算力慢慢做。这样既不影响主任务，也允许反复校验。

文章里还有一句话很关键：**记忆是对未来的预测。** 写下一个规则，等于预测未来还会遇到类似情况；写下一个事实，等于预测未来会直接依赖它，而不重新验证。所以记忆一定会错，也一定会过时。这就是为什么 Wiki 不能只写，还必须能回读原文校验。

## 二、两条 cookbook，两种输入

### 1. knowledge-wiki：文档到 Wiki

适用场景：一批慢变文档，被反复提问，且问题经常需要跨文档综合。

整个构建是一个 dynamic workflow，由 lead agent 写工作流并启动，分为四个阶段：

```text
extract  →  resolve  →  analyze  →  organize
```

角色分工：

- **extractor**：每个 batch 一个，读文档并写入 Wiki。
- **resolver**：所有 batch 抽取完后运行一次，处理 open questions。
- **analyzer**：每个 batch 一个，拿 Wiki 回读原文，校验、补充、纠错。
- **organizer**：最后单独运行，合并重复、修链接、补索引。

官方示例的 `core` 数据集是 8 份文件、2.8MB 文本，被切成 25 个 batch，最终是 25 个 extractor、1 个 resolver、25 个 analyzer、1 个 organizer。构建约 23 分钟，成本约 16 美元。

### 2. dreaming：会话到记忆

适用场景：Agent 已经跑了很多 session，需要把经验沉淀下来。

流程更短：

```text
transcript-analyzer（每个 transcript 一个）→ memory-organizer（一个）
```

它读的是 Agent 的历史会话，不是业务文档。官方示例里，11 个 transcript、283KB，成本约 0.36 美元、2.5 分钟；50 个长会话、约 12MB，成本约 8 美元、10 分钟。

这条流水线重点记录：

- 命令、参数、文件路径这类“下次还会用到”的事实。
- 决策及其原因。
- 踩过的坑和失败路径。
- 带日期的过时关系：旧值保留，新值标注 `valid_from`。

## 三、Wiki 的数据模型

Wiki 的物理形态不是数据库，而是一个 memory store，里面是普通 Markdown 文件：

```text
_index.md                 全局目录，先读这个
_schema.md                布局与写作规则
SKILL.md                  怎么读这座 Wiki
escalations.md            风险清单

entities/<slug>.md        一个实体一个文件
relations/<doc-slug>.md   一份文档里的关系
metrics/<doc-slug>.md     一份文档里的指标
open_questions/<doc-slug>.md  尚未解决的问题
```

每个文件开头是 YAML frontmatter：

```yaml
---
name: payment-service
description: 支付服务的重试与降级策略
aliases: ["pay-svc", "支付网关"]
metadata:
  type: service
---
```

正文一行一条事实，末尾带出处：

```markdown
## Current picture
- 当前重试上限 3 次，超限进入死信队列 [source: run-2026-11-12 | as-of: 2026-11-12]

## Failure handling
- 网关超时后重试 3 次，仍失败进入死信队列 [source: run-2026-11-12 | as-of: 2026-11-12]
- 早期版本重试 5 次，因重复扣款降为 3 次 [source: incident-0918 | as-of: 2026-09-18]
```

几个细节很能体现设计意图：

- **一行一条事实**：方便 grep，也方便按行引用。
- **`Current picture` 最多 30 行**：长文件顶部只放当前最可能被问到的值。
- **`[[wikilink]]` 是边**：实体之间形成可导航的图。
- **`[source | as-of]` 是证据**：回答时必须能指回原文。
- **`CONFLICT` 不强行合并**：两个来源冲突时保留双方和日期。

## 四、构建阶段的关键约束

cookbook 不是“让模型随便写”，而是加了很多硬约束。

**Schema 先行。** `_schema.md` 是 store 的第一个 memory，所有 Agent 先读它。它规定目录、slug、frontmatter、事实格式和链接写法。

**单写者规则。** `relations/`、`metrics/`、`open_questions/` 只能写自己文档对应的文件，避免并发覆盖。共享实体节点采用“读、合并、回读确认”的方式。

**Batch 控制。** 每个 batch 约 12 万字符，大文档切成多段，每段保留 provenance header。这样单个 Agent 不会因为上下文过大而漏读。

**原文优先。** extractor 只记录文档实际写了什么；不确定的放 `open_questions`，不猜。合同类文档要求关键条款逐字保留，不能只写摘要。

**时间纪律。** 新值覆盖旧值时，不删除旧值，而是用 `valid_from` / `valid_to` 标注；这样历史问题和当前问题都能回答。

**不记录“全局不存在”。** 只能说“这份文档里没有”，不能说“世界上没有”。这是一个很容易被模型违反、但在尽调场景非常致命的约束。

**Analyzer 回读校验。** analyzer 不是“再总结一遍”，而是拿 Wiki 里的每条 claim 回原文找证据：

- 有证据：保留。
- 证据不足：降级或标注不确定。
- 原文矛盾：标 `CONFLICT`。
- 原文更新：保留旧值作为历史。

**Organizer 只整理，不分析。** 它合并重复文件、重命名、修断链、补 `_index.md`、更新 `SKILL.md`，但不删除事实行。合并时用 `MOVED TO [[slug]]` 占位，避免并发写丢失。

## 五、查询阶段：没有 embedding，怎么找记忆

查询侧的 Wiki 是**只读挂载**。每个问题开一个全新 session，Agent 只能读，不能写。

读取顺序是固定的：

1. 先读 `_index.md` 前 60 行，找到相关入口。
2. 如果目录里没有名字，用 `glob` 找文件、用 `grep` 搜内容。
3. 打开文件先读前 60 行，看 `Current picture`。
4. 需要细节再定位到某个 `##` 章节，只读需要的行。
5. 顺着 `[[wikilink]]` 跳到相关实体。
6. 每条结论带 `[source | as-of]`。
7. 遇到 `CONFLICT` 就报告冲突。
8. 找不到就说 `Not in the wiki`，并指出缺哪份文档。

所以它的召回是三种通道的组合：

> **目录（预计算的相关性）+ grep（精确匹配）+ 链接（图扩散）**

这解释了它为什么在某些任务上比向量检索强：

- 精确标识符不会被“语义相近”搞混。
- 跨文档关系已经提前建好，不需要查询时再拼。
- 每条事实有出处，冲突不会被摘要抹平。

但它也解释了为什么它不适合所有场景：**建库成本被提前支付了。**

## 六、cookbook 自己总结的设计规则

notebook 最后有一段 “Design rules our runs support”，比模型选择更值得记住：

1. **事实的正确性主要在抽取阶段决定。** 规则要花在 extractor 上，而不是指望查询时补救。
2. **Wiki 是写给一个只能看到 Wiki 的读者。** 查询 Agent 看不到原始文档，所以 Wiki 必须自包含。
3. **“没有”永远只是一个待验证假设。** 抽取、回答、评分甚至人工答案键都可能错误地声称“未披露”。
4. **检查实际跑了什么，而不是描述了什么。** 不要相信 lead agent 的叙述，要对照平台记录检查每个 batch 是否真的被读取。
5. **排版要照顾按行付费的读者。** 索引顶部放地图，长文件顶部放 `Current picture`，风险文件顶部放摘要。

这几条其实比“用哪个模型”更重要。Wiki 的质量上限，主要取决于 schema、抽取规则和校验流程。

## 七、当前的局限

cookbook 没有回避这些问题，反而在文档里写得很清楚。

- **构建贵且慢。** 8 份文件就要 23 分钟、16 美元；它适合高价值、慢变、重复提问的知识，不适合每天新增大量文档的场景。
- **新鲜度是硬伤。** 新文档需要重新 build；会话记忆靠 dreaming 增量更新。它不是实时索引。
- **并发写仍会丢内容。** 共享实体页是并发写热点，官方承认最繁忙的页面大约有 5% 的行会丢失。
- **会过度抽象，也会抽象不足。** 有的任务里 Wiki 长得比原始文档还大；有的关键合同事实因为共享表格被覆盖，57 条只剩 41 条。
- **评测依赖任务。** 跨文档综合、重复提问收益明显；单文档可检索的问题，Wiki 不一定更好。
- **平台绑定。** knowledge-wiki 跑在 Managed Agents 的 memory store 和 dynamic workflow 上；Dreams 目前是 research preview，不支持 ZDR/HIPAA，有模型和额度限制。
- **治理成本高。** schema 要设计，prompt 要调，写入要防注入，冲突要人工兜底，版本要审计。

## 八、未来的发展方向

### 1. 从手写 workflow 到平台原语

Dreams API 已经把“读 memory store + 读 1 到 100 个 session，输出一个新 store”做成了异步任务：

- 输入 store 不被修改。
- 输出 store 可以审查、丢弃或替换。
- 支持 `instructions` 做高层 steering，但不支持“改某一行”这种精确编辑。

未来大概率会补齐：定时 dreaming、增量 dreaming、只处理最近变化的记忆、输出 store 的 diff/review/merge，以及更细的写入权限。

### 2. 记忆分层会越来越像缓存体系

```text
Injected context   ← L1，每次会话都带
Wiki / index       ← L2，按需导航
Notes              ← L3，热数据
Transcripts        ← L4，冷存储 / ground truth
```

未来会根据访问频率、变化频率、冲突率，自动决定哪些内容上升，哪些内容下沉。这其实和 CPU 缓存、数据库的 hot/cold storage 是同一类问题。

### 3. 从单 Agent 记忆走向团队共享记忆

一个 session 已经可以挂 8 个 store，这暗示了未来的组织方式：

- 一个用户一个 store。
- 一个团队一个 store。
- 一个项目一个 store。
- 一份只读的公共规范 store，挂给所有 session。

接下来会出现更多“记忆所有权”问题：谁能写、谁负责清理、冲突由谁裁决、员工离职后记忆怎么迁移、多租户之间怎么隔离。

### 4. 评测会从“答对没有”扩展到“记忆质量”

除了准确率，还要看：

- 事实召回率、精确率。
- 过时事实比例。
- 冲突识别率。
- 引用可追溯率。
- 每回答一次的成本和 token。
- 记忆写入后的回归率。

没有这些指标，Wiki 很容易变成“看起来很有条理，但实际不可靠”的知识库。

### 5. 安全与治理会成为核心竞争点

只要记忆可写，就有新的攻击面：

- 文档或工具结果里的 prompt injection 被写进记忆。
- 恶意内容通过共享 store 影响其他用户。
- PII、密钥、内部信息被持久化。
- 错误记忆被反复引用，形成“记忆投毒”。

所以未来大概率会出现：默认只读、写入白名单、来源签名、写入前审查、敏感级别分区、TTL 和删除权、完整审计日志和版本回滚。

### 6. 不会取代向量检索，而是形成混合架构

最现实的未来不是“Wiki 一统天下”，而是：

- 向量 / BM25：负责模糊语义、长尾问题、快速召回。
- Wiki：负责跨文档综合、稳定结论、冲突和历史。
- 知识图谱：负责实体关系和多跳查询。
- SQL / 数据仓库：负责精确数值和聚合。
- Agentic retrieval：根据问题选择走哪条路。

cookbook 的实验也支持这个判断：Wiki + search 比单独 Wiki 更好；单文档问题用 search 就够。

## 九、如果要自己落地

不要一上来就建 35 万文件的 Wiki。按 cookbook 的经验，最小可行路径是：

1. **先从 session 记忆开始**，不要先做文档 Wiki。
2. **只建三个东西**：`_index.md`、`notes/`、`entities/`。
3. **每个 session 一个 analyzer，每晚一个 organizer。**
4. **查询侧只读**，强制引用，找不到就说找不到。
5. **先量四个指标**：回答准确率、每题 token、过时事实比例、构建成本。
6. **确认“重复提问”足够多**，再考虑扩到文档 Wiki。

一个很实用的判断标准是：

> 如果同一批知识一个月内不会被问超过几十次，Wiki 的构建成本大概率收不回来；如果每天都在问，而且问题经常跨文档，Wiki 就很值得。

## 小结

Anthropic 的 cookbook 把“记忆”从一个检索技巧，变成了一个**有 schema、有写者约束、有回读校验、有版本审计的知识维护系统**。

它当前最适合“慢变、重复、跨文档”的高价值知识；未来会朝着平台化 dreaming、分层缓存、团队共享、混合检索和安全治理演进，但短期内不会取代向量 RAG，而是成为 RAG 之上的一层知识组织。

## 参考资料

- [The components of agent memory - Anthropic](https://www.anthropic.com/research/components-of-agent-memory)
- [Knowledge wiki with a dynamic workflow - cookbook](https://github.com/anthropics/claude-quickstarts/tree/main/managed-agents/knowledge-wiki)
- [Dreaming with a dynamic workflow - cookbook](https://platform.claude.com/cookbook/managed-agents-cma-dreaming-with-a-dynamic-workflow)
- [Dreams - Claude Platform Docs](https://platform.claude.com/docs/en/managed-agents/dreams)
- [Memory stores - Claude Platform Docs](https://platform.claude.com/docs/en/managed-agents/memory)
- [Workflow runs - Claude Platform Docs](https://platform.claude.com/docs/en/managed-agents/workflow-runs)
