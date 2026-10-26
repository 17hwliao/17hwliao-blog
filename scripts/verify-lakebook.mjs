import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { marked } from 'marked'
import { htmlToDOM } from 'html-react-parser'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = async relative => JSON.parse(await readFile(path.join(root, relative), 'utf8'))
const sha256 = content => createHash('sha256').update(content).digest('hex')
const index = await readJson('public/blogs/index.json')
const manifest = await readJson('scripts/lakebook-import-manifest.json')
const report = await readJson('scripts/lakebook-import-report.json')
const textOf = node => node.type === 'text' ? node.data : (node.children || []).map(textOf).join('')
const codeOf = nodes => nodes.flatMap(node => node.name === 'pre' ? [textOf(node)] : codeOf(node.children || []))
let codeBlocks = 0
assert.equal(new Set(index.map(item => item.slug)).size, index.length, 'Duplicate article slugs')
assert.equal(Object.keys(manifest.documents).length, report.documents, 'Missing imported documents')
for (let i = 1; i < index.length; i++) {
	assert.ok(Date.parse(index[i - 1].date) >= Date.parse(index[i].date), 'Articles must be newest first')
}
for (const [slug, entry] of Object.entries(manifest.documents)) {
	const configBytes = await readFile(path.join(root, 'public/blogs', slug, 'config.json'))
	const markdownBytes = await readFile(path.join(root, 'public/blogs', slug, 'index.md'))
	assert.equal(sha256(configBytes), entry.configSha256, `${slug}: config changed after import`)
	assert.equal(sha256(markdownBytes), entry.publication?.markdownSha256 ?? entry.markdownSha256, `${slug}: markdown changed after import or recorded publication redaction`)
	const config = JSON.parse(configBytes)
	assert.equal(config.date, config.createdAt, `${slug}: original creation date must drive sorting`)
	assert.ok(Number.isFinite(Date.parse(config.date)), `${slug}: invalid date`)
	assert.ok(config.source.directory.length > 0, `${slug}: missing source directory`)
	const item = index.find(item => item.slug === slug)
	assert.ok(item, `${slug}: missing index entry`)
	for (const field of ['title', 'date', 'createdAt', 'updatedAt', 'contentUpdatedAt', 'publishedAt', 'firstPublishedAt', 'category']) {
		assert.equal(item[field], config[field], `${slug}: inconsistent ${field}`)
	}
	const html = await marked.parse(markdownBytes.toString('utf8'))
	const renderedCodeHashes = codeOf(htmlToDOM(html)).map(code => sha256(code.replace(/\r\n?/g, '\n').replace(/\n+$/, '')))
	assert.deepEqual(renderedCodeHashes, entry.publication?.codeSha256 ?? entry.sourceCodeSha256, `${slug}: code changed in conversion or recorded publication redaction`)
	codeBlocks += renderedCodeHashes.length
	for (const match of markdownBytes.toString('utf8').matchAll(/!\[[^\]]*\]\(<(\/blogs\/[^>]+)>\)/g)) {
		await readFile(path.join(root, 'public', match[1]))
	}
}
console.log(JSON.stringify({ articles: index.length, imported: report.documents, codeBlocksVerified: codeBlocks, order: 'newest-first', newest: report.newest, oldest: report.oldest }, null, 2))
