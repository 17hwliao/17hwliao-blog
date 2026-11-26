const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadSource } = require('./helpers/load-source.cjs')
const { positionCompanion } = loadSource()('src/features/assistant/companion-position.js')

test('fractional walking positions keep both bubble edge clamps fixed at their viewport limit', () => {
	const variables = new Map()
	const walker = { style: { setProperty: (name, value) => variables.set(name, value), transform: '' } }
	for (const viewport of [320, 390, 1440]) {
		const width = Math.min(320, viewport - 84)
		const rightLimit = viewport - width - 66
		for (const edge of ['left', 'right']) {
			for (let step = 0; step < 200; step++) {
				const x = edge === 'left' ? 24 + step / 100 : viewport - 220 + step / 100
				positionCompanion(walker, x)
				const renderedX = Number(walker.style.transform.match(/translate3d\(([-\d.]+)px/)[1])
				const anchorX = Number.parseFloat(variables.get('--walker-x'))
				// Actual CSS clamp: centered on a 118px pet, with fixed viewport gutters.
				const localLeft = Math.max(12 - anchorX, Math.min(rightLimit - anchorX, 59 - width / 2))
				const pinnedEdge = renderedX + localLeft
				assert.equal(pinnedEdge, edge === 'left' ? 12 : rightLimit)
			}
		}
	}
})
