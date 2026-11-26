'use client'

import { useEffect, useRef, useCallback, type IframeHTMLAttributes } from 'react'
import { useAppearance } from '@/features/appearance/theme'

// Same-origin viewers have their own document and need the same appearance
// contract as page surfaces. Only visual variables are copied into that frame.
export function ThemedFrame(props: IframeHTMLAttributes<HTMLIFrameElement>) {
	const ref = useRef<HTMLIFrameElement>(null)
	const appearance = useAppearance()
	const apply = useCallback(() => {
		const frame = ref.current
		if (!frame) return
		try {
			const doc = frame.contentDocument
			if (!doc?.documentElement) return
			const root = document.documentElement
			const styles = getComputedStyle(root)
			for (const name of ['bentoStyle', 'bentoAccent', 'theme']) doc.documentElement.dataset[name] = root.dataset[name]
			for (const variable of [
				'--ui-panel',
				'--ui-raised',
				'--ui-well',
				'--ui-border',
				'--ui-text',
				'--ui-muted',
				'--ui-radius',
				'--ui-control-radius',
				'--ui-shadow',
				'--ui-primary-fill',
				'--ui-primary-ink',
				'--primary-500',
				'--color-bg'
			]) {
				doc.documentElement.style.setProperty(variable, styles.getPropertyValue(variable))
			}
			if (!doc.getElementById('embedded-ui-theme')) {
				const link = doc.createElement('link')
				link.id = 'embedded-ui-theme'
				link.rel = 'stylesheet'
				link.href = '/ui-embedded.css'
				doc.head.appendChild(link)
			}
		} catch {
			/* A cross-origin frame keeps its own presentation. */
		}
	}, [])
	useEffect(() => {
		apply()
	}, [apply, appearance?.style, appearance?.accent, appearance?.resolved])
	return (
		<iframe
			{...props}
			ref={ref}
			onLoad={event => {
				apply()
				props.onLoad?.(event)
			}}
		/>
	)
}
