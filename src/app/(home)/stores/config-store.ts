import { create } from 'zustand'
import siteContent from '@/config/site-content.json'
import cardStyles from '@/config/card-styles.json'

type ImageConfig = { id: string; url: string }
type SocialButtonConfig = { id: string; type: string; value: string; label?: string; order: number }

// Keep editable collections typed even when a new blog starts with no content.
export type SiteContent = Omit<typeof siteContent, 'artImages' | 'backgroundImages' | 'socialButtons'> & {
	artImages: ImageConfig[]
	backgroundImages: ImageConfig[]
	socialButtons: SocialButtonConfig[]
}
export type CardStyles = {
	[K in keyof typeof cardStyles]: Omit<(typeof cardStyles)[K], 'offsetX' | 'offsetY'> & {
		offsetX: number | null
		offsetY: number | null
	}
}

interface ConfigStore {
	siteContent: SiteContent
	cardStyles: CardStyles
	regenerateKey: number
	configDialogOpen: boolean
	setSiteContent: (content: SiteContent) => void
	setCardStyles: (styles: CardStyles) => void
	resetSiteContent: () => void
	resetCardStyles: () => void
	regenerateBubbles: () => void
	setConfigDialogOpen: (open: boolean) => void
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
	siteContent: { ...siteContent },
	cardStyles: { ...cardStyles },
	regenerateKey: 0,
	configDialogOpen: false,
	setSiteContent: (content: SiteContent) => {
		set({ siteContent: content })
	},
	setCardStyles: (styles: CardStyles) => {
		set({ cardStyles: styles })
	},
	resetSiteContent: () => {
		set({ siteContent: { ...siteContent } })
	},
	resetCardStyles: () => {
		set({ cardStyles: { ...cardStyles } })
	},
	regenerateBubbles: () => {
		set(state => ({ regenerateKey: state.regenerateKey + 1 }))
	},
	setConfigDialogOpen: (open: boolean) => {
		set({ configDialogOpen: open })
	}
}))
