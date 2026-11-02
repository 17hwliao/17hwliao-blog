'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Monitor, Moon, Sun, X } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import { parseTheme, themeKey, type ThemePreference } from './theme-model'

type Appearance = { preference: ThemePreference; resolved: 'light' | 'dark'; error: string | null; choose: (value: ThemePreference) => void }
const AppearanceContext = createContext<Appearance | null>(null)
export function AppearanceProvider({ children }: { children: ReactNode }) {
	const [preference, setPreference] = useState<ThemePreference>('system')
	const [resolved, setResolved] = useState<'light' | 'dark'>('light')
	const [error, setError] = useState<string | null>(null)
	const current = useRef<ThemePreference>('system')
	const apply = (value: ThemePreference) => {
		const next = value === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : value
		current.current = value
		document.documentElement.dataset.themePreference = value
		document.documentElement.dataset.theme = next
		document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#181a19' : '#fcfcfa')
		setPreference(value)
		setResolved(next)
	}
	useEffect(() => {
		apply(parseTheme(document.documentElement.dataset.themePreference ?? null))
		const media = matchMedia('(prefers-color-scheme: dark)')
		const changed = () => {
			if (current.current === 'system') apply('system')
		}
		const storage = (event: StorageEvent) => {
			if (event.key === themeKey || event.key === null) {
				apply(parseTheme(event.newValue))
				setError(null)
			}
		}
		media.addEventListener('change', changed)
		window.addEventListener('storage', storage)
		return () => {
			media.removeEventListener('change', changed)
			window.removeEventListener('storage', storage)
		}
	}, [])
	const choose = (value: ThemePreference) => {
		apply(value)
		try {
			localStorage.setItem(themeKey, value)
			setError(null)
		} catch {
			setError('浏览器阻止了偏好保存，本次选择仅在当前页面会话中生效。')
		}
	}
	return <AppearanceContext.Provider value={{ preference, resolved, error, choose }}>{children}</AppearanceContext.Provider>
}
export const useAppearance = () => useContext(AppearanceContext)
export function ThemeOptions() {
	const appearance = useContext(AppearanceContext)
	if (!appearance) return null
	return (
		<div className='appearance-options'>
			<div className='theme-choices' role='group' aria-label='选择显示主题'>
				{(
					[
						{ value: 'light', label: '浅色', Icon: Sun },
						{ value: 'dark', label: '深色', Icon: Moon },
						{ value: 'system', label: '跟随系统', Icon: Monitor }
					] as const
				).map(({ value, label, Icon }) => (
					<button type='button' key={value} aria-pressed={appearance.preference === value} onClick={() => appearance.choose(value)}>
						<Icon size={19} />
						<span>{label}</span>
					</button>
				))}
			</div>
			<p className='muted'>{appearance.preference === 'system' ? '随设备的日间 / 夜间设置自动切换。' : '已选择固定主题，随时可以切回跟随系统。'}</p>
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
				aria-label='切换日间与夜间主题'
				title='外观 · 浅色 / 深色 / 跟随系统'
				onClick={() => setOpen(true)}>
				{appearance?.resolved === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
			</button>
			<DialogModal open={open} onClose={() => setOpen(false)} ariaLabel='外观设置' className='appearance-dialog'>
				<div className='drawer-heading'>
					<div>
						<p className='eyebrow'>MAKE YOURSELF AT HOME</p>
						<h2>舒服地读一会儿。</h2>
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
