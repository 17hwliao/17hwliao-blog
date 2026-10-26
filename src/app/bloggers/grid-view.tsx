'use client'

import { useState } from 'react'
import { PageIntro } from '@/components/page-intro'
import { ContentEmpty } from '@/components/content-empty'

import { type AvatarItem } from './components/avatar-upload-dialog'
import { BloggerCard } from './components/blogger-card'

export type BloggerStatus = 'recent' | 'disconnected'

export interface Blogger {
	name: string
	avatar: string
	url: string
	description: string
	stars: number
	status?: BloggerStatus
}

interface GridViewProps {
	bloggers: Blogger[]
	isEditMode?: boolean
	onUpdate?: (blogger: Blogger, oldBlogger: Blogger, avatarItem?: AvatarItem) => void
	onDelete?: (blogger: Blogger) => void
}

export default function GridView({ bloggers, isEditMode = false, onUpdate, onDelete }: GridViewProps) {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<BloggerStatus>('recent')

	const filteredBloggers = bloggers.filter(blogger => {
		const status = blogger.status ?? 'recent'
		const matchesCategory = status === selectedCategory
		const matchesSearch = blogger.name.toLowerCase().includes(searchTerm.toLowerCase()) || blogger.description.toLowerCase().includes(searchTerm.toLowerCase())
		return matchesCategory && matchesSearch
	})

	return (
		<div className='collection-page'>
			<PageIntro label='BLOGROLL' title='阅读的邻居' description='在别人的文字里，遇见更多不同的世界。' />
			{bloggers.length > 0 && (
				<div className='mb-8 space-y-4'>
					<input
						type='text'
						placeholder='搜索博主...'
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						className='focus:ring-brand mx-auto block w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:outline-none'
					/>

					<div className='flex flex-wrap justify-center gap-2'>
						<button
							onClick={() => setSelectedCategory('recent')}
							className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
								selectedCategory === 'recent' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
							}`}>
							近期更新
						</button>
						<button
							onClick={() => setSelectedCategory('disconnected')}
							className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
								selectedCategory === 'disconnected' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
							}`}>
							长期失联
						</button>
					</div>
				</div>
			)}

			<div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
				{filteredBloggers.map(blogger => (
					<BloggerCard key={blogger.url} blogger={blogger} isEditMode={isEditMode} onUpdate={onUpdate} onDelete={() => onDelete?.(blogger)} />
				))}
			</div>

			{filteredBloggers.length === 0 && (
				<div className='mt-12 text-center text-gray-500'>
					<ContentEmpty
						title={bloggers.length === 0 ? '下一位有趣的邻居。' : '没有找到匹配内容'}
						description={bloggers.length === 0 ? '点击上方「编辑」，添加你喜欢阅读的博客。' : '换一个关键词或分类再看看。'}
					/>
				</div>
			)}
		</div>
	)
}
