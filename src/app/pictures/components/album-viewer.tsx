'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { expandedPhotoLayout } from './scatter-layout'

export type PhotoOrigin = { x: number; y: number; width: number; height: number; rotate: number; scale: number; borderWidth: number }
export type PhotoSelection = {
	key: string
	url: string
	description?: string
	uploadedAt?: string
	ratio: number
	groupIndex: number
	naturalWidth: number
	origin: PhotoOrigin
	getReturnOrigin: () => PhotoOrigin
}

export function AlbumViewer({ selection, onClose }: { selection: PhotoSelection; onClose: () => void }) {
	const dialogRef = useRef<HTMLDialogElement>(null)
	const reducedMotion = useReducedMotion()
	const [closing, setClosing] = useState(false)
	const [returnOrigin, setReturnOrigin] = useState(selection.origin)
	const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
	const [failed, setFailed] = useState(false)
	const [attempt, setAttempt] = useState(0)
	useLayoutEffect(() => {
		const dialog = dialogRef.current
		const previousOverflow = document.body.style.overflow
		const previousPadding = document.body.style.paddingRight
		const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
		const padding = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0
		window.dispatchEvent(new CustomEvent('zenbot:panel', { detail: 'album' }))
		dialog?.showModal()
		// Keep the photo board's width stable while the scrollbar is hidden.
		document.body.style.paddingRight = `${padding + scrollbarWidth}px`
		document.body.style.overflow = 'hidden'
		const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
		window.addEventListener('resize', resize)
		return () => {
			dialog?.close()
			document.body.style.overflow = previousOverflow
			document.body.style.paddingRight = previousPadding
			window.removeEventListener('resize', resize)
		}
	}, [])
	const requestClose = () => {
		if (closing) return
		setReturnOrigin(selection.getReturnOrigin())
		if (reducedMotion) {
			onClose()
			return
		}
		setClosing(true)
	}
	const hasNote = Boolean(selection.description || selection.uploadedAt)
	const { wide, frame: target, note } = expandedPhotoLayout(viewport, selection.ratio, selection.naturalWidth, hasNote)
	const date =
		selection.uploadedAt && !Number.isNaN(Date.parse(selection.uploadedAt)) ? new Date(selection.uploadedAt).toLocaleString('sv-SE').slice(0, 16) : ''
	return createPortal(
		<dialog
			ref={dialogRef}
			className='scatter-dialog'
			data-closing={closing}
			aria-label='展开照片'
			onCancel={event => {
				event.preventDefault()
				requestClose()
			}}
			onClick={event => {
				if (event.target === event.currentTarget) requestClose()
			}}>
			<button className='icon-button scatter-viewer-close' onClick={requestClose} aria-label='收起照片' autoFocus>
				<X size={21} />
			</button>
			<motion.figure
				className='scatter-expanded-photo'
				data-note-tone={selection.groupIndex % 3}
				initial={reducedMotion ? false : selection.origin}
				animate={closing ? returnOrigin : target}
				transition={{ type: 'tween', ease: 'easeOut', duration: reducedMotion ? 0 : 0.3 }}
				onAnimationComplete={() => {
					if (closing) {
						dialogRef.current?.close()
						onClose()
					}
				}}>
				{failed ? (
					<div className='scatter-image-error' role='alert'>
						<p>照片暂时未能加载。</p>
						<button
							className='button-light'
							onClick={() => {
								setAttempt(value => value + 1)
								setFailed(false)
							}}>
							重新加载
						</button>
					</div>
				) : (
					<img key={attempt} src={selection.url} alt={selection.description || '展开的相册照片'} draggable={false} onError={() => setFailed(true)} />
				)}
			</motion.figure>
			{hasNote && (
				<motion.aside
					className='scatter-photo-note'
					aria-label='照片便签'
					data-note-tone={selection.groupIndex % 3}
					drag={wide}
					dragConstraints={dialogRef}
					dragMomentum={false}
					dragElastic={0}
					style={{
						...note,
						touchAction: wide ? 'none' : 'pan-y'
					}}
					initial={reducedMotion ? false : { opacity: 0, scale: 0.4 }}
					animate={{ opacity: closing ? 0 : 1, scale: closing ? 0.4 : 1 }}
					transition={reducedMotion ? { duration: 0 } : undefined}>
					{date && <time dateTime={selection.uploadedAt}>{date}</time>}
					{selection.description && <p>{selection.description}</p>}
				</motion.aside>
			)}
		</dialog>,
		document.body
	)
}
