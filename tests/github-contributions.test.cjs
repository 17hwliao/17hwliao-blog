const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadSource } = require('./helpers/load-source.cjs')
const { parseContributions, contributionCalendar, fetchContributions } = loadSource()('src/features/github/contributions.ts')

// Isolated synthetic dates exercise calendar boundaries; never used by the widget.
function fixture(start = '2023-03-01', length = 366) {
	return { contributions: Array.from({ length }, (_, index) => ({ date: new Date(Date.parse(start + 'T00:00:00Z') + index * 86400000).toISOString().slice(0, 10), count: index % 3 ? 0 : 2, level: index % 3 ? 0 : 1 })) }
}

test('contribution summaries use the exact displayed days, including leap day and a true all-zero year', () => {
	const input = fixture()
	input.total = { lastYear: 999999 } // A mismatched upstream summary must not change the visible range's total.
	const parsed = parseContributions(input)
	assert.equal(parsed.total, 244)
	assert.equal(parsed.activeDays, 122)
	assert.equal(parsed.days.at(-1).date, '2024-02-29')
	const empty = fixture()
	empty.contributions.forEach(day => { day.count = 0; day.level = 0 })
	assert.equal(parseContributions(empty).total, 0)
	assert.equal(parseContributions(empty).activeDays, 0)
})

test('missing dates, duplicate dates, impossible dates and malformed counts remain failures', () => {
	const gap = fixture(); gap.contributions.splice(100, 1)
	const duplicate = fixture(); duplicate.contributions[100] = duplicate.contributions[99]
	const impossible = fixture(); impossible.contributions[0].date = '2023-02-29'
	const count = fixture(); count.contributions[0].count = -1
	const level = fixture(); level.contributions[0].level = 0
	for (const broken of [{}, { contributions: [] }, gap, duplicate, impossible, count, level]) assert.throws(() => parseContributions(broken))
})

test('calendar positions use UTC weekdays with empty padding, never shifted or synthetic dates', () => {
	const data = parseContributions(fixture())
	const calendar = contributionCalendar(data.days)
	assert.equal(calendar.cells[0], null)
	assert.equal(calendar.cells[1], null)
	assert.equal(calendar.cells[2], null)
	assert.equal(calendar.cells[3].date, '2023-03-01') // Wednesday, independent of browser timezone.
	assert.equal(calendar.cells.length, calendar.weeks * 7)
	assert.deepEqual(calendar.cells.filter(Boolean), data.days)
	assert.equal(calendar.cells.findIndex(day => day?.date === '2024-02-29') % 7, 4)
	assert.ok(calendar.months.every(month => month.column < calendar.weeks - 1))
})

test('upstream fetch is bounded, cached, and never turns an HTTP error into a zero year', async () => {
	let calls = 0
	const result = await fetchContributions(async (url, options) => {
		calls++
		assert.equal(url, 'https://github-contributions-api.jogruber.de/v4/17hwliao?y=last')
		assert.equal(options.next.revalidate, 3600)
		assert.ok(options.signal)
		assert.equal(options.headers.Authorization, undefined)
		return Response.json(fixture())
	})
	assert.equal(calls, 1)
	assert.equal(result.total, 244)
	await assert.rejects(fetchContributions(async () => Response.json({ error: 'limited' }, { status: 429 })))
	await assert.rejects(fetchContributions(async () => Response.json({ contributions: [] })))
	await assert.rejects(fetchContributions(async () => { throw new Error('offline') }))
})

test('API failures are local and non-cacheable; successful calendars can be publicly cached', async () => {
	const success = loadSource({ '@/features/github/contributions': { fetchContributions: async () => parseContributions(fixture()) } })('src/app/api/github/contributions/route.ts')
	const response = await success.GET()
	assert.equal(response.status, 200)
	assert.match(response.headers.get('cache-control'), /s-maxage=3600/)
	assert.equal((await response.json()).total, 244)
	const failure = loadSource({ '@/features/github/contributions': { fetchContributions: async () => { throw new Error('private diagnostic') } } })('src/app/api/github/contributions/route.ts')
	const unavailable = await failure.GET()
	assert.equal(unavailable.status, 502)
	assert.equal(unavailable.headers.get('cache-control'), 'no-store')
	assert.doesNotMatch(await unavailable.text(), /private diagnostic/)
})
