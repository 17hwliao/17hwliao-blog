const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadSource } = require('./helpers/load-source.cjs')

test('actual turntable scrubs without pressed buttons and resumes from that frame after leave or captured drag', async () => {
	const originals = new Map()
	const install = (name, value) => {
		originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
		Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
	}
	let now = 0, frameId = 0, image, effect, cleanup
	const rafs = new Map(), listeners = new Map(), capture = new Set()
	const area = {
		dataset: {}, matches: () => false,
		addEventListener: (name, handler) => listeners.set(name, handler),
		removeEventListener: name => listeners.delete(name),
		setPointerCapture: id => capture.add(id),
		hasPointerCapture: id => capture.has(id),
		releasePointerCapture: id => capture.delete(id),
		getBoundingClientRect: () => ({ left: 0, right: 248, top: 0, bottom: 284 })
	}
	const sprite = { style: {}, dataset: {} }
	const refs = [area, sprite]
	const emit = (type, x, y = 100, extra = {}) => listeners.get(type)?.({
		type, clientX: x, clientY: y, pointerType: 'mouse', pointerId: 1, button: 0, buttons: 0, ...extra
	})
	const advance = ms => {
		now += ms
		const [id, callback] = rafs.entries().next().value
		rafs.delete(id); callback(now)
	}
	try {
		install('performance', { now: () => now })
		install('window', { matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) })
		install('document', { hidden: false })
		install('Image', class { constructor() { image = this } async decode() {} })
		install('IntersectionObserver', class { observe() {} disconnect() {} })
		install('requestAnimationFrame', callback => { rafs.set(++frameId, callback); return frameId })
		install('cancelAnimationFrame', id => rafs.delete(id))
		const { ZenbotTurntable } = loadSource({
			react: {
				useRef: () => ({ current: refs.shift() }),
				useState: value => [value, () => {}],
				useEffect: callback => { effect = callback }
			},
			'@/lib/sound': { play() {}, ZENBOT_CHIRP: [] },
			'./pixel-icons': { PixelRotateIcon: () => null }
		})('src/features/zenbot/zenbot-turntable.tsx')
		ZenbotTurntable(); cleanup = effect(); await image.onload()
		advance(100)
		assert.equal(sprite.dataset.frame, '1')
		emit('pointerenter', 100)
		advance(200)
		assert.equal(sprite.dataset.frame, '1', 'hover should pause automatic turning')
		emit('pointermove', 128)
		assert.equal(sprite.dataset.frame, '3', 'unpressed horizontal mouse motion must scrub')
		assert.equal(sprite.style.backgroundPosition, '60% 100%', 'screen-right motion must select the screen-right-facing artwork, like the reference')
		emit('pointermove', 86)
		assert.equal(sprite.dataset.frame, '0', 'reverse hover motion must work')
		emit('pointerleave', -1)
		advance(100)
		assert.equal(sprite.dataset.frame, '1', 'automatic spin must continue from the scrubbed frame')
		emit('pointerenter', 100); emit('pointerdown', 100, 100, { buttons: 1 })
		emit('pointerleave', 249); emit('pointermove', 268, 100, { buttons: 1 })
		assert.equal(sprite.dataset.frame, '13', 'captured drag should continue beyond the hit area')
		emit('pointerup', 268)
		assert.equal(capture.size, 0)
		advance(100)
		assert.equal(sprite.dataset.frame, '14', 'release outside must resume, without a stuck hover')
	} finally {
		cleanup?.()
		for (const [name, descriptor] of originals) {
			if (descriptor) Object.defineProperty(globalThis, name, descriptor)
			else delete globalThis[name]
		}
	}
	assert.equal(rafs.size, 0)
	assert.equal(listeners.size, 0)
})
