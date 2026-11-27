import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { validatePagesOutput, writePagesTree } from './pages-publish.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const previewRoot = path.join(root, '.local-preview')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true }).trim()

function main() {
	if (process.argv.length > 2) throw new Error('Usage: npm run publish:pages')
	if (git('status', '--porcelain')) throw new Error('Commit the intended source changes first; the working tree must be clean')
	if (git('branch', '--show-current') !== 'main') throw new Error('Publish only from main')
	const remote = git('remote', 'get-url', 'origin')
	if (!/github\.com[/:]17hwliao\/17hwliao-blog(?:\.git)?$/i.test(remote)) throw new Error('Unexpected publication repository')
	const source = git('rev-parse', 'HEAD')
	const remoteMain = git('ls-remote', 'origin', 'refs/heads/main').split(/\s/)[0]
	if (source !== remoteMain) throw new Error('Push the source commit to origin/main before syncing Pages')
	git('fetch', '--no-tags', 'origin', 'gh-pages')
	const parent = git('rev-parse', 'FETCH_HEAD')
	const prior = JSON.parse(git('show', `${parent}:build-info.json`))
	if (prior.source === source) {
		console.log(`GitHub Pages already matches ${source}; no build or commit needed.`)
		return
	}
	execFileSync(process.execPath, [path.join(root, 'scripts/build-github-pages.mjs')], { cwd: root, stdio: 'inherit', windowsHide: true })
	const result = JSON.parse(fs.readFileSync(path.join(previewRoot, 'pages-output.json'), 'utf8'))
	const relative = path.relative(previewRoot, result.output)
	if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Build output must be inside .local-preview')
	const info = validatePagesOutput(result.output, source)
	if (git('status', '--porcelain') || git('rev-parse', 'HEAD') !== source) throw new Error('Source changed during build; publication stopped')
	const scratch = fs.mkdtempSync(path.join(previewRoot, 'pages-publish-'))
	const tree = writePagesTree(root, result.output, path.join(scratch, 'index'))
	const commit = git('commit-tree', tree, '-p', parent, '-m', `Publish static blog from ${source.slice(0, 7)} (${info.articles} articles)`)
	const receipt = { source, parent, commit, articles: info.articles, output: result.output, pushed: false }
	const receiptFile = path.join(previewRoot, 'pages-publication.json')
	fs.writeFileSync(receiptFile, JSON.stringify(receipt, null, 2))
	// An ordinary fast-forward push rejects concurrent updates; never overwrite them.
	git('push', 'origin', `${commit}:refs/heads/gh-pages`)
	receipt.pushed = true
	fs.writeFileSync(receiptFile, JSON.stringify(receipt, null, 2))
	console.log(JSON.stringify({ ...receipt, url: 'https://17hwliao.github.io/17hwliao-blog/' }, null, 2))
}

try { main() } catch (error) { console.error(error.message); process.exitCode = 1 }
