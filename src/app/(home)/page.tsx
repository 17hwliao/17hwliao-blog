'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight, BookOpen, FolderOpen, Image, Bookmark } from 'lucide-react'
import { useConfigStore } from './stores/config-store'
import { BlogFeed } from '@/components/blog-feed'
import { HomeReading } from '@/features/reading/home-reading'

const collections = [
	{ href: '/knowledge', title: '知识地图', description: '沿着一条路线，慢慢读', icon: BookOpen },
	{ href: '/reading', title: '阅读工作台', description: '书签、摘录与那些想法', icon: Bookmark },
	{ href: '/projects', title: '做过的项目', description: '想法的另一种表达', icon: FolderOpen },
	{ href: '/pictures/stories', title: '相册故事集', description: '给日常留几个章节', icon: Image },
	{ href: '/share', title: '值得分享', description: '遇见的好东西', icon: Bookmark }
]

export default function Home() {
	const { siteContent } = useConfigStore()
	return (
		<div className='home-page'>
			<section className='home-hero'>
				<div className='hero-copy'>
					<p className='eyebrow'>
						<span className='journal-dot' /> PERSONAL JOURNAL
					</p>
					<h1>
						记录日常，
						<br />
						<span>也记录灵感。</span>
					</h1>
					<p className='hero-description'>{siteContent.meta.description}</p>
					<Link href='/about' className='text-link'>
						关于这个小站 <ArrowUpRight size={16} />
					</Link>
				</div>
				<div className='hero-note' aria-hidden='true'>
					<span className='note-topline'>
						NOTES & THOUGHTS <span>↗</span>
					</span>
					<BookOpen className='note-book' size={68} strokeWidth={0.8} />
					<p>
						保持好奇。
						<br />
						慢慢积累。
					</p>
					<span className='note-bottom'>A LITTLE SPACE FOR IDEAS.</span>
				</div>
			</section>
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
