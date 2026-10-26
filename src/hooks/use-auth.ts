import { create } from 'zustand'
import { clearAllAuthCache, getAuthToken as getToken, hasAuth as checkAuth, getPemFromCache, savePemToCache } from '@/lib/auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { signAppJwt } from '@/lib/github-client'

export type PrivateKeyStatus = {
	phase: 'idle' | 'reading' | 'validating' | 'ready' | 'verifying' | 'verified' | 'error'
	filename?: string
	message?: string
}

export const isPrivateKeyBusy = (status: PrivateKeyStatus) => ['reading', 'validating', 'verifying'].includes(status.phase)

interface AuthStore {
	// State
	isAuth: boolean
	privateKey: string | null
	keyStatus: PrivateKeyStatus

	// Actions
	setPrivateKey: (key: string) => Promise<void>
	importPrivateKey: (file: File) => Promise<boolean>
	clearAuth: () => void
	refreshAuthState: () => void
	getAuthToken: () => Promise<string>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
	isAuth: false,
	privateKey: null,
	keyStatus: { phase: 'idle' },

	setPrivateKey: async (key: string) => {
		try {
			if (!/-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(key)) throw new Error()
			signAppJwt('private-key-format-check', key)
		} catch {
			throw new Error('文件不是有效的 RSA 私钥，请选择 GitHub App 下载的 .pem 文件。')
		}
		// A newly selected key must not reuse the previous App's token.
		clearAllAuthCache()
		set({ isAuth: true, privateKey: key })
		const { siteContent } = useConfigStore.getState()
		if (siteContent?.isCachePem) {
			await savePemToCache(key)
		}
	},

	importPrivateKey: async file => {
		if (isPrivateKeyBusy(get().keyStatus)) return false
		set({ keyStatus: { phase: 'reading', filename: file.name } })
		try {
			if (!file.name.toLowerCase().endsWith('.pem')) throw new Error('请选择 .pem 格式的私钥文件。')
			if (!file.size) throw new Error('这个文件是空的，请重新下载私钥文件。')
			if (file.size > 64 * 1024) throw new Error('文件过大，请确认选择的是 GitHub App 私钥。')
			let key: string
			try {
				key = await file.text()
			} catch {
				throw new Error('无法读取文件，请检查文件是否可用后重新选择。')
			}
			set({ keyStatus: { phase: 'validating', filename: file.name } })
			// Let the reading/validation feedback paint before synchronous RSA parsing.
			await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
			await get().setPrivateKey(key)
			set({ keyStatus: { phase: 'ready', filename: file.name } })
			return true
		} catch (cause) {
			set({ keyStatus: { phase: 'error', filename: file.name, message: cause instanceof Error ? cause.message : '私钥导入失败，请重新选择。' } })
			return false
		}
	},

	clearAuth: () => {
		clearAllAuthCache()
		set({ isAuth: false, privateKey: null, keyStatus: { phase: 'idle' } })
	},

	refreshAuthState: async () => {
		set({ isAuth: await checkAuth() })
	},

	getAuthToken: async () => {
		const filename = get().keyStatus.filename
		set({ keyStatus: { phase: 'verifying', filename } })
		try {
			const token = await getToken()
			get().refreshAuthState()
			set({ keyStatus: { phase: 'verified', filename } })
			return token
		} catch (cause) {
			const message = cause instanceof Error ? cause.message : ''
			const hint = /401/.test(message) ? 'GitHub 未接受此私钥，请核对 App ID 与私钥是否属于同一个 App。'
				: /403|404/.test(message) ? '请确认 App 已安装到当前仓库，并具有 Contents 读写权限。'
				: /fetch|network|timeout/i.test(message) ? '无法连接 GitHub，请检查网络后重试保存。'
				: message || 'GitHub 授权验证未完成，请检查配置后重试。'
			set({ keyStatus: { phase: 'error', filename, message: hint } })
			throw new Error(hint)
		}
	}
}))

getPemFromCache().then((key) => {
	if (key) {
		useAuthStore.setState({ privateKey: key })
	}
})

checkAuth().then((isAuth) => {
	if (isAuth) {
		useAuthStore.setState({ isAuth })
	}
})
