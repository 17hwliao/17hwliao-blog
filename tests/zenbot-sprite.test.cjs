const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const { loadSource } = require('./helpers/load-source.cjs')

const assetDir = path.join(__dirname, '../public/characters/zenbot/spin')
const manifest = JSON.parse(fs.readFileSync(path.join(assetDir, 'manifest.json'), 'utf8'))

test('turntable wraps continuously through both ends without generating an adjacent atlas cell', () => {
	const { normalizeSpriteFrame, spriteCellPosition } = loadSource()('src/features/zenbot/zenbot-sprite-model.ts')
	assert.equal(normalizeSpriteFrame(-1), 23)
	assert.equal(normalizeSpriteFrame(24), 0)
	assert.equal(normalizeSpriteFrame(-49), 23)
	assert.equal(spriteCellPosition(0), '0% 0%')
	assert.equal(spriteCellPosition(5), '20% 100%')
	assert.equal(spriteCellPosition(6), '0% 100%')
	assert.equal(spriteCellPosition(23), '20% 0%')
})

test('both pointer and automatic logical frame progression use the reference sheet direction', () => {
	const { spriteSourceFrame } = loadSource()('src/features/zenbot/zenbot-sprite-model.ts')
	// Visually checked against the original avatar-spin.webp: reference frame 6
	// faces screen-right, while this artwork's screen-right profile is cell 18.
	assert.equal(spriteSourceFrame(0), 0)
	assert.equal(spriteSourceFrame(6), 18)
	assert.equal(spriteSourceFrame(12), 12)
	assert.equal(spriteSourceFrame(18), 6)
	assert.equal(spriteSourceFrame(24), 0)
	assert.equal(spriteSourceFrame(-6), 6)
	assert.deepEqual(Array.from({ length: 24 }, (_, frame) => spriteSourceFrame(frame)), [0,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1])
})

test('shipped sprite atlas contains 24 registered, distinct character views with transparent padding', async () => {
	const image = await loadImage(fs.readFileSync(path.join(assetDir, manifest.atlas)))
	assert.equal(image.width, manifest.cols * manifest.cellWidth)
	assert.equal(image.height, manifest.rows * manifest.cellHeight)
	assert.equal(manifest.frames, 24)
	assert.equal(new Set(manifest.registration.map(frame => frame.sha256)).size, 24)
	assert.ok(fs.statSync(path.join(assetDir, manifest.atlas)).size < 1_000_000, 'homepage atlas exceeds 1 MB budget')
	const canvas = createCanvas(image.width, image.height), context = canvas.getContext('2d')
	context.drawImage(image, 0, 0)
	for (let frame = 0; frame < 24; frame++) {
		const data = context.getImageData(frame % 6 * 320, Math.floor(frame / 6) * 360, 320, 360).data
		let visible = 0, top = 360, bottom = 0
		for (let y = 0; y < 360; y++) for (let x = 0; x < 320; x++) {
			if (data[(y * 320 + x) * 4 + 3] <= 160) continue
			visible++; top = Math.min(top, y); bottom = Math.max(bottom, y)
		}
		assert.ok(visible > 10_000, `frame ${frame} has no usable character`)
		assert.ok(top >= 8 && bottom < 352, `frame ${frame} clips the hair or feet`)
		assert.ok(Math.abs(bottom - 344) <= 2, `frame ${frame} has a drifting ground baseline`)
	}
})
