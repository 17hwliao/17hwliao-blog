'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { companionCharacters, defaultCompanionCharacter, isCompanionCharacter, readCompanionCharacter, type CompanionCharacter } from './companion-characters'

function recall(character?: CompanionCharacter) {
	window.dispatchEvent(new CustomEvent('zenix.companion.recall', { detail: character }))
}

export function HomeCompanionMark() {
	const [selected, setSelected] = useState<CompanionCharacter>(defaultCompanionCharacter)
	useEffect(() => { setSelected(readCompanionCharacter()) }, [])
	return (
		<div className='home-companion-mark'>
			<button type='button' className='home-companion-recall' onClick={() => recall()}>
				<img src='/xingyin/mark.webp' alt='' width={34} height={34} />
				<span><strong>小站看板娘</strong><small>打个招呼</small></span>
			</button>
			<label className='home-companion-skin' title='切换看板娘皮肤'>
				<Sparkles size={16} aria-hidden='true' />
				<span className='sr-only'>切换看板娘皮肤</span>
				<select value={selected} onChange={event => {
					const next = event.currentTarget.value
					if (!isCompanionCharacter(next)) return
					setSelected(next)
					recall(next)
				}}>
					{Object.entries(companionCharacters).map(([id, scene]) => <option key={id} value={id}>{scene.title}</option>)}
				</select>
			</label>
		</div>
	)
}
