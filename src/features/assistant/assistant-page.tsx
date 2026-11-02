'use client'

import { ArrowUpRight, RotateCcw, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { decodeAnswer, isSource, readAgentEvents, type AgentConfig, type Answer, type Source } from './client'
import { CharacterCompanion, SourceLink, desktopBridge, type CharacterEvent, type CharacterHandle } from './character-companion'
import { characterCue, characterMotions } from './performance'

type Message = { id: number; question: string; answer?: Answer; state: 'pending' | 'complete' | 'stopped' | 'failed' | 'incomplete' }
const suggestions = ['博客有哪些功能？', '如何导出阅读记录？', '怎么使用知识地图？', '如何打开搜索？']

function AnswerView({ answer }: { answer: Answer }) {
	return (
		<>
			{answer.mode !== 'adk-rag' && (
				<p className='agent-answer-mode'>
					{answer.mode === 'retrieval-only' ? '以下是检索到的功能说明，未经模型生成。' : answer.mode === 'scope-limit' ? '当前知识范围' : '资料不足'}
				</p>
			)}
			{answer.paragraphs.map((paragraph, index) => (
				<p className='agent-paragraph' key={index}>
					{paragraph.text}
					{paragraph.sources.map(id => (
						<span className='agent-citation' key={id}>
							[{answer.sources.findIndex(source => source.id === id) + 1}]
						</span>
					))}
				</p>
			))}
			{answer.sources.length > 0 && (
				<div className='agent-sources'>
					<p className='agent-label'>功能说明来源</p>
					{answer.sources.map((source, index) => (
						<details key={source.id}>
							<summary>
								{index + 1}. {source.title}
							</summary>
							<p>{source.text}</p>
							<SourceLink className='agent-source-link' href={source.path}>
								前往 {source.path} <ArrowUpRight size={14} />
							</SourceLink>
						</details>
					))}
				</div>
			)}
		</>
	)
}

export function AssistantPage() {
	const [config, setConfig] = useState<AgentConfig | null>(null)
	const [features, setFeatures] = useState<Source[]>([])
	const [catalogError, setCatalogError] = useState('')
	const [loading, setLoading] = useState(true)
	const [filter, setFilter] = useState('')
	const [draft, setDraft] = useState('')
	const [messages, setMessages] = useState<Message[]>([])
	const [busy, setBusy] = useState(false)
	const [resetting, setResetting] = useState(false)
	const [status, setStatus] = useState('')
	const [error, setError] = useState('')
	const [lastQuestion, setLastQuestion] = useState('')
	const active = useRef<AbortController | null>(null)
	const resetLock = useRef(false)
	const generation = useRef(0)
	const catalogRequest = useRef<AbortController | null>(null)
	const input = useRef<HTMLTextAreaElement>(null)
	const character = useRef<CharacterHandle>(null)
	const [native, setNative] = useState(false)
	const relayCharacter = useCallback((event: CharacterEvent) => { character.current?.send(event); desktopBridge()?.emit(event) }, [])

	const load = useCallback(async () => {
		catalogRequest.current?.abort()
		const controller = new AbortController()
		catalogRequest.current = controller
		const timer = setTimeout(() => controller.abort(), 8000)
		setLoading(true)
		setCatalogError('')
		try {
			const responses = await Promise.all([
				fetch('/api/agent/config', { signal: controller.signal }),
				fetch('/api/agent/features', { signal: controller.signal })
			])
			for (const response of responses)
				if (!response.ok) {
					const body = await response.json().catch(() => null)
					throw new Error(body?.error?.message || '功能目录暂时不可用。')
				}
			const [nextConfig, data] = await Promise.all(responses.map(response => response.json()))
			if (!Array.isArray(data.features) || !data.features.every(isSource) || !['retrieval-only', 'adk-rag'].includes(nextConfig.mode))
				throw new Error('功能目录格式异常。')
			if (catalogRequest.current !== controller) return
			setConfig(nextConfig)
			setFeatures(data.features)
		} catch (reason) {
			if (catalogRequest.current !== controller) return
			setCatalogError(reason instanceof Error && reason.name !== 'AbortError' ? reason.message : '功能目录连接超时，请稍后重试。')
		} finally {
			clearTimeout(timer)
			if (catalogRequest.current === controller) setLoading(false)
		}
	}, [])

	useEffect(() => {
		setNative(Boolean(desktopBridge()))
		void load()
		return () => {
			catalogRequest.current?.abort()
			catalogRequest.current = null
			active.current?.abort()
			active.current = null
			relayCharacter({ type: 'clear', turn: ++generation.current })
		}
	}, [load, relayCharacter])

	async function ask(value: string) {
		const question = value.trim()
		if (!question || active.current || resetLock.current) return
		if ([...question].length > 1200) {
			setError('问题请控制在 1200 字以内。')
			return
		}
		const controller = new AbortController()
		const id = ++generation.current
		active.current = controller
		relayCharacter({ type: 'begin', turn: id, mode: config?.mode || 'retrieval-only' })
		setBusy(true)
		setError('')
		setLastQuestion(question)
		setStatus('正在连接博客向导…')
		setMessages(previous => [...previous, { id, question, state: 'pending' }])
		const update = (patch: Partial<Message>) => {
			if (generation.current === id) setMessages(previous => previous.map(message => (message.id === id ? { ...message, ...patch } : message)))
		}
		const timer = setTimeout(() => controller.abort(new DOMException('本次回答等待超时。', 'TimeoutError')), 55000)
		let answer: Answer | undefined
		let complete = false
		try {
			const response = await fetch('/api/agent/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: question }),
				signal: controller.signal
			})
			await readAgentEvents(response, controller.signal, event => {
				if (generation.current !== id) return
				const data = event.data as { text?: string; status?: string; message?: string }
				if (event.name === 'meta') relayCharacter({ type: 'meta', turn: id, mode: (event.data as { mode?: string }).mode })
				if (event.name === 'status' && typeof data.text === 'string') { setStatus(data.text); relayCharacter({ type: 'status', turn: id }) }
				if (event.name === 'answer') {
					answer = decodeAnswer(event.data)
					update({ answer })
					relayCharacter({ type: 'answer', turn: id, mode: answer.mode, characters: answer.paragraphs.reduce((n, p) => n + [...p.text].length, 0), ...characterCue(answer) })
				}
				if (event.name === 'done') complete = data.status === 'complete'
				if (event.name === 'error') throw new Error(data.message || '回答生成失败，请稍后重试。')
			})
			if (generation.current !== id) return
			if (!complete || !answer) throw new Error('连接已结束，但回答尚未完成。')
			update({ state: 'complete' })
			relayCharacter({ type: 'done', turn: id })
			setStatus('回答完成')
			setDraft(current => (current.trim() === question ? '' : current))
		} catch (reason) {
			if (generation.current !== id) return
			const stopped = controller.signal.aborted && controller.signal.reason?.name !== 'TimeoutError'
			relayCharacter({ type: stopped ? 'cancel' : 'error', turn: id })
			update({ state: stopped ? 'stopped' : answer ? 'incomplete' : 'failed' })
			setStatus(stopped ? '已停止' : '本次未完成')
			if (!stopped) setError(reason instanceof Error ? reason.message : '连接助手失败，请稍后重试。')
			setDraft(current => current || question)
		} finally {
			clearTimeout(timer)
			if (generation.current === id) {
				active.current = null
				setBusy(false)
			}
		}
	}

	async function clear() {
		if (resetLock.current) return
		resetLock.current = true
		setResetting(true)
		setError('')
		const id = ++generation.current
		relayCharacter({ type: 'clear', turn: id })
		active.current?.abort()
		active.current = null
		setBusy(false)
		setMessages(previous => previous.map(message => (message.state === 'pending' ? { ...message, state: 'stopped' } : message)))
		try {
			const response = await fetch('/api/agent/conversation', { method: 'DELETE', signal: AbortSignal.timeout(8000) })
			if (!response.ok) throw new Error('服务尚未确认清除会话，请稍后重试。')
			if (generation.current !== id) return
			setMessages([])
			setLastQuestion('')
			setStatus('')
			input.current?.focus()
		} catch (reason) {
			if (generation.current === id) setError(reason instanceof Error ? reason.message : '会话清除失败。')
		} finally {
			resetLock.current = false
			setResetting(false)
		}
	}

	const query = filter.trim().toLocaleLowerCase()
	const filtered = features.filter(feature => [feature.title, feature.text, feature.path].join(' ').toLocaleLowerCase().includes(query))
	return (
		<div className={`blog-agent${native ? ' is-desktop' : ''}`}>
			<header className='agent-heading'>
				<div>
					<p className='eyebrow'>ZENIX / BLOG GUIDE</p>
					<h1>问博客</h1>
					<p>了解小站的功能，找到下一处入口。</p>
				</div>
				<button type='button' className='button-light' onClick={clear} disabled={resetting}>
					<RotateCcw size={15} />
					{resetting ? '正在清除…' : '新对话'}
				</button>
			</header>
			<div className='agent-layout'>
				{native ? <section className='agent-character'><p className='agent-muted'>桌面人物会跟随这段对话思考、展示回答和恢复待机。</p></section> : <CharacterCompanion ref={character} />}
				<aside className='agent-catalog' aria-label='博客功能目录'>
					<h2>随处看看</h2>
					<p className='agent-muted'>页面入口与使用方式，都在这里。</p>
					{config?.characterCapabilities?.version === 1 && Array.isArray(config.characterCapabilities.motions) && <details className='agent-action-menu'><summary>让人物动一动</summary><p>点击会发送一条动作请求。</p><div>{config.characterCapabilities.motions.filter(motion => typeof motion.label === 'string' && characterMotions.some(id => id === motion.id)).map(motion => <button type='button' key={motion.id} disabled={busy || resetting} onClick={() => { const request = `请让人物${motion.label}`; setDraft(request); void ask(request) }}>{motion.label}</button>)}</div></details>}
					<label htmlFor='agent-filter'>筛选功能</label>
					<input id='agent-filter' type='search' value={filter} onChange={event => setFilter(event.target.value)} placeholder='搜索功能名称…' />
					{loading && (
						<p role='status' className='agent-muted'>
							正在读取功能目录…
						</p>
					)}
					{catalogError && (
						<div role='alert' className='agent-error'>
							<p>{catalogError}</p>
							<button type='button' className='button-light' onClick={load} disabled={loading}>
								重新连接
							</button>
						</div>
					)}
					{!loading && !catalogError && <p className='agent-count'>{filtered.length ? `${filtered.length} 项功能说明` : '没有匹配的功能，试试其他关键词。'}</p>}
					<div className='agent-feature-list'>
						{filtered.map(feature => (
							<details key={feature.id}>
								<summary>{feature.title}</summary>
								<div className='agent-feature-body'>
									{feature.audience === 'author' && <small>作者维护功能 · 助手只提供说明</small>}
									<p>{feature.text}</p>
									<SourceLink className='agent-source-link' href={feature.path}>
										前往 {feature.path} <ArrowUpRight size={14} />
									</SourceLink>
								</div>
							</details>
						))}
					</div>
				</aside>
				<section className='agent-conversation' aria-label='与博客向导对话'>
					<p className='agent-mode' role='status'>
						{catalogError ? '服务暂不可用' : !config ? '正在连接…' : config.mode === 'adk-rag' ? 'AI 功能问答已配置' : '功能检索已就绪 · AI 问答未启用'}
					</p>
					{messages.length === 0 && (
						<div className='agent-welcome'>
							<h2>想了解小站的哪一面？</h2>
							<p>
								可以问我有哪些功能、怎么使用阅读工作台，
								<br className='agent-desktop-break' />
								或是去哪里看一组照片。
							</p>
							<div className='agent-suggestions'>
								{suggestions.map(question => (
									<button
										type='button'
										key={question}
										disabled={busy || resetting}
										onClick={() => {
											setDraft(question)
											void ask(question)
										}}>
										{question}
										<ArrowUpRight size={14} />
									</button>
								))}
							</div>
						</div>
					)}
					<div className='agent-messages' role='log' aria-label='对话记录'>
						{messages.map(message => (
							<article className='agent-turn' key={message.id}>
								<div className='agent-question'>
									<p className='agent-label'>你</p>
									<p>{message.question}</p>
								</div>
								<div className='agent-response'>
									<p className='agent-label'>ZENIX / 博客向导</p>
									{message.answer && <AnswerView answer={message.answer} />}
									{!message.answer && (
										<p className='agent-muted'>
											{message.state === 'pending' ? '正在查找功能说明…' : message.state === 'stopped' ? '已停止本次回答。' : '本次未能完成回答。'}
										</p>
									)}
									{message.answer && message.state !== 'complete' && message.state !== 'pending' && (
										<p className='agent-answer-mode'>回答未完成，已保留收到的内容。</p>
									)}
								</div>
							</article>
						))}
					</div>
					<p className='agent-request-status' role='status' aria-live='polite'>
						{status}
					</p>
					{error && (
						<div className='agent-error' role='alert'>
							<p>{error}</p>
							{lastQuestion && (
								<button type='button' className='button-light' disabled={busy || resetting} onClick={() => ask(lastQuestion)}>
									重试这个问题
								</button>
							)}
						</div>
					)}
					<form
						className='agent-composer'
						onSubmit={event => {
							event.preventDefault()
							void ask(draft)
						}}>
						<label htmlFor='agent-question' className='sr-only'>
							询问博客功能
						</label>
						<textarea
							id='agent-question'
							ref={input}
							rows={2}
							maxLength={1200}
							value={draft}
							onChange={event => setDraft(event.target.value)}
							placeholder='例如：怎么收藏文章，之后接着读？'
							onKeyDown={event => {
								if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) {
									event.preventDefault()
									event.currentTarget.form?.requestSubmit()
								}
							}}
						/>
						<div className='agent-composer-actions'>
							<span>只介绍功能 · 不收录文章正文</span>
							<div>
								{busy && (
									<button type='button' className='button-light' onClick={() => active.current?.abort()}>
										<Square size={13} />
										停止
									</button>
								)}
								<button type='submit' className='button-dark' disabled={busy || resetting || !draft.trim()}>
									发送 <ArrowUpRight size={16} />
								</button>
							</div>
						</div>
					</form>
					<p className='agent-footnote'>回答附功能说明来源。对话在本机服务中临时保存，服务重启后清除。</p>
				</section>
			</div>
		</div>
	)
}
