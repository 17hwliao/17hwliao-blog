'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import useSWR from 'swr'
import { ArrowUpRight, Github, RefreshCw } from 'lucide-react'
import { contributionCalendar, contributionUsername, type ContributionData } from './contributions'

async function loadCalendar(url: string): Promise<ContributionData> {
	const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
	if (!response.ok) throw new Error('暂时无法读取贡献数据')
	return response.json()
}

export function ContributionWidget() {
	const { data, error, isLoading, isValidating, mutate } = useSWR<ContributionData>('/api/github/contributions', loadCalendar, {
		revalidateOnFocus: false, errorRetryCount: 0, dedupingInterval: 3600_000
	})
	const [selectedDate, setSelectedDate] = useState<string | null>(null)
	const [hoveredDate, setHoveredDate] = useState<string | null>(null)
	const scrollRef = useRef<HTMLDivElement>(null)
	const calendar = data ? contributionCalendar(data.days) : null
	const selected = data?.days.find(day => day.date === selectedDate) ?? data?.days.at(-1)
	const detail = data?.days.find(day => day.date === hoveredDate) ?? selected
	useEffect(() => {
		if (data && scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
	}, [data])
	const navigate = (event: KeyboardEvent<HTMLButtonElement>, date: string) => {
		if (!data) return
		const index = data.days.findIndex(day => day.date === date)
		const delta = ({ ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 } as Record<string, number>)[event.key]
		if (delta === undefined && event.key !== 'Home' && event.key !== 'End') return
		event.preventDefault()
		const next = event.key === 'Home' ? 0 : event.key === 'End' ? data.days.length - 1 : Math.max(0, Math.min(data.days.length - 1, index + delta!))
		const nextDate = data.days[next].date
		setSelectedDate(nextDate)
		setHoveredDate(null)
		scrollRef.current?.querySelector<HTMLButtonElement>(`[data-date="${nextDate}"]`)?.focus()
	}
	return (
		<section className='github-contributions' aria-labelledby='github-contributions-title'>
			<div className='contribution-heading'>
				<div>
					<h2 id='github-contributions-title'><Github size={20} aria-hidden='true' /> GitHub 贡献</h2>
					<p>一点一点，把想法写成代码。</p>
				</div>
				<a className='text-link' href={`https://github.com/${contributionUsername}`} target='_blank' rel='noreferrer'>@{contributionUsername} <ArrowUpRight size={15} /></a>
			</div>
			{isLoading && <p className='contribution-message' role='status'>正在读取 GitHub 公开贡献…</p>}
			{error && <div className='contribution-error' role='status'>
				<p>{data ? '刷新未成功，仍显示上次读取的贡献数据。' : '暂时无法读取 GitHub 贡献，可以重试或前往 GitHub 查看。'}</p>
				<button type='button' className='text-link' onClick={() => void mutate()} disabled={isValidating}>重新读取 <RefreshCw size={14} /></button>
			</div>}
			{data && calendar && <>
				<div className='contribution-summary'>
					<p><strong>{data.total.toLocaleString('zh-CN')}</strong> 次贡献 <span>· {data.activeDays} 个活跃日</span></p>
					<p className='contribution-range'>{data.days[0].date} — {data.days.at(-1)!.date}</p>
				</div>
				<div ref={scrollRef} className='contribution-scroll' role='group' aria-label='每日贡献热力图，可用方向键选择日期'>
					<div className='contribution-calendar' style={{ '--contribution-weeks': calendar.weeks } as CSSProperties} onMouseLeave={() => setHoveredDate(null)}>
						{calendar.months.map(month => <span className='contribution-month' key={month.column} style={{ gridColumn: `${month.column + 2} / span ${Math.min(3, calendar.weeks - month.column)}`, gridRow: 1 }}>{month.label}</span>)}
						{[[1, '一'], [3, '三'], [5, '五']].map(([row, label]) => <span className='contribution-weekday' key={row} style={{ gridColumn: 1, gridRow: Number(row) + 2 }}>周{label}</span>)}
						{calendar.cells.map((day, index) => day ? <button
							type='button' key={day.date} className='contribution-cell' data-level={day.level} data-date={day.date}
							style={{ gridColumn: Math.floor(index / 7) + 2, gridRow: index % 7 + 2 }}
							aria-label={`${day.date}，${day.count} 次贡献`} aria-pressed={selected?.date === day.date}
							tabIndex={selected?.date === day.date ? 0 : -1} title={`${day.date} · ${day.count} 次贡献`}
							onMouseEnter={() => setHoveredDate(day.date)} onFocus={() => { setSelectedDate(day.date); setHoveredDate(null) }}
							onClick={() => { setSelectedDate(day.date); setHoveredDate(null) }} onKeyDown={event => navigate(event, day.date)}
						/> : null)}
					</div>
				</div>
				<div className='contribution-detail'>
					<p role='status'>{detail?.date} <span>· {detail?.count} 次贡献</span></p>
					<div className='contribution-legend' aria-label='颜色从浅到深表示贡献从少到多'>少 {[0, 1, 2, 3, 4].map(level => <span key={level} data-level={level} />)} 多</div>
				</div>
				<div className='contribution-footnote'>
					<p>公开贡献数据 · 约每小时更新 · 包含提交、PR 等活动<span className='contribution-mobile-hint'> · 左右滑动查看全年</span></p>
					<button type='button' className='contribution-refresh' aria-label='刷新 GitHub 贡献' onClick={() => void mutate()} disabled={isValidating}><RefreshCw size={15} />{isValidating ? '读取中' : '刷新'}</button>
				</div>
			</>}
		</section>
	)
}
