export const companionCharacters = {
	'xingyin-silver': { src: '/xingyin/scene.html?skin=silver', title: '星音 · 银蓝' },
	'xingyin-amber': { src: '/xingyin/scene.html?skin=amber', title: '星音 · 暖橙书卷' }
} as const

export const defaultCompanionCharacter = 'xingyin-silver'

export type CompanionCharacter = keyof typeof companionCharacters

export function isCompanionCharacter(value: unknown): value is CompanionCharacter {
	return typeof value === 'string' && Object.hasOwn(companionCharacters, value)
}
