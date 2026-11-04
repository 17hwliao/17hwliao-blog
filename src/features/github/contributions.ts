export const contributionUsername = '17hwliao'
export const contributionSource = `https://github-contributions-api.jogruber.de/v4/${contributionUsername}?y=last`

export type ContributionDay = { date: string; count: number; level: number }
export type ContributionData = { username: string; days: ContributionDay[]; total: number; activeDays: number }

const dayMilliseconds = 86_400_000
const timestamp = (date: string) => Date.parse(`${date}T00:00:00Z`)

// Reject partial or malformed calendars instead of inventing zero-contribution days.
export function parseContributions(payload: unknown): ContributionData {
	const rows = (payload as { contributions?: unknown } | null)?.contributions
	if (!Array.isArray(rows) || rows.length < 350 || rows.length > 371) throw new Error('Invalid contribution calendar')
	const days = rows.map((row: unknown): ContributionDay => {
		if (!row || typeof row !== 'object') throw new Error('Invalid contribution day')
		const { date, count, level } = row as ContributionDay
		if (
			typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(timestamp(date)) ||
			new Date(timestamp(date)).toISOString().slice(0, 10) !== date ||
			!Number.isSafeInteger(count) || count < 0 || !Number.isInteger(level) || level < 0 || level > 4 ||
			(count === 0) !== (level === 0)
		) throw new Error('Invalid contribution day')
		return { date, count, level }
	}).sort((a, b) => a.date.localeCompare(b.date))
	for (let index = 1; index < days.length; index++) {
		if (timestamp(days[index].date) - timestamp(days[index - 1].date) !== dayMilliseconds) throw new Error('Incomplete contribution calendar')
	}
	const total = days.reduce((sum, day) => sum + day.count, 0)
	if (!Number.isSafeInteger(total)) throw new Error('Invalid contribution total')
	return { username: contributionUsername, days, total, activeDays: days.filter(day => day.count > 0).length }
}

export function contributionCalendar(days: ContributionDay[]) {
	const offset = new Date(timestamp(days[0].date)).getUTCDay()
	const weeks = Math.ceil((offset + days.length) / 7)
	const cells: (ContributionDay | null)[] = Array.from({ length: weeks * 7 }, (_, index) => days[index - offset] ?? null)
	const months: { column: number; label: string }[] = []
	for (let column = 0; column < weeks; column++) {
		const week = cells.slice(column * 7, column * 7 + 7).filter((day): day is ContributionDay => day !== null)
		const marker = week.find(day => day.date.endsWith('-01')) ?? (column === 0 ? week[0] : undefined)
		if (marker && column < weeks - 1) months.push({ column, label: `${Number(marker.date.slice(5, 7))}月` })
	}
	return { weeks, cells, months }
}

export async function fetchContributions(fetcher: typeof fetch = fetch): Promise<ContributionData> {
	const response = await fetcher(contributionSource, {
		headers: { Accept: 'application/json' },
		signal: AbortSignal.timeout(10_000),
		next: { revalidate: 3600 }
	})
	if (!response.ok) throw new Error('Contribution service unavailable')
	return parseContributions(await response.json())
}
