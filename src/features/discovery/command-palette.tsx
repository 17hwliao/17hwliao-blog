'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import { articles, articleHref, normalize, projects, searchArticles } from './catalog'
import tracks from '@/config/music.json'
import { requestMusic } from '@/features/music/events'

type CommandItem = { id: string; label: string; detail: string; href?: string; trackId?: string }
const pages = [
	['/', '首页', '回到小站'],
	['/assistant', '问博客 · Zenix 助手', '了解博客功能与页面入口'],
	['/knowledge', '知识地图与阅读路线', '从主题开始探索'],
	['/reading', '阅读工作台', '书签、进度与摘录'],
	['/pictures/stories', '相册故事集', '按章节看照片'],
	['/blog', '全部文章', '文章归档'],
	['/projects', '全部项目', '项目与 README'],
	['/pictures', '层叠相册', '散落的生活切片'],
	['/share', '分享', '值得分享的东西'],
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

export function CommandPalette() {
	const router = useRouter()
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
		resultRefs.current[active]?.scrollIntoView({ block: 'nearest' })
	}, [active])
	const run = (item: CommandItem) => {
		close()
		if (item.trackId) requestMusic(item.trackId)
		else if (item.href) router.push(item.href)
	}
	return (
		<>
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
