'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, X } from 'lucide-react'

export type CompanionMessage = {
	id: number
	text: string
	links?: { href: string; label: string }[]
}

export function CompanionBubble({ message, onClose, onHeight }: { message: CompanionMessage; onClose: () => void; onHeight: (height: number) => void }) {
	const ref = useRef<HTMLDivElement>(null)
	const [visible, setVisible] = useState(0)
	const characters = Array.from(message.text)
	useEffect(() => {
		const length = Array.from(message.text).length
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			setVisible(length)
			return
		}
		let frame = 0
		let start: number | null = null
		const tick = (now: number) => {
			start ??= now
			const count = Math.min(length, Math.floor((now - start) / 22) + 1)
			setVisible(count)
			if (count < length) frame = requestAnimationFrame(tick)
		}
		frame = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(frame)
	}, [message.id, message.text])
	useLayoutEffect(() => {
		const element = ref.current
		if (!element) return
		onHeight(Math.ceil(element.getBoundingClientRect().height))
		const observer = new ResizeObserver(() => onHeight(Math.ceil(element.getBoundingClientRect().height)))
		observer.observe(element)
		return () => observer.disconnect()
	}, [onHeight])
	return (
		<div ref={ref} id='companion-reply' className='zenbot-speech-bubble' data-ui-surface='raised'>
			<button type='button' className='companion-reply-close' aria-label='收起小人物回复' onClick={onClose}>
				<X size={13} />
			</button>
			<span className='sr-only' role='status' aria-live='polite' aria-atomic='true'>
				{message.text}
			</span>
			<p className='companion-reply-text' aria-hidden='true'>
				<span>{characters.slice(0, visible).join('')}</span>
				<span className='companion-reply-pending'>{characters.slice(visible).join('')}</span>
			</p>
			{message.links?.length ? (
				<div className='companion-reply-links'>
					{message.links.map(link => (
						<Link key={link.href} href={link.href}>
							{link.label}
							<ArrowUpRight size={12} aria-hidden='true' />
						</Link>
					))}
				</div>
			) : null}
		</div>
	)
}
