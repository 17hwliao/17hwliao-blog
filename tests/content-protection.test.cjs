const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadSource } = require('./helpers/load-source.cjs')

function environment(run) {
	const old = new Map(['window', 'document', 'Element'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
	class Element {
		constructor(editable = false) {
			this.editable = editable
		}
		closest() {
			return this.editable ? this : null
		}
	}
	const target = () => ({
		listeners: new Map(),
		addEventListener(type, fn) {
			const callbacks = this.listeners.get(type) || new Set()
			callbacks.add(fn)
			this.listeners.set(type, callbacks)
		},
		removeEventListener(type, fn) {
			this.listeners.get(type)?.delete(fn)
		}
	})
	const window = target(),
		document = target()
	Object.defineProperty(globalThis, 'window', { value: window, configurable: true })
	Object.defineProperty(globalThis, 'document', { value: document, configurable: true })
	Object.defineProperty(globalThis, 'Element', { value: Element, configurable: true })
	const send = (type, editable = false, extra = {}) => {
		const event = {
			defaultPrevented: false,
			cleared: false,
			composedPath: () => [new Element(editable)],
			preventDefault() {
				this.defaultPrevented = true
			},
			clipboardData: {
				clearData() {
					event.cleared = true
				}
			},
			...extra
		}
		for (const layer of [window, document]) for (const fn of layer.listeners.get(type) || []) fn(event)
		return event
	}
	try {
		run({ window, document, send })
	} finally {
		for (const [key, descriptor] of old) {
			if (descriptor) Object.defineProperty(globalThis, key, descriptor)
			else delete globalThis[key]
		}
	}
}
test('content copy guard survives removal of document listeners and fully disposes on unmount', () => {
	environment(({ window, document, send }) => {
		const { installContentProtection } = loadSource()('src/lib/content-protection.ts')
		const dispose = installContentProtection()
		assert.equal(send('copy').defaultPrevented, true)
		document.listeners.clear()
		const copy = send('copy')
		assert.equal(copy.defaultPrevented, true)
		assert.equal(copy.cleared, true)
		assert.equal(send('dragstart').defaultPrevented, true)
		dispose()
		assert.equal(send('copy').defaultPrevented, false)
		assert.ok([...window.listeners.values()].every(handlers => !handlers.size))
	})
})
test('search paste, editable selection and navigation shortcuts stay available', () => {
	environment(({ send }) => {
		const dispose = loadSource()('src/lib/content-protection.ts').installContentProtection()
		for (const event of ['copy', 'cut', 'contextmenu', 'selectstart']) assert.equal(send(event, true).defaultPrevented, false, event)
		assert.equal(send('paste', true).defaultPrevented, false)
		assert.equal(send('keydown', true, { ctrlKey: true, key: 'v' }).defaultPrevented, false)
		assert.equal(send('keydown', false, { ctrlKey: true, key: 'k' }).defaultPrevented, false)
		assert.equal(send('keydown', false, { ctrlKey: true, key: 'c' }).defaultPrevented, true)
		dispose()
	})
})
