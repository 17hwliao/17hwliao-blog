'use client'

import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, RotateCcw, X } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'

type MarkdownImageProps = {
	src: string
	alt?: string
	title?: string
}

export function MarkdownImage({ src, alt = '', title = '' }: MarkdownImageProps) {
	const [display, setDisplay] = useState(false)
	const [zoom, setZoom] = useState(1)
	const [failed, setFailed] = useState(false)
	const [retry, setRetry] = useState(0)
	const [natural, setNatural] = useState({ width: 1, height: 1 })
	const [bounds, setBounds] = useState({ width: 1, height: 1 })
	const stage = useRef<HTMLDivElement>(null)
	const trigger = useRef<HTMLImageElement>(null)
	const position = useRef(0)
	const restoreFrame = useRef(0)
	const open = () => {
		position.current = window.scrollY
		trigger.current?.focus({ preventScroll: true })
		setZoom(1)
		setFailed(false)
		setDisplay(true)
	}
	const close = () => {
		setDisplay(false)
		cancelAnimationFrame(restoreFrame.current)
		restoreFrame.current = requestAnimationFrame(() => {
			trigger.current?.focus({ preventScroll: true })
			window.scrollTo({ top: position.current, behavior: 'instant' })
		})
	}
	useEffect(() => () => cancelAnimationFrame(restoreFrame.current), [])
	useEffect(() => {
		if (!display) return
		let observer: ResizeObserver | undefined
		const frame = requestAnimationFrame(() => {
			if (!stage.current) return
			observer = new ResizeObserver(([entry]) => setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }))
			observer.observe(stage.current)
		})
		return () => {
			cancelAnimationFrame(frame)
			observer?.disconnect()
		}
	}, [display])
	const width = Math.min(natural.width, bounds.width, (bounds.height * natural.width) / natural.height) * zoom

	return (
		<>
			<img
				ref={trigger}
				src={src}
				alt={alt}
				title={title}
				loading='lazy'
				role='button'
				tabIndex={0}
				aria-label={`查看大图：${alt || '文章图片'}`}
				aria-haspopup='dialog'
				onClick={open}
				onKeyDown={event => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault()
						open()
					}
				}}
				className='markdown-image-trigger'
			/>
			<DialogModal open={display} onClose={close} ariaLabel='图片查看器' className='markdown-lightbox'>
				<div className='image-viewer-toolbar'>
					<span>{alt || title || '文章图片'}</span>
					<div>
						<button
							type='button'
							className='icon-button'
							aria-label='缩小图片'
							disabled={zoom <= 1 || failed}
							onClick={() => setZoom(value => Math.max(1, value - 0.5))}>
							<Minus size={19} />
						</button>
						<output aria-label='图片放大比例'>{Math.round(zoom * 100)}%</output>
						<button
							type='button'
							className='icon-button'
							aria-label='放大图片'
							disabled={zoom >= 3 || failed}
							onClick={() => setZoom(value => Math.min(3, value + 0.5))}>
							<Plus size={19} />
						</button>
						<button type='button' className='icon-button' aria-label='图片恢复适合屏幕' onClick={() => setZoom(1)}>
							<RotateCcw size={17} />
						</button>
						<button type='button' className='icon-button' aria-label='关闭图片查看器' onClick={close}>
							<X size={21} />
						</button>
					</div>
				</div>
				<div ref={stage} className='image-viewer-stage' tabIndex={0} role='region' aria-label='大图，放大后可左右和上下滚动'>
					{failed ? (
						<div className='image-viewer-error' role='alert'>
							<p>图片暂时未能加载。</p>
							<button
								type='button'
								className='button-light'
								onClick={() => {
									setFailed(false)
									setRetry(value => value + 1)
								}}>
								重新加载
							</button>
						</div>
					) : (
						<img
							key={retry}
							src={src}
							alt={alt}
							onLoad={event => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
							onError={() => setFailed(true)}
							style={{ width, maxWidth: 'none', maxHeight: 'none' }}
						/>
					)}
				</div>
				<p className='image-viewer-hint'>使用 + 放大，滑动查看细节；关闭后返回原阅读位置。</p>
			</DialogModal>
		</>
	)
}
