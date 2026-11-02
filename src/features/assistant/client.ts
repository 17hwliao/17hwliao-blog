import { decodePerformance, type Performance } from './performance'

export type Source = { id: string; title: string; path: string; audience: string; text: string; score: number }
export type Answer = { mode: string; paragraphs: { text: string; sources: string[] }[]; sources: Source[]; performance?: Performance }
export type AgentConfig = { mode: string; indexVersion: string; featureCount: number; verifiedAt: string; characterCapabilities?: { version: number; motions: {id:string;label:string}[]; expressions:string[];maxBubbleCharacters:number } }
type AgentEvent = { name: string; data: unknown }

export function isSource(value: unknown): value is Source {
	if (!value || typeof value !== 'object') return false
	const v = value as Partial<Source>
	return (
		typeof v.id === 'string' &&
		typeof v.title === 'string' &&
		typeof v.path === 'string' &&
		/^\/(?!\/)/.test(v.path) &&
		!/[\\?#]|\.\./.test(v.path) &&
		typeof v.text === 'string' &&
		typeof v.audience === 'string'
	)
}
export function decodeAnswer(value: unknown): Answer {
	if (!value || typeof value !== 'object') throw new Error('回答格式异常。')
	const v = value as Partial<Answer>
	if (typeof v.mode !== 'string' || !Array.isArray(v.sources) || !v.sources.every(isSource) || !Array.isArray(v.paragraphs) || !v.paragraphs.length)
		throw new Error('回答格式异常。')
	const ids = new Set(v.sources.map(source => source.id))
	for (const p of v.paragraphs)
		if (!p || typeof p.text !== 'string' || !Array.isArray(p.sources) || !p.sources.every(id => typeof id === 'string' && ids.has(id)))
			throw new Error('回答引用无效。')
	return { mode: v.mode, paragraphs: v.paragraphs, sources: v.sources, performance: decodePerformance(v.performance, v.paragraphs.length, v.mode) }
}

// Parse real SSE frames across arbitrary network/UTF-8 boundaries. An answer
// alone is not completion: callers must receive a successful done event.
export async function readAgentEvents(response: Response, signal: AbortSignal, consume: (event: AgentEvent) => void) {
	if (!response.ok) {
		const data = await response.json().catch(() => null)
		throw new Error(data?.error?.message || `请求失败（${response.status}）。`)
	}
	if (!response.headers.get('content-type')?.startsWith('text/event-stream') || !response.body) throw new Error('助手响应格式异常。')
	const reader = response.body.getReader()
	const decoder = new TextDecoder()
	let pending = ''
	try {
		while (true) {
			const { value, done } = await reader.read()
			if (signal.aborted) throw signal.reason
			pending += decoder.decode(value, { stream: !done })
			if (pending.length > 65536) throw new Error('助手响应超出限制。')
			let separator: RegExpExecArray | null
			while ((separator = /\r?\n\r?\n/.exec(pending))) {
				const frame = pending.slice(0, separator.index)
				pending = pending.slice(separator.index + separator[0].length)
				const lines = frame.split(/\r?\n/)
				const name = lines
					.find(line => line.startsWith('event:'))
					?.slice(6)
					.trim()
				const data = lines
					.filter(line => line.startsWith('data:'))
					.map(line => line.slice(5).trimStart())
					.join('\n')
				if (name && data) consume({ name, data: JSON.parse(data) })
			}
			if (done) break
		}
		if (pending.trim()) throw new Error('回答在传输中途断开。')
	} finally {
		await reader.cancel().catch(() => {})
		reader.releaseLock()
	}
}
