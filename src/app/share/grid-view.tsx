'use client'

import { useState } from 'react'
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
			{shares.length > 0 && (
				<div className='mb-8 space-y-4'>
					<input
						type='text'
						placeholder='搜索资源...'
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						className='focus:ring-brand mx-auto block w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:outline-none'
					/>

					<div className='flex flex-wrap justify-center gap-2'>
						<button
							onClick={() => setSelectedTag('all')}
							className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
								selectedTag === 'all' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
							}`}>
							全部
						</button>
						{allTags.map(tag => (
							<button
								key={tag}
								onClick={() => setSelectedTag(tag)}
								className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
									selectedTag === tag ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
								}`}>
								{tag}
							</button>
						))}
					</div>
				</div>
			)}

			<div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
				{filteredShares.map(share => (
					<ShareCard key={share.url} share={share} isEditMode={isEditMode} onUpdate={onUpdate} onDelete={() => onDelete?.(share)} />
				))}
			</div>

			{filteredShares.length === 0 && (
				<div className='mt-12 text-center text-gray-500'>
					<ContentEmpty
						title={shares.length === 0 ? '好东西，慢慢收集。' : '没有找到匹配内容'}
						description={shares.length === 0 ? '点击上方「编辑」，收藏第一个值得分享的链接。' : '换一个关键词或分类再看看。'}
					/>
				</div>
			)}
		</div>
	)
}
