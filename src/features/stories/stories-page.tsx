'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Music2 } from 'lucide-react'
import { PageIntro } from '@/components/page-intro'
import tracks from '@/config/music.json'
import { requestMusic } from '@/features/music/events'
import { stories } from './model'

function StoryImage({ src, alt, ...props }: { src: string; alt: string; className?: string; loading?: 'lazy' | 'eager' }) {
	const [failed, setFailed] = useState(false)
	const [attempt, setAttempt] = useState(0)
	return failed ? (
		<div className='story-image-error' role='alert'>
			<p>这张照片暂时没能加载。</p>
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
		<img key={attempt} src={src} alt={alt} onError={() => setFailed(true)} {...props} />
	)
}

export function StoriesPage() {
	const [selected, setSelected] = useState(stories[0].id)
	const [chapter, setChapter] = useState(0)
	const [musicRequested, setMusicRequested] = useState(false)
	const story = stories.find(item => item.id === selected)!
	const current = story.chapters[chapter]
	const track = tracks.find(track => track.id === story.mood)
	return (
		<div className='discovery-page stories-page'>
			<PageIntro
				label='STORIES IN FRAMES'
				title='把一些日常，翻成故事。'
				description='照片旁边，留一点文字。按主题重新翻看这些真实片段，说明沿用原来的记录；这里的章节顺序不代表拍摄时间。'
			/>
			<div className='feature-heading'>
				<h2>挑一本，慢慢翻。</h2>
				<Link className='text-link' href='/pictures'>
					回到层叠相册 ↗
				</Link>
			</div>
			<div className='story-shelves'>
				{stories.map((item, index) => (
					<button
						className='story-cover'
						aria-pressed={selected === item.id}
						key={item.id}
						onClick={() => {
							setSelected(item.id)
							setChapter(0)
							setMusicRequested(false)
						}}>
						<span className='story-cover-stack' aria-hidden='true'>
							{item.chapters
								.slice(0, 3)
								.reverse()
								.map((image, imageIndex) => (
									<img
										src={image.url}
										alt=''
										key={image.id}
										loading='lazy'
										style={{ transform: `translate(${(imageIndex - 1) * 15}px, ${Math.abs(imageIndex - 1) * 5}px) rotate(${(imageIndex - 1) * 9}deg)` }}
									/>
								))}
						</span>
						<span className='eyebrow'>
							STORY 0{index + 1} / {item.chapters.length} 张
						</span>
						<strong>{item.title}</strong>
						<span>{item.subtitle}</span>
					</button>
				))}
			</div>
			<section
				className='story-reader'
				aria-labelledby='story-title'
				onKeyDown={event => {
					if (event.target instanceof HTMLSelectElement || event.ctrlKey || event.metaKey || event.altKey) return
					if (event.key === 'ArrowRight') {
						event.preventDefault()
						setChapter(value => Math.min(story.chapters.length - 1, value + 1))
					}
					if (event.key === 'ArrowLeft') {
						event.preventDefault()
						setChapter(value => Math.max(0, value - 1))
					}
				}}>
				<header className='feature-heading'>
					<div>
						<p className='eyebrow'>A CHAPTER OF EVERYDAY LIFE</p>
						<h2 id='story-title'>{story.title}</h2>
					</div>
					{track && (
						<button
							className='button-light'
							onClick={() => {
								requestMusic(track.id)
								setMusicRequested(true)
							}}>
							<Music2 size={15} />
							{track.label} · {track.title}
						</button>
					)}
				</header>
				{musicRequested && (
					<p className='muted' role='status'>
						已请求页头播放器播放或暂停，声音状态请查看音乐面板。切换章节不会自动播放音乐。
					</p>
				)}
				{story.missing.length > 0 && (
					<p role='alert' className='feature-error'>
						部分照片已不在当前相册中，正在展示仍可用的章节。
					</p>
				)}
				{current ? (
					<div className='story-spread'>
						<figure className='story-frame'>
							<StoryImage key={current.id} src={current.url} alt={current.description || `${story.title} · 第 ${chapter + 1} 张`} />
						</figure>
						<div className='story-narrative'>
							<span className='story-chapter-number'>
								{String(chapter + 1).padStart(2, '0')}
								<small> / {String(story.chapters.length).padStart(2, '0')}</small>
							</span>
							<p key={current.id} className='story-caption'>
								{current.description || '这一张，没有留下文字。就安静地看看。'}
							</p>
							<p className='eyebrow'>原相册记录</p>
							<div className='story-chapter-controls'>
								<button className='button-light' disabled={chapter === 0} onClick={() => setChapter(value => value - 1)}>
									<ArrowLeft size={15} />
									上一张
								</button>
								<button className='button-dark' disabled={chapter === story.chapters.length - 1} onClick={() => setChapter(value => value + 1)}>
									下一张
									<ArrowRight size={15} />
								</button>
							</div>
							<p className='muted'>也可以使用 ← → 翻页。音乐由你点击后播放。</p>
						</div>
					</div>
				) : (
					<p className='feature-empty'>这本故事集还没有可用的照片。</p>
				)}
				<div className='story-thumbnails' aria-label='跳转到指定照片'>
					{story.chapters.map((image, index) => (
						<button key={image.id} aria-label={`查看第 ${index + 1} 张`} aria-pressed={chapter === index} onClick={() => setChapter(index)}>
							<img src={image.url} alt='' loading='lazy' />
							<span>{String(index + 1).padStart(2, '0')}</span>
						</button>
					))}
				</div>
			</section>
		</div>
	)
}
