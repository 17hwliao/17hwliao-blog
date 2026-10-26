'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { ContentEmpty } from './content-empty'

export function BlogFeed({ limit = 5 }: { limit?: number }) {
	const { items, loading, error, retry } = useBlogIndex()
	const posts = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
	if (loading)
		return (
			<div className='feed-status' role='status'>
				正在读取文章…
			</div>
		)
	if (error)
		return (
			<div className='feed-status' role='alert'>
				<h3>文章暂时未能加载</h3>
				<p>请检查连接后重新尝试。</p>
				<button className='button-light' onClick={() => void retry()}>
					重新加载
				</button>
			</div>
		)
	if (!posts.length)
		return (
			<ContentEmpty title='第一篇文章，从这里开始。' description='一些日常，一点思考。把值得留下的，慢慢写下来。'>
				<Link href='/write' className='text-link'>
					开始写作 <ArrowUpRight size={16} />
				</Link>
			</ContentEmpty>
		)
	return (
		<div className='article-list'>
			{posts.map(post => (
				<Link className='article-row' key={post.slug} href={`/blog/${post.slug}`}>
					<div>
						<div className='article-meta'>
							<time dateTime={post.date}>{new Date(post.date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}</time>
							{post.category && <span>{post.category}</span>}
						</div>
						<h3>{post.title || post.slug}</h3>
						{post.summary && <p>{post.summary}</p>}
						<div className='article-tags'>
							{(post.tags || []).slice(0, 3).map(tag => (
								<span key={tag}>#{tag}</span>
							))}
						</div>
					</div>
					<ArrowUpRight size={18} className='article-arrow' />
				</Link>
			))}
		</div>
	)
}
