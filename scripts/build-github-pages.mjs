import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { prefixPublicAssets, redirectDocument } from './pages-paths.mjs'
import { parseContributions, contributionSource } from '../src/features/github/contributions.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const basePath = '/17hwliao-blog'
const siteUrl = `https://17hwliao.github.io${basePath}`
const previewRoot = path.join(root, '.local-preview')
fs.mkdirSync(previewRoot, { recursive: true })
const workspace = fs.mkdtempSync(path.join(previewRoot, 'pages-build-'))
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const write = (relative, text) => {
	const target = path.join(workspace, relative)
	fs.mkdirSync(path.dirname(target), { recursive: true })
	fs.writeFileSync(target, text)
}
const posts = JSON.parse(read('public/blogs/index.json')).filter(post => !post.hidden)
const assetRoots = fs.readdirSync(path.join(root, 'public'), { withFileTypes: true })
	.filter(entry => !entry.name.startsWith('.'))
	.map(entry => ({ name: entry.name, directory: entry.isDirectory() }))
const textTypes = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.css', '.md', '.html', '.svg', '.txt', '.xml'])

// Build a separate copy: the live development checkout and its server stay intact.
for (const name of ['src', 'public', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'global.d.ts', 'postcss.config.mjs']) {
	if (fs.existsSync(path.join(root, name))) fs.cpSync(path.join(root, name), path.join(workspace, name), { recursive: true })
}
function rewriteTree(directory) {
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const filename = path.join(directory, entry.name)
		if (entry.isDirectory()) rewriteTree(filename)
		else if (textTypes.has(path.extname(filename))) {
			const text = fs.readFileSync(filename, 'utf8')
			const patched = prefixPublicAssets(text, basePath, assetRoots)
			if (patched !== text) fs.writeFileSync(filename, patched)
		}
	}
}
rewriteTree(path.join(workspace, 'src'))
rewriteTree(path.join(workspace, 'public'))

// GitHub Pages serves files only; no API handlers are exported.
fs.rmSync(path.join(workspace, 'src/app/api'), { recursive: true })
for (const [directory, key] of [['blog/[id]', 'id'], ['write/[slug]', 'slug']]) {
	const relative = `src/app/${directory}`
	fs.renameSync(path.join(workspace, relative, 'page.tsx'), path.join(workspace, relative, 'client-page.tsx'))
	write(`${relative}/page.tsx`, `import Page from './client-page'\nexport function generateStaticParams(){return ${JSON.stringify(posts.map(post => ({ [key]: post.slug })))}}\nexport default function StaticPage(){return <Page/>}\n`)
}
write('next.config.mjs', `export default {
 output:'export',basePath:${JSON.stringify(basePath)},trailingSlash:true,
 images:{unoptimized:true},devIndicators:false,reactCompiler:true,
 turbopack:{root:${JSON.stringify(root)},rules:{'*.svg':{loaders:['@svgr/webpack'],as:'*.js'}}}
}\n`)
// Reuse the native, already bundled viewer instead of a CDN-only model loader.
const live2d = path.join(workspace, 'src/app/live2d/page.tsx')
fs.writeFileSync(live2d, fs.readFileSync(live2d, 'utf8').replace("process.env.NODE_ENV === 'development' &&", 'true &&'))

const snapshotFile = 'public/data/github-contributions.json'
let contributions
try {
	const snapshot = await fetch(contributionSource, { signal: AbortSignal.timeout(12000) })
	if (!snapshot.ok) throw new Error(`Contribution snapshot failed: ${snapshot.status}`)
	contributions = parseContributions(await snapshot.json())
} catch (error) {
	// Reuse only a recent, real response from this site's existing Next fetch cache.
	const cache = path.join(root, '.next/cache/fetch-cache')
	if (fs.existsSync(cache)) for (const name of fs.readdirSync(cache)) {
		const filename = path.join(cache, name)
		if (Date.now() - fs.statSync(filename).mtimeMs > 7 * 86400000) continue
		try {
			const cached = JSON.parse(fs.readFileSync(filename, 'utf8')).data
			if (cached?.url === contributionSource && cached.status === 200) {
				contributions = parseContributions(JSON.parse(Buffer.from(cached.body, 'base64').toString('utf8')))
				console.warn('Using verified cached GitHub contribution response through', contributions.days.at(-1).date)
				break
			}
		} catch { /* Ignore unrelated or malformed cache entries. */ }
	}
	if (!contributions) throw error
}
write(snapshotFile, JSON.stringify(contributions))
const widget = path.join(workspace, 'src/features/github/contribution-widget.tsx')
fs.writeFileSync(widget, fs.readFileSync(widget, 'utf8')
	.replace("'/api/github/contributions'", `'${basePath}/data/github-contributions.json'`)
	.replace('公开贡献数据 · 约每小时更新 · 包含提交、PR 等活动', '公开贡献数据 · 静态构建时更新 · 包含提交、PR 等活动'))

const build = spawnSync(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build'], {
	cwd: workspace, stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_SITE_URL: siteUrl, SITE_URL: siteUrl, NEXT_PUBLIC_BASE_PATH: basePath }
})
if (build.status !== 0) process.exit(build.status || 1)
const output = path.join(workspace, 'out')
rewriteTree(output)
// Next 16 exports nested segment files on Windows, while its client requests
// dot-separated filenames. Supply the exact same payload at those URLs.
function flattenSegments(directory) {
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const filename = path.join(directory, entry.name)
		if (entry.isDirectory()) flattenSegments(filename)
		else if (entry.name.endsWith('.txt')) {
			const parts = path.relative(output, filename).split(path.sep)
			const index = parts.findIndex(part => part.startsWith('__next.'))
			if (index !== -1 && index < parts.length - 1) {
				fs.copyFileSync(filename, path.join(output, ...parts.slice(0, index), parts.slice(index).join('.')))
			}
		}
	}
}
flattenSegments(output)
// Cover URLs already carry the base path; RSS prepends the configured origin.
for (const name of ['rss.xml', 'sitemap.xml']) {
	const filename = path.join(output, name)
	if (fs.existsSync(filename)) fs.writeFileSync(filename, fs.readFileSync(filename, 'utf8').replaceAll(`${basePath}${basePath}/`, `${basePath}/`))
}
for (const [relative, target] of [['assistant', `${basePath}/?chat=1`], ['pictures/stories', `${basePath}/pictures/`], ['zh', `${basePath}/`], ['en', `${basePath}/`]]) {
	fs.mkdirSync(path.join(output, relative), { recursive: true })
	fs.writeFileSync(path.join(output, relative, 'index.html'), redirectDocument(target))
}
fs.writeFileSync(path.join(output, '.nojekyll'), '')
fs.writeFileSync(path.join(output, 'build-info.json'), JSON.stringify({ source: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim(), builtAt: new Date().toISOString(), basePath, articles: posts.length }))
fs.copyFileSync(path.join(root, 'LICENSE'), path.join(output, 'LICENSE'))
fs.copyFileSync(path.join(root, 'NOTICE'), path.join(output, 'NOTICE'))
fs.cpSync(path.join(root, 'LICENSES'), path.join(output, 'LICENSES'), { recursive: true })
fs.writeFileSync(path.join(previewRoot, 'pages-output.json'), JSON.stringify({ workspace, output, basePath, articles: posts.length }, null, 2))
console.log(JSON.stringify({ output, basePath, articles: posts.length }, null, 2))
