import { existsSync } from 'node:fs'
import path from 'node:path'
import { ThemedFrame } from '@/components/themed-frame'
import { PageIntro } from '@/components/page-intro'
import Live2DViewer from './live2d-viewer'

export default function Live2DPage() {
	const localPreview =
		process.env.NODE_ENV === 'development' &&
		existsSync(path.join(process.cwd(), 'public/live2d/unitychan/model-config.json')) &&
		existsSync(path.join(process.cwd(), 'public/unitychan/preview/index.html'))
	return (
		<div>
			<PageIntro label='LIVE CHARACTER' title='Live2D' description='动作与表情的交互预览。' />
			<div data-ui-surface='panel' className='live2d-stage'>
				{localPreview ? (
					<section className='w-full max-w-4xl' aria-label='Unity-Chan Live2D 展示'>
						<ThemedFrame
							src='/unitychan/preview/index.html'
							title='Unity-Chan 原生动作与表情预览'
							className='block h-[82vh] min-h-[650px] w-full border-0'
							sandbox='allow-scripts allow-same-origin allow-popups'
						/>
					</section>
				) : (
					<Live2DViewer />
				)}
			</div>
		</div>
	)
}
