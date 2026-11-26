'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import { articles, articleHref, normalize, projects, searchArticles } from './catalog'
import tracks from '@/config/music.json'
import { navigateWithTransition } from '@/components/reference-experience'
import { requestMusic } from '@/features/music/events'

type CommandItem = { id: string; label: string; detail: string; href?: string; trackId?: string }
const pages = [
	['/', '首页', '回到小站'],
	['/assistant', '聊聊小站', '和看板娘选择话题，了解项目与页面入口'],
	['/stw', 'STW · Stop the World', '拖动旋转与缩放像素地球仪'],
	['/pictures', '日常相册', '照片网格与覆盖大图预览'],
	['/blog', '全部文章', '文章归档'],
	['/projects', '全部项目', '项目与 README'],
	['/share', '分享与工具箱', 'WebP、SVG、时钟与值得分享的东西'],
	['/image-toolbox', 'WebP 图片工具', 'PNG JPG HEIC 转换、压缩与下载'],
	['/svgs', 'SVG 图标库', '搜索并浏览 SVG 图标'],
	['/clock', '专注时钟', '番茄钟、倒计时与秒表'],
	['/bloggers', '邻站博客', '收藏的博客与朋友'],
	['/about', '关于', '认识 17hwliao']
].map(([href, label, detail]) => ({ id: href, href, label, detail }))

export function commandResults(query: string): CommandItem[] {
	const words = normalize(query).split(/\s+/).filter(Boolean)
	const matches = (value: string) => words.every(word => normalize(value).includes(word))
	return [
		...pages.filter(item => matches(item.label + ' ' + item.detail)),
		...projects
			.filter(project => matches([project.name, project.description, ...project.tags].join(' ')))
			.map(project => ({ id: 'project:' + project.slug, href: project.url, label: project.name, detail: '项目 · ' + project.kind })),
		...tracks
			.filter(track => matches(track.title + ' ' + track.label + ' 音乐 播放'))
			.map(track => ({ id: 'music:' + track.id, trackId: track.id, label: '播放 · ' + track.title, detail: '音乐 / ' + track.label })),
		...searchArticles(query, articles)
			.slice(0, 25)
			.map(article => ({ id: 'article:' + article.slug, href: articleHref(article.slug), label: article.title, detail: '文章 · ' + article.tags.join(' / ') }))
	].slice(0, 45)
}

export function CommandPalette({ hideTrigger = false }: { hideTrigger?: boolean }) {
	const pathname = usePathname()
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [active, setActive] = useState(0)
	const results = commandResults(query)
	const resultRefs = useRef<(HTMLButtonElement | null)[]>([])
	const close = () => setOpen(false)
	useEffect(() => {
		setOpen(false)
	}, [pathname])
	useEffect(() => {
		const key = (event: KeyboardEvent) => {
			if (event.isComposing || event.repeat || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return
			if (document.querySelector('dialog[open]') && !document.querySelector('dialog[open] .command-surface')) return
			event.preventDefault()
			setOpen(value => !value)
		}
		window.addEventListener('keydown', key)
		return () => window.removeEventListener('keydown', key)
	}, [])
	useEffect(() => {
		if (open) window.dispatchEvent(new CustomEvent('zenbot:panel', { detail: 'search' }))
	}, [open])
	useEffect(() => {
		const show = () => {
			setQuery('')
			setActive(0)
			setOpen(true)
		}
		window.addEventListener('zenbot:search', show)
		return () => window.removeEventListener('zenbot:search', show)
	}, [])
	useEffect(() => {
		resultRefs.current[active]?.scrollIntoView({ block: 'nearest' })
	}, [active])
	const run = (item: CommandItem) => {
		close()
		if (item.trackId) requestMusic(item.trackId)
		else if (item.href) navigateWithTransition(item.href)
	}
	return (
		<>
			{!hideTrigger && (
				<button
					className='icon-button command-trigger'
					onClick={() => {
						setOpen(true)
						setQuery('')
						setActive(0)
					}}
					aria-label='搜索与命令面板，Ctrl 或 Command 加 K'
					aria-keyshortcuts='Control+K Meta+K'
					title='搜索与导航 · Ctrl + K'>
					<Search size={18} />
					<kbd>Ctrl + K</kbd>
				</button>
			)}
			<DialogModal open={open} onClose={close} className='command-surface' ariaLabel='全站搜索与命令面板'>
				<div className='command-input-row'>
					<Search size={19} />
					<input
						autoFocus
						role='combobox'
						aria-label='搜索文章、项目、页面或音乐'
						aria-expanded='true'
						aria-controls='command-results'
						aria-autocomplete='list'
						aria-activedescendant={results[active] ? `command-${active}` : undefined}
						placeholder='想找什么？文章、项目，或一首歌…'
						value={query}
						onChange={event => {
							setQuery(event.target.value)
							setActive(0)
						}}
						onKeyDown={event => {
							if (event.nativeEvent.isComposing) return
							if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
								event.preventDefault()
								setActive(value => (results.length ? (value + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length : 0))
							}
							if (event.key === 'Enter' && results[active]) {
								event.preventDefault()
								run(results[active])
							}
						}}
					/>
					<button className='icon-button' onClick={close} aria-label='关闭搜索'>
						<X size={17} />
					</button>
				</div>
				<div className='command-results' id='command-results' role='listbox' aria-label='搜索结果'>
					{results.map((item, index) => (
						<button
							tabIndex={-1}
							ref={element => {
								resultRefs.current[index] = element
							}}
							id={`command-${index}`}
							role='option'
							aria-selected={active === index}
							key={item.id}
							onPointerMove={() => setActive(index)}
							onClick={() => run(item)}>
							<span>
								<strong>{item.label}</strong>
								<small>{item.detail}</small>
							</span>
							<ArrowUpRight size={15} />
						</button>
					))}
					{results.length === 0 && <p className='feature-empty'>没有找到。可以试试 Go、MCP、相册或 emo。</p>}
				</div>
				<div className='command-footer'>
					<span>Ctrl + K 打开 / 关闭</span>
					<span>↑ ↓ 选择 · Enter 前往 · Esc 关闭</span>
				</div>
			</DialogModal>
		</>
	)
}
