export type ScatterOrigin = { x: number; y: number; width: number; height: number; rotate: number; scale: number; borderWidth: number }

/** Keep both photo and note inside the viewport, including short phone screens. */
export function expandedPhotoLayout(viewport: { width: number; height: number }, ratio: number, naturalWidth: number, hasNote: boolean) {
	const wide = viewport.width >= 900
	const gutter = viewport.width < 640 ? 16 : 24
	const borderWidth = viewport.width < 640 ? 12 : 24
	const noteWidth = wide && hasNote ? 200 : 0
	const noteGap = hasNote ? 20 : 0
	const noteHeight = !wide && hasNote ? Math.min(112, viewport.height * 0.25) : 0
	const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 4 / 3
	const maxWidth = Math.max(24, viewport.width - gutter * 2 - noteWidth - (wide ? noteGap : 0) - borderWidth * 2)
	const maxHeight = Math.max(24, viewport.height - 88 - noteHeight - (!wide ? noteGap : 0) - borderWidth * 2)
	const imageWidth = Math.max(1, Math.min(maxWidth, maxHeight * safeRatio, naturalWidth > 0 ? naturalWidth : maxWidth))
	const width = imageWidth + borderWidth * 2
	const height = imageWidth / safeRatio + borderWidth * 2
	const totalWidth = width + noteWidth + (wide ? noteGap : 0)
	const totalHeight = height + noteHeight + (!wide ? noteGap : 0)
	const x = (viewport.width - totalWidth) / 2
	const y = Math.max(64, (viewport.height - totalHeight) / 2)
	return {
		wide,
		frame: { x, y, width, height, rotate: 0, scale: 1, borderWidth },
		note: {
			left: wide ? x + width + noteGap : x,
			top: wide ? Math.max(64, (viewport.height - 180) / 2) : y + height + noteGap,
			width: wide ? 200 : width,
			maxHeight: wide ? Math.min(260, viewport.height - 112) : noteHeight
		}
	}
}

/** Pointer movement threshold is independent of whether Motion emitted drag events. */
export const movedBeyondClick = (start: { x: number; y: number }, end: { x: number; y: number }) => Math.hypot(end.x - start.x, end.y - start.y) > 5

type VisibleBox = { left: number; right: number; top: number; bottom: number }

// Use the visible rotated bounds, including the current hover scale.
export function boundedPhotoDelta(photo: VisibleBox, board: VisibleBox, dx: number, dy: number, pendingX = 0, pendingY = 0) {
	return {
		dx: Math.max(board.left + 12 - photo.left - pendingX, Math.min(board.right - 12 - photo.right - pendingX, dx)),
		dy: Math.max(board.top + 12 - photo.top - pendingY, Math.min(board.bottom - 12 - photo.bottom - pendingY, dy))
	}
}
