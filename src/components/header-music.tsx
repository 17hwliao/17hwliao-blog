'use client'

import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, Music2, Pause, Play, X } from 'lucide-react'
import tracks from '@/config/music.json'

export function HeaderMusic() {
	const audioRef = useRef<HTMLAudioElement>(null)
	const triggerRef = useRef<HTMLButtonElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const requestVersion = useRef(0)
	const requestPending = useRef(false)
	const loadedId = useRef<string | null>(null)
	const [open, setOpen] = useState(false)
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [status, setStatus] = useState<'paused' | 'loading' | 'playing' | 'error'>('paused')
	const selected = tracks.find(track => track.id === selectedId)
	const playing = status === 'playing'
	const close = () => {
		setOpen(false)
		triggerRef.current?.focus()
	}
	useEffect(() => {
		if (!open) return
		const outside = (event: PointerEvent) => {
			if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false)
		}
		const escape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setOpen(false)
				triggerRef.current?.focus()
			}
		}
		document.addEventListener('pointerdown', outside)
		document.addEventListener('keydown', escape)
		return () => {
			document.removeEventListener('pointerdown', outside)
			document.removeEventListener('keydown', escape)
		}
	}, [open])
	useEffect(
		() => () => {
			requestVersion.current += 1
		},
		[]
	)
	const playTrack = async (track: (typeof tracks)[number]) => {
		const audio = audioRef.current
		if (!audio) return
		const version = ++requestVersion.current
		if (loadedId.current === track.id && (requestPending.current || !audio.paused)) {
			requestPending.current = false
			audio.pause()
			setStatus('paused')
			return
		}
		// One audio element and a request generation prevent overlapping songs and
		// stale play() failures when switching tracks before a request resolves.
		requestPending.current = true
		audio.pause()
		setSelectedId(track.id)
		setStatus('loading')
		if (loadedId.current !== track.id || audio.error) {
			loadedId.current = track.id
			audio.src = track.src
			audio.load()
		}
		try {
			await audio.play()
		} catch {
			if (requestVersion.current === version) setStatus('error')
		} finally {
			if (requestVersion.current === version) requestPending.current = false
		}
	}
	return (
		<div className='header-music' ref={containerRef}>
			<button
				ref={triggerRef}
				className='icon-button music-trigger'
				aria-label={open ? '收起音乐面板' : playing ? `打开音乐面板，正在播放${selected?.title}` : '打开音乐面板'}
				aria-expanded={open}
				aria-controls='music-panel'
				title={playing ? `${selected?.label} · ${selected?.title}` : '选择一种心情，听一首歌'}
				onClick={() => setOpen(value => !value)}>
				<Music2 size={18} />
				<span className='music-trigger-dot' data-playing={playing} />
			</button>
			{open && (
				<section id='music-panel' className='music-panel' aria-label='音乐播放'>
					<div className='music-panel-heading'>
						<span className='eyebrow'>A SONG FOR THE MOOD</span>
						<button className='icon-button' aria-label='关闭音乐面板' onClick={close}>
							<X size={16} />
						</button>
					</div>
					<h2 className='music-panel-title'>此刻，什么心情？</h2>
					<p className='music-panel-hint'>点击标签播放，再点一次暂停。</p>
					<div className='music-choices'>
						{tracks.map(track => {
							const active = selectedId === track.id
							const isPlaying = active && playing
							const isLoading = active && status === 'loading'
							return (
								<button
									key={track.id}
									className='music-choice'
									data-active={active}
									data-playing={isPlaying}
									aria-label={`${isPlaying || isLoading ? '暂停' : '播放'} ${track.label} · ${track.title}`}
									aria-pressed={isPlaying}
									onClick={() => playTrack(track)}>
									<span className='music-mood'>{track.label}</span>
									<span className='music-choice-title'>{track.title}</span>
									<span className='music-choice-action'>
										{isLoading ? <LoaderCircle size={14} className='music-loading' /> : isPlaying ? <Pause size={14} /> : <Play size={14} />}
									</span>
								</button>
							)
						})}
					</div>
					<p className='music-status' role='status'>
						{!selected
							? '默认不播放，选一首喜欢的。'
							: status === 'error'
								? `${selected.title} 暂时无法播放，点击重试。`
								: status === 'loading'
									? `正在加载 · ${selected.title}`
									: playing
										? `正在播放 · ${selected.label} / ${selected.title}`
										: `已暂停 · ${selected.title}`}
					</p>
				</section>
			)}
			<audio
				ref={audioRef}
				preload='none'
				onPlaying={event => {
					if (!event.currentTarget.paused) setStatus('playing')
				}}
				onPause={event => {
					if (event.currentTarget.paused && !requestPending.current) setStatus('paused')
				}}
				onWaiting={event => {
					if (!event.currentTarget.paused) setStatus('loading')
				}}
				onEnded={event => {
					if (event.currentTarget.ended) setStatus('paused')
				}}
				onError={event => {
					if (event.currentTarget.error) setStatus('error')
				}}
			/>
		</div>
	)
}
