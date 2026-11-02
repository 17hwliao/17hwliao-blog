'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, Expand, ImageOff, X } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import type { ProjectJourney, ProjectShot } from '@/content/project-showcases'

function ShotImage({ shot, eager = false }: { shot: ProjectShot; eager?: boolean }) {
	const [failed, setFailed] = useState(false)
	const imageRef = useRef<HTMLImageElement>(null)
	useEffect(() => {
		// An SSR image can finish with an error before hydration attaches onError.
		if (imageRef.current?.complete && imageRef.current.naturalWidth === 0) setFailed(true)
	}, [])
	if (failed)
		return (
			<div className='showcase-image-error' role='status'>
				<ImageOff size={24} />
				<p>这张画面暂时无法加载</p>
				<button className='button-light' onClick={() => setFailed(false)}>
					重新加载
				</button>
			</div>
		)
	return <img ref={imageRef} src={shot.src} alt={shot.alt} width={1440} height={1000} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
}

export function ProjectGallery({ name, shots, journeys = [] }: { name: string; shots: ProjectShot[]; journeys?: ProjectJourney[] }) {
	const [active, setActive] = useState(0)
	const [journeyId, setJourneyId] = useState('all')
	const [expanded, setExpanded] = useState(false)
	const galleryRef = useRef<HTMLElement>(null)
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
	const visibleIndices = selectedJourney ? selectedJourney.shots.map(id => shots.findIndex(item => item.id === id)).filter(index => index >= 0) : shots.map((_, index) => index)
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
			{journeys.length > 0 && <div className='gallery-journeys' role='group' aria-label='按操作链路查看'>
				<button aria-pressed={journeyId === 'all'} onClick={() => chooseJourney('all')}><strong>全部画面 <span>{shots.length}</span></strong><small>保留所有截图，方便逐张比较。</small></button>
				{journeys.map(item => <button key={item.id} aria-pressed={journeyId === item.id} onClick={() => chooseJourney(item.id)}><strong>{item.title} <span>{item.shots.length}</span></strong><small>{item.description}</small></button>)}
			</div>}
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
			<div id={`shot-${shot.id}`} className='gallery-caption' aria-live='polite'>
				<div>
					{shotJourney && <p className='gallery-step-label'>{shotJourney.title} · 步骤 {shotJourney.shots.indexOf(shot.id) + 1} / {shotJourney.shots.length}</p>}
					<h3>{shot.title}</h3>
					<p>{shot.description}</p>
				</div>
				<a href={shot.source} target='_blank' rel='noreferrer' className='subtle-link'>
					画面来源 <ArrowUpRight size={13} />
				</a>
			</div>
			<div className='gallery-operation' aria-live='polite'><div><span>本次操作</span><p>{shot.capture.action}</p></div><div><span>实际结果</span><p>{shot.capture.result}</p></div></div>
			<details className='gallery-capture-note'><summary>这张画面的取图说明</summary><p>{shot.capture.boundary}</p></details>
			{shots.length > 1 && (
				<div className='gallery-thumbnails' role='group' aria-label='选择项目画面'>
					{visibleIndices.map((index, order) => { const item = shots[index]; return (
						<button key={item.id} aria-pressed={active === index} onClick={() => {
							select(index)
							galleryRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
							galleryRef.current?.focus({ preventScroll: true })
						}}>
							<img src={item.src} alt='' width={176} height={116} loading='lazy' />
							<span>
								{String(order + 1).padStart(2, '0')}
								<strong>{item.title}</strong>
							</span>
						</button>
					) })}
				</div>
			)}
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
							<a href={shot.src} target='_blank' rel='noreferrer' className='button-light' aria-label={`打开${shot.title}原图`}>打开原图 <ArrowUpRight size={14} /></a>
							<button className='icon-button' aria-label='关闭画面预览' onClick={() => setExpanded(false)}><X size={20} /></button>
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
