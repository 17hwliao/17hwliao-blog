'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, CornerDownRight } from 'lucide-react'
import { articles, articleHref, projects, readingRoutes } from '@/features/discovery/catalog'
import { useReading } from './store'

const featuredSlugs = [
	{ slug: 'lake-269071408', intro: '准备 Go 环境，了解常见系统的安装步骤与工具选择。' },
	{ slug: 'lake-280042163', intro: '认识 Eino 的模型、工具与图编排，从环境搭建走近 Agent 应用。' },
	{ slug: 'lake-254956974', intro: '从存储结构与数据库引擎开始，整理 MySQL 的基础概念。' }
]
const featured = featuredSlugs.flatMap(({ slug, intro }) => {
	const article = articles.find(item => item.slug === slug)
	return article ? [{ ...article, intro }] : []
})
const starterRoute = readingRoutes[0]
export function HomeReading() {
	const { data, error } = useReading()
	const latest = Object.entries(data.entries)
		.filter(([slug, entry]) => !entry.completed && entry.position > 0.02 && articles.some(article => article.slug === slug))
		.sort(([, a], [, b]) => b.updatedAt.localeCompare(a.updatedAt))[0]
	const current = latest && articles.find(article => article.slug === latest[0])
	return (
		<div className='home-reading'>
			{current && latest && !error && (
				<section className='continue-reading' aria-label='继续上次阅读'>
					<div className='continue-reading-copy'>
						<span className='eyebrow'>PICK UP WHERE YOU LEFT OFF</span>
						<h2>{current.title}</h2>
						<p>上次读到 {Math.round(latest[1].position * 100)}% · 记录保存在当前浏览器</p>
						<progress value={latest[1].position} max={1} aria-label='上次阅读位置' />
					</div>
					<Link href={`${articleHref(current.slug)}?resume=1`} className='button-dark'>
						继续阅读 <ArrowRight size={16} />
					</Link>
				</section>
			)}
			{error && (
				<p className='feature-error' role='status'>
					{error} <Link href='/reading'>管理阅读记录</Link>
				</p>
			)}
			<section className='start-here' aria-labelledby='start-here-title'>
				<div className='section-heading'>
					<div>
						<p className='eyebrow'>A FEW GOOD PLACES TO START</p>
						<h2 id='start-here-title'>初次来，从这里开始。</h2>
					</div>
					<Link className='subtle-link' href='/knowledge'>
						探索知识地图 <ArrowRight size={15} />
					</Link>
				</div>
				<div className='starter-layout'>
					<ol className='starter-articles'>
						{featured.map((article, index) => (
							<li key={article.slug}>
								<Link href={articleHref(article.slug)}>
									<span className='starter-number'>0{index + 1}</span>
									<div>
										<small>{article.tags.slice(0, 2).join(' / ')}</small>
										<h3>{article.title}</h3>
										<p>{article.intro}</p>
									</div>
									<CornerDownRight size={18} />
								</Link>
							</li>
						))}
					</ol>
					<div className='starter-side'>
						<Link className='starter-route' href={`/knowledge?route=${starterRoute.id}#routes-title`}>
							<BookOpen size={21} />
							<span className='eyebrow'>一条阅读路线 · {starterRoute.articles.length} 篇</span>
							<h3>{starterRoute.title}</h3>
							<p>{starterRoute.detail}</p>
							<span className='text-link'>
								顺着这条线读 <ArrowRight size={15} />
							</span>
						</Link>
						<div className='starter-projects'>
							<span className='eyebrow'>也可以，先看一个项目</span>
							{projects.slice(0, 2).map(project => (
								<Link href={project.url} key={project.slug}>
									<img src={project.image} alt='' width={32} height={32} />
									<div>
										<strong>{project.name}</strong>
										<small>{project.kind}</small>
									</div>
									<ArrowRight size={15} />
								</Link>
							))}
						</div>
					</div>
				</div>
			</section>
		</div>
	)
}
