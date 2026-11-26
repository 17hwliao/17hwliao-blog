'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Timer } from 'lucide-react'
import { BentoCard } from './bento-card'

const HOME_TZ = 'Asia/Shanghai'

function formatTime(date: Date, timeZone: string, use24h: boolean): string {
	try {
		return new Intl.DateTimeFormat('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: !use24h,
			timeZone
		}).format(date)
	} catch {
		return '--:--'
	}
}

function getTzAbbr(timeZone: string): string {
	try {
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone,
			timeZoneName: 'short'
		}).formatToParts(new Date())
		return parts.find(p => p.type === 'timeZoneName')?.value ?? (timeZone.split('/').pop() || timeZone)
	} catch {
		return 'UTC+8'
	}
}

function getOffsetLabel(homeTz: string, visitorTz: string): string {
	try {
		const now = new Date()
		const toMins = (tz: string) => {
			const d = new Date(now.toLocaleString('en-US', { timeZone: tz }))
			return d.getHours() * 60 + d.getMinutes()
		}
		let diff = toMins(homeTz) - toMins(visitorTz)
		if (diff > 720) diff -= 1440
		if (diff < -720) diff += 1440
		if (diff === 0) return '同一时区 · same tz'
		const abs = Math.abs(diff)
		const h = Math.floor(abs / 60)
		const m = abs % 60
		const label = m > 0 ? `${h}h ${m}m` : `${h}h`
		return diff > 0 ? `比你快 ${label}` : `比你慢 ${label}`
	} catch {
		return 'UTC+8'
	}
}

export function TimeZoneBentoCard({ className = '' }: { className?: string }) {
	const [use24h, setUse24h] = useState(true)
	const [now, setNow] = useState<Date | null>(null)
	const [visitorTz, setVisitorTz] = useState(HOME_TZ)

	useEffect(() => {
		setVisitorTz(Intl.DateTimeFormat().resolvedOptions().timeZone || HOME_TZ)
		setNow(new Date())
		const timer = setInterval(() => setNow(new Date()), 15_000)
		return () => clearInterval(timer)
	}, [])

	const homeTime = now ? formatTime(now, HOME_TZ, use24h) : '17:20'
	const visitorTime = now ? formatTime(now, visitorTz, use24h) : '17:20'
	const offset = now ? getOffsetLabel(HOME_TZ, visitorTz) : 'CST · UTC+8'

	return (
		<BentoCard className={className}>
			<div className='bento-tz-wrap'>
				<div className='bento-tz-block'>
					<div className='bento-tz-top'>
						<span className='bento-live-dot' aria-hidden='true' />
						<span className='bento-tz-kicker'>IN SHANGHAI · 中国</span>
						<div className='bento-tz-actions'>
							<button type='button' className='bento-tz-toggle' onClick={() => setUse24h(v => !v)}>
								{use24h ? '12H' : '24H'}
							</button>
							<Link href='/clock' className='bento-tz-clocklink' title='打开专注番茄钟与秒表' aria-label='打开专注时钟'>
								<Timer size={13} />
							</Link>
						</div>
					</div>
					<time className='bento-tz-time'>{homeTime}</time>
					<span className='bento-tz-sub'>CST (UTC+8) · 博主所在地</span>
				</div>

				<div className='bento-tz-divider'>
					<span className='bento-tz-line' />
					<span className='bento-tz-offset'>{offset}</span>
					<span className='bento-tz-line' />
				</div>

				<div className='bento-tz-block'>
					<span className='bento-tz-kicker'>WHERE YOU ARE · 你的时间</span>
					<time className='bento-tz-time is-secondary'>{visitorTime}</time>
					<span className='bento-tz-sub'>{now ? getTzAbbr(visitorTz) : 'LOCAL'}</span>
				</div>
			</div>
		</BentoCard>
	)
}
