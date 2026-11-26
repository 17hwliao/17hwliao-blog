import manifest from '../../../public/characters/zenbot/spin/manifest.json'

export const ZENBOT_SPRITE = {
	cols: manifest.cols,
	rows: manifest.rows,
	frames: manifest.frames,
	frameOrder: manifest.frameOrder,
	cycleMs: manifest.cycleMs,
	pixelsPerFrame: manifest.pixelsPerFrame,
	atlas: `/characters/zenbot/spin/${manifest.atlas}?v=${manifest.version}`,
	poster: `/characters/zenbot/spin/${manifest.poster}?v=${manifest.version}`
}

export function normalizeSpriteFrame(frame: number) {
	return ((Math.trunc(frame) % ZENBOT_SPRITE.frames) + ZENBOT_SPRITE.frames) % ZENBOT_SPRITE.frames
}

export function spriteSourceFrame(frame: number) {
	return ZENBOT_SPRITE.frameOrder[normalizeSpriteFrame(frame)]
}

export function spriteCellPosition(frame: number) {
	// The approved Zenbot atlas runs opposite to the reference's avatar sheet.
	// Keep the reference's positive mouse delta and auto-play logic unchanged;
	// normalize the artwork order once for every source of angle changes.
	const index = spriteSourceFrame(frame)
	return `${((index % ZENBOT_SPRITE.cols) * 100) / (ZENBOT_SPRITE.cols - 1)}% ${Math.floor(index / ZENBOT_SPRITE.cols) * 100 / (ZENBOT_SPRITE.rows - 1)}%`
}
