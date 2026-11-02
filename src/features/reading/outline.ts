import type { TocItem } from '@/lib/markdown-renderer'
export function scrollToHeading(id: string) {
	const heading = document.getElementById(id)
	if (!heading) return
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
	window.scrollTo({ top: Math.max(0, heading.getBoundingClientRect().top + scrollY - 100), behavior: reduced ? 'instant' : 'smooth' })
	if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
	// Scroll separately so focus restoration and the sticky bar cannot move the target.
	heading.focus({ preventScroll: true })
	try {
		history.replaceState(history.state, '', `#${encodeURIComponent(id)}`)
	} catch {}
}
export function currentHeading(toc: TocItem[]) {
	let active = ''
	for (const item of toc) {
		const heading = document.getElementById(item.id)
		if (heading && heading.getBoundingClientRect().top <= 150) active = item.id
	}
	return active || toc[0]?.id || ''
}
