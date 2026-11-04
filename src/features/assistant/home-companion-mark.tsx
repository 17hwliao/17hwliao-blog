'use client'

import { Sparkles } from 'lucide-react'
import { companionCharacters, isCompanionCharacter, type CompanionCharacter } from './companion-characters'

function recall(character?: CompanionCharacter) {
	window.dispatchEvent(new CustomEvent('zenix.companion.recall', { detail: character }))
}

export function HomeCompanionMark() {
	return (
		<div className='home-companion-mark'>
			<button type='button' className='home-companion-recall' onClick={() => recall()}>
				<img src='/xingyin/mark.webp' alt='' width={34} height={34} />
				<span><strong>小站看板娘</strong><small>打个招呼</small></span>
			</button>
			<label className='home-companion-skin' title='切换看板娘皮肤'>
				<Sparkles size={16} aria-hidden='true' />
				<span className='sr-only'>切换看板娘皮肤</span>
				<select defaultValue='' onChange={event => {
					if (isCompanionCharacter(event.currentTarget.value)) recall(event.currentTarget.value)
					event.currentTarget.value = ''
				}}>
					<option value='' disabled>切换皮肤</option>
					{Object.entries(companionCharacters).map(([id, scene]) => <option key={id} value={id}>{scene.title}</option>)}
				</select>
			</label>
		</div>
	)
}
