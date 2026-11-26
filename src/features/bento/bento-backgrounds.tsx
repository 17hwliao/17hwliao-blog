'use client'

import { useEffect, useRef } from 'react'

const CURSOR_TRAIL_LENGTH = 12
const CURSOR_TRAIL_OPACITY = [0.78, 0.68, 0.58, 0.48, 0.4, 0.32, 0.25, 0.19, 0.14, 0.09, 0.05, 0.025]

function isReducedMotion() {
	return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Ported from Ladvace/astro-bento-portfolio playground-grid: autonomous expanding ripples + cursor trail */
export function RippleTrailGrid() {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const container = containerRef.current
		if (!container || isReducedMotion()) return

		const TARGET_CELL_SIZE = 13
		let cols = 1
		let rows = 1
		let cellWidth = TARGET_CELL_SIZE
		let cellHeight = TARGET_CELL_SIZE
		let totalCells = 1
		let cells: HTMLDivElement[] = []
		let level = new Float32Array(0)
		let ripples: { cx: number; cy: number; radius: number; reach: number }[] = []
		let trailIndices: number[] = []

		const paintCell = (index: number, opacity: number) => {
			const cell = cells[index]
			if (!cell) return
			cell.style.background = opacity > 0 ? 'var(--primary-500)' : ''
			cell.style.opacity = opacity > 0 ? String(opacity) : ''
		}

		const rebuild = () => {
			const w = container.clientWidth
			const h = container.clientHeight
			if (!w || !h) return
			cols = Math.max(1, Math.round(w / TARGET_CELL_SIZE))
			rows = Math.max(1, Math.round(h / TARGET_CELL_SIZE))
			cellWidth = w / cols
			cellHeight = h / rows
			totalCells = cols * rows

			container.style.display = 'grid'
			container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`
			container.style.gridTemplateRows = `repeat(${rows}, 1fr)`

			const frag = document.createDocumentFragment()
			cells = Array.from({ length: totalCells }, () => {
				const cell = document.createElement('div')
				cell.style.cssText = 'border:0.5px solid color-mix(in srgb, var(--color-primary) 5%, transparent);transition:background 0.35s,opacity 0.35s;'
				frag.appendChild(cell)
				return cell
			})
			container.replaceChildren(frag)
			level = new Float32Array(totalCells)
			ripples = []
		}

		const step = () => {
			if (ripples.length < 3 && Math.random() < 0.065) {
				ripples.push({
					cx: Math.random() * cols,
					cy: Math.random() * rows,
					radius: 0,
					reach: Math.max(cols, rows) * (0.45 + Math.random() * 0.35)
				})
			}
			if (!ripples.length) return
			const touched = new Map<number, number>()
			for (const ripple of ripples) {
				ripple.radius += 0.5
				const strength = 0.45 * (1 - ripple.radius / ripple.reach)
				if (strength <= 0) continue
				const lo = Math.max(0, Math.floor(ripple.cy - ripple.radius - 1))
				const hi = Math.min(rows - 1, Math.ceil(ripple.cy + ripple.radius + 1))
				for (let y = lo; y <= hi; y++) {
					for (let x = 0; x < cols; x++) {
						const offset = Math.abs(Math.hypot(x + 0.5 - ripple.cx, y + 0.5 - ripple.cy) - ripple.radius)
						if (offset > 1.1) continue
						const val = strength * (1 - offset / 1.1)
						const i = y * cols + x
						touched.set(i, Math.max(touched.get(i) ?? 0, val))
					}
				}
			}
			ripples = ripples.filter(r => r.radius < r.reach)
			for (let i = 0; i < totalCells; i++) {
				const val = touched.get(i) ?? 0
				if (Math.abs(val - level[i]) < 0.02) continue
				level[i] = val
				paintCell(i, Math.round(val * 100) / 100)
			}
		}

		rebuild()
		const ro = new ResizeObserver(rebuild)
		ro.observe(container)
		const timer = setInterval(step, 90)

		const card = container.closest<HTMLElement>('.bento-card')
		const releaseCell = (idx: number) => {
			const cell = cells[idx]
			if (!cell) return
			cell.style.transition = ''
			paintCell(idx, level[idx])
		}

		const onMove = (e: MouseEvent) => {
			const rect = container.getBoundingClientRect()
			const idx = Math.floor((e.clientY - rect.top) / cellHeight) * cols + Math.floor((e.clientX - rect.left) / cellWidth)
			if (idx === trailIndices[0] || idx < 0 || idx >= totalCells) return
			trailIndices = [idx, ...trailIndices.filter(i => i !== idx)]
			if (trailIndices.length > CURSOR_TRAIL_LENGTH) {
				trailIndices.splice(CURSOR_TRAIL_LENGTH).forEach(i => {
					const cell = cells[i]
					if (cell) {
						cell.style.transition = 'opacity 0.1s'
						cell.style.opacity = '0'
						setTimeout(() => releaseCell(i), 100)
					}
				})
			}
			trailIndices.forEach((cellIndex, pos) => {
				const cell = cells[cellIndex]
				if (!cell) return
				cell.style.transition = 'none'
				cell.style.background = 'var(--primary-500)'
				cell.style.opacity = String(CURSOR_TRAIL_OPACITY[pos] ?? 0)
			})
		}

		const onLeave = () => {
			trailIndices.forEach(idx => {
				const cell = cells[idx]
				if (cell) {
					cell.style.transition = 'opacity 0.12s'
					cell.style.opacity = '0'
				}
			})
			setTimeout(() => {
				trailIndices.forEach(releaseCell)
				trailIndices = []
			}, 120)
		}

		card?.addEventListener('mousemove', onMove)
		card?.addEventListener('mouseleave', onLeave)
		return () => {
			clearInterval(timer)
			ro.disconnect()
			card?.removeEventListener('mousemove', onMove)
			card?.removeEventListener('mouseleave', onLeave)
		}
	}, [])

	return <div ref={containerRef} className='bento-bg-layer' aria-hidden='true' />
}

/** Ported from Ladvace/astro-bento-portfolio guestbook-grid: 45deg basket-weave parquet floor with hover flips */
export function ParquetWaveGrid() {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const container = containerRef.current
		if (!container || isReducedMotion()) return

		const TILE_SIZE = 26
		let cols = 1
		let rows = 1
		let side = 0
		let tiles: HTMLDivElement[] = []
		let turns: { angle: number; settle?: ReturnType<typeof setTimeout> }[] = []

		const floor = document.createElement('div')
		floor.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);display:grid;'
		container.replaceChildren(floor)

		const rebuild = () => {
			const w = container.clientWidth
			const h = container.clientHeight
			if (!w || !h) return
			const nextSide = Math.ceil(Math.hypot(w, h) / TILE_SIZE) * TILE_SIZE
			if (nextSide === side) return
			side = nextSide
			floor.style.width = `${side}px`
			floor.style.height = `${side}px`
			cols = rows = side / TILE_SIZE
			floor.style.gridTemplateColumns = `repeat(${cols}, ${TILE_SIZE}px)`
			floor.style.gridTemplateRows = `repeat(${rows}, ${TILE_SIZE}px)`

			const frag = document.createDocumentFragment()
			tiles = Array.from({ length: cols * rows }, (_, i) => {
				const tile = document.createElement('div')
				const flipped = (i % cols) % 2 !== Math.floor(i / cols) % 2
				tile.style.cssText = `display:flex;flex-direction:${flipped ? 'column' : 'row'};gap:3px;padding:1.5px;box-sizing:border-box;transition:transform 350ms ease-out;opacity:0.18;`
				for (let p = 0; p < 2; p++) {
					const plank = document.createElement('div')
					plank.style.cssText = 'flex:1;border-radius:2px;background:var(--primary-500);'
					tile.appendChild(plank)
				}
				frag.appendChild(tile)
				return tile
			})
			floor.replaceChildren(frag)
			turns.forEach(t => clearTimeout(t.settle))
			turns = tiles.map(() => ({ angle: 0 }))
		}

		const turnTile = (index: number) => {
			const tile = tiles[index]
			const turn = turns[index]
			if (!tile || !turn || turn.angle % 180 !== 0) return
			turn.angle += 90
			const delay = Math.random() * 130
			tile.style.transitionDelay = `${delay}ms`
			tile.style.transform = `rotate(${turn.angle}deg)`
			turn.settle = setTimeout(() => {
				turn.angle += 90
				tile.style.transitionDelay = '0ms'
				tile.style.transform = `rotate(${turn.angle}deg)`
			}, delay + 850 + Math.random() * 400)
		}

		rebuild()
		const ro = new ResizeObserver(rebuild)
		ro.observe(container)

		const card = container.closest<HTMLElement>('.bento-card')
		let lastIdx = -1
		const onMove = (e: MouseEvent) => {
			const rect = container.getBoundingClientRect()
			const dx = e.clientX - (rect.left + rect.width / 2)
			const dy = e.clientY - (rect.top + rect.height / 2)
			const x = (dx + dy) * Math.SQRT1_2 + side / 2
			const y = (dy - dx) * Math.SQRT1_2 + side / 2
			const col = Math.floor(x / TILE_SIZE)
			const row = Math.floor(y / TILE_SIZE)
			if (col < 0 || row < 0 || col >= cols || row >= rows) return
			const idx = row * cols + col
			if (idx === lastIdx) return
			lastIdx = idx
			turnTile(idx)
		}
		const onLeave = () => {
			lastIdx = -1
		}

		card?.addEventListener('mousemove', onMove)
		card?.addEventListener('mouseleave', onLeave)

		const timer = setInterval(() => {
			const time = performance.now() * 0.001
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++) {
					const tile = tiles[r * cols + c]
					if (!tile) continue
					const w1 = Math.cos(time * 1.1 + c * 0.9 + r * 0.6)
					const w2 = Math.cos(time * 0.7 - c * 0.5 + r * 1.1)
					tile.style.opacity = (Math.max(0, (w1 + w2 + 2) / 4) * 0.34).toFixed(3)
				}
			}
		}, 45)

		return () => {
			clearInterval(timer)
			ro.disconnect()
			card?.removeEventListener('mousemove', onMove)
			card?.removeEventListener('mouseleave', onLeave)
			turns.forEach(t => clearTimeout(t.settle))
		}
	}, [])

	return <div ref={containerRef} className='bento-bg-layer' aria-hidden='true' />
}

/** Ported from works-bg & blog-bg in Ladvace/astro-bento-portfolio */
export function WavePatternGrid({ variant }: { variant: 'diagonal' | 'radial' }) {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const container = containerRef.current
		if (!container || isReducedMotion()) return

		const cellSize = variant === 'diagonal' ? 16 : 18
		const cols = Math.max(1, Math.floor(container.clientWidth / cellSize))
		const rows = Math.max(1, Math.floor(container.clientHeight / cellSize)) + 2
		container.style.display = 'grid'
		container.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`
		container.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`
		container.style.placeContent = 'center'

		const frag = document.createDocumentFragment()
		const cells = Array.from({ length: cols * rows }, () => {
			const cell = document.createElement('div')
			cell.style.cssText =
				variant === 'diagonal'
					? 'margin:3px;border-radius:2px;background:var(--primary-500);opacity:0;'
					: 'margin:4px;border-radius:50%;border:1px solid var(--primary-500);opacity:0;'
			frag.appendChild(cell)
			return cell
		})
		container.replaceChildren(frag)

		const originCol = -cols * 0.3
		const originRow = -rows * 0.3
		const maxDist = Math.max(1, Math.hypot(originCol, originRow))
		const phases = cells.map((_, i) => (Math.hypot((i % cols) - originCol, Math.floor(i / cols) - originRow) / maxDist) * 7)
		const span = cols + rows

		const timer = setInterval(() => {
			const now = performance.now()
			if (variant === 'diagonal') {
				const head = ((now * 0.004) % (span + 8)) - 4
				for (let i = 0; i < cells.length; i++) {
					const diag = (i % cols) + Math.floor(i / cols)
					cells[i].style.opacity = Math.max(0, 0.36 - Math.abs(diag - head) * 0.12).toFixed(3)
				}
			} else {
				const t = now * 0.0015
				for (let i = 0; i < cells.length; i++) {
					cells[i].style.opacity = Math.max(0, Math.cos(t - phases[i]) * 0.34).toFixed(3)
				}
			}
		}, 45)

		return () => clearInterval(timer)
	}, [variant])

	return <div ref={containerRef} className='bento-bg-layer' aria-hidden='true' />
}

/** Interactive rotating wireframe globe (mapped from Globe card) */
export function MiniWireframeGlobe({ size = 56 }: { size?: number }) {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const dpr = Math.min(2, window.devicePixelRatio || 1)
		canvas.width = size * dpr
		canvas.height = size * dpr
		ctx.scale(dpr, dpr)

		let yaw = 0.5
		const pitch = 0.32
		const reduced = isReducedMotion()

		const nodes = [
			[0.4, 0.35],
			[1.8, -0.2],
			[3.1, 0.5],
			[4.7, -0.35],
			[5.4, 0.25]
		]

		const draw = () => {
			const style = getComputedStyle(document.documentElement)
			const accent = style.getPropertyValue('--primary-500').trim() || '#38bdf8'
			const border = style.getPropertyValue('--color-secondary').trim() || '#888'

			ctx.clearRect(0, 0, size, size)
			const r = size * 0.42
			const cx = size / 2
			const cy = size / 2

			// Sphere outline
			ctx.beginPath()
			ctx.arc(cx, cy, r, 0, Math.PI * 2)
			ctx.strokeStyle = accent
			ctx.globalAlpha = 0.55
			ctx.lineWidth = 1.2
			ctx.stroke()

			const project = (lon: number, lat: number): [number, number, number] => {
				const clat = Math.cos(lat)
				const slat = Math.sin(lat)
				const x = clat * Math.sin(lon + yaw)
				const y0 = slat
				const z0 = clat * Math.cos(lon + yaw)
				const y = y0 * Math.cos(pitch) - z0 * Math.sin(pitch)
				const z = y0 * Math.sin(pitch) + z0 * Math.cos(pitch)
				return [cx + x * r, cy - y * r, z]
			}

			// Meridians
			ctx.lineWidth = 0.85
			for (let m = 0; m < 6; m++) {
				const lon = (m * Math.PI) / 3
				ctx.beginPath()
				for (let s = 0; s <= 28; s++) {
					const lat = -Math.PI / 2 + (s / 28) * Math.PI
					const [px, py, pz] = project(lon, lat)
					ctx.strokeStyle = pz >= 0 ? accent : border
					ctx.globalAlpha = pz >= 0 ? 0.42 : 0.14
					if (s === 0) ctx.moveTo(px, py)
					else ctx.lineTo(px, py)
				}
				ctx.stroke()
			}

			// Parallels
			for (const lat of [-0.55, 0, 0.55]) {
				ctx.beginPath()
				for (let s = 0; s <= 36; s++) {
					const lon = (s / 36) * Math.PI * 2
					const [px, py] = project(lon, lat)
					if (s === 0) ctx.moveTo(px, py)
					else ctx.lineTo(px, py)
				}
				ctx.strokeStyle = border
				ctx.globalAlpha = 0.24
				ctx.stroke()
			}

			// Knowledge nodes
			for (const [lon, lat] of nodes) {
				const [px, py, pz] = project(lon, lat)
				if (pz < -0.1) continue
				ctx.beginPath()
				ctx.arc(px, py, 2.3, 0, Math.PI * 2)
				ctx.fillStyle = accent
				ctx.globalAlpha = 0.95
				ctx.fill()
			}
			ctx.globalAlpha = 1
		}

		draw()
		if (reduced) return
		const timer = setInterval(() => {
			yaw += 0.035
			draw()
		}, 55)

		return () => clearInterval(timer)
	}, [size])

	return <canvas ref={canvasRef} style={{ width: size, height: size, display: 'block', flexShrink: 0 }} aria-hidden='true' />
}
