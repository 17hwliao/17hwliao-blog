// A deterrent for ordinary browser copying, not a security boundary: content
// sent to a browser can always be retrieved by the person controlling it.
const editableSelector = 'input, textarea, [contenteditable]:not([contenteditable="false"])'

function editing(event: Event) {
	return event.composedPath().some(node => node instanceof Element && Boolean(node.closest(editableSelector)))
}

export function installContentProtection() {
	const stopCopy = (event: Event) => {
		if (editing(event)) return
		event.preventDefault()
		if ('clipboardData' in event) (event as ClipboardEvent).clipboardData?.clearData()
	}
	const stopSelection = (event: Event) => {
		if (!editing(event)) event.preventDefault()
	}
	const stopShortcut = (event: KeyboardEvent) => {
		if ((event.ctrlKey || event.metaKey) && !event.altKey && ['c', 'x'].includes(event.key.toLowerCase()) && !editing(event)) event.preventDefault()
	}
	// Independent capture layers plus the server-rendered CSS keep the policy
	// active when just one document listener is removed. Paste is never trapped.
	const removers: Array<() => void> = []
	for (const target of [window, document]) {
		for (const type of ['copy', 'cut', 'beforecopy']) {
			target.addEventListener(type, stopCopy, true)
			removers.push(() => target.removeEventListener(type, stopCopy, true))
		}
		for (const type of ['selectstart', 'dragstart', 'contextmenu']) {
			target.addEventListener(type, stopSelection, true)
			removers.push(() => target.removeEventListener(type, stopSelection, true))
		}
		target.addEventListener('keydown', stopShortcut as EventListener, true)
		removers.push(() => target.removeEventListener('keydown', stopShortcut as EventListener, true))
	}
	return () => removers.forEach(remove => remove())
}
