const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { loadSource } = require('./helpers/load-source.cjs')

test('article catalog searches all words and excludes hidden content', () => {
	const load = loadSource()
	const { articles, searchArticles, relatedArticles, articleHref } = load('src/features/discovery/catalog.ts')
	assert.ok(articles.length >= 200)
	assert.ok(articles.every(article => !article.hidden))
	assert.equal(searchArticles('mcp')[0].slug, 'lake-285420754')
	assert.equal(searchArticles('mcp')[0].title, 'MCP、Tool 与 Skill 的分工')
	assert.ok(searchArticles('mcp Goland').length > 0)
	assert.deepEqual(searchArticles('mcp nonexistent-keyword'), [])
	assert.equal(articleHref('a b'), '/blog/a%20b')
	assert.ok(relatedArticles(articles[0].slug).every(article => article.slug !== articles[0].slug))
})

test('story chapters all refer to real local photos and preserve their original captions', () => {
	const { stories } = loadSource()('src/features/stories/model.ts')
	const original = require('../src/app/pictures/list.json')
	assert.equal(
		stories.reduce((count, story) => count + story.chapters.length, 0),
		original.reduce((count, picture) => count + (picture.images?.length || (picture.image ? 1 : 0)), 0)
	)
	for (const story of stories) {
		assert.equal(story.missing.length, 0)
		for (const chapter of story.chapters) {
			assert.ok(fs.statSync(path.join(__dirname, '../public', chapter.url)).size > 0)
			assert.equal(chapter.description, original.find(item => chapter.id.startsWith(item.id + ':')).description || '')
		}
	}
})
