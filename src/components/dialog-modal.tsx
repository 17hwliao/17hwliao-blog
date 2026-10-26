'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface DialogModalProps {
	open: boolean
	onClose: () => void
	children: ReactNode
	className?: string
	overlayClassName?: string
	disableCloseOnOverlay?: boolean
	lockScroll?: boolean
	closeOnEsc?: boolean
	ariaLabel?: string
}

export function DialogModal({
	open,
	onClose,
	children,
	className,
	disableCloseOnOverlay = false,
	lockScroll = true,
	closeOnEsc = true,
	ariaLabel = '编辑内容'
}: DialogModalProps) {
	const [mounted, setMounted] = useState(false)
	const dialogRef = useRef<HTMLDialogElement>(null)

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		if (!lockScroll || !open) return
		const previous = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = previous
		}
	}, [lockScroll, open])

	useLayoutEffect(() => {
		const dialog = dialogRef.current
		if (!dialog) return
		if (open && !dialog.open) dialog.showModal()
		if (!open && dialog.open) dialog.close()
		return () => {
			if (dialog.open) dialog.close()
		}
	}, [open, mounted])

	if (!mounted) return null

	return createPortal(
		<dialog
			ref={dialogRef}
			className='dialog-frame'
			aria-label={ariaLabel}
			onCancel={event => {
				event.preventDefault()
				if (closeOnEsc) onClose()
			}}
			onClick={event => {
				if (!disableCloseOnOverlay && event.target === event.currentTarget) onClose()
			}}>
			<div className={cn('dialog-surface', className)} style={{ position: 'relative' }}>
				{open && children}
			</div>
		</dialog>,
		document.body
	)
}
