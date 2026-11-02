# 本地博客助手接入

日期：2026-10-31。状态：本地接入完成，模型服务由作者后续自行配置；未发布。

浏览入口：`http://127.0.0.1:2025/assistant`。页头“问博客”或 Ctrl/Command+K 搜索“助手”也可进入。它介绍博客功能、页面入口及使用方式，不收录具体文章正文或项目 README，也不控制仍在制作中的 Zenix Live2D 人物。

Go 服务独立位于 `C:/Users/17hwliao/Documents/ChatGPT/blog/blog-agent`，默认端口 4180。博客浏览器只请求同源 `/api/agent/{config,features,search,chat,conversation}`；Next.js 代理到本机 Go，保留 SSE 和取消行为，只转发助手自己的会话 Cookie。该 Cookie 在博客侧限定为 `/api/agent` 路径。其他博客或 GitHub 凭据不会转发。

在 Go 项目目录启动：

```powershell
./tools/start-local.ps1
```

脚本复用已启动的端口；没有服务时构建 Go 并以隐藏窗口启动 Go 与 Next.js。本地模型配置文件是 Go 项目的 `.env.local`，不在本博客中配置模型密钥。需要填写：

```dotenv
AGENT_BASE_URL=https://你的兼容服务/v1
AGENT_MODEL=模型标识
AGENT_API_KEY=你的密钥
AGENT_TOKEN_FIELD=max_tokens
AGENT_MAX_TOKENS=1800
```

使用支持工具调用的 OpenAI 兼容服务；部分供应商需要把 `AGENT_TOKEN_FIELD` 改成 `max_completion_tokens`。填写后运行 `./tools/start-local.ps1 -RestartAgent`。进程环境变量优先于文件。可显式执行 `go run ./cmd/check-model` 检查完整 ADK 问答；此命令在已配置时可能执行最多 4 次模型调用，正常启动不会自动探测模型。

博客端可用服务端变量 `AGENT_SERVICE_URL` 指定本机 Go 地址。开发模式未配置时默认 `http://127.0.0.1:4180`；生产模式无隐式默认值。本轮仅支持本地回环服务，公网代理与鉴权不在此次范围。

已验证：Go 34 项测试、博客助手 7 项定向测试、TypeScript、12 项本地浏览器链路检查（包括实际检索、来源跳转、会话追问、故障、断流、取消、主题和窄屏）。模型适配器使用本地 HTTP 模拟供应商验证工具调用与输出长度参数，真实免费服务尚未配置或测试。

博客完整测试另有既有缺口：`tests/article-presentation.test.cjs` 将文章总数写死为 204，当前索引为 205。该断言与文章数据不属于本次助手改动，保持实际失败记录，不宣称完整测试通过。Go 项目 `verification/local-integration-checks.md` 保存本轮细节。
