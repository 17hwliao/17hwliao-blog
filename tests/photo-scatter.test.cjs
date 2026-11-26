const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadSource } = require('./helpers/load-source.cjs')
const { expandedPhotoLayout, movedBeyondClick, boundedPhotoDelta } = loadSource()('src/app/pictures/components/scatter-layout.ts')

test('expanded photos and notes stay inside phone, tablet and desktop viewports without overlapping', () => {
	for (const width of [320, 390, 768, 900, 1440]) {
		for (const height of [320, 568, 844, 1000]) {
			for (const ratio of [0.3, 2 / 3, 4 / 3, 2.4]) {
				const layout = expandedPhotoLayout({ width, height }, ratio, 2000, true)
				const f = layout.frame,
					n = layout.note
				assert.ok(f.x >= 0 && f.y >= 0)
				assert.ok(f.x + f.width <= width + 0.01 && f.y + f.height <= height + 0.01)
				assert.ok(n.left >= 0 && n.top >= 0)
				assert.ok(n.left + n.width <= width + 0.01 && n.top + n.maxHeight <= height + 0.01)
				assert.ok(layout.wide ? n.left >= f.x + f.width : n.top >= f.y + f.height)
				assert.ok(Math.abs((f.width - f.borderWidth * 2) / (f.height - f.borderWidth * 2) - ratio) < 0.0001)
			}
		}
	}
})

test('small source images are not enlarged and photos without notes use the full available area', () => {
	const small = expandedPhotoLayout({ width: 1440, height: 1000 }, 1, 80, false)
	assert.equal(small.frame.width - small.frame.borderWidth * 2, 80)
	const withNote = expandedPhotoLayout({ width: 1440, height: 1000 }, 2, 2000, true)
	const alone = expandedPhotoLayout({ width: 1440, height: 1000 }, 2, 2000, false)
	assert.ok(alone.frame.width > withNote.frame.width)
	assert.equal(alone.frame.x, (1440 - alone.frame.width) / 2)
})

test('drag suppression tolerates a normal click but rejects movement beyond the pointer threshold', () => {
	const start = { x: 50, y: 50 }
	assert.equal(movedBeyondClick(start, { x: 50, y: 50 }), false)
	assert.equal(movedBeyondClick(start, { x: 53, y: 54 }), false)
	assert.equal(movedBeyondClick(start, { x: 56, y: 50 }), true)
	assert.equal(movedBeyondClick(start, { x: 44, y: 50 }), true)
})

test('keyboard movement keeps rotated photo corners inside the board and can recover a clipped corner', () => {
	const board = { left: 20, right: 355, top: 256, bottom: 805 }
	const rotated = { left: 18, right: 232, top: 265, bottom: 537 }
	assert.deepEqual(boundedPhotoDelta(rotated, board, -30, -30), { dx: 14, dy: 3 })
	const centered = { left: 60, right: 274, top: 300, bottom: 572 }
	assert.deepEqual(boundedPhotoDelta(centered, board, -30, -30), { dx: -28, dy: -30 })
	assert.deepEqual(boundedPhotoDelta(centered, board, 1000, 1000), { dx: 69, dy: 221 })
	let pendingX = 0
	for (let repeat = 0; repeat < 100; repeat++) pendingX += boundedPhotoDelta(centered, board, -30, 0, pendingX, 0).dx
	assert.equal(centered.left + pendingX, board.left + 12, 'repeated keys before the next painted frame must not overshoot')
})
