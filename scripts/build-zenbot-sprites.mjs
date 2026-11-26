import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createCanvas, loadImage } from '@napi-rs/canvas'

// Asset packing only: artwork is generated with imagegen, never synthesized by
// mirroring the front portrait or by running a 3D model in the browser.
const sourcePath = process.argv[2]
if (!sourcePath) throw new Error('Usage: node scripts/build-zenbot-sprites.mjs <generated-atlas.png>')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'public/characters/zenbot/spin')
await fs.mkdir(output, { recursive: true })
const sourceBytes = await fs.readFile(sourcePath)
const image = await loadImage(sourceBytes)
const source = createCanvas(image.width, image.height), context = source.getContext('2d')
context.drawImage(image, 0, 0)
const cols = 6, rows = 4, width = 320, height = 360
const atlas = createCanvas(width * cols, height * rows), target = atlas.getContext('2d')
target.imageSmoothingEnabled = true; target.imageSmoothingQuality = 'high'
const frames = []
for (let index = 0; index < cols * rows; index++) {
	const col = index % cols, row = Math.floor(index / cols)
	const sx = Math.round(col * image.width / cols), sy = Math.round(row * image.height / rows)
	const sw = Math.round((col + 1) * image.width / cols) - sx, sh = Math.round((row + 1) * image.height / rows) - sy
	const pixels = context.getImageData(sx, sy, sw, sh).data
	let left = sw, top = sh, right = 0, bottom = 0
	for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
		if (pixels[(y * sw + x) * 4 + 3] < 160) continue
		left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y)
	}
	if (right <= left || bottom <= top) throw new Error(`Empty sprite frame ${index}`)
	let footLeft = sw, footRight = 0
	for (let y = Math.max(top, bottom - 15); y <= bottom; y++) for (let x = left; x <= right; x++) {
		if (pixels[(y * sw + x) * 4 + 3] < 160) continue
		footLeft = Math.min(footLeft, x); footRight = Math.max(footRight, x)
	}
	const center = (footLeft + footRight) / 2
	const scale = Math.min(326 / (bottom - top + 1), 145 / Math.max(center - left, right - center))
	const dx = width / 2 - center * scale, dy = 344 - bottom * scale
	const frame = createCanvas(width, height), fc = frame.getContext('2d')
	fc.imageSmoothingEnabled = true; fc.imageSmoothingQuality = 'high'
	fc.drawImage(source, sx, sy, sw, sh, dx, dy, sw * scale, sh * scale)
	target.drawImage(frame, col * width, row * height)
	if (index === 0) await fs.writeFile(path.join(output, 'front.webp'), frame.toBuffer('image/webp', 92))
	frames.push({ index, sourceCell: { x: sx, y: sy, width: sw, height: sh }, artBounds: { left, top, right, bottom }, scale, baseline: 344, sha256: crypto.createHash('sha256').update(frame.toBuffer('image/png')).digest('hex') })
}
const atlasBytes = atlas.toBuffer('image/webp', 90)
await fs.writeFile(path.join(output, 'turntable.webp'), atlasBytes)
const manifest = {
	version: '20261126-sprite-v1', renderer: 'css-sprite', cols, rows, frames: 24,
	frameOrder: Array.from({ length: 24 }, (_, index) => (24 - index) % 24),
	cellWidth: width, cellHeight: height, atlas: 'turntable.webp', poster: 'front.webp', bytes: atlasBytes.length,
	cycleMs: 2400, pixelsPerFrame: 14,
	source: { tool: 'imagegen built-in', sha256: crypto.createHash('sha256').update(sourceBytes).digest('hex'), reference: 'Approved Zenbot clay character preview, 2026-11-26' },
	sourceSequence: 'front, viewer-left profile, back, viewer-right profile, front',
	sequence: 'front, viewer-right profile, back, viewer-left profile, front (matches reference avatar-spin.webp)',
	registration: frames,
	limitations: 'AI-authored multiview illustrations, not frames rendered from an exact shared 3D mesh; subtle design and angular spacing variations may remain.'
}
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({ atlas: path.join(output, 'turntable.webp'), bytes: atlasBytes.length, frames: frames.length, cell: [width,height] }))
