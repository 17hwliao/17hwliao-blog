import type { ProjectShowcase, ProjectShot } from './project-showcases'
import { projectJourneyAdditions } from './project-capture-journeys'

const picture = (name: string) => `/images/projects/showcase/${name}.png`
const sql = 'https://github.com/17hwliao/sql-sentinel/tree/9c5807796663ac1a8d77c3b1d80108db60f88e38'
const mesh = 'https://github.com/17hwliao/AgentMesh/tree/3742edac014fbf32c6daeff027e35218d93a9185'
const music = 'https://github.com/17hwliao/Zenix'
const table = 'https://github.com/17hwliao/Table-Card'

function shot(id: string, file: string, title: string, description: string, source: string, provenance: string, action: string, result: string, boundary: string): ProjectShot {
	return { id, src: picture(file), title, description, alt: `${title}：${description}`, source, provenance, capture: { action, result, boundary } }
}

const baseShowcases: Record<string, ProjectShowcase> = {
	'trpc-agent-go': {
		type: 'contribution', headline: '让工具执行的安全边界，可以被检查和解释。',
		intro: '我的 PR #2091 将预执行扫描接入工具权限策略。这里用报告、执行分支与代码位置，展示这一层防护怎样工作。',
		advantages: [
			{ title: '把防护放到执行之前', benefit: '高风险调用先被判定，再决定是否进入工具后端。', mechanism: '通过 PermissionPolicy 连接 workspace_exec、host exec_command 和 execute_code 的适用扫描。', evidence: '六章讲解可以沿请求走到允许、阻断或人工审阅；不在浏览器执行样例命令。' },
			{ title: '每个判定都有理由', benefit: '调用方能知道被哪条规则拦住，而不是只收到一句“失败”。', mechanism: '结构化 Report 保留 decision、risk_level、rule_id、findings 和建议。', evidence: '三组报告摘录来自 PR 自带的 JSON，展开原始报告可核对具体 findings。' },
			{ title: '策略可调整，审计可连接', benefit: '安全规则与执行实现分开维护，同时保留问题定位的线索。', mechanism: 'YAML 管理命令、路径、网络和资源范围；JSONL 与 SpanAttributes 输出审计字段。', evidence: '章节链接指向 PR 的实际改动文件。扫描仍需与沙箱、权限和资源限制配合。' }
		], shots: []
	},
	'sql-sentinel': {
		type: 'product', headline: 'SQL 优化的价值，落在可以核对的证据上。',
		intro: '实际报告前端展示本次 CLI 生成的诊断结果。顺着候选、计划和证据等级，读清建议的依据与适用范围。',
		advantages: [
			{ title: '建议有出处，结论可回查', benefit: '审阅者能从结论回到计划与候选方案，减少凭经验接受建议的风险。', mechanism: '诊断假设与 EXPLAIN、SQL 和报告内容哈希关联，形成可追溯的证据链。', evidence: '本次真实 diagnose-plan 运行生成三条假设；取图前核对了源计划的 SHA256。', shot: 'report' },
			{ title: '把优化差异具体展开', benefit: '直接看访问路径与排序行为的变化，便于判断候选方案是否值得进一步测量。', mechanism: '分开呈现基线与候选的结构化执行计划，模型负责受限提案，确定性代码负责校验。', evidence: '计划页使用仓库归档的 MySQL EXPLAIN，展示候选索引与访问路径差异。', shot: 'plan' },
			{ title: '证据分级，避免误报提速', benefit: '将计划推断与实际耗时收益分开，让优化报告更适合严肃审阅。', mechanism: 'L1 计划证据与后续独立基准、等价性和噪声门槛分别管理。', evidence: '性能证据页明确显示尚未进行本次性能测量，当前结论停留在 L1。', shot: 'evidence' }
		],
		shots: [
			shot('report', 'sql-working-report', '诊断结论与候选依据', '真实报告页加载了刚刚运行 diagnose-plan 生成的三条诊断假设。', sql, '真实前端 · CLI 结果回放', '运行 diagnose-plan，核对源文件哈希，再用实际报告前端打开结果。', '生成三条 L1 假设，报告与 SQL 都保留内容哈希。', 'EXPLAIN 来自仓库归档快照；本次没有启动 MySQL 影子库或重新实测生产负载。'),
			shot('plan', 'sql-working-plan', '基线与候选计划对照', '在同一份报告中切换执行计划，查看访问路径、索引与排序证据。', sql, '真实前端 · 归档计划证据', '在实际报告页点击“执行计划”。', '显示归档计划的基线与候选差异，可回到原始 JSON 核对。', '优化器估计扫描行数不是本次实际测量；不据此宣称耗时提升。'),
			shot('evidence', 'sql-working-evidence', '性能结论的明确边界', '没有本次独立测量时，界面保留 L1，并明确说明尚未证明性能收益。', sql, '真实前端 · 证据等级核对', '从同一报告切换到“性能证据”。', '实际前端显示尚未进行性能测量，没有将计划变化升级为提速结论。', '这是本地 CLI 产物回放，不代表完整在线诊断任务或数据库环境已验收。')
		]
	},
	agentmesh: {
		type: 'product', headline: '把接入、路由与流式返回，放在同一条可控链路。',
		intro: '实际控制台连接本地 Go 网关发起请求。画面记录了流式返回、调用完成与租户可见模型；模型适配器采用显式本地回环。',
		advantages: [
			{ title: '一个契约连接应用与模型', benefit: '应用围绕统一 API 开发，提供方与路由差异集中在服务端处理。', mechanism: 'HTTP Chat Completions 契约、模型别名和租户路由共同组织请求。', evidence: '控制台向真实 Go 网关提交了带身份的请求，并收到了完整响应流。', shot: 'call' },
			{ title: '流式过程中保留故障边界', benefit: '首个数据块之前可以处理上游失败，避免在已经输出后悄悄换模型。', mechanism: '路由器区分首块前失败与已开始的响应，并沿调用链传播取消信号。', evidence: '本地测试适配器模拟主路径首块前失败，备用适配器经真实网关完成 SSE 返回。', shot: 'stream' },
			{ title: '模型可见范围跟随租户', benefit: '将模型访问范围放到服务端，减少客户端自行维护权限判断。', mechanism: '临时凭据、租户身份与声明式模型路由连接到同一次请求。', evidence: '实际模型目录从本地带身份的接口读取已配置的 local-check 路由。', shot: 'models' }
		],
		shots: [
			shot('call', 'mesh-working-call', '真实网关调用完成', '控制台提交请求后，由实际 Go 网关完成流式返回并更新本次调用状态。', mesh, '本地运行 · 真实 Go 网关', '在实际控制台选择 local-check 并发送请求。', '主路径首块前失败后，备用路径完成响应；前端恢复为可继续发送状态。', '使用本地 mock 适配器和临时租户，不代表在线模型质量、实际费用或生产负载。'),
			shot('stream', 'mesh-working-stream', '流式工作过程', '同一次请求开始返回内容时，实际前端呈现逐步到达的消息。', mesh, '本地运行 · HTTP / SSE', '通过真实网关发起流式请求，取图记录返回过程。', '消息通过实际 SSE 读取逻辑进入聊天区域，而不是在截图上补写回答。', '回答来自标明用途的本地测试适配器；本次未调用付费大模型。'),
			shot('models', 'mesh-working-models', '服务端模型目录', '实际控制台从带身份的本地网关接口读取配置模型。', mesh, '本地运行 · 临时租户', '打开实际模型目录，读取本地配置的模型别名。', 'local-check 路由与调用使用同一套租户配置。', '本次使用内存演示存储与本地目录适配；没有连接真实账单或生产登录。')
		]
	},
	zenix: {
		type: 'product', headline: '音乐空间的自由，建立在真实曲库之上。',
		intro: '直接打开本地已构建的完整播放器，以隔离曲库导入已有的四首 MP3。这里展示实际应用的界面与操作结果。',
		advantages: [
			{ title: '同一曲库，多种浏览方式', benefit: '用环绕视图探索音乐，也能切回列表快速查找，保留同一播放上下文。', mechanism: '音乐空间和简约列表共用真实曲库与播放队列，浏览操作与播放操作分开。', evidence: '完整 App 已从歌单发起播放，再切换环绕视图与简约列表；四首曲目保持一致。', shot: 'orbit' },
			{ title: '本地资料自己管理', benefit: '自己的音频可以成为曲库入口，使用体验不依赖在线推荐。', mechanism: 'LocalLibrary 扫描音频并读取元数据，PersonalStore 管理喜欢与个人歌单。', evidence: '本次使用用户已提供的 MP3 建立了独立曲库，没有读取日常播放器资料。', shot: 'library' },
			{ title: '歌单直接衔接播放', benefit: '从自己整理的音乐直接进入播放队列，不必在整理与聆听之间重新找歌。', mechanism: '歌单保存音频 ID，实际播放操作将解析后的曲目传入播放器队列。', evidence: '本次实际点击歌单中的 LOSER，播放器显示同一组曲目、音频时长与进度。', shot: 'list' }
		],
		shots: [
			shot('orbit', 'zenix-working-orbit', '真实曲库的环绕浏览', '由歌单进入完整播放器后，通过应用自己的按钮切换多轨环绕。', music, '完整 App · 实际播放队列', '实际 LocalLibrary 导入四首音频并建立歌单，在应用中点击播放，再切换“多轨环绕”。', '空间中的四首曲目与歌单一致，播放曲目、时长和进度由实际播放器更新。', '运行已构建的完整 App，使用隔离配置和传输适配；原文件未提供封面时保留应用自带占位封面，不补造专辑图片。'),
			shot('library', 'zenix-working-library', '四首本地音频的实际歌单', '实际音频元数据进入歌单，显示曲名、作者、专辑与时长。', music, '完整 App · 实际本地曲库', '调用实际 LocalLibrary 导入已有 MP3 并建立隔离歌单，再在应用中打开歌单管理。', '四首音频有独立的实际元数据，可直接从歌单发起播放。', '未读取日常播放器资料；歌单由应用真实存储模块建立，不使用组件 fixture。'),
			shot('list', 'zenix-working-list', '列表与播放保持同一上下文', '实际应用从环绕切换到简约列表，保留原有四首歌曲与当前播放状态。', music, '完整 App · 实际视图切换', '在同一播放会话中点击“简约列表”。', '同一曲库在不同视图中可继续浏览，底部保留实际音频时长与进度。', '无头 Chromium 静音取图；未启动 Electron 窗口，不将此画面当作桌面更新、媒体键或在线漫游的验收。')
		]
	},
	'table-card': {
		type: 'product', headline: '终端里的对局，也有真实的服务端与状态同步。',
		intro: '启动实际 Go 服务，用真实房间接口和 WebSocket 完成五子棋操作，再切换实际离线引擎。画面来自操作后的 TUI 输出。',
		advantages: [
			{ title: '服务端掌握对局规则', benefit: '玩家动作先经过权威规则处理，再同步到客户端，便于保持对局一致。', mechanism: 'Go 服务维护房间与回合，通过 WebSocket 接收动作并广播状态。', evidence: '本次实际创建房间、加入 AI 对手并落子，截图包含真实服务返回的棋盘。', shot: 'gomoku' },
			{ title: '一套终端交互承载多种玩法', benefit: '保留统一的入口、键盘提示和房间体验，降低不同玩法之间的切换成本。', mechanism: '统一 TUI 外壳对接不同规则引擎，房间服务返回可用模式。', evidence: '大厅由真实服务返回模式列表，取图时已完成连接。', shot: 'lobby' },
			{ title: '联网与离线各自成立', benefit: '单人休息与联网对局可以在同一个应用内进入，离线玩法不依赖匹配成功。', mechanism: '本地贪吃蛇引擎与联网房间调用分离，输入和时钟推进真实游戏状态。', evidence: '本次实际运行了离线引擎的开始、输入与多次时钟更新，再取图保存状态。', shot: 'snake' }
		],
		shots: [
			shot('gomoku', 'table-working-gomoku', '联网五子棋实际对局', 'Go 服务创建真实房间并启动 AI 对手，通过 WebSocket 接收落子后的棋盘。', table, '本地运行 · Go / WebSocket', '加载服务模式、创建房间、准备开始、发送落子，并处理服务端事件。', '实际 TUI 展示已开始的对局与真实落子状态。', '本机临时房间与 AI 对手；不表示跨网络多人连通性或生产压力已验收。终端输出在无头页面中渲染取图。'),
			shot('lobby', 'table-working-lobby', '已连接的游戏大厅', '真实 Go 服务返回可用玩法，大厅从“未连接”进入可创建房间的状态。', table, '本地运行 · 实际大厅', '从实际服务读取健康信息与模式列表。', '大厅展示服务返回的玩法，并确认连接成功。', '本机临时服务，没有连接公开玩家或使用既有身份资料。'),
			shot('snake', 'table-working-snake', '离线引擎工作状态', '执行开始输入和时钟更新后，实际离线引擎生成当前贪吃蛇画面。', table, '本地运行 · 实际游戏引擎', '调用实际 TUI 输入处理与离线引擎的状态更新。', '游戏状态由项目引擎计算，截图没有手工绘制棋盘。', '静音取图，不打开终端桌面窗口；不将其当作联网测试。')
		]
	}
}

export const workingProjectShowcases: Record<string, ProjectShowcase> = Object.fromEntries(
	Object.entries(baseShowcases).map(([slug, showcase]) => {
		const additions = projectJourneyAdditions[slug]
		return [slug, additions ? { ...showcase, shots: [...showcase.shots, ...additions.shots], journeys: additions.journeys } : showcase]
	})
)
