'use client'

import { useEffect, useRef, useState } from 'react'
import {
	ArrowDown,
	ArrowRight,
	ArrowUpRight,
	Check,
	ChevronLeft,
	ChevronRight,
	FileCode2,
	GitPullRequest,
	Pause,
	Play,
	RotateCcw,
	ShieldCheck
} from 'lucide-react'
import { safetyChapters, safetyScenarios, safetyReports } from '@/content/project-showcases'

const labels = { allow: '允许继续', deny: '执行前阻断', needs_human_review: '等待人工审阅' }
const pr = 'https://github.com/trpc-group/trpc-agent-go/pull/2091'

export function ProjectContribution() {
	const [scenarioId, setScenarioId] = useState('delete')
	const [step, setStep] = useState(0)
	const [playing, setPlaying] = useState(false)
	const [speed, setSpeed] = useState(1)
	const [visible, setVisible] = useState(true)
	const root = useRef<HTMLElement>(null)
	const scenario = safetyScenarios.find(item => item.id === scenarioId)!
	const chapter = safetyChapters[step]
	const decided = step >= 3
	useEffect(() => {
		const stopOnHide = () => {
			if (document.hidden) setPlaying(false)
		}
		document.addEventListener('visibilitychange', stopOnHide)
		const observer = new IntersectionObserver(
			([entry]) => {
				setVisible(entry.isIntersecting)
				if (!entry.isIntersecting) setPlaying(false)
			},
			{ threshold: 0 }
		)
		if (root.current) observer.observe(root.current)
		return () => {
			observer.disconnect()
			document.removeEventListener('visibilitychange', stopOnHide)
		}
	}, [])
	useEffect(() => {
		if (!playing || !visible) return
		const timer = window.setTimeout(() => {
			if (step >= safetyChapters.length - 1) setPlaying(false)
			else setStep(value => value + 1)
		}, 4000 / speed)
		return () => window.clearTimeout(timer)
	}, [playing, visible, step, speed])
	const seek = (value: number) => {
		setPlaying(false)
		setStep(Math.min(safetyChapters.length - 1, Math.max(0, value)))
	}
	return (
		<section ref={root} className='contribution-showcase' aria-label='PR 2091 工具安全防护讲解'>
			<div className='contribution-title'>
				<div>
					<p className='eyebrow'>PULL REQUEST / TOOL SAFETY</p>
					<h2>一次调用，怎样在执行前被拦住？</h2>
					<p>用 PR 自带的三组报告，沿着真实改动逐步看。</p>
				</div>
				<a className='button-light' href={pr} target='_blank' rel='noreferrer'>
					<GitPullRequest size={16} /> PR #2091 <ArrowUpRight size={14} />
				</a>
			</div>
			<div className='safety-scenarios' role='group' aria-label='选择工具调用样例'>
				{safetyScenarios.map(item => (
					<button
						key={item.id}
						aria-pressed={scenarioId === item.id}
						onClick={() => {
							setScenarioId(item.id)
							seek(0)
						}}>
						<span>{item.label}</span>
						<small>{item.decision === 'allow' ? 'ALLOW' : item.decision === 'deny' ? 'DENY' : 'REVIEW'}</small>
					</button>
				))}
			</div>
			<div className='contribution-player'>
				<div className='safety-canvas' data-playing={playing} data-decision={decided ? scenario.decision : 'pending'}>
					<div className='safety-canvas-heading'>
						<span>
							<ShieldCheck size={15} /> PRE-EXECUTION GUARD
						</span>
						<span>只读讲解 · 不执行命令</span>
					</div>
					<div className='safety-request'>
						<span>
							workspace_exec <span>→ workspaceexec</span>
						</span>
						<code>{scenario.command}</code>
					</div>
					<div className='safety-path' aria-label='工具执行路径'>
						{['请求', '结构扫描', '策略匹配', '判定', '执行边界', '审计'].map((label, index) => (
							<div key={label} className='safety-node' data-state={index === step ? 'active' : index < step ? 'done' : 'pending'}>
								<span>{index < step ? <Check size={14} /> : String(index + 1).padStart(2, '0')}</span>
								<strong>{label}</strong>
								{index < 5 && <ArrowRight size={14} className='safety-connector' />}
							</div>
						))}
					</div>
					<div className='safety-verdict' aria-live='polite'>
						<span className='safety-verdict-label'>{decided ? labels[scenario.decision] : step === 0 ? '准备读取调用' : '扫描进行中'}</span>
						<p>{decided ? scenario.explanation : '选择一组样例，逐步观察请求、规则与最终判定如何连接。'}</p>
						<div>
							<span>
								risk <strong>{decided ? scenario.risk : '—'}</strong>
							</span>
							<span>
								blocked <strong>{decided ? String(scenario.decision !== 'allow') : '—'}</strong>
							</span>
						</div>
					</div>
					<div className='safety-report'>
						<div>
							<span>{step === 5 ? 'AUDIT / JSONL' : 'SCAN / REPORT'}</span>
							<span>{decided ? scenario.decision : 'pending'}</span>
						</div>
						<pre key={`${scenario.id}-${step}`}>
							{JSON.stringify(
								step === 5
									? {
											tool_name: 'workspace_exec',
											decision: scenario.decision,
											risk_level: scenario.risk,
											...(scenario.rule ? { rule_id: scenario.rule } : {}),
											backend: 'workspaceexec',
											blocked: scenario.decision !== 'allow'
										}
									: {
											tool_name: 'workspace_exec',
											command: scenario.command,
											...(step >= 2 ? { backend: 'workspaceexec' } : {}),
											...(decided
												? {
														decision: scenario.decision,
														risk_level: scenario.risk,
														...(scenario.rule ? { rule_id: scenario.rule } : {}),
														blocked: scenario.decision !== 'allow'
													}
												: {})
										},
								null,
								2
							)}
						</pre>
					</div>
				</div>
				<div className='safety-narrative'>
					<span className='eyebrow'>CHAPTER {String(step + 1).padStart(2, '0')} / 06</span>
					<h3 key={step}>{chapter.title}</h3>
					<p className='safety-caption'>{chapter.caption}</p>
					<p>{chapter.detail}</p>
					<div className='safety-code-reference'>
						<span>
							<FileCode2 size={14} /> 改动位置
						</span>
						<a href={`${pr}/files`} target='_blank' rel='noreferrer'>
							{chapter.file} <ArrowUpRight size={12} />
						</a>
						<code>{chapter.excerpt}</code>
					</div>
					<div className='safety-output'>
						<ArrowDown size={15} />
						<span>{chapter.output}</span>
					</div>
				</div>
			</div>
			<div className='safety-controls'>
				<button
					className='button-dark'
					aria-label={playing ? '暂停 PR 讲解' : '播放 PR 讲解'}
					onClick={() => {
						if (!playing && step === safetyChapters.length - 1) setStep(0)
						setPlaying(value => !value)
					}}>
					{playing ? <Pause size={15} /> : <Play size={15} />}
					{playing ? '暂停讲解' : step === 5 ? '重播讲解' : '开始讲解'}
				</button>
				<button className='icon-button' aria-label='上一讲解步骤' disabled={step === 0} onClick={() => seek(step - 1)}>
					<ChevronLeft size={18} />
				</button>
				<button className='icon-button' aria-label='下一讲解步骤' disabled={step === 5} onClick={() => seek(step + 1)}>
					<ChevronRight size={18} />
				</button>
				<button className='icon-button' aria-label='重置 PR 讲解' onClick={() => seek(0)}>
					<RotateCcw size={16} />
				</button>
				<label className='safety-speed'>
					速度
					<select aria-label='讲解播放速度' value={speed} onChange={event => setSpeed(Number(event.target.value))}>
						<option value={0.5}>0.5×</option>
						<option value={1}>1×</option>
						<option value={1.5}>1.5×</option>
					</select>
				</label>
				<p role='status'>{playing ? '讲解播放中' : step === 5 ? '本组讲解结束' : '可播放，也可直接选择章节'}</p>
			</div>
			<nav className='safety-chapters' aria-label='PR 讲解章节'>
				{safetyChapters.map((item, index) => (
					<button key={item.title} aria-current={index === step ? 'step' : undefined} onClick={() => seek(index)}>
						<span>{String(index + 1).padStart(2, '0')}</span>
						{item.title}
					</button>
				))}
			</nav>
			<div className='safety-comparison'>
				<div>
					<span className='eyebrow'>调用链对照 · 省略已有能力</span>
					<h3>这次 PR 把什么加了进去？</h3>
				</div>
				<div className='safety-before'>
					<span>原有执行链</span>
					<code>工具请求 → 权限策略 → 执行后端</code>
				</div>
				<div className='safety-after'>
					<span>接入本 PR 的策略</span>
					<code>工具请求 → 结构扫描 → YAML 规则 → 判定 → 执行边界 / 审计</code>
				</div>
			</div>
			<details className='safety-full-report'>
				<summary>
					展开这组样例的原始报告<span>包含 findings、建议与 blocked 字段</span>
				</summary>
				<pre>
					{JSON.stringify(
						safetyReports.find(item => item.command === scenario.command),
						null,
						2
					)}
				</pre>
			</details>
			<p className='showcase-provenance'>
				判定来自 PR 中的 tool_safety_report.json；本页只重现讲解状态，不运行样例命令、不提交审批。
				<a href={`${pr}/files`} target='_blank' rel='noreferrer'>
					核对报告与实现 <ArrowUpRight size={12} />
				</a>
			</p>
		</section>
	)
}
