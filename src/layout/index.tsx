'use client'

import '@/features/appearance/ui-theme.css'

import { type PropsWithChildren, useEffect, Suspense } from 'react'
import { FloatingCompanion } from '@/features/assistant/floating-companion'
import { usePathname } from 'next/navigation'
import { MotionConfig } from 'motion/react'
import { SiteToaster } from '@/components/site-toaster'
import { useCenterInit } from '@/hooks/use-center'
import { useSizeInit } from '@/hooks/use-size'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { ContentProtection } from '@/components/content-protection'
import { ReferenceBackLink, ReferenceExperience } from '@/components/reference-experience'
import { CommandPalette } from '@/features/discovery/command-palette'
import ConfigDialog from '@/app/(home)/config-dialog'
import { AppearanceProvider } from '@/features/appearance/theme'
import { useVisualViewport } from '@/features/appearance/use-visual-viewport'

export default function Layout({ children }: PropsWithChildren) {
	useCenterInit()
	useVisualViewport()
	useSizeInit()
	const { siteContent, configDialogOpen, setConfigDialogOpen } = useConfigStore()
	const pathname = usePathname()
	const isHome = pathname === '/'
	useEffect(() => {
		document.title = siteContent.meta.title
		const handleKey = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && ((event.code === 'Comma' && event.shiftKey) || (event.key === ',' && window.location.pathname === '/'))) {
				event.preventDefault()
				window.dispatchEvent(new CustomEvent('zenbot:panel', { detail: 'settings' }))
				setConfigDialogOpen(true)
			}
		}
		window.addEventListener('keydown', handleKey)
		return () => window.removeEventListener('keydown', handleKey)
	}, [siteContent.meta.title, setConfigDialogOpen])
	return (
		<AppearanceProvider>
			<MotionConfig reducedMotion='user'>
				<div className={'site-shell' + (isHome ? ' is-home' : ' reference-page')} data-page={pathname.split('/')[1] || 'home'}>
					<a href='#main-content' className='skip-link'>
						跳转到正文
					</a>
					<ContentProtection />
					<ReferenceExperience />
					<CommandPalette hideTrigger />
					<main id='main-content' className='site-main ui-page' tabIndex={-1}>
						{!isHome && <ReferenceBackLink />}
						{children}
					</main>
					<ConfigDialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} />
					<SiteToaster />
					<Suspense fallback={null}>
						<FloatingCompanion />
					</Suspense>
				</div>
			</MotionConfig>
		</AppearanceProvider>
	)
}
