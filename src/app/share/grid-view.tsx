'use client'

import { useState } from 'react'
import { BentoCard } from '@/features/bento/bento-card'
import { PageIntro } from '@/components/page-intro'
import { ContentEmpty } from '@/components/content-empty'

import { type LogoItem } from './components/logo-upload-dialog'
import { ShareCard, type Share } from './components/share-card'

interface GridViewProps {
	shares: Share[]
	isEditMode?: boolean
	onUpdate?: (share: Share, oldShare: Share, logoItem?: LogoItem) => void
	onDelete?: (share: Share) => void
}

export default function GridView({ shares, isEditMode = false, onUpdate, onDelete }: GridViewProps) {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedTag, setSelectedTag] = useState<string>('all')

	const allTags = Array.from(new Set(shares.flatMap(share => share.tags)))

	const filteredShares = shares.filter(share => {
		const matchesSearch = share.name.toLowerCase().includes(searchTerm.toLowerCase()) || share.description.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesTag = selectedTag === 'all' || share.tags.includes(selectedTag)
		return matchesSearch && matchesTag
	})

	return (
		<div className='collection-page'>
			<PageIntro label='CURATED FINDS' title='值得分享' description='好用的工具、有趣的网站，以及偶然遇见的灵感。' />
			<section className='toolbox-grid' aria-label='小站工具与实验'>
				{[
					{ href: '/image-toolbox', title: 'WebP 图片工具', description: '转换图片，调整质量与体积。' },
					{ href: '/svgs', title: 'SVG 图标库', description: '搜索并浏览 SVG 图标。' },
					{ href: '/clock', title: '专注时钟', description: '倒计时、秒表与分段计时。' }
				].map(tool => (
					<BentoCard key={tool.href} href={tool.href} arrowCorner>
						<h2>{tool.title}</h2>
						<p>{tool.description}</p>
					</BentoCard>
				))}
			</section>
			<h2 className='resource-heading'>收藏的资源</h2>
			{shares.length > 0 && (
				<div className='mb-8 space-y-4'>
					<input
						type='text'
						placeholder='搜索资源...'
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						className='focus:ring-brand ui-edge mx-auto block w-full max-w-md rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none'
					/>

					<div className='resource-filters flex flex-wrap gap-2'>
						<button
							onClick={() => setSelectedTag('all')}
							aria-pressed={selectedTag === 'all'}
							className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
								selectedTag === 'all' ? 'ui-primary' : 'ui-soft-fill ui-body-copy ui-hover-fill'
							}`}>
							全部
						</button>
						{allTags.map(tag => (
							<button
								key={tag}
								onClick={() => setSelectedTag(tag)}
								aria-pressed={selectedTag === tag}
								className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
									selectedTag === tag ? 'ui-primary' : 'ui-soft-fill ui-body-copy ui-hover-fill'
								}`}>
								{tag}
							</button>
						))}
					</div>
				</div>
			)}

			<div className='resource-grid grid grid-cols-1 gap-3 sm:grid-cols-2'>
				{filteredShares.map(share => (
					<ShareCard key={share.url} share={share} isEditMode={isEditMode} onUpdate={onUpdate} onDelete={() => onDelete?.(share)} />
				))}
			</div>

			{filteredShares.length === 0 && (
				<div className='ui-muted mt-12 text-center'>
					<ContentEmpty
						title={shares.length === 0 ? '好东西，慢慢收集。' : '没有找到匹配内容'}
						description={shares.length === 0 ? '点击上方「编辑」，收藏第一个值得分享的链接。' : '换一个关键词或分类再看看。'}
					/>
				</div>
			)}
		</div>
	)
}
