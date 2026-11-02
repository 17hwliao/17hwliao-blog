'use client'

import { Toaster } from 'sonner'
import { useAppearance } from '@/features/appearance/theme'
export function SiteToaster() {
	const appearance = useAppearance()
	return <Toaster position='bottom-right' richColors theme={appearance?.resolved ?? 'light'} />
}
