import {
	createExtrudedStarPolygonMesh,
	createLatheMesh,
	createSweptStrandMesh,
	createZenbot3DRenderer,
	mat4Compose,
	mergeMeshes,
	recomputeSmoothNormals,
	transformMesh,
	type RawMesh,
	type ScenePart,
	type ToonMaterialSpec,
	type Vec3
} from './zenbot-3d-engine'

/* ---------- Color Palette (Matched directly to zenbot-master-trim.png) ---------- */

const INK_NAVY: Vec3 = [0.09, 0.125, 0.23]
const SKIN_TOP: Vec3 = [1.0, 0.968, 0.942]
const SKIN_BOT: Vec3 = [0.995, 0.945, 0.915]

const HAIR_MAT: ToonMaterialSpec = {
	colorTop: [0.98, 0.99, 1.0], // Luminous snow-white crown
	colorMid: [0.47, 0.84, 1.0], // Sky-aqua cyan mid-length
	colorBot: [0.8, 0.7, 0.97], // Dreamy pastel lavender tips
	gradYRange: [-0.66, 0.62],
	shadowTint: [0.81, 0.87, 0.97],
	outlineWidth: 0.017,
	outlineColor: INK_NAVY,
	specular: 0.55,
	rimStrength: 0.52
}

const NAVY_MAT: ToonMaterialSpec = {
	colorTop: [0.145, 0.185, 0.3],
	colorBot: [0.105, 0.135, 0.23],
	gradYRange: [-0.9, 0.1],
	shadowTint: [0.74, 0.78, 0.9],
	outlineWidth: 0.015,
	outlineColor: INK_NAVY,
	specular: 0.25,
	rimStrength: 0.4
}

const WHITE_TECH_MAT: ToonMaterialSpec = {
	colorTop: [0.98, 0.99, 1.0],
	colorBot: [0.9, 0.94, 0.99],
	gradYRange: [-0.9, 0.1],
	shadowTint: [0.82, 0.87, 0.96],
	outlineWidth: 0.015,
	outlineColor: INK_NAVY,
	specular: 0.3,
	rimStrength: 0.38
}

const CYAN_TRIM_MAT: ToonMaterialSpec = {
	colorTop: [0.34, 0.76, 0.98],
	colorBot: [0.16, 0.56, 0.91],
	gradYRange: [-1.1, 0.6],
	shadowTint: [0.78, 0.85, 0.96],
	outlineWidth: 0.013,
	outlineColor: INK_NAVY,
	specular: 0.45,
	rimStrength: 0.5,
	emissive: 0.18
}

const GLOW_LED_MAT: ToonMaterialSpec = {
	colorTop: [0.48, 0.9, 1.0],
	colorBot: [0.22, 0.72, 0.98],
	gradYRange: [-1.2, 0.6],
	shadowTint: [0.9, 0.95, 1.0],
	outlineWidth: 0.008,
	outlineColor: INK_NAVY,
	specular: 0.6,
	rimStrength: 0.6,
	emissive: 0.55
}

const TIGHTS_MAT: ToonMaterialSpec = {
	colorTop: [0.24, 0.185, 0.215],
	colorMid: [0.3, 0.235, 0.27],
	colorBot: [0.2, 0.155, 0.185],
	gradYRange: [-0.92, -0.52],
	shadowTint: [0.74, 0.72, 0.8],
	outlineWidth: 0.014,
	outlineColor: INK_NAVY,
	specular: 0.38,
	rimStrength: 0.32
}

/* ---------- High-Res Procedural 2D Canvas Textures for 3D Head & Zenix+ Top ---------- */

export type Zenbot3DExpression = 'neutral' | 'happy' | 'wink'

function drawAnimeEye(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	w: number,
	h: number,
	side: -1 | 1,
	blink: number,
	winkClosed: boolean
) {
	ctx.save()
	ctx.translate(cx, cy)
	// Draw one almond-shaped eye and mirror it at the outer corner.
	ctx.scale(side, 1)

	// Delicate eyebrow above eye
	ctx.save()
	ctx.strokeStyle = '#73738d'
	ctx.lineWidth = 6
	ctx.lineCap = 'round'
	ctx.beginPath()
	ctx.moveTo(-w * 0.38, -h * 0.73)
	ctx.quadraticCurveTo(0, -h * 0.88, w * 0.39, -h * 0.76)
	ctx.stroke()
	ctx.restore()

	const closeAmount = winkClosed ? 1 : Math.max(0, Math.min(1, blink))
	if (closeAmount > 0.86) {
		// Cute happy/closed curved lash arc
		ctx.strokeStyle = '#141a30'
		ctx.lineWidth = 14
		ctx.lineCap = 'round'
		ctx.beginPath()
		if (winkClosed) {
			ctx.moveTo(-w * 0.52, h * 0.08)
			ctx.quadraticCurveTo(0, -h * 0.34, w * 0.52, h * 0.1)
		} else {
			ctx.moveTo(-w * 0.52, 0)
			ctx.quadraticCurveTo(0, h * 0.24, w * 0.52, 0)
		}
		ctx.stroke()
		ctx.restore()
		return
	}

	const openScaleY = 1 - closeAmount * 0.88
	ctx.scale(1, openScaleY)

	// Clip the iris and highlights to the eyelids, including while blinking.
	ctx.save()
	ctx.beginPath()
	ctx.moveTo(-w * 0.5, -h * 0.03)
	ctx.bezierCurveTo(-w * 0.3, -h * 0.65, w * 0.3, -h * 0.65, w * 0.5, -h * 0.09)
	ctx.bezierCurveTo(w * 0.43, h * 0.55, -w * 0.31, h * 0.59, -w * 0.5, -h * 0.03)
	ctx.closePath()
	ctx.fillStyle = '#fffaf8'
	ctx.fill()
	ctx.clip()

	// Iris clip & rich sapphire -> cerulean -> aqua-cyan gradient
	ctx.save()
	ctx.beginPath()
	ctx.ellipse(0, h * 0.05, w * 0.41, h * 0.49, 0, 0, Math.PI * 2)
	ctx.clip()

	const grad = ctx.createLinearGradient(0, -h * 0.45, 0, h * 0.54)
	grad.addColorStop(0, '#25345f')
	grad.addColorStop(0.36, '#3675b7')
	grad.addColorStop(0.72, '#64c9de')
	grad.addColorStop(1, '#b1f0e9')
	ctx.fillStyle = grad
	ctx.fillRect(-w * 0.5, -h * 0.5, w, h * 1.1)

	// Deep pupil core
	ctx.fillStyle = '#0d2147'
	ctx.beginPath()
	ctx.ellipse(0, h * 0.02, w * 0.18, h * 0.23, 0, 0, Math.PI * 2)
	ctx.fill()

	// Lower glowing aqua crescent highlight inside iris
	ctx.strokeStyle = 'rgba(185, 255, 250, 0.78)'
	ctx.lineWidth = 9
	ctx.lineCap = 'round'
	ctx.beginPath()
	ctx.arc(0, h * 0.08, w * 0.27, Math.PI * 0.18, Math.PI * 0.82)
	ctx.stroke()

	// Iris outer dark rim
	ctx.strokeStyle = '#122852'
	ctx.lineWidth = 6
	ctx.beginPath()
	ctx.ellipse(0, h * 0.05, w * 0.41, h * 0.49, 0, 0, Math.PI * 2)
	ctx.stroke()
	ctx.restore()

	// Glossy white starlight catchlights
	ctx.fillStyle = '#ffffff'
	ctx.beginPath()
	ctx.ellipse(-w * 0.16, -h * 0.17, w * 0.125, h * 0.135, -0.25, 0, Math.PI * 2)
	ctx.fill()

	ctx.beginPath()
	ctx.arc(w * 0.17, h * 0.21, w * 0.055, 0, Math.PI * 2)
	ctx.fill()
	ctx.restore()

	// Tapered upper lash with a short outer flick; lighter lower lid.
	ctx.strokeStyle = '#30324c'
	ctx.lineWidth = 10
	ctx.lineCap = 'round'
	ctx.beginPath()
	ctx.moveTo(-w * 0.5, -h * 0.03)
	ctx.bezierCurveTo(-w * 0.3, -h * 0.65, w * 0.3, -h * 0.65, w * 0.5, -h * 0.09)
	ctx.lineTo(w * 0.59, -h * 0.18)
	ctx.stroke()

	ctx.strokeStyle = '#8b7483'
	ctx.lineWidth = 3.5
	ctx.beginPath()
	ctx.moveTo(-w * 0.28, h * 0.37)
	ctx.quadraticCurveTo(0, h * 0.53, w * 0.31, h * 0.34)
	ctx.stroke()

	ctx.restore()
}

export function paintZenbotFaceCanvas(
	canvas: HTMLCanvasElement,
	expression: Zenbot3DExpression,
	blink: number
): void {
	const S = 1024
	if (canvas.width !== S || canvas.height !== S) {
		canvas.width = S
		canvas.height = S
	}
	const ctx = canvas.getContext('2d')
	if (!ctx) return
	ctx.clearRect(0, 0, S, S)

	// Soft coral-pink cheek blush
	for (const bx of [S * 0.27, S * 0.73]) {
		const blush = ctx.createRadialGradient(bx, S * 0.64, 6, bx, S * 0.64, 92)
		blush.addColorStop(0, expression === 'happy' ? 'rgba(244, 146, 158, 0.32)' : 'rgba(244, 146, 158, 0.22)')
		blush.addColorStop(1, 'rgba(255, 138, 152, 0)')
		ctx.fillStyle = blush
		ctx.beginPath()
		ctx.arc(bx, S * 0.64, 92, 0, Math.PI * 2)
		ctx.fill()
	}

	// Left & Right Anime Eyes
	drawAnimeEye(ctx, S * 0.305, S * 0.535, 216, 198, -1, blink, false)
	drawAnimeEye(ctx, S * 0.695, S * 0.535, 216, 198, 1, blink, expression === 'wink')

	// A warm, quiet nose accent follows the sculpted bridge.
	ctx.strokeStyle = 'rgba(180, 121, 123, 0.45)'
	ctx.lineWidth = 4
	ctx.lineCap = 'round'
	ctx.beginPath()
	ctx.moveTo(S * 0.5, S * 0.642)
	ctx.quadraticCurveTo(S * 0.49, S * 0.66, S * 0.505, S * 0.662)
	ctx.stroke()

	// Cute Chibi Mouth
	ctx.save()
	ctx.translate(S * 0.5, S * 0.735)
	if (expression === 'happy' || expression === 'wink') {
		// Happy open chibi D-smile
		ctx.fillStyle = '#f07b8e'
		ctx.strokeStyle = '#3b2432'
		ctx.lineWidth = 5
		ctx.lineJoin = 'round'
		ctx.beginPath()
		ctx.moveTo(-26, -4)
		ctx.quadraticCurveTo(0, 2, 26, -4)
		ctx.quadraticCurveTo(22, 28, 0, 28)
		ctx.quadraticCurveTo(-22, 28, -26, -4)
		ctx.closePath()
		ctx.fill()
		ctx.stroke()
	} else {
		// Gentle tiny smile from zenbot-master-trim.png
		ctx.strokeStyle = '#4a313b'
		ctx.lineWidth = 6.5
		ctx.lineCap = 'round'
		ctx.beginPath()
		ctx.moveTo(-22, -2)
		ctx.quadraticCurveTo(0, 13, 22, -2)
		ctx.stroke()
	}
	ctx.restore()
}

function createZenixChestTexture(): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	canvas.width = 512
	canvas.height = 256
	const ctx = canvas.getContext('2d')!
	// Navy inner top with crisp white chest band + "Zenix+" logo + waist belt
	ctx.fillStyle = '#1c243c'
	ctx.fillRect(0, 0, 512, 256)

	// Upper cyan V-collar lines
	ctx.strokeStyle = '#4ec4ff'
	ctx.lineWidth = 7
	ctx.beginPath()
	ctx.moveTo(256, 20)
	ctx.lineTo(212, 74)
	ctx.moveTo(256, 20)
	ctx.lineTo(300, 74)
	ctx.stroke()

	// White chest band
	ctx.fillStyle = '#f6f9ff'
	ctx.fillRect(0, 78, 512, 66)
	ctx.strokeStyle = '#161e34'
	ctx.lineWidth = 5
	ctx.strokeRect(0, 78, 512, 66)

	// Crisp "Zenix+" typography centered on front (u=0.5)
	ctx.fillStyle = '#141b30'
	ctx.font = 'bold 34px "Segoe UI", system-ui, sans-serif'
	ctx.textAlign = 'center'
	ctx.textBaseline = 'middle'
	ctx.fillText('Zenix✦', 256, 112)

	// White lower trim & belt buckle
	ctx.fillStyle = '#eef4fc'
	ctx.fillRect(0, 166, 512, 20)
	ctx.fillStyle = '#dce7f7'
	ctx.fillRect(0, 204, 512, 22)
	ctx.fillStyle = '#1c243c'
	ctx.fillRect(236, 202, 40, 26)
	ctx.strokeStyle = '#eef4fc'
	ctx.lineWidth = 4
	ctx.strokeRect(238, 204, 36, 22)
	return canvas
}

/* ---------- Helper Shape Builders for Accessories & Sneakers ---------- */

function build4PointStarMesh(outerR: number, innerR: number, depth: number): RawMesh {
	const pts: Array<[number, number]> = []
	for (let i = 0; i < 8; i++) {
		const angle = (i * Math.PI) / 4 + Math.PI / 2
		const r = i % 2 === 0 ? outerR : innerR
		pts.push([Math.cos(angle) * r, Math.sin(angle) * r])
	}
	return createExtrudedStarPolygonMesh({ points2D: pts, depth, bevel: 0.28 })
}

function buildCrescentMoonMesh(radius: number, thickness: number, depth: number): RawMesh {
	const steps = 16
	const pts: Array<[number, number]> = []
	// Outer arc from +125deg down to -125deg (opening facing left-up)
	const startA = -Math.PI * 0.72
	const endA = Math.PI * 0.72
	for (let i = 0; i <= steps; i++) {
		const a = startA + (i / steps) * (endA - startA)
		pts.push([Math.cos(a) * radius, Math.sin(a) * radius])
	}
	// Inner concave arc returning from endA to startA
	const innerOffset = radius * (1 - thickness)
	const innerR = radius * 0.84
	for (let i = steps - 1; i >= 1; i--) {
		const a = startA + (i / steps) * (endA - startA)
		pts.push([-innerOffset + Math.cos(a * 0.86) * innerR, Math.sin(a * 0.86) * innerR])
	}
	return createExtrudedStarPolygonMesh({
		points2D: pts,
		center2D: [radius * 0.55, 0],
		depth,
		bevel: 0.24
	})
}

function buildRibbonBowMesh(): RawMesh {
	// Left loop, right loop, left tail, right tail
	const leftLoop = transformMesh(
		createLatheMesh({
			profile: [
				[0.005, -0.05],
				[0.042, -0.025],
				[0.052, 0.015],
				[0.036, 0.048],
				[0.004, 0.06]
			],
			segments: 16,
			scaleX: 0.95,
			scaleZ: 0.52
		}),
		mat4Compose([-0.045, 0.01, 0], [0, 0, 1.18], [1, 1, 1])
	)
	const rightLoop = transformMesh(
		createLatheMesh({
			profile: [
				[0.005, -0.05],
				[0.042, -0.025],
				[0.052, 0.015],
				[0.036, 0.048],
				[0.004, 0.06]
			],
			segments: 16,
			scaleX: 0.95,
			scaleZ: 0.52
		}),
		mat4Compose([0.045, 0.01, 0], [0, 0, -1.18], [1, 1, 1])
	)
	const leftTail = createSweptStrandMesh({
		points: [
			[-0.01, 0.0, 0],
			[-0.042, -0.048, 0.005],
			[-0.068, -0.095, 0.01]
		],
		steps: 8,
		radialSegments: 8,
		width: 0.026,
		thickness: 0.012,
		taperPower: 0.45,
		rootBlunt: true
	})
	const rightTail = createSweptStrandMesh({
		points: [
			[0.01, 0.0, 0],
			[0.042, -0.048, 0.005],
			[0.068, -0.095, 0.01]
		],
		steps: 8,
		radialSegments: 8,
		width: 0.026,
		thickness: 0.012,
		taperPower: 0.45,
		rootBlunt: true
	})
	return mergeMeshes([leftLoop, rightLoop, leftTail, rightTail])
}

function buildSneakerParts(side: -1 | 1): ScenePart[] {
	const x = side * 0.138
	const yaw = side * 0.07 // Slight natural outward toe stance

	// 1. Vibrant Blue Treaded Outsole
	const sole = transformMesh(
		createLatheMesh({
			profile: [
				[0.002, -0.045],
				[0.105, -0.042],
				[0.114, -0.015],
				[0.108, 0.012],
				[0.002, 0.015]
			],
			segments: 24,
			scaleX: 0.88,
			scaleZ: 1.36
		}),
		mat4Compose([x, -1.075, 0.032], [0, yaw, 0], [1, 1, 1])
	)

	// 2. Dark Navy Midsole Trim & Heel Counter
	const navyShell = mergeMeshes([
		transformMesh(
			createLatheMesh({
				profile: [
					[0.002, -0.012],
					[0.105, -0.01],
					[0.102, 0.035],
					[0.088, 0.07],
					[0.002, 0.075]
				],
				segments: 24,
				scaleX: 0.86,
				scaleZ: 1.32
			}),
			mat4Compose([x, -1.045, 0.028], [0, yaw, 0], [1, 1, 1])
		),
		// High-top ankle collar cuff
		transformMesh(
			createLatheMesh({
				profile: [
					[0.072, -0.04],
					[0.088, 0.01],
					[0.092, 0.055],
					[0.076, 0.072],
					[0.052, 0.068]
				],
				segments: 22,
				scaleX: 0.92,
				scaleZ: 1.06
			}),
			mat4Compose([x, -0.955, 0.004], [0.08, yaw, 0], [1, 1, 1])
		)
	])

	// 3. Crisp White Toe Cap, Upper & Puffy High Tongue
	const whiteUpper = mergeMeshes([
		transformMesh(
			createLatheMesh({
				profile: [
					[0.002, -0.02],
					[0.096, -0.015],
					[0.098, 0.035],
					[0.078, 0.072],
					[0.002, 0.082]
				],
				segments: 24,
				scaleX: 0.84,
				scaleZ: 1.25
			}),
			mat4Compose([x, -1.015, 0.036], [0, yaw, 0], [1, 1, 1])
		),
		// Puffy white sneaker tongue in front
		transformMesh(
			createLatheMesh({
				profile: [
					[0.002, -0.04],
					[0.048, -0.02],
					[0.052, 0.045],
					[0.042, 0.082],
					[0.002, 0.09]
				],
				segments: 16,
				scaleX: 1.05,
				scaleZ: 0.55
			}),
			mat4Compose([x + Math.sin(yaw) * 0.04, -0.935, 0.062], [-0.22, yaw, 0], [1, 1, 1])
		)
	])

	// 4. Dual Blue Velcro Straps + Tongue Patch + Heel Pull Tab
	const straps = mergeMeshes([
		createSweptStrandMesh({
			points: [
				[x - 0.078, -0.975, 0.045],
				[x, -0.952, 0.125],
				[x + 0.078, -0.975, 0.045]
			],
			steps: 10,
			radialSegments: 8,
			width: 0.02,
			thickness: 0.014,
			rootBlunt: true,
			taperPower: 0.15
		}),
		createSweptStrandMesh({
			points: [
				[x - 0.074, -0.938, 0.028],
				[x, -0.916, 0.105],
				[x + 0.074, -0.938, 0.028]
			],
			steps: 10,
			radialSegments: 8,
			width: 0.019,
			thickness: 0.014,
			rootBlunt: true,
			taperPower: 0.15
		}),
		// Blue square patch on high white tongue
		transformMesh(
			createLatheMesh({
				profile: [
					[0.002, -0.02],
					[0.024, -0.018],
					[0.024, 0.018],
					[0.002, 0.02]
				],
				segments: 12,
				scaleX: 1.1,
				scaleZ: 0.45
			}),
			mat4Compose([x + Math.sin(yaw) * 0.05, -0.88, 0.082], [-0.2, yaw, 0], [1, 1, 1])
		)
	])

	return [
		{ id: `shoe_sole_${side}`, group: 'root', mesh: sole, material: CYAN_TRIM_MAT },
		{ id: `shoe_navy_${side}`, group: 'root', mesh: navyShell, material: NAVY_MAT },
		{ id: `shoe_white_${side}`, group: 'root', mesh: whiteUpper, material: WHITE_TECH_MAT },
		{ id: `shoe_straps_${side}`, group: 'root', mesh: straps, material: CYAN_TRIM_MAT }
	]
}

/* ---------- Complete 3D Chibi Zenbot Scene Builder ---------- */

export function buildZenbot3DScene(): {
	parts: ScenePart[]
	faceCanvas: HTMLCanvasElement
} {
	const faceCanvas = document.createElement('canvas')
	paintZenbotFaceCanvas(faceCanvas, 'neutral', 0)

	const chestCanvas = createZenixChestTexture()

	const parts: ScenePart[] = []

	// ==================== 1. SCULPTED 3D ANIME HEAD & EARS ====================
	const headMesh = createLatheMesh({
		profile: [
			[0.002, 0.025],
			[0.07, 0.034],
			[0.16, 0.062],
			[0.235, 0.108],
			[0.296, 0.17],
			[0.34, 0.245],
			[0.363, 0.325],
			[0.37, 0.405],
			[0.357, 0.485],
			[0.322, 0.565],
			[0.267, 0.635],
			[0.19, 0.69],
			[0.1, 0.725],
			[0.002, 0.742]
		],
		segments: 64,
		scaleX: 1.02,
		scaleZ: 0.93,
		frontProjectionUv: {
			yMin: 0.04,
			yMax: 0.66,
			halfAngle: 0.96
		}
	})

	// Sculpt the nose into the face itself so it stays seamless in profile.
	for (let i = 0; i < headMesh.positions.length; i += 3) {
		const x = headMesh.positions[i]
		const y = headMesh.positions[i + 1]
		const z = headMesh.positions[i + 2]
		if (z <= 0) continue
		const nose = 0.028 * Math.exp(-((x / 0.045) ** 2) - ((y - 0.255) / 0.06) ** 2)
		const muzzle = 0.008 * Math.exp(-((x / 0.13) ** 2) - ((y - 0.19) / 0.075) ** 2)
		headMesh.positions[i + 2] += nose + muzzle
	}
	headMesh.normals = recomputeSmoothNormals(headMesh.positions, headMesh.indices, true)

	// Small ears tucked into the temple locks.
	const leftEar = transformMesh(
		createLatheMesh({
			profile: [
				[0.002, -0.05],
				[0.048, -0.02],
				[0.052, 0.02],
				[0.002, 0.05]
			],
			segments: 14,
			scaleX: 0.55,
			scaleZ: 0.85
		}),
		mat4Compose([-0.365, 0.265, -0.01], [0, 0, 0.2], [1, 1, 1])
	)
	const rightEar = transformMesh(
		createLatheMesh({
			profile: [
				[0.002, -0.05],
				[0.048, -0.02],
				[0.052, 0.02],
				[0.002, 0.05]
			],
			segments: 14,
			scaleX: 0.55,
			scaleZ: 0.85
		}),
		mat4Compose([0.365, 0.265, -0.01], [0, 0, -0.2], [1, 1, 1])
	)

	parts.push({
		id: 'head_face',
		group: 'head',
		mesh: headMesh,
		material: {
			colorTop: SKIN_TOP,
			colorBot: SKIN_BOT,
			gradYRange: [0.02, 0.72],
			shadowTint: [0.93, 0.86, 0.86],
			outlineWidth: 0.009,
			outlineColor: INK_NAVY,
			specular: 0.12,
			rimStrength: 0.28,
			texture: faceCanvas
		}
	})

	parts.push({
		id: 'ears_neck',
		group: 'head',
		mesh: mergeMeshes([
			leftEar,
			rightEar,
			createLatheMesh({
				profile: [
					[0.088, -0.04],
					[0.084, 0.05]
				],
				segments: 20
			})
		]),
		material: {
			colorTop: SKIN_TOP,
			colorBot: SKIN_BOT,
			shadowTint: [0.9, 0.82, 0.83],
			outlineWidth: 0.014,
			outlineColor: INK_NAVY,
			specular: 0.1,
			rimStrength: 0.2
		}
	})

	// ==================== 2. 360° VOLUMETRIC 3D WAVY HAIR ====================
	const hairHeadMeshes: RawMesh[] = []
	const hairBackMeshes: RawMesh[] = []

	// 2a. Upper & Back Cranium Hair Cap (covers skull completely with lush thickness)
	hairHeadMeshes.push(
		transformMesh(
			createLatheMesh({
				profile: [
					[0.37, 0.18],
					[0.425, 0.3],
					[0.438, 0.44],
					[0.415, 0.57],
					[0.345, 0.68],
					[0.22, 0.755],
					[0.08, 0.788],
					[0.002, 0.795]
				],
				segments: 40,
				scaleX: 1.06,
				scaleZ: 0.99,
				// Keep the eyes clear while wrapping the temples and back of the skull.
				thetaStart: 0.94,
				thetaLength: Math.PI * 2 - 1.88
			}),
			mat4Compose([0, 0, -0.015], [0, 0, 0], [1, 1, 1])
		),
		// Top crown cap so top-down view is 100% seamless
		createLatheMesh({
			profile: [
				[0.39, 0.48],
				[0.355, 0.61],
				[0.255, 0.725],
				[0.11, 0.78],
				[0.002, 0.794]
			],
			segments: 36,
			scaleX: 1.05,
			scaleZ: 0.97
		})
	)

	// 2b. Short layered fringe with longer locks at the temples.
	const frontBangs: Array<{ pts: Vec3[]; w: number; th: number; out: Vec3 }> = [
		// Asymmetric center lock ends above the eyes.
		{
			pts: [
				[0.0, 0.75, 0.14],
				[0.025, 0.64, 0.34],
				[0.065, 0.52, 0.39],
				[0.042, 0.405, 0.38]
			],
			w: 0.095,
			th: 0.038,
			out: [0, 0.2, 1]
		},
		// Left inner bang sweeping left over inner brow
		{
			pts: [
				[-0.03, 0.75, 0.14],
				[-0.13, 0.65, 0.33],
				[-0.18, 0.54, 0.37],
				[-0.205, 0.435, 0.34]
			],
			w: 0.095,
			th: 0.045,
			out: [-0.25, 0.2, 1]
		},
		// Right inner bang sweeping right over inner brow
		{
			pts: [
				[0.03, 0.75, 0.14],
				[0.13, 0.65, 0.33],
				[0.21, 0.54, 0.35],
				[0.24, 0.425, 0.31]
			],
			w: 0.095,
			th: 0.045,
			out: [0.25, 0.2, 1]
		},
		// Left outer brow framing lock
		{
			pts: [
				[-0.1, 0.73, 0.1],
				[-0.28, 0.58, 0.28],
				[-0.35, 0.4, 0.26],
				[-0.345, 0.225, 0.21]
			],
			w: 0.082,
			th: 0.048,
			out: [-0.55, 0.15, 0.85]
		},
		// Right outer brow framing lock
		{
			pts: [
				[0.1, 0.73, 0.1],
				[0.28, 0.58, 0.28],
				[0.35, 0.4, 0.26],
				[0.35, 0.22, 0.2]
			],
			w: 0.082,
			th: 0.048,
			out: [0.55, 0.15, 0.85]
		},
		// Left cheek side-flare wisp
		{
			pts: [
				[-0.18, 0.68, 0.06],
				[-0.36, 0.46, 0.2],
				[-0.43, 0.26, 0.21],
				[-0.36, 0.12, 0.24]
			],
			w: 0.09,
			th: 0.046,
			out: [-0.8, 0.1, 0.6]
		},
		// Right cheek side-flare wisp + cute upward curl flick
		{
			pts: [
				[0.18, 0.68, 0.06],
				[0.37, 0.47, 0.2],
				[0.46, 0.32, 0.19],
				[0.53, 0.35, 0.16]
			],
			w: 0.082,
			th: 0.042,
			out: [0.85, 0.2, 0.5]
		}
	]

	for (const b of frontBangs) {
		hairHeadMeshes.push(
			createSweptStrandMesh({
				points: b.pts,
				steps: 20,
				radialSegments: 10,
				width: b.w,
				thickness: b.th,
				ridge: 0.18,
				taperPower: 0.78,
				outwardHint: b.out
			})
		)
	}

	// 2c. Signature Front-Shoulder S-Curl Side Locks (curling inward beside headphones!)
	for (const side of [-1, 1] as const) {
		hairHeadMeshes.push(
			createSweptStrandMesh({
				points: [
					[side * 0.28, 0.58, 0.08],
					[side * 0.41, 0.32, 0.16],
					[side * 0.39, 0.08, 0.2],
					[side * 0.31, -0.1, 0.22],
					[side * 0.38, -0.15, 0.24],
					[side * 0.43, -0.07, 0.25]
				],
				steps: 26,
				radialSegments: 10,
				width: 0.092,
				thickness: 0.054,
				ridge: 0.3,
				taperPower: 0.68,
				outwardHint: [side * 0.65, 0, 0.75]
			})
		)
	}

	// 2d. Inner Volumetric Back-Hair Canopy + 20 Multi-Tiered 360° Cascading Wavy Locks!
	// Ensures rich, zero-gap 3D volume from 90deg profile AND 180deg full back view!
	hairBackMeshes.push(
		transformMesh(
			createLatheMesh({
				profile: [
					[0.36, -0.46],
					[0.47, -0.26],
					[0.45, -0.02],
					[0.42, 0.24],
					[0.41, 0.48],
					[0.31, 0.68],
					[0.08, 0.76]
				],
				segments: 34,
				scaleX: 1.18,
				scaleZ: 0.95,
				thetaStart: 1.05,
				thetaLength: Math.PI * 2 - 2.1,
				pleats: { count: 9, amp: 0.06 }
			}),
			mat4Compose([0, 0, -0.05], [0, 0, 0], [1, 1, 1])
		)
	)

	// Tier 1: 11 wide sweeping bell-cloud locks around sides & full back (-118deg .. +118deg around back)
	const tier1Count = 11
	for (let i = 0; i < tier1Count; i++) {
		const frac = i / (tier1Count - 1) // 0..1 from left-side-back around 180deg to right-side-back
		const az = Math.PI + (frac - 0.5) * 2 * 1.98 // spans ~226deg around back & sides!
		const sinA = Math.sin(az)
		const cosA = Math.cos(az)
		const sideSign = sinA >= 0 ? 1 : -1
		const curlAlt = i % 2 === 0 ? 1 : -1
		const lenBoost = 1 - Math.abs(frac - 0.5) * 0.14

		hairBackMeshes.push(
			createSweptStrandMesh({
				points: [
					[sinA * 0.24, 0.68, cosA * 0.22 - 0.02],
					[sinA * 0.43, 0.4, cosA * 0.39 - 0.03],
					[sinA * 0.52, 0.08, cosA * 0.44 - 0.05],
					[sinA * 0.66, -0.24 * lenBoost, cosA * 0.5 - 0.06],
					[sinA * 0.74 + sideSign * 0.05, -0.5 * lenBoost, cosA * 0.52 - 0.05],
					[sinA * (0.67 + curlAlt * 0.07) + sideSign * 0.08, -0.64 * lenBoost, cosA * 0.47 - 0.03]
				],
				steps: 26,
				radialSegments: 10,
				width: 0.155,
				thickness: 0.078,
				ridge: 0.35,
				taperPower: 0.65,
				outwardHint: [sinA, 0.05, cosA]
			})
		)
	}

	// Tier 2: 10 outer S-curled accent locks creating Zenbot's buoyant curled tips!
	const tier2Count = 10
	for (let i = 0; i < tier2Count; i++) {
		const frac = i / (tier2Count - 1)
		const az = Math.PI + (frac - 0.5) * 2 * 2.08
		const sinA = Math.sin(az)
		const cosA = Math.cos(az)
		const outwardCurl = i % 2 === 0 ? 1 : -0.6

		hairBackMeshes.push(
			createSweptStrandMesh({
				points: [
					[sinA * 0.31, 0.56, cosA * 0.28],
					[sinA * 0.49, 0.24, cosA * 0.43],
					[sinA * 0.62, -0.06, cosA * 0.49],
					[sinA * 0.76, -0.34, cosA * 0.55],
					[sinA * (0.83 + 0.05 * outwardCurl), -0.52, cosA * 0.56],
					[sinA * (0.76 + 0.1 * outwardCurl), -0.44 - (i % 2) * 0.16, cosA * 0.52]
				],
				steps: 24,
				radialSegments: 10,
				width: 0.115,
				thickness: 0.062,
				ridge: 0.38,
				taperPower: 0.72,
				outwardHint: [sinA, 0.12, cosA]
			})
		)
	}

	parts.push({
		id: 'hair_head',
		group: 'head',
		mesh: mergeMeshes(hairHeadMeshes),
		material: { ...HAIR_MAT, outlineWidth: 0.01, specular: 0.32 }
	})

	parts.push({
		id: 'hair_back_waves',
		group: 'hairBack',
		mesh: mergeMeshes(hairBackMeshes),
		material: HAIR_MAT
	})

	// 2e. Top Ahoge Loop (animated spring cowlick!)
	parts.push({
		id: 'hair_ahoge',
		group: 'ahoge',
		mesh: createSweptStrandMesh({
			points: [
				[0.045, 0.77, 0.02],
				[0.07, 0.9, 0.025],
				[-0.015, 0.96, 0.03],
				[-0.085, 0.92, 0.035],
				[-0.07, 0.855, 0.035]
			],
			steps: 22,
			radialSegments: 10,
			width: 0.027,
			thickness: 0.018,
			ridge: 0.3,
			taperPower: 0.68,
			outwardHint: [0, 0, 1]
		}),
		material: { ...HAIR_MAT, outlineWidth: 0.008 }
	})

	// ==================== 3. 3D HAIR ORNAMENTS (Star + Bow + Twin Moons) ====================
	// Viewer-Left (x < 0): 4-point ice-star + blue ribbon bow + tiny white center star
	const bigStar = transformMesh(
		build4PointStarMesh(0.088, 0.028, 0.038),
		mat4Compose([-0.355, 0.51, 0.255], [-0.18, -0.52, 0.14], [1, 1, 1])
	)
	const miniBowStar = transformMesh(
		build4PointStarMesh(0.028, 0.011, 0.026),
		mat4Compose([-0.405, 0.365, 0.278], [-0.1, -0.55, 0.08], [1, 1, 1])
	)
	const blueBow = transformMesh(
		buildRibbonBowMesh(),
		mat4Compose([-0.395, 0.365, 0.252], [-0.1, -0.55, 0.12], [1.12, 1.12, 1.12])
	)

	// Viewer-Right (x > 0): Twin Crescent Moons
	const upperMoon = transformMesh(
		buildCrescentMoonMesh(0.082, 0.42, 0.036),
		mat4Compose([0.285, 0.72, 0.145], [-0.14, 0.36, 2.35], [1, 1, 1])
	)
	const lowerMoon = transformMesh(
		buildCrescentMoonMesh(0.108, 0.44, 0.04),
		mat4Compose([0.4, 0.545, 0.195], [-0.12, 0.48, 2.15], [1, 1, 1])
	)

	parts.push({
		id: 'ornaments_ice',
		group: 'head',
		mesh: mergeMeshes([bigStar, miniBowStar, upperMoon, lowerMoon]),
		material: {
			colorTop: [0.97, 0.99, 1.0],
			colorBot: [0.62, 0.87, 1.0],
			gradYRange: [0.32, 0.78],
			shadowTint: [0.8, 0.88, 0.98],
			outlineWidth: 0.014,
			outlineColor: INK_NAVY,
			specular: 0.65,
			rimStrength: 0.55
		}
	})

	parts.push({
		id: 'ornament_bow',
		group: 'head',
		mesh: blueBow,
		material: CYAN_TRIM_MAT
	})

	// ==================== 4. 3D NECK HEADPHONES & CHOKER GEM ====================
	const neckBand = createSweptStrandMesh({
		points: [
			[-0.14, 0.015, 0.11],
			[-0.185, 0.02, -0.02],
			[0, 0.025, -0.15],
			[0.185, 0.02, -0.02],
			[0.14, 0.015, 0.11]
		],
		steps: 18,
		radialSegments: 8,
		width: 0.036,
		thickness: 0.024,
		rootBlunt: true,
		taperPower: 0.05,
		outwardHint: [0, 1, 0]
	})

	const headphoneCups: RawMesh[] = [neckBand]
	const headphoneLeds: RawMesh[] = []

	for (const side of [-1, 1] as const) {
		headphoneCups.push(
			transformMesh(
				createLatheMesh({
					profile: [
						[0.002, -0.032],
						[0.068, -0.03],
						[0.074, 0.0],
						[0.066, 0.03],
						[0.002, 0.034]
					],
					segments: 22
				}),
				mat4Compose([side * 0.128, 0.012, 0.148], [Math.PI / 2 - 0.12, side * 0.42, 0], [1, 1, 1])
			)
		)
		headphoneLeds.push(
			transformMesh(
				createLatheMesh({
					profile: [
						[0.034, 0.031],
						[0.052, 0.035],
						[0.034, 0.037]
					],
					segments: 22
				}),
				mat4Compose([side * 0.128, 0.012, 0.148], [Math.PI / 2 - 0.12, side * 0.42, 0], [1, 1, 1])
			)
		)
	}

	// Throat choker gem
	headphoneLeds.push(
		transformMesh(build4PointStarMesh(0.034, 0.015, 0.024), mat4Compose([0, -0.028, 0.148], [0, 0, 0], [1, 1, 1]))
	)

	parts.push({
		id: 'headphones_body',
		group: 'root',
		mesh: mergeMeshes(headphoneCups),
		material: NAVY_MAT
	})

	parts.push({
		id: 'headphones_led',
		group: 'root',
		mesh: mergeMeshes(headphoneLeds),
		material: GLOW_LED_MAT
	})

	// ==================== 5. ZENIX+ INNER TOP & CROPPED TECHWEAR JACKET ====================
	// 5a. Inner fitted torso with Zenix+ chest band & waist belt
	const innerTorso = createLatheMesh({
		profile: [
			[0.165, -0.32],
			[0.155, -0.25],
			[0.168, -0.15],
			[0.162, -0.06],
			[0.125, 0.01]
		],
		segments: 34,
		scaleX: 1.06,
		scaleZ: 0.84,
		frontProjectionUv: {
			yMin: -0.31,
			yMax: 0.0,
			halfAngle: 1.15
		}
	})

	parts.push({
		id: 'torso_zenix',
		group: 'root',
		mesh: innerTorso,
		material: {
			colorTop: [0.12, 0.155, 0.26],
			colorBot: [0.1, 0.13, 0.22],
			shadowTint: [0.78, 0.82, 0.92],
			outlineWidth: 0.014,
			outlineColor: INK_NAVY,
			specular: 0.2,
			rimStrength: 0.3,
			texture: chestCanvas
		}
	})

	// 5b. Open Cropped White/Navy Techwear Jacket Shell (wraps 296deg around sides & back, open 64deg in front!)
	const jacketWhiteShell = createLatheMesh({
		profile: [
			[0.248, -0.365],
			[0.236, -0.26],
			[0.215, -0.14],
			[0.195, -0.04],
			[0.168, 0.018]
		],
		segments: 34,
		scaleX: 1.08,
		scaleZ: 0.9,
		thetaStart: 0.56,
		thetaLength: Math.PI * 2 - 1.12
	})

	// Crisp front lapel strips & collar stand
	const lapels: RawMesh[] = [jacketWhiteShell]
	const jacketNavyPanels: RawMesh[] = []
	const jacketCyanTrim: RawMesh[] = []

	for (const side of [-1, 1] as const) {
		// Thick sculpted white front lapel vertical panel
		lapels.push(
			createSweptStrandMesh({
				points: [
					[side * 0.115, 0.005, 0.138],
					[side * 0.125, -0.12, 0.168],
					[side * 0.138, -0.25, 0.185],
					[side * 0.15, -0.365, 0.195]
				],
				steps: 14,
				radialSegments: 8,
				width: 0.056,
				thickness: 0.028,
				rootBlunt: true,
				taperPower: 0.06,
				outwardHint: [side * 0.25, 0, 1]
			})
		)

		// Cyan glowing lapel circuit stripe
		jacketCyanTrim.push(
			createSweptStrandMesh({
				points: [
					[side * 0.128, -0.02, 0.156],
					[side * 0.142, -0.18, 0.188],
					[side * 0.158, -0.355, 0.205]
				],
				steps: 12,
				radialSegments: 6,
				width: 0.012,
				thickness: 0.012,
				rootBlunt: true,
				taperPower: 0.05,
				outwardHint: [side * 0.25, 0, 1]
			})
		)

		// 3D Puffed Techwear Sleeves (navy inner + white shoulder stripe + cyan cuff!)
		jacketNavyPanels.push(
			createSweptStrandMesh({
				points: [
					[side * 0.175, -0.035, 0.01],
					[side * 0.285, -0.14, 0.03],
					[side * 0.375, -0.265, 0.055],
					[side * 0.425, -0.365, 0.075]
				],
				steps: 18,
				radialSegments: 12,
				width: 0.094,
				thickness: 0.084,
				ridge: 0.12,
				rootBlunt: true,
				taperPower: 0.12,
				outwardHint: [side, 0.2, 0.35]
			})
		)

		// White outer sleeve tech stripe
		lapels.push(
			createSweptStrandMesh({
				points: [
					[side * 0.185, -0.02, 0.025],
					[side * 0.31, -0.125, 0.05],
					[side * 0.398, -0.255, 0.075],
					[side * 0.435, -0.34, 0.09]
				],
				steps: 14,
				radialSegments: 8,
				width: 0.038,
				thickness: 0.026,
				rootBlunt: true,
				taperPower: 0.15,
				outwardHint: [side, 0.35, 0.35]
			})
		)

		// Cyan sleeve cuff ring
		jacketCyanTrim.push(
			transformMesh(
				createLatheMesh({
					profile: [
						[0.064, -0.022],
						[0.074, 0.0],
						[0.068, 0.022]
					],
					segments: 18
				}),
				mat4Compose([side * 0.432, -0.372, 0.078], [-0.18, 0, side * 0.62], [1, 1, 1])
			)
		)

		// Cute 3D Chibi Hands + Little Thumb
		const palm = transformMesh(
			createLatheMesh({
				profile: [
					[0.002, -0.048],
					[0.046, -0.03],
					[0.052, 0.005],
					[0.042, 0.04],
					[0.002, 0.048]
				],
				segments: 16,
				scaleX: 1.05,
				scaleZ: 0.78
			}),
			mat4Compose([side * 0.462, -0.422, 0.092], [-0.2, 0, side * 0.52], [1, 1, 1])
		)
		const thumb = transformMesh(
			createLatheMesh({
				profile: [
					[0.002, -0.022],
					[0.02, -0.005],
					[0.018, 0.015],
					[0.002, 0.024]
				],
				segments: 10
			}),
			mat4Compose([side * 0.422, -0.425, 0.118], [0.3, 0, -side * 0.6], [1, 1, 1])
		)
		parts.push({
			id: `hand_${side}`,
			group: 'root',
			mesh: mergeMeshes([palm, thumb]),
			material: {
				colorTop: SKIN_TOP,
				colorBot: SKIN_BOT,
				shadowTint: [0.92, 0.84, 0.85],
				outlineWidth: 0.013,
				outlineColor: INK_NAVY,
				specular: 0.1,
				rimStrength: 0.25
			}
		})
	}

	// Navy back cyber yoke on the jacket
	jacketNavyPanels.push(
		createLatheMesh({
			profile: [
				[0.252, -0.28],
				[0.224, -0.14],
				[0.2, -0.03]
			],
			segments: 24,
			scaleX: 1.09,
			scaleZ: 0.91,
			thetaStart: Math.PI - 1.05,
			thetaLength: 2.1
		})
	)

	parts.push({ id: 'jacket_white', group: 'root', mesh: mergeMeshes(lapels), material: WHITE_TECH_MAT })
	parts.push({ id: 'jacket_navy', group: 'root', mesh: mergeMeshes(jacketNavyPanels), material: NAVY_MAT })
	parts.push({ id: 'jacket_cyan', group: 'root', mesh: mergeMeshes(jacketCyanTrim), material: CYAN_TRIM_MAT })

	// ==================== 6. 3D 14-PLEAT A-LINE SKIRT + WHITE RUFFLE ====================
	const pleatedSkirt = createLatheMesh({
		profile: [
			[0.345, -0.535],
			[0.305, -0.45],
			[0.245, -0.36],
			[0.178, -0.28]
		],
		segments: 56,
		scaleX: 1.05,
		scaleZ: 0.94,
		pleats: { count: 14, amp: 0.068 }
	})

	const skirtCyanHem = createLatheMesh({
		profile: [
			[0.336, -0.522],
			[0.326, -0.504]
		],
		segments: 56,
		scaleX: 1.055,
		scaleZ: 0.945,
		pleats: { count: 14, amp: 0.068 }
	})

	const whitePetticoatRuffle = createLatheMesh({
		profile: [
			[0.08, -0.575],
			[0.362, -0.575],
			[0.348, -0.525],
			[0.29, -0.49]
		],
		segments: 56,
		scaleX: 1.05,
		scaleZ: 0.94,
		pleats: { count: 18, amp: 0.055 }
	})

	parts.push({ id: 'skirt_navy', group: 'root', mesh: pleatedSkirt, material: NAVY_MAT })
	parts.push({ id: 'skirt_cyan_line', group: 'root', mesh: skirtCyanHem, material: CYAN_TRIM_MAT })
	parts.push({ id: 'skirt_ruffle', group: 'root', mesh: whitePetticoatRuffle, material: WHITE_TECH_MAT })

	// ==================== 7. 3D TIGHTS LEGS & CHUNKY SNEAKERS ====================
	const legsMeshes: RawMesh[] = []
	for (const side of [-1, 1] as const) {
		legsMeshes.push(
			createSweptStrandMesh({
				points: [
					[side * 0.118, -0.52, 0.0],
					[side * 0.132, -0.68, 0.012],
					[side * 0.135, -0.82, 0.008],
					[side * 0.138, -0.95, 0.004]
				],
				steps: 14,
				radialSegments: 14,
				width: 0.074,
				thickness: 0.072,
				ridge: 0.0,
				rootBlunt: true,
				taperPower: 0.12,
				outwardHint: [0, 0, 1]
			})
		)
		parts.push(...buildSneakerParts(side))
	}

	parts.push({ id: 'legs_tights', group: 'root', mesh: mergeMeshes(legsMeshes), material: TIGHTS_MAT })

	// ==================== 8. 3D TURNTABLE HOLOGRAM RING PEDESTAL ====================
	const pedestalRing = createLatheMesh({
		profile: [
			[0.37, -1.118],
			[0.415, -1.114],
			[0.415, -1.106],
			[0.37, -1.102],
			[0.37, -1.118]
		],
		segments: 48
	})

	parts.push({
		id: 'turntable_ring',
		group: 'root',
		mesh: pedestalRing,
		material: {
			colorTop: [0.42, 0.86, 1.0],
			colorBot: [0.2, 0.62, 0.96],
			outlineWidth: 0,
			specular: 0.6,
			rimStrength: 0.8,
			emissive: 0.65
		}
	})

	return { parts, faceCanvas }
}

/* ---------- High-Level Turntable Controller ---------- */

export interface Zenbot3DTurntableController {
	renderFrame: (params: {
		yawRad: number
		pitchRad: number
		timeSec: number
		active?: boolean
		accentRgb?: [number, number, number]
	}) => void
	setExpression: (expr: Zenbot3DExpression) => void
	resize: (width: number, height: number, dpr?: number) => void
	dispose: () => void
}

export function mountZenbot3DTurntable(canvas: HTMLCanvasElement): Zenbot3DTurntableController {
	const { parts, faceCanvas } = buildZenbot3DScene()
	const renderer = createZenbot3DRenderer(canvas, parts)

	let expression: Zenbot3DExpression = 'neutral'
	let lastFaceKey = 'neutral:0'
	let blinkAge = 9
	let blinkNext = 2.4
	let prevTime = 0

	const renderFrame: Zenbot3DTurntableController['renderFrame'] = ({
		yawRad,
		pitchRad,
		timeSec,
		active = false,
		accentRgb = [56, 189, 248]
	}) => {
		const dt = prevTime > 0 ? Math.min(0.05, Math.max(0, timeSec - prevTime)) : 0.016
		prevTime = timeSec

		blinkAge += dt
		blinkNext -= dt
		if (blinkNext <= 0) {
			blinkAge = 0
			blinkNext = 2.6 + Math.random() * 2.5
		}
		const blink = blinkAge < 0.14 ? Math.sin((Math.PI * blinkAge) / 0.14) : 0
		const activeExpr: Zenbot3DExpression = active && expression === 'neutral' ? 'happy' : expression
		const faceKey = `${activeExpr}:${Math.round(blink * 8)}`
		if (faceKey !== lastFaceKey) {
			lastFaceKey = faceKey
			paintZenbotFaceCanvas(faceCanvas, activeExpr, blink)
			renderer.updatePartTexture('head_face', faceCanvas)
		}

		// Subtle 3D idle animations (gentle breathing, head tilt, ahoge & hair wave!)
		const breath = Math.sin((timeSec * Math.PI * 2) / 3.8)
		const sway = Math.sin(timeSec * 2.1)

		const groupTransforms = {
			root: mat4Compose([0, breath * 0.012, 0], [0, 0, 0], [1, 1, 1]),
			head: mat4Compose([0, breath * 0.016, 0], [breath * 0.02, sway * 0.035, sway * 0.02], [1, 1, 1]),
			hairBack: mat4Compose([0, breath * 0.014, 0], [-breath * 0.018, sway * 0.025, -sway * 0.015], [1, 1, 1]),
			ahoge: mat4Compose([0, breath * 0.018, 0], [0, 0, Math.sin(timeSec * 3.4) * 0.08], [1, 1, 1])
		}

		renderer.render({
			yaw: yawRad,
			pitch: pitchRad,
			groupTransforms,
			accentRgb
		})
	}

	return {
		renderFrame,
		setExpression(next) {
			expression = next
		},
		resize: renderer.resize,
		dispose: renderer.dispose
	}
}
