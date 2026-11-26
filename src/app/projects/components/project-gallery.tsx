'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, Expand, ImageOff, X } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import type { ProjectJourney, ProjectShot } from '@/content/project-showcases'

function ShotImage({ shot, eager = false }: { shot: ProjectShot; eager?: boolean }) {
	const [failed, setFailed] = useState(false)
	const [loaded, setLoaded] = useState(false)
	const [attempt, setAttempt] = useState(0)
	const imageRef = useRef<HTMLImageElement>(null)
	useEffect(() => {
		// Cached SSR images may finish before hydration attaches the event handlers.
		if (imageRef.current?.complete) {
			setFailed(imageRef.current.naturalWidth === 0)
			setLoaded(imageRef.current.naturalWidth > 0)
		}
		const timeout = window.setTimeout(() => {
			if (!imageRef.current?.naturalWidth) setFailed(true)
		}, 15000)
		return () => window.clearTimeout(timeout)
	}, [attempt])
	if (failed)
		return (
			<div className='showcase-image-error' role='status'>
				<ImageOff size={24} />
				<p>这张画面暂时无法加载</p>
				<button
					className='button-light'
					onClick={() => {
						setLoaded(false)
						setFailed(false)
						setAttempt(value => value + 1)
					}}>
					重新加载
				</button>
			</div>
		)
	return (
		<div className='gallery-shot-image' aria-busy={!loaded}>
			{!loaded && (
				<span className='gallery-loading' role='status'>
					正在加载画面…
				</span>
			)}
			<img
				key={attempt}
				ref={imageRef}
				src={attempt ? `${shot.src}?retry=${attempt}` : shot.src}
				alt={shot.alt}
				width={1440}
				height={1000}
				loading={eager ? 'eager' : 'lazy'}
				onLoad={() => setLoaded(true)}
				onError={() => setFailed(true)}
				style={{ visibility: loaded ? 'visible' : 'hidden' }}
			/>
		</div>
	)
}

export function ProjectGallery({ name, shots, journeys = [] }: { name: string; shots: ProjectShot[]; journeys?: ProjectJourney[] }) {
	const [active, setActive] = useState(0)
	const [journeyId, setJourneyId] = useState('all')
	const [expanded, setExpanded] = useState(false)
	const galleryRef = useRef<HTMLElement>(null)
	const choicesRef = useRef<HTMLDivElement>(null)
	useEffect(() => {
		const list = choicesRef.current
		const button = list?.querySelector<HTMLElement>('[aria-pressed="true"]')
		if (list && button) {
			// Scroll only the selector strip; keep the document and main image still.
			const { left, width } = button.getBoundingClientRect()
			list.scrollLeft += left - list.getBoundingClientRect().left - (list.clientWidth - width) / 2
		}
	}, [active, journeyId])
	useEffect(() => {
		const selectFromHash = () => {
			const index = shots.findIndex(item => `#shot-${item.id}` === window.location.hash)
			if (index < 0) return
			setActive(index)
			setJourneyId('all')
			requestAnimationFrame(() => {
				galleryRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
				galleryRef.current?.focus({ preventScroll: true })
			})
		}
		selectFromHash()
		window.addEventListener('hashchange', selectFromHash)
		return () => window.removeEventListener('hashchange', selectFromHash)
	}, [shots])
	const shot = shots[active]
	if (!shot) return null
	const selectedJourney = journeys.find(item => item.id === journeyId)
	const visibleIndices = selectedJourney
		? selectedJourney.shots.map(id => shots.findIndex(item => item.id === id)).filter(index => index >= 0)
		: shots.map((_, index) => index)
	const position = visibleIndices.indexOf(active)
	const shotJourney = journeys.find(item => item.shots.includes(shot.id))
	const select = (index: number) => {
		setActive(index)
		if (shots.some(item => `#shot-${item.id}` === window.location.hash)) window.history.replaceState(window.history.state, '', `#shot-${shots[index].id}`)
	}
	const move = (by: number) => select(visibleIndices[Math.max(0, Math.min(visibleIndices.length - 1, position + by))])
	const chooseJourney = (id: string) => {
		setJourneyId(id)
		const first = journeys.find(item => item.id === id)?.shots[0]
		const index = first ? shots.findIndex(item => item.id === first) : active
		if (index >= 0) select(index)
	}
	return (
		<section ref={galleryRef} className='project-gallery' aria-label={`${name} 实现画面`} tabIndex={-1}>
			<div className='showcase-section-heading'>
				<div>
					<p className='eyebrow'>INSIDE THE PROJECT</p>
					<h2>真实工作画面</h2>
				</div>
				<span>
					{String(position + 1).padStart(2, '0')} / {String(visibleIndices.length).padStart(2, '0')}
				</span>
			</div>
			{journeys.length > 0 && (
				<label className='gallery-filter'>
					查看内容
					<select value={journeyId} onChange={event => chooseJourney(event.target.value)} aria-label='按功能筛选画面'>
						<option value='all'>全部画面 · {shots.length} 张</option>
						{journeys.map(item => (
							<option key={item.id} value={item.id}>
								{item.title} · {item.shots.length} 张
							</option>
						))}
					</select>
				</label>
			)}
			{shots.length > 1 && (
				<div
					ref={choicesRef}
					className='gallery-selectors'
					role='group'
					aria-label='选择项目画面'
					onKeyDown={event => {
						if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
						event.preventDefault()
						const next =
							event.key === 'Home'
								? 0
								: event.key === 'End'
									? visibleIndices.length - 1
									: Math.max(0, Math.min(visibleIndices.length - 1, position + (event.key === 'ArrowRight' ? 1 : -1)))
						select(visibleIndices[next])
						choicesRef.current?.querySelectorAll('button')[next]?.focus({ preventScroll: true })
					}}>
					{visibleIndices.map((index, order) => (
						<button key={shots[index].id} aria-pressed={active === index} aria-controls='project-selected-picture' onClick={() => select(index)}>
							<span>{String(order + 1).padStart(2, '0')}</span>
							<strong>{shots[index].title}</strong>
						</button>
					))}
				</div>
			)}
			<figure id='project-selected-picture' data-ui-surface='panel' className='gallery-selected-picture'>
				<figcaption id={`shot-${shot.id}`} className='gallery-caption' aria-live='polite'>
					<div>
						{shotJourney && (
							<p className='gallery-step-label'>
								{shotJourney.title} · 步骤 {shotJourney.shots.indexOf(shot.id) + 1} / {shotJourney.shots.length}
							</p>
						)}
						<h3>{shot.title}</h3>
						<p>{shot.description}</p>
					</div>
				</figcaption>
				<div className='gallery-stage'>
					<div className='gallery-image'>
						<ShotImage key={shot.src} shot={shot} eager />
					</div>
					<div className='gallery-stage-bar'>
						<span>{shot.provenance}</span>
						<button className='subtle-link' onClick={() => setExpanded(true)} aria-label={`放大查看${shot.title}`}>
							<Expand size={14} /> 放大查看
						</button>
					</div>
				</div>
			</figure>
			<div className='gallery-operation' aria-live='polite'>
				<div>
					<span>操作过程</span>
					<p>{shot.capture.action}</p>
				</div>
				<div>
					<span>实际结果</span>
					<p>{shot.capture.result}</p>
				</div>
			</div>
			<details className='gallery-capture-note'>
				<summary>截图说明与来源</summary>
				<p>{shot.capture.boundary}</p>
				<a href={shot.source} target='_blank' rel='noreferrer' className='subtle-link'>
					查看画面来源 <ArrowUpRight size={13} />
				</a>
			</details>
			<DialogModal open={expanded} onClose={() => setExpanded(false)} className='gallery-lightbox' ariaLabel={`${name} 画面预览`}>
				<div
					onKeyDown={event => {
						if (event.key === 'ArrowLeft') {
							event.preventDefault()
							move(-1)
						}
						if (event.key === 'ArrowRight') {
							event.preventDefault()
							move(1)
						}
					}}>
					<div className='gallery-lightbox-header'>
						<div>
							<strong>{shot.title}</strong>
							<p>{shot.provenance}</p>
						</div>
						<div className='gallery-lightbox-actions'>
							<a href={shot.src} target='_blank' rel='noreferrer' className='button-light' aria-label={`打开${shot.title}原图`}>
								打开原图 <ArrowUpRight size={14} />
							</a>
							<button className='icon-button' aria-label='关闭画面预览' onClick={() => setExpanded(false)}>
								<X size={20} />
							</button>
						</div>
					</div>
					<div className='gallery-lightbox-image' tabIndex={0} aria-label='项目画面，左右方向键切换'>
						<ShotImage key={shot.src} shot={shot} eager />
					</div>
					<div className='gallery-lightbox-footer'>
						<button className='button-light' disabled={position === 0} onClick={() => move(-1)} aria-label='上一张项目画面'>
							<ChevronLeft size={16} /> 上一张
						</button>
						<p aria-live='polite'>
							{position + 1} / {visibleIndices.length} · {shot.description}
						</p>
						<button className='button-light' disabled={position === visibleIndices.length - 1} onClick={() => move(1)} aria-label='下一张项目画面'>
							下一张 <ChevronRight size={16} />
						</button>
					</div>
				</div>
			</DialogModal>
		</section>
	)
}
