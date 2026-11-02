export function locateExcerpt(root: HTMLElement, quote: string, preferredOffset: number): Range | null {
	const text = root.textContent || ''
	const start = text.slice(preferredOffset, preferredOffset + quote.length) === quote ? preferredOffset : text.indexOf(quote)
	if (start < 0) return null
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
	let offset = 0
	let node: Node | null
	const range = document.createRange()
	let started = false
	while ((node = walker.nextNode())) {
		const length = node.textContent?.length || 0
		if (!started && offset + length > start) {
			range.setStart(node, start - offset)
			started = true
		}
		if (started && offset + length >= start + quote.length) {
			range.setEnd(node, start + quote.length - offset)
			return range
		}
		offset += length
	}
	return null
}
