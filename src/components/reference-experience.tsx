'use client'

// Ported from Ladvace/astro-bento-portfolio GridTransition, BackLink and sound.
// Original MIT notice: LICENSES/astro-bento-portfolio-MIT.txt.
import '@/styles/reference-pages.css'

import { useEffect, useRef, type CSSProperties } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CARD_HOVER, play } from '@/lib/sound'
import { BUTTON_FRAME } from '@/lib/reference-button-frame'
import { GithubStarHint } from './github-star-hint'
import { appPath } from '@/lib/base-path'

export function navigateWithTransition(href: string) {
	window.dispatchEvent(new CustomEvent('bento:navigate', { detail: href }))
}

function backTarget(path: string) {
	if (path.startsWith('/blog/')) return '/blog'
	if (path.startsWith('/projects/')) return '/projects'
	if (path.startsWith('/pictures/')) return '/pictures'
	if (path.startsWith('/write/')) return '/blog'
	if (['/image-toolbox', '/svgs', '/clock'].includes(path)) return '/share'
	return '/'
}

export function ReferenceBackLink() {
	const path = usePathname()
	return (
		<span className='btn-shell btn-shell--flat reference-back' style={BUTTON_FRAME as CSSProperties}>
			<Link href={backTarget(path)} className='btn--ns btn-chrome'>
				Back
			</Link>
		</span>
	)
}

export function ReferenceExperience() {
	const pathname = usePathname()
	const router = useRouter()
	const overlay = useRef<HTMLDivElement>(null)
	const controller = useRef<{ reveal: () => Promise<void> } | null>(null)
	const previousPath = useRef(pathname)
	useEffect(() => {
		const layer = overlay.current!
		let cells: HTMLDivElement[] = []
		let cols = 0
		let rows = 0
		let phase = Math.random() * Math.PI * 2
		let disposed = false
		let navigating = false
		let running: Animation[] = []
		let popCover: Promise<boolean> | null = null
		const cancelRunning = () => {
			running.forEach(animation => animation.cancel())
			running = []
		}
		let resizeTimer: ReturnType<typeof setTimeout>
		let watchdog: ReturnType<typeof setTimeout>
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
		const theme = () => layer.style.setProperty('--grid-cell', getComputedStyle(document.documentElement).getPropertyValue('--primary-500').trim() || '#38bdf8')
		const build = () => {
			cols = Math.max(1, Math.round(innerWidth / 30))
			const size = innerWidth / cols
			rows = Math.ceil(innerHeight / size) + 1
			layer.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`
			layer.style.gridAutoRows = `${size}px`
			cancelRunning()
			const fragment = document.createDocumentFragment()
			cells = Array.from({ length: cols * rows }, () => {
				const cell = document.createElement('div')
				cell.style.background = 'var(--grid-cell)'
				cell.style.opacity = '0'
				fragment.appendChild(cell)
				return cell
			})
			layer.replaceChildren(fragment)
		}
		const animate = async (to: number, duration: number, spread: number) => {
			cancelRunning()
			phase = Math.random() * Math.PI * 2
			theme()
			if (reduced.matches) {
				cells.forEach(cell => {
					cell.style.opacity = String(to)
				})
				return true
			}
			let last: Animation | undefined
			let lastDelay = -1
			const animations = cells.map((cell, i) => {
				const nx = (i % cols) / Math.max(cols - 1, 1)
				const ny = Math.floor(i / cols) / Math.max(rows - 1, 1)
				const noise =
					Math.cos(nx * 6.2 + ny * 3.7 + phase) * 0.4 +
					Math.cos(nx * 2.1 - ny * 8.5 + phase * 1.3) * 0.35 +
					Math.cos(nx * 11.3 + ny * 1.9 + phase * 0.7) * 0.25 +
					Math.cos(nx * 24.7 + ny * 19.3 + phase * 1.7) * 0.15 +
					Math.cos(nx * 37.1 - ny * 31.6 + phase * 0.5) * 0.1
				const base = 1 - ny
				const jitter = (Math.random() - 0.5) * 0.2 * 4 * base * (1 - base)
				const delay = Math.max(0, (base * 0.55 + noise * 0.22 + jitter) * spread)
				const ms = (delay + duration) * 1000
				const animation = cell.animate({ opacity: to }, { duration: 0, delay: ms, fill: 'forwards' })
				if (ms > lastDelay) {
					lastDelay = ms
					last = animation
				}
				return animation
			})
			running = animations
			await Promise.resolve(last?.finished).catch(() => {})
			if (disposed || running !== animations) return false
			cells.forEach(cell => {
				cell.style.opacity = String(to)
			})
			cancelRunning()
			return true
		}
		const reveal = async (spread = 0.35) => {
			clearTimeout(watchdog)
			window.dispatchEvent(new Event('grid:reveal-start'))
			const completed = await animate(0, 0.25, spread)
			if (!completed || disposed) return
			layer.style.pointerEvents = 'none'
			document.documentElement.classList.add('grid-revealed')
			window.dispatchEvent(new Event('grid:revealed'))
			navigating = false
		}
		const cover = async () => {
			document.documentElement.classList.remove('grid-revealed')
			layer.style.pointerEvents = 'all'
			return animate(1, 0.2, 0.35)
		}
		controller.current = {
			reveal: async () => {
				const pending = popCover
				popCover = null
				if (pending) await pending
				await reveal()
			}
		}
		build()
		theme()
		cells.forEach(cell => {
			cell.style.opacity = '1'
		})
		const initialFrame = requestAnimationFrame(() => {
			void reveal(0.55)
		})
		const navigate = async (href: string) => {
			if (navigating) return
			const target = new URL(href, location.href)
			if (target.origin !== location.origin) {
				location.assign(target.href)
				return
			}
			if (target.pathname + target.search === location.pathname + location.search) return
			navigating = true
			router.prefetch(appPath(target.pathname) + target.search)
			window.dispatchEvent(new CustomEvent('zenbot:panel', { detail: 'navigation' }))
			const covered = await cover()
			if (!covered || disposed) return
			watchdog = setTimeout(() => {
				void reveal()
			}, 12000)
			router.push(appPath(target.pathname) + target.search + target.hash)
			// Query-only navigation has no pathname commit.
			if (target.pathname === location.pathname) void reveal()
		}
		const click = (event: MouseEvent) => {
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
			const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
			if (!link || link.target || link.hasAttribute('download') || link.hasAttribute('data-skip-loader')) return
			const url = new URL(link.href, location.href)
			if (
				url.origin !== location.origin ||
				/\.(?:xml|json|pdf|png|jpe?g|webp|gif|svg|mp3|zip)$/i.test(url.pathname) ||
				!['http:', 'https:'].includes(url.protocol) ||
				url.pathname + url.search === location.pathname + location.search
			)
				return
			event.preventDefault()
			event.stopPropagation()
			void navigate(link.href)
		}
		const request = (event: Event) => {
			void navigate((event as CustomEvent<string>).detail)
		}
		const resize = () => {
			clearTimeout(resizeTimer)
			resizeTimer = setTimeout(() => {
				if (!navigating) build()
			}, 150)
		}
		const hover = (event: PointerEvent) => {
			const element = event.target instanceof Element ? event.target.closest('a,button,.card,.project-row,.archive-article') : null
			if (!element || element.closest('.bento-card') || (event.relatedTarget instanceof Node && element.contains(event.relatedTarget))) return
			play(CARD_HOVER)
		}
		const pop = () => {
			navigating = true
			window.dispatchEvent(new CustomEvent('zenbot:panel', { detail: 'navigation' }))
			const covering = cover()
			popCover = covering
			void covering.then(() => {
				if (popCover === covering) {
					popCover = null
					void reveal()
				}
			})
		}
		window.addEventListener('popstate', pop)
		document.addEventListener('click', click, true)
		document.addEventListener('pointerover', hover)
		window.addEventListener('bento:navigate', request)
		window.addEventListener('resize', resize)
		return () => {
			disposed = true
			cancelAnimationFrame(initialFrame)
			cancelRunning()
			window.removeEventListener('popstate', pop)
			controller.current = null
			clearTimeout(resizeTimer)
			clearTimeout(watchdog)
			cells.forEach(cell => cell.getAnimations().forEach(animation => animation.cancel()))
			document.removeEventListener('click', click, true)
			document.removeEventListener('pointerover', hover)
			window.removeEventListener('bento:navigate', request)
			window.removeEventListener('resize', resize)
		}
	}, [router])
	useEffect(() => {
		if (previousPath.current === pathname) return
		previousPath.current = pathname
		void controller.current?.reveal()
	}, [pathname])
	return (
		<>
			<div id='grid-transition' ref={overlay} aria-hidden='true' />
			{pathname === '/' && <GithubStarHint />}
		</>
	)
}
