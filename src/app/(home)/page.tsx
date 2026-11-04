'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight, BookOpen, FolderOpen, Image, Bookmark, Github, Mail } from 'lucide-react'
import { useConfigStore } from './stores/config-store'
import { BlogFeed } from '@/components/blog-feed'
import { HomeReading } from '@/features/reading/home-reading'
import { authorAvatar } from '@/config/brand-assets'
import { HomeCompanionMark } from '@/features/assistant/home-companion-mark'
import { ContributionWidget } from '@/features/github/contribution-widget'

const collections = [
	{ href: '/knowledge', title: '学习记录', description: '学过什么，正在做什么', icon: BookOpen },
	{ href: '/reading', title: '阅读工作台', description: '书签、摘录与那些想法', icon: Bookmark },
	{ href: '/projects', title: '做过的项目', description: '想法的另一种表达', icon: FolderOpen },
	{ href: '/pictures/stories', title: '相册故事集', description: '给日常留几个章节', icon: Image },
	{ href: '/share', title: '值得分享', description: '遇见的好东西', icon: Bookmark }
]

export default function Home() {
	const { siteContent } = useConfigStore()
	return (
		<div className='home-page'>
			<section className='home-hero' aria-labelledby='home-intro-title'>
				<div className='hero-copy'>
					<p className='eyebrow'>
						<span className='journal-dot' /> PERSONAL JOURNAL
					</p>
					<h1 id='home-intro-title'>
						你好，我是
						<br />
						<span>{siteContent.meta.username}</span>
					</h1>
					<p className='hero-description'>{siteContent.meta.description}</p>
					<div className='hero-intro-actions'>
						<Link href='/projects' className='button-dark'>
							查看项目 <ArrowRight size={16} />
						</Link>
						<Link href='/about' className='text-link'>
							更多关于我 <ArrowUpRight size={16} />
						</Link>
					</div>
				</div>
				<aside className='hero-profile' aria-label='博主个人资料'>
					<div className='hero-profile-identity'>
						<img src={authorAvatar} alt={`${siteContent.meta.username} 的头像`} width={64} height={64} />
						<div>
							<p className='hero-profile-name'>{siteContent.meta.username}</p>
							<p className='hero-profile-role'>后端开发 · 个人成长记录</p>
						</div>
					</div>
					<p className='hero-profile-motto'>或许不必太复杂。</p>
					<dl className='hero-profile-facts'>
						<div><dt>学过</dt><dd>Go · Java</dd></div>
						<div><dt>在学</dt><dd>Agent 工程</dd></div>
						<div><dt>团队</dt><dd><a href='https://github.com/lec-org' target='_blank' rel='noreferrer'>lec-org <ArrowUpRight size={13} /></a></dd></div>
						<div><dt>QQ</dt><dd>3594513696</dd></div>
					</dl>
					<div className='hero-profile-links'>
						<a href='https://github.com/17hwliao' target='_blank' rel='noreferrer'><Github size={16} /> GitHub <ArrowUpRight size={13} /></a>
						<a href='mailto:shiqihaowuliao@qq.com'><Mail size={16} /> 写封邮件 <ArrowUpRight size={13} /></a>
					</div>
					<HomeCompanionMark />
				</aside>
			</section>
			<ContributionWidget />
			<HomeReading />
			<div className='home-content'>
				<section className='latest-section' aria-labelledby='latest-title'>
					<div className='section-heading'>
						<h2 id='latest-title'>最近写下的</h2>
						<Link href='/blog' className='subtle-link'>
							全部文章 <ArrowRight size={15} />
						</Link>
					</div>
					<BlogFeed />
				</section>
				<aside className='home-aside'>
					<div className='aside-heading'>
						<span className='eyebrow'>EXPLORE</span>
						<span className='aside-line' />
					</div>
					{collections.map(({ href, title, description, icon: Icon }) => (
						<Link href={href} className='collection-link' key={href}>
							<Icon size={20} strokeWidth={1.5} />
							<div>
								<h3>{title}</h3>
								<p>{description}</p>
							</div>
							<ArrowUpRight size={15} />
						</Link>
					))}
					<div className='aside-footnote'>
						<p>不必着急，文字会慢慢长出来。</p>
						<Link href='/rss.xml' className='subtle-link'>
							通过 RSS 订阅 <ArrowUpRight size={13} />
						</Link>
					</div>
				</aside>
			</div>
		</div>
	)
}
