// Drop copy-button captions left by imported notes, only immediately before a
// fence. Captions inside literal code and ordinary prose are preserved.
export function stripImportedCopyLabels(markdown: string) {
	const lines = markdown.split('\n')
	let fence: { marker: string; length: number } | null = null
	return lines
		.filter((line, index) => {
			const delimiter = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/)
			if (fence) {
				if (delimiter && delimiter[1][0] === fence.marker && delimiter[1].length >= fence.length && !delimiter[2].trim()) fence = null
				return true
			}
			if (delimiter) {
				fence = { marker: delimiter[1][0], length: delimiter[1].length }
				return true
			}
			const caption = line.replace(/[\s*]/g, '')
			if (
				!/^(?:(?:go|java|bash|shell|javascript|typescript|html|xml|yaml|json|sql|vue|nginx|text|css|powershell|python|c\+\+|c|vimscript|protocolbuffers))?复制代码$/i.test(
					caption
				)
			)
				return true
			let next = index + 1
			while (next < lines.length && !lines[next].trim()) next++
			return !/^\s{0,3}(?:`{3,}|~{3,})/.test(lines[next] || '')
		})
		.join('\n')
}
