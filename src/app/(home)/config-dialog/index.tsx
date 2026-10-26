'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import { useConfigStore, type SiteContent } from '../stores/config-store'
import { useAuthStore } from '@/hooks/use-auth'
import { GITHUB_CONFIG } from '@/consts'
import { pushSiteContent } from '../services/push-site-content'
import { FaviconAvatarUpload } from './site-settings/favicon-avatar-upload'
import type { FileItem } from './site-settings/types'

export default function ConfigDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
	const { siteContent, cardStyles, setSiteContent } = useConfigStore()
	const { isAuth, setPrivateKey } = useAuthStore()
	const [form, setForm] = useState<SiteContent>(siteContent)
	const [snapshot, setSnapshot] = useState('')
	const [favicon, setFavicon] = useState<FileItem | null>(null)
	const [avatar, setAvatar] = useState<FileItem | null>(null)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const saveLock = useRef(false)
	const keyInput = useRef<HTMLInputElement>(null)
	const configured = Boolean(GITHUB_CONFIG.OWNER && GITHUB_CONFIG.REPO && GITHUB_CONFIG.APP_ID)
	useEffect(() => {
		if (open) {
			setForm(structuredClone(siteContent))
			setSnapshot(JSON.stringify(siteContent))
			setFavicon(null)
			setAvatar(null)
			setError('')
		}
	}, [open])
	useEffect(
		() => () => {
			if (favicon?.type === 'file') URL.revokeObjectURL(favicon.previewUrl)
		},
		[favicon]
	)
	useEffect(
		() => () => {
			if (avatar?.type === 'file') URL.revokeObjectURL(avatar.previewUrl)
		},
		[avatar]
	)
	const close = () => {
		if (saveLock.current) return
		if ((JSON.stringify(form) !== snapshot || favicon || avatar) && !window.confirm('放弃尚未应用的设置修改？')) return
		onClose()
	}
	const valid = () => {
		if (!form.meta.title.trim()) {
			setError('请填写站点标题。')
			return false
		}
		for (const social of form.socialButtons) {
			if (social.type === 'email') {
				if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(social.value)) {
					setError('请填写有效的邮箱地址。')
					return false
				}
			} else {
				try {
					if (!['http:', 'https:'].includes(new URL(social.value).protocol)) throw new Error()
				} catch {
					setError('社交链接需要以 https:// 或 http:// 开头。')
					return false
				}
			}
		}
		setError('')
		return true
	}
	const apply = () => {
		if (!valid()) return
		if (favicon || avatar) {
			setError('图片更换需要保存到仓库；当前可先预览文字和链接。')
			return
		}
		setSiteContent(form)
		onClose()
	}
	const save = async () => {
		if (saveLock.current || !configured || !valid()) return
		saveLock.current = true
		setSaving(true)
		try {
			await pushSiteContent(form, cardStyles, favicon, avatar)
			setSiteContent(form)
			onClose()
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : '保存未能完成，请保留当前内容并稍后重试。')
		} finally {
			saveLock.current = false
			setSaving(false)
		}
	}
	return (
		<DialogModal open={open} onClose={close} ariaLabel='网站设置' className='settings-dialog'>
			<div className='settings-head'>
				<div>
					<p className='eyebrow'>PREFERENCES</p>
					<h2>网站设置</h2>
				</div>
				<button onClick={close} className='icon-button' aria-label='关闭设置' disabled={saving}>
					<X size={20} />
				</button>
			</div>
			<div className='settings-body'>
				<section className='settings-section'>
					<h3>基本信息</h3>
					<div className='settings-fields'>
						<label>
							站点标题
							<input value={form.meta.title} maxLength={40} onChange={e => setForm({ ...form, meta: { ...form.meta, title: e.target.value } })} />
						</label>
						<label>
							你的昵称
							<input value={form.meta.username} maxLength={40} onChange={e => setForm({ ...form, meta: { ...form.meta, username: e.target.value } })} />
						</label>
					</div>
					<label className='settings-description'>
						站点简介
						<textarea value={form.meta.description} rows={3} onChange={e => setForm({ ...form, meta: { ...form.meta, description: e.target.value } })} />
					</label>
				</section>
				<section className='settings-section'>
					<h3>站点图标与头像</h3>
					<FaviconAvatarUpload faviconItem={favicon} setFaviconItem={setFavicon} avatarItem={avatar} setAvatarItem={setAvatar} />
				</section>
				<section className='settings-section'>
					<h3>社交链接</h3>
					{!form.socialButtons.length && <p className='settings-hint'>添加你希望公开展示的链接。</p>}
					{form.socialButtons.map((social, index) => (
						<div className='social-setting' key={social.id}>
							<label>
								<span className='sr-only'>链接类型 {index + 1}</span>
								<select
									value={social.type}
									onChange={e =>
										setForm({ ...form, socialButtons: form.socialButtons.map(item => (item.id === social.id ? { ...item, type: e.target.value } : item)) })
									}>
									<option value='link'>网站</option>
									<option value='github'>GitHub</option>
									<option value='email'>邮箱</option>
									{!['link', 'github', 'email'].includes(social.type) && <option value={social.type}>{social.type}</option>}
								</select>
							</label>
							<label>
								<span className='sr-only'>链接名称 {index + 1}</span>
								<input
									placeholder='名称'
									value={social.label || ''}
									onChange={e =>
										setForm({ ...form, socialButtons: form.socialButtons.map(item => (item.id === social.id ? { ...item, label: e.target.value } : item)) })
									}
								/>
							</label>
							<label className='social-value'>
								<span className='sr-only'>链接地址 {index + 1}</span>
								<input
									placeholder={social.type === 'email' ? 'hello@example.com' : 'https://'}
									value={social.value}
									onChange={e =>
										setForm({ ...form, socialButtons: form.socialButtons.map(item => (item.id === social.id ? { ...item, value: e.target.value } : item)) })
									}
								/>
							</label>
							<button
								className='icon-button'
								aria-label={`删除链接 ${index + 1}`}
								onClick={() => setForm({ ...form, socialButtons: form.socialButtons.filter(item => item.id !== social.id) })}>
								<Trash2 size={16} />
							</button>
						</div>
					))}
					<button
						className='button-light'
						onClick={() =>
							setForm({
								...form,
								socialButtons: [...form.socialButtons, { id: `link-${Date.now()}`, type: 'link', value: '', label: '', order: form.socialButtons.length + 1 }]
							})
						}>
						<Plus size={15} /> 添加链接
					</button>
				</section>
				<section className='settings-section'>
					<h3>
						备案信息 <span>可选</span>
					</h3>
					<div className='settings-fields'>
						<label>
							备案号
							<input value={form.beian.text} onChange={e => setForm({ ...form, beian: { ...form.beian, text: e.target.value } })} />
						</label>
						<label>
							备案链接
							<input
								value={form.beian.link}
								placeholder='https://beian.miit.gov.cn/'
								onChange={e => setForm({ ...form, beian: { ...form.beian, link: e.target.value } })}
							/>
						</label>
					</div>
				</section>
				{!configured && <p className='settings-hint'>可先应用到本次预览。保存到仓库需配置自己的 GitHub 仓库和 GitHub App。</p>}
				{error && (
					<p className='form-error' role='alert'>
						{error}
					</p>
				)}
			</div>
			<div className='settings-footer'>
				<span>预览修改在刷新后恢复。</span>
				<div>
					<button onClick={apply} disabled={saving} className='button-light'>
						应用预览
					</button>
					<button
						onClick={() => {
							if (valid()) {
								if (isAuth) void save()
								else keyInput.current?.click()
							}
						}}
						disabled={saving || !configured}
						className='button-dark'>
						{saving ? '保存中…' : '保存到仓库'}
					</button>
				</div>
			</div>
			<input
				ref={keyInput}
				hidden
				type='file'
				accept='.pem'
				onChange={async e => {
					const file = e.target.files?.[0]
					e.currentTarget.value = ''
					if (!file) return
					try {
						await setPrivateKey(await file.text())
						await save()
					} catch {
						setError('密钥文件读取失败，请重新选择。')
					}
				}}
			/>
		</DialogModal>
	)
}
