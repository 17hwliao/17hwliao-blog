'use client'

import { useEffect, useRef, useState } from 'react'
import { play, ZENBOT_CHIRP } from '@/lib/sound'
import { PixelRotateIcon } from './pixel-icons'
import { normalizeSpriteFrame, spriteCellPosition, ZENBOT_SPRITE } from './zenbot-sprite-model'

export function ZenbotTurntable() {
	const areaRef = useRef<HTMLDivElement>(null)
	const spriteRef = useRef<HTMLDivElement>(null)
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
	const [attempt, setAttempt] = useState(0)

	useEffect(() => {
		const area = areaRef.current, sprite = spriteRef.current
		if (!area || !sprite) return
		let cancelled = false
		let loaded = false, frame = 0, raf = 0, autoTime = 0, lastTime = performance.now()
		let hovered = false, focused = false, inView = true, dragging = false, pointerId: number | null = null
		let lastX = 0, travel = 0
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
		const showFrame = (next: number) => {
			frame = normalizeSpriteFrame(next)
			sprite.style.backgroundPosition = spriteCellPosition(frame)
			sprite.dataset.frame = String(frame)
		}
		const image = new Image()
		image.onload = async () => {
			try { await image.decode() } catch { if (!cancelled) setStatus('error'); return }
			if (cancelled) return
			loaded = true
			showFrame(0)
			sprite.dataset.spriteReady = 'true'
			setStatus('ready')
		}
		image.onerror = () => { if (!cancelled) setStatus('error') }
		image.src = ZENBOT_SPRITE.atlas
		const tick = (now: number) => {
			if (cancelled) return
			const delta = Math.min(250, now - lastTime); lastTime = now
			if (loaded && inView && !document.hidden && !reduced.matches && !hovered && !focused && !dragging) {
				autoTime += delta
				const interval = ZENBOT_SPRITE.cycleMs / ZENBOT_SPRITE.frames
				const steps = Math.floor(autoTime / interval)
				if (steps > 0) { autoTime -= steps * interval; showFrame(frame + steps) }
			}
			raf = requestAnimationFrame(tick)
		}
		raf = requestAnimationFrame(tick)
		const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting })
		observer.observe(area)
		// Match the reference IntroCard: merely moving the mouse over the avatar
		// scrubs frames; pressing additionally captures a drag outside its bounds.
		const enter = (event: PointerEvent) => {
			if (event.pointerType === 'touch' || dragging) return
			hovered = true; focused = false; lastX = event.clientX; travel = 0; autoTime = 0
		}
		const leave = () => {
			hovered = false; autoTime = 0
			if (!dragging) travel = 0
		}
		const down = (event: PointerEvent) => {
			if (!loaded || event.button !== 0 || pointerId !== null) return
			dragging = true; focused = false; pointerId = event.pointerId; lastX = event.clientX; travel = 0; autoTime = 0
			area.dataset.dragging = 'true'
			area.setPointerCapture(event.pointerId)
		}
		const move = (event: PointerEvent) => {
			if (!loaded) return
			if (dragging ? event.pointerId !== pointerId : !hovered || event.pointerType === 'touch') return
			travel += event.clientX - lastX; lastX = event.clientX
			const steps = Math.trunc(travel / ZENBOT_SPRITE.pixelsPerFrame)
			if (steps) { travel -= steps * ZENBOT_SPRITE.pixelsPerFrame; showFrame(frame + steps) }
		}
		const up = (event: PointerEvent) => {
			if (event.pointerId !== pointerId) return
			dragging = false; pointerId = null; travel = 0; autoTime = 0
			delete area.dataset.dragging
			if (area.hasPointerCapture(event.pointerId)) area.releasePointerCapture(event.pointerId)
			const bounds = area.getBoundingClientRect()
			hovered = event.type === 'pointerup' && event.pointerType !== 'touch'
				&& event.clientX >= bounds.left && event.clientX <= bounds.right
				&& event.clientY >= bounds.top && event.clientY <= bounds.bottom
		}
		const focus = () => { focused = area.matches(':focus-visible') }
		const blur = () => { focused = false }
		const keydown = (event: KeyboardEvent) => {
			if (!loaded || !['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return
			event.preventDefault(); focused = true; autoTime = 0
			showFrame(event.key === 'Home' ? 0 : frame + (event.key === 'ArrowRight' ? 1 : -1))
		}
		const motionChange = () => { autoTime = 0; if (reduced.matches && loaded) showFrame(0) }
		area.addEventListener('pointerenter', enter); area.addEventListener('pointerleave', leave)
		area.addEventListener('pointerdown', down); area.addEventListener('pointermove', move)
		area.addEventListener('pointerup', up); area.addEventListener('pointercancel', up); area.addEventListener('lostpointercapture', up)
		area.addEventListener('focus', focus); area.addEventListener('blur', blur); area.addEventListener('keydown', keydown)
		reduced.addEventListener('change', motionChange)
		return () => {
			cancelled = true; cancelAnimationFrame(raf); observer.disconnect(); image.onload = image.onerror = null
			if (pointerId !== null && area.hasPointerCapture(pointerId)) area.releasePointerCapture(pointerId)
			area.removeEventListener('pointerenter', enter); area.removeEventListener('pointerleave', leave)
			area.removeEventListener('pointerdown', down); area.removeEventListener('pointermove', move)
			area.removeEventListener('pointerup', up); area.removeEventListener('pointercancel', up); area.removeEventListener('lostpointercapture', up)
			area.removeEventListener('focus', focus); area.removeEventListener('blur', blur); area.removeEventListener('keydown', keydown)
			reduced.removeEventListener('change', motionChange)
		}
	}, [attempt])

	return (
		<div ref={areaRef} id='zenbot-spin-area' className='zenbot-spin-area' tabIndex={0} role='group'
			aria-label='Zenbot 多视角人物，鼠标移入后左右移动或拖动可旋转，方向键切换角度，Home 键回到正面' onDoubleClick={() => {
			play(ZENBOT_CHIRP)
			window.dispatchEvent(new Event('zenix.companion.open'))
		}}>
			<div className='zenbot-turntable-stage is-ready'>
				<div ref={spriteRef} className='zenbot-turntable-sprite' role='img' aria-label='白蓝紫渐变卷发的 Zenbot'
					style={{ backgroundImage: `url("${status === 'ready' ? ZENBOT_SPRITE.atlas : ZENBOT_SPRITE.poster}")`, backgroundSize: status === 'ready' ? `${ZENBOT_SPRITE.cols * 100}% ${ZENBOT_SPRITE.rows * 100}%` : '100% 100%' }} />
				{status === 'error' && <div className='zenbot-sprite-error' role='status'>
					<span>旋转暂不可用</span>
					<button type='button' onPointerDown={event => event.stopPropagation()} onClick={() => { setStatus('loading'); setAttempt(n => n + 1) }}>重试</button>
				</div>}
			</div>
			<div className='zenbot-spin-hint' aria-hidden='true'>
				<PixelRotateIcon className='zenbot-spin-icon' />
				<span>ZENBOT 3D · DRAG TO SPIN</span>
			</div>
		</div>
	)
}
