export const themeKey = '17hwliao:appearance:v1'
export const bentoStyleKey = '17hwliao:bento-style:v1'
export const bentoAccentKey = '17hwliao:bento-accent:v1'
export const bentoBorderKey = '17hwliao:bento-border:v1'

export type ThemePreference = 'light' | 'dark' | 'system'
export const DEFAULT_THEME: ThemePreference = 'dark'
export type BentoStyle = 'default' | 'glass' | 'neon' | 'paper' | 'sharp'
export const DEFAULT_BENTO_STYLE: BentoStyle = 'neon'
export type BentoAccent = 'cyan' | 'red' | 'orange' | 'blue' | 'purple' | 'green'
export const DEFAULT_BENTO_ACCENT: BentoAccent = 'red'
export type BentoBorderMode = 'normal' | 'custom'
export const DEFAULT_BENTO_BORDER: BentoBorderMode = 'custom'

export const BENTO_STYLES: ReadonlyArray<{ id: BentoStyle; label: string; english: string; hint: string }> = [
	{ id: 'default', label: '暗格经典', english: 'Default', hint: '标准 Bento 模块网格与克制层次' },
	{ id: 'glass', label: '玻璃拟态', english: 'Glass', hint: '毛玻璃透光层叠与柔和高光边缘' },
	{ id: 'neon', label: '霓虹赛博', english: 'Neon', hint: '发光轮廓、微光标题与网格地平线' },
	{ id: 'paper', label: '纸墨温润', english: 'Paper', hint: '细腻纸纹肌理与适合长文沉浸阅读的质感' },
	{ id: 'sharp', label: '硬朗折角', english: 'Sharp', hint: '零圆角几何切面与硬朗偏移投影' }
]

export const BENTO_ACCENTS: ReadonlyArray<{
	id: BentoAccent
	label: string
	color: string
	rgb: [number, number, number]
}> = [
	{ id: 'cyan', label: 'Zenbot 冰青', color: '#38bdf8', rgb: [56, 189, 248] },
	{ id: 'red', label: 'Bento 绯红', color: '#e63946', rgb: [230, 57, 70] },
	{ id: 'orange', label: '暖橙', color: '#f97316', rgb: [249, 115, 22] },
	{ id: 'blue', label: '深海电蓝', color: '#3b82f6', rgb: [59, 130, 246] },
	{ id: 'purple', label: '极光紫罗兰', color: '#a855f7', rgb: [168, 85, 247] },
	{ id: 'green', label: '松针翠绿', color: '#22c55e', rgb: [34, 197, 94] }
]

export function parseTheme(value: string | null): ThemePreference {
	return value === 'light' || value === 'dark' || value === 'system' ? value : DEFAULT_THEME
}

export function parseBentoStyle(value: string | null): BentoStyle {
	return value === 'default' || value === 'glass' || value === 'neon' || value === 'paper' || value === 'sharp' ? value : DEFAULT_BENTO_STYLE
}

export function parseBentoAccent(value: string | null): BentoAccent {
	if (value === 'yellow') return 'orange'
	return value === 'cyan' || value === 'red' || value === 'orange' || value === 'blue' || value === 'purple' || value === 'green' ? value : DEFAULT_BENTO_ACCENT
}

export function parseBentoBorder(value: string | null): BentoBorderMode {
	return value === 'custom' || value === 'normal' ? value : DEFAULT_BENTO_BORDER
}

// Fixed entry appearance matching the chosen preset: cached choices and OS theme cannot override it.
// Manual appearance changes apply only to the current page session.
export const themeBootstrap = `(()=>{const r=document.documentElement;r.dataset.themePreference='${DEFAULT_THEME}';r.dataset.theme='${DEFAULT_THEME}';r.dataset.bentoStyle='${DEFAULT_BENTO_STYLE}';r.dataset.bentoAccent='${DEFAULT_BENTO_ACCENT}';r.dataset.bentoBorder='${DEFAULT_BENTO_BORDER}'})()`
