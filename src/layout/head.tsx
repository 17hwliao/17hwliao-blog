import { siteFavicon } from '@/config/brand-assets'

export default function Head() {
	return (
		<head>
			<meta name='viewport' content='width=device-width, initial-scale=1.0' />
			<link rel='manifest' href='/manifest.json' />

			<link rel='icon' type='image/png' sizes='64x64' href={siteFavicon} />
		</head>
	)
}
