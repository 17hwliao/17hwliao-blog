export const characterMotions = [
	'hello',
	'wave',
	'doubleWave',
	'fidget',
	'shyPeek',
	'bounce',
	'nuzzle',
	'lookAround',
	'earFlick',
	'tailSwish',
	'toeTap',
	'happyNod',
	'headShake',
	'wristRoll'
] as const
export const characterExpressions = ['neutral', 'happy', 'focused', 'thinking', 'shy', 'surprised', 'wink'] as const
export type Performance = {
	version: 1
	motion: (typeof characterMotions)[number]
	expression: (typeof characterExpressions)[number]
	bubble: { kind: 'answer'; paragraph: number }
	intensity: 'soft' | 'normal'
	source: 'model' | 'local'
}

// Cosmetic suggestions cannot invalidate a well-grounded factual answer.
export function decodePerformance(value: unknown, paragraphCount: number, mode: string): Performance | undefined {
	if (!value || typeof value !== 'object') return
	const v = value as Partial<Performance>
	if (
		v.version !== 1 ||
		!characterMotions.includes(v.motion!) ||
		!characterExpressions.includes(v.expression!) ||
		!['soft', 'normal'].includes(v.intensity!) ||
		!v.bubble ||
		v.bubble.kind !== 'answer' ||
		!Number.isSafeInteger(v.bubble.paragraph) ||
		v.bubble.paragraph < 0 ||
		v.bubble.paragraph >= paragraphCount
	)
		return
	if ((v.source === 'model' && mode !== 'adk-rag') || (v.source === 'local' && !['retrieval-only', 'preset'].includes(mode)) || !['model', 'local'].includes(v.source!)) return
	return {
		version: 1,
		motion: v.motion!,
		expression: v.expression!,
		bubble: { kind: 'answer', paragraph: v.bubble.paragraph },
		intensity: v.intensity!,
		source: v.source!
	}
}

export function characterCue(answer: { mode: string; paragraphs: { text: string }[]; performance?: Performance }) {
	const performance = decodePerformance(answer.performance, answer.paragraphs.length, answer.mode)
	const paragraph = answer.paragraphs[performance?.bubble.paragraph ?? 0]
	if (!paragraph) return {}
	const text = paragraph.text
		.replace(/[\u0000-\u001f\u007f]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
	const characters = [...text]
	const bubbleText = characters.length > 96 ? characters.slice(0, 95).join('') + '…' : text
	return { performance, bubbleText }
}
