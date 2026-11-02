import { siteFavicon } from '@/config/brand-assets'
import { themeBootstrap } from '@/features/appearance/theme-model'

export default function Head() {
	return (
		<head>
			<script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
			<meta name='color-scheme' content='light dark' />
			<link rel='manifest' href='/manifest.json' />

			<link rel='icon' type='image/png' sizes='64x64' href={siteFavicon} />
		</head>
	)
}
