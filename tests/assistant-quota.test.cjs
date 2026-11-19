const test = require('node:test')
const assert = require('node:assert/strict')
const { loadSource } = require('./helpers/load-source.cjs')
const { proxyAgent } = loadSource()('src/features/assistant/proxy.ts')
const sid = 'a'.repeat(48), device = 'b'.repeat(48) + '.' + 'c'.repeat(64)

test('quota and chat preserve only signed-device shape and session cookies; multiple refreshed cookies remain HttpOnly', async () => {
	const response = await proxyAgent(new Request('http://localhost:2025/api/agent/quota', { headers: { Cookie: `blog_guide_device=${device}; blog_guide_sid=${sid}; github-token=private` } }), 'quota', async (_, options) => {
		assert.equal(options.headers.get('cookie'), `blog_guide_device=${device}; blog_guide_sid=${sid}`)
		const headers = new Headers({ 'Content-Type': 'application/json' })
		headers.append('Set-Cookie', `blog_guide_sid=${sid}; Path=/; HttpOnly`)
		headers.append('Set-Cookie', `blog_guide_device=${device}; Path=/; HttpOnly`)
		headers.append('Set-Cookie', 'github-token=must-not-expose; Path=/')
		return new Response('{}', { headers })
	}, { NODE_ENV: 'development' })
	const cookies = response.headers.getSetCookie()
	assert.equal(cookies.length, 2)
	assert.ok(cookies.every(cookie => cookie.includes('Path=/api/agent; HttpOnly; SameSite=Strict')))
	assert.match(cookies.find(c => c.startsWith('blog_guide_device=')), /Max-Age=31536000/)
	await response.text()
})
test('visitor-supplied IP headers cannot override network identity in local development or default production', async () => {
	for (const settings of [{ NODE_ENV: 'development', AGENT_TRUSTED_IP_HEADER: 'cf-connecting-ip' }, { NODE_ENV: 'production', AGENT_SERVICE_URL: 'http://127.0.0.1:4180' }]) {
		const response = await proxyAgent(new Request('http://localhost:2025/api/agent/quota', { headers: { 'X-Blog-Client-IP': '203.0.113.99', 'cf-connecting-ip': '203.0.113.100', 'X-Forwarded-For': '203.0.113.101' } }), 'quota', async (_, options) => {
			assert.equal(options.headers.get('X-Blog-Client-IP'), null)
			return Response.json({})
		}, settings)
		await response.text()
	}
})
test('only a configured trusted edge header is forwarded; malformed IP remains untrusted', async () => {
	for (const [value, expected] of [['203.0.113.42', '203.0.113.42'], ['203.0.113.42, 192.0.2.1', null]]) {
		const response = await proxyAgent(new Request('https://blog.example/api/agent/quota', { headers: { 'cf-connecting-ip': value } }), 'quota', async (_, options) => {
			assert.equal(options.headers.get('X-Blog-Client-IP'), expected)
			return Response.json({})
		}, { NODE_ENV: 'production', AGENT_SERVICE_URL: 'http://127.0.0.1:4180', AGENT_TRUSTED_IP_HEADER: 'cf-connecting-ip' })
		await response.text()
	}
})
