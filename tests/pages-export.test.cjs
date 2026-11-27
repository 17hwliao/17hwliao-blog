const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadSource } = require('./helpers/load-source.cjs')

test('transition router removes the Pages prefix exactly once, at a path boundary', () => {
	const { appPath } = loadSource()('src/lib/base-path.ts')
	assert.equal(appPath('/17hwliao-blog/blog/', '/17hwliao-blog'), '/blog/')
	assert.equal(appPath('/17hwliao-blog', '/17hwliao-blog'), '/')
	assert.equal(appPath('/17hwliao-blogger/blog', '/17hwliao-blog'), '/17hwliao-blogger/blog')
	assert.equal(appPath('/blog/', '/17hwliao-blog'), '/blog/')
	assert.equal(appPath('/blog/', ''), '/blog/')
})

test('Pages asset prefix keeps routes, external URLs and already prefixed paths intact', async () => {
	const { prefixPublicAssets } = await import('../scripts/pages-paths.mjs')
	const roots = [{ name: 'stw', directory: true }, { name: 'images', directory: true }, { name: 'favicon.png', directory: false }]
	const source = `href='/stw' src='/stw/world.json' url(/images/a.png) src="/favicon.png?v=2" https://example.com/images/a.png '/17hwliao-blog/images/a.png' href='/blog/a'`
	const actual = prefixPublicAssets(source, '/17hwliao-blog', roots)
	assert.equal(actual, `href='/stw' src='/17hwliao-blog/stw/world.json' url(/17hwliao-blog/images/a.png) src="/17hwliao-blog/favicon.png?v=2" https://example.com/images/a.png '/17hwliao-blog/images/a.png' href='/blog/a'`)
	assert.equal(prefixPublicAssets(actual, '/17hwliao-blog', roots), actual)
})

test('Pages redirect escapes its target in both navigation and fallback link', async () => {
	const { redirectDocument } = await import('../scripts/pages-paths.mjs')
	const html = redirectDocument('/17hwliao-blog/?chat=1&x="<')
	assert.ok(html.includes('content="0;url=/17hwliao-blog/?chat=1&amp;x=&quot;&lt;"'))
	assert.ok(html.includes('href="/17hwliao-blog/?chat=1&amp;x=&quot;&lt;"'))
})
