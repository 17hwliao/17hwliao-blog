'use client'

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import Link from 'next/link'
import { Bookmark, Check, Focus, Highlighter, List, Minus, Plus, Settings2, X, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { articleHref, relatedArticles, readingRoutes } from '@/features/discovery/catalog'
import { saveReading, useReading } from './store'
import { locateExcerpt } from './text-range'
import { ArticleSearch } from './article-search'
import type { Excerpt } from './model'
import type { TocItem } from '@/lib/markdown-renderer'
import { DialogModal } from '@/components/dialog-modal'
import { ThemeOptions } from '@/features/appearance/theme'
import { scrollToHeading } from './outline'
import { useActiveHeading } from './use-active-heading'

export function ReadingTools({
	slug,
	title,
	contentRef,
	toc,
	children
}: {
	slug: string
	title: string
	contentRef: RefObject<HTMLDivElement | null>
	toc: TocItem[]
	children: ReactNode
}) {
	const { data, error } = useReading()
	const entry = data.entries[slug]
	const [selection, setSelection] = useState<{ quote: string; offset: number } | null>(null)
	const [note, setNote] = useState('')
	const [focus, setFocus] = useState(false)
	const [size, setSize] = useState(17)
	const [currentProgress, setCurrentProgress] = useState(0)
	const [panel, setPanel] = useState<'toc' | 'settings' | null>(null)
	const activeHeading = useActiveHeading(toc)
	const chapter = toc.find(item => item.id === activeHeading)?.text || '正文'
	const outlineLevel = toc.length ? Math.min(...toc.map(item => item.level)) : 1
	const restored = useRef(false)
	const resumePosition = useRef<number | null>(null)
	if (resumePosition.current === null && entry) resumePosition.current = entry.position
	const related = relatedArticles(slug, 3)
	const route = readingRoutes.find(route => route.articles.some(article => article.slug === slug))
	const nextArticle = route?.articles[(route?.articles.findIndex(article => article.slug === slug) ?? -1) + 1]
	const restorePosition = (position: number) => {
		const root = contentRef.current
		if (!root) return
		const offset = position * Math.max(1, root.offsetHeight - window.innerHeight + 160)
		window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY - 120 + offset, behavior: 'instant' })
	}
	useEffect(() => {
		if (restored.current || new URLSearchParams(location.search).get('resume') !== '1' || !entry) return
		restored.current = true
		const root = contentRef.current
		if (!root) return
		const position = entry.position
		// Images above the saved point must settle before restoring the reading position.
		const images = Array.from(root.querySelectorAll('img'))
		for (const image of images) if (!image.complete) image.loading = 'eager'
		let cancelled = false
		let frame = 0
		let timer: ReturnType<typeof setTimeout>
		const pending = images.filter(image => !image.complete)
		const callbacks = pending.map(image => {
			const finish = () => {
				if (pending.every(item => item.complete)) done()
			}
			image.addEventListener('load', finish)
			image.addEventListener('error', finish)
			return () => {
				image.removeEventListener('load', finish)
				image.removeEventListener('error', finish)
			}
		})
		const done = () => {
			if (cancelled) return
			cancelled = true
			clearTimeout(timer)
			callbacks.forEach(cleanup => cleanup())
			frame = requestAnimationFrame(() => restorePosition(position))
		}
		timer = setTimeout(done, 2500)
		if (!pending.length) done()
		return () => {
			cancelled = true
			clearTimeout(timer)
			cancelAnimationFrame(frame)
			callbacks.forEach(cleanup => cleanup())
		}
	}, [Boolean(entry), contentRef])

	useEffect(() => {
		const root = contentRef.current
		if (!root) return
		let pending: { position: number; progress: number } | null = null
		let timer: ReturnType<typeof setTimeout> | undefined
		const flush = () => {
			if (pending) {
				saveReading(slug, title, pending)
				pending = null
			}
		}
		const scroll = () => {
			const rect = root.getBoundingClientRect()
			if (rect.bottom <= 0) return
			const position = Math.max(0, Math.min(1, (120 - rect.top) / Math.max(1, rect.height - window.innerHeight + 160)))
			pending = { position, progress: position }
			setCurrentProgress(position)
			clearTimeout(timer)
			timer = setTimeout(flush, 600)
		}
		const capture = () => {
			const selected = window.getSelection()
			if (!selected || selected.isCollapsed || !selected.rangeCount) return
			const range = selected.getRangeAt(0)
			if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return
			const raw = range.toString()
			const quote = raw.trim()
			if (!quote || quote.length > 2000) return
			const before = document.createRange()
			before.selectNodeContents(root)
			before.setEnd(range.startContainer, range.startOffset)
			setSelection({ quote, offset: before.toString().length + raw.indexOf(quote) })
		}
		const hidden = () => {
			if (document.visibilityState === 'hidden') flush()
		}
		window.addEventListener('scroll', scroll, { passive: true })
		root.addEventListener('pointerup', capture)
		root.addEventListener('keyup', capture)
		document.addEventListener('visibilitychange', hidden)
		return () => {
			clearTimeout(timer)
			flush()
			window.removeEventListener('scroll', scroll)
			root.removeEventListener('pointerup', capture)
			root.removeEventListener('keyup', capture)
			document.removeEventListener('visibilitychange', hidden)
		}
	}, [slug, title, contentRef])
	useEffect(() => {
		const layout = contentRef.current?.closest<HTMLElement>('.reading-layout')
		if (!layout) return
		layout.dataset.focus = String(focus)
		return () => {
			delete layout.dataset.focus
		}
	}, [focus, contentRef])
	useEffect(() => {
		if (contentRef.current) contentRef.current.style.fontSize = `${size}px`
	}, [size, contentRef])
	useEffect(() => {
		const root = contentRef.current
		const registry = (CSS as unknown as { highlights?: Map<string, unknown> }).highlights
		const Highlight = (window as unknown as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight
		if (!root || !registry || !Highlight) return
		const ranges = (entry?.excerpts ?? []).map(excerpt => locateExcerpt(root, excerpt.quote, excerpt.offset)).filter((range): range is Range => range !== null)
		registry.set('blog-reading-excerpts', new Highlight(...ranges))
		return () => {
			registry.delete('blog-reading-excerpts')
		}
	}, [entry?.excerpts, contentRef])
	const reveal = (excerpt: Excerpt) => {
		const root = contentRef.current
		if (!root) return
		const range = locateExcerpt(root, excerpt.quote, excerpt.offset)
		if (!range) {
			toast.info('正文可能已有调整，仍为你保留这条摘录。')
			return
		}
		const selected = window.getSelection()
		selected?.removeAllRanges()
		selected?.addRange(range)
		const element = range.startContainer.parentElement
		element?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
	}
	return (
		<>
			{/* Keep the optional browser highlight rule outside the older CSS optimizer. */}
			<style>{'::highlight(blog-reading-excerpts) { background-color: var(--excerpt-bg); color: var(--excerpt-text); }'}</style>
			<div className='reader-toolbar' aria-label='阅读工具'>
				<div className='reader-progress'>
					<progress max={1} value={currentProgress} aria-label='当前阅读位置' />
					<span>{Math.round(currentProgress * 100)}%</span>
					<span className='reader-chapter' title={chapter}>
						{chapter}
					</span>
				</div>
				<button className='button-light' aria-pressed={entry?.bookmarked ?? false} onClick={() => saveReading(slug, title, { bookmarked: !entry?.bookmarked })}>
					<Bookmark size={15} fill={entry?.bookmarked ? 'currentColor' : 'none'} />
					{entry?.bookmarked ? '已收藏' : '稍后读'}
				</button>
				<button type='button' className='button-light' aria-label='打开文章目录' aria-expanded={panel === 'toc'} onClick={() => setPanel('toc')}>
					<List size={15} /> 目录
				</button>
				<ArticleSearch contentRef={contentRef} />
				<button type='button' className='button-light' aria-label='打开阅读设置' aria-expanded={panel === 'settings'} onClick={() => setPanel('settings')}>
					<Settings2 size={15} />
					<span className='reader-desktop-label'>阅读</span>设置
				</button>
			</div>
			<DialogModal open={panel !== null} onClose={() => setPanel(null)} className='reader-drawer' ariaLabel={panel === 'toc' ? '文章目录' : '阅读设置'}>
				<div className='drawer-heading'>
					<div>
						<p className='eyebrow'>{panel === 'toc' ? 'IN THIS ARTICLE' : 'YOUR READING SPACE'}</p>
						<h2>{panel === 'toc' ? '文章目录' : '阅读设置'}</h2>
					</div>
					<button type='button' className='icon-button' aria-label='关闭阅读面板' onClick={() => setPanel(null)}>
						<X size={20} />
					</button>
				</div>
				{panel === 'toc' ? (
					<nav className='reader-outline' aria-label='本文章节'>
						{toc.length === 0 && <p className='muted'>这篇文章没有分节标题，可以从正文开始阅读。</p>}
						{(toc.length ? toc : [{ id: `reader-content-${slug}`, text: '正文开始', level: 1 }]).map(item => (
							<button
								type='button'
								key={item.id}
								aria-current={activeHeading === item.id ? 'location' : undefined}
								style={{ paddingLeft: 14 + Math.min(3, Math.max(0, item.level - outlineLevel)) * 12 }}
								onClick={() => {
									setPanel(null)
									requestAnimationFrame(() => scrollToHeading(item.id))
								}}>
								<span>{item.text}</span>
								<ArrowRight size={14} />
							</button>
						))}
					</nav>
				) : (
					<div className='reader-preferences'>
						<div className='reader-preference-row'>
							<div>
								<h3>正文字号</h3>
								<p className='muted'>仅调整当前文章</p>
							</div>
							<div className='reader-type'>
								<button type='button' className='icon-button' aria-label='缩小正文' disabled={size <= 15} onClick={() => setSize(value => value - 1)}>
									<Minus size={17} />
								</button>
								<output aria-label='当前正文字号'>{size}px</output>
								<button type='button' className='icon-button' aria-label='放大正文' disabled={size >= 23} onClick={() => setSize(value => value + 1)}>
									<Plus size={17} />
								</button>
							</div>
						</div>
						<button type='button' className='reader-focus-option' aria-pressed={focus} onClick={() => setFocus(value => !value)}>
							<Focus size={19} />
							<div>
								<strong>{focus ? '退出专注阅读' : '专注阅读'}</strong>
								<span>收起侧栏，让文字居中</span>
							</div>
							<span>{focus ? '已开启' : '开启'}</span>
						</button>
						<div>
							<h3>显示主题</h3>
							<ThemeOptions />
						</div>
						<Link href='/reading' className='text-link' onClick={() => setPanel(null)}>
							书签、摘录与阅读记录 <ArrowRight size={15} />
						</Link>
						<p className='muted'>免登录使用。收藏和摘录保存在当前浏览器，可在工作台导出备份。</p>
					</div>
				)}
			</DialogModal>
			{resumePosition.current !== null && resumePosition.current > 0.02 && (
				<button className='reader-resume text-link' onClick={() => restorePosition(resumePosition.current ?? 0)}>
					接着上次的位置读 · {Math.round(resumePosition.current * 100)}%
				</button>
			)}
			{error && (
				<p className='feature-error' role='alert'>
					{error} <Link href='/reading'>管理本地记录</Link>
				</p>
			)}
			<div ref={contentRef} id={`reader-content-${slug}`} className='prose reader-content mt-6 max-w-none cursor-text'>
				{children}
			</div>
			{selection && (
				<section className='excerpt-composer' aria-label='保存选中文字'>
					<div className='feature-heading'>
						<h3>
							<Highlighter size={16} /> 留下一段话
						</h3>
						<button
							className='icon-button'
							onClick={() => {
								setSelection(null)
								setNote('')
							}}
							aria-label='取消本次摘录'>
							<X size={16} />
						</button>
					</div>
					<blockquote>{selection.quote}</blockquote>
					<label>
						写点想法（可选）
						<textarea value={note} maxLength={4000} onChange={event => setNote(event.target.value)} placeholder='下次读到这里时，想提醒自己什么？' />
					</label>
					<button
						className='button-dark'
						onClick={() => {
							const excerpt: Excerpt = { id: crypto.randomUUID(), ...selection, note, createdAt: new Date().toISOString() }
							if (saveReading(slug, title, { excerpts: [...(entry?.excerpts || []), excerpt] })) {
								setSelection(null)
								setNote('')
								toast.success('摘录已保存在当前浏览器。')
							}
						}}>
						保存摘录
					</button>
				</section>
			)}
			<div className='reader-bottom'>
				{route && (
					<div className='reader-route-next'>
						<p className='eyebrow'>正在这条路线中 · {route.title}</p>
						{nextArticle ? (
							<Link href={articleHref(nextArticle.slug)}>
								<div>
									<span className='muted'>
										下一篇 · {route.articles.findIndex(article => article.slug === slug) + 2} / {route.articles.length}
									</span>
									<h3>{nextArticle.title}</h3>
								</div>
								<ArrowRight size={23} />
							</Link>
						) : (
							<Link href={`/knowledge?route=${route.id}#routes-title`}>
								<div>
									<span className='muted'>已经到达这条路线的最后一篇</span>
									<h3>回看整条路线，或探索新的主题。</h3>
								</div>
								<ArrowRight size={23} />
							</Link>
						)}
					</div>
				)}
				<div className='feature-heading'>
					<h3>读到这里了。</h3>
					<button className='button-light' aria-pressed={entry?.completed ?? false} onClick={() => saveReading(slug, title, { completed: !entry?.completed })}>
						<Check size={15} />
						{entry?.completed ? '已读完 · 撤销标记' : '标记为读完'}
					</button>
				</div>
				<p className='muted'>选中正文，可以保存摘录和想法。阅读记录仅在当前浏览器保存。</p>
				{Boolean(entry?.excerpts.length) && (
					<ul className='article-excerpts'>
						{entry.excerpts.map(excerpt => (
							<li key={excerpt.id}>
								<button onClick={() => reveal(excerpt)}>
									<q>{excerpt.quote}</q>
									<span>{excerpt.note || '定位到原文 ↗'}</span>
								</button>
								<button
									className='icon-button'
									aria-label='删除这条摘录'
									onClick={() => {
										if (confirm('删除这条本地摘录？')) saveReading(slug, title, { excerpts: entry.excerpts.filter(item => item.id !== excerpt.id) })
									}}>
									<X size={14} />
								</button>
							</li>
						))}
					</ul>
				)}
				{related.length > 0 && (
					<>
						<h3 className='reader-related-title'>沿着这个话题，再读一篇</h3>
						<div className='reader-related'>
							{related.map(article => (
								<Link href={articleHref(article.slug)} key={article.slug}>
									{article.title}
									<span>{article.tags.join(' / ')}</span>
								</Link>
							))}
						</div>
					</>
				)}
				<Link href='/knowledge' className='text-link'>
					回到知识地图 →
				</Link>
			</div>
		</>
	)
}
