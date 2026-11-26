// Ported verbatim from Ladvace/astro-bento-portfolio (MIT).
// See LICENSES/astro-bento-portfolio-MIT.txt.
const DARKSLATE_400 = '#383838'
const DARKSLATE_500 = '#171717'
const DARKSLATE_800 = '#0e0e0e'

export const NINE_SLICE_BORDER = 7
export const NINE_SLICE_FILL = DARKSLATE_800
export const NINE_SLICE_STROKE = '#A11C2E'

const RAIL_X0 = 89.153
const RAIL_X1 = 189.534
const RAIL_Y0 = 89.152
const RAIL_Y1 = 313.108

const ART_X0 = 6.999
const ART_X1 = 271.687
const ART_Y0 = 7
const ART_Y1 = 395.26

const BASE_SLICE = 90

const num = (n: number) => Number(n.toFixed(4))

const FRAME_PATH =
	'M271.687 367.378C271.687 382.776 259.204 395.259 243.806 395.26C239.14 395.26 234.742 394.112 230.877 392.086C230.244 391.753 229.485 391.753 228.851 392.086C224.987 394.112 220.589 395.26 215.923 395.26C205.303 395.26 196.069 389.321 191.361 380.584C190.997 379.908 190.302 379.465 189.534 379.465L89.1529 379.465C88.3848 379.465 87.6899 379.908 87.3256 380.584C82.6177 389.322 73.3831 395.26 62.7627 395.26C58.097 395.26 53.6996 394.112 49.8355 392.086C49.2016 391.753 48.4429 391.753 47.809 392.086C43.9447 394.112 39.5468 395.26 34.8808 395.26C19.4825 395.26 6.99924 382.776 6.99901 367.378C6.99901 362.712 8.14614 358.315 10.1721 354.451C10.5045 353.817 10.5045 353.058 10.1721 352.424C8.14636 348.561 6.99908 344.163 6.99901 339.498C6.99911 328.877 12.9386 319.642 21.6772 314.935C22.3535 314.571 22.7969 313.876 22.7969 313.108L22.7969 89.1531C22.7969 88.3849 22.3536 87.69 21.6772 87.3256C12.9384 82.6183 6.99902 73.3833 6.99902 62.7617C6.99903 58.096 8.14605 53.6986 10.1721 49.8344C10.5045 49.2005 10.5045 48.442 10.1721 47.8081C8.14624 43.9442 6.99907 39.5472 6.99902 34.8818C6.99902 19.4833 19.4823 7.00004 34.8809 6.99999C39.5468 7.00005 43.9447 8.14678 47.809 10.173C48.443 10.5054 49.2016 10.5054 49.8355 10.173C53.6996 8.14699 58.0971 7.00007 62.7627 6.99999C73.3836 6.99999 82.618 12.9385 87.3256 21.6764C87.69 22.3526 88.3848 22.7959 89.153 22.7959L189.534 22.7959C190.302 22.7959 190.997 22.3527 191.361 21.6764C196.069 12.9388 205.302 7.00002 215.923 7C220.589 7.00007 224.987 8.14688 228.851 10.173C229.485 10.5054 230.244 10.5054 230.877 10.173C234.742 8.14693 239.14 7 243.806 7C259.204 7.00034 271.687 19.4835 271.687 34.8818C271.687 39.5469 270.541 43.9443 268.515 47.8082C268.183 48.442 268.183 49.2005 268.515 49.8344C270.541 53.6984 271.687 58.0963 271.687 62.7617C271.687 73.3833 265.747 82.6174 257.008 87.3247C256.332 87.689 255.889 88.3839 255.889 89.1521L255.889 313.108C255.889 313.876 256.332 314.571 257.008 314.935C265.747 319.642 271.687 328.876 271.687 339.498C271.687 344.163 270.541 348.561 268.515 352.424C268.183 353.058 268.183 353.817 268.515 354.451C270.541 358.315 271.687 362.713 271.687 367.378Z'

type NineSliceGeometry = {
	slice: number
	min: number
	width: number
	height: number
	scale: number
	strokeWidth: number
	tx: number
	ty: number
}

export function nineSliceGeometry(borderWidth: number = NINE_SLICE_BORDER, cornerSize?: number): NineSliceGeometry {
	const base = Math.max(BASE_SLICE, Math.ceil(RAIL_X0 - ART_X0 + borderWidth))
	const slice = cornerSize ?? base
	const scale = slice / base

	return {
		slice,
		min: slice * 2,
		scale, // unrounded: 4dp shifts the rail off the slice boundary
		strokeWidth: num(borderWidth * 2),
		width: num((base * 2 + (RAIL_X1 - RAIL_X0)) * scale),
		height: num((base * 2 + (RAIL_Y1 - RAIL_Y0)) * scale),
		tx: num(base - RAIL_X0),
		ty: num(base - RAIL_Y0)
	}
}

type NineSliceOptions = {
	fill?: string
	stroke?: string
	borderWidth?: number
	cornerSize?: number
}

const dataUri = (g: NineSliceGeometry, body: string) =>
	`url("data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${g.width}" height="${g.height}" ` + `viewBox="0 0 ${g.width} ${g.height}">${body}</svg>`
	)}")`

const frameGroup = (g: NineSliceGeometry, stroke: string, fill: string) =>
	`<g transform="scale(${g.scale}) translate(${g.tx} ${g.ty})">` +
	`<path d="${FRAME_PATH}" fill="none" stroke="${stroke}" ` +
	`stroke-width="${g.strokeWidth}" stroke-linejoin="round"/>` +
	`<path d="${FRAME_PATH}" fill="${fill}"/></g>`

export function nineSliceDataUri({ fill = NINE_SLICE_FILL, stroke = NINE_SLICE_STROKE, borderWidth = NINE_SLICE_BORDER, cornerSize }: NineSliceOptions = {}) {
	const g = nineSliceGeometry(borderWidth, cornerSize)
	return dataUri(g, frameGroup(g, stroke, fill))
}

function nineSliceRailMaskDataUri({ borderWidth = NINE_SLICE_BORDER, cornerSize }: Omit<NineSliceOptions, 'fill' | 'stroke'> = {}) {
	const g = nineSliceGeometry(borderWidth, cornerSize)
	return dataUri(
		g,
		`<defs><mask id="r" maskUnits="userSpaceOnUse" x="0" y="0" ` +
			`width="${g.width}" height="${g.height}">` +
			frameGroup(g, '#fff', '#000') +
			`</mask></defs>` +
			`<rect width="${g.width}" height="${g.height}" fill="#fff" mask="url(#r)"/>`
	)
}

export function frameVars(
	prefix: string,
	{
		cornerSize,
		thickness = 1,
		image = false,
		...paint
	}: { cornerSize: number; thickness?: number; image?: boolean } & Pick<NineSliceOptions, 'fill' | 'stroke'>
) {
	const borderWidth = thickness / nineSliceGeometry(0, cornerSize).scale
	const opts = { ...paint, borderWidth, cornerSize }
	const { slice, min } = nineSliceGeometry(borderWidth, cornerSize)

	return {
		...(image && { [`--${prefix}-image`]: nineSliceDataUri(opts) }),
		[`--${prefix}-mask`]: nineSliceDataUri({
			...opts,
			fill: '#fff',
			stroke: '#fff'
		}),
		[`--${prefix}-rail-mask`]: nineSliceRailMaskDataUri(opts),
		[`--${prefix}-slice`]: `${slice}`,
		[`--${prefix}-border`]: `${slice}px`,
		[`--${prefix}-min`]: `${min}px`
	}
}

export const BUTTON_FRAME = frameVars('bt', { cornerSize: 20, thickness: 1.5 })
