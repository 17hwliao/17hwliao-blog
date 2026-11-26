import { createZenbotRigFigure } from './figures/zenbot-rig.js'
import { createRig } from './kit/rig.js'
import { createZenbotRigModel, validateZenbotRigManifest } from './characters/zenbot-rig-manifest.js'
import { anchorZenbotHair, installZenbotHair } from './characters/zenbot-hair.js'
import { createZenbotFaceAnimator } from './figures/zenbot-face.js'

export interface ZenbotRigFrame {
	t?: number
	mode?: string
	modeT?: number
	jumpV?: number
	face?: string
	facing?: number
	velX?: number
	gaitPhase?: number
	sit?: number
	talk?: number
	look?: [number, number]
	gesture?: { kind: string; k: number } | null
	blink?: number
	eyeClose?: number
}

export interface ZenbotRigFigure {
	renderer: 'rig'
	draw: (petG: SVGGElement, face: string, frame?: ZenbotRigFrame) => void
	ready: Promise<void>
	anchors: { bubble: [number, number] }
	extent: [number, number, number, number]
	hits: Array<[number, number, number]>
	gestures: string[]
	accent: string
	words: string[]
	state: string
	preloadWord: (word: string) => Promise<void>
	dispose: () => void
}

export interface DeformerState {
	a?: number
	tx?: number
	ty?: number
	sx?: number
	sy?: number
	s?: number
	fn?: (u: number, v: number, x: number, y: number) => [number, number]
}

export type RigRenderState = Record<string, DeformerState | unknown> & {
	z?: Record<string, number>
	alpha?: Record<string, number>
	tint?: Record<string, [number, number, number, number]>
	mix?: number
}

interface ValidatedRigManifest {
	id: string
	name: string
	drawing: {
		logoHeight: number
		centerX: number
		feetY: number
		referenceCanvas: [number, number]
		view: [number, number, number, number]
	}
	parts: Array<{
		id: string
		tex: string
		file: string
		box: [number, number, number, number]
		grid: [number, number]
		parent: string
		z: number
		alpha: number
		blend: string
	}>
	expressions: Record<string, { id: string; file: string; texture: string | null }>
}

interface WebGLRig {
	upload: (key: string, src: TexImageSource) => WebGLTexture | null
	render: (state: RigRenderState, opts?: { hidden?: Record<string, boolean> }) => void
	dispose: () => void
}

interface FaceAnimator {
	render: (
		source: HTMLImageElement,
		options: { face: string; blink: number; talk: number; time: number }
	) => HTMLCanvasElement | HTMLImageElement | null
}

export const ZENBOT_RIG_BASE_URL = '/characters/zenbot/rig/'
export const ZENBOT_FALLBACK_STAND = '/characters/zenbot/fallback/stand.png'
export const ZENBOT_FALLBACK_WAVE = '/characters/zenbot/fallback/wave.png'

export async function mountZenbotFigure(options?: {
	pixelRatio?: number
	onError?: (error: Error) => void
}): Promise<ZenbotRigFigure> {
	const createFn = createZenbotRigFigure as unknown as (opts: Record<string, unknown>) => Promise<ZenbotRigFigure>
	return createFn({
		baseUrl: ZENBOT_RIG_BASE_URL,
		loadReferenceManifest: false,
		pixelRatio: options?.pixelRatio,
		onError: options?.onError
	})
}

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.decoding = 'async'
		img.onerror = () => reject(new Error(`Failed to load ${url}`))
		img.src = url
		if (typeof img.decode === 'function') {
			img.decode().then(() => resolve(img), reject)
			return
		}
		img.onload = () => resolve(img)
	})
}

export interface ZenbotTurntableHandle {
	renderFrame: (params: {
		angleRad: number
		timeSec: number
		active?: boolean
		accentRgb?: [number, number, number] | null
	}) => void
	setExpression: (id: 'neutral' | 'happy' | 'wink' | 'excited' | 'shy') => void
	dispose: () => void
}

/**
 * Mounts a 360-degree interactive turntable renderer using Zenbot's 18-part WebGL rig.
 */
export async function mountZenbotTurntable(
	canvas: HTMLCanvasElement,
	options?: { baseUrl?: string; pixelRatio?: number }
): Promise<ZenbotTurntableHandle> {
	const baseUrl = options?.baseUrl ?? ZENBOT_RIG_BASE_URL
	const response = await fetch(`${baseUrl}manifest.json`)
	if (!response.ok) throw new Error(`Failed to fetch Zenbot manifest: HTTP ${response.status}`)
	const raw = await response.json()
	const manifest = validateZenbotRigManifest(raw) as unknown as ValidatedRigManifest
	const model = (createZenbotRigModel as unknown as (m: ValidatedRigManifest) => unknown)(manifest)
	const hairBinding = (installZenbotHair as unknown as (m: unknown) => unknown)(model)

	const [vx0, vy0, vx1, vy1] = manifest.drawing.view
	const vw = vx1 - vx0
	const vh = vy1 - vy0
	const dpr = Math.min(2.5, Math.max(1, options?.pixelRatio ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1)))
	canvas.width = Math.round(vw * dpr)
	canvas.height = Math.round(vh * dpr)

	const rig = (createRig as unknown as (c: HTMLCanvasElement, m: unknown) => WebGLRig)(canvas, model)
	let disposed = false

	const faceCache = new Map<string, HTMLImageElement>()
	const [neutralImg, happyImg, winkImg, excitedImg] = await Promise.all([
		loadImage(`${baseUrl}${manifest.expressions.neutral.file}`),
		loadImage(`${baseUrl}${manifest.expressions.happy.file}`),
		loadImage(`${baseUrl}${manifest.expressions.wink.file}`).catch(() => null),
		loadImage(`${baseUrl}${manifest.expressions.excited.file}`).catch(() => null)
	])
	faceCache.set('neutral', neutralImg)
	faceCache.set('happy', happyImg)
	if (winkImg) faceCache.set('wink', winkImg)
	if (excitedImg) faceCache.set('excited', excitedImg)

	rig.upload('face_base', neutralImg)
	const faceAnimator = (createZenbotFaceAnimator as unknown as (d: Document, img: HTMLImageElement) => FaceAnimator | null)(
		document,
		happyImg
	)

	const uploaded = new Set<string>(['face_base'])
	await Promise.all(
		manifest.parts
			.filter(part => {
				if (part.id === 'face_base' || uploaded.has(part.tex)) return false
				uploaded.add(part.tex)
				return true
			})
			.map(async part => {
				const img = await loadImage(`${baseUrl}${part.file}`)
				if (!disposed) rig.upload(part.tex, img)
			})
	)

	let desiredFace: 'neutral' | 'happy' | 'wink' | 'excited' | 'shy' = 'neutral'
	let blinkNext = 2.1
	let blinkAge = 9
	let lastTime = 0

	function renderFrame({
		angleRad,
		timeSec,
		active = false,
		accentRgb = null
	}: {
		angleRad: number
		timeSec: number
		active?: boolean
		accentRgb?: [number, number, number] | null
	}) {
		if (disposed) return
		const dt = lastTime > 0 ? Math.min(0.05, Math.max(0, timeSec - lastTime)) : 0.016
		lastTime = timeSec

		blinkAge += dt
		blinkNext -= dt
		if (blinkNext <= 0) {
			blinkAge = 0
			blinkNext = 2.4 + Math.random() * 2.6
		}
		const blink = blinkAge < 0.13 ? Math.sin((Math.PI * blinkAge) / 0.13) : 0

		const c = Math.cos(angleRad)
		const s = Math.sin(angleRad)
		const absC = Math.abs(c)
		const front = c >= 0
		const breath = Math.sin((timeSec * Math.PI * 2) / 4.0)

		const faceKey = active ? 'happy' : desiredFace
		const baseFace = faceCache.get(faceKey) ?? neutralImg
		if (front && faceAnimator) {
			const composed = faceAnimator.render(baseFace, {
				face: faceKey,
				blink,
				talk: 0,
				time: timeSec
			})
			if (composed) rig.upload('face_base', composed)
		}

		const perspectiveSx = (front ? 1 : -1) * (0.34 + 0.66 * Math.pow(absC, 0.78))

		const states: RigRenderState = {
			root: {
				a: 0,
				tx: 0,
				ty: 0,
				sx: perspectiveSx,
				sy: 1
			},
			body: {
				a: s * (active ? 3.2 : 1.8),
				tx: 0,
				ty: -breath * 1.1,
				sx: 1,
				sy: 1 + breath * 0.008
			},
			chest: {
				a: s * 1.4,
				tx: s * 3.8,
				ty: -breath * 0.65,
				sx: 1,
				sy: 1
			},
			head: {
				a: -s * 2.6 + Math.sin(timeSec * 1.5) * 1.1,
				tx: s * 7.5,
				ty: breath * 0.35,
				sx: 1,
				sy: 1
			},
			hair_back: {
				a: -s * 5.2 + Math.sin(timeSec * 2.1) * 1.8,
				tx: -s * 9.5,
				ty: 0,
				sx: 1,
				sy: 1
			},
			skirt: {
				a: -s * 3.2 + Math.sin(timeSec * 2.0 + 0.6) * 1.2,
				tx: s * 2.2,
				ty: 0,
				sx: 1,
				sy: 1
			},
			arm_l: {
				a: 6 * s - 3 * breath + (active ? -8 : 0),
				tx: s * 4.5,
				ty: 0,
				sx: 1,
				sy: 1
			},
			arm_r: {
				a: 6 * s + 3 * breath + (active ? 8 : 0),
				tx: s * 4.5,
				ty: 0,
				sx: 1,
				sy: 1
			},
			leg_l: {
				a: s * 2.2,
				tx: s * 2.0,
				ty: 0,
				sx: 1,
				sy: 1
			},
			leg_r: {
				a: -s * 2.2,
				tx: -s * 2.0,
				ty: 0,
				sx: 1,
				sy: 1
			}
		}

		;(anchorZenbotHair as unknown as (st: Record<string, unknown>, b: unknown) => void)(
			states as Record<string, unknown>,
			hairBinding
		)

		const frontFade = front ? Math.min(1, absC / 0.14) : 0
		const leftCloser = s >= 0

		states.alpha = {
			face_base: frontFade,
			hair_front: front ? Math.min(1, 0.25 + absC * 0.85) : 0,
			badge: frontFade,
			jacket_front: front ? Math.min(1, 0.35 + absC * 0.75) : 0,
			skirt_front: front ? 1 : 0.15
		}

		states.z = {
			hair_back: front ? 10 : 63,
			skirt_back: front ? 28 : 45,
			arm_l: leftCloser ? 56 : 16,
			hand_l: leftCloser ? 58 : 17,
			arm_r: leftCloser ? 16 : 56,
			hand_r: leftCloser ? 17 : 58,
			leg_l: leftCloser ? 23 : 19,
			shoe_l: leftCloser ? 24 : 19,
			leg_r: leftCloser ? 19 : 23,
			shoe_r: leftCloser ? 19 : 24
		}

		const backShade = front ? 0 : Math.min(0.24, Math.abs(c) * 0.24)
		const tintMap: Record<string, [number, number, number, number]> = {}
		if (backShade > 0.01) {
			for (const part of manifest.parts) {
				tintMap[part.id] = [0.78, 0.84, 0.95, backShade]
			}
		}
		if (accentRgb) {
			const [r, g, b] = accentRgb.map(v => v / 255) as [number, number, number]
			const accentMix = active ? 0.16 : 0.09
			tintMap.headphones = [r, g, b, accentMix + 0.08]
			tintMap.hair_ornament = [r, g, b, accentMix + 0.06]
			tintMap.badge = [r, g, b, accentMix + 0.1]
		}
		states.tint = tintMap

		rig.render(states)
	}

	return {
		renderFrame,
		setExpression(id) {
			desiredFace = id
			if (id !== 'neutral' && !faceCache.has(id) && manifest.expressions[id]) {
				void loadImage(`${baseUrl}${manifest.expressions[id].file}`)
					.then(img => {
						if (!disposed) faceCache.set(id, img)
					})
					.catch(() => {})
			}
		},
		dispose() {
			if (disposed) return
			disposed = true
			rig.dispose()
		}
	}
}
