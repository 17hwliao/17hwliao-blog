'use client'

import Link from 'next/link'
import { ContentEmpty } from '@/components/content-empty'
import { PageActions } from '@/components/page-actions'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { motion } from 'motion/react'

dayjs.extend(weekOfYear)
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useBlogIndex, type BlogIndexItem } from '@/hooks/use-blog-index'
import { useCategories } from '@/hooks/use-categories'
import { isPrivateKeyBusy, useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { cn } from '@/lib/utils'
import { saveBlogEdits } from './services/save-blog-edits'
import { ArrowDownRight, ArrowUpRight, Check, ChevronDown } from 'lucide-react'
import { BlogCoverHoverPreview, useBlogCoverHover } from './components/blog-cover-hover'
import { CategoryModal } from './components/category-modal'

type DisplayMode = 'day' | 'week' | 'month' | 'year' | 'category'

export default function BlogPage() {
	const { items, loading, error, retry } = useBlogIndex()
	const { categories: categoriesFromServer, loading: categoriesLoading, error: categoriesError, retry: retryCategories } = useCategories()
	const { isAuth, importPrivateKey, keyStatus } = useAuthStore()
	const importing = isPrivateKeyBusy(keyStatus)
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false
	const enableCategories = siteContent.enableCategories ?? false

	const keyInputRef = useRef<HTMLInputElement>(null)
	const [editMode, setEditMode] = useState(false)
	const [editOriginalItems, setEditOriginalItems] = useState<BlogIndexItem[]>([])
	const [editOriginalCategories, setEditOriginalCategories] = useState<string[]>([])
	const [editableItems, setEditableItems] = useState<BlogIndexItem[]>([])
	const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set())
	const [saving, setSaving] = useState(false)
	const [displayMode, setDisplayMode] = useState<DisplayMode>('year')
	const [expandedGroups, setExpandedGroups] = useState<Set<string> | null>(null)
	const [categoryModalOpen, setCategoryModalOpen] = useState(false)
	const [categoryList, setCategoryList] = useState<string[]>([])
	const [newCategory, setNewCategory] = useState('')

	const { cancelCoverPreview, onCoverLinkMouseEnter, hoverCoverPreview, mousePosition } = useBlogCoverHover(editMode)

	useEffect(() => {
		if (!editMode) {
			setEditableItems(items)
		}
	}, [items, editMode])

	useEffect(() => {
		if (!editMode) setCategoryList(categoriesFromServer || [])
	}, [categoriesFromServer, editMode])

	const displayItems = editMode ? editableItems : items

	const { groupedItems, groupKeys, getGroupLabel } = useMemo(() => {
		const sorted = [...displayItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

		const grouped = sorted.reduce(
			(acc, item) => {
				let key: string
				let label: string
				const date = dayjs(item.date)

				switch (displayMode) {
					case 'category':
						key = item.category || '未分类'
						label = key
						break
					case 'day':
						key = date.format('YYYY-MM-DD')
						label = date.format('YYYY年MM月DD日')
						break
					case 'week':
						const week = date.week()
						key = `${date.format('YYYY')}-W${week.toString().padStart(2, '0')}`
						label = `${date.format('YYYY')}年第${week}周`
						break
					case 'month':
						key = date.format('YYYY-MM')
						label = date.format('YYYY年MM月')
						break
					case 'year':
					default:
						key = date.format('YYYY')
						label = date.format('YYYY年')
						break
				}

				if (!acc[key]) {
					acc[key] = { items: [], label }
				}
				acc[key].items.push(item)
				return acc
			},
			{} as Record<string, { items: BlogIndexItem[]; label: string }>
		)

		const keys = Object.keys(grouped).sort((a, b) => {
			if (displayMode === 'category') {
				const categoryOrder = new Map(categoryList.map((c, index) => [c, index]))
				const aOrder = categoryOrder.has(a) ? categoryOrder.get(a)! : Number.MAX_SAFE_INTEGER
				const bOrder = categoryOrder.has(b) ? categoryOrder.get(b)! : Number.MAX_SAFE_INTEGER
				if (aOrder !== bOrder) return aOrder - bOrder
				return a.localeCompare(b)
			}
			// 按时间倒序排序
			if (displayMode === 'week') {
				// 周格式：YYYY-WW
				const [yearA, weekA] = a.split('-W').map(Number)
				const [yearB, weekB] = b.split('-W').map(Number)
				if (yearA !== yearB) return yearB - yearA
				return weekB - weekA
			}
			return b.localeCompare(a)
		})

		return {
			groupedItems: grouped,
			groupKeys: keys,
			getGroupLabel: (key: string) => grouped[key]?.label || key
		}
	}, [displayItems, displayMode, categoryList])

	const selectedCount = selectedSlugs.size
	const defaultOpenGroups = groupKeys.slice(0, 1)
	const openGroups = expandedGroups ?? new Set(defaultOpenGroups)
	const allExpanded = groupKeys.length > 0 && groupKeys.every(key => openGroups.has(key))
	const buttonText = isAuth ? '保存' : '导入密钥'

	function jumpToGroup(groupKey: string, index: number) {
		setExpandedGroups(previous => new Set(previous ?? defaultOpenGroups).add(groupKey))
		cancelCoverPreview()
		const heading = document.getElementById(`archive-heading-${displayMode}-${index}`)
		heading?.focus({ preventScroll: true })
		heading?.scrollIntoView({ block: 'start' })
	}

	const toggleEditMode = useCallback(() => {
		if (!editMode && (loading || error || categoriesLoading || categoriesError)) {
			toast.error('请等待文章和分类加载成功后再编辑。')
			return
		}
		if (editMode) {
			setEditMode(false)
			setEditableItems(items)
			setSelectedSlugs(new Set())
		} else {
			setEditableItems(items)
			setEditOriginalItems(items)
			setEditOriginalCategories(categoriesFromServer)
			setEditMode(true)
		}
	}, [editMode, items, categoriesFromServer, loading, error, categoriesLoading, categoriesError])

	const toggleSelect = useCallback((slug: string) => {
		setSelectedSlugs(prev => {
			const next = new Set(prev)
			if (next.has(slug)) {
				next.delete(slug)
			} else {
				next.add(slug)
			}
			return next
		})
	}, [])

	// 全选所有文章
	const handleSelectAll = useCallback(() => {
		setSelectedSlugs(new Set(editableItems.map(item => item.slug)))
	}, [editableItems])

	// 全选/取消全选某个时间维度分组
	const handleSelectGroup = useCallback(
		(groupKey: string) => {
			const group = groupedItems[groupKey]
			if (!group) return

			// 检查该分组是否所有文章都已选中
			const allSelected = group.items.every(item => selectedSlugs.has(item.slug))

			setSelectedSlugs(prev => {
				const next = new Set(prev)
				if (allSelected) {
					// 如果已全选，则取消该分组的选择
					group.items.forEach(item => {
						next.delete(item.slug)
					})
				} else {
					// 如果未全选，则全选该分组
					group.items.forEach(item => {
						next.add(item.slug)
					})
				}
				return next
			})
		},
		[groupedItems, selectedSlugs]
	)

	// 取消全选
	const handleDeselectAll = useCallback(() => {
		setSelectedSlugs(new Set())
	}, [])

	const handleItemClick = useCallback(
		(event: React.MouseEvent, slug: string) => {
			if (!editMode) return
			event.preventDefault()
			event.stopPropagation()
			toggleSelect(slug)
		},
		[editMode, toggleSelect]
	)

	const handleDeleteSelected = useCallback(() => {
		if (selectedCount === 0) {
			toast.info('请选择要删除的文章')
			return
		}
		setEditableItems(prev => prev.filter(item => !selectedSlugs.has(item.slug)))
		setSelectedSlugs(new Set())
	}, [selectedCount, selectedSlugs])

	const handleAssignCategory = useCallback((slug: string, category?: string) => {
		setEditableItems(prev =>
			prev.map(item => {
				if (item.slug !== slug) return item
				const nextCategory = category?.trim()
				if (!nextCategory) return { ...item, category: undefined }
				return { ...item, category: nextCategory }
			})
		)
	}, [])

	const handleAddCategory = useCallback(() => {
		const value = newCategory.trim()
		if (!value) {
			toast.info('请输入分类名称')
			return
		}
		setCategoryList(prev => (prev.includes(value) ? prev : [...prev, value]))
		setNewCategory('')
	}, [newCategory])

	const handleRemoveCategory = useCallback((category: string) => {
		setCategoryList(prev => prev.filter(item => item !== category))
		setEditableItems(prev => prev.map(item => (item.category === category ? { ...item, category: undefined } : item)))
	}, [])

	const handleReorderCategories = useCallback((nextList: string[]) => {
		setCategoryList(nextList)
	}, [])

	const handleCancel = useCallback(() => {
		setEditableItems(items)
		setSelectedSlugs(new Set())
		setEditMode(false)
	}, [items])

	const handleSave = useCallback(async () => {
		if (categoriesLoading || categoriesError) {
			toast.error('分类尚未成功加载，请先重新加载分类后再保存。')
			return
		}
		const removedSlugs = editOriginalItems.filter(item => !editableItems.some(editItem => editItem.slug === item.slug)).map(item => item.slug)
		const normalizedCategoryList = categoryList.map(c => c.trim()).filter(Boolean)
		const categoryListChanged = JSON.stringify(normalizedCategoryList) !== JSON.stringify(editOriginalCategories.map(c => c.trim()).filter(Boolean))
		const categoryAssignmentChanged = editOriginalItems.some(origin => {
			const next = editableItems.find(editItem => editItem.slug === origin.slug)
			const originCategory = origin.category || ''
			const nextCategory = next?.category || ''
			return originCategory !== nextCategory
		})
		const hasChanges = removedSlugs.length > 0 || categoryListChanged || categoryAssignmentChanged

		if (!hasChanges) {
			toast.info('没有需要保存的改动')
			return
		}

		try {
			setSaving(true)
			await saveBlogEdits(editOriginalItems, editableItems, normalizedCategoryList, editOriginalCategories)
			setEditMode(false)
			setSelectedSlugs(new Set())
			setCategoryModalOpen(false)
		} catch (error: any) {
			console.error(error)
			toast.error(error?.message || '保存失败')
		} finally {
			setSaving(false)
		}
	}, [editOriginalItems, editableItems, categoryList, categoriesFromServer, editOriginalCategories, categoriesLoading, categoriesError])

	const handleSaveClick = useCallback(() => {
		if (saving || isPrivateKeyBusy(useAuthStore.getState().keyStatus)) return
		if (!isAuth) {
			keyInputRef.current?.click()
			return
		}
		void handleSave()
	}, [handleSave, isAuth, saving])

	const handlePrivateKeySelection = useCallback(
		async (file: File) => {
			await importPrivateKey(file)
		},
		[importPrivateKey]
	)

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!editMode && (e.ctrlKey || e.metaKey) && e.key === ',') {
				e.preventDefault()
				toggleEditMode()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [editMode, toggleEditMode])

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					e.currentTarget.value = ''
					if (f) await handlePrivateKeySelection(f)
				}}
			/>

			<header data-ui-surface='hero' className='archive-intro'>
				<div>
					<p className='eyebrow'>THE ARCHIVE</p>
					<h1>写下的片段</h1>
					<p className='archive-description'>关于生活、学习，还有那些值得多想一会儿的事。</p>
				</div>
				{!loading && !error && (
					<p className='archive-total'>
						<strong>{items.length}</strong> 篇文章
					</p>
				)}
			</header>
			<div className='archive-content'>
				{categoriesError && (
					<div className='feed-status' role='alert'>
						分类未能加载。
						<button className='button-light' onClick={() => void retryCategories()}>
							重新加载分类
						</button>
					</div>
				)}
				{error && (
					<div className='feed-status' role='alert'>
						{items.length ? '文章刷新未成功，以下显示上次读取的内容。' : '文章未能加载。'}
						<button onClick={() => void retry()} className='button-light'>
							重新加载
						</button>
					</div>
				)}
				{!loading && !error && items.length === 0 && (
					<ContentEmpty title='留一页空白，给新的想法。' description='这里还没有文章。打开「写文章」，开始你的第一篇记录。'>
						<Link href='/write' className='button-dark'>
							写第一篇文章
						</Link>
					</ContentEmpty>
				)}
				{loading && (
					<p className='text-secondary py-6 text-sm' role='status'>
						正在读取文章…
					</p>
				)}
				{groupKeys.length > 0 && (
					<div data-ui-surface='well' className='archive-controls'>
						<div className='archive-grouping'>
							<span className='archive-control-label'>分组方式</span>
							<div className='archive-mode-switch' role='group' aria-label='文章分组方式'>
								{[
									{ value: 'day', label: '日' },
									{ value: 'week', label: '周' },
									{ value: 'month', label: '月' },
									{ value: 'year', label: '年' },
									...(enableCategories ? ([{ value: 'category', label: '分类' }] as const) : [])
								].map(option => (
									<button
										type='button'
										key={option.value}
										onClick={() => {
											if (displayMode === option.value) return
											setDisplayMode(option.value as DisplayMode)
											setExpandedGroups(null)
											cancelCoverPreview()
										}}
										aria-pressed={displayMode === option.value}
										className='archive-mode-button'>
										{option.label}
									</button>
								))}
							</div>
						</div>
						{!editMode && (
							<button
								type='button'
								className='archive-expand-all'
								data-expanded={allExpanded}
								aria-label={allExpanded ? '收起全部文章分组' : '展开全部文章分组'}
								onClick={() => {
									setExpandedGroups(allExpanded ? new Set() : new Set(groupKeys))
									cancelCoverPreview()
								}}>
								<ChevronDown size={16} aria-hidden='true' />
								{allExpanded ? '全部收起' : '全部展开'}
							</button>
						)}
					</div>
				)}

				<div className='archive-browser'>
					{!editMode && groupKeys.length > 1 && (
						<nav className='archive-directory' aria-label='文章分组目录'>
							<p className='archive-directory-title'>
								分组目录 <ArrowDownRight size={14} aria-hidden='true' />
							</p>
							<div className='archive-directory-links'>
								{groupKeys.map((key, index) => (
									<button
										key={key}
										type='button'
										aria-controls={`archive-${displayMode}-${index}`}
										aria-expanded={openGroups.has(key)}
										onClick={() => jumpToGroup(key, index)}>
										<span>{getGroupLabel(key)}</span>
										<span className='archive-directory-count'>{groupedItems[key].items.length}</span>
									</button>
								))}
							</div>
							<select
								className='archive-directory-select'
								aria-label='跳到文章分组'
								value=''
								onChange={event => {
									if (!event.currentTarget.value) return
									const index = Number(event.currentTarget.value)
									jumpToGroup(groupKeys[index], index)
								}}>
								<option value='' disabled>
									跳到分组
								</option>
								{groupKeys.map((key, index) => (
									<option key={key} value={index}>
										{getGroupLabel(key)} · {groupedItems[key].items.length} 篇
									</option>
								))}
							</select>
						</nav>
					)}
					<div className='archive-groups'>
						{groupKeys.map((groupKey, index) => {
							const group = groupedItems[groupKey]
							if (!group) return null
							const expanded = editMode || openGroups.has(groupKey)
							const contentId = `archive-${displayMode}-${index}`
							const headingId = `archive-heading-${displayMode}-${index}`

							return (
								<section onMouseLeave={cancelCoverPreview} key={groupKey} aria-labelledby={headingId} data-ui-surface='panel' className='archive-group'>
									<div className='archive-group-heading'>
										<h2 id={headingId} tabIndex={-1}>
											<button
												type='button'
												className='archive-group-toggle'
												aria-expanded={expanded}
												aria-controls={contentId}
												disabled={editMode}
												onClick={() => {
													setExpandedGroups(previous => {
														const next = new Set(previous ?? defaultOpenGroups)
														if (next.has(groupKey)) next.delete(groupKey)
														else next.add(groupKey)
														return next
													})
													cancelCoverPreview()
												}}>
												<span className='archive-group-label'>{getGroupLabel(groupKey)}</span>
												<span className='archive-group-count'>{group.items.length} 篇文章</span>
												<ChevronDown size={18} aria-hidden='true' />
											</button>
										</h2>
										{editMode &&
											(() => {
												const groupAllSelected = group.items.every(item => selectedSlugs.has(item.slug))
												return (
													<motion.button
														whileHover={{ scale: 1.05 }}
														whileTap={{ scale: 0.95 }}
														onClick={() => handleSelectGroup(groupKey)}
														className={cn(
															'rounded-lg border px-3 py-1 text-xs transition-colors',
															groupAllSelected
																? 'border-brand/40 ui-accent-soft ui-accent hover:bg-brand/20'
																: 'text-secondary hover:border-brand/40 ui-hover-accent border-transparent ui-soft-fill ui-hover-fill'
														)}>
														{groupAllSelected ? '取消全选' : '全选该分组'}
													</motion.button>
												)
											})()}
									</div>
									<div id={contentId} hidden={!expanded} className='archive-group-articles'>
										{expanded &&
											group.items.map(it => {
												const isSelected = selectedSlugs.has(it.slug)
												return (
													<Link
														onMouseEnter={() => onCoverLinkMouseEnter(it.cover)}
														onMouseLeave={cancelCoverPreview}
														href={`/blog/${it.slug}`}
														key={it.slug}
														onClick={event => handleItemClick(event, it.slug)}
														className={cn(
															'archive-article',
															editMode
																? cn(
																		'rounded-lg border px-3',
																		isSelected ? 'border-brand/60 ui-accent-soft' : 'hover:border-brand/40 border-transparent ui-hover-fill'
																	)
																: 'cursor-pointer'
														)}>
														{editMode && (
															<span
																className={cn(
																	'flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-semibold',
																	isSelected ? 'border-brand bg-brand text-bg' : 'border-[#D9D9D9] text-transparent'
																)}>
																<Check />
															</span>
														)}
														<time className='archive-article-date' dateTime={it.date}>
															{dayjs(it.date).format('MM-DD')}
														</time>
														<div className='archive-article-copy'>
															<span className='archive-article-title'>{it.title || it.slug}</span>
															{it.tags?.length > 0 && (
																<span className='archive-article-meta'>
																	{(it.tags || []).map(tag => (
																		<span key={tag}>#{tag}</span>
																	))}
																</span>
															)}
														</div>
														{!editMode && <ArrowUpRight size={16} aria-hidden='true' className='archive-article-arrow' />}
													</Link>
												)
											})}
									</div>
								</section>
							)
						})}
					</div>
				</div>
			</div>

			<PageActions>
				{editMode ? (
					<>
						{enableCategories && (
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => setCategoryModalOpen(true)}
								disabled={saving}
								className='rounded-xl border ui-soft-fill px-4 py-2 text-sm transition-colors ui-hover-fill'>
								分类
							</motion.button>
						)}
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleCancel}
							disabled={saving}
							className='rounded-xl border ui-soft-fill px-6 py-2 text-sm'>
							取消
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={selectedCount === editableItems.length ? handleDeselectAll : handleSelectAll}
							className='rounded-xl border ui-soft-fill px-4 py-2 text-sm transition-colors ui-hover-fill'>
							{selectedCount === editableItems.length ? '取消全选' : '全选'}
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleDeleteSelected}
							disabled={selectedCount === 0}
							className='rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 transition-colors disabled:opacity-60'>
							删除(已选:{selectedCount}篇)
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleSaveClick}
							disabled={saving || importing}
							className='brand-btn px-6'>
							{saving ? '保存中...' : importing ? '私钥处理中…' : buttonText}
						</motion.button>
					</>
				) : (
					!hideEditButton && (
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={toggleEditMode}
							className='bg-card rounded-xl border px-6 py-2 text-sm backdrop-blur-sm transition-colors ui-hover-fill'>
							编辑
						</motion.button>
					)
				)}
			</PageActions>

			<BlogCoverHoverPreview preview={hoverCoverPreview} position={mousePosition} />

			<CategoryModal
				open={categoryModalOpen}
				onClose={() => setCategoryModalOpen(false)}
				categoryList={categoryList}
				newCategory={newCategory}
				onNewCategoryChange={setNewCategory}
				onAddCategory={handleAddCategory}
				onRemoveCategory={handleRemoveCategory}
				onReorderCategories={handleReorderCategories}
				editableItems={editableItems}
				onAssignCategory={handleAssignCategory}
			/>
		</>
	)
}
