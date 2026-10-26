'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { PrivateKeyFeedback } from './private-key-feedback'

export function PageActions({ children }: { children: ReactNode }) {
	const [target, setTarget] = useState<HTMLElement | null>(null)
	useEffect(() => setTarget(document.getElementById('page-actions')), [])
	return target ? createPortal(<><div className='page-action-buttons'>{children}</div><PrivateKeyFeedback /></>, target) : null
}
