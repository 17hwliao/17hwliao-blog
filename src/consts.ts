import githubDefaults from '@/config/github.json'

export const INIT_DELAY = 0.3
export const ANIMATION_DELAY = 0.1
export const CARD_SPACING = 36
export const CARD_SPACING_SM = 24
export const BLOG_SLUG_KEY = process.env.BLOG_SLUG_KEY || ''

/**
 * GitHub 仓库配置
 */
export const GITHUB_CONFIG = {
	// Public deployment defaults; the private key is selected only in the browser.
	OWNER: process.env.NEXT_PUBLIC_GITHUB_OWNER || githubDefaults.owner,
	REPO: process.env.NEXT_PUBLIC_GITHUB_REPO || githubDefaults.repo,
	BRANCH: process.env.NEXT_PUBLIC_GITHUB_BRANCH || githubDefaults.branch,
	APP_ID: process.env.NEXT_PUBLIC_GITHUB_APP_ID || githubDefaults.appId,
	ENCRYPT_KEY: process.env.NEXT_PUBLIC_GITHUB_ENCRYPT_KEY || 'wudishiduomejimo'
} as const
