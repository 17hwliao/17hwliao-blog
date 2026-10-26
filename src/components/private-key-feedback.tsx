'use client'

import { useRef } from 'react'
import { CircleCheck, CircleAlert, LoaderCircle, KeyRound } from 'lucide-react'
import { isPrivateKeyBusy, useAuthStore } from '@/hooks/use-auth'
import { GITHUB_CONFIG } from '@/consts'

export function PrivateKeyFeedback({ allowImport = false }: { allowImport?: boolean }) {
	const { keyStatus, importPrivateKey } = useAuthStore()
	const input = useRef<HTMLInputElement>(null)
	const busy = isPrivateKeyBusy(keyStatus)
	if (!allowImport && keyStatus.phase === 'idle') return null
	const title = {
		idle: '导入 GitHub App 私钥', reading: '正在读取私钥…', validating: '正在检查私钥格式…',
		ready: '私钥已导入', verifying: '正在验证 GitHub 授权…', verified: 'GitHub 授权令牌已就绪', error: '私钥授权未完成'
	}[keyStatus.phase]
	const description = keyStatus.phase === 'error' ? keyStatus.message
		: keyStatus.phase === 'ready' ? '私钥格式有效，保存时会验证 GitHub 授权；当前内容尚未因此保存。'
		: keyStatus.phase === 'verified' ? '已取得或载入 GitHub 访问令牌，内容是否保存请以保存结果为准。'
		: keyStatus.phase === 'verifying' ? '正在核对 App 与仓库的安装授权，请稍候。'
		: keyStatus.phase === 'idle' ? '选择 .pem 文件后会显示读取结果；导入本身不会发布内容。'
		: '文件仅在当前浏览器中读取，请稍候。'
	const Icon = busy ? LoaderCircle : keyStatus.phase === 'error' ? CircleAlert
		: ['ready', 'verified'].includes(keyStatus.phase) ? CircleCheck : KeyRound
	return (
		<div className='private-key-feedback' data-phase={keyStatus.phase}>
			<div className='private-key-message' role={keyStatus.phase === 'error' ? 'alert' : 'status'} aria-live='polite' aria-atomic='true'>
				<Icon size={18} aria-hidden='true' className={busy ? 'animate-spin' : undefined} />
				<div><strong>{title}</strong>{keyStatus.filename && <span className='private-key-filename'>{keyStatus.filename}</span>}<p>{description}</p></div>
			</div>
			<p className='private-key-config'>目标：{GITHUB_CONFIG.OWNER}/{GITHUB_CONFIG.REPO} · App ID {GITHUB_CONFIG.APP_ID || '未配置'}</p>
			{(allowImport || keyStatus.phase === 'error') && <button type='button' className='button-light' disabled={busy} onClick={() => input.current?.click()}>
				{busy ? '处理中…' : keyStatus.phase === 'idle' ? '导入 .pem 私钥' : '重新选择私钥'}
			</button>}
			<input ref={input} type='file' accept='.pem' hidden onChange={async event => {
				const file = event.currentTarget.files?.[0]
				event.currentTarget.value = ''
				if (file) await importPrivateKey(file)
			}} />
		</div>
	)
}
