'use client'

import '@/styles/floating-companion.css'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, ChevronDown, MessageCircle, Search, Sparkles, X } from 'lucide-react'
import { useAppearance } from '@/features/appearance/theme'
import { BENTO_STYLES } from '@/features/appearance/theme-model'
import { play, ZENBOT_CHIRP } from '@/lib/sound'
import { PixelBrushIcon, PixelSoundOffIcon, PixelSoundOnIcon, PixelWalkerIcon, PixelWalkerOffIcon, StyleGlyph } from '@/features/zenbot/pixel-icons'
import { mountZenbotFigure, ZENBOT_FALLBACK_STAND, ZENBOT_FALLBACK_WAVE, type ZenbotRigFigure } from '@/features/zenbot/runtime'
import { CompanionBubble, type CompanionMessage } from './companion-bubble'
import { MaintenanceControls } from '@/components/maintenance-controls'
import { companionAction, shouldRoam } from './companion-motion'
import { positionCompanion } from './companion-position'
import { ZENBOT_RIG_MOTION_SPECS } from '@/features/zenbot/runtime/characters/zenbot-rig-motions.js'
import { pageGuide, type GuideChoice, type ZenbotGuideMotion } from './page-guide'

type RoamClip = 'walk' | 'idle' | 'wave' | 'look' | 'sit' | 'hop' | 'nod' | 'bow' | 'spin' | 'dance'

const EDGE_LEFT = 24
const RIGHT_DOCK_RESERVE = 112
const WALK_SPEED_PX_PER_SEC = 54

function mapGuideMotion(motion?: ZenbotGuideMotion): { gesture: RoamClip; face: string; duration: number } {
	switch (motion) {
		case 'wave':
			return { gesture: 'wave', face: 'happy', duration: 1.7 }
		case 'shyPeek':
			return { gesture: 'bow', face: 'shy', duration: 1.7 }
		case 'spin':
			return { gesture: 'spin', face: 'excited', duration: 0.8 }
		case 'hop':
			return { gesture: 'hop', face: 'excited', duration: 0.9 }
		case 'dance':
			return { gesture: 'dance', face: 'happy', duration: 3.4 }
		case 'happyNod':
		default:
			return { gesture: 'nod', face: 'happy', duration: 0.8 }
	}
}

export function FloatingCompanion() {
	const pathname = usePathname()
	const search = useSearchParams()
	const router = useRouter()
	const appearance = useAppearance()
	const guide = pageGuide(pathname)

	const [mounted, setMounted] = useState(false)
	useEffect(() => setMounted(true), [])
	const [open, setOpen] = useState(false)
	const [styleOpen, setStyleOpen] = useState(false)
	const [fallbackMode, setFallbackMode] = useState(false)
	const [fallbackWaving, setFallbackWaving] = useState(false)
	const [message, setMessage] = useState<CompanionMessage | null>(null)
	const [bubbleHeight, setBubbleHeight] = useState(0)
	const messageId = useRef(0)
	const [selection, setSelection] = useState<{ pathname: string; choiceId: string } | null>(null)
	const [pocketLeft, setPocketLeft] = useState<number | null>(null)

	const walkerRef = useRef<HTMLDivElement>(null)
	const petGRef = useRef<SVGGElement>(null)
	const panelRef = useRef<HTMLElement>(null)
	const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const simRef = useRef({
		x: 180,
		facing: 1,
		mode: 'walk' as RoamClip,
		modeT: 0,
		lastContactAt: 0,
		gaitPhase: 0,
		face: 'neutral',
		talkUntil: 0,
		gesture: null as { kind: string; startedAt: number; duration: number; face: string } | null,
		pointerLook: [0, 0] as [number, number],
		open: false,
		hovered: false,
		placed: false
	})

	const suppressed = pathname === '/live2d' || pathname.startsWith('/write') || pathname.startsWith('/edit') || search.get('desktop') === '1'
	const walkerEnabled = appearance?.walkerEnabled ?? true
	const selected = selection?.pathname === pathname ? guide.choices.find(choice => choice.id === selection.choiceId) : undefined

	const showBubble = useCallback((text: string, holdMs = 6000, links?: CompanionMessage['links']) => {
		if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
		setMessage({ id: ++messageId.current, text, links })
		if (holdMs > 0) bubbleTimerRef.current = setTimeout(() => setMessage(null), Math.max(holdMs, text.length * 22 + 5000))
	}, [])
	useEffect(
		() => () => {
			if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
		},
		[]
	)

	const triggerGesture = useCallback(
		(kind: RoamClip, face: string, duration = 1.4, talkSeconds = 0) => {
			const now = performance.now() / 1000
			duration = ZENBOT_RIG_MOTION_SPECS[kind as keyof typeof ZENBOT_RIG_MOTION_SPECS]?.seconds ?? duration
			simRef.current.gesture = { kind, startedAt: now, duration, face }
			simRef.current.lastContactAt = now
			simRef.current.face = face
			if (talkSeconds > 0) {
				simRef.current.talkUntil = now + talkSeconds
			}
			if (fallbackMode) {
				setFallbackWaving(true)
				setTimeout(() => setFallbackWaving(false), duration * 1000)
			}
		},
		[fallbackMode]
	)

	const syncPocketPosition = useCallback(() => {
		if (typeof window === 'undefined') return
		const vw = window.innerWidth
		if (vw <= 760) {
			setPocketLeft(null)
			return
		}
		const dialogWidth = 348
		const preferred = simRef.current.x - dialogWidth / 2 + 52
		const clamped = Math.max(16, Math.min(vw - RIGHT_DOCK_RESERVE - dialogWidth, preferred))
		setPocketLeft(Math.round(clamped))
	}, [])

	const openCompanionChat = useCallback(
		(withGreeting = true) => {
			if (appearance && !appearance.walkerEnabled) {
				appearance.setWalkerEnabled(true)
			}
			window.dispatchEvent(new CustomEvent('zenbot:panel', { detail: 'companion' }))
			simRef.current.open = true
			setOpen(true)
			syncPocketPosition()
			play(ZENBOT_CHIRP)
			triggerGesture('wave', 'happy', 1.65, 1.2)
			if (withGreeting) {
				showBubble(guide.greeting, 3800)
			}
		},
		[appearance, guide.greeting, showBubble, syncPocketPosition, triggerGesture]
	)

	const closeChat = useCallback(() => {
		simRef.current.open = false
		setOpen(false)
	}, [])

	useEffect(() => {
		simRef.current.open = open
		if (open) syncPocketPosition()
	}, [open, syncPocketPosition])

	// Route change greeting cue
	useEffect(() => {
		setSelection(null)
		const nextGuide = pageGuide(pathname)
		if (walkerEnabled && !suppressed) {
			triggerGesture(pathname === '/' ? 'wave' : 'nod', 'happy', 1.3, 0.8)
			showBubble(nextGuide.greeting, 3200)
		}
	}, [pathname, showBubble, suppressed, triggerGesture, walkerEnabled])

	// Support ?chat=1 from /assistant redirect
	useEffect(() => {
		if (search.get('chat') !== '1') return
		openCompanionChat(true)
		const next = new URLSearchParams(search.toString())
		next.delete('chat')
		router.replace(pathname + (next.size ? '?' + next.toString() : ''), { scroll: false })
	}, [search, pathname, router, openCompanionChat])

	// Support existing global events ('zenix.companion.open' & 'zenix.companion.recall')
	useEffect(() => {
		const handleOpen = () => openCompanionChat(true)
		const handleRecall = () => openCompanionChat(true)
		window.addEventListener('zenix.companion.open', handleOpen)
		window.addEventListener('zenix.companion.recall', handleRecall)
		return () => {
			window.removeEventListener('zenix.companion.open', handleOpen)
			window.removeEventListener('zenix.companion.recall', handleRecall)
		}
	}, [openCompanionChat])

	// Escape key closes pocket dialog
	useEffect(() => {
		if (!open || suppressed) return
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !event.defaultPrevented) {
				event.preventDefault()
				closeChat()
			}
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [open, suppressed, closeChat])

	// Mount WebGL Zenbot figure & bottom roam loop
	useEffect(() => {
		if (suppressed || !walkerEnabled) return
		const petG = petGRef.current
		const walker = walkerRef.current
		if (!petG || !walker) return

		let cancelled = false
		let figure: ZenbotRigFigure | null = null
		let raf = 0
		let lastMs = performance.now()
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

		const maxWalkX = () => Math.max(EDGE_LEFT + 20, window.innerWidth - RIGHT_DOCK_RESERVE - 104)

		if (!simRef.current.placed) {
			simRef.current.x = Math.min(maxWalkX(), Math.max(EDGE_LEFT + 40, Math.round(window.innerWidth * 0.22)))
			simRef.current.placed = true
		}

		const tick = (nowMs: number) => {
			if (cancelled) return
			const dt = Math.min(0.05, Math.max(0, (nowMs - lastMs) / 1000))
			lastMs = nowMs
			const nowSec = nowMs / 1000
			const s = simRef.current

			const action = s.gesture ? companionAction(s.gesture.kind, nowSec - s.gesture.startedAt) : null
			if (s.gesture && !action) {
				s.gesture = null
				s.face = 'neutral'
			}
			const moving = shouldRoam(nowSec, s.lastContactAt, Boolean(action), reducedMotion.matches)
			const nextMode = moving ? 'walk' : 'idle'
			if (s.mode !== nextMode) {
				s.mode = nextMode
				s.modeT = 0
			}
			s.modeT += dt
			if (moving) {
				s.x += s.facing * WALK_SPEED_PX_PER_SEC * dt
				s.gaitPhase = (s.gaitPhase + dt * 2.1) % 1
				if (s.x >= maxWalkX()) {
					s.x = maxWalkX()
					s.facing = -1
				} else if (s.x <= EDGE_LEFT) {
					s.x = EDGE_LEFT
					s.facing = 1
				}
			}
			const frameMode = action?.mode ?? s.mode
			const frameFace = s.gesture?.face ?? s.face
			const activeGesture = action?.gesture ?? null
			walker.dataset.motion = s.gesture?.kind ?? frameMode
			walker.dataset.moving = String(moving)
			const talking = nowSec < s.talkUntil ? 0.85 : 0
			positionCompanion(walker, s.x)

			const innerFlip = walker.querySelector<HTMLElement>('.zenbot-walker-flip')
			if (innerFlip) {
				const scaleDir = moving ? s.facing : 1
				innerFlip.style.transform = `scaleX(${scaleDir})`
			}

			if (figure && petG) {
				figure.draw(petG, frameFace, {
					t: nowSec,
					mode: frameMode,
					modeT: action?.modeT ?? s.modeT,
					jumpV: action?.jumpV,
					face: frameFace,
					facing: moving ? s.facing : 1,
					velX: moving ? s.facing * WALK_SPEED_PX_PER_SEC : 0,
					gaitPhase: s.gaitPhase,
					sit: frameMode === 'sit' ? 1 : 0,
					talk: talking,
					look: s.pointerLook,
					gesture: activeGesture
				})
			}

			raf = requestAnimationFrame(tick)
		}

		const onPointerMove = (event: PointerEvent) => {
			if (event.pointerType !== 'mouse') return
			const rect = walker.getBoundingClientRect()
			const cx = rect.left + rect.width / 2
			const cy = rect.top + rect.height / 2
			const gx = Math.max(-4.5, Math.min(4.5, ((event.clientX - cx) / Math.max(240, window.innerWidth * 0.4)) * 4.5))
			const gy = Math.max(-3.5, Math.min(3.5, ((event.clientY - cy) / Math.max(220, window.innerHeight * 0.4)) * 3.5))
			simRef.current.pointerLook = [gx, gy]
		}

		const onResize = () => {
			simRef.current.x = Math.min(Math.max(EDGE_LEFT, simRef.current.x), maxWalkX())
			if (simRef.current.open) syncPocketPosition()
		}

		window.addEventListener('pointermove', onPointerMove, { passive: true })
		window.addEventListener('resize', onResize)

		mountZenbotFigure({ pixelRatio: 2 })
			.then(mounted => {
				if (cancelled) {
					mounted.dispose()
					return
				}
				figure = mounted
				setFallbackMode(false)
			})
			.catch(() => {
				if (!cancelled) setFallbackMode(true)
			})

		raf = requestAnimationFrame(tick)

		return () => {
			cancelled = true
			cancelAnimationFrame(raf)
			window.removeEventListener('pointermove', onPointerMove)
			window.removeEventListener('resize', onResize)
			figure?.dispose()
		}
	}, [mounted, suppressed, syncPocketPosition, walkerEnabled])

	function choose(choice: GuideChoice) {
		setSelection({ pathname, choiceId: choice.id })
		play(ZENBOT_CHIRP)
		const mapped = mapGuideMotion(choice.motion)
		triggerGesture(mapped.gesture, mapped.face, mapped.duration, 1.9)
		showBubble(choice.text, 0, choice.links)
	}

	useEffect(() => {
		const other = (event: Event) => {
			if ((event as CustomEvent<string>).detail !== 'companion') {
				closeChat()
				setStyleOpen(false)
				setMessage(null)
			}
		}
		window.addEventListener('zenbot:panel', other)
		return () => window.removeEventListener('zenbot:panel', other)
	}, [closeChat])

	if (!mounted) return null
	return (
		<>
			{/* Bottom-roaming Zenbot companion */}
			{walkerEnabled && !suppressed && (
				<div
					ref={walkerRef}
					id='zenbot-walker'
					className={'zenbot-walker' + (open ? ' is-chat-open' : '')}
					onPointerMove={() => {
						simRef.current.lastContactAt = performance.now() / 1000
					}}
					onPointerDown={() => {
						simRef.current.lastContactAt = performance.now() / 1000
					}}
					onMouseEnter={() => {
						simRef.current.lastContactAt = performance.now() / 1000
					}}
					onMouseLeave={() => {
						simRef.current.lastContactAt = performance.now() / 1000
					}}>
					{message && <CompanionBubble key={message.id} message={message} onHeight={setBubbleHeight} onClose={() => setMessage(null)} />}
					<button
						type='button'
						className='zenbot-walker-hit'
						aria-label={open ? '收起 Zenbot 对话' : '和 Zenbot 聊聊'}
						aria-expanded={open}
						aria-controls='companion-chat'
						onClick={() => (open ? closeChat() : openCompanionChat(false))}>
						<span className='zenbot-walker-flip'>
							{!fallbackMode ? (
								<svg className='zenbot-walker-svg' viewBox='-28 -72 312 348' aria-hidden='true'>
									<ellipse cx='128' cy='256' rx='54' ry='10' className='zenbot-ground-shadow' />
									<g ref={petGRef} />
								</svg>
							) : (
								<img src={fallbackWaving ? ZENBOT_FALLBACK_WAVE : ZENBOT_FALLBACK_STAND} alt='Zenbot' className='zenbot-walker-fallback' />
							)}
						</span>
					</button>
				</div>
			)}

			{/* Pocket Preset Q&A Dialog (migrated from page-guide.ts onto Zenbot) */}
			{open && !suppressed && (
				<section
					ref={panelRef}
					id='companion-chat'
					className='zenbot-pocket-dialog bento-card'
					style={
						{ ...(pocketLeft !== null ? { left: `${pocketLeft}px` } : {}), '--companion-reply-height': message ? `${bubbleHeight}px` : '0px' } as CSSProperties
					}
					role='dialog'
					aria-label='和 Zenbot 聊聊'>
					<header className='zenbot-pocket-header'>
						<div className='zenbot-pocket-title'>
							<span className='zenbot-status-dot' aria-hidden='true' />
							<div>
								<strong>你好，我是 Zenbot</strong>
							</div>
						</div>
						<button type='button' className='zenbot-pocket-close' aria-label='收起对话' onClick={closeChat}>
							<X size={17} />
						</button>
					</header>

					<button type='button' className='zenbot-search-entry' onClick={() => window.dispatchEvent(new Event('zenbot:search'))}>
						<Search size={15} />
						<span>搜索文章、项目与音乐</span>
					</button>
					<div className='zenbot-pocket-tricks' aria-label='预设动作'>
						{(
							[
								['wave', 'happy', '挥挥手'],
								['spin', 'excited', '转个圈'],
								['hop', 'excited', '开心跳'],
								['sit', 'happy', '歇会儿']
							] as const
						).map(([motion, face, label]) => (
							<button type='button' key={motion} onClick={() => triggerGesture(motion, face)}>
								<Sparkles size={12} aria-hidden='true' />
								{label}
							</button>
						))}
					</div>
					<div className='companion-guide-content'>
						<div className='companion-choices' aria-label='选择想聊的话题'>
							{guide.choices.map(choice => (
								<button
									key={choice.id}
									type='button'
									className='companion-choice'
									aria-pressed={selected?.id === choice.id}
									aria-controls='companion-reply'
									onClick={() => choose(choice)}>
									<span>{choice.label}</span>
									<ArrowRight size={15} aria-hidden='true' />
								</button>
							))}
						</div>
					</div>
				</section>
			)}

			{/* Bottom-Right Bento Control Dock (ported from Ladvace/astro-bento-portfolio) */}
			{appearance && (
				<div className='bento-control-dock' aria-label='页面风格与伴侣控制栏'>
					<MaintenanceControls />
					<div className='bento-dock-panel'>
						<button
							id='style-panel-toggle'
							type='button'
							className='bento-dock-btn'
							aria-label='展开或收起 UI 风格面板'
							aria-expanded={styleOpen}
							title='切换 UI 风格 (Default / Glass / Neon / Paper / Sharp)'
							onClick={() => {
								if (!styleOpen) window.dispatchEvent(new CustomEvent('zenbot:panel', { detail: 'style' }))
								setStyleOpen(prev => !prev)
							}}>
							{styleOpen ? <ChevronDown size={15} /> : <PixelBrushIcon className='h-4 w-4' />}
						</button>
						<div className={'bento-dock-styles' + (styleOpen ? ' is-open' : '')}>
							{BENTO_STYLES.map((item, idx) => {
								const isActive = appearance.style === item.id && appearance.borderMode !== 'custom'
								return (
									<button
										key={item.id}
										type='button'
										className={'bento-dock-btn bento-style-item' + (isActive ? ' is-active' : '')}
										aria-label={`${item.label} (${item.english})`}
										aria-pressed={isActive}
										title={`${idx + 1}. ${item.label} (${item.english})`}
										onClick={() => appearance.chooseStyle(item.id)}>
										<StyleGlyph index={idx} />
										<span className='bento-dock-badge'>{idx + 1}</span>
									</button>
								)
							})}
							<button
								id='border-toggle'
								type='button'
								className={'bento-dock-btn bento-style-item' + (appearance.borderMode === 'custom' ? ' is-active' : '')}
								aria-label='切换切角边框'
								aria-pressed={appearance.borderMode === 'custom'}
								title='B. 切换九宫格切角边框 (Nine-Slice Frame)'
								onClick={appearance.toggleBorderMode}>
								<span className='bento-border-glyph' />
								<span className='bento-dock-badge'>B</span>
							</button>
						</div>
					</div>

					<button
						id='zenbot-chat-toggle'
						type='button'
						className={'bento-dock-btn bento-dock-single' + (open ? ' is-active' : '')}
						aria-label={open ? '收起 Zenbot 预设问答' : '打开 Zenbot 预设问答'}
						aria-expanded={open}
						title='和 Zenbot 聊聊（预设问题导览）'
						onClick={() => (open ? closeChat() : openCompanionChat(true))}>
						<MessageCircle size={16} />
					</button>

					<button
						id='companion-toggle'
						type='button'
						className={'bento-dock-btn bento-dock-single' + (walkerEnabled ? ' is-active' : '')}
						aria-pressed={walkerEnabled}
						aria-label='显示或隐藏底部漫步 Zenbot'
						title={walkerEnabled ? '隐藏底部漫步 Zenbot' : '召唤底部漫步 Zenbot'}
						onClick={() => {
							if (walkerEnabled && open) closeChat()
							appearance.setWalkerEnabled(!walkerEnabled)
						}}>
						{walkerEnabled ? <PixelWalkerIcon className='h-4 w-4' /> : <PixelWalkerOffIcon className='h-4 w-4' />}
					</button>

					<button
						id='sound-toggle'
						type='button'
						className={'bento-dock-btn bento-dock-single' + (appearance.sound ? ' is-active' : '')}
						aria-pressed={appearance.sound}
						aria-label='开关交互音效'
						title={appearance.sound ? '交互音效：开启（点击静音）' : '交互音效：已静音（点击开启）'}
						onClick={appearance.toggleSound}>
						{appearance.sound ? <PixelSoundOnIcon className='h-4 w-4' /> : <PixelSoundOffIcon className='h-4 w-4' />}
					</button>
				</div>
			)}
		</>
	)
}
