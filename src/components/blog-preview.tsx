'use client'

import { motion } from 'motion/react'
import { INIT_DELAY } from '@/consts'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { useSize } from '@/hooks/use-size'
import { BlogSidebar } from '@/components/blog-sidebar'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import type { BlogSource } from '@/app/blog/types'

type BlogPreviewProps = {
	markdown: string
	title: string
	tags: string[]
	date: string
	summary?: string
	cover?: string
	slug?: string
	createdAt?: string
	contentUpdatedAt?: string | null
	source?: BlogSource
}

export function BlogPreview({ markdown, title, tags, date, summary, cover, slug, createdAt, contentUpdatedAt, source }: BlogPreviewProps) {
	const { maxSM: isMobile } = useSize()
	const { content, toc, loading } = useMarkdownRender(markdown)
	const { siteContent } = useConfigStore()
	const summaryInContent = siteContent.summaryInContent ?? false

	if (loading) {
		return <div className='text-secondary flex h-full items-center justify-center text-sm'>渲染中...</div>
	}

	return (
		<div className='reading-layout'>
			<motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: INIT_DELAY }} className='reading-article'>
				<div>
					<h1 className='text-center text-2xl font-semibold'>{title}</h1>

					<div className='text-secondary mt-4 flex flex-wrap items-center justify-center gap-3 px-8 text-center text-sm'>
						{tags.map(t => (
							<span key={t}>#{t}</span>
						))}
					</div>

					<div className='article-dates text-secondary mt-3 text-center text-sm'>
						<span>{source ? '编写于 ' : ''}<time dateTime={createdAt}>{date}</time></span>
						{source && contentUpdatedAt && contentUpdatedAt !== createdAt && (
							<span>内容更新于 <time dateTime={contentUpdatedAt}>{new Date(contentUpdatedAt).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' })}</time></span>
						)}
					</div>
					{source && <p className='article-origin'>原笔记目录：{source.book} / {source.directory.join(' / ')}</p>}

					{summary && summaryInContent && <div className='text-secondary mt-6 cursor-text text-center text-sm'>“{summary}”</div>}

					<div className='prose mt-6 max-w-none cursor-text'>{content}</div>
				</div>
			</motion.article>

			{!isMobile && <BlogSidebar cover={cover} summary={summary} toc={toc} slug={slug} />}
		</div>
	)
}
