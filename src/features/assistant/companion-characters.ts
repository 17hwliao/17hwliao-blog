import { xingyinSkins, xingyinCapabilities } from '../../../public/xingyin/skins.mjs'

function character(skin: keyof typeof xingyinSkins) {
	return {
		src: '/xingyin/scene.html?skin=' + skin,
		title: xingyinSkins[skin].title,
		capabilities: xingyinCapabilities
	}
}

export const companionCharacters = {
	'xingyin-silver': character('silver'),
	'xingyin-amber': character('amber'),
	'xingyin-ivory-dragon': character('ivory-dragon'),
	'xingyin-violet-stars': character('violet-stars'),
	'xingyin-noir-gold': character('noir-gold'),
	'xingyin-moon-piano': character('moon-piano'),
	'xingyin-ink-fox': character('ink-fox'),
	'xingyin-azure-fan': character('azure-fan'),
	'xingyin-ocean-maid': character('ocean-maid')
} as const

export const defaultCompanionCharacter = 'xingyin-silver'
export type CompanionCharacter = keyof typeof companionCharacters
const preferenceKey = 'zenix.companion.skin'

export function isCompanionCharacter(value: unknown): value is CompanionCharacter {
	return typeof value === 'string' && Object.hasOwn(companionCharacters, value)
}

export function readCompanionCharacter(): CompanionCharacter {
	try {
		const saved = localStorage.getItem(preferenceKey)
		if (isCompanionCharacter(saved)) return saved
	} catch {}
	return defaultCompanionCharacter
}

export function saveCompanionCharacter(character: CompanionCharacter) {
	try { localStorage.setItem(preferenceKey, character) } catch {}
}
