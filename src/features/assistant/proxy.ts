type Endpoint = 'config' | 'features' | 'search' | 'chat' | 'conversation'
type Settings = { NODE_ENV?: string; AGENT_SERVICE_URL?: string }
const methods: Record<Endpoint, string> = { config: 'GET', features: 'GET', search: 'GET', chat: 'POST', conversation: 'DELETE' }
const noStore = { 'Cache-Control': 'no-store' }

function failure(status: number, code: string, message: string) {
	return Response.json({ error: { code, message } }, { status, headers: noStore })
}

async function boundedBody(request: Request) {
	const reader = request.body?.getReader()
	if (!reader) return undefined
	const chunks: Uint8Array[] = []
	let size = 0
	try {
		while (true) {
			const { value, done } = await reader.read()
			if (done) break
			size += value.byteLength
			if (size > 8192) {
				await reader.cancel()
				throw new Error('body-too-large')
			}
			chunks.push(value)
		}
	} finally {
		reader.releaseLock()
	}
	const body = new Uint8Array(size)
	let offset = 0
	for (const chunk of chunks) {
		body.set(chunk, offset)
		offset += chunk.byteLength
	}
	return body
}

// The browser only talks to the blog origin. Provider secrets stay in Go;
// forward only the one opaque agent cookie, never blog/GitHub credentials.
export async function proxyAgent(request: Request, endpoint: string, fetcher: typeof fetch = fetch, settings: Settings = process.env): Promise<Response> {
	if (!Object.hasOwn(methods, endpoint)) return failure(404, 'not_found', '没有这个助手接口。')
	if (request.method !== methods[endpoint as Endpoint]) return failure(405, 'method_not_allowed', '请求方式不受支持。')
	const incoming = new URL(request.url)
	// Next dev may construct Request.url with localhost even when the browser
	// opened 127.0.0.1. The actual Host header identifies the browser origin.
	const browserURL = new URL(incoming)
	if (request.headers.get('host')) browserURL.host = request.headers.get('host')!
	if (settings.NODE_ENV === 'development' && !['localhost', '127.0.0.1', '[::1]'].includes(browserURL.hostname))
		return failure(403, 'local_only', '当前开发服务请使用本地回环地址访问。')
	const origin = request.headers.get('origin')
	if (origin && origin !== browserURL.origin) return failure(403, 'origin_denied', '请从本站打开博客助手。')
	const configured = settings.AGENT_SERVICE_URL || (settings.NODE_ENV === 'development' ? 'http://127.0.0.1:4180' : '')
	if (!configured) return failure(503, 'agent_not_configured', '博客助手暂未启用，其他博客功能仍可使用。')
	let base: URL
	try {
		base = new URL(configured)
		if (
			!['http:', 'https:'].includes(base.protocol) ||
			!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname) ||
			base.username ||
			base.password ||
			base.search ||
			base.hash ||
			base.pathname !== '/'
		)
			throw new Error('invalid-backend')
	} catch {
		return failure(503, 'agent_config_invalid', '博客助手服务地址尚未正确配置。')
	}
	const target = new URL(`/v1/${endpoint}`, base)
	if (endpoint === 'search') target.searchParams.set('q', incoming.searchParams.get('q') || '')
	const headers = new Headers()
	const cookie = request.headers
		.get('cookie')
		?.split(';')
		.map(value => value.trim())
		.find(value => /^blog_guide_sid=[a-f0-9]{48}$/.test(value))
	if (cookie) headers.set('cookie', cookie)
	let body: Uint8Array | undefined
	if (request.method === 'POST') {
		if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return failure(415, 'invalid_content_type', '请以 JSON 提交问题。')
		headers.set('Content-Type', 'application/json')
		try {
			body = await boundedBody(request)
		} catch {
			return failure(413, 'request_too_large', '问题过长，请缩短后重试。')
		}
	}
	const controller = new AbortController()
	const abort = () => controller.abort(request.signal.reason)
	request.signal.addEventListener('abort', abort, { once: true })
	if (request.signal.aborted) abort()
	const deadline = setTimeout(() => controller.abort(new DOMException('Agent timed out', 'TimeoutError')), 50000)
	const cleanup = () => {
		clearTimeout(deadline)
		request.signal.removeEventListener('abort', abort)
	}
	try {
		const upstream = await fetcher(target, {
			method: request.method,
			headers,
			body: body as BodyInit | undefined,
			signal: controller.signal,
			cache: 'no-store',
			redirect: 'error'
		})
		const output = new Headers(noStore)
		const ct = upstream.headers.get('content-type') || ''
		if (upstream.status !== 204 && !ct.startsWith('application/json') && !ct.startsWith('text/event-stream')) {
			await upstream.body?.cancel()
			cleanup()
			return failure(502, 'agent_invalid_response', '助手服务返回异常，请稍后重试。')
		}
		if (ct) output.set('Content-Type', ct)
		if (ct.startsWith('text/event-stream')) output.set('X-Accel-Buffering', 'no')
		const setCookie = upstream.headers.get('set-cookie')
		const match = setCookie?.match(/^blog_guide_sid=([a-f0-9]{48}|);/)
		if (match)
			output.set(
				'Set-Cookie',
				`blog_guide_sid=${match[1]}; Path=/api/agent; HttpOnly; SameSite=Strict; Max-Age=${match[1] ? 1800 : 0}${incoming.protocol === 'https:' ? '; Secure' : ''}`
			)
		if (!upstream.body || upstream.status === 204) {
			cleanup()
			return new Response(null, { status: upstream.status, headers: output })
		}
		const reader = upstream.body.getReader()
		const stream = new ReadableStream<Uint8Array>({
			async pull(destination) {
				try {
					const result = await reader.read()
					if (result.done) {
						cleanup()
						reader.releaseLock()
						destination.close()
					} else destination.enqueue(result.value)
				} catch (error) {
					cleanup()
					destination.error(error)
				}
			},
			async cancel(reason) {
				controller.abort(reason)
				cleanup()
				await reader.cancel(reason).catch(() => {})
			}
		})
		return new Response(stream, { status: upstream.status, headers: output })
	} catch {
		cleanup()
		return controller.signal.reason?.name === 'TimeoutError'
			? failure(504, 'agent_timeout', '助手响应超时，请稍后重试。')
			: failure(503, 'agent_unavailable', '本地助手服务尚未启动或暂时不可用。请启动 Go 服务后重试。')
	}
}
