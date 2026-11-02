const test = require('node:test')
const assert = require('node:assert/strict')
const { loadSource } = require('./helpers/load-source.cjs')
const { proxyAgent } = loadSource()('src/features/assistant/proxy.ts')
const { readAgentEvents, decodeAnswer } = loadSource()('src/features/assistant/client.ts')
const settings = { NODE_ENV: 'development' }
const sid = 'a'.repeat(48)

test('agent proxy forwards only its session cookie, preserves SSE and scopes refreshed cookies', async () => {
	let called = false
	const request = new Request('http://localhost:2025/api/agent/chat', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Origin: 'http://localhost:2025',
			Cookie: `blog_guide_sid=${sid}; github-token=must-not-forward`,
			Authorization: 'must-not-forward'
		},
		body: '{"message":"阅读工作台"}'
	})
	const result = await proxyAgent(
		request,
		'chat',
		async (url, options) => {
			called = true
			assert.equal(url.href, 'http://127.0.0.1:4180/v1/chat')
			assert.equal(options.headers.get('cookie'), `blog_guide_sid=${sid}`)
			assert.equal(options.headers.get('authorization'), null)
			assert.equal(options.headers.get('origin'), null)
			assert.equal(new TextDecoder().decode(options.body), '{"message":"阅读工作台"}')
			return new Response('event: done\ndata: {"status":"complete"}\n\n', {
				headers: { 'Content-Type': 'text/event-stream', 'Set-Cookie': `blog_guide_sid=${sid}; Path=/; HttpOnly; Max-Age=1800` }
			})
		},
		settings
	)
	assert.equal(called, true)
	assert.match(result.headers.get('set-cookie'), /Path=\/api\/agent; HttpOnly; SameSite=Strict/)
	assert.match(result.headers.get('content-type'), /text\/event-stream/)
	assert.match(await result.text(), /event: done/)
})

test('proxy returns a live stream before completion and cancels the upstream on reader cancellation', async () => {
	let signal,
		cancelled = false
	const response = await proxyAgent(
		new Request('http://localhost:2025/api/agent/config'),
		'config',
		async (_, options) => {
			signal = options.signal
			return new Response(
				new ReadableStream({
					start(controller) {
						controller.enqueue(new TextEncoder().encode('{"partial":'))
					},
					cancel() {
						cancelled = true
					}
				}),
				{ headers: { 'Content-Type': 'application/json' } }
			)
		},
		settings
	)
	const reader = response.body.getReader()
	assert.equal(new TextDecoder().decode((await reader.read()).value), '{"partial":')
	await reader.cancel()
	assert.equal(signal.aborted, true)
	assert.equal(cancelled, true)
})

test('proxy rejects unapproved endpoints, cross-origin writes, oversized requests and nonlocal backends', async () => {
	const neverFetch = () => {
		throw new Error('should never fetch')
	}
	assert.equal((await proxyAgent(new Request('http://localhost:2025/api/agent/config'), '../../.env', neverFetch, settings)).status, 404)
	assert.equal(
		(
			await proxyAgent(
				new Request('http://localhost:2025/api/agent/chat', { method: 'POST', headers: { Origin: 'https://elsewhere.example' } }),
				'chat',
				neverFetch,
				settings
			)
		).status,
		403
	)
	assert.equal(
		(
			await proxyAgent(
				new Request('http://localhost:2025/api/agent/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(8193) }),
				'chat',
				neverFetch,
				settings
			)
		).status,
		413
	)
	assert.equal(
		(await proxyAgent(new Request('http://localhost:2025/api/agent/config'), 'config', neverFetch, { AGENT_SERVICE_URL: 'https://elsewhere.example' })).status,
		503
	)
	assert.equal((await proxyAgent(new Request('http://localhost:2025/api/agent/config'), 'config', neverFetch, { NODE_ENV: 'production' })).status, 503)
})

test('Next dev internal localhost URL accepts the real 127.0.0.1 browser origin', async () => {
	const request = new Request('http://localhost:2025/api/agent/config', { headers: { Host: '127.0.0.1:2025', Origin: 'http://127.0.0.1:2025' } })
	const response = await proxyAgent(request, 'config', async () => Response.json({ mode: 'retrieval-only' }), settings)
	assert.equal(response.status, 200)
	await response.text()
})

test('backend failures remain failures and conversation deletion clears only the agent cookie', async () => {
	const unavailable = await proxyAgent(
		new Request('http://localhost:2025/api/agent/config'),
		'config',
		async () => {
			throw new Error('private backend diagnostic')
		},
		settings
	)
	assert.equal(unavailable.status, 503)
	assert.doesNotMatch(await unavailable.text(), /private backend diagnostic/)
	const deleted = await proxyAgent(
		new Request('https://localhost:2025/api/agent/conversation', { method: 'DELETE' }),
		'conversation',
		async () => new Response(null, { status: 204, headers: { 'Set-Cookie': 'blog_guide_sid=; Path=/; Max-Age=0' } }),
		settings
	)
	assert.equal(deleted.status, 204)
	assert.match(deleted.headers.get('set-cookie'), /Max-Age=0; Secure/)
})

test('SSE parser preserves Chinese across byte boundaries and handles CRLF frames', async () => {
	const data = new TextEncoder().encode('event: status\r\ndata: {"text":"查找功能"}\r\n\r\nevent: done\r\ndata: {"status":"complete"}\r\n\r\n')
	const events = []
	const stream = new ReadableStream({
		start(controller) {
			for (const byte of data) controller.enqueue(Uint8Array.of(byte))
			controller.close()
		}
	})
	await readAgentEvents(new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }), new AbortController().signal, event => events.push(event))
	assert.equal(events[0].data.text, '查找功能')
	assert.equal(events[1].data.status, 'complete')
	await assert.rejects(
		() => readAgentEvents(new Response('event: answer\ndata: {', { headers: { 'Content-Type': 'text/event-stream' } }), new AbortController().signal, () => {}),
		/中途断开/
	)
})

test('client only accepts source paths and citations supplied in the answer', () => {
	const answer = {
		mode: 'adk-rag',
		paragraphs: [{ text: '使用阅读工作台。', sources: ['reading'] }],
		sources: [{ id: 'reading', title: '阅读工作台', path: '/reading', text: '说明', audience: 'reader' }]
	}
	assert.equal(decodeAnswer(answer).sources[0].path, '/reading')
	assert.throws(() => decodeAnswer({ ...answer, paragraphs: [{ text: '编造来源', sources: ['invented'] }] }), /引用无效/)
	assert.throws(() => decodeAnswer({ ...answer, sources: [{ ...answer.sources[0], path: '//attacker.example' }] }), /格式异常/)
})
