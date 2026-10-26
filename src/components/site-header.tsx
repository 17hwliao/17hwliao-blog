'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Settings2 } from 'lucide-react'
import { siteIcon } from '@/config/brand-assets'
import { HeaderMusic } from './header-music'
import { useConfigStore } from '@/app/(home)/stores/config-store'

const links = [
	['/blog', '文章'],
	['/projects', '项目'],
	['/share', '分享'],
	['/pictures', '相册'],
	['/bloggers', '收藏'],
	['/about', '关于']
]

export function SiteHeader() {
	const pathname = usePathname()
	const { siteContent, setConfigDialogOpen } = useConfigStore()
	return (
		<header className='site-header'>
			<div className='header-inner'>
				<Link href='/' className='site-brand' aria-label={`${siteContent.meta.title} · 首页`}>
					<span className='brand-symbol'>
						<img src={siteIcon} alt='' width={36} height={36} />
					</span>
					<span>{siteContent.meta.title}</span>
				</Link>
				<nav className='site-nav' aria-label='主导航'>
					{links.map(([href, label]) => (
						<Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined}>
							{label}
						</Link>
					))}
				</nav>
				<div className='header-actions'>
					<HeaderMusic />
					<button className='icon-button' onClick={() => setConfigDialogOpen(true)} aria-label='网站设置' title='网站设置'>
						<Settings2 size={18} />
					</button>
					<Link href='/write' className='button-dark'>
						写文章 <ArrowUpRight size={15} />
					</Link>
				</div>
			</div>
		</header>
	)
}
