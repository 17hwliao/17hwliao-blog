const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadSource } = require('./helpers/load-source.cjs')
const load = loadSource()
const { companionAction, shouldRoam } = load('src/features/assistant/companion-motion.js')
const { resolveZenbotRigMotion, evaluateZenbotRig } = load('src/features/zenbot/runtime/characters/zenbot-rig-motions.js')
const { chooseZenbotMotion } = load('src/features/zenbot/runtime/figures/zenbot.js')

test('companion hop enters the actual source crouch contract and plays wind-up, air and landing', () => {
	for (const elapsed of [0, 0.08, 0.3, 0.7]) {
		const frame = companionAction('hop', elapsed)
		assert.equal(chooseZenbotMotion(frame), 'hop')
		assert.equal(resolveZenbotRigMotion(frame).id, 'hop')
		assert.equal(frame.modeT, elapsed)
	}
	const crouch = evaluateZenbotRig(companionAction('hop', 0.08), 40)
	const air = evaluateZenbotRig(companionAction('hop', 0.3), 40)
	const land = evaluateZenbotRig(companionAction('hop', 0.7), 40)
	assert.notDeepEqual(crouch.deformers.body, air.deformers.body)
	assert.notDeepEqual(air.deformers.body, land.deformers.body)
	assert.equal(companionAction('hop', 0.9), null)
})

test('one-shot base motions and gestures use independent clocks and source durations', () => {
	for (const [kind, duration] of [
		['wave', 1.7],
		['spin', 0.8],
		['nod', 0.8],
		['bow', 1.7],
		['dance', 3.4],
		['sit', 0.8]
	]) {
		const frame = companionAction(kind, duration / 2)
		assert.equal(chooseZenbotMotion(frame), kind)
		assert.equal(resolveZenbotRigMotion(frame).id, kind)
		assert.equal(frame.modeT, duration / 2)
		if (frame.gesture) assert.equal(frame.gesture.k, 0.5)
		assert.equal(companionAction(kind, duration), null)
	}
	assert.equal(companionAction('unknown', 0), null)
})

test('roaming resumes at one second without contact, with open chat independent of walking', () => {
	assert.equal(shouldRoam(10.999, 10, false, false), false)
	assert.equal(shouldRoam(11, 10, false, false), true)
	assert.equal(shouldRoam(12, 10, true, false), false)
	assert.equal(shouldRoam(12, 10, false, true), false)
})
