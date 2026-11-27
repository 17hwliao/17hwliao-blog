import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

// A local preview may contain private or unlicensed, ignored model resources.
// Publish only the public assets selected for the source repository.
export function copyTrackedPublic(root, destination) {
	const files = execFileSync('git', ['ls-files', '-z', '--', 'public'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)
	for (const relative of files) {
		const target = path.join(destination, relative)
		fs.mkdirSync(path.dirname(target), { recursive: true })
		fs.copyFileSync(path.join(root, relative), target)
	}
	return files
}

// Rewrite only public asset roots, leaving Next router paths and remote URLs alone.
export function prefixPublicAssets(text, basePath, roots) {
	const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	// Directory names can also be routes (/stw, /live2d): only match their children.
	const patterns = roots.map(({ name, directory }) => `${escape(name)}${directory ? '(?=/)' : '(?=[?"\'`\\s)>]|$)'}`)
	return text.replace(new RegExp('(["\'`(=])/(' + patterns.join('|') + ')', 'g'), (_, lead, root) => `${lead}${basePath}/${root}`)
}

export function redirectDocument(target) {
	const safe = target.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
	return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${safe}"><title>正在跳转</title><a href="${safe}">继续访问</a></html>`
}
