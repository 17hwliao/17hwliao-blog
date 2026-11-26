const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { loadSource } = require('./helpers/load-source.cjs')

test('bento appearance bootstraps style, accent, border mode and theme before paint', () => {
	const { themeBootstrap, themeKey, bentoStyleKey, bentoAccentKey, bentoBorderKey, parseBentoStyle, parseBentoAccent, parseBentoBorder } =
		loadSource()('src/features/appearance/theme-model.ts')

	assert.equal(parseBentoStyle('glass'), 'glass')
	assert.equal(parseBentoStyle('neon'), 'neon')
	assert.equal(parseBentoStyle('paper'), 'paper')
	assert.equal(parseBentoStyle('sharp'), 'sharp')
	assert.equal(parseBentoStyle('default'), 'default')
	assert.equal(parseBentoStyle('unknown'), 'neon')
	assert.equal(parseBentoStyle(null), 'neon')

	assert.equal(parseBentoAccent('red'), 'red')
	assert.equal(parseBentoAccent('invalid'), 'red')
	assert.equal(parseBentoAccent(null), 'red')
	assert.equal(parseBentoAccent('yellow'), 'orange')
	assert.equal(parseBentoBorder('custom'), 'custom')
	assert.equal(parseBentoBorder('invalid'), 'custom')

	const store = new Map([
		[themeKey, 'dark'],
		[bentoStyleKey, 'neon'],
		[bentoAccentKey, 'purple'],
		[bentoBorderKey, 'normal']
	])
	const dataset = {}
	vm.runInNewContext(themeBootstrap, {
		document: { documentElement: { dataset } },
		localStorage: { getItem: key => store.get(key) ?? null },
		matchMedia: () => ({ matches: false })
	})
	assert.equal(dataset.theme, 'dark')
	assert.equal(dataset.themePreference, 'dark')
	assert.equal(dataset.bentoStyle, 'neon')
	assert.equal(dataset.bentoAccent, 'red')
	assert.equal(dataset.bentoBorder, 'custom')

	for (const denied of [false, true]) {
		const fresh = {}
		vm.runInNewContext(themeBootstrap, {
			document: { documentElement: { dataset: fresh } },
			localStorage: {
				getItem: () => {
					if (denied) throw new Error('denied')
					return null
				}
			},
			matchMedia: () => ({ matches: false })
		})
		assert.equal(fresh.theme, 'dark')
		assert.equal(fresh.bentoAccent, 'red')
		assert.equal(fresh.bentoStyle, 'neon')
		assert.equal(fresh.bentoBorder, 'custom')
	}
})

test('sound synthesizer defines CHIME, HEARTBEAT, CARD_HOVER and respects mute storage', () => {
	const prevWindow = global.window
	const prevStorage = global.localStorage
	const map = new Map()
	const storage = {
		getItem: k => (map.has(k) ? map.get(k) : null),
		setItem: (k, v) => map.set(k, String(v))
	}
	global.localStorage = storage
	global.window = {
		localStorage: storage,
		dispatchEvent() {
			return true
		}
	}
	global.CustomEvent =
		global.CustomEvent ||
		class CustomEvent {
			constructor(type, init) {
				this.type = type
				this.detail = init?.detail
			}
		}

	try {
		const { CHIME, HEARTBEAT, CARD_HOVER, ZENBOT_CHIRP, isSoundEnabled, setSoundEnabled } = loadSource()('src/lib/sound.ts')
		assert.equal(CHIME.length, 3)
		assert.equal(HEARTBEAT.length, 2)
		assert.equal(CARD_HOVER.length, 1)
		assert.equal(ZENBOT_CHIRP.length, 2)
		assert.equal(isSoundEnabled(), true)
		setSoundEnabled(false)
		assert.equal(isSoundEnabled(), false)
		setSoundEnabled(true)
		assert.equal(isSoundEnabled(), true)
	} finally {
		global.window = prevWindow
		global.localStorage = prevStorage
	}
})

test('Zenbot pageGuide maps routes including home, guestbook, articles and projects while blocking unsafe paths', () => {
	const { pageGuide, resolvePageContext } = loadSource()('src/features/assistant/page-guide.ts')
	assert.match(pageGuide('/').title, /Zenbot/)
	assert.ok(pageGuide('/').choices.length >= 4)
	assert.equal(pageGuide('/guestbook').title, '欢迎来留言板')
	assert.equal(pageGuide('/blog/go-gc-tricolor-marking').title, '陪你读一会儿')
	assert.equal(pageGuide('/projects/agentmesh').title, '聊聊 AgentMesh')
	assert.match(pageGuide('/projects/zenix').choices.find(c => c.id === 'zenbot').text, /Zenbot/)
	assert.equal(resolvePageContext('/guestbook?x=1'), null)
	assert.equal(resolvePageContext('//evil.example'), null)
})

test('Zenbot 18-part WebGL rig assets and 19 expressions exist and are non-empty in public/characters/zenbot', () => {
	const rigDir = path.join(__dirname, '../public/characters/zenbot/rig')
	const manifest = JSON.parse(fs.readFileSync(path.join(rigDir, 'manifest.json'), 'utf8'))
	assert.equal(manifest.parts.length, 18)
	assert.equal(Object.keys(manifest.expressions).length, 19)

	for (const part of manifest.parts) {
		const full = path.join(rigDir, part.file)
		assert.ok(fs.existsSync(full), `missing rig part: ${part.file}`)
		assert.ok(fs.statSync(full).size > 0, `empty rig part: ${part.file}`)
	}
	for (const expr of Object.values(manifest.expressions)) {
		const full = path.join(rigDir, expr.file)
		assert.ok(fs.existsSync(full), `missing rig expression: ${expr.file}`)
		assert.ok(fs.statSync(full).size > 0, `empty rig expression: ${expr.file}`)
	}
})
