import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

export function validatePagesOutput(output, source) {
	const read = relative => fs.readFileSync(path.join(output, relative), 'utf8')
	const info = JSON.parse(read('build-info.json'))
	if (info.source !== source || info.basePath !== '/17hwliao-blog') throw new Error('Static output does not match the intended source commit and base path')
	for (const file of ['index.html', '.nojekyll']) read(file)
	const posts = JSON.parse(read('blogs/index.json')).filter(post => !post.hidden)
	if (!posts.length || posts.length !== info.articles) throw new Error('Static article index is incomplete')
	for (const post of posts) {
		if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(post.slug)) throw new Error('Invalid article slug in static output')
		read(`blog/${post.slug}/index.html`)
		read(`blogs/${post.slug}/config.json`)
		const markdown = read(`blogs/${post.slug}/index.md`)
		for (const match of markdown.matchAll(/!\[[^\]]*\]\((\/17hwliao-blog\/[^)\s]+)\)/g)) {
			const url = new URL(match[1], 'https://17hwliao.github.io')
			const relative = decodeURIComponent(url.pathname).slice(info.basePath.length + 1)
			const filename = path.resolve(output, relative)
			if (!filename.startsWith(path.resolve(output) + path.sep) || !fs.existsSync(filename)) throw new Error(`Missing static article image: ${post.slug}`)
		}
	}
	return info
}

// Use a separate index: never switch branches or change the source checkout's staging area.
export function writePagesTree(repository, output, indexFile) {
	const gitDir = execFileSync('git', ['rev-parse', '--absolute-git-dir'], { cwd: repository, encoding: 'utf8', windowsHide: true }).trim()
	const options = { cwd: output, encoding: 'utf8', windowsHide: true, env: { ...process.env, GIT_INDEX_FILE: indexFile } }
	const args = ['--git-dir', gitDir, '--work-tree', output]
	execFileSync('git', [...args, 'add', '--all', '--force', '--', '.'], options)
	return execFileSync('git', [...args, 'write-tree'], options).trim()
}
