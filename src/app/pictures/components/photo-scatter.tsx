'use client'

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { motion, useDragControls, useMotionValue, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import type { Picture } from '../page'
import { AlbumViewer, type PhotoSelection, type PhotoOrigin } from './album-viewer'

interface Props {
	pictures: Picture[]
	isEditMode?: boolean
	onDeleteSingle?: (pictureId: string, imageIndex: number | 'single') => void
	onDeleteGroup?: (picture: Picture) => void
}
type Photo = { key: string; url: string; picture: Picture; groupIndex: number; imageIndex: number | 'single' }
type Position = { centerX: number; centerY: number; width: number; rotation: number }

// Position formula from the original RandomLayout: golden-angle scatter, URL seed,
// radius easing, 12px jitter and a rotation between -30 and +29 degrees.
function getStablePosition(uniqueId: string, width: number, height: number) {
	let hash = 0
	for (let i = 0; i < uniqueId.length; i++) {
		hash = (hash << 5) - hash + uniqueId.charCodeAt(i)
		hash = hash & hash
	}
	const stableIndex = Math.abs(hash) % 10000
	const maxRadius = Math.max(0, Math.min(width, height) / 2 - 100)
	const goldenAngle = Math.PI * (3 - Math.sqrt(5))
	const t = (stableIndex % 1000) / 1000
	const radius = Math.pow(t, 0.8) * maxRadius
	const angle = stableIndex * goldenAngle
	const jitterSeed = Math.abs(hash) % 1000
	return {
		x: radius * Math.cos(angle) + (jitterSeed % 24) - 12,
		y: radius * Math.sin(angle) + ((jitterSeed * 7) % 24) - 12,
		rotation: ((jitterSeed * 13) % 60) - 30
	}
}
function getOrigin(element: HTMLElement, rotation: number): PhotoOrigin {
	const rect = element.getBoundingClientRect()
	const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform)
	return {
		x: rect.left + (rect.width - element.offsetWidth) / 2,
		y: rect.top + (rect.height - element.offsetHeight) / 2,
		width: element.offsetWidth,
		height: element.offsetHeight,
		rotate: rotation,
		scale: Math.hypot(matrix.a, matrix.b),
		borderWidth: 8
	}
}

function FloatingPhoto({
	photo,
	position,
	index,
	boardRef,
	selected,
	onSelect,
	raise,
	isEditMode,
	onDelete
}: {
	photo: Photo
	position: Position
	index: number
	boardRef: RefObject<HTMLDivElement | null>
	selected: boolean
	onSelect: (selection: PhotoSelection) => void
	raise: () => number
	isEditMode?: boolean
	onDelete: () => void
}) {
	const frameRef = useRef<HTMLElement>(null)
	const dragged = useRef(false)
	const controls = useDragControls()
	const x = useMotionValue(0)
	const y = useMotionValue(0)
	const reducedMotion = useReducedMotion()
	const [zIndex, setZIndex] = useState(index + 1)
	const [failed, setFailed] = useState(false)
	const [ratio, setRatio] = useState(1)
	const [entered, setEntered] = useState(Boolean(reducedMotion))
	const height = position.width / Math.min(3 / 2, Math.max(2 / 3, ratio))
	const left = position.centerX - position.width / 2
	const top = position.centerY - height / 2
	useEffect(() => {
		x.set(0)
		y.set(0)
	}, [position.centerX, position.centerY, position.width, x, y])
	const bringForward = () => setZIndex(raise())
	return (
		<motion.figure
			ref={frameRef}
			className='album-photo'
			data-expanded={selected}
			data-entered={entered || Boolean(reducedMotion)}
			aria-hidden={!entered && !reducedMotion}
			style={{ left, top, width: position.width, height, rotate: position.rotation, x, y, zIndex }}
			initial={reducedMotion ? false : { opacity: 0, scale: 0.6 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ type: 'tween', ease: 'easeOut', duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : index * 0.2 }}
			whileHover={!isEditMode && !reducedMotion ? { scale: 1.05, transition: { duration: 0.2, delay: 0 } } : undefined}
			onAnimationComplete={() => setEntered(true)}
			drag
			dragControls={controls}
			dragListener={false}
			dragConstraints={boardRef}
			dragElastic={0}
			dragMomentum={false}
			onDragStart={() => {
				dragged.current = true
			}}
			onPointerDown={event => {
				dragged.current = false
				bringForward()
				controls.start(event)
			}}
			onFocus={bringForward}>
			<button
				className='album-photo-open'
				tabIndex={entered || reducedMotion ? 0 : -1}
				aria-label={`查看照片 ${index + 1}${photo.picture.description ? `：${photo.picture.description}` : ''}`}
				onClick={event => {
					if ((dragged.current && event.detail !== 0) || !frameRef.current) return
					const image = event.currentTarget.querySelector('img')
					const element = frameRef.current
					onSelect({
						key: photo.key,
						url: photo.url,
						description: photo.picture.description,
						uploadedAt: photo.picture.uploadedAt,
						groupIndex: photo.groupIndex,
						naturalWidth: image?.naturalWidth || 1100,
						ratio: image?.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 4 / 3,
						origin: getOrigin(element, position.rotation),
						getReturnOrigin: () => getOrigin(element, position.rotation)
					})
				}}>
				<img
					src={photo.url}
					alt={photo.picture.description || `相册照片 ${index + 1}`}
					draggable={false}
					onLoad={event => setRatio(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight)}
					onError={() => setFailed(true)}
				/>
				{failed && (
					<span className='album-photo-failed'>
						图片未能加载
						<br />
						点击展开后重试
					</span>
				)}
			</button>
			<button
				className='sr-only'
				tabIndex={entered || reducedMotion ? 0 : -1}
				aria-label={`移动照片 ${index + 1}，可使用方向键`}
				onPointerDown={event => {
					event.stopPropagation()
					dragged.current = false
					bringForward()
					controls.start(event)
				}}
				onKeyDown={event => {
					const directions: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
					const direction = directions[event.key]
					if (!direction || !boardRef.current) return
					event.preventDefault()
					const distance = event.shiftKey ? 30 : 10
					x.set(Math.max(24 - left, Math.min(boardRef.current.clientWidth - left - position.width - 24, x.get() + direction[0] * distance)))
					y.set(Math.max(24 - top, Math.min(boardRef.current.clientHeight - top - height - 24, y.get() + direction[1] * distance)))
				}}>
				移动照片
			</button>
			{isEditMode && (
				<button
					className='album-photo-delete'
					tabIndex={entered || reducedMotion ? 0 : -1}
					aria-label={`删除照片 ${index + 1}`}
					onPointerDown={event => event.stopPropagation()}
					onClick={onDelete}>
					<X size={15} />
				</button>
			)}
		</motion.figure>
	)
}

export default function PhotoScatter({ pictures, isEditMode, onDeleteSingle, onDeleteGroup }: Props) {
	const boardRef = useRef<HTMLDivElement>(null)
	const zCounter = useRef(0)
	const [size, setSize] = useState({ width: 0, height: 0 })
	const [replay, setReplay] = useState(0)
	const [ready, setReady] = useState(false)
	const reducedMotion = Boolean(useReducedMotion())
	const [inView, setInView] = useState(false)
	const [selection, setSelection] = useState<PhotoSelection | null>(null)
	const photos = useMemo<Photo[]>(
		() =>
			pictures.flatMap((picture, groupIndex) => [
				...(picture.image ? [{ key: `${picture.id}:single`, url: picture.image, picture, groupIndex, imageIndex: 'single' as const }] : []),
				...(picture.images || []).map((url, imageIndex) => ({ key: `${picture.id}:${imageIndex}`, url, picture, groupIndex, imageIndex }))
			]),
		[pictures]
	)
	const hasPhotos = photos.length > 0
	useEffect(() => {
		const board = boardRef.current
		if (!board) {
			setInView(false)
			return
		}
		const measure = () => setSize({ width: Math.round(board.clientWidth), height: Math.round(board.clientHeight) })
		const observer = new ResizeObserver(measure)
		observer.observe(board)
		const visibility = new IntersectionObserver(
			entries => {
				if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.5)) {
					setInView(true)
					visibility.disconnect()
				}
			},
			{ threshold: 0.5 }
		)
		visibility.observe(board)
		measure()
		return () => {
			observer.disconnect()
			visibility.disconnect()
		}
	}, [hasPhotos])
	useEffect(() => {
		setReady(false)
		if (!inView || !hasPhotos) return
		const timer = window.setTimeout(() => setReady(true), reducedMotion ? 0 : 1000)
		return () => window.clearTimeout(timer)
	}, [inView, replay, hasPhotos, reducedMotion])
	const cardWidth = Math.min(200, Math.max(120, size.width * 0.48))
	const positions: Position[] = photos.map(photo => {
		// Keep the original radial placement inside this page's content canvas.
		const position = getStablePosition(photo.url, Math.max(0, size.width - 64), size.height)
		return {
			centerX: size.width / 2 + position.x,
			centerY: size.height / 2 + position.y,
			width: cardWidth,
			rotation: position.rotation
		}
	})
	if (!hasPhotos) return null
	return (
		<div className='album-scatter'>
			<div className='album-instructions'>
				<span>{photos.length} 张照片</span>
				<button className='album-replay' onClick={() => setReplay(value => value + 1)}>
					重播动效 ↻
				</button>
				<p>拖动照片整理，点击展开</p>
			</div>
			<div ref={boardRef} className='album-board' aria-label='层叠照片画布'>
				{size.width > 0 &&
					ready &&
					photos.map((photo, index) => (
						<FloatingPhoto
							key={`${replay}:${photo.key}`}
							photo={photo}
							index={index}
							position={positions[index]}
							boardRef={boardRef}
							selected={selection?.key === photo.key}
							onSelect={setSelection}
							isEditMode={isEditMode}
							raise={() => {
								zCounter.current = Math.max(zCounter.current, photos.length) + 1
								return zCounter.current
							}}
							onDelete={() => onDeleteSingle?.(photo.picture.id, photo.imageIndex)}
						/>
					))}
			</div>
			{isEditMode && (
				<div className='album-group-actions'>
					{pictures.map((picture, index) => (
						<div key={picture.id}>
							<span>{picture.description || `第 ${index + 1} 组照片`}</span>
							<button className='button-light' onClick={() => onDeleteGroup?.(picture)}>
								删除这组照片
							</button>
						</div>
					))}
				</div>
			)}
			{selection && <AlbumViewer selection={selection} onClose={() => setSelection(null)} />}
		</div>
	)
}
