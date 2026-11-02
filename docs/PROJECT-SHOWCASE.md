# 项目展示：本地开发版本

本轮范围：五个现有项目的展示内容与交互，所有变化留在本地。更新：2026-11-01。当前为四个完整项目、12 条操作链路和 33 张候选工作截图，保留全部画面供用户选择；PR 仍使用六章动态讲解与三种判定分支。详见 [多链路截图结果](PROJECT-CAPTURE-JOURNEYS.md)。

## 最低范围

- tRPC-Agent-Go 聚焦本人 PR #2091：六章讲解、三种真实报告分支、调用链对照、报告与代码来源；可播放、暂停、前后跳转、调速与重置。
- SQL Sentinel、AgentMesh、Zenix、TableCard 使用实际前端或实际 TUI 输出取图，标明示例数据与取图边界，支持缩略图切换及放大查看。
- 保留项目 README 和完整项目的原流程演示，以实现要点连接画面与代码；不恢复已删除的交互实验室。
- 窄屏、深色主题、键盘与减少动态效果可用。无自动播放音频、真实命令执行或远端写入。
- 提供可以自行启动、停止的本地预览脚本。本轮只做必要自动检查与无头渲染，不进行用户桌面操作。

## 预览

仓库根目录双击 `preview-projects.cmd`，或在 PowerShell 中运行：

```powershell
.\scripts\Start-ProjectPreview.ps1
```

默认只在后台启动本地服务并打印地址，不自动打开浏览器。

- 项目列表：`http://127.0.0.1:2025/projects`
- PR 讲解：`http://127.0.0.1:2025/projects/trpc-agent-go`
- 画面展示：将末尾项目名替换为 `sql-sentinel`、`agentmesh`、`zenix`、`table-card`。

端口被其他程序占用时可传 `-Port 2026`；确实希望启动后打开浏览器时传 `-Open`。停止由脚本启动的服务：

```powershell
.\scripts\Stop-ProjectPreview.ps1 -Port 2025
```

脚本会核对进程身份，只停止自己启动的服务。若复用的是原本已运行的博客服务，不会接管或终止该服务。依赖沿用仓库的 node_modules，不自动安装、不启动项目后端，不推送 GitHub。

## 内容与组件

- `src/content/project-showcases.ts`：共享展示契约与 PR 分支、章节；`project-working-evidence.ts` 维护五个项目的优势与取图记录，与可编辑的项目基础资料分开。
- `ProjectContribution`：PR 的只读讲解器，基于已有报告呈现结果，不在浏览器执行命令或代替真实审批。
- `project-capture-journeys.ts`：链路顺序、步骤和新增截图，覆盖全部 33 张工作画面；图片与来源哈希见 `project-showcase-captures.json`。
- `ProjectGallery`：全部画面 / 按链路查看、步骤标识、实际操作与结果、取图说明、失败重试、放大、原图入口、链路内键盘切换与关闭恢复。支持 `#shot-<id>` 定位，跨链路证据跳转自动回到全部画面；缩略图选择后返回主图并转移焦点。
- `ProjectAdvantages`：每项优势分别说明使用价值、实现方式和可核对依据；点击证据定位到相应画面。
- 详情页：项目概述与优势速览 → PR 讲解 / 实际工作画面 → 核心优势与依据 → 可主动展开的原流程演示 → README。
- `src/styles/project-showcase.css`：仅作用于本轮展示组件，由 projects 路由布局直接加载，沿用站点主题变量。

## 来源与取图边界

PR：[tool/safety: add tool execution safety guard #2091](https://github.com/trpc-group/trpc-agent-go/pull/2091)。三组 decision、risk、rule 与 blocked 来自 PR 的 `examples/tool_safety_guard/tool_safety_report.json`。章节引用其实际新增文件；未将上游框架的所有能力作为个人 PR 成果。

SQL Sentinel 八张画面来自仓库 `9c5807796663ac1a8d77c3b1d80108db60f88e38` 的实际报告前端。本次实际运行 `go run ./cmd/sentinel diagnose-plan`，生成三条 L1 诊断假设，再在前端回放该产物；不使用 `?preview=1`。输入是仓库归档的 MySQL 8.4.11 EXPLAIN，源文件 SHA256 为 `f6d410a8dfe96f28f7421e8c65281b1fec8c40b15961fdcaf742ce8de139e027`，取图前与 CLI 产物核对。传输适配仅将本地产物接入原报告渲染。本次没有重新启动 MySQL 实测，`eligible_for_performance_claim` 为 false，不能宣称性能提速或完整在线任务已验收。

AgentMesh 八张画面来自 `3742edac014fbf32c6daeff027e35218d93a9185` 的实际控制台。后台运行实际 Go 网关、租户鉴权与 SSE；通过控制台发送请求，主适配器在首块前失败，备用适配器实际完成流式返回。使用 `admindemo` 内存存储、临时租户与 mock 模型适配器，控制台的认证传输和模型目录做了本地接入适配。画面明确标注本地回环，不代表 Clerk 生产登录、在线模型推理、真实计费或生产压力验证。

Zenix 九张画面来自本地已构建的完整 App v1.3.0，不使用组件 fixture。复制用户已提供的四首音频到隔离目录，以实际 `LocalLibrary` 导入并建立歌单，完整前端通过传输适配访问实际曲库与 `PersonalStore`。在界面中打开歌单、点击播放 LOSER，再切换多轨环绕与简约列表，保留实际队列、音频元数据、时长和进度。只在静音无头浏览器中解码音频，没有读取日常播放器配置、没有启动 Electron 窗口。未提供封面的文件保留应用默认占位图；不补造专辑封面。桌面媒体键、在线漫游、更新发行不在本轮验证范围。

TableCard 八张画面来自实际 Go 服务与 TUI 模型。隔离测试启动 `server.New()` 与临时 HTTP 服务，实际读取模式、创建房间、启动 AI 对手，处理 WebSocket 事件和落子；另运行实际离线贪吃蛇引擎的开始、输入与时钟推进。截图直接渲染操作后的 `app.Model.View()` 文本，只去除 ANSI 控制码，没有手工重绘棋盘或打开终端窗口。本机 AI 房间不等于跨网络多人或生产压力验收。

三十三张工作截图及一张代码绘制的 PR 概览图由博客静态提供，运行时不访问截图服务，不连接这些项目后端，不执行样例命令。每张画面都有操作、结果与限制说明，每项优势对应具体实现或报告依据，不编造排名、用户规模或性能倍数。全部改动保留本地，未提交、推送或部署。

## 开发检查

41 项现有及新增自动测试、TypeScript 检查通过；本轮还定向检查实际截图、优势证据链接、切换后的深链行为、放大与键盘、320/390px 布局、深色主题和主图失败重试。AI 视觉与代码 Review 的实际结果见 [交付与 Review 记录](PROJECT-SHOWCASE-REVIEW.md)，不以测试通过代替视觉或生产验收。

补齐了 SSR 图片在 hydration 前已经失败时的提示路径。文章目录测试保留原 204 篇导入文章的完整性约束，改为同时核对实际配置目录与所有标题，以兼容本次之前已新增的 Go 面试文章。

预览脚本已检查复用当前服务、进程退出、同目录多实例冲突与停止已退出的自有进程等路径。不会为了更换端口而停止现有博客实例。
