import { ZENBOT_RIG_MOTION_SPECS } from '../zenbot/runtime/characters/zenbot-rig-motions.js'

// The source rig accepts hop as crouch/jumpV, and one-shot time is local to
// the action. Reusing walk modeT skips the wind-up and landing entirely.
export function companionAction(kind, elapsed) {
	const spec = ZENBOT_RIG_MOTION_SPECS[kind]
	if (!spec) return null
	const time = Math.max(0, elapsed)
	if (time >= spec.seconds) return null
	return {
		mode: spec.gesture ? 'idle' : kind === 'hop' || kind === 'jump' ? 'crouch' : kind === 'stand' ? 'wake' : kind,
		modeT: time,
		jumpV: kind === 'jump' ? 700 : kind === 'hop' ? 450 : undefined,
		gesture: spec.gesture ? { kind, k: time / spec.seconds } : null,
		duration: spec.seconds
	}
}

export function shouldRoam(now, lastContact, actionActive, reducedMotion) {
	return !reducedMotion && !actionActive && now - lastContact >= 1
}
