const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadSource } = require('./helpers/load-source.cjs')

test('Pages publishes tracked public files and excludes local-only and untracked material', async () => {
	const fs = require('node:fs'), os = require('node:os'), path = require('node:path')
	const { execFileSync } = require('node:child_process')
	const { copyTrackedPublic } = await import('../scripts/pages-paths.mjs')
	const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pages-export-'))
	const root = path.join(temp, 'repo'), output = path.join(temp, 'out')
	try {
		fs.mkdirSync(path.join(root, 'public/local-model'), { recursive: true })
		fs.writeFileSync(path.join(root, '.gitignore'), '/public/local-model/\n')
		fs.writeFileSync(path.join(root, 'public/avatar.png'), 'tracked image')
		fs.writeFileSync(path.join(root, 'public/local-model/model.bin'), 'local-only model')
		fs.writeFileSync(path.join(root, 'public/private.pem'), 'untracked material')
		execFileSync('git', ['init', '-q'], { cwd: root })
		execFileSync('git', ['add', '.gitignore', 'public/avatar.png'], { cwd: root })
		assert.deepEqual(copyTrackedPublic(root, output), ['public/avatar.png'])
		assert.equal(fs.readFileSync(path.join(output, 'public/avatar.png'), 'utf8'), 'tracked image')
		assert.equal(fs.existsSync(path.join(output, 'public/local-model')), false)
		assert.equal(fs.existsSync(path.join(output, 'public/private.pem')), false)
	} finally {
		if (path.dirname(path.resolve(temp)) !== path.resolve(os.tmpdir()) || !path.basename(temp).startsWith('pages-export-')) throw Error('Unexpected fixture path')
		fs.rmSync(temp, { recursive: true, force: true })
	}
})

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
