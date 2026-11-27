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
