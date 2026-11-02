const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { loadSource } = require('./helpers/load-source.cjs')

test('knowledge catalog searches all words, excludes hidden content and uses existing route steps', () => {
	const load = loadSource()
	const { articles, searchArticles, readingRoutes, relatedArticles, articleHref } = load('src/features/discovery/catalog.ts')
	assert.ok(articles.length >= 200)
	assert.ok(articles.every(article => !article.hidden))
	assert.equal(searchArticles('mcp')[0].slug, 'lake-285420754')
	assert.equal(searchArticles('mcp')[0].title, 'MCP、Tool 与 Skill 的分工')
	assert.ok(searchArticles('mcp Goland').length > 0)
	assert.deepEqual(searchArticles('mcp nonexistent-keyword'), [])
	assert.equal(articleHref('a b'), '/blog/a%20b')
	assert.equal(readingRoutes.length, 4)
	for (const route of readingRoutes) {
		assert.equal(route.articles.length, route.slugs.length, route.id + ' has a missing step')
		assert.equal(new Set(route.slugs).size, route.slugs.length)
		for (const article of route.articles) {
			const config = require('../public/blogs/' + article.slug + '/config.json')
			assert.notEqual(config.source?.empty, true, 'reading routes must not recommend empty directory notes')
		}
	}
	assert.ok(relatedArticles(articles[0].slug).every(article => article.slug !== articles[0].slug))
})

test('reading import rejects corrupt state, prototype keys and invalid values without mutating source', () => {
	const { decodeReading, updateReading } = loadSource()('src/features/reading/model.ts')
	const before = decodeReading(null)
	const saved = updateReading(before, 'lake-285420754', 'MCP', { position: 0.4, progress: 0.7, bookmarked: true })
	assert.equal(Object.keys(before.entries).length, 0)
	assert.equal(decodeReading(JSON.stringify(saved)).entries['lake-285420754'].progress, 0.7)
	assert.throws(() => decodeReading('{'))
	assert.throws(() => decodeReading('{"version":1,"entries":{"__proto__":{}}}'))
	assert.throws(() => updateReading(saved, 'lake-285420754', 'MCP', { progress: 4 }))
	assert.throws(() => updateReading(saved, 'lake-285420754', 'MCP', { excerpts: [{ id: 'x', quote: '', note: '', offset: 0, createdAt: '' }] }))
})

test('browser reading writes retain other entries and maximum progress; bad data and quota errors never report saved', () => {
	const previousWindow = global.window
	let raw = null
	let blocked = false
	global.window = {
		localStorage: {
			getItem: () => raw,
			setItem: (_, value) => {
				if (blocked) throw Object.assign(new Error('full'), { name: 'QuotaExceededError' })
				raw = value
			},
			removeItem: () => {
				raw = null
			}
		}
	}
	try {
		const { saveReading, importReading } = loadSource()('src/features/reading/store.ts')
		assert.equal(saveReading('a', 'A', { progress: 0.8, position: 0.8 }), true)
		assert.equal(saveReading('b', 'B', { bookmarked: true }), true)
		assert.equal(saveReading('a', 'A', { progress: 0.2, position: 0.2 }), true)
		assert.equal(JSON.parse(raw).entries.a.progress, 0.8)
		assert.equal(JSON.parse(raw).entries.a.position, 0.2)
		assert.equal(JSON.parse(raw).entries.b.bookmarked, true)
		const good = raw
		blocked = true
		assert.equal(saveReading('b', 'B', { completed: true }), false)
		assert.equal(raw, good)
		blocked = false
		assert.throws(() => importReading('{"version":2}'))
		assert.equal(raw, good)
		raw = '{broken'
		assert.equal(saveReading('c', 'C', {}), false)
		assert.equal(raw, '{broken')
	} finally {
		global.window = previousWindow
	}
})

test('story chapters all refer to real local photos and preserve their original captions', () => {
	const { stories } = loadSource()('src/features/stories/model.ts')
	const original = require('../src/app/pictures/list.json')
	assert.equal(
		stories.reduce((count, story) => count + story.chapters.length, 0),
		original.length
	)
	for (const story of stories) {
		assert.equal(story.missing.length, 0)
		for (const chapter of story.chapters) {
			assert.ok(fs.statSync(path.join(__dirname, '../public', chapter.url)).size > 0)
			assert.equal(chapter.description, original.find(item => chapter.id.startsWith(item.id + ':')).description || '')
		}
	}
})
