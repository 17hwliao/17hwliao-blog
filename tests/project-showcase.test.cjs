const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { loadSource } = require('./helpers/load-source.cjs')
const root = path.resolve(__dirname, '..')

test('project screenshots are actual available local PNGs with stable unique identities and provenance', () => {
	const { projectShowcases } = loadSource()('src/content/project-showcases.ts')
	const listed = require('../src/app/projects/list.json')
	const captures = require('../docs/project-showcase-captures.json').records
	assert.deepEqual(Object.keys(projectShowcases).sort(), listed.map(row => row.slug).sort())
	let images = 0
	for (const showcase of Object.values(projectShowcases)) {
		if (showcase.type === 'contribution') { assert.equal(showcase.shots.length, 0); continue }
		assert(showcase.shots.length >= 1)
		assert.equal(new Set(showcase.shots.map(shot => shot.id)).size, showcase.shots.length)
		for (const shot of showcase.shots) {
			assert.match(shot.src, /^\/images\/projects\/showcase\/[a-z0-9-]+\.png$/)
			const png = fs.readFileSync(path.join(root, 'public', shot.src))
			assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a')
			assert(png.readUInt32BE(16) >= 1000)
			assert(png.readUInt32BE(20) >= 600)
			const capture = captures.find(record => record.file === path.basename(shot.src))
			assert(capture && capture.project === listed.find(row => projectShowcases[row.slug] === showcase)?.slug)
			assert.equal(capture.sha256, createHash('sha256').update(png).digest('hex'), 'the displayed image must match its recorded capture')
			assert(shot.alt && shot.description && shot.provenance)
			for (const field of ['action', 'result', 'boundary']) assert(shot.capture[field]?.trim(), `${shot.id} needs its actual capture ${field}`)
			assert.match(shot.source, /^https:\/\/github\.com\/17hwliao\//)
			images++
		}
	}
	assert.equal(images, 33)
	assert.equal(captures.length, images)
})

test('journeys preserve ordered distinct steps and cover every available product capture exactly once', () => {
	const { projectShowcases } = loadSource()('src/content/project-showcases.ts')
	for (const showcase of Object.values(projectShowcases)) {
		if (showcase.type !== 'product') continue
		assert.equal(showcase.journeys.length, 3)
		assert.equal(new Set(showcase.journeys.map(journey => journey.id)).size, 3)
		const covered = showcase.journeys.flatMap(journey => {
			assert(journey.title && journey.description && journey.shots.length >= 2)
			for (const id of journey.shots) assert(showcase.shots.some(shot => shot.id === id))
			return journey.shots
		})
		assert.equal(new Set(covered).size, covered.length)
		assert.deepEqual(covered.slice().sort(), showcase.shots.map(shot => shot.id).sort())
	}
})

test('each claimed advantage has implementation and evidence, and picture references resolve in its own project', () => {
	const { projectShowcases } = loadSource()('src/content/project-showcases.ts')
	for (const showcase of Object.values(projectShowcases)) {
		assert.equal(showcase.advantages.length, 3)
		for (const item of showcase.advantages) {
			assert(item.title.trim() && item.benefit.trim() && item.mechanism.trim() && item.evidence.trim())
			if (showcase.type === 'product') assert(showcase.shots.some(shot => shot.id === item.shot), `${item.title} must link to evidence in this project`)
		}
	}
})

test('PR scenarios preserve the actual checked-in report decisions, rules and blocking semantics', () => {
	const { safetyScenarios, safetyReports, safetyChapters } = loadSource()('src/content/project-showcases.ts')
	assert.deepEqual(safetyScenarios.map(row => row.decision).sort(), ['allow', 'deny', 'needs_human_review'])
	for (const scenario of safetyScenarios) {
		const report = safetyReports.find(row => row.command === scenario.command)
		assert(report, 'scenario must come from the retained upstream example report')
		assert.equal(report.decision, scenario.decision)
		assert.equal(report.risk_level, scenario.risk)
		assert.equal(report.rule_id, scenario.rule)
		assert.equal(report.blocked, scenario.decision !== 'allow')
		if (scenario.decision !== 'allow') assert(report.findings.length > 0)
	}
	const changedFiles = new Set(['tool/safety/permission.go', 'tool/safety/safety.go', 'examples/tool_safety_guard/tool_safety_policy.yaml', 'examples/tool_safety_guard/tool_safety_audit.jsonl'])
	assert.equal(safetyChapters.length, 6)
	for (const chapter of safetyChapters) assert(changedFiles.has(chapter.file))
})
