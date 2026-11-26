import '@/styles/globals.css'

import type { Metadata, Viewport } from 'next'
import Layout from '@/layout'
import Head from '@/layout/head'
import siteContent from '@/config/site-content.json'
import { BUTTON_FRAME, CARD_FRAME, SWATCH_FRAME } from '@/lib/nine-slice'
import { DEFAULT_BENTO_ACCENT, DEFAULT_BENTO_STYLE, DEFAULT_BENTO_BORDER, DEFAULT_THEME } from '@/features/appearance/theme-model'

const {
	meta: { title, description, username },
	theme
} = siteContent

export const metadata: Metadata = {
	title,
	description,
	authors: [{ name: username }],
	creator: username,
	openGraph: {
		title,
		description
	},
	twitter: {
		title,
		description
	}
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#0e1116' }

const htmlStyle: React.CSSProperties & Record<`--${string}`, string> = {
	'--color-brand': theme.colorBrand,
	'--color-primary': theme.colorPrimary,
	'--color-secondary': theme.colorSecondary,
	'--color-brand-secondary': theme.colorBrandSecondary,
	'--color-bg': theme.colorBg,
	'--color-border': theme.colorBorder,
	'--color-card': theme.colorCard,
	'--color-article': theme.colorArticle,
	...CARD_FRAME,
	...BUTTON_FRAME,
	...SWATCH_FRAME
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html
			data-scroll-behavior='smooth'
			lang='zh-CN'
			data-theme={DEFAULT_THEME}
			data-theme-preference={DEFAULT_THEME}
			data-bento-style={DEFAULT_BENTO_STYLE}
			data-bento-border={DEFAULT_BENTO_BORDER}
			data-bento-accent={DEFAULT_BENTO_ACCENT}
			suppressHydrationWarning
			style={htmlStyle}>
			<Head />

			<body>
				<script
					dangerouslySetInnerHTML={{
						__html: `
					if (/windows|win32/i.test(navigator.userAgent)) {
						document.documentElement.classList.add('windows');
					}
		      `
					}}
				/>

				<Layout>{children}</Layout>
			</body>
		</html>
	)
}
