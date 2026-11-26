export type Vec3 = [number, number, number]

export interface RawMesh {
	positions: Float32Array
	normals: Float32Array
	uvs: Float32Array
	indices: Uint32Array
}

/* ---------- 3D Vector & 4x4 Matrix Math (Column-Major for WebGL) ---------- */

export function v3Add(a: Vec3, b: Vec3): Vec3 {
	return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

export function v3Sub(a: Vec3, b: Vec3): Vec3 {
	return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

export function v3Scale(a: Vec3, s: number): Vec3 {
	return [a[0] * s, a[1] * s, a[2] * s]
}

export function v3Cross(a: Vec3, b: Vec3): Vec3 {
	return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

export function v3Dot(a: Vec3, b: Vec3): number {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function v3Normalize(a: Vec3): Vec3 {
	const len = Math.hypot(a[0], a[1], a[2])
	return len > 1e-8 ? [a[0] / len, a[1] / len, a[2] / len] : [0, 1, 0]
}

export function mat4Identity(): Float32Array {
	const m = new Float32Array(16)
	m[0] = m[5] = m[10] = m[15] = 1
	return m
}

export function mat4Multiply(a: Float32Array, b: Float32Array): Float32Array {
	const out = new Float32Array(16)
	for (let col = 0; col < 4; col++) {
		const b0 = b[col * 4]
		const b1 = b[col * 4 + 1]
		const b2 = b[col * 4 + 2]
		const b3 = b[col * 4 + 3]
		out[col * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3
		out[col * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3
		out[col * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3
		out[col * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3
	}
	return out
}

export function mat4Perspective(fovYRad: number, aspect: number, near: number, far: number): Float32Array {
	const f = 1 / Math.tan(fovYRad / 2)
	const nf = 1 / (near - far)
	const out = new Float32Array(16)
	out[0] = f / aspect
	out[5] = f
	out[10] = (far + near) * nf
	out[11] = -1
	out[14] = 2 * far * near * nf
	return out
}

export function mat4LookAt(eye: Vec3, target: Vec3, up: Vec3): Float32Array {
	const z = v3Normalize(v3Sub(eye, target))
	const x = v3Normalize(v3Cross(up, z))
	const y = v3Cross(z, x)
	const out = new Float32Array(16)
	out[0] = x[0]
	out[1] = y[0]
	out[2] = z[0]
	out[4] = x[1]
	out[5] = y[1]
	out[6] = z[1]
	out[8] = x[2]
	out[9] = y[2]
	out[10] = z[2]
	out[12] = -v3Dot(x, eye)
	out[13] = -v3Dot(y, eye)
	out[14] = -v3Dot(z, eye)
	out[15] = 1
	return out
}

export function mat4Compose(
	translate: Vec3 = [0, 0, 0],
	rotXYZ: Vec3 = [0, 0, 0],
	scale: Vec3 = [1, 1, 1]
): Float32Array {
	const [rx, ry, rz] = rotXYZ
	const cx = Math.cos(rx), sx = Math.sin(rx)
	const cy = Math.cos(ry), sy = Math.sin(ry)
	const cz = Math.cos(rz), sz = Math.sin(rz)

	// R = Ry * Rx * Rz
	const r00 = cy * cz + sy * sx * sz
	const r01 = -cy * sz + sy * sx * cz
	const r02 = sy * cx
	const r10 = cx * sz
	const r11 = cx * cz
	const r12 = -sx
	const r20 = -sy * cz + cy * sx * sz
	const r21 = sy * sz + cy * sx * cz
	const r22 = cy * cx

	const out = new Float32Array(16)
	out[0] = r00 * scale[0]
	out[1] = r10 * scale[0]
	out[2] = r20 * scale[0]
	out[4] = r01 * scale[1]
	out[5] = r11 * scale[1]
	out[6] = r21 * scale[1]
	out[8] = r02 * scale[2]
	out[9] = r12 * scale[2]
	out[10] = r22 * scale[2]
	out[12] = translate[0]
	out[13] = translate[1]
	out[14] = translate[2]
	out[15] = 1
	return out
}

export function transformMesh(mesh: RawMesh, matrix: Float32Array): RawMesh {
	const count = mesh.positions.length / 3
	const positions = new Float32Array(mesh.positions.length)
	const normals = new Float32Array(mesh.normals.length)

	// Extract upper-left 3x3 inverse-transpose for accurate normal transformation under non-uniform scale
	const m00 = matrix[0], m01 = matrix[4], m02 = matrix[8]
	const m10 = matrix[1], m11 = matrix[5], m12 = matrix[9]
	const m20 = matrix[2], m21 = matrix[6], m22 = matrix[10]

	const c00 = m11 * m22 - m12 * m21
	const c01 = m12 * m20 - m10 * m22
	const c02 = m10 * m21 - m11 * m20
	const c10 = m02 * m21 - m01 * m22
	const c11 = m00 * m22 - m02 * m20
	const c12 = m01 * m20 - m00 * m21
	const c20 = m01 * m12 - m02 * m11
	const c21 = m02 * m10 - m00 * m12
	const c22 = m00 * m11 - m01 * m10
	const det = m00 * c00 + m01 * c01 + m02 * c02

	for (let i = 0; i < count; i++) {
		const x = mesh.positions[i * 3]
		const y = mesh.positions[i * 3 + 1]
		const z = mesh.positions[i * 3 + 2]
		positions[i * 3] = m00 * x + m01 * y + m02 * z + matrix[12]
		positions[i * 3 + 1] = m10 * x + m11 * y + m12 * z + matrix[13]
		positions[i * 3 + 2] = m20 * x + m21 * y + m22 * z + matrix[14]

		const nx = mesh.normals[i * 3]
		const ny = mesh.normals[i * 3 + 1]
		const nz = mesh.normals[i * 3 + 2]
		const tnx = c00 * nx + c01 * ny + c02 * nz
		const tny = c10 * nx + c11 * ny + c12 * nz
		const tnz = c20 * nx + c21 * ny + c22 * nz
		const n = v3Normalize(det < 0 ? [-tnx, -tny, -tnz] : [tnx, tny, tnz])
		normals[i * 3] = n[0]
		normals[i * 3 + 1] = n[1]
		normals[i * 3 + 2] = n[2]
	}

	const indices = new Uint32Array(mesh.indices.length)
	if (det < 0) {
		// Mirroring flips triangle winding: swap v1 & v2 to keep CCW front faces
		for (let i = 0; i < mesh.indices.length; i += 3) {
			indices[i] = mesh.indices[i]
			indices[i + 1] = mesh.indices[i + 2]
			indices[i + 2] = mesh.indices[i + 1]
		}
	} else {
		indices.set(mesh.indices)
	}

	return {
		positions,
		normals,
		uvs: new Float32Array(mesh.uvs),
		indices
	}
}

export function mergeMeshes(meshes: RawMesh[]): RawMesh {
	let totalVerts = 0
	let totalIndices = 0
	for (const m of meshes) {
		totalVerts += m.positions.length / 3
		totalIndices += m.indices.length
	}
	const positions = new Float32Array(totalVerts * 3)
	const normals = new Float32Array(totalVerts * 3)
	const uvs = new Float32Array(totalVerts * 2)
	const indices = new Uint32Array(totalIndices)

	let vOffset = 0
	let iOffset = 0
	for (const m of meshes) {
		positions.set(m.positions, vOffset * 3)
		normals.set(m.normals, vOffset * 3)
		uvs.set(m.uvs, vOffset * 2)
		for (let i = 0; i < m.indices.length; i++) {
			indices[iOffset + i] = m.indices[i] + vOffset
		}
		vOffset += m.positions.length / 3
		iOffset += m.indices.length
	}
	return { positions, normals, uvs, indices }
}

export function recomputeSmoothNormals(positions: Float32Array, indices: Uint32Array, weldSeams = false): Float32Array {
	const count = positions.length / 3
	const normals = new Float32Array(positions.length)

	for (let i = 0; i < indices.length; i += 3) {
		const i0 = indices[i]
		const i1 = indices[i + 1]
		const i2 = indices[i + 2]
		const p0: Vec3 = [positions[i0 * 3], positions[i0 * 3 + 1], positions[i0 * 3 + 2]]
		const p1: Vec3 = [positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]]
		const p2: Vec3 = [positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]]
		const fn = v3Cross(v3Sub(p1, p0), v3Sub(p2, p0))
		for (const idx of [i0, i1, i2]) {
			normals[idx * 3] += fn[0]
			normals[idx * 3 + 1] += fn[1]
			normals[idx * 3 + 2] += fn[2]
		}
	}

	if (weldSeams) {
		// Average normals at coincident seam vertices so UV seams never split inverted-hull outlines!
		const buckets = new Map<string, number[]>()
		for (let i = 0; i < count; i++) {
			const key = `${Math.round(positions[i * 3] * 2000)},${Math.round(positions[i * 3 + 1] * 2000)},${Math.round(positions[i * 3 + 2] * 2000)}`
			let list = buckets.get(key)
			if (!list) {
				list = []
				buckets.set(key, list)
			}
			list.push(i)
		}
		for (const list of buckets.values()) {
			if (list.length < 2) continue
			let sx = 0, sy = 0, sz = 0
			for (const idx of list) {
				sx += normals[idx * 3]
				sy += normals[idx * 3 + 1]
				sz += normals[idx * 3 + 2]
			}
			for (const idx of list) {
				normals[idx * 3] = sx
				normals[idx * 3 + 1] = sy
				normals[idx * 3 + 2] = sz
			}
		}
	}

	for (let i = 0; i < count; i++) {
		const n = v3Normalize([normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]])
		normals[i * 3] = n[0]
		normals[i * 3 + 1] = n[1]
		normals[i * 3 + 2] = n[2]
	}
	return normals
}

/* ---------- Sculpted 3D Geometry Builders ---------- */

/**
 * Builds a revolved 3D lathe mesh around the Y axis (angle 0 faces +Z!).
 * Supports elliptical (scaleX, scaleZ), partial arcs (thetaStart..thetaEnd) for open jackets,
 * and radial pleat modulation (e.g. 14-pleat skirt!).
 */
export function createLatheMesh(options: {
	profile: Array<[number, number]> // [radius, y] from bottom to top
	segments?: number
	scaleX?: number
	scaleZ?: number
	thetaStart?: number
	thetaLength?: number
	pleats?: { count: number; amp: number }
	capEnds?: boolean
	frontProjectionUv?: { yMin: number; yMax: number; halfAngle: number }
}): RawMesh {
	const {
		profile,
		segments = 40,
		scaleX = 1,
		scaleZ = 1,
		thetaStart = -Math.PI,
		thetaLength = Math.PI * 2,
		pleats,
		capEnds = false,
		frontProjectionUv
	} = options

	const rows = profile.length
	const cols = segments
	const fullCircle = Math.abs(thetaLength - Math.PI * 2) < 1e-4

	const posList: number[] = []
	const uvList: number[] = []
	const idxList: number[] = []

	for (let r = 0; r < rows; r++) {
		const [baseRadius, y] = profile[r]
		const vDefault = rows > 1 ? r / (rows - 1) : 0.5
		for (let c = 0; c <= cols; c++) {
			const uFrac = c / cols
			const theta = thetaStart + uFrac * thetaLength
			const pleatMul = pleats && baseRadius > 1e-4 ? 1 + pleats.amp * Math.cos(pleats.count * theta) : 1
			const rad = baseRadius * pleatMul
			const x = rad * Math.sin(theta) * scaleX
			const z = rad * Math.cos(theta) * scaleZ
			posList.push(x, y, z)

			if (frontProjectionUv) {
				// theta=0 is front (+Z). Map [-halfAngle..+halfAngle] -> u [0..1]
				const u = 0.5 + theta / (frontProjectionUv.halfAngle * 2)
				const v = 1 - (y - frontProjectionUv.yMin) / Math.max(1e-4, frontProjectionUv.yMax - frontProjectionUv.yMin)
				uvList.push(Math.max(0.002, Math.min(0.998, u)), Math.max(0.002, Math.min(0.998, v)))
			} else {
				uvList.push(uFrac, 1 - vDefault)
			}
		}
	}

	const stride = cols + 1
	for (let r = 0; r < rows - 1; r++) {
		for (let c = 0; c < cols; c++) {
			const a = r * stride + c
			const b = a + 1
			const d = (r + 1) * stride + c
			const e = d + 1
			// Profile goes bottom->top, theta goes -PI->+PI: (a, b, e) & (a, e, d) face outward CCW!
			idxList.push(a, b, e, a, e, d)
		}
	}

	if (!fullCircle && capEnds) {
		// Solid thickness caps on open-arc shells if needed
		const centerBottom = posList.length / 3
		posList.push(0, profile[0][1], 0)
		uvList.push(0.5, 1)
		const centerTop = posList.length / 3
		posList.push(0, profile[rows - 1][1], 0)
		uvList.push(0.5, 0)
		void centerBottom
		void centerTop
	}

	const positions = new Float32Array(posList)
	const indices = new Uint32Array(idxList)
	const normals = recomputeSmoothNormals(positions, indices, true)
	return {
		positions,
		normals,
		uvs: new Float32Array(uvList),
		indices
	}
}

/**
 * Evaluates a Catmull-Rom 3D spline at parameter t in [0, 1].
 */
function sampleCatmullRom(points: Vec3[], t: number): Vec3 {
	const n = points.length
	if (n === 1) return points[0]
	const scaled = Math.max(0, Math.min(n - 1 - 1e-6, t * (n - 1)))
	const i = Math.floor(scaled)
	const f = scaled - i
	const p0 = points[Math.max(0, i - 1)]
	const p1 = points[i]
	const p2 = points[Math.min(n - 1, i + 1)]
	const p3 = points[Math.min(n - 1, i + 2)]

	const f2 = f * f
	const f3 = f2 * f
	const out: Vec3 = [0, 0, 0]
	for (let k = 0; k < 3; k++) {
		out[k] =
			0.5 *
			(2 * p1[k] +
				(-p0[k] + p2[k]) * f +
				(2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f2 +
				(-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f3)
	}
	return out
}

/**
 * Sweeps a volumetric 3D anime hair-lock cross-section (or round limb tube) along a 3D Catmull-Rom curve!
 * Each hair strand has real 3D front ridge + smooth back volume + tapered pointed tip,
 * so it looks lush and sculpted from front, 90deg profile, AND 180deg back view!
 */
export function createSweptStrandMesh(options: {
	points: Vec3[]
	steps?: number
	radialSegments?: number
	width: number
	thickness: number
	ridge?: number // positive raises a crisp anime hair ridge along outward normal
	taperPower?: number
	rootBlunt?: boolean
	outwardHint?: Vec3
}): RawMesh {
	const {
		points,
		steps = 22,
		radialSegments = 10,
		width,
		thickness,
		ridge = 0.25,
		taperPower = 0.72,
		rootBlunt = false,
		outwardHint = [0, 0, 1]
	} = options

	const centers: Vec3[] = []
	for (let s = 0; s <= steps; s++) {
		centers.push(sampleCatmullRom(points, s / steps))
	}

	// Parallel-transport frame along the curve to prevent twisting
	const tangents: Vec3[] = centers.map((_, i) => {
		const prev = centers[Math.max(0, i - 1)]
		const next = centers[Math.min(steps, i + 1)]
		return v3Normalize(v3Sub(next, prev))
	})

	const normals: Vec3[] = []
	const binormals: Vec3[] = []

	let initN = v3Sub(outwardHint, v3Scale(tangents[0], v3Dot(outwardHint, tangents[0])))
	if (Math.hypot(initN[0], initN[1], initN[2]) < 1e-4) {
		initN = Math.abs(tangents[0][2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]
		initN = v3Sub(initN, v3Scale(tangents[0], v3Dot(initN, tangents[0])))
	}
	normals.push(v3Normalize(initN))
	binormals.push(v3Normalize(v3Cross(tangents[0], normals[0])))

	for (let i = 1; i <= steps; i++) {
		const prevN = normals[i - 1]
		const t = tangents[i]
		const proj = v3Sub(prevN, v3Scale(t, v3Dot(prevN, t)))
		const n = Math.hypot(proj[0], proj[1], proj[2]) > 1e-5 ? v3Normalize(proj) : prevN
		normals.push(n)
		binormals.push(v3Normalize(v3Cross(t, n)))
	}

	const posList: number[] = []
	const uvList: number[] = []
	const idxList: number[] = []

	for (let i = 0; i <= steps; i++) {
		const u = i / steps
		// Taper smoothly: rounded root -> full belly -> pointed tip at u=1
		const rootFactor = rootBlunt ? Math.min(1, 0.45 + u * 3.5) : Math.sin(Math.min(1, u * 4.2) * (Math.PI / 2))
		const tipFactor = Math.pow(Math.max(0, 1 - u), taperPower)
		const env = i === steps ? 0.002 : rootFactor * tipFactor

		const w = width * env
		const th = thickness * env
		const c = centers[i]
		const n = normals[i] // outward face of strand
		const b = binormals[i] // width axis of strand

		for (let j = 0; j <= radialSegments; j++) {
			const phi = (j / radialSegments) * Math.PI * 2
			const cosP = Math.cos(phi)
			const sinP = Math.sin(phi)
			// Anime strand cross-section: wide along binormal (sinP), thicker ridge on +n side (cosP > 0)
			const ridgeBoost = cosP > 0 ? ridge * Math.pow(cosP, 2.2) * th : 0
			const localW = sinP * w
			const localN = cosP * th + ridgeBoost
			const p = v3Add(c, v3Add(v3Scale(b, localW), v3Scale(n, localN)))
			posList.push(p[0], p[1], p[2])
			uvList.push(j / radialSegments, u)
		}
	}

	const stride = radialSegments + 1
	for (let i = 0; i < steps; i++) {
		for (let j = 0; j < radialSegments; j++) {
			const a = i * stride + j
			const b = a + 1
			const d = (i + 1) * stride + j
			const e = d + 1
			idxList.push(a, d, e, a, e, b)
		}
	}

	const positions = new Float32Array(posList)
	const indices = new Uint32Array(idxList)
	// Ensure outward winding by checking centroid-to-vertex dot normal
	let computedNormals = recomputeSmoothNormals(positions, indices, true)
	const midVert = Math.floor(steps / 2) * stride
	const sampleP: Vec3 = [positions[midVert * 3], positions[midVert * 3 + 1], positions[midVert * 3 + 2]]
	const sampleC = centers[Math.floor(steps / 2)]
	const sampleN: Vec3 = [computedNormals[midVert * 3], computedNormals[midVert * 3 + 1], computedNormals[midVert * 3 + 2]]
	if (v3Dot(v3Sub(sampleP, sampleC), sampleN) < 0) {
		for (let i = 0; i < indices.length; i += 3) {
			const tmp = indices[i + 1]
			indices[i + 1] = indices[i + 2]
			indices[i + 2] = tmp
		}
		computedNormals = recomputeSmoothNormals(positions, indices, true)
	}

	return {
		positions,
		normals: computedNormals,
		uvs: new Float32Array(uvList),
		indices
	}
}

/**
 * Extrudes a star-convex or simple 2D polygon (about [cx, cy]) into a beveled 3D solid mesh!
 * Ideal for Zenbot's 3D 4-point star clip, 3D crescent moons, bow ribbons, and shoe straps.
 */
export function createExtrudedStarPolygonMesh(options: {
	points2D: Array<[number, number]> // CCW 2D contour
	center2D?: [number, number]
	depth: number
	bevel?: number
}): RawMesh {
	const { points2D, center2D = [0, 0], depth, bevel = 0.22 } = options
	const n = points2D.length
	const halfD = depth / 2
	const innerD = halfD * (1 - bevel)
	const bevelScale = 1 - bevel * 0.35

	// Rings from back (-Z) to front (+Z): backCenter -> backInner -> backEdge -> frontEdge -> frontInner -> frontCenter
	const posList: number[] = []
	const uvList: number[] = []
	const idxList: number[] = []

	const pushPt = (x: number, y: number, z: number) => {
		posList.push(x, y, z)
		uvList.push(0.5 + x, 0.5 + y)
	}

	const backCenterIdx = 0
	pushPt(center2D[0], center2D[1], -halfD)

	const ringOffsets: number[] = []
	const rings: Array<{ z: number; s: number }> = [
		{ z: -halfD, s: bevelScale },
		{ z: -innerD, s: 1.0 },
		{ z: innerD, s: 1.0 },
		{ z: halfD, s: bevelScale }
	]

	for (const ring of rings) {
		ringOffsets.push(posList.length / 3)
		for (let i = 0; i <= n; i++) {
			const [px, py] = points2D[i % n]
			const x = center2D[0] + (px - center2D[0]) * ring.s
			const y = center2D[1] + (py - center2D[1]) * ring.s
			pushPt(x, y, ring.z)
		}
	}

	const frontCenterIdx = posList.length / 3
	pushPt(center2D[0], center2D[1], halfD)

	const stride = n + 1
	// Back cap (facing -Z)
	for (let i = 0; i < n; i++) {
		idxList.push(backCenterIdx, ringOffsets[0] + i + 1, ringOffsets[0] + i)
	}
	// Side & bevel strips
	for (let r = 0; r < rings.length - 1; r++) {
		const r0 = ringOffsets[r]
		const r1 = ringOffsets[r + 1]
		for (let i = 0; i < n; i++) {
			const a = r0 + i
			const b = a + 1
			const d = r1 + i
			const e = d + 1
			idxList.push(a, b, e, a, e, d)
		}
	}
	// Front cap (facing +Z)
	const lastRing = ringOffsets[rings.length - 1]
	for (let i = 0; i < n; i++) {
		idxList.push(frontCenterIdx, lastRing + i, lastRing + i + 1)
	}

	const positions = new Float32Array(posList)
	const indices = new Uint32Array(idxList)
	const normals = recomputeSmoothNormals(positions, indices, true)
	return { positions, normals, uvs: new Float32Array(uvList), indices }
}

/* ---------- WebGL 3D Toon + Inverted-Hull Ink Outline Renderer ---------- */

export interface ToonMaterialSpec {
	colorTop: Vec3
	colorMid?: Vec3
	colorBot?: Vec3
	gradYRange?: [number, number] // [yBot, yTop] in model space
	shadowTint?: Vec3
	outlineWidth?: number
	outlineColor?: Vec3
	specular?: number
	rimStrength?: number
	emissive?: number
	texture?: HTMLCanvasElement | null
}

export interface ScenePart {
	id: string
	group: 'root' | 'head' | 'ahoge' | 'hairBack'
	mesh: RawMesh
	material: ToonMaterialSpec
}

const OUTLINE_VS = `
attribute vec3 aPos;
attribute vec3 aNormal;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
uniform float uOutlineWidth;
void main() {
  vec3 worldPos = (uModel * vec4(aPos, 1.0)).xyz;
  vec3 worldNormal = normalize(mat3(uModel) * aNormal);
  vec3 extruded = worldPos + worldNormal * uOutlineWidth;
  gl_Position = uProj * uView * vec4(extruded, 1.0);
}
`

const OUTLINE_FS = `
precision mediump float;
uniform vec3 uOutlineColor;
void main() {
  gl_FragColor = vec4(uOutlineColor, 1.0);
}
`

const TOON_VS = `
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec2 aUv;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  vec4 wp = uModel * vec4(aPos, 1.0);
  vWorldPos = wp.xyz;
  vLocalPos = aPos;
  vNormal = normalize(mat3(uModel) * aNormal);
  vUv = aUv;
  gl_Position = uProj * uView * wp;
}
`

const TOON_FS = `
precision mediump float;
varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying vec3 vNormal;
varying vec2 vUv;

uniform vec3 uColorTop;
uniform vec3 uColorMid;
uniform vec3 uColorBot;
uniform vec2 uGradRange;
uniform vec3 uShadowTint;
uniform vec3 uEyePos;
uniform vec3 uAccentColor;
uniform float uSpecular;
uniform float uRimStrength;
uniform float uEmissive;
uniform float uHasTex;
uniform sampler2D uTex;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uEyePos - vWorldPos);
  vec3 L = normalize(vec3(0.42, 0.62, 0.78));

  // Smooth 3-stop vertical gradient (e.g., snow white -> sky cyan -> pastel lavender)
  float gy = clamp((vLocalPos.y - uGradRange.x) / max(0.001, uGradRange.y - uGradRange.x), 0.0, 1.0);
  vec3 baseCol = gy < 0.5
    ? mix(uColorBot, uColorMid, smoothstep(0.0, 0.5, gy))
    : mix(uColorMid, uColorTop, smoothstep(0.5, 1.0, gy));

  if (uHasTex > 0.5) {
    vec4 texel = texture2D(uTex, vUv);
    baseCol = mix(baseCol, texel.rgb, texel.a);
  }

  // Soft 2-band Anime Cel-Toon diffuse shading (clean pastel shadows, never muddy!)
  float ndl = dot(N, L) * 0.5 + 0.5;
  float cel = smoothstep(0.36, 0.48, ndl);
  vec3 shadowCol = baseCol * uShadowTint;
  vec3 litCol = mix(shadowCol, baseCol * 1.03, cel);

  // Subtle anime hair/gloss specular band ("angel halo")
  vec3 H = normalize(L + V);
  float spec = pow(max(0.0, dot(N, H)), 28.0);
  float celSpec = smoothstep(0.48, 0.62, spec) * uSpecular;
  litCol += vec3(0.95, 0.98, 1.0) * celSpec * 0.28;

  // Fresnel 3D rim light tinted subtly by Bento accent color
  float fresnel = pow(1.0 - max(0.0, dot(N, V)), 3.2);
  float rim = smoothstep(0.42, 0.76, fresnel) * uRimStrength;
  litCol += mix(vec3(0.85, 0.94, 1.0), uAccentColor, 0.55) * rim * 0.34;

  // Emissive boost for glowing LED rings & hologram base
  litCol = mix(litCol, baseCol * 1.18, uEmissive);

  gl_FragColor = vec4(clamp(litCol, 0.0, 1.0), 1.0);
}
`

function compileProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string): WebGLProgram {
	const compile = (type: number, src: string) => {
		const sh = gl.createShader(type)
		if (!sh) throw new Error('Unable to allocate WebGL shader')
		gl.shaderSource(sh, src)
		gl.compileShader(sh)
		if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
			const info = gl.getShaderInfoLog(sh)
			gl.deleteShader(sh)
			throw new Error(`Shader compile error: ${info}`)
		}
		return sh
	}
	const vs = compile(gl.VERTEX_SHADER, vsSrc)
	const fs = compile(gl.FRAGMENT_SHADER, fsSrc)
	const prog = gl.createProgram()
	if (!prog) throw new Error('Unable to allocate WebGL program')
	gl.attachShader(prog, vs)
	gl.attachShader(prog, fs)
	gl.linkProgram(prog)
	gl.deleteShader(vs)
	gl.deleteShader(fs)
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		const info = gl.getProgramInfoLog(prog)
		gl.deleteProgram(prog)
		throw new Error(`Program link error: ${info}`)
	}
	return prog
}

interface GpuPart {
	spec: ScenePart
	posBuf: WebGLBuffer
	normBuf: WebGLBuffer
	uvBuf: WebGLBuffer
	idxBuf: WebGLBuffer
	indexCount: number
	indexType: number
	tex: WebGLTexture | null
}

export interface Zenbot3DRenderer {
	render: (params: {
		yaw: number
		pitch: number
		groupTransforms?: Partial<Record<ScenePart['group'], Float32Array>>
		accentRgb?: [number, number, number]
	}) => void
	updatePartTexture: (partId: string, canvasSource: HTMLCanvasElement) => void
	resize: (width: number, height: number, dpr?: number) => void
	dispose: () => void
}

export function createZenbot3DRenderer(canvas: HTMLCanvasElement, parts: ScenePart[]): Zenbot3DRenderer {
	const attrs: WebGLContextAttributes = {
		alpha: true,
		antialias: true,
		depth: true,
		premultipliedAlpha: false,
		preserveDrawingBuffer: true
	}
	const gl = (canvas.getContext('webgl2', attrs) || canvas.getContext('webgl', attrs)) as WebGLRenderingContext | null
	if (!gl) throw new Error('WebGL unavailable')

	const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext
	const uintExt = isWebGL2 ? true : Boolean(gl.getExtension('OES_element_index_uint'))

	const outlineProg = compileProgram(gl, OUTLINE_VS, OUTLINE_FS)
	const toonProg = compileProgram(gl, TOON_VS, TOON_FS)

	const outlineLoc = {
		aPos: gl.getAttribLocation(outlineProg, 'aPos'),
		aNormal: gl.getAttribLocation(outlineProg, 'aNormal'),
		uProj: gl.getUniformLocation(outlineProg, 'uProj'),
		uView: gl.getUniformLocation(outlineProg, 'uView'),
		uModel: gl.getUniformLocation(outlineProg, 'uModel'),
		uOutlineWidth: gl.getUniformLocation(outlineProg, 'uOutlineWidth'),
		uOutlineColor: gl.getUniformLocation(outlineProg, 'uOutlineColor')
	}

	const toonLoc = {
		aPos: gl.getAttribLocation(toonProg, 'aPos'),
		aNormal: gl.getAttribLocation(toonProg, 'aNormal'),
		aUv: gl.getAttribLocation(toonProg, 'aUv'),
		uProj: gl.getUniformLocation(toonProg, 'uProj'),
		uView: gl.getUniformLocation(toonProg, 'uView'),
		uModel: gl.getUniformLocation(toonProg, 'uModel'),
		uColorTop: gl.getUniformLocation(toonProg, 'uColorTop'),
		uColorMid: gl.getUniformLocation(toonProg, 'uColorMid'),
		uColorBot: gl.getUniformLocation(toonProg, 'uColorBot'),
		uGradRange: gl.getUniformLocation(toonProg, 'uGradRange'),
		uShadowTint: gl.getUniformLocation(toonProg, 'uShadowTint'),
		uEyePos: gl.getUniformLocation(toonProg, 'uEyePos'),
		uAccentColor: gl.getUniformLocation(toonProg, 'uAccentColor'),
		uSpecular: gl.getUniformLocation(toonProg, 'uSpecular'),
		uRimStrength: gl.getUniformLocation(toonProg, 'uRimStrength'),
		uEmissive: gl.getUniformLocation(toonProg, 'uEmissive'),
		uHasTex: gl.getUniformLocation(toonProg, 'uHasTex'),
		uTex: gl.getUniformLocation(toonProg, 'uTex')
	}

	const uploadTex = (tex: WebGLTexture, src: HTMLCanvasElement) => {
		gl.bindTexture(gl.TEXTURE_2D, tex)
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0)
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
	}

	const gpuParts: GpuPart[] = parts.map(spec => {
		const posBuf = gl.createBuffer()!
		gl.bindBuffer(gl.ARRAY_BUFFER, posBuf)
		gl.bufferData(gl.ARRAY_BUFFER, spec.mesh.positions, gl.STATIC_DRAW)

		const normBuf = gl.createBuffer()!
		gl.bindBuffer(gl.ARRAY_BUFFER, normBuf)
		gl.bufferData(gl.ARRAY_BUFFER, spec.mesh.normals, gl.STATIC_DRAW)

		const uvBuf = gl.createBuffer()!
		gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf)
		gl.bufferData(gl.ARRAY_BUFFER, spec.mesh.uvs, gl.STATIC_DRAW)

		const idxBuf = gl.createBuffer()!
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf)
		const use32 = uintExt && spec.mesh.positions.length / 3 > 65535
		if (use32) {
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, spec.mesh.indices, gl.STATIC_DRAW)
		} else {
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(spec.mesh.indices), gl.STATIC_DRAW)
		}

		let tex: WebGLTexture | null = null
		if (spec.material.texture) {
			tex = gl.createTexture()!
			uploadTex(tex, spec.material.texture)
		}

		return {
			spec,
			posBuf,
			normBuf,
			uvBuf,
			idxBuf,
			indexCount: spec.mesh.indices.length,
			indexType: use32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
			tex
		}
	})

	let disposed = false

	const resize = (width: number, height: number, dpr = 2) => {
		const ratio = Math.min(2.5, Math.max(1, dpr))
		const pw = Math.max(1, Math.round(width * ratio))
		const ph = Math.max(1, Math.round(height * ratio))
		if (canvas.width !== pw || canvas.height !== ph) {
			canvas.width = pw
			canvas.height = ph
		}
	}

	const updatePartTexture = (partId: string, canvasSource: HTMLCanvasElement) => {
		if (disposed) return
		const found = gpuParts.find(p => p.spec.id === partId)
		if (!found) return
		if (!found.tex) found.tex = gl.createTexture()!
		uploadTex(found.tex, canvasSource)
	}

	const render: Zenbot3DRenderer['render'] = ({ yaw, pitch, groupTransforms = {}, accentRgb = [56, 189, 248] }) => {
		if (disposed || gl.isContextLost()) return
		const w = canvas.width
		const h = canvas.height
		gl.viewport(0, 0, w, h)
		gl.clearColor(0, 0, 0, 0)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

		gl.enable(gl.DEPTH_TEST)
		gl.depthFunc(gl.LEQUAL)
		gl.enable(gl.CULL_FACE)

		const eyeDist = 4.35
		const clampedPitch = Math.max(-0.42, Math.min(0.48, pitch))
		const eye: Vec3 = [0, 0.04 + Math.sin(clampedPitch) * eyeDist, Math.cos(clampedPitch) * eyeDist]
		const proj = mat4Perspective((29 * Math.PI) / 180, w / Math.max(1, h), 0.5, 20.0)
		const view = mat4LookAt(eye, [0, 0.02, 0], [0, 1, 0])
		const baseRot = mat4Compose([0, 0, 0], [0, yaw, 0], [1, 1, 1])

		const accentNorm: Vec3 = [accentRgb[0] / 255, accentRgb[1] / 255, accentRgb[2] / 255]

		// Pass 1: Inverted-Hull Anime Ink Outline (cull FRONT faces -> draw extruded BACK faces)
		gl.useProgram(outlineProg)
		gl.cullFace(gl.FRONT)
		gl.uniformMatrix4fv(outlineLoc.uProj, false, proj)
		gl.uniformMatrix4fv(outlineLoc.uView, false, view)
		gl.enableVertexAttribArray(outlineLoc.aPos)
		gl.enableVertexAttribArray(outlineLoc.aNormal)
		if (toonLoc.aUv >= 0) gl.disableVertexAttribArray(toonLoc.aUv)

		for (const p of gpuParts) {
			const width = p.spec.material.outlineWidth ?? 0.017
			if (width <= 0) continue
			const groupM = groupTransforms[p.spec.group]
			const modelM = groupM ? mat4Multiply(baseRot, groupM) : baseRot
			const oc = p.spec.material.outlineColor ?? [0.09, 0.125, 0.22]

			gl.uniformMatrix4fv(outlineLoc.uModel, false, modelM)
			gl.uniform1f(outlineLoc.uOutlineWidth, width)
			gl.uniform3f(outlineLoc.uOutlineColor, oc[0], oc[1], oc[2])

			gl.bindBuffer(gl.ARRAY_BUFFER, p.posBuf)
			gl.vertexAttribPointer(outlineLoc.aPos, 3, gl.FLOAT, false, 0, 0)
			gl.bindBuffer(gl.ARRAY_BUFFER, p.normBuf)
			gl.vertexAttribPointer(outlineLoc.aNormal, 3, gl.FLOAT, false, 0, 0)
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.idxBuf)
			gl.drawElements(gl.TRIANGLES, p.indexCount, p.indexType, 0)
		}

		// Pass 2: Anime Cel-Toon Surface Shading (cull BACK faces -> draw FRONT faces)
		gl.useProgram(toonProg)
		gl.cullFace(gl.BACK)
		gl.uniformMatrix4fv(toonLoc.uProj, false, proj)
		gl.uniformMatrix4fv(toonLoc.uView, false, view)
		gl.uniform3f(toonLoc.uEyePos, eye[0], eye[1], eye[2])
		gl.uniform3f(toonLoc.uAccentColor, accentNorm[0], accentNorm[1], accentNorm[2])
		gl.enableVertexAttribArray(toonLoc.aPos)
		gl.enableVertexAttribArray(toonLoc.aNormal)
		gl.enableVertexAttribArray(toonLoc.aUv)

		for (const p of gpuParts) {
			const mat = p.spec.material
			const groupM = groupTransforms[p.spec.group]
			const modelM = groupM ? mat4Multiply(baseRot, groupM) : baseRot
			const top = mat.colorTop
			const mid = mat.colorMid ?? top
			const bot = mat.colorBot ?? mid
			const range = mat.gradYRange ?? [-1, 1]
			const shadow = mat.shadowTint ?? [0.82, 0.85, 0.94]

			gl.uniformMatrix4fv(toonLoc.uModel, false, modelM)
			gl.uniform3f(toonLoc.uColorTop, top[0], top[1], top[2])
			gl.uniform3f(toonLoc.uColorMid, mid[0], mid[1], mid[2])
			gl.uniform3f(toonLoc.uColorBot, bot[0], bot[1], bot[2])
			gl.uniform2f(toonLoc.uGradRange, range[0], range[1])
			gl.uniform3f(toonLoc.uShadowTint, shadow[0], shadow[1], shadow[2])
			gl.uniform1f(toonLoc.uSpecular, mat.specular ?? 0.35)
			gl.uniform1f(toonLoc.uRimStrength, mat.rimStrength ?? 0.45)
			gl.uniform1f(toonLoc.uEmissive, mat.emissive ?? 0)

			if (p.tex) {
				gl.activeTexture(gl.TEXTURE0)
				gl.bindTexture(gl.TEXTURE_2D, p.tex)
				gl.uniform1i(toonLoc.uTex, 0)
				gl.uniform1f(toonLoc.uHasTex, 1)
			} else {
				gl.uniform1f(toonLoc.uHasTex, 0)
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, p.posBuf)
			gl.vertexAttribPointer(toonLoc.aPos, 3, gl.FLOAT, false, 0, 0)
			gl.bindBuffer(gl.ARRAY_BUFFER, p.normBuf)
			gl.vertexAttribPointer(toonLoc.aNormal, 3, gl.FLOAT, false, 0, 0)
			gl.bindBuffer(gl.ARRAY_BUFFER, p.uvBuf)
			gl.vertexAttribPointer(toonLoc.aUv, 2, gl.FLOAT, false, 0, 0)
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.idxBuf)
			gl.drawElements(gl.TRIANGLES, p.indexCount, p.indexType, 0)
		}
	}

	const dispose = () => {
		if (disposed) return
		disposed = true
		for (const p of gpuParts) {
			gl.deleteBuffer(p.posBuf)
			gl.deleteBuffer(p.normBuf)
			gl.deleteBuffer(p.uvBuf)
			gl.deleteBuffer(p.idxBuf)
			if (p.tex) gl.deleteTexture(p.tex)
		}
		gl.deleteProgram(outlineProg)
		gl.deleteProgram(toonProg)
		gl.getExtension('WEBGL_lose_context')?.loseContext()
	}

	return { render, updatePartTexture, resize, dispose }
}
