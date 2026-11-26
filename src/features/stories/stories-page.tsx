'use client'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { PageIntro } from '@/components/page-intro'
import { DialogModal } from '@/components/dialog-modal'
import { stories } from './model'
import '@/styles/album.css'

function PreviewImage({ src, alt }: { src: string; alt: string }) {
	const [failed, setFailed] = useState(false)
	const [loaded, setLoaded] = useState(false)
	const [attempt, setAttempt] = useState(0)
	return (
		<div className='album-image-stage'>
			{!failed && !loaded && (
				<span role='status' className='album-loading'>
					正在加载照片…
				</span>
			)}
			{failed ? (
				<div role='alert'>
					<p>这张照片暂时没能加载。</p>
					<button
						type='button'
						className='button-light'
						onClick={() => {
							setAttempt(x => x + 1)
							setFailed(false)
						}}>
						重新加载
					</button>
				</div>
			) : (
				<img key={attempt} src={src} alt={alt} draggable={false} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
			)}
		</div>
	)
}
export function StoriesPage() {
	const [selected, setSelected] = useState(stories[0].id)
	const [photo, setPhoto] = useState<number | null>(null)
	const story = stories.find(item => item.id === selected)!
	const current = photo === null ? null : story.chapters[photo]
	const move = (step: number) => setPhoto(value => (value === null ? null : (value + step + story.chapters.length) % story.chapters.length))
	useEffect(() => {
		if (photo === null) return
		window.dispatchEvent(new CustomEvent('zenbot:panel', { detail: 'album' }))
		const key = (event: KeyboardEvent) => {
			if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
			event.preventDefault()
			setPhoto(value => (value === null ? null : (value + (event.key === 'ArrowLeft' ? -1 : 1) + story.chapters.length) % story.chapters.length))
		}
		window.addEventListener('keydown', key)
		return () => window.removeEventListener('keydown', key)
	}, [photo === null, story.chapters.length])
	useEffect(() => {
		if (photo === null || !story.chapters.length) return
		const previews = [-1, 1].map(step => {
			const image = new Image()
			image.src = story.chapters[(photo + step + story.chapters.length) % story.chapters.length].url
			return image
		})
		return () => {
			previews.forEach(image => {
				image.src = ''
			})
		}
	}, [photo, story])
	return (
		<div className='album-page'>
			<PageIntro label='MOMENTS IN FRAMES' title='日常相册' description='一些想留下的画面。点开一张，慢慢看。' />
			<div className='album-tabs' role='group' aria-label='选择相册'>
				{stories.map(item => (
					<button
						key={item.id}
						type='button'
						aria-pressed={selected === item.id}
						onClick={() => {
							setSelected(item.id)
							setPhoto(null)
						}}>
						{item.title}
						<span>{item.chapters.length}</span>
					</button>
				))}
			</div>
			<p className='album-description'>{story.subtitle}</p>
			<div className='album-grid'>
				{story.chapters.map((image, index) => (
					<button
						className='album-photo'
						data-ui-surface='panel'
						type='button'
						key={image.id}
						aria-label={`放大照片 ${index + 1}：${image.description || story.title}`}
						onClick={() => setPhoto(index)}>
						<img src={image.url} alt={image.description || `${story.title} · ${index + 1}`} loading='lazy' draggable={false} />
						<span className='album-photo-index'>{String(index + 1).padStart(2, '0')}</span>
					</button>
				))}
			</div>
			{!story.chapters.length && <p className='feature-empty'>这本相册还没有照片。</p>}
			<DialogModal open={photo !== null} onClose={() => setPhoto(null)} className='album-lightbox' ariaLabel='相册大图预览'>
				{current && (
					<div className='album-viewer'>
						<header className='album-viewer-header'>
							<div>
								<strong>{story.title}</strong>
								<span>
									{(photo ?? 0) + 1} / {story.chapters.length}
								</span>
							</div>
							<button type='button' className='icon-button' aria-label='关闭照片预览' onClick={() => setPhoto(null)}>
								<X size={20} />
							</button>
						</header>
						<PreviewImage key={current.id} src={current.url} alt={current.description || story.title} />
						<footer className='album-viewer-footer'>
							<button type='button' className='icon-button' aria-label='上一张照片' onClick={() => move(-1)}>
								<ArrowLeft size={20} />
							</button>
							<p aria-live='polite'>{current.description || '这一刻，没有留下文字。'}</p>
							<button type='button' className='icon-button' aria-label='下一张照片' onClick={() => move(1)}>
								<ArrowRight size={20} />
							</button>
						</footer>
					</div>
				)}
			</DialogModal>
		</div>
	)
}
