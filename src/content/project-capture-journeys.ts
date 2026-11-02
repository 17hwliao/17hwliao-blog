import type { ProjectJourney, ProjectShot } from './project-showcases'

const repositories: Record<string, string> = {
	'sql-sentinel': 'https://github.com/17hwliao/sql-sentinel/tree/9c5807796663ac1a8d77c3b1d80108db60f88e38',
	agentmesh: 'https://github.com/17hwliao/AgentMesh/tree/3742edac014fbf32c6daeff027e35218d93a9185',
	zenix: 'https://github.com/17hwliao/Zenix',
	'table-card': 'https://github.com/17hwliao/Table-Card'
}
function frame(project: string, id: string, title: string, action: string, result: string, boundary: string): ProjectShot {
	const prefix = { 'sql-sentinel': 'sql', agentmesh: 'mesh', zenix: 'zenix', 'table-card': 'table' }[project]
	return {
		id, title, src: `/images/projects/showcase/${prefix}-journey-${id}.png`, description: result, alt: `${title}：${result}`,
		source: repositories[project], provenance: project === 'sql-sentinel' ? '真实前端 · CLI 证据回放' : project === 'zenix' ? '完整 App · 隔离实际曲库' : '实际本地运行 · 操作后取图',
		capture: { action, result, boundary }
	}
}
const sqlBoundary = '真实 CLI 产物与归档 EXPLAIN 的只读回放，本次没有重新进行数据库性能测量。取图对长证据使用滚动视窗，未改写数据或判定。'
const meshBoundary = '实际本地 Go 网关与临时租户，适配器均为显式 mock；不代表在线模型质量或真实账单。'
const musicBoundary = '完整 App 与实际 LocalLibrary / PersonalStore，独立资料目录、四首已有音频、静音无头浏览器。'
const tableBoundary = '实际 TUI 输出在无头页面中渲染；临时本机 Go 服务，不表示跨网络多人验收。'

export const projectJourneyAdditions: Record<string, { shots: ProjectShot[]; journeys: ProjectJourney[] }> = {
	'sql-sentinel': {
		journeys: [
			{ id: 'diagnosis', title: '诊断与假设', description: '先看结论，再逐项读依据与待验证条件。', shots: ['report', 'hypothesis', 'verification'] },
			{ id: 'plan', title: '执行计划核对', description: '比较访问路径，再回到计划原文。', shots: ['plan', 'plan-source'] },
			{ id: 'evidence', title: '证据与原始产物', description: '核对结论资格、完整 JSON 与诊断来源。', shots: ['evidence', 'raw', 'diagnostic-source'] }
		],
		shots: [
			frame('sql-sentinel', 'hypothesis', '读取第一条诊断假设', '在报告中定位首条诊断假设。', '显示实际诊断事实与需要进一步验证的条件。', sqlBoundary),
			frame('sql-sentinel', 'verification', '逐项核对待验证条件', '滚动到后续假设与待验证清单。', '把候选方向与后续验证要求放在同一阅读上下文。', sqlBoundary),
			frame('sql-sentinel', 'plan-source', '回到计划原始证据', '切换执行计划并阅读原始比较 JSON。', '结构化对照可以继续追到具体的归档计划字段。', sqlBoundary),
			frame('sql-sentinel', 'raw', '打开完整报告', '在实际报告页切换“原始报告”。', '完整产物与报告标识保留在同一界面，方便交叉核对。', sqlBoundary),
			frame('sql-sentinel', 'diagnostic-source', '定位诊断产物的来源', '在原始报告中滚动定位 diagnostic_hypotheses.json。', '实际生成的假设与来源字段可从展示结论回查。', sqlBoundary)
		]
	},
	agentmesh: {
		journeys: [
			{ id: 'request', title: '正常请求', description: '选择路由、输入、接收数据，再到完成。', shots: ['input', 'direct-stream', 'direct-result'] },
			{ id: 'fallback', title: '首块前故障转移', description: '从模型目录，看到备用路径接续返回。', shots: ['models', 'stream', 'call'] },
			{ id: 'recovery', title: '失败与主动停止', description: '观察失败反馈，再切换路由主动中断。', shots: ['error', 'cancel'] }
		],
		shots: [
			frame('agentmesh', 'input', '选择路由并准备发送', '选择 local-direct，输入本地链路检查请求。', '发送前的模型、输入与输出限制明确可见。', meshBoundary),
			frame('agentmesh', 'direct-stream', '正常路由开始流式返回', '向真实 Go 网关发送请求，在流式响应中取图。', '本地适配器的数据块经实际 SSE 读取逻辑逐步进入对话。', meshBoundary),
			frame('agentmesh', 'direct-result', '正常调用完成', '等待同一次真实请求读完，并观察状态恢复。', '完整回复和本次调用状态一起保留，界面可继续发送。', meshBoundary),
			frame('agentmesh', 'error', '上游不可用时的反馈', '选择本地不可用路由，实际提交请求。', '真实网关返回失败，前端显示错误并恢复操作入口。', meshBoundary),
			frame('agentmesh', 'cancel', '主动停止保留已有内容', '切回正常路由，接收首批内容后点击停止生成。', '实际流读取被中止，已返回的部分内容仍可查看。', meshBoundary)
		]
	},
	zenix: {
		journeys: [
			{ id: 'library', title: '从空间到自己的歌单', description: '进入个人空间，整理实际导入的音乐。', shots: ['home', 'library', 'add'] },
			{ id: 'playback', title: '播放与队列', description: '从曲目列表，到队列管理与暂停。', shots: ['list', 'queue', 'paused'] },
			{ id: 'discovery', title: '浏览、聚焦与喜欢', description: '在音乐空间中浏览并聚焦，保存自己的喜欢。', shots: ['orbit', 'focus', 'liked'] }
		],
		shots: [
			frame('zenix', 'home', '完整应用的个人空间入口', '打开实际 App 并结束开屏。', '个人空间与曲库、播放历史等入口在实际应用中呈现。', musicBoundary),
			frame('zenix', 'add', '从真实曲库整理歌单', '在歌单管理中展开添加歌曲。', '四首实际音频的曲名、艺人与已添加状态进入同一整理面板。', musicBoundary),
			frame('zenix', 'queue', '查看实际播放队列', '由歌单发起播放，再打开播放队列。', '队列保留实际曲目顺序，并提供后续播放与收藏入口。', musicBoundary),
			frame('zenix', 'paused', '暂停后保留播放上下文', '关闭队列，在实际播放器点击暂停。', '播放进度与当前曲目仍然保留，控制可继续恢复播放。', musicBoundary),
			frame('zenix', 'focus', '浏览另一首，保留当前播放', '在多轨环绕中聚焦二十二。', '浏览焦点切到新的曲目，原有播放与暂停上下文仍保留。', musicBoundary),
			frame('zenix', 'liked', '自己的喜欢列表', '通过实际喜欢操作保存曲目，再打开我的喜欢。', '真实 PersonalStore 中的保存结果由完整应用列表显示。', musicBoundary)
		]
	},
	'table-card': {
		journeys: [
			{ id: 'room', title: '选模式与创建房间', description: '连接大厅、配置玩法，再进入真实房间。', shots: ['lobby', 'selected', 'room'] },
			{ id: 'game', title: '落子与规则', description: '从开局到后续回合，再查看玩法说明。', shots: ['opening', 'gomoku', 'rules'] },
			{ id: 'offline', title: '离线游戏的运行与暂停', description: '观察实际引擎更新及暂停后的状态。', shots: ['running', 'snake'] }
		],
		shots: [
			frame('table-card', 'selected', '配置五子棋玩法', '从真实服务返回的模式列表选择五子棋，并配置 AI 房间。', '当前模式、席位和操作提示由真实 TUI 模型显示。', tableBoundary),
			frame('table-card', 'room', '创建房间后的状态', '实际发送房间创建请求，在处理开局事件前取图。', '实际 HTTP 返回的房间资料已进入 TUI，随后由 WebSocket 更新。', tableBoundary),
			frame('table-card', 'opening', '开局后的第一轮操作', '处理真实开局事件，发送首轮落子并接收服务事件。', '棋盘来自服务端处理后的状态，不是手绘示意。', tableBoundary),
			frame('table-card', 'rules', '对局中查看规则', '通过实际 F1 输入处理打开规则说明。', '规则面板覆盖当前应用区域，并保留关闭后的对局上下文。', tableBoundary),
			frame('table-card', 'running', '离线引擎持续推进', '启动实际贪吃蛇并推进输入和时钟。', '真实引擎计算运行中的棋盘与当前分数，随后可暂停。', '静音运行实际离线引擎；不依赖匹配或网络服务。')
		]
	}
}
