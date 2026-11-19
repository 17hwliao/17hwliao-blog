import type { ProjectShowcase, ProjectShot } from './project-showcases'
import { projectJourneyAdditions } from './project-capture-journeys'

const picture = (name: string) => `/images/projects/showcase/${name}.png`
const sql = 'https://github.com/17hwliao/sql-sentinel/tree/9c5807796663ac1a8d77c3b1d80108db60f88e38'
const mesh = 'https://github.com/17hwliao/AgentMesh/tree/3742edac014fbf32c6daeff027e35218d93a9185'
const music = 'https://github.com/17hwliao/Zenix'
const table = 'https://github.com/17hwliao/Table-Card/tree/3f0860ab43d94871e29dcdd418a2f6bc0d706605'

function tableShot(id: string, title: string, description: string, action: string, result: string): ProjectShot {
	return shot(id, `table-live-${id}`, title, description, table, '正式客户端 · 本机 AI 对局', action, result,
		'Windows 客户端连接本机 Go 服务，伪终端传输原始 ANSI 输出，由 xterm.js 实时呈现并取图。')
}

function shot(
	id: string,
	file: string,
	title: string,
	description: string,
	source: string,
	provenance: string,
	action: string,
	result: string,
	boundary: string
): ProjectShot {
	return { id, src: picture(file), title, description, alt: `${title}：${description}`, source, provenance, capture: { action, result, boundary } }
}

const baseShowcases: Record<string, ProjectShowcase> = {
	'trpc-agent-go': {
		type: 'contribution',
		headline: '让工具执行的安全边界，可以被检查和解释。',
		intro: 'Agent 能调用命令行工具，也就可能把危险操作交给执行环境。我在 PR #2091 中加入执行前扫描，让调用方先看到风险与原因，再决定允许、阻断或交给人工审阅。',
		summary: '为开源 Agent 框架补充工具执行前的安全扫描，保留风险原因与审计记录。',
		work: '我的贡献范围是 PR #2091 的安全扫描、权限策略接入与报告示例；Agent 运行时、工作流和其他框架能力由上游社区维护。',
		technologies: [
			{ name: 'Go · PermissionPolicy', purpose: '把扫描接入工具权限链，在底层工具执行前分流。' },
			{ name: 'YAML', purpose: '配置命令、路径、网络和资源范围，规则与执行代码分开。' },
			{ name: 'JSON / JSONL · OpenTelemetry', purpose: '输出结构化报告、审计记录与追踪字段，便于解释和定位判定。' }
		],
		advantages: [
			{
				title: '把防护放到执行之前',
				benefit: '高风险调用先被判定，再决定是否进入工具后端。',
				mechanism: '通过 PermissionPolicy 连接 workspace_exec、host exec_command 和 execute_code 的适用扫描。',
				evidence: '六章讲解可以沿请求走到允许、阻断或人工审阅；不在浏览器执行样例命令。'
			},
			{
				title: '每个判定都有理由',
				benefit: '调用方能知道被哪条规则拦住，而不是只收到一句“失败”。',
				mechanism: '结构化 Report 保留 decision、risk_level、rule_id、findings 和建议。',
				evidence: '三组报告摘录来自 PR 自带的 JSON，展开原始报告可核对具体 findings。'
			},
			{
				title: '策略可调整，审计可连接',
				benefit: '安全规则与执行实现分开维护，同时保留问题定位的线索。',
				mechanism: 'YAML 管理命令、路径、网络和资源范围；JSONL 与 SpanAttributes 输出审计字段。',
				evidence: '章节链接指向 PR 的实际改动文件。扫描仍需与沙箱、权限和资源限制配合。'
			}
		],
		shots: []
	},
	'sql-sentinel': {
		type: 'product',
		headline: 'SQL 优化的价值，落在可以核对的证据上。',
		intro:
			'面对一条慢 SQL，我希望看到建议背后的执行计划，而不只是“加一个索引”。这个项目把诊断假设、候选方案与原始证据放到同一份报告里，区分计划推断与已经测量的收益。',
		summary: '把 SQL 优化建议与执行计划、候选方案关联起来，让结论可以回查。',
		work: '这里记录我的 SQL 诊断与证据报告实现：用受限候选与确定性校验组织分析，再通过报告呈现依据。下方重点展示 CLI 产物到报告前端的读取链路。',
		technologies: [
			{ name: 'Go', purpose: '检查 SQL 是否在允许范围内、验证候选方案并生成报告，让模型建议先经过代码校验。' },
			{ name: 'Eino', purpose: '组织模型分析和候选生成流程，限制提案范围，再交给代码检查结构与安全性。' },
			{ name: 'MySQL · EXPLAIN', purpose: '提供访问路径、索引与排序等计划证据；截图使用已归档的计划，不据此宣称实测提速。' }
		],
		advantages: [
			{
				title: '建议有出处，结论可回查',
				benefit: '审阅者能从结论回到计划与候选方案，减少凭经验接受建议的风险。',
				mechanism: '诊断假设与 EXPLAIN、SQL 和报告内容哈希关联，形成可追溯的证据链。',
				evidence: '报告展示 diagnose-plan 生成的三条诊断假设，并保留 SQL 与报告标识，便于回查来源。',
				shot: 'report'
			},
			{
				title: '把优化差异具体展开',
				benefit: '直接看访问路径与排序行为的变化，便于判断候选方案是否值得进一步测量。',
				mechanism: '分开呈现基线与候选的结构化执行计划，模型负责受限提案，确定性代码负责校验。',
				evidence: '计划页使用仓库归档的 MySQL EXPLAIN，展示候选索引与访问路径差异。',
				shot: 'plan'
			},
			{
				title: '证据分级，避免误报提速',
				benefit: '将计划推断与实际耗时收益分开，让优化报告更适合严肃审阅。',
				mechanism: 'L1 计划证据与后续独立基准、等价性和噪声门槛分别管理。',
				evidence: '性能证据页明确显示尚未进行本次性能测量，当前结论停留在 L1。',
				shot: 'evidence'
			}
		],
		shots: [
			shot(
				'report',
				'sql-working-report',
				'诊断结论与候选依据',
				'重点看三条诊断假设与待验证条件：建议和依据一起呈现，报告标识用于回查来源。',
				sql,
				'真实前端 · CLI 结果回放',
				'运行 diagnose-plan，核对源文件哈希，再用实际报告前端打开结果。',
				'生成三条 L1 假设，报告与 SQL 都保留内容哈希。',
				'EXPLAIN 来自仓库归档快照；本次没有启动 MySQL 影子库或重新实测生产负载。'
			),
			shot(
				'plan',
				'sql-working-plan',
				'基线与候选计划对照',
				'对照表中的基线与候选访问路径、索引和估计扫描行数；这些是计划差异，不能直接当作耗时收益。',
				sql,
				'真实前端 · 归档计划证据',
				'在实际报告页点击“执行计划”。',
				'显示归档计划的基线与候选差异，可回到原始 JSON 核对。',
				'优化器估计扫描行数不是本次实际测量；不据此宣称耗时提升。'
			),
			shot(
				'evidence',
				'sql-working-evidence',
				'性能结论的明确边界',
				'重点看 L1 证据等级与“尚未进行性能测量”的说明，区分优化方向与已验证的性能收益。',
				sql,
				'真实前端 · 证据等级核对',
				'从同一报告切换到“性能证据”。',
				'实际前端显示尚未进行性能测量，没有将计划变化升级为提速结论。',
				'这是本地 CLI 产物回放，不代表完整在线诊断任务或数据库环境已验收。'
			)
		]
	},
	agentmesh: {
		type: 'product',
		headline: '把接入、路由与流式返回，放在同一条可控链路。',
		intro:
			'多个 AI 应用各自接模型时，鉴权、路由和流式错误容易重复处理。我把这些公共能力放到一个 Go 网关中，让应用使用统一接口，也让失败和主动停止有明确的收口位置。',
		summary: '统一模型接入与租户路由，处理流式返回、首块前故障转移和取消。',
		work: '这里记录我的模型网关实现，重点是统一请求契约、租户可见范围，以及流式返回中的故障转移和取消传播。截图用本地测试适配器展示真实 Go 网关链路。',
		technologies: [
			{ name: 'Go · HTTP / SSE', purpose: '提供统一聊天接口，用 SSE 逐步返回内容；用户停止时，将取消信号传给上游。' },
			{ name: 'MySQL · Redis', purpose: '分别承载持久化租户与账本、额度预留等状态；下方截图聚焦本地调用链路。' },
			{ name: 'Kafka · OpenTelemetry', purpose: '连接异步用量处理与请求追踪，便于继续追查调用结束后的状态。' }
		],
		advantages: [
			{
				title: '一个契约连接应用与模型',
				benefit: '应用围绕统一 API 开发，提供方与路由差异集中在服务端处理。',
				mechanism: 'HTTP Chat Completions 契约、模型别名和租户路由共同组织请求。',
				evidence: '控制台向真实 Go 网关提交了带身份的请求，并收到了完整响应流。',
				shot: 'call'
			},
			{
				title: '流式过程中保留故障边界',
				benefit: '首个数据块之前可以处理上游失败，避免在已经输出后悄悄换模型。',
				mechanism: '路由器区分首块前失败与已开始的响应，并沿调用链传播取消信号。',
				evidence: '本地测试适配器模拟主路径首块前失败，备用适配器经真实网关完成 SSE 返回。',
				shot: 'stream'
			},
			{
				title: '模型可见范围跟随租户',
				benefit: '将模型访问范围放到服务端，减少客户端自行维护权限判断。',
				mechanism: '临时凭据、租户身份与声明式模型路由连接到同一次请求。',
				evidence: '实际模型目录从本地带身份的接口读取已配置的 local-check 路由。',
				shot: 'models'
			}
		],
		shots: [
			shot(
				'call',
				'mesh-working-call',
				'真实网关调用完成',
				'查看回复内容与“回答完成”状态：本地测试中，主路径在首段内容返回前失败，备用路径接续完成调用。',
				mesh,
				'本地运行 · 真实 Go 网关',
				'在实际控制台选择 local-check 并发送请求。',
				'主路径首块前失败后，备用路径完成响应；前端恢复为可继续发送状态。',
				'使用本地 mock 适配器和临时租户，不代表在线模型质量、实际费用或生产负载。'
			),
			shot(
				'stream',
				'mesh-working-stream',
				'流式工作过程',
				'重点看逐步到达的回复和调用状态，内容经真实网关流式转发；回答由本地测试适配器提供。',
				mesh,
				'本地运行 · HTTP / SSE',
				'通过真实网关发起流式请求，取图记录返回过程。',
				'消息通过实际 SSE 读取逻辑进入聊天区域，而不是在截图上补写回答。',
				'回答来自标明用途的本地测试适配器；本次未调用付费大模型。'
			),
			shot(
				'models',
				'mesh-working-models',
				'服务端模型目录',
				'查看租户可见的模型别名 local-check：控制台从带身份的网关接口读取目录，并用同一路由发起调用。',
				mesh,
				'本地运行 · 临时租户',
				'打开实际模型目录，读取本地配置的模型别名。',
				'local-check 路由与调用使用同一套租户配置。',
				'本次使用内存演示存储与本地目录适配；没有连接真实账单或生产登录。'
			)
		]
	},
	zenix: {
		type: 'product',
		headline: '音乐空间的自由，建立在真实曲库之上。',
		intro: '我想让自己的本地音乐既能安静地列表播放，也能在音乐空间里自由浏览。Zenix 把曲库、歌单与播放队列连接起来，切换浏览方式时保留当前曲目和播放进度。',
		summary: '从本地曲库整理歌单，在音乐空间与列表间切换，保持同一播放上下文。',
		work: '这里记录我围绕本地音乐体验所做的曲库整理、歌单与播放队列衔接，以及音乐空间和列表切换。下方使用完整应用中的真实音频与操作结果展示。',
		technologies: [
			{ name: 'React · TypeScript · Vite', purpose: '组织音乐空间、列表和播放控件，共享曲库与播放上下文。' },
			{ name: 'Electron · preload API', purpose: '由桌面主进程管理文件、曲库、窗口和缓存，向界面提供受控接口。' },
			{ name: 'LocalLibrary · PersonalStore', purpose: '项目内的曲库与个人资料模块，负责音频元数据、喜欢和歌单的本地管理。' }
		],
		advantages: [
			{
				title: '同一曲库，多种浏览方式',
				benefit: '用环绕视图探索音乐，也能切回列表快速查找，保留同一播放上下文。',
				mechanism: '音乐空间和简约列表共用真实曲库与播放队列，浏览操作与播放操作分开。',
				evidence: '完整 App 已从歌单发起播放，再切换环绕视图与简约列表；四首曲目保持一致。',
				shot: 'orbit'
			},
			{
				title: '本地资料自己管理',
				benefit: '自己的音频可以成为曲库入口，使用体验不依赖在线推荐。',
				mechanism: 'LocalLibrary 扫描音频并读取元数据，PersonalStore 管理喜欢与个人歌单。',
				evidence: '示例曲库包含四首本地 MP3，歌单中可以查看曲名、艺人、专辑与时长。',
				shot: 'library'
			},
			{
				title: '歌单直接衔接播放',
				benefit: '从自己整理的音乐直接进入播放队列，不必在整理与聆听之间重新找歌。',
				mechanism: '歌单保存音频 ID，实际播放操作将解析后的曲目传入播放器队列。',
				evidence: '从歌单播放 LOSER 后，列表与播放器保留同一组曲目，并显示音频时长和进度。',
				shot: 'list'
			}
		],
		shots: [
			shot(
				'orbit',
				'zenix-working-orbit',
				'真实曲库的环绕浏览',
				'四首曲目围绕当前歌曲排列，底部保留播放进度；浏览其他曲目时，可以继续听正在播放的歌曲。',
				music,
				'完整 App · 实际播放队列',
				'实际 LocalLibrary 导入四首音频并建立歌单，在应用中点击播放，再切换“多轨环绕”。',
				'空间中的四首曲目与歌单一致，播放曲目、时长和进度由实际播放器更新。',
				'运行已构建的完整 App，使用隔离配置和传输适配；原文件未提供封面时保留应用自带占位封面，不补造专辑图片。'
			),
			shot(
				'library',
				'zenix-working-library',
				'四首本地音频的实际歌单',
				'查看歌单中的曲名、艺人、专辑和时长：本地音频导入后，可以直接在这里整理和发起播放。',
				music,
				'完整 App · 实际本地曲库',
				'调用实际 LocalLibrary 导入已有 MP3 并建立隔离歌单，再在应用中打开歌单管理。',
				'四首音频有独立的实际元数据，可直接从歌单发起播放。',
				'未读取日常播放器资料；歌单由应用真实存储模块建立，不使用组件 fixture。'
			),
			shot(
				'list',
				'zenix-working-list',
				'列表与播放保持同一上下文',
				'与环绕画面对照同一组四首歌曲，再看底部当前曲目与进度：切换浏览方式后，播放上下文仍然保留。',
				music,
				'完整 App · 实际视图切换',
				'在同一播放会话中点击“简约列表”。',
				'同一曲库在不同视图中可继续浏览，底部保留实际音频时长与进度。',
				'无头 Chromium 静音取图；未启动 Electron 窗口，不将此画面当作桌面更新、媒体键或在线漫游的验收。'
			)
		]
	},
	'table-card': {
		type: 'product',
		headline: '在终端打麻将、斗地主，也能来一局骗子酒馆。',
		intro: 'TableCard 把房间、牌桌和对局操作放进终端。可以和朋友开房，也可以用 AI 房间直接开局。',
		summary: '在终端里选游戏、建房间和对局，由 Go 服务校验动作并同步回合。',
		work: '这里记录我做的终端牌桌与联机规则。前三张展示原生牌面和选中状态，后三张展示换牌检查、质疑翻牌和非法出牌反馈。',
		technologies: [
			{ name: 'Go · net/http', purpose: '提供房间接口，维护服务端对局规则和回合。' },
			{ name: 'WebSocket', purpose: '接收玩家动作并同步服务端处理后的对局状态。' },
			{ name: 'Bubble Tea · Bubbles · Lip Gloss', purpose: '处理键盘输入，绘制牌桌、彩色牌面、选中边框和规则提示。' }
		],
		advantages: [
			{
				title: '保留各玩法的原生牌面',
				benefit: '可以从花色、点数和选中边框直接读出当前手牌与选择。',
				mechanism: '终端界面按玩法绘制牌面，随着键盘选择更新高亮边框。',
				evidence: '麻将画面同时展示四个座位、牌墙和万、筒、条的彩色牌框。',
				shot: 'mahjong'
			},
			{
				title: '质疑后当场翻牌',
				benefit: '玩家可以核对盖下的牌与本轮声明，看到质疑为何成立或失败。',
				mechanism: '服务端判定质疑结果后，客户端展示上一手揭开的牌。',
				evidence: '骗子酒馆画面同时显示质疑结果与翻开的牌。',
				shot: 'liar-verdict'
			},
			{
				title: '非法出牌保留当前回合',
				benefit: '收到失败提示后可以继续调整手牌。',
				mechanism: 'Go 服务校验出牌组合，拒绝无效动作并返回原因。',
				evidence: '斗地主提交两张不同点数的牌，服务返回「不构成合法牌型」。',
				shot: 'landlord-guard'
			}
		],
		journeys: [
			{ id: 'featured', title: '三种牌桌玩法', description: '查看四川麻将、骗子酒馆与斗地主的原生牌面和选牌。', shots: ['mahjong', 'liar-bar', 'landlord'] },
			{ id: 'verdicts', title: '规则与判定', description: '查看换牌校验、质疑翻牌和无效牌型的实际反馈。', shots: ['mahjong-guard', 'liar-verdict', 'landlord-guard'] }
		],
		shots: [
			tableShot(
				'mahjong',
				'四川麻将 · 换三张',
				'上方是四个座位和牌墙，下方用不同颜色区分万、筒、条，浅蓝边框标记当前选中的牌。',
				'打开四人 AI 房间并选中一张手牌。',
				'原生终端牌桌显示手牌、选中边框和换牌状态。'
			),
			tableShot(
				'liar-bar',
				'骗子酒馆 · 选择暗牌',
				'顶部显示本轮声明牌，手牌里的金色边框标记准备盖下的牌。',
				'打开四人 AI 房间，轮到自己时按数字键选择一张手牌。',
				'原生牌面和选中状态随键盘输入更新。'
			),
			tableShot(
				'landlord',
				'斗地主 · 叫分后选牌',
				'叫 3 分后，牌桌显示地主、底牌和红黑花色。选中的两张牌有独立边框。',
				'打开三人 AI 房间，叫 3 分并选中两张不同点数的手牌。',
				'服务端确认地主身份和底牌，客户端同步牌桌并显示选择。'
			),
			tableShot(
				'mahjong-guard',
				'四川麻将 · 换牌检查',
				'只选一张就按回车，客户端提示「换三张需要选择同花色的 3 张牌」。',
				'选中一张手牌后直接确认换牌。',
				'客户端显示换牌要求，牌桌仍处于换三张阶段。'
			),
			tableShot(
				'liar-verdict',
				'骗子酒馆 · 质疑与翻牌',
				'发生质疑后，牌桌展示判定和上一手翻开的牌，可以和本轮声明对照。',
				'在四人 AI 对局中盖牌，继续对局直到触发质疑。',
				'客户端展示服务端的质疑判定与揭开的牌。'
			),
			tableShot(
				'landlord-guard',
				'斗地主 · 非法牌型拦截',
				'提交两张不同点数的牌，Go 服务返回「不构成合法牌型」，手牌和回合仍然保留。',
				'提交之前选中的两张不同点数的牌。',
				'服务端拒绝出牌，客户端显示具体原因并保留当前回合。'
			)
		]
	}
}

const featuredShots: Record<string, ProjectShot[]> = {
	'zenix': [
		shot(
			'new-home',
			'zenix-featured-home',
			'个人空间',
			'从环绕卡片进入喜欢、个人音乐和播放器设置。底部播放器保留曲目与播放控制。',
			music,
			'作者提供 · Zenix 应用截图',
			'打开个人空间首页。',
			'个人入口与播放控制出现在同一画面。',
			'作者提供的 Zenix v1.3.0 界面原图。'
		),
		shot(
			'new-stickers',
			'zenix-featured-stickers',
			'贴纸拼贴',
			'中心卡片显示聚焦的歌曲，周围保留其他封面，左下角继续显示当前播放器。',
			music,
			'作者提供 · Zenix 应用截图',
			'在音乐空间切到贴纸拼贴。',
			'可在保留播放控件的同时浏览其他歌曲。',
			'作者提供的 Zenix 应用界面原图。'
		),
		shot(
			'new-orbit',
			'zenix-featured-orbit',
			'多轨环绕',
			'对照中间的聚焦曲目与左下角正在播放的曲目。底部轨道控件用于分轨浏览。',
			music,
			'作者提供 · Zenix 应用截图',
			'在音乐空间切到多轨环绕并聚焦曲目。',
			'焦点和播放条显示不同曲目，浏览与播放各有入口。',
			'作者提供的 Zenix 应用界面原图。'
		),
		shot(
			'new-lyrics',
			'zenix-featured-lyrics',
			'歌词与音乐漫游',
			'聚焦卡片呈现歌词和播放进度，底部提示当前处于音乐漫游。',
			music,
			'作者提供 · Zenix 应用截图',
			'打开音乐空间的播放卡片。',
			'画面同时显示歌词、播放控件与漫游状态。',
			'作者提供的 Zenix 应用界面原图。'
		)
	]
}

const featuredJourneys: Record<string, { title: string; description: string }> = {
	zenix: { title: '新版界面', description: '个人空间、贴纸、多轨环绕与歌词。' }
}

export const workingProjectShowcases: Record<string, ProjectShowcase> = Object.fromEntries(
	Object.entries(baseShowcases).map(([slug, showcase]) => {
		const additions = projectJourneyAdditions[slug]
		if (!additions) return [slug, showcase]
		const featured = featuredShots[slug] ?? []
		const journey = featuredJourneys[slug]
		return [
			slug,
			{
				...showcase,
				shots: [...featured, ...showcase.shots, ...additions.shots],
				journeys: journey ? [{ id: 'featured', ...journey, shots: featured.map(item => item.id) }, ...additions.journeys] : additions.journeys
			}
		]
	})
)
