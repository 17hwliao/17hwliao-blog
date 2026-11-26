'use client'

import { Sparkles } from 'lucide-react'
import { play, ZENBOT_CHIRP } from '@/lib/sound'
import { ZENBOT_FALLBACK_STAND } from '@/features/zenbot/runtime'

export function HomeCompanionMark() {
	const summon = () => {
		play(ZENBOT_CHIRP)
		window.dispatchEvent(new Event('zenix.companion.open'))
	}

	return (
		<div className='home-companion-mark'>
			<button type='button' className='home-companion-recall' onClick={summon}>
				<img src={ZENBOT_FALLBACK_STAND} alt='' width={36} height={36} />
				<span>
					<strong>Zenbot · 袖珍向导</strong>
					<small>点我打开预设问答导览</small>
				</span>
			</button>
			<button type='button' className='home-companion-skin' title='召唤 Zenbot 互动' aria-label='召唤 Zenbot 互动' onClick={summon}>
				<Sparkles size={15} aria-hidden='true' />
			</button>
		</div>
	)
}
