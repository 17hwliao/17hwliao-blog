'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Settings2, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { siteIcon } from '@/config/brand-assets'
import { HeaderMusic } from './header-music'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { CommandPalette } from '@/features/discovery/command-palette'
import { ThemeButton } from '@/features/appearance/theme'
import { DialogModal } from './dialog-modal'

const links = [
	['/blog', '文章'],
	['/projects', '项目'],
	['/knowledge', '知识'],
	['/share', '分享'],
	['/pictures', '相册'],
	['/bloggers', '收藏'],
	['/about', '关于'],
	['/assistant', '问博客']
]

export function SiteHeader() {
	const pathname = usePathname()
	const [menuOpen, setMenuOpen] = useState(false)
	useEffect(() => setMenuOpen(false), [pathname])
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
					<CommandPalette />
					<HeaderMusic />
					<ThemeButton />
					<button className='icon-button owner-header-action' onClick={() => setConfigDialogOpen(true)} aria-label='网站设置' title='网站设置'>
						<Settings2 size={18} />
					</button>
					<Link href='/write' className='button-dark owner-header-action'>
						写文章 <ArrowUpRight size={15} />
					</Link>
					<button type='button' className='icon-button mobile-nav-trigger' aria-label='打开导航菜单' aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
						<Menu size={21} />
					</button>
				</div>
			</div>
			<DialogModal open={menuOpen} onClose={() => setMenuOpen(false)} ariaLabel='导航菜单' className='mobile-navigation reader-drawer'>
				<div className='drawer-heading'>
					<div>
						<p className='eyebrow'>FIND YOUR NEXT READ</p>
						<h2>随处逛逛。</h2>
					</div>
					<button type='button' className='icon-button' aria-label='关闭导航菜单' onClick={() => setMenuOpen(false)}>
						<X size={20} />
					</button>
				</div>
				<nav aria-label='手机主导航'>
					{[...links, ['/reading', '阅读工作台']].map(([href, label]) => (
						<Link
							key={href}
							href={href}
							aria-current={pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined}
							onClick={() => setMenuOpen(false)}>
							{label}
							<ArrowUpRight size={16} />
						</Link>
					))}
				</nav>
				<div className='mobile-owner-actions'>
					<Link href='/write' onClick={() => setMenuOpen(false)}>
						写文章 <ArrowUpRight size={14} />
					</Link>
					<button
						type='button'
						onClick={() => {
							setMenuOpen(false)
							requestAnimationFrame(() => setConfigDialogOpen(true))
						}}>
						网站设置 <Settings2 size={14} />
					</button>
				</div>
			</DialogModal>
		</header>
	)
}
