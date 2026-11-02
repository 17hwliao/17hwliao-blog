export type Excerpt = { id: string; quote: string; note: string; offset: number; createdAt: string }
export type ReadingEntry = {
	title: string
	position: number
	progress: number
	bookmarked: boolean
	completed: boolean
	updatedAt: string
	excerpts: Excerpt[]
}
export type ReadingData = { version: 1; entries: Record<string, ReadingEntry> }
export const emptyReading: ReadingData = { version: 1, entries: {} }
export const readingKey = '17hwliao:reading:v1'
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value))
const percentage = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
export function decodeReading(raw: string | null): ReadingData {
	if (raw === null) return { version: 1, entries: {} }
	const value: unknown = JSON.parse(raw)
	if (!record(value) || value.version !== 1 || !record(value.entries)) throw new Error('阅读数据格式无法识别，请先导出备份后再重置。')
	const entries: Record<string, ReadingEntry> = Object.create(null)
	for (const [slug, item] of Object.entries(value.entries)) {
		if (
			!/^[^/\\?#%\s.][^/\\?#%\s]*$/.test(slug) ||
			['__proto__', 'constructor', 'prototype'].includes(slug) ||
			!record(item) ||
			typeof item.title !== 'string' ||
			!percentage(item.position) ||
			!percentage(item.progress) ||
			typeof item.bookmarked !== 'boolean' ||
			typeof item.completed !== 'boolean' ||
			typeof item.updatedAt !== 'string' ||
			!Array.isArray(item.excerpts)
		)
			throw new Error('部分阅读记录已损坏，暂未覆盖原数据。')
		const excerpts = item.excerpts.map(excerpt => {
			if (
				!record(excerpt) ||
				typeof excerpt.id !== 'string' ||
				typeof excerpt.quote !== 'string' ||
				!excerpt.quote.trim() ||
				excerpt.quote.length > 2000 ||
				typeof excerpt.note !== 'string' ||
				excerpt.note.length > 4000 ||
				typeof excerpt.offset !== 'number' ||
				!Number.isSafeInteger(excerpt.offset) ||
				excerpt.offset < 0 ||
				typeof excerpt.createdAt !== 'string'
			)
				throw new Error('摘录格式无法识别，暂未覆盖原数据。')
			return { id: excerpt.id, quote: excerpt.quote, note: excerpt.note, offset: excerpt.offset, createdAt: excerpt.createdAt }
		})
		entries[slug] = {
			title: item.title,
			position: item.position,
			progress: item.progress,
			bookmarked: item.bookmarked,
			completed: item.completed,
			updatedAt: item.updatedAt,
			excerpts
		}
	}
	return { version: 1, entries }
}
export function updateReading(data: ReadingData, slug: string, title: string, patch: Partial<Omit<ReadingEntry, 'updatedAt'>>) {
	const previous = data.entries[slug] ?? { title, position: 0, progress: 0, bookmarked: false, completed: false, updatedAt: '', excerpts: [] }
	const next = { ...previous, ...patch, title, updatedAt: new Date().toISOString() }
	const value: ReadingData = { version: 1, entries: { ...data.entries, [slug]: next } }
	return decodeReading(JSON.stringify(value))
}
