'use client'

import '@/styles/floating-companion.css'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, Trash2, ArrowUp, Square, X } from 'lucide-react'
import { decodeAnswer, readAgentEvents, type Answer, type AgentConfig } from './client'
import { characterCue } from './performance'
import type { CharacterEvent } from './character-companion'
import { companionCharacters, defaultCompanionCharacter, isCompanionCharacter, type CompanionCharacter } from './companion-characters'

type Quota = { limit: number; used: number; remaining: number; resetAt: string; canAsk: boolean; blockedReason?: string }
type Turn = { id: number; question: string; answer?: Answer; state: 'pending' | 'complete' | 'stopped' | 'failed' }
export function decodeQuota(value: unknown): Quota {
	const v = value as Quota
	if (!v || v.limit !== 20 || !Number.isInteger(v.used) || v.used < 0 || v.used > 20 || v.remaining !== 20 - v.used || typeof v.canAsk !== 'boolean' || typeof v.resetAt !== 'string' || !Number.isFinite(Date.parse(v.resetAt))) throw Error('提问额度格式异常。')
	return v
}
const dismissedKey = 'zenix.companion.dismissed', greetedKey = 'zenix.companion.greeted'
function readFlag(key: string) { try { return sessionStorage.getItem(key) === '1' } catch { return false } }
function writeFlag(key: string, enabled: boolean) { try { if (enabled) sessionStorage.setItem(key, '1'); else sessionStorage.removeItem(key) } catch {} }

export function FloatingCompanion({ chatEnabled }: { chatEnabled: boolean }) {
	const pathname = usePathname(), search = useSearchParams(), router = useRouter()
	const [visible, setVisible] = useState(false), [open, setOpen] = useState(false), [ready, setReady] = useState(false), [failed, setFailed] = useState(false)
	const [character, setCharacter] = useState<CompanionCharacter>(defaultCompanionCharacter)
	const [draft, setDraft] = useState(''), [turns, setTurns] = useState<Turn[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState('')
	const [quota, setQuota] = useState<Quota | null>(null), [config, setConfig] = useState<AgentConfig | null>(null), [connecting, setConnecting] = useState(false)
	const iframe = useRef<HTMLIFrameElement>(null), input = useRef<HTMLTextAreaElement>(null), toggle = useRef<HTMLButtonElement>(null), log = useRef<HTMLDivElement>(null)
	const active = useRef<AbortController | null>(null), generation = useRef(0), history = useRef<CharacterEvent[]>([]), connected = useRef(false), path = useRef(pathname), lastPage = useRef(''), mounted = useRef(false)
	const selectedCharacter = useRef<CompanionCharacter>(defaultCompanionCharacter), replayPending = useRef(false)
	const scene = companionCharacters[character]
	const suppressed = pathname === '/live2d' || pathname.startsWith('/write') || pathname.startsWith('/edit') || search.get('desktop') === '1'
	path.current = pathname
	const post = useCallback((data: object) => { if (connected.current) iframe.current?.contentWindow?.postMessage(data, location.origin) }, [])
	const relay = useCallback((event: CharacterEvent) => {
		if (event.type === 'begin' || event.type === 'clear') history.current = []
		history.current.push(event); if (history.current.length > 16) history.current.splice(1, history.current.length - 16)
		post({ type: 'zenix.agent.event', event })
	}, [post])
	const context = useCallback(() => {
		const replay = replayPending.current
		if (!connected.current || (lastPage.current === path.current && !replay)) return
		const greet = replay || path.current === '/' || !readFlag(greetedKey)
		post({ type: 'zenix.companion.context', path: path.current, greet, replay })
		lastPage.current = path.current
		replayPending.current = false
		if (greet) writeFlag(greetedKey, true)
	}, [post])
	useEffect(() => { mounted.current = true; setVisible(!readFlag(dismissedKey)); return () => { mounted.current = false; active.current?.abort() } }, [])
	useEffect(() => {
		if (chatEnabled && search.get('chat') === '1') {
			writeFlag(dismissedKey, false); setVisible(true); setOpen(true)
			const next = new URLSearchParams(search.toString()); next.delete('chat'); router.replace(pathname + (next.size ? '?' + next.toString() : ''), { scroll: false })
		}
	}, [chatEnabled, search, pathname, router])
	useEffect(() => {
		const restore = () => { if (!chatEnabled) return; writeFlag(dismissedKey, false); setVisible(true); setOpen(true) }
		const recall = (event: Event) => {
			if (path.current !== '/') return
			const requested: unknown = (event as CustomEvent<unknown>).detail
			const next = isCompanionCharacter(requested) ? requested : selectedCharacter.current
			replayPending.current = true
			writeFlag(dismissedKey, false)
			setVisible(true)
			if (selectedCharacter.current !== next) {
				connected.current = false
				selectedCharacter.current = next
				setCharacter(next)
			} else {
				context()
			}
		}
		window.addEventListener('zenix.companion.open', restore)
		window.addEventListener('zenix.companion.recall', recall)
		return () => {
			window.removeEventListener('zenix.companion.open', restore)
			window.removeEventListener('zenix.companion.recall', recall)
		}
	}, [chatEnabled, context])
	useEffect(() => {
		connected.current = false; lastPage.current = ''; setReady(false); setFailed(false)
		if (!visible || suppressed) return
		const timer = setTimeout(() => { if (!connected.current) setFailed(true) }, 12000)
		const receive = (event: MessageEvent) => {
			if (event.origin !== location.origin || event.source !== iframe.current?.contentWindow || event.data?.type !== 'zenix.character.ready' || event.data.modelId !== character) return
			connected.current = true; clearTimeout(timer); setReady(true); setFailed(false); context()
			for (const event of history.current) post({ type: 'zenix.agent.event', event })
		}
		window.addEventListener('message', receive)
		return () => { clearTimeout(timer); connected.current = false; window.removeEventListener('message', receive) }
	}, [visible, suppressed, character, context, post])
	useEffect(() => { if (ready) context() }, [pathname, ready, context])
	useEffect(() => {
		if (!visible || suppressed) return
		let previous = 0
		const move = (event: PointerEvent) => {
			if (event.pointerType !== 'mouse' || event.timeStamp - previous < 32 || !connected.current) return
			previous = event.timeStamp; const r = iframe.current?.getBoundingClientRect(); if (!r) return
			post({ type: 'zenix.companion.pointer', x: Math.max(-.8, Math.min(.8, (event.clientX - r.left - r.width / 2) / Math.max(innerWidth / 2, r.width))), y: Math.max(-.8, Math.min(.8, (event.clientY - r.top - r.height / 2) / Math.max(innerHeight / 2, r.height))) })
		}
		const blur = () => post({ type: 'zenix.companion.pointer', x: 0, y: 0 })
		window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('blur', blur)
		return () => { window.removeEventListener('pointermove', move); window.removeEventListener('blur', blur) }
	}, [visible, suppressed, post])
	const refreshQuota = useCallback(async () => {
		const response = await fetch('/api/agent/quota', { signal: AbortSignal.timeout(8000), cache: 'no-store' })
		if (!response.ok) throw Error('暂时无法读取提问额度，请稍后再试。')
		const q = decodeQuota(await response.json()); if (mounted.current) setQuota(q)
	}, [])
	useEffect(() => {
		if (!open || !visible || suppressed) return
		let current = true; const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 8000)
		setConnecting(true); setError('')
		Promise.all([fetch('/api/agent/config', { signal: controller.signal }), fetch('/api/agent/quota', { signal: controller.signal, cache: 'no-store' })]).then(async responses => {
			if (responses.some(r => !r.ok)) throw Error('暂时连接不上小站向导，请稍后再试。')
			const [c, q] = await Promise.all(responses.map(r => r.json()))
			if (!['retrieval-only', 'adk-rag'].includes(c.mode)) throw Error('向导配置异常。')
			const usage = decodeQuota(q); if (current) { setConfig(c); setQuota(usage) }
		}).catch(() => { if (current) { setConfig(null); setQuota(null); setError('暂时连接不上问答服务。你可以继续逛小站，稍后重新打开对话。') } }).finally(() => { clearTimeout(timer); if (current) setConnecting(false) })
		input.current?.focus({ preventScroll: true })
		return () => { current = false; controller.abort(); clearTimeout(timer) }
	}, [open, visible, suppressed])
	useEffect(() => {
		if (!open || !quota) return
		const timer = setTimeout(() => { void refreshQuota().catch(() => {}) }, Math.max(100, Date.parse(quota.resetAt) - Date.now() + 100))
		const focus = () => { void refreshQuota().catch(() => {}) }; window.addEventListener('focus', focus)
		return () => { clearTimeout(timer); window.removeEventListener('focus', focus) }
	}, [open, quota, refreshQuota])
	useEffect(() => { if (open && log.current) log.current.scrollTop = log.current.scrollHeight }, [turns, open])
	const closeChat = useCallback(() => { setOpen(false); active.current?.abort(); toggle.current?.focus({ preventScroll: true }) }, [])
	useEffect(() => {
		if (!open) return
		const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); closeChat() } }
		window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape)
	}, [open, closeChat])
	function dismiss() { replayPending.current = false; active.current?.abort(); relay({ type: 'clear', turn: ++generation.current }); setBusy(false); setOpen(false); setVisible(false); writeFlag(dismissedKey, true) }
	async function ask() {
		const question = draft.trim()
		if (!question || active.current || !quota?.canAsk || !config || connecting) return
		if ([...question].length > 1200) { setError('问题请控制在 1200 字以内。'); return }
		const controller = new AbortController(), id = ++generation.current; active.current = controller
		setBusy(true); setError(''); setTurns(old => [...old.slice(-19), { id, question, state: 'pending' }])
		relay({ type: 'begin', turn: id, mode: config.mode })
		let answer: Answer | undefined, complete = false, limited = false
		let failureMessage = '暂时没能回复你，请稍后再试。'
		const update = (patch: Partial<Turn>) => { if (mounted.current && generation.current === id) setTurns(old => old.map(turn => turn.id === id ? { ...turn, ...patch } : turn)) }
		const timer = setTimeout(() => controller.abort(new DOMException('等待回答超时。', 'TimeoutError')), 55000)
		try {
			const response = await fetch('/api/agent/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: question }), signal: controller.signal })
			if (!response.ok) {
				const body = await response.json().catch(() => null)
				if (body?.quota) { const usage = decodeQuota(body.quota); limited = !usage.canAsk; setQuota(usage) }
				if (response.status === 429 && !limited) failureMessage = '现在有点忙，请稍后再试。'
				throw Error('request failed')
			}
			await readAgentEvents(response, controller.signal, event => {
				if (generation.current !== id || !mounted.current) return
				const data = event.data as { text?: string; mode?: string; status?: string; message?: string }
				if (event.name === 'quota') setQuota(decodeQuota(event.data))
				if (event.name === 'meta') relay({ type: 'meta', turn: id, mode: data.mode })
				if (event.name === 'answer') { answer = decodeAnswer(event.data); update({ answer }); relay({ type: 'answer', turn: id, mode: answer.mode, ...characterCue(answer) }) }
				if (event.name === 'done') complete = data.status === 'complete'
				if (event.name === 'error') throw Error('reply failed')
			})
			if (!complete || !answer) throw Error('回答在途中断开了，请稍后再试。')
			if (generation.current !== id || !mounted.current) return
			update({ state: 'complete' }); relay({ type: 'done', turn: id }); setDraft(value => value.trim() === question ? '' : value)
		} catch (reason) {
			if (generation.current !== id || !mounted.current) return
			const stopped = controller.signal.aborted && controller.signal.reason?.name !== 'TimeoutError'
			update({ state: stopped ? 'stopped' : 'failed' }); relay({ type: stopped ? 'cancel' : 'error', turn: id })
			if (!stopped && !limited) setError(controller.signal.reason?.name === 'TimeoutError' ? '等得有点久了，请稍后再试。' : failureMessage)
		} finally {
			clearTimeout(timer); if (active.current === controller) active.current = null
			if (mounted.current && generation.current === id) setBusy(false)
			if (mounted.current) void refreshQuota().catch(() => {})
		}
	}
	if (suppressed) return null
	if (!visible) return null
	return <aside className={`floating-companion${open ? ' is-chat-open' : ''}`} aria-label='小站看板娘'>
		<div className='companion-figure'><iframe key={character} ref={iframe} src={scene.src} title={scene.title} sandbox='allow-scripts allow-same-origin' />{failed && <p className='companion-model-error'>人物暂未载入，对话仍可使用。</p>}</div>
		<div className='companion-actions'>{chatEnabled && <button ref={toggle} type='button' aria-label={open ? '收起看板娘对话' : '打开看板娘对话'} aria-expanded={open} aria-controls='companion-chat' title='对话' onClick={() => open ? closeChat() : setOpen(true)}><MessageCircle size={18} /><span>对话</span></button>}<button type='button' aria-label='关闭看板娘' title='本次浏览隐藏看板娘' onClick={dismiss}><Trash2 size={17} /></button></div>
		{chatEnabled && open && <section id='companion-chat' className='companion-chat' role='dialog' aria-label='和看板娘对话'>
			<header><strong>问问小站</strong><button type='button' aria-label='收起对话' onClick={closeChat}><X size={18} /></button></header>
			<div ref={log} className='companion-messages' role='log' aria-label='看板娘对话记录'>
				{turns.length === 0 && <p className='companion-welcome'>你好，想看看项目、学习记录，还是找个页面？</p>}
				{turns.map(turn => <article key={turn.id} className='companion-turn'><p className='companion-question'>{turn.question}</p><div className='companion-answer'>
					{turn.answer ? <>{turn.answer.paragraphs.map((p, i) => <p key={i}>{p.text}</p>)}{turn.answer.sources.length > 0 && <details><summary>相关页面</summary>{turn.answer.sources.map(source => <Link key={source.id} href={source.path}>{source.title}</Link>)}</details>}</> : <p>{turn.state === 'pending' ? '正在回复…' : turn.state === 'stopped' ? '已停止回复。' : '暂时没能回复。'}</p>}
					{turn.answer && turn.state !== 'complete' && turn.state !== 'pending' && <small>这次回复未完成。</small>}
				</div></article>)}
			</div>
			{connecting && <p className='companion-chat-status' role='status'>连接中…</p>}
			{quota && !quota.canAsk && <p className='companion-chat-notice' role='status'>今天先聊到这里，明天再来找我吧。</p>}
			{error && <p className='companion-chat-error' role='alert'>{error}</p>}
			<form aria-busy={connecting} onSubmit={event => { event.preventDefault(); void ask() }}><label className='sr-only' htmlFor='companion-question'>询问小站功能</label><textarea ref={input} id='companion-question' rows={2} maxLength={1200} value={draft} onChange={event => setDraft(event.target.value)} placeholder='问点什么…' onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} /><div className='companion-compose-row'>{busy ? <button type='button' aria-label='停止回答' onClick={() => active.current?.abort()}><Square size={15} /></button> : <button type='submit' aria-label='发送问题' disabled={connecting || !config || !quota?.canAsk || !draft.trim()}><ArrowUp size={18} /></button>}</div></form>
		</section>}
	</aside>
}
