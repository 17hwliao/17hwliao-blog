const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadSource } = require('./helpers/load-source.cjs')
const silentToast = new Proxy({}, { get: () => () => 1 })
const article = (slug, category) => ({ slug, title: slug, tags: [], date: '2026-10-26T14:05', ...(category ? { category } : {}) })

test('imported README tables wrap bare rows without nesting existing table sections', () => {
	const { renderToStaticMarkup } = require('react-dom/server')
	const { ProjectReadme } = loadSource()('src/app/projects/components/project-readme.tsx')
	const source = {
		repository: 'https://github.com/example/project',
		branch: 'main',
		revision: 'abc',
		readmePath: 'README.md',
		logoPath: 'logo.png',
		importedAt: '',
		fork: false,
		parent: null,
		license: ''
	}
	for (const [markdown, bodies, rows] of [
		['<table><tr><td>A</td></tr>\n<tr><td>B</td></tr></table>', 1, 2],
		['<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>A</td></tr></tbody></table>', 1, 2],
		['<table><thead><tr><th>Header</th></tr></thead><tr><td>A</td></tr><tbody><tr><td>B</td></tr></tbody></table>', 2, 3]
	]) {
		const output = renderToStaticMarkup(ProjectReadme({ markdown, source, logo: '/logo.png' }))
		assert.equal((output.match(/<tbody>/g) || []).length, bodies)
		assert.equal((output.match(/<tr>/g) || []).length, rows)
		assert.doesNotMatch(output, /<table>\s*<tr>|<tbody>\s*<(?:thead|tbody)>/)
	}
})

test('real math and highlighted code survive the shared HTML-to-React boundary', async () => {
	const { renderToStaticMarkup } = require('react-dom/server')
	const load = loadSource()
	const { renderMarkdown } = load('src/lib/markdown-renderer.ts')
	const { parseMarkdownHtml } = load('src/lib/markdown-content.tsx')
	const markdown = '## Formula\n\n$x^2$\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n```js\nconsole.log(1)\n```'
	const { html } = await renderMarkdown(markdown)
	const output = renderToStaticMarkup(parseMarkdownHtml(html))
	assert.match(output, /class="katex"/)
	assert.match(output, /<math/)
	assert.match(output, /<table/)
	assert.match(output, /code-block-copy-btn/)
	assert.equal((output.match(/<pre/g) || []).length, 1)
})

test('index read errors and corrupt data cannot produce a replacement index', async () => {
	for (const outcome of [new Error('network unavailable'), '{broken', '{}', '[{"title":"missing slug"}]']) {
		const load = loadSource({
			'@/lib/github-client': {
				readTextFileFromRepo: async () => {
					if (outcome instanceof Error) throw outcome
					return outcome
				}
			}
		})
		await assert.rejects(load('src/lib/blog-index.ts').prepareBlogsIndex('token', 'owner', 'repo', article('new'), 'main'))
	}
})

test('archive edits retain new and hidden remote posts and update article category atomically', async () => {
	const remote = [article('old'), article('new'), { ...article('hidden'), hidden: true }]
	let prepared
	const load = loadSource({
		sonner: { toast: silentToast },
		'@/lib/github-commit': {
			fileTreeItem: (path, sha) => ({ path, sha }),
			commitFiles: async options => {
				prepared = await options.prepare({
					token: 't',
					owner: 'o',
					repo: 'r',
					branch: 'main',
					baseCommit: 'snapshot',
					blobFromJson: async data => JSON.stringify(data)
				})
			}
		},
		'@/lib/github-client': {
			readTextFileFromRepo: async (_t, _o, _r, path, ref) => {
				assert.equal(ref, 'snapshot')
				return JSON.stringify(path.endsWith('index.json') ? remote : { ...article('old'), source: { book: 'preserved' } })
			},
			listRepoFilesRecursive: async () => []
		}
	})
	await load('src/app/blog/services/save-blog-edits.ts').saveBlogEdits([article('old')], [article('old', '学习')], ['学习'])
	const saved = JSON.parse(prepared.treeItems.find(item => item.path === 'public/blogs/index.json').sha)
	assert.deepEqual(saved.map(item => item.slug).sort(), ['hidden', 'new', 'old'])
	assert.equal(saved.find(item => item.slug === 'old').category, '学习')
	const config = JSON.parse(prepared.treeItems.find(item => item.path === 'public/blogs/old/config.json').sha)
	assert.equal(config.category, '学习')
	assert.equal(config.source.book, 'preserved')
})

test('configuration load failure is not an empty valid configuration', async () => {
	const originalFetch = global.fetch
	global.fetch = async url => (url.endsWith('config.json') ? new Response('{}', { status: 503 }) : new Response('body'))
	try {
		await assert.rejects(loadSource()('src/lib/load-blog.ts').loadBlog('post'))
	} finally {
		global.fetch = originalFetch
	}
})

test('the last selected article owns the editor; a failed load has an explicit error', async () => {
	let resolveA
	const load = loadSource({
		sonner: { toast: silentToast },
		'@/lib/load-blog': {
			loadBlog: async slug => {
				if (slug === 'a') return new Promise(resolve => (resolveA = resolve))
				if (slug === 'missing') throw new Error('Blog not found')
				return { config: { title: slug }, markdown: slug }
			}
		}
	})
	const store = load('src/app/write/stores/write-store.ts').useWriteStore
	const first = store.getState().loadBlogForEdit('a')
	await store.getState().loadBlogForEdit('b')
	resolveA({ config: { title: 'a' }, markdown: 'a' })
	await first
	assert.equal(store.getState().originalSlug, 'b')
	await assert.rejects(store.getState().loadBlogForEdit('missing'))
	assert.ok(store.getState().loadError)
})

test('parallel markdown renders keep code, nested code and math scoped to each document', async () => {
	const load = loadSource({
		shiki: {
			codeToHtml: async text => {
				await new Promise(r => setImmediate(r))
				return '<pre><code>' + text + '</code></pre>'
			}
		},
		katex: { renderToString: () => '<span class="katex">formula</span>' }
	})
	const { renderMarkdown } = load('src/lib/markdown-renderer.ts')
	const [a, b] = await Promise.all([renderMarkdown('```text\nalpha\n```\n\n> ```text\n> nested\n> ```\n\n$x$'), renderMarkdown('```text\nbeta\n```\n\n$y$')])
	assert.ok(a.html.includes('alpha') && !a.html.includes('beta'))
	assert.ok(a.html.includes('data-code="nested"'))
	assert.ok(b.html.includes('beta') && !b.html.includes('alpha'))
	assert.ok(a.html.includes('katex') && b.html.includes('katex'))
})

test('project persistence returns public image URLs and rejects missing upload material', async () => {
	const load = loadSource({
		sonner: { toast: silentToast },
		'@/lib/github-commit': {
			commitFiles: async options => (await options.prepare({ blobFromJson: async data => JSON.stringify(data) })).result,
			addHashedImage: async () => ({ publicPath: '/images/project/logo.png', treeItem: { path: 'image', sha: 'image' } }),
			fileTreeItem: (path, sha) => ({ path, sha })
		}
	})
	const { pushProjects } = load('src/app/projects/services/push-projects.ts')
	const project = { name: 'test', url: 'https://example.com', image: 'blob:preview', year: 2026, tags: [], description: 'test' }
	const result = await pushProjects({ projects: [project], imageItems: new Map([[project.url, { type: 'file', file: {} }]]) })
	assert.equal(result[0].image, '/images/project/logo.png')
	await assert.rejects(pushProjects({ projects: [project] }))
})

test('Markdown blocks active frames, objects and unsafe URLs while retaining math, tables and exact copy text', async () => {
	const React = require('react')
	const { renderToStaticMarkup } = require('react-dom/server')
	const load = loadSource()
	const { parseMarkdownHtml } = load('src/lib/markdown-content.tsx')
	const html = renderToStaticMarkup(
		parseMarkdownHtml(
			'<iframe srcdoc="&lt;script&gt;bad()&lt;/script&gt;"></iframe><object data="https://example.com"></object><a href="java&#x09;script:bad()" onclick="bad()">unsafe</a><a href="https://example.com" target="_blank">safe</a><svg><foreignObject><iframe src="https://example.com"></iframe></foreignObject></svg><table><tr><td>cell</td></tr></table><math><mi>x</mi></math><input type="checkbox" checked><img src="data:text/html,bad" alt="blocked">'
		)
	)
	assert.doesNotMatch(html, /iframe|srcdoc|<object|javascript:|onclick|foreignObject/i)
	assert.match(html, /<table>/)
	assert.match(html, /<math>/)
	assert.match(html, /disabled/)
	assert.match(html, /noopener noreferrer/)
	assert.equal(load('src/lib/markdown-content.tsx').safeContentUrl('data:text/html,bad', true), undefined)
	const md = loadSource({ shiki: { codeToHtml: async () => '<pre class="shiki"><code>highlighted</code></pre>' }, katex: { renderToString: () => '' } })(
		'src/lib/markdown-renderer.ts'
	)
	const source = 'console.log("$&", "$`", "__CODE_BLOCK_0__", "<tag>&");'
	const rendered = await md.renderMarkdown('```js\n' + source + '\n```')
	let copied
	const inspect = loadSource({
		'@/components/code-block': {
			CodeBlock: props => {
				copied = props.code
				return React.createElement('div', null, props.children)
			}
		}
	})('src/lib/markdown-content.tsx')
	renderToStaticMarkup(inspect.parseMarkdownHtml(rendered.html))
	assert.equal(copied, source)
	assert.equal((rendered.html.match(/<pre/g) || []).length, 1)
})

test('hidden posts stay out of RSS/sitemap and summaries cannot close CDATA', async () => {
	const index = [article('visible'), { ...article('hidden'), hidden: true }, { ...article('special'), summary: 'a ]]> b' }]
	const load = loadSource({
		'@/../public/blogs/index.json': index,
		'@/lib/site-url': { SITE_ORIGIN: 'https://example.com' },
		'@/config/site-content.json': { meta: { title: 'blog', description: 'summary' } }
	})
	const rss = await load('src/app/rss.xml/route.ts').GET().text()
	assert.ok(rss.includes('/blog/visible') && !rss.includes('/blog/hidden'))
	assert.ok(rss.includes(']]]]><![CDATA[>'))
	const entries = await load('src/app/sitemap.ts').default()
	assert.ok(!entries.some(entry => entry.url.endsWith('/blog/hidden')))
})

test('publish refuses unsafe paths, existing slugs, and stale edits before uploading content', async () => {
	const make = (config, markdown = 'remote') =>
		loadSource({
			sonner: { toast: silentToast },
			'@/lib/github-client': { readTextFileFromRepo: async (_t, _o, _r, path) => (path.endsWith('config.json') ? config : markdown) },
			'@/lib/github-commit': {
				commitFiles: async options =>
					options.prepare({
						baseCommit: 'snapshot',
						blobFromText: async () => {
							throw new Error('must not upload')
						}
					})
			}
		})('src/app/write/services/push-blog.ts')
	const form = { slug: 'existing', title: 'post', tags: [], md: 'draft' }
	await assert.rejects(make('{}').pushBlog({ form }), /已存在/)
	for (const slug of ['../escape', 'a/b', 'a\\b', '..', ' slug', 'x%2fy', 'x?y']) await assert.rejects(make(null).pushBlog({ form: { ...form, slug } }), /路径/)
	await assert.rejects(
		make('{"title":"changed"}').pushBlog({ form: { ...form, originalConfig: { title: 'old' } }, mode: 'edit', originalSlug: 'existing' }),
		/配置已在远程变化/
	)
	await assert.rejects(
		make('{"title":"old"}').pushBlog({ form: { ...form, originalConfig: { title: 'old' }, originalMarkdown: 'old' }, mode: 'edit', originalSlug: 'existing' }),
		/正文已在远程变化/
	)
})

test('commit guard blocks simultaneous writes and verifies a lost final acknowledgement without replay', async () => {
	let release
	let reads = 0,
		writes = 0
	const load = loadSource({
		sonner: { toast: silentToast },
		'@/hooks/use-auth': { useAuthStore: { getState: () => ({ getAuthToken: async () => 'test-token' }) } },
		'@/lib/github-client': {
			getRef: async () => ({ sha: reads++ ? 'new-commit' : 'parent' }),
			createTree: async () => ({ sha: 'tree' }),
			createCommit: async () => ({ sha: 'new-commit' }),
			updateRef: async () => {
				writes++
				throw new Error('Response lost')
			}
		}
	})
	const { commitFiles } = load('src/lib/github-commit.ts')
	const first = commitFiles({
		message: 'test',
		prepare: async ctx => {
			assert.equal(ctx.baseCommit, 'parent')
			await new Promise(resolve => (release = resolve))
			return { treeItems: [], result: 'saved' }
		}
	})
	await new Promise(resolve => setImmediate(resolve))
	await assert.rejects(commitFiles({ message: 'duplicate', prepare: async () => ({ treeItems: [] }) }), /正在提交/)
	release()
	assert.equal(await first, 'saved')
	assert.equal(writes, 1)
	assert.equal(reads, 2)
})

test('equal bytes under different image suffixes each receive their referenced blob path', async () => {
	const { addHashedImage } = loadSource({
		sonner: { toast: silentToast },
		'@/hooks/use-auth': {},
		'@/lib/github-client': {},
		'@/lib/file-utils': { hashFileSHA256: async () => 'same', fileToBase64NoPrefix: async () => 'bytes' }
	})('src/lib/github-commit.ts')
	let uploads = 0
	const ctx = { blobFromBase64: async () => String(++uploads) }
	const seen = new Set()
	const a = await addHashedImage(ctx, { name: 'image.png' }, 'images/project', seen)
	const b = await addHashedImage(ctx, { name: 'image.jpg' }, 'images/project', seen)
	assert.ok(a.treeItem && b.treeItem)
	assert.equal(uploads, 2)
	assert.equal((await addHashedImage(ctx, { name: 'again.png' }, 'images/project', seen)).treeItem, null)
})

test('category failures are explicit and concurrent remote categories are not replaced by an old list', async () => {
	let fetchCategories
	const { useCategories } = loadSource({
		swr: (_key, fetcher) => {
			fetchCategories = fetcher
			return {}
		}
	})('src/hooks/use-categories.ts')
	useCategories()
	const originalFetch = global.fetch
	try {
		global.fetch = async () => new Response('{}', { status: 503 })
		await assert.rejects(fetchCategories('/blogs/categories.json'), /分类加载失败/)
		global.fetch = async () => new Response('{}')
		await assert.rejects(fetchCategories('/blogs/categories.json'), /格式错误/)
	} finally {
		global.fetch = originalFetch
	}
	let prepared
	const load = loadSource({
		sonner: { toast: silentToast },
		'@/lib/github-commit': {
			fileTreeItem: (path, sha) => ({ path, sha }),
			commitFiles: async options => {
				prepared = await options.prepare({ baseCommit: 'snapshot', blobFromJson: async data => JSON.stringify(data) })
			}
		},
		'@/lib/github-client': {
			readTextFileFromRepo: async (_t, _o, _r, path) => JSON.stringify(path.endsWith('index.json') ? [article('old')] : { categories: ['学习', '新增'] }),
			listRepoFilesRecursive: async () => []
		}
	})
	const { saveBlogEdits } = load('src/app/blog/services/save-blog-edits.ts')
	await saveBlogEdits([article('old')], [article('old')], ['学习'], ['学习'])
	assert.deepEqual(JSON.parse(prepared.treeItems.find(item => item.path.endsWith('categories.json')).sha).categories, ['学习', '新增'])
	await assert.rejects(saveBlogEdits([article('old')], [article('old')], ['生活'], ['学习']), /分类已在远程变化/)
})

test('external project entries do not generate nonexistent detail pages', () => {
	const { hasProjectDetail } = loadSource()('src/app/projects/types.ts')
	assert.equal(hasProjectDetail({ url: 'https://example.com' }), false)
	assert.equal(hasProjectDetail({ slug: '../escape', url: '/projects/../escape' }), false)
	assert.equal(hasProjectDetail({ slug: 'local', url: '/projects/local' }), true)
})

test('album persistence returns uploaded paths for subsequent saves', async () => {
	const load = loadSource({
		sonner: { toast: silentToast },
		'@/lib/github-client': { readTextFileFromRepo: async () => '[]' },
		'@/lib/github-commit': {
			commitFiles: async options => (await options.prepare({ baseCommit: 'snapshot', blobFromJson: async data => JSON.stringify(data) })).result,
			addHashedImage: async () => ({ publicPath: '/images/pictures/photo.png', treeItem: { path: 'image', sha: 'image' } }),
			fileTreeItem: (path, sha) => ({ path, sha })
		}
	})
	const { pushPictures } = load('src/app/pictures/services/push-pictures.ts')
	const picture = { id: 'group', uploadedAt: '2026-10-27', images: ['blob:preview'] }
	const saved = await pushPictures({ pictures: [picture], imageItems: new Map([['group::0', { type: 'file', file: {} }]]) })
	assert.deepEqual(saved[0].images, ['/images/pictures/photo.png'])
	await assert.rejects(pushPictures({ pictures: [picture] }), /缺少上传文件/)
})
