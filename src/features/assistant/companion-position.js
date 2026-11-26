// The bubble's edge clamp subtracts this same displayed position. Mixing a
// fractional clamp with a rounded transform makes a pinned bubble oscillate.
export function positionCompanion(walker, x) {
	const displayedX = Math.round(x)
	walker.style.setProperty('--walker-x', `${displayedX}px`)
	walker.style.transform = `translate3d(${displayedX}px, 0, 0)`
}
