const test = require('node:test')
const assert = require('node:assert/strict')
const { loadSource } = require('./helpers/load-source.cjs')
const { decodeAnswer } = loadSource()('src/features/assistant/client.ts')
const { characterCue, decodePerformance } = loadSource()('src/features/assistant/performance.ts')
const performance = { version: 1, motion: 'wave', expression: 'happy', bubble: { kind: 'answer', paragraph: 0 }, intensity: 'soft', source: 'model' }
const answer = {
	mode: 'adk-rag',
	paragraphs: [{ text: '阅读工作台可以导出记录。', sources: ['reading'] }],
	sources: [{ id: 'reading', title: '阅读工作台', path: '/reading', text: '说明', audience: 'reader' }],
	performance
}
test('validated answer derives the bubble from its own paragraph, not model-supplied free text', () => {
	const decoded = decodeAnswer({ ...answer, performance: { ...performance, arbitrary: 'removed' } })
	const cue = characterCue(decoded)
	assert.equal(cue.bubbleText, answer.paragraphs[0].text)
	assert.equal(cue.performance.arbitrary, undefined)
	assert.equal(decodePerformance({ ...performance, bubble: { kind: 'answer', paragraph: 3 } }, 1, 'adk-rag'), undefined)
})
test('bad or incompatible decoration is ignored while the grounded answer remains usable', () => {
	assert.equal(decodeAnswer({ ...answer, performance: { ...performance, motion: 'run_shell' } }).performance, undefined)
	assert.equal(decodeAnswer({ ...answer, mode: 'retrieval-only' }).performance, undefined)
	assert.equal(decodeAnswer({ ...answer, performance: undefined }).paragraphs[0].text, answer.paragraphs[0].text)
	assert.equal(characterCue({ ...answer, paragraphs: [{ text: '😀'.repeat(200) }] }).bubbleText.length, 191)
})
