'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Search } from 'lucide-react'
import { PageIntro } from '@/components/page-intro'
import { articles, articleHref, readingRoutes, searchArticles, topics } from './catalog'
import { useReading } from '@/features/reading/store'

export function KnowledgePage() {
	const [topic, setTopic] = useState('全部')
	const [query, setQuery] = useState('')
	const [routeId, setRouteId] = useState(readingRoutes[0].id)
	useEffect(() => {
		const requested = new URLSearchParams(location.search).get('route')
		if (readingRoutes.some(route => route.id === requested)) setRouteId(requested!)
	}, [])
	const [limit, setLimit] = useState(12)
	const { data, error } = useReading()
	const filtered = useMemo(() => searchArticles(query, topic === '全部' ? articles : articles.filter(article => article.tags.includes(topic))), [query, topic])
	const route = readingRoutes.find(item => item.id === routeId)!
	const completed = route.articles.filter(article => data.entries[article.slug]?.completed).length
	return (
		<div className='discovery-page'>
			<PageIntro
				label='CONNECTED NOTES'
				title='让知识，连成一条路。'
				description='按主题整理我的学习笔记和项目实践，也留下一些从接触概念到动手实现的记录。'
			/>
			<div className='feature-heading'>
				<h2>知识地图</h2>
				<button
					className='text-link'
					onClick={() => {
						setTopic('全部')
						setQuery('')
						setLimit(12)
					}}>
					查看全部 {articles.length} 篇 <ArrowRight size={14} />
				</button>
			</div>
			<div className='topic-map' aria-label='按技术方向探索主题'>
				{['Goland', 'JAVA'].map(root => (
					<section className='topic-branch' key={root}>
						<button
							className='topic-root'
							aria-pressed={topic === root}
							onClick={() => {
								setTopic(root)
								setLimit(12)
							}}>
							<span className='eyebrow'>KNOWLEDGE BRANCH</span>
							<strong>{root === 'Goland' ? 'Go / Agent' : 'Java / Web'}</strong>
							<span>{articles.filter(article => article.tags.includes(root)).length} 篇笔记</span>
						</button>
						<div className='topic-leaves'>
							{topics
								.filter(item => item.name !== root && item.articles.some(article => article.tags.includes(root)))
								.map(item => (
									<button
										key={item.name}
										aria-pressed={topic === item.name}
										onClick={() => {
											setTopic(item.name)
											setLimit(12)
										}}>
										<span>{item.name}</span>
										<small>{item.articles.length}</small>
									</button>
								))}
						</div>
					</section>
				))}
			</div>
			<section className='knowledge-results' aria-labelledby='topic-title'>
				<div className='feature-heading'>
					<h2 id='topic-title'>
						{topic} <span className='muted'>{filtered.length} 篇</span>
					</h2>
					<label className='feature-search'>
						<Search size={16} />
						<input
							type='search'
							aria-label='搜索主题内文章'
							placeholder='在主题里找一篇文章…'
							value={query}
							onChange={event => {
								setQuery(event.target.value)
								setLimit(12)
							}}
						/>
					</label>
				</div>
				<div className='knowledge-articles'>
					{filtered.slice(0, limit).map(article => (
						<Link href={articleHref(article.slug)} key={article.slug} className='knowledge-article'>
							<span className='eyebrow'>{article.tags.join(' / ')}</span>
							<h3>{article.title}</h3>
							<p>{article.summary || '打开阅读这篇笔记。'}</p>
							<span className='knowledge-open'>
								{data.entries[article.slug]?.completed ? (
									<>
										<Check size={14} /> 已读完
									</>
								) : (
									<>
										阅读笔记 <ArrowRight size={14} />
									</>
								)}
							</span>
						</Link>
					))}
				</div>
				{filtered.length === 0 && <p className='feature-empty'>没有匹配的文章。试试更短的关键词，或切换到全部主题。</p>}
				{filtered.length > limit && (
					<button className='button-light feature-more' onClick={() => setLimit(value => value + 12)}>
						再看 12 篇
					</button>
				)}
			</section>
			<section className='reading-routes' aria-labelledby='routes-title'>
				<div className='feature-heading'>
					<div>
						<p className='eyebrow'>LEARNING THREADS</p>
						<h2 id='routes-title'>我走过的学习路线</h2>
					</div>
					<Link className='text-link' href='/reading'>
						阅读工作台 <ArrowRight size={14} />
					</Link>
				</div>
				<div className='route-layout'>
					<div className='route-choices' aria-label='选择阅读路线'>
						{readingRoutes.map((item, index) => (
							<button key={item.id} aria-pressed={routeId === item.id} onClick={() => setRouteId(item.id)}>
								<span className='eyebrow'>
									0{index + 1} / {item.articles.length} 篇
								</span>
								<strong>{item.title}</strong>
								<span>{item.detail}</span>
							</button>
						))}
					</div>
					<div className='route-detail'>
						<div className='feature-heading'>
							<h3>{route.title}</h3>
							<span className='muted'>
								{completed} / {route.articles.length} 已读完
							</span>
						</div>
						<progress aria-label='本路线阅读完成度' value={completed} max={route.articles.length || 1} />
						<ol>
							{route.articles.map((article, index) => (
								<li key={article.slug}>
									<span className='route-number'>{data.entries[article.slug]?.completed ? <Check size={15} /> : String(index + 1).padStart(2, '0')}</span>
									<Link href={articleHref(article.slug)}>{article.title}</Link>
									<ArrowRight size={14} />
								</li>
							))}
						</ol>
						<Link href={`/projects/${route.project}`} className='button-dark'>
							查看相关项目 <ArrowRight size={15} />
						</Link>
					</div>
				</div>
				{error && (
					<p className='feature-error' role='alert'>
						{error}
					</p>
				)}
			</section>
		</div>
	)
}
