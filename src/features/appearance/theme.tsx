'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Monitor, Moon, Sun, Volume2, VolumeX, X } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import { CHIME, isSoundEnabled, play, setSoundEnabled, SOUND_EVENT } from '@/lib/sound'
import {
	BENTO_ACCENTS,
	BENTO_STYLES,
	DEFAULT_THEME,
	DEFAULT_BENTO_STYLE,
	DEFAULT_BENTO_ACCENT,
	DEFAULT_BENTO_BORDER,
	parseBentoAccent,
	parseBentoBorder,
	parseBentoStyle,
	parseTheme,
	type BentoAccent,
	type BentoBorderMode,
	type BentoStyle,
	type ThemePreference
} from './theme-model'

export type Appearance = {
	preference: ThemePreference
	resolved: 'light' | 'dark'
	style: BentoStyle
	accent: BentoAccent
	borderMode: BentoBorderMode
	sound: boolean
	walkerEnabled: boolean
	error: string | null
	choose: (value: ThemePreference) => void
	chooseStyle: (value: BentoStyle) => void
	chooseAccent: (value: BentoAccent) => void
	toggleBorderMode: () => void
	toggleSound: () => void
	setWalkerEnabled: (next: boolean) => void
}

export const WALKER_STORAGE_KEY = '17hwliao:zenbot-walker:v1'
export const WALKER_EVENT = '17hwliao:zenbot-walker-change'

function readWalkerEnabled(): boolean {
	if (typeof window === 'undefined') return true
	try {
		const val = localStorage.getItem(WALKER_STORAGE_KEY)
		if (val === 'false' || val === '0') return false
	} catch {}
	return true
}

const AppearanceContext = createContext<Appearance | null>(null)

export function AppearanceProvider({ children }: { children: ReactNode }) {
	const [preference, setPreference] = useState<ThemePreference>(DEFAULT_THEME)
	const [resolved, setResolved] = useState<'light' | 'dark'>('dark')
	const [style, setStyle] = useState<BentoStyle>(DEFAULT_BENTO_STYLE)
	const [accent, setAccent] = useState<BentoAccent>(DEFAULT_BENTO_ACCENT)
	const [borderMode, setBorderMode] = useState<BentoBorderMode>(DEFAULT_BENTO_BORDER)
	const [sound, setSound] = useState<boolean>(true)
	const [walkerEnabled, setWalkerState] = useState<boolean>(true)
	const [error, setError] = useState<string | null>(null)
	const current = useRef<ThemePreference>(DEFAULT_THEME)

	const applyTheme = useCallback((value: ThemePreference) => {
		const next = value === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : value
		current.current = value
		document.documentElement.dataset.themePreference = value
		document.documentElement.dataset.theme = next
		document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#0e1116' : '#fcfcfa')
		setPreference(value)
		setResolved(next)
	}, [])

	const applyStyle = useCallback((value: BentoStyle) => {
		document.documentElement.dataset.bentoStyle = value
		setStyle(value)
	}, [])

	const applyAccent = useCallback((value: BentoAccent) => {
		document.documentElement.dataset.bentoAccent = value
		setAccent(value)
	}, [])

	const applyBorder = useCallback((value: BentoBorderMode) => {
		document.documentElement.dataset.bentoBorder = value
		setBorderMode(value)
	}, [])

	useEffect(() => {
		const root = document.documentElement
		applyTheme(parseTheme(root.dataset.themePreference ?? null))
		applyStyle(parseBentoStyle(root.dataset.bentoStyle ?? null))
		applyAccent(parseBentoAccent(root.dataset.bentoAccent ?? null))
		applyBorder(parseBentoBorder(root.dataset.bentoBorder ?? null))
		setSound(isSoundEnabled())
		setWalkerState(readWalkerEnabled())

		const media = matchMedia('(prefers-color-scheme: dark)')
		const changed = () => {
			if (current.current === 'system') applyTheme('system')
		}
		const onSound = (event: Event) => {
			const detail = (event as CustomEvent<{ enabled?: boolean }>).detail
			setSound(detail?.enabled ?? isSoundEnabled())
		}
		const onWalker = (event: Event) => {
			const detail = (event as CustomEvent<{ enabled?: boolean }>).detail
			setWalkerState(detail?.enabled ?? readWalkerEnabled())
		}

		media.addEventListener('change', changed)
		window.addEventListener(SOUND_EVENT, onSound)
		window.addEventListener(WALKER_EVENT, onWalker)
		return () => {
			media.removeEventListener('change', changed)
			window.removeEventListener(SOUND_EVENT, onSound)
			window.removeEventListener(WALKER_EVENT, onWalker)
		}
	}, [applyAccent, applyBorder, applyStyle, applyTheme])

	const choose = (value: ThemePreference) => {
		applyTheme(value)
		play(CHIME)
	}

	const chooseStyle = (value: BentoStyle) => {
		applyStyle(value)
		if (borderMode === 'custom') {
			applyBorder('normal')
		}
		play(CHIME)
	}

	const chooseAccent = (value: BentoAccent) => {
		applyAccent(value)
		play(CHIME)
	}

	const toggleBorderMode = () => {
		const next: BentoBorderMode = borderMode === 'custom' ? 'normal' : 'custom'
		applyBorder(next)
		play(CHIME)
	}

	const toggleSound = () => {
		const next = !sound
		setSound(next)
		setSoundEnabled(next)
		if (next) play(CHIME)
	}

	const setWalkerEnabled = (next: boolean) => {
		setWalkerState(next)
		try {
			localStorage.setItem(WALKER_STORAGE_KEY, String(next))
		} catch {}
		window.dispatchEvent(new CustomEvent(WALKER_EVENT, { detail: { enabled: next } }))
		play(CHIME)
	}

	return (
		<AppearanceContext.Provider
			value={{
				preference,
				resolved,
				style,
				accent,
				borderMode,
				sound,
				walkerEnabled,
				error,
				choose,
				chooseStyle,
				chooseAccent,
				toggleBorderMode,
				toggleSound,
				setWalkerEnabled
			}}>
			{children}
		</AppearanceContext.Provider>
	)
}

export const useAppearance = () => useContext(AppearanceContext)

export function ThemeOptions() {
	const appearance = useContext(AppearanceContext)
	if (!appearance) return null
	const activeStyleMeta = BENTO_STYLES.find(item => item.id === appearance.style) ?? BENTO_STYLES[0]

	return (
		<div className='appearance-options'>
			<div className='appearance-section-label'>明暗模式 · COLOR MODE</div>
			<div className='theme-choices' role='group' aria-label='选择显示主题'>
				{(
					[
						{ value: 'light', label: '浅色', Icon: Sun },
						{ value: 'dark', label: '深色', Icon: Moon },
						{ value: 'system', label: '跟随系统', Icon: Monitor }
					] as const
				).map(({ value, label, Icon }) => (
					<button type='button' key={value} aria-pressed={appearance.preference === value} onClick={() => appearance.choose(value)}>
						<Icon size={18} />
						<span>{label}</span>
					</button>
				))}
			</div>

			<div className='appearance-section-label'>UI 材质风格 · BENTO STYLE</div>
			<div className='bento-style-choices' role='group' aria-label='选择 UI 风格'>
				{BENTO_STYLES.map(item => (
					<button
						type='button'
						key={item.id}
						aria-pressed={appearance.style === item.id && appearance.borderMode !== 'custom'}
						onClick={() => appearance.chooseStyle(item.id)}>
						<strong>{item.label}</strong>
						<small>{item.english}</small>
					</button>
				))}
				<button
					type='button'
					aria-pressed={appearance.borderMode === 'custom'}
					onClick={() => appearance.toggleBorderMode()}
					title='切换九宫格切角边框 (Nine-Slice Frame)'>
					<strong>切角外框</strong>
					<small>Chamfer</small>
				</button>
			</div>

			<div className='appearance-section-label'>主题强调色 · ACCENT</div>
			<div className='bento-accent-row' role='group' aria-label='选择强调色'>
				{BENTO_ACCENTS.map(item => (
					<button
						type='button'
						key={item.id}
						className={'bento-swatch' + (appearance.accent === item.id ? ' is-active' : '')}
						style={{ '--swatch-color': item.color } as React.CSSProperties}
						aria-label={item.label}
						aria-pressed={appearance.accent === item.id}
						title={item.label}
						onClick={() => appearance.chooseAccent(item.id)}
					/>
				))}
			</div>

			<div className='appearance-toggles-row'>
				<button type='button' className='appearance-pill-toggle' aria-pressed={appearance.sound} onClick={appearance.toggleSound}>
					{appearance.sound ? <Volume2 size={15} /> : <VolumeX size={15} />}
					<span>交互音效：{appearance.sound ? '已开启' : '已静音'}</span>
				</button>
				<button
					type='button'
					className='appearance-pill-toggle'
					aria-pressed={appearance.walkerEnabled}
					onClick={() => appearance.setWalkerEnabled(!appearance.walkerEnabled)}>
					<span>底部 Zenbot：{appearance.walkerEnabled ? '漫步中' : '已收起'}</span>
				</button>
			</div>

			<p className='muted'>
				当前风格：{activeStyleMeta.label}（{activeStyleMeta.hint}）。
				{appearance.preference === 'system' ? '明暗随系统设置自动切换。' : '已固定明暗模式。'}
			</p>
			{appearance.error && (
				<p className='feature-error' role='alert'>
					{appearance.error}
				</p>
			)}
		</div>
	)
}

export function ThemeButton() {
	const [open, setOpen] = useState(false)
	const appearance = useContext(AppearanceContext)
	return (
		<>
			<button
				type='button'
				className='icon-button theme-trigger'
				aria-label='切换外观与 UI 风格'
				title='外观 · Glass / Neon / Paper / 明暗与音效'
				onClick={() => setOpen(true)}>
				{appearance?.resolved === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
			</button>
			<DialogModal open={open} onClose={() => setOpen(false)} ariaLabel='外观与风格设置' className='appearance-dialog'>
				<div className='drawer-heading'>
					<div>
						<p className='eyebrow'>BENTO APPEARANCE & SOUND</p>
						<h2>挑一种顺眼的质感。</h2>
					</div>
					<button type='button' className='icon-button' aria-label='关闭外观设置' onClick={() => setOpen(false)}>
						<X size={19} />
					</button>
				</div>
				<ThemeOptions />
			</DialogModal>
		</>
	)
}
