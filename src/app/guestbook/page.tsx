'use client'

import './guestbook.css'

import { useEffect, useState, type FormEvent } from 'react'
import { ArrowUpRight, Mail, MessageSquarePlus } from 'lucide-react'
import { CARD_HOVER, CHIME, HEARTBEAT, play } from '@/lib/sound'

type GuestbookNote = {
	id: string
	author: string
	tag: string
	date: string
	message: string
	likes: number
	liked?: boolean
	tilt: number
	reply?: { from: string; text: string }
}

const STORAGE_KEY = '17hwliao:guestbook:v1'

const SEED_NOTES: GuestbookNote[] = [
	{
		id: 'seed-zenbot',
		author: 'Zenbot',
		tag: '小站袖珍向导',
		date: '2026-11-26',
		message: '报到！我已经从桌宠项目顺利搬进博客啦～首页可以 360° 转我玩，页面底部也能随时点我问问题！',
		likes: 18,
		tilt: -0.6,
		reply: { from: '17hwliao', text: '欢迎入驻！18 部件骨骼和步态验收圆满迁移。' }
	},
	{
		id: 'seed-agentmesh',
		author: 'Backend Reader',
		tag: 'Go & Agent 读者',
		date: '2026-11-20',
		message: 'AgentMesh 系列里关于双 Outbox 投递与配额幂等结算的拆解写得很扎实，配着 Glass / Paper 主题读代码体验很舒服。',
		likes: 12,
		tilt: 0.55,
		reply: { from: '17hwliao', text: '感谢认真读完！后续还会继续更新网关接入的实战记录。' }
	},
	{
		id: 'seed-sql',
		author: 'SQL Explorer',
		tag: '数据库爱好者',
		date: '2026-11-12',
		message: '从《三色标记》和 SQL Sentinel 项目页摸过来的，Bento 卡片的音效和像素小红心很有意思！',
		likes: 9,
		tilt: 0.45
	},
	{
		id: 'seed-music',
		author: 'Zenix Listener',
		tag: '独立软件玩家',
		date: '2026-11-03',
		message: '一边开着右下角背景音乐，一边翻STW 地球和相册，小站越来越有个人数字花园的味道了。',
		likes: 15,
		tilt: -0.45
	}
]

function loadSavedNotes(): GuestbookNote[] {
	if (typeof window === 'undefined') return SEED_NOTES
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return SEED_NOTES
		const parsed = JSON.parse(raw)
		if (!Array.isArray(parsed)) return SEED_NOTES
		return parsed
	} catch {
		return SEED_NOTES
	}
}

export default function GuestbookPage() {
	const [notes, setNotes] = useState<GuestbookNote[]>(SEED_NOTES)
	const [author, setAuthor] = useState('')
	const [message, setMessage] = useState('')

	useEffect(() => {
		setNotes(loadSavedNotes())
	}, [])

	const persist = (next: GuestbookNote[]) => {
		setNotes(next)
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
		} catch {}
	}

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault()
		const cleanText = message.trim()
		if (!cleanText) return
		const cleanAuthor = author.trim() || '路过的访客'
		const today = new Date()
			.toLocaleDateString('zh-CN', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				timeZone: 'Asia/Shanghai'
			})
			.replace(/\//g, '-')
		const nextNote: GuestbookNote = {
			id: `local-${Date.now()}`,
			author: cleanAuthor.slice(0, 24),
			tag: '本地便签',
			date: today,
			message: cleanText.slice(0, 280),
			likes: 1,
			liked: true,
			tilt: Number(((Math.random() - 0.5) * 1.2).toFixed(2))
		}
		play(CHIME)
		persist([nextNote, ...notes])
		setMessage('')
	}

	const toggleLike = (id: string) => {
		play(HEARTBEAT)
		const next = notes.map(item => {
			if (item.id !== id) return item
			const liked = !item.liked
			return {
				...item,
				liked,
				likes: Math.max(0, item.likes + (liked ? 1 : -1))
			}
		})
		persist(next)
	}

	return (
		<div className='guestbook-page'>
			<section data-ui-surface='hero' className='bento-card guestbook-hero'>
				<div>
					<span className='guestbook-kicker'>GUESTBOOK · 访客留言墙</span>
					<h1>留下一张小站便签</h1>
					<p>逛到这里不妨打个招呼、聊聊项目想法，或者点亮卡片上的像素红心。本地便签保存在你的浏览器中；如需长期公开交流，也欢迎通过 GitHub 或邮件联系我。</p>
				</div>
				<div className='guestbook-hero-links'>
					<a href='https://github.com/17hwliao/17hwliao-blog/issues' target='_blank' rel='noreferrer' className='guestbook-ext-btn'>
						GitHub 留言 <ArrowUpRight size={14} />
					</a>
					<a href='mailto:shiqihaowuliao@qq.com' className='guestbook-ext-btn'>
						<Mail size={14} /> 写封邮件
					</a>
				</div>
			</section>

			<section data-ui-surface='panel' className='bento-card guestbook-composer' aria-label='写下新便签'>
				<form className='guestbook-form' onSubmit={handleSubmit}>
					<div className='guestbook-form-row'>
						<input
							type='text'
							className='guestbook-input'
							placeholder='你的称呼（选填）'
							maxLength={24}
							value={author}
							onChange={e => setAuthor(e.target.value)}
						/>
					</div>
					<textarea
						className='guestbook-textarea'
						placeholder='写下一句招呼、读后感或给 Zenbot 的留言（最多 280 字）…'
						maxLength={280}
						value={message}
						onChange={e => setMessage(e.target.value)}
					/>
					<div className='guestbook-submit-row'>
						<span className='guestbook-hint'>贴出后将立即展示在下方 Bento 便签墙（支持随时点赞互动）</span>
						<button type='submit' className='guestbook-submit' disabled={!message.trim()}>
							<MessageSquarePlus size={15} />
							<span>贴上便签</span>
						</button>
					</div>
				</form>
			</section>

			<section className='guestbook-grid' aria-label='留言列表'>
				{notes.map(note => (
					<article
						key={note.id}
						data-ui-surface='panel'
						className='bento-card card--ns guestbook-entry'
						style={{ '--entry-tilt': `${note.tilt}deg` } as React.CSSProperties}
						onMouseEnter={() => play(CARD_HOVER)}>
						<header className='guestbook-entry-head'>
							<div className='guestbook-author'>
								<span className='guestbook-badge' aria-hidden='true'>
									{note.author.slice(0, 1).toUpperCase()}
								</span>
								<div>
									<strong>{note.author}</strong>
									<span>
										{note.tag} · {note.date}
									</span>
								</div>
							</div>
							<button
								type='button'
								className={'guestbook-like' + (note.liked ? ' is-liked' : '')}
								aria-pressed={Boolean(note.liked)}
								aria-label={`为 ${note.author} 的留言点红心`}
								onClick={() => toggleLike(note.id)}>
								<svg width='14' height='12' viewBox='0 0 7 6' shapeRendering='crispEdges' aria-hidden='true'>
									<rect x='1' y='0' width='2' height='1' fill='currentColor' />
									<rect x='4' y='0' width='2' height='1' fill='currentColor' />
									<rect x='0' y='1' width='7' height='1' fill='currentColor' />
									<rect x='0' y='2' width='7' height='1' fill='currentColor' />
									<rect x='1' y='3' width='5' height='1' fill='currentColor' />
									<rect x='2' y='4' width='3' height='1' fill='currentColor' />
									<rect x='3' y='5' width='1' height='1' fill='currentColor' />
								</svg>
								<span>{note.likes}</span>
							</button>
						</header>

						<p className='guestbook-message'>{note.message}</p>

						{note.reply && (
							<div className='guestbook-replies'>
								<div className='guestbook-reply'>
									<strong>{note.reply.from}</strong>
									<span>{note.reply.text}</span>
								</div>
							</div>
						)}
					</article>
				))}
			</section>
		</div>
	)
}
