'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Settings2, PenLine, SlidersHorizontal, X } from 'lucide-react'
import { HeaderMusic } from './header-music'
import { useConfigStore } from '@/app/(home)/stores/config-store'

export function MaintenanceControls() {
	const [open, setOpen] = useState(false)
	const { setConfigDialogOpen } = useConfigStore()
	const container = useRef<HTMLDivElement>(null)
	const actionsRef = useRef<HTMLDivElement>(null)
	useEffect(() => {
		const target = actionsRef.current
		if (!target) return
		target.dataset.portalReady = 'true'
		window.dispatchEvent(new Event('page-actions:ready'))
		return () => {
			delete target.dataset.portalReady
		}
	}, [])
	useEffect(() => {
		const other = (event: Event) => {
			if ((event as CustomEvent<string>).detail !== 'maintenance') setOpen(false)
		}
		const outside = (event: PointerEvent) => {
			if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false)
		}
		const key = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false)
		}
		window.addEventListener('zenbot:panel', other)
		document.addEventListener('pointerdown', outside)
		document.addEventListener('keydown', key)
		return () => {
			window.removeEventListener('zenbot:panel', other)
			document.removeEventListener('pointerdown', outside)
			document.removeEventListener('keydown', key)
		}
	}, [])
	return (
		<>
			<HeaderMusic dock />
			<div ref={container} className='maintenance-control'>
				<button
					type='button'
					className='bento-dock-btn bento-dock-single'
					aria-label='页面维护'
					aria-expanded={open}
					aria-controls='maintenance-panel'
					onClick={() => {
						if (!open) window.dispatchEvent(new CustomEvent('zenbot:panel', { detail: 'maintenance' }))
						setOpen(!open)
					}}>
					<Settings2 size={16} />
				</button>
				<section id='maintenance-panel' hidden={!open} data-ui-surface='raised' className='maintenance-panel' aria-label='页面维护工具'>
					<header>
						<strong>页面维护</strong>
						<button className='icon-button' aria-label='关闭维护面板' onClick={() => setOpen(false)}>
							<X size={16} />
						</button>
					</header>
					<Link href='/write' onClick={() => setOpen(false)}>
						<PenLine size={16} />
						写文章
					</Link>
					<button
						type='button'
						onClick={() => {
							setOpen(false)
							window.dispatchEvent(new CustomEvent('zenbot:panel', { detail: 'settings' }))
							setConfigDialogOpen(true)
						}}>
						<SlidersHorizontal size={16} />
						站点设置 <kbd>Ctrl + Shift + ,</kbd>
					</button>
					<div id='page-actions' ref={actionsRef} className='page-actions' />
				</section>
			</div>
		</>
	)
}
