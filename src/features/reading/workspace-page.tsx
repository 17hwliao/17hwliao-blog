'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Bookmark, Download, FileUp, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageIntro } from '@/components/page-intro'
import { articles, articleHref } from '@/features/discovery/catalog'
import { decodeReading, type ReadingEntry } from './model'
import { exportReading, importReading, resetReading, saveReading, useReading } from './store'

const publishedTitles = new Map(articles.map(article => [article.slug, article.title]))

export function WorkspacePage() {
	const { data, error } = useReading()
	const [tab, setTab] = useState('继续阅读')
	const [query, setQuery] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)
	const [importing, setImporting] = useState(false)
	const [actionError, setActionError] = useState('')
	const [editing, setEditing] = useState<{ slug: string; id: string; note: string } | null>(null)
	const entries = Object.entries(data.entries)
		.map(([slug, entry]) => [slug, { ...entry, title: publishedTitles.get(slug) ?? entry.title }] as const)
		.sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt))
	const visible = entries.filter(
		([slug, entry]) =>
			(tab === '继续阅读' ? !entry.completed : tab === '稍后读' ? entry.bookmarked : tab === '摘录与想法' ? entry.excerpts.length > 0 : entry.completed) &&
			[entry.title, ...entry.excerpts.flatMap(excerpt => [excerpt.quote, excerpt.note])].join(' ').toLowerCase().includes(query.toLowerCase())
	)
	const available = (slug: string) => articles.some(article => article.slug === slug)
	const update = (slug: string, entry: ReadingEntry, patch: Partial<ReadingEntry>) => saveReading(slug, entry.title, patch)
	return (
		<div className='reading-workspace discovery-page'>
			<PageIntro
				label='YOUR READING DESK'
				title='读过的，留下来。'
				description='接着上次的位置读，把值得回看的文字和想法留在手边。所有记录保存在当前浏览器，可自行导出备份。'
			/>
			<div className='workspace-summary'>
				<div>
					<strong>{entries.filter(([, entry]) => entry.bookmarked).length}</strong>
					<span>稍后读</span>
				</div>
				<div>
					<strong>{entries.filter(([, entry]) => entry.completed).length}</strong>
					<span>已读完</span>
				</div>
				<div>
					<strong>{entries.reduce((count, [, entry]) => count + entry.excerpts.length, 0)}</strong>
					<span>条摘录</span>
				</div>
				<Link className='text-link' href='/knowledge'>
					去知识地图逛逛 →
				</Link>
			</div>
			<div className='feature-heading workspace-actions'>
				<div className='feature-tabs' aria-label='阅读记录分类'>
					{['继续阅读', '稍后读', '摘录与想法', '已读完'].map(value => (
						<button key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>
							{value}
						</button>
					))}
				</div>
				<input
					className='feature-input'
					type='search'
					aria-label='搜索阅读记录'
					placeholder='找一段文字或想法…'
					value={query}
					onChange={event => setQuery(event.target.value)}
				/>
			</div>
			{error && (
				<p className='feature-error' role='alert'>
					{error}
				</p>
			)}
			{actionError && (
				<p className='feature-error' role='alert'>
					{actionError}
				</p>
			)}
			<div className='workspace-list'>
				{visible.map(([slug, entry]) => (
					<article key={slug} className='workspace-entry'>
						<div className='feature-heading'>
							<div>
								<p className='eyebrow'>
									{entry.completed ? 'FINISHED' : 'IN PROGRESS'} / {Math.round(entry.progress * 100)}% 最远位置
								</p>
								<h2>{available(slug) ? <Link href={articleHref(slug)}>{entry.title}</Link> : entry.title}</h2>
							</div>
							<button
								className='icon-button'
								aria-label={entry.bookmarked ? '取消稍后读' : '加入稍后读'}
								aria-pressed={entry.bookmarked}
								onClick={() => update(slug, entry, { bookmarked: !entry.bookmarked })}>
								<Bookmark size={18} fill={entry.bookmarked ? 'currentColor' : 'none'} />
							</button>
						</div>
						<progress max={1} value={entry.progress} aria-label={`${entry.title} 最远阅读位置`} />
						<div className='workspace-entry-meta'>
							<span>
								{new Date(entry.updatedAt).toLocaleDateString('zh-CN')} · {entry.excerpts.length} 条摘录
							</span>
							{available(slug) ? (
								<Link className='text-link' href={articleHref(slug)}>
									{entry.completed ? '重新阅读' : '打开文章继续读'} →
								</Link>
							) : (
								<span>文章已不在当前公开目录，摘录仍保留。</span>
							)}
						</div>
						{tab === '摘录与想法' && (
							<ul className='workspace-excerpts'>
								{entry.excerpts.map(excerpt => (
									<li key={excerpt.id}>
										<blockquote>{excerpt.quote}</blockquote>
										{editing?.slug === slug && editing.id === excerpt.id ? (
											<div className='workspace-note-editor'>
												<label>
													修改想法
													<textarea maxLength={4000} value={editing.note} onChange={event => setEditing({ ...editing, note: event.target.value })} />
												</label>
												<button
													className='button-dark'
													onClick={() => {
														if (
															update(slug, entry, { excerpts: entry.excerpts.map(item => (item.id === excerpt.id ? { ...item, note: editing.note } : item)) })
														)
															setEditing(null)
													}}>
													保存
												</button>
												<button className='button-light' onClick={() => setEditing(null)}>
													取消
												</button>
											</div>
										) : (
											<>
												<p>{excerpt.note || '还没有写下想法。'}</p>
												<button className='text-link' onClick={() => setEditing({ slug, id: excerpt.id, note: excerpt.note })}>
													编辑想法
												</button>
											</>
										)}
										<button
											className='icon-button'
											aria-label='删除摘录'
											onClick={() => {
												if (confirm('删除这条本地摘录及想法？')) update(slug, entry, { excerpts: entry.excerpts.filter(item => item.id !== excerpt.id) })
											}}>
											<Trash2 size={14} />
										</button>
									</li>
								))}
							</ul>
						)}
						<button
							className='text-link workspace-forget'
							onClick={() => {
								if (!confirm('移除这篇文章的本地记录？书签、进度和摘录都会删除。')) return
								const next = { version: 1, entries: { ...data.entries } }
								delete next.entries[slug]
								try {
									importReading(JSON.stringify(next))
								} catch {
									setActionError('移除失败，记录仍然保留。')
								}
							}}>
							移除记录
						</button>
					</article>
				))}
			</div>
			{visible.length === 0 && (
				<div className='feature-empty'>
					<h2>{query ? '没有找到匹配的记录。' : '这里还很安静。'}</h2>
					<p>在文章里点击「稍后读」、选中文字保存摘录，或标记为读完。</p>
					<Link href='/knowledge' className='button-light'>
						找一篇想读的文章 →
					</Link>
				</div>
			)}
			<div className='workspace-data'>
				<div>
					<h3>把阅读记录握在自己手里。</h3>
					<p className='muted'>不跨设备同步。清理浏览器会丢失记录，建议定期导出。导入会替换当前记录。</p>
				</div>
				<div className='feature-actions'>
					<button
						className='button-light'
						onClick={() => {
							try {
								exportReading()
								setActionError('')
							} catch {
								setActionError('无法读取存储，导出失败。请检查浏览器权限。')
							}
						}}>
						<Download size={15} />
						导出
					</button>
					<button className='button-light' disabled={importing} onClick={() => inputRef.current?.click()}>
						<FileUp size={15} />
						{importing ? '导入中…' : '导入'}
					</button>
					<button
						className='text-link'
						onClick={() => {
							if (confirm('清空全部本地阅读记录？建议先导出备份。此操作无法撤销。')) resetReading()
						}}>
						重置
					</button>
				</div>
			</div>
			<input
				ref={inputRef}
				className='hidden'
				type='file'
				accept='.json,application/json'
				onChange={async event => {
					const file = event.target.files?.[0]
					event.target.value = ''
					if (!file) return
					setImporting(true)
					try {
						if (file.size > 5 * 1024 * 1024) throw new Error('文件超过 5 MB，请选择阅读记录备份。')
						const raw = await file.text()
						decodeReading(raw)
						if (!confirm('用此备份替换当前浏览器的全部阅读记录？')) return
						importReading(raw)
						setActionError('')
						toast.success('阅读记录已导入当前浏览器。')
					} catch (error) {
						setActionError(error instanceof Error ? error.message : '导入失败，原记录未改变。')
					} finally {
						setImporting(false)
					}
				}}
			/>
		</div>
	)
}
