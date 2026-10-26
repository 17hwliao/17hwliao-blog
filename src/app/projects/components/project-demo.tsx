'use client'

import { useEffect, useState } from 'react'
import {
	Activity,
	ArrowDown,
	Check,
	CheckCheck,
	CircleDot,
	Database,
	FileCheck2,
	FileText,
	GitBranch,
	KeyRound,
	Layers,
	Music2,
	Pause,
	Play,
	Radio,
	RotateCcw,
	Route,
	Send,
	ShieldCheck,
	SkipForward,
	Sparkles,
	Terminal,
	Wallet,
	Waves,
	Wrench,
	type LucideIcon
} from 'lucide-react'

type Step = { label: string; detail: string; output: string; icon: LucideIcon }
type Demo = { title: string; subtitle: string; accent: string; steps: Step[] }
const demos: Record<string, Demo> = {
	'trpc-agent-go': {
		title: '从一个问题，到一次完整的 Agent 协作',
		subtitle: 'Runner → Model → Tools → Events',
		accent: '#366d97',
		steps: [
			{
				label: '接收任务',
				detail: 'Runner 接收用户请求，建立会话上下文与可取消的执行任务。',
				output: 'runner.Run(ctx, userID, sessionID, message)',
				icon: Send
			},
			{ label: '模型决策', detail: 'LLM Agent 读取上下文，决定直接回答还是调用工具。', output: 'model → tool_call: search_knowledge', icon: Sparkles },
			{ label: '调用工具', detail: '执行 Function Tool 或 MCP 工具，将结果返回当前 Agent。', output: 'tool.result → context / memory', icon: Wrench },
			{
				label: '工作流编排',
				detail: 'Graph / Chain / Parallel 工作流组织下一步，状态沿执行路径传递。',
				output: 'graph: analyze → process → report',
				icon: GitBranch
			},
			{ label: '流式返回', detail: 'Runner 将事件流交给调用端，同时保留 tracing 与会话状态。', output: 'event.stream → response + trace', icon: Waves }
		]
	},
	'sql-sentinel': {
		title: '先收集证据，再讨论 SQL 优化',
		subtitle: 'Admission → Proposal → Evidence',
		accent: '#547c65',
		steps: [
			{ label: 'SQL 准入', detail: '解析 SQL AST，并检查只读范围、表白名单与授权。', output: 'admission: bounded SELECT / scope checked', icon: ShieldCheck },
			{ label: '计划证据', detail: '读取 Schema、快照与基线 EXPLAIN，保留诊断依据。', output: 'schema + snapshot + baseline EXPLAIN', icon: Database },
			{
				label: '有界提案',
				detail: 'Eino 生成有限的索引或改写候选，确定性 Go 代码负责校验。',
				output: 'CandidateSpec → structure / safety checks',
				icon: Sparkles
			},
			{
				label: '隔离验证',
				detail: '候选方案仅在授权的影子环境中验证，不对生产库执行 DDL。',
				output: 'shadow.validate(candidate) → plan evidence',
				icon: Layers
			},
			{
				label: '报告与审批',
				detail: '默认形成 L1 报告。A/B 与更高等级证据需要独立审批和实际测量。',
				output: 'L1 report → immutable hash → approval',
				icon: FileCheck2
			}
		]
	},
	agentmesh: {
		title: '让一次模型请求，有边界也有来路',
		subtitle: 'One gateway. Every request accounted for.',
		accent: '#4b7d73',
		steps: [
			{ label: '客户端接入', detail: 'CLI、应用或控制台通过统一 HTTP 契约提交请求。', output: 'POST /v1/chat/completions', icon: Send },
			{ label: '身份与权限', detail: '识别租户密钥，检查模型权限与速率限制。', output: 'tenant → model authorization → rate limit', icon: KeyRound },
			{ label: '预算预留', detail: '执行预算预留；可选人民币钱包与预算单位分别管理。', output: 'reserve → budget / optional wallet', icon: Wallet },
			{ label: '模型路由', detail: '按策略选择 Ark、Ollama 或兼容平台，也可通过 mTLS runner 执行。', output: 'route → provider / mTLS runner', icon: Route },
			{ label: '流式转发', detail: '转发响应并传播取消信号；首个数据块发出后不切换模型。', output: 'stream → forward / cancel propagation', icon: Radio },
			{ label: '结算与追踪', detail: '写入用量、结算记录与 trace。不确定的货币用量进入对账。', output: 'settlement → ledger + trace', icon: Activity }
		]
	},
	zenix: {
		title: '让音乐，回到自己的空间',
		subtitle: 'Your music. Your own universe.',
		accent: '#846b9f',
		steps: [
			{ label: '带入曲库', detail: '导入自己的音乐源或本地音频，建立可用的音乐入口。', output: 'custom source / local audio → library', icon: Music2 },
			{ label: '浏览空间', detail: '在贴纸拼贴、环绕轨道或极简列表中浏览歌曲。', output: 'sticker collage / orbit / list', icon: Layers },
			{ label: '选择歌曲', detail: '聚焦歌曲后，通过独立的播放按钮把它加入播放流程。', output: 'focus → play → queue', icon: CircleDot },
			{ label: '解析与播放', detail: '优先使用完整缓存；在线曲目依照已配置的源和音质尝试播放。', output: 'cache / source fallback → audio', icon: Play },
			{ label: '歌词与漫游', detail: '歌词跟随时间轴；音乐漫游依据本地聆听习惯补充候选。', output: 'timeline → lyrics / roaming', icon: Waves }
		]
	},
	'table-card': {
		title: '在终端里，和朋友坐到同一桌',
		subtitle: 'Select → Join → Ready → Play',
		accent: '#8c7053',
		steps: [
			{ label: '选择游戏', detail: '从终端选择游戏。联网模式与离线 Snake、文字冒险各有入口。', output: '> select game: 五子棋', icon: Terminal },
			{ label: '连接房间', detail: '连接可达的服务器，用六位房间码加入同一场游戏。', output: '> room: 178100 · sample room', icon: KeyRound },
			{ label: '准备开局', detail: '玩家准备后，由房主开始。聊天与在线状态贯穿房间流程。', output: '> players ready · host starts', icon: CheckCheck },
			{ label: '校验落子', detail: 'Go 服务端校验玩家操作与当前回合，拒绝不符合规则的动作。', output: '> action: place(3, 3) → validated', icon: ShieldCheck },
			{ label: '同步视图', detail: '通过 WebSocket 同步双方棋盘，继续下一回合。此处为步骤演示。', output: '> broadcast → both boards updated', icon: Radio }
		]
	}
}

function DemoScene({ slug, step, playing, logo }: { slug: string; step: number; playing: boolean; logo: string }) {
	if (slug === 'zenix')
		return (
			<div className='demo-music-scene' aria-label='音乐空间流程示意'>
				<div className='demo-music-orbit'>
					<span className='orbit-label orbit-source'>自定义源</span>
					<span className='orbit-label orbit-cache'>本地缓存</span>
					<div className='demo-record' data-running={playing && step >= 3}>
						<img src={logo} alt='' />
					</div>
					<span className='orbit-label orbit-library'>我的曲库</span>
					<span className='orbit-label orbit-lyrics'>时间轴歌词</span>
				</div>
				<div className='demo-waveform' data-running={playing && step >= 3}>
					{Array.from({ length: 28 }, (_, index) => (
						<i key={index} style={{ height: `${12 + ((index * 17 + 7) % 39)}px`, animationDelay: `${index * 0.06}s` }} />
					))}
				</div>
				<p className='demo-scene-caption'>音乐空间示意 · 不播放音频</p>
			</div>
		)
	if (slug === 'table-card')
		return (
			<div className='demo-terminal-scene' aria-label='终端五子棋流程示意'>
				<div className='demo-terminal-title'>
					<Terminal size={14} /> TABLECARD / ROOM 178100
				</div>
				<div className='demo-board'>
					{Array.from({ length: 49 }, (_, index) => {
						const stones = [24, 25, 17, 31, 23]
						const order = stones.indexOf(index)
						return <span key={index}>{step >= 3 && order >= 0 && order < step - 1 && <i className={order % 2 ? 'stone-white' : 'stone-black'} />}</span>
					})}
				</div>
				<div className='demo-terminal-line'>
					<span>❯</span>
					{step < 2 ? '等待玩家就绪' : step < 3 ? '双方已就绪' : step === 3 ? 'server: validating action' : 'websocket: state synchronized'}
					<i />
				</div>
			</div>
		)
	if (slug === 'sql-sentinel')
		return (
			<div className='demo-sql-scene'>
				<div className='demo-editor-top'>
					<Database size={14} /> query.sql <span>READ ONLY</span>
				</div>
				<pre>
					<span>SELECT</span> id, title{`\n`}
					<span>FROM</span> articles{`\n`}
					<span>WHERE</span> author_id = ?;
				</pre>
				<div className='demo-plan'>
					<div>
						<span>AST</span>
						<strong>{step >= 0 ? '只读准入' : '待开始'}</strong>
					</div>
					<div>
						<span>EXPLAIN</span>
						<strong>{step >= 1 ? '基线已读取' : '等待证据'}</strong>
					</div>
					<div>
						<span>SHADOW</span>
						<strong>{step >= 3 ? '隔离验证' : '尚未验证'}</strong>
					</div>
				</div>
				<div className='demo-evidence'>
					<ShieldCheck size={17} />
					<span>L1 · 计划证据</span>
					<small>{step >= 4 ? '等待人工审批' : '证据链逐步建立'}</small>
				</div>
			</div>
		)
	if (slug === 'agentmesh')
		return (
			<div className='demo-gateway-scene'>
				<div className='gateway-clients'>
					<span>
						<Terminal size={15} /> CLI
					</span>
					<span>
						<Layers size={15} /> App
					</span>
					<span>
						<FileText size={15} /> Console
					</span>
				</div>
				<ArrowDown size={22} className='gateway-arrow' />
				<div className='gateway-core' data-running={playing}>
					<img src={logo} alt='' />
					<div>
						<strong>AgentMesh</strong>
						<span>{step < 3 ? '租户 · 权限 · 预算' : '模型路由 · 流式响应'}</span>
					</div>
					<i />
				</div>
				<ArrowDown size={22} className='gateway-arrow' />
				<div className='gateway-providers'>
					<span data-active={step >= 3}>Ark</span>
					<span>Ollama</span>
					<span>OpenAI-compatible</span>
				</div>
				<p className='demo-scene-caption'>{step >= 5 ? 'usage → ledger → trace' : '统一入口，保留每次请求的轨迹'}</p>
			</div>
		)
	return (
		<div className='demo-agent-scene'>
			<div className='agent-message'>
				<Send size={14} />
				<span>分析资料，并整理一份报告。</span>
			</div>
			<div className='agent-runtime'>
				<div className='agent-model' data-active={step >= 1}>
					<Sparkles size={24} />
					<strong>LLM Agent</strong>
					<span>reason · act · observe</span>
				</div>
				<div className='agent-tools'>
					<span data-active={step >= 2}>
						<Wrench size={14} /> Tools / MCP
					</span>
					<span data-active={step >= 3}>
						<GitBranch size={14} /> Graph / Chain
					</span>
					<span data-active={step >= 4}>
						<Database size={14} /> Session / Memory
					</span>
				</div>
			</div>
			<div className='agent-event-stream'>
				{['event.started', 'tool.result', 'response.delta'].map((text, index) => (
					<span key={text} data-active={step >= index * 2}>
						<i />
						{text}
					</span>
				))}
			</div>
		</div>
	)
}

export function ProjectDemo({ slug, name, logo }: { slug: string; name: string; logo: string }) {
	const demo = demos[slug]
	const [step, setStep] = useState(-1)
	const [playing, setPlaying] = useState(false)
	useEffect(() => {
		if (!playing) return
		const timer = window.setTimeout(() => {
			if (step >= demo.steps.length - 1) setPlaying(false)
			else setStep(value => value + 1)
		}, 1600)
		return () => window.clearTimeout(timer)
	}, [playing, step, demo.steps.length])
	const play = () => {
		if (playing) {
			setPlaying(false)
			return
		}
		if (step < 0 || step >= demo.steps.length - 1) setStep(0)
		setPlaying(true)
	}
	const current = step >= 0 ? demo.steps[step] : null
	return (
		<section className='project-demo' style={{ '--demo-accent': demo.accent } as React.CSSProperties} aria-label={`${name} 交互流程演示`}>
			<div className='demo-window-bar'>
				<span>
					<i />
					<i />
					<i />
				</span>
				<p>{slug} / interactive overview</p>
				<span className='demo-label'>流程演示</span>
			</div>
			<div className='demo-intro'>
				<p className='eyebrow'>HOW IT WORKS</p>
				<h2>{demo.title}</h2>
				<p>{demo.subtitle}</p>
			</div>
			<div className='demo-main'>
				<div className='demo-scene'>
					<DemoScene slug={slug} step={step} playing={playing} logo={logo} />
				</div>
				<div className='demo-step-detail'>
					<span className='demo-step-count'>{step < 0 ? 'READY' : `${String(step + 1).padStart(2, '0')} / ${String(demo.steps.length).padStart(2, '0')}`}</span>
					<h3>{current?.label || '跟着一次流程，认识这个项目。'}</h3>
					<p>{current?.detail || '点击开始，观察每一步如何传递。也可以直接选择下方的节点。'}</p>
					<code>{current?.output || 'await interaction.start()'}</code>
				</div>
			</div>
			<div className='demo-flow' style={{ '--step-count': demo.steps.length } as React.CSSProperties}>
				{demo.steps.map(({ label, icon: Icon }, index) => (
					<button
						key={label}
						data-state={index === step ? 'active' : index < step ? 'done' : 'pending'}
						aria-pressed={index === step}
						onClick={() => {
							setPlaying(false)
							setStep(index)
						}}>
						<span>{index < step ? <Check size={17} /> : <Icon size={17} />}</span>
						<strong>{label}</strong>
						<small>{String(index + 1).padStart(2, '0')}</small>
					</button>
				))}
			</div>
			<div className='demo-controls'>
				<button className='button-dark' onClick={play} aria-label={playing ? '暂停流程演示' : '播放流程演示'}>
					{playing ? <Pause size={15} /> : <Play size={15} />} {playing ? '暂停' : step === demo.steps.length - 1 ? '重新播放' : '开始演示'}
				</button>
				<button
					className='button-light'
					onClick={() => {
						setPlaying(false)
						setStep(value => Math.min(demo.steps.length - 1, value + 1))
					}}
					disabled={step === demo.steps.length - 1}>
					<SkipForward size={15} />
					下一步
				</button>
				<button
					className='icon-button'
					aria-label='重置流程演示'
					onClick={() => {
						setPlaying(false)
						setStep(-1)
					}}>
					<RotateCcw size={16} />
				</button>
				<p role='status'>{step === demo.steps.length - 1 && !playing ? '演示结束' : playing ? '演示播放中' : '点击运行，或逐步查看'}</p>
			</div>
			<p className='demo-footnote'>依据仓库 README 绘制的交互示意，不连接真实服务，不执行项目命令。</p>
		</section>
	)
}
