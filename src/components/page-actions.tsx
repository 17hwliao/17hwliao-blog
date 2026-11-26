'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function PageActions({ children }: { children: ReactNode }) {
	const [target, setTarget] = useState<HTMLElement | null>(null)
	useEffect(() => {
		// The dock can hydrate later than the route's Suspense boundary. Never
		// insert a portal into server markup before its owner has hydrated.
		const attach = () => {
			const element = document.getElementById('page-actions')
			if (element?.dataset.portalReady === 'true') setTarget(element)
		}
		window.addEventListener('page-actions:ready', attach)
		attach()
		return () => window.removeEventListener('page-actions:ready', attach)
	}, [])
	return target ? createPortal(<div className='page-action-buttons'>{children}</div>, target) : null
}
