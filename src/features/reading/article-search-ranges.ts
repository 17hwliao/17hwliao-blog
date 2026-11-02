// Match rendered prose and code without inserting nodes into React-owned Markdown.
export function findArticleRanges(root: HTMLElement, query: string): Range[] {
	if (!query) return []
	const groups: { block: Element; nodes: Text[] }[] = []
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
	let node: Node | null
	while ((node = walker.nextNode())) {
		const parent = node.parentElement
		if (!parent || parent.closest('button, input, textarea, script, style, annotation, [hidden], [aria-hidden="true"], .katex-mathml')) continue
		const block = parent.closest('p, h1, h2, h3, h4, h5, h6, li, pre, td, th, blockquote, summary, dt, dd') || parent
		const previous = groups.at(-1)
		if (previous?.block === block) previous.nodes.push(node as Text)
		else groups.push({ block, nodes: [node as Text] })
	}
	const expression = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu')
	const ranges: Range[] = []
	for (const { nodes } of groups) {
		let offset = 0
		const segments = nodes.map(node => {
			const start = offset
			offset += node.length
			return { node, start, end: offset }
		})
		const text = nodes.map(node => node.data).join('')
		let startNode = 0
		let endNode = 0
		for (const match of text.matchAll(expression)) {
			const start = match.index!
			const end = start + match[0].length
			while (segments[startNode].end <= start) startNode++
			while (segments[endNode].end < end) endNode++
			const range = document.createRange()
			range.setStart(segments[startNode].node, start - segments[startNode].start)
			range.setEnd(segments[endNode].node, end - segments[endNode].start)
			ranges.push(range)
		}
	}
	return ranges
}
