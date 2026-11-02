export const themeKey = '17hwliao:appearance:v1'
export type ThemePreference = 'light' | 'dark' | 'system'
export function parseTheme(value: string | null): ThemePreference {
	return value === 'light' || value === 'dark' ? value : 'system'
}
// Runs in <head> before page content paints. Storage denial falls back to the OS.
export const themeBootstrap = `(()=>{let p='system';try{const v=localStorage.getItem('${themeKey}');if(v==='light'||v==='dark')p=v}catch{}const r=document.documentElement;r.dataset.themePreference=p;r.dataset.theme=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p})()`
