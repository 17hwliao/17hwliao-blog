'use client'

import { useEffect, useState } from 'react'
import type { TocItem } from '@/lib/markdown-renderer'
import { currentHeading } from './outline'
export function useActiveHeading(toc: TocItem[]) {
	const [active, setActive] = useState('')
	useEffect(() => {
		let frame = 0
		const update = () => {
			cancelAnimationFrame(frame)
			frame = requestAnimationFrame(() => setActive(currentHeading(toc)))
		}
		update()
		window.addEventListener('scroll', update, { passive: true })
		window.addEventListener('resize', update)
		return () => {
			cancelAnimationFrame(frame)
			window.removeEventListener('scroll', update)
			window.removeEventListener('resize', update)
		}
	}, [toc])
	return active
}
