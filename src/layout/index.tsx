'use client'

import { type PropsWithChildren, useEffect } from 'react'
import Link from 'next/link'
import { MotionConfig } from 'motion/react'
import { SiteToaster } from '@/components/site-toaster'
import { useCenterInit } from '@/hooks/use-center'
import { useSizeInit } from '@/hooks/use-size'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { SiteHeader } from '@/components/site-header'
import ConfigDialog from '@/app/(home)/config-dialog'
import { AppearanceProvider } from '@/features/appearance/theme'
import { useVisualViewport } from '@/features/appearance/use-visual-viewport'

export default function Layout({ children }: PropsWithChildren) {
	useCenterInit()
	useVisualViewport()
	useSizeInit()
	const { siteContent, configDialogOpen, setConfigDialogOpen } = useConfigStore()
	useEffect(() => {
		document.title = siteContent.meta.title
		const handleKey = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key === ',' && window.location.pathname === '/') {
				event.preventDefault()
				setConfigDialogOpen(true)
			}
		}
		window.addEventListener('keydown', handleKey)
		return () => window.removeEventListener('keydown', handleKey)
	}, [siteContent.meta.title, setConfigDialogOpen])
	return (
		<AppearanceProvider>
			<MotionConfig reducedMotion='user'>
				<div className='site-shell'>
					<a href='#main-content' className='skip-link'>
						跳转到正文
					</a>
					<SiteHeader />
					<div id='page-actions' className='page-actions' />
					<main id='main-content' className='site-main' tabIndex={-1}>
						{children}
					</main>
					<footer className='site-footer'>
						<p>
							© {new Date().getFullYear()} {siteContent.meta.title}
							<span className='footer-divider'>/</span>记录，连接每一个日常。
						</p>
						<div>
							{siteContent.socialButtons
								.filter(button => button.value.trim())
								.sort((a, b) => a.order - b.order)
								.map(button => (
									<a
										key={button.id}
										href={button.type === 'email' ? `mailto:${button.value}` : button.value}
										target={button.type === 'email' ? undefined : '_blank'}
										rel='noreferrer'>
										{button.label || (button.type === 'email' ? '邮箱' : button.type === 'github' ? 'GitHub' : '链接')}
									</a>
								))}
							<Link href='/rss.xml'>RSS</Link>
							<Link href='/knowledge'>知识地图</Link>
							<Link href='/reading'>阅读工作台</Link>
							<Link href='/about'>关于</Link>
							{siteContent.beian.text && (
								<a href={siteContent.beian.link || 'https://beian.miit.gov.cn/'} target='_blank' rel='noreferrer'>
									{siteContent.beian.text}
								</a>
							)}
						</div>
					</footer>
					<ConfigDialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} />
					<SiteToaster />
				</div>
			</MotionConfig>
		</AppearanceProvider>
	)
}
