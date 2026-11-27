区分和 Tool 的关系 :

一句话区分：

- Tool：一个“可调用能力”
- MCP：把外部能力标准化接入 Agent 的“通信协议”
- MCP Server：真正实现这些能力的“服务端程序”
- Skill：教 Agent 在什么场景、按什么步骤、如何安全地使用能力的“操作手册 / SOP”
- Agent：负责理解目标、选择 Skill、调用 Tool、根据结果继续决策的执行者

可以这样看：

```text
用户目标
  ↓
Agent / 模型
  ↓ 参考
Skill：遇到这类任务的流程、约束、经验
  ↓ 选择并调用
Tool：如 read_file、run_sql、click、send_email
  ↓ 通过 MCP 协议通信
MCP Client  ↔  MCP Server
                    ↓
              真正的函数、数据库、浏览器、GitHub API
```

你说的 “info \+ func” 基本是对的。一个 Tool 通常包含两部分：

```text
tool = {
  name: "create_issue",
  description: "在 GitHub 创建 Issue",
  inputSchema: { ... }  // info：参数是什么、怎么传
}

function createIssue(args) {
  // func：真正调用 GitHub API
}
```

模型通常只看得到前半部分：名称、描述、输入结构。它不能自己执行函数。宿主程序收到模型的 tool call 后，才执行后半部分的真实函数，再把结果返回给模型。

MCP 的作用，是规定这套“发现能力—调用能力—返回结果”的通用方式。于是 GitHub、数据库、浏览器、文件系统等不必每个 Agent 框架都单独写一套连接器；只要对方提供 MCP Server，支持 MCP 的客户端就能接入。

所以：

```text
MCP ≠ 操作电脑
```

“操作电脑”只是某种 Tool。例如一个 Computer Use MCP Server 可以提供：

```text
screenshot()
click(x, y)
type(text)
scroll(direction)
```

这类 Tool 让 Agent 能操作 UI；但 MCP 本身也可以连接 SQL、Slack、GitHub、内部知识库，完全不涉及电脑屏幕。

Skill 又是另一层。它一般不负责“提供函数”，而是补足模型的程序性知识。例如一个发布 Skill 可能写：

```text
1. 先执行测试
2. 检查未提交改动
3. 不要把密钥写进配置
4. 使用 deploy 工具
5. 部署后请求 healthz
```

它解决的是：“有十个 Tool 时，何时选哪个、顺序如何、失败怎么处理、哪些操作禁止做”。

你可以用一个类比记忆：

- Tool 是“扳手”
- MCP 是“扳手接口标准 \+ 工具箱与使用者之间的通信规则”
- MCP Server 是“生产并实际提供扳手的工具箱”
- Skill 是“维修手册”
- Agent 是“维修工”

因此，一个成熟 Agent 往往是：

```text
模型推理 + Skills 的流程约束 + Tools 的能力 + MCP 的标准接入
```

它们不是互相替代，而是分别解决“怎么想、怎么做、怎么连接、怎么安全做好”的问题。
