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

test('Pages publication stages only exported files without changing the source index or branch', async () => {
	const fs = require('node:fs'), os = require('node:os'), path = require('node:path')
	const { execFileSync } = require('node:child_process')
	const { writePagesTree } = await import('../scripts/pages-publish.mjs')
	const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pages-publish-test-'))
	try {
		const repository = path.join(temp, 'repo'), output = path.join(temp, 'out')
		fs.mkdirSync(repository)
		fs.mkdirSync(output)
		const git = (...args) => execFileSync('git', args, { cwd: repository, encoding: 'utf8', windowsHide: true }).trim()
		git('init', '-q', '-b', 'main')
		fs.writeFileSync(path.join(repository, 'source.txt'), 'keep source staged')
		git('add', 'source.txt')
		const before = fs.readFileSync(path.join(repository, '.git/index'))
		fs.writeFileSync(path.join(output, '.nojekyll'), '')
		fs.writeFileSync(path.join(output, 'index.html'), '<h1>Published</h1>')
		fs.mkdirSync(path.join(output, 'blogs'))
		fs.writeFileSync(path.join(output, 'blogs/index.json'), '[]')
		const tree = writePagesTree(repository, output, path.join(temp, 'separate-index'))
		assert.deepEqual(git('ls-tree', '-r', '--name-only', tree).split('\n'), ['.nojekyll', 'blogs/index.json', 'index.html'])
		assert.deepEqual(fs.readFileSync(path.join(repository, '.git/index')), before)
		assert.equal(git('branch', '--show-current'), 'main')
		assert.equal(fs.readFileSync(path.join(repository, 'source.txt'), 'utf8'), 'keep source staged')
	} finally {
		if (path.dirname(path.resolve(temp)) !== path.resolve(os.tmpdir()) || !path.basename(temp).startsWith('pages-publish-test-')) throw Error('Unexpected fixture path')
		fs.rmSync(temp, { recursive: true, force: true })
	}
})

test('Pages publication rejects stale output, missing article pages and missing local article images', async () => {
	const fs = require('node:fs'), os = require('node:os'), path = require('node:path')
	const { validatePagesOutput } = await import('../scripts/pages-publish.mjs')
	const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pages-output-test-'))
	const write = (relative, text) => {
		const filename = path.join(temp, relative)
		fs.mkdirSync(path.dirname(filename), { recursive: true })
		fs.writeFileSync(filename, text)
	}
	try {
		write('build-info.json', JSON.stringify({ source: 'intended', basePath: '/17hwliao-blog', articles: 1 }))
		write('index.html', '<h1>Blog</h1>')
		write('.nojekyll', '')
		write('blogs/index.json', JSON.stringify([{ slug: 'new-article' }]))
		write('blogs/new-article/config.json', '{}')
		write('blogs/new-article/index.md', '![diagram](/17hwliao-blog/blogs/new-article/images/01.png)')
		assert.throws(() => validatePagesOutput(temp, 'other'), /source commit/)
		assert.throws(() => validatePagesOutput(temp, 'intended'), /ENOENT/)
		write('blog/new-article/index.html', '<h1>New article</h1>')
		assert.throws(() => validatePagesOutput(temp, 'intended'), /Missing static article image/)
		write('blogs/new-article/images/01.png', 'image')
		assert.equal(validatePagesOutput(temp, 'intended').articles, 1)
	} finally {
		if (path.dirname(path.resolve(temp)) !== path.resolve(os.tmpdir()) || !path.basename(temp).startsWith('pages-output-test-')) throw Error('Unexpected fixture path')
		fs.rmSync(temp, { recursive: true, force: true })
	}
})
