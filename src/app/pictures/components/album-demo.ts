import type { Picture } from '../page'

// Deliberately separate from list.json and upload state: these are opt-in examples.
const scenes = [
	{
		title: '远山',
		sky: '#e5e8e1',
		ground: '#8c9d90',
		shapes:
			'<circle cx="510" cy="130" r="52" fill="#f7f3de"/><path d="M0 430 200 185 360 385 500 245 720 440V540H0Z" fill="#b4bdb0"/><path d="M0 465 270 320 440 440 720 345V540H0Z" fill="#71887b"/>'
	},
	{
		title: '海岸',
		sky: '#e9e4d9',
		ground: '#a1b5b1',
		shapes:
			'<path d="M0 300Q170 275 360 310T720 300V540H0Z" fill="#789b9b"/><path d="M0 385Q260 345 400 435T720 455V540H0Z" fill="#ded1b9"/><path d="M0 365Q260 325 420 420T720 440" fill="none" stroke="#f5f1e5" stroke-width="9"/>'
	},
	{
		title: '午后',
		sky: '#e4d9c6',
		ground: '#b2a184',
		shapes:
			'<rect x="115" y="65" width="370" height="340" rx="180" fill="#b9c7bb"/><path d="M300 65V405M115 255H485" stroke="#f4eee1" stroke-width="17"/><path d="M400 540 285 405H485L660 540" fill="#ece3cf"/><rect x="65" y="405" width="600" height="18" fill="#80796c"/>'
	},
	{
		title: '山路',
		sky: '#dfe3db',
		ground: '#8b9b85',
		shapes:
			'<path d="M0 330Q200 195 390 330T720 295V540H0Z" fill="#a8b59c"/><path d="M0 440Q220 285 440 430T720 390V540H0Z" fill="#647e6a"/><path d="M430 540Q230 440 385 390T355 325" fill="none" stroke="#e5d6b9" stroke-width="38"/>'
	},
	{
		title: '黄昏',
		sky: '#ded0ba',
		ground: '#938a77',
		shapes:
			'<circle cx="390" cy="235" r="77" fill="#c99f72"/><path d="M0 365 180 310 355 365 555 285 720 355V540H0Z" fill="#a09f8b"/><path d="M0 440Q280 355 720 420V540H0Z" fill="#6d8078"/>'
	},
	{
		title: '窗边',
		sky: '#e8e5da',
		ground: '#b0b8a4',
		shapes:
			'<rect x="410" y="50" width="210" height="330" fill="#ccd7cd"/><path d="M515 50V380M410 215H620" stroke="#f6f2e7" stroke-width="14"/><path d="M220 420Q150 210 315 140M225 355Q330 260 295 190M210 315Q120 285 150 210" stroke="#778e77" stroke-width="15" fill="none"/><path d="M150 395H300L280 510H170Z" fill="#b09378"/>'
	}
]

export const albumDemo: Picture[] = scenes.map((scene, index) => ({
	id: `album-demo-${index}`,
	uploadedAt: '',
	description: `${scene.title} · 示例插画，仅用于效果预览。`,
	image: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="540" viewBox="0 0 720 540"><rect width="720" height="540" fill="${scene.sky}"/><path d="M0 355H720V540H0Z" fill="${scene.ground}"/>${scene.shapes}</svg>`)}`
}))
