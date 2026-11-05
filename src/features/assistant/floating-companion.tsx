'use client'

import '@/styles/floating-companion.css'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, MessageCircle, Trash2, X } from 'lucide-react'
import { characterCue } from './performance'
import type { CharacterEvent } from './character-companion'
import { companionCharacters, defaultCompanionCharacter, isCompanionCharacter, readCompanionCharacter, saveCompanionCharacter, type CompanionCharacter } from './companion-characters'
import { pageGuide, type GuideChoice } from './page-guide'

const dismissedKey = 'zenix.companion.dismissed'

function isDismissed() {
	try {
		return sessionStorage.getItem(dismissedKey) === '1'
	} catch {
		return false
	}
}

function saveDismissed(value: boolean) {
	try {
		if (value) sessionStorage.setItem(dismissedKey, '1')
		else sessionStorage.removeItem(dismissedKey)
	} catch {}
}

export function FloatingCompanion() {
	const pathname = usePathname()
	const search = useSearchParams()
	const router = useRouter()
	const guide = pageGuide(pathname)
	const [visible, setVisible] = useState(false)
	const [open, setOpen] = useState(false)
	const [ready, setReady] = useState(false)
	const [failed, setFailed] = useState(false)
	const [character, setCharacter] = useState<CompanionCharacter>(defaultCompanionCharacter)
	const [selection, setSelection] = useState<{ pathname: string; choiceId: string } | null>(null)
	const iframe = useRef<HTMLIFrameElement>(null)
	const toggle = useRef<HTMLButtonElement>(null)
	const panel = useRef<HTMLElement>(null)
	const generation = useRef(0)
	const history = useRef<CharacterEvent[]>([])
	const connected = useRef(false)
	const currentPath = useRef(pathname)
	const lastPage = useRef('')
	const selectedCharacter = useRef<CompanionCharacter>(defaultCompanionCharacter)
	const replayPending = useRef(false)
	const scene = companionCharacters[character]
	const suppressed = pathname === '/live2d' || pathname.startsWith('/write') || pathname.startsWith('/edit') || search.get('desktop') === '1'
	const selected = selection?.pathname === pathname ? guide.choices.find(choice => choice.id === selection.choiceId) : undefined
	currentPath.current = pathname

	const post = useCallback((data: object) => {
		if (connected.current) iframe.current?.contentWindow?.postMessage(data, location.origin)
	}, [])

	const context = useCallback(() => {
		const replay = replayPending.current
		if (!connected.current || (lastPage.current === currentPath.current && !replay)) return
		const nextGuide = pageGuide(currentPath.current)
		post({
			type: 'zenix.companion.context',
			path: currentPath.current,
			text: nextGuide.greeting,
			greet: currentPath.current === '/' || replay,
			replay
		})
		lastPage.current = currentPath.current
		replayPending.current = false
	}, [post])

	useEffect(() => {
		const saved = readCompanionCharacter()
		selectedCharacter.current = saved
		setCharacter(saved)
		setVisible(!isDismissed())
	}, [])

	useEffect(() => {
		setSelection(null)
		history.current = []
		post({ type: 'zenix.agent.event', event: { type: 'clear', turn: ++generation.current } })
		context()
	}, [pathname, context, post])

	useEffect(() => {
		if (ready) context()
	}, [ready, context])

	useEffect(() => {
		if (search.get('chat') !== '1') return
		saveDismissed(false)
		setVisible(true)
		setOpen(true)
		const next = new URLSearchParams(search.toString())
		next.delete('chat')
		router.replace(pathname + (next.size ? '?' + next.toString() : ''), { scroll: false })
	}, [search, pathname, router])

	useEffect(() => {
		const restore = () => {
			saveDismissed(false)
			setVisible(true)
			setOpen(true)
		}
		const recall = (event: Event) => {
			if (currentPath.current !== '/') return
			const requested: unknown = (event as CustomEvent<unknown>).detail
			const next = isCompanionCharacter(requested) ? requested : selectedCharacter.current
			saveCompanionCharacter(next)
			replayPending.current = true
			saveDismissed(false)
			setVisible(true)
			if (selectedCharacter.current !== next) {
				history.current = []
				generation.current++
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
	}, [context])

	useEffect(() => {
		connected.current = false
		lastPage.current = ''
		setReady(false)
		setFailed(false)
		if (!visible || suppressed) return
		const timer = setTimeout(() => {
			if (!connected.current) setFailed(true)
		}, 12000)
		const receive = (event: MessageEvent) => {
			if (event.origin !== location.origin || event.source !== iframe.current?.contentWindow || event.data?.modelId !== character) return
			if (event.data.type === 'zenix.companion.talk') {
				setOpen(true)
				return
			}
			if (event.data.type !== 'zenix.character.ready') return
			connected.current = true
			clearTimeout(timer)
			setReady(true)
			setFailed(false)
			context()
			for (const value of history.current) post({ type: 'zenix.agent.event', event: value })
		}
		window.addEventListener('message', receive)
		return () => {
			clearTimeout(timer)
			connected.current = false
			window.removeEventListener('message', receive)
		}
	}, [visible, suppressed, character, context, post])

	useEffect(() => {
		if (!visible || suppressed) return
		let previous = 0
		const move = (event: PointerEvent) => {
			if (event.pointerType !== 'mouse' || event.timeStamp - previous < 32 || !connected.current) return
			previous = event.timeStamp
			const bounds = iframe.current?.getBoundingClientRect()
			if (!bounds) return
			post({
				type: 'zenix.companion.pointer',
				x: Math.max(-0.8, Math.min(0.8, (event.clientX - bounds.left - bounds.width / 2) / Math.max(innerWidth / 2, bounds.width))),
				y: Math.max(-0.8, Math.min(0.8, (event.clientY - bounds.top - bounds.height / 2) / Math.max(innerHeight / 2, bounds.height)))
			})
		}
		const blur = () => post({ type: 'zenix.companion.pointer', x: 0, y: 0 })
		window.addEventListener('pointermove', move, { passive: true })
		window.addEventListener('blur', blur)
		return () => {
			window.removeEventListener('pointermove', move)
			window.removeEventListener('blur', blur)
		}
	}, [visible, suppressed, post])

	const closeChat = useCallback(() => {
		setOpen(false)
		toggle.current?.focus({ preventScroll: true })
	}, [])

	useEffect(() => {
		if (!open || !visible || suppressed) return
		const content = panel.current?.querySelector<HTMLElement>('.companion-guide-content')
		if (content) content.scrollTop = 0
		panel.current?.querySelector<HTMLButtonElement>('.companion-choice')?.focus({ preventScroll: true })
		const escape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !event.defaultPrevented) {
				event.preventDefault()
				closeChat()
			}
		}
		window.addEventListener('keydown', escape)
		return () => window.removeEventListener('keydown', escape)
	}, [open, visible, suppressed, closeChat])

	function dismiss() {
		replayPending.current = false
		history.current = []
		post({ type: 'zenix.agent.event', event: { type: 'clear', turn: ++generation.current } })
		setOpen(false)
		setVisible(false)
		saveDismissed(true)
	}

	function choose(choice: GuideChoice) {
		setSelection({ pathname, choiceId: choice.id })
		const turn = ++generation.current
		const performance = {
			version: 1 as const,
			motion: choice.motion ?? 'happyNod',
			expression: choice.motion === 'shyPeek' ? ('shy' as const) : ('happy' as const),
			bubble: { kind: 'answer' as const, paragraph: 0 },
			intensity: 'soft' as const,
			source: 'local' as const
		}
		const capabilities = scene.capabilities
		const supported =
			capabilities.motions.some(motion => motion === performance.motion) && capabilities.expressions.some(expression => expression === performance.expression)
		const cue = characterCue({ mode: 'preset', paragraphs: [{ text: choice.text }], performance: supported ? performance : undefined })
		const events: CharacterEvent[] = [
			{ type: 'begin', turn, mode: 'preset' },
			{ type: 'answer', turn, mode: 'preset', ...cue },
			{ type: 'done', turn }
		]
		history.current = events
		for (const event of events) post({ type: 'zenix.agent.event', event })
	}

	if (suppressed || !visible) return null

	return (
		<aside className={'floating-companion' + (open ? ' is-chat-open' : '')} aria-label='小站看板娘'>
			<div className='companion-figure'>
				<iframe key={character} ref={iframe} src={scene.src} title={scene.title} sandbox='allow-scripts allow-same-origin' />
				{failed && <p className='companion-model-error'>人物暂未载入，可以先和我聊聊。</p>}
			</div>
			<div className='companion-actions'>
				<button
					ref={toggle}
					type='button'
					aria-label={open ? '收起看板娘对话' : '打开看板娘对话'}
					aria-expanded={open}
					aria-controls='companion-chat'
					onClick={() => (open ? closeChat() : setOpen(true))}>
					<MessageCircle size={18} />
					<span>聊聊</span>
				</button>
				<button type='button' aria-label='关闭看板娘' title='本次浏览隐藏看板娘' onClick={dismiss}>
					<Trash2 size={17} />
				</button>
			</div>
			{open && (
				<section ref={panel} id='companion-chat' className='companion-chat companion-guide' role='dialog' aria-label='和看板娘聊聊'>
					<header>
						<strong>{guide.title}</strong>
						<button type='button' aria-label='收起对话' onClick={closeChat}>
							<X size={18} />
						</button>
					</header>
					<div className='companion-guide-content'>
						<p className='companion-welcome'>{guide.greeting}</p>
						<div className='companion-choices' aria-label='选择想聊的话题'>
							{guide.choices.map(choice => (
								<button
									key={choice.id}
									type='button'
									className='companion-choice'
									aria-pressed={selected?.id === choice.id}
									aria-controls='companion-guide-answer'
									onClick={() => choose(choice)}>
									<span>{choice.label}</span>
									<ArrowRight size={15} aria-hidden='true' />
								</button>
							))}
						</div>
						<div id='companion-guide-answer' className='companion-guide-answer' role='status' aria-live='polite' aria-atomic='true'>
							{selected && (
								<>
									<p>{selected.text}</p>
									{selected.links && (
										<div className='companion-guide-links'>
											{selected.links.map(link => (
												<Link key={link.href} href={link.href}>
													{link.label}
													<ArrowRight size={14} aria-hidden='true' />
												</Link>
											))}
										</div>
									)}
								</>
							)}
						</div>
					</div>
				</section>
			)}
		</aside>
	)
}
