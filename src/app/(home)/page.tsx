'use client'

import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight, Github, Mail, Rss } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useConfigStore } from './stores/config-store'
import { useBlogIndex, type BlogIndexItem } from '@/hooks/use-blog-index'
import { articleHref, projects, readingRoutes } from '@/features/discovery/catalog'
import { HomeReading } from '@/features/reading/home-reading'
import { ContributionWidget } from '@/features/github/contribution-widget'
import { projectShowcases } from '@/content/project-showcases'
import { authorAvatar } from '@/config/brand-assets'
import { HomeCompanionMark } from '@/features/assistant/home-companion-mark'
import styles from './home.module.css'

const routes = ['agent', 'go', 'data'].flatMap(id => {
	const route = readingRoutes.find(item => item.id === id)
	return route ? [route] : []
})
const selectedProjects = ['zenix', 'table-card', 'sql-sentinel', 'agentmesh'].flatMap(slug => {
	const project = projects.find(item => item.slug === slug)
	return project ? [project] : []
})

function ArticleDate({ article }: { article: BlogIndexItem }) {
	const date = new Date(article.date)
	if (Number.isNaN(date.getTime())) return null
	return (
		<time dateTime={article.date}>{date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai' })}</time>
	)
}

function SelectedProjects() {
	return (
		<section className={styles.projects} aria-labelledby='home-projects-title'>
			<div className={styles.sectionHeading} data-home-reveal>
				<div>
					<p className={styles.label}>SELECTED PROJECTS</p>
					<h2 id='home-projects-title'>做过的项目</h2>
				</div>
				<Link className={styles.quietLink} href='/projects'>
					所有项目 <ArrowUpRight size={16} aria-hidden='true' />
				</Link>
			</div>
			<div className={styles.projectList} data-home-reveal>
				{selectedProjects.map(project => {
					const showcase = projectShowcases[project.slug]
					const shot = showcase?.shots[0]
					return (
						<Link href={project.url} key={project.slug} className={styles.project}>
							{shot && (
								<div className={styles.projectCover}>
									<img src={shot.src} alt={shot.alt} width={720} height={450} loading='lazy' />
								</div>
							)}
							<div className={styles.projectCopy}>
								<div className={styles.projectTop}>
									<img src={project.image} alt='' width={36} height={36} loading='lazy' />
									<span>{project.kind}</span>
									<ArrowUpRight size={17} aria-hidden='true' />
								</div>
								<h3>{project.name}</h3>
								<p>{showcase?.summary || project.description}</p>
							</div>
						</Link>
					)
				})}
			</div>
		</section>
	)
}

export default function Home() {
	const { siteContent } = useConfigStore()
	const { items, loading, error, retry } = useBlogIndex()
	const recent = items.slice(0, 5)
	const github = siteContent.socialButtons.find(button => button.id === 'github' && button.value.trim())
	const email = siteContent.socialButtons.find(button => button.type === 'email' && button.value.trim())
	const journal = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
		if (motionPreference.matches || !window.IntersectionObserver || !Element.prototype.animate) return

		const active = new Set<Animation>()
		const observer = new IntersectionObserver(entries => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue
				observer.unobserve(entry.target)
				if (motionPreference.matches || entry.target.contains(document.activeElement)) continue

				const animation = entry.target.animate(
					[{ opacity: 0.88, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
					{ duration: 380, easing: 'cubic-bezier(.2,.65,.3,1)' }
				)
				active.add(animation)
				void animation.finished.then(() => active.delete(animation), () => active.delete(animation))
			}
		}, { rootMargin: '0px 0px -24px 0px' })
		journal.current?.querySelectorAll('[data-home-reveal]').forEach(element => observer.observe(element))

		const stop = () => {
			observer.disconnect()
			active.forEach(animation => animation.cancel())
			active.clear()
		}
		const onPreferenceChange = () => { if (motionPreference.matches) stop() }
		motionPreference.addEventListener('change', onPreferenceChange)
		return () => {
			motionPreference.removeEventListener('change', onPreferenceChange)
			stop()
		}
	}, [])

	return (
		<div ref={journal} className={styles.journal}>
			<section className={styles.intro} aria-labelledby='journal-title'>
				<div className={styles.introCopy} data-home-reveal>
					<p className={styles.kicker}>
						<span className={styles.dot} aria-hidden='true' />
						一个人的学习与实践 <span className={styles.english}>A PERSONAL JOURNAL</span>
					</p>
					<h1 id='journal-title'>
						<span className={styles.greeting}>你好，我是</span>{' '}
						<span className={styles.username}>{siteContent.meta.username}</span>
					</h1>
					<p className={styles.introDescription}>{siteContent.meta.description}</p>
					<div className={styles.heroActions}>
						<Link href='/projects' className='button-dark'>查看项目 <ArrowRight size={16} aria-hidden='true' /></Link>
						<a href='#journal-reading' className={styles.downLink}>往下读 <ArrowDown size={16} aria-hidden='true' /></a>
					</div>
				</div>
				<aside className={styles.author} aria-label='认识作者'>
					<div className={styles.identity}>
						<img src={authorAvatar} alt={`${siteContent.meta.username} 的头像`} width={60} height={60} />
						<div>
							<p>{siteContent.meta.username}</p>
							<span className={styles.profileRole}>后端开发 · 个人成长记录</span>
						</div>
					</div>
					<p className={styles.motto}>或许不必太复杂。</p>
					<dl className={styles.profileFacts}>
						<div><dt>学过</dt><dd>Go · Java</dd></div>
						<div><dt>在学</dt><dd>Agent 工程</dd></div>
						<div><dt>团队</dt><dd><a href='https://github.com/lec-org' target='_blank' rel='noreferrer'>lec-org <ArrowUpRight size={13} aria-hidden='true' /></a></dd></div>
						<div><dt>QQ</dt><dd>3594513696</dd></div>
					</dl>
					<div className={styles.authorLinks}>
						<Link href='/about'>
							更多关于我 <ArrowUpRight size={15} aria-hidden='true' />
						</Link>
						{github && (
							<a href={github.value} target='_blank' rel='noreferrer'>
								GitHub <Github size={15} aria-hidden='true' />
								<span className='sr-only'>（新窗口打开）</span>
							</a>
						)}
						{email && <a href={`mailto:${email.value}`}>写封邮件 <Mail size={15} aria-hidden='true' /></a>}
					</div>
					<HomeCompanionMark />
				</aside>
			</section>

			<div className={styles.readingGrid}>
				<section id='journal-reading' className={styles.recent} aria-labelledby='recent-writing-title'>
					<div className={styles.sectionHeading} data-home-reveal>
						<div>
							<p className={styles.label}>LATEST NOTES</p>
							<h2 id='recent-writing-title'>近来写下的</h2>
						</div>
						<Link href='/blog' className={styles.quietLink}>
							文章归档 <ArrowUpRight size={16} aria-hidden='true' />
						</Link>
					</div>
					{error && (
						<div className={styles.feedStatus} role='alert'>
							<p>文章列表暂时未能加载{recent.length ? '，以下保留上次读取的内容' : ''}。</p>
							<button type='button' onClick={() => void retry()}>
								重新加载 <ArrowRight size={14} aria-hidden='true' />
							</button>
						</div>
					)}
					{loading && !recent.length && (
						<p className={styles.feedStatus} role='status'>
							正在读取文章…
						</p>
					)}
					{!loading && !error && !recent.length && (
						<p className={styles.feedStatus}>
							这里还没有文章。也可以到<Link href='/blog'>文章归档</Link>看看。
						</p>
					)}
					<div className={styles.articleList}>
						{recent.map(article => (
							<article key={article.slug} className={styles.article}>
								<div className={styles.articleMeta}>
									<ArticleDate article={article} />
									{article.category && <span>{article.category}</span>}
								</div>
								<Link href={articleHref(article.slug)} className={styles.articleLink}>
									<div>
										<h3>{article.title || article.slug}</h3>
										{article.summary && <p>{article.summary}</p>}
										{article.tags?.length > 0 && <p className={styles.articleTags}>{article.tags.slice(0, 3).map(tag => <span key={tag}>#{tag}</span>)}</p>}
									</div>
									<ArrowUpRight size={19} aria-hidden='true' />
								</Link>
							</article>
						))}
					</div>
				</section>

				<aside className={styles.margin} aria-labelledby='reading-paths-title' data-home-reveal>
					<p className={styles.label}>READ ALONG</p>
					<h2 id='reading-paths-title'>学习路线</h2>
					<p className={styles.marginIntro}>按主题整理的笔记和实践。</p>
					<ol className={styles.routes}>
						{routes.map((route, index) => (
							<li key={route.id}>
								<Link href={`/knowledge?route=${route.id}#routes-title`}>
									<span className={styles.routeNumber} aria-hidden='true'>
										0{index + 1}
									</span>
									<div>
										<h3>{route.title}</h3>
										<p>{route.detail}</p>
									</div>
									<ArrowUpRight size={16} aria-hidden='true' />
								</Link>
							</li>
						))}
					</ol>
					<Link className={styles.quietLink} href='/knowledge'>
						展开知识地图 <ArrowRight size={16} aria-hidden='true' />
					</Link>
					<div className={styles.marginNote}>
						<p>我把实现过程和遇到的问题记下来，方便以后回头看。</p>
						<Link href='/about'>
							关于这个小站 <ArrowUpRight size={14} aria-hidden='true' />
						</Link>
					</div>
				</aside>
			</div>

			<SelectedProjects />
			<HomeReading />
			<div className={styles.contributions}>
				<ContributionWidget />
			</div>

			<section className={styles.postscript} aria-label='代码之外'>
				<div>
					<span className={styles.label}>P.S.</span>
					<p>代码之外，也有日常。</p>
				</div>
				<nav aria-label='继续逛逛'>
					<Link href='/pictures'>
						相册故事 <ArrowUpRight size={15} aria-hidden='true' />
					</Link>
					<Link href='/share'>
						值得分享 <ArrowUpRight size={15} aria-hidden='true' />
					</Link>
					<Link href='/reading'>
						阅读工作台 <ArrowUpRight size={15} aria-hidden='true' />
					</Link>
					<Link href='/rss.xml'>
						<Rss size={15} aria-hidden='true' /> RSS
					</Link>
				</nav>
			</section>
		</div>
	)
}
