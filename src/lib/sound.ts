export type Tone = {
	freq: number
	to?: number
	type?: OscillatorType
	at?: number
	peak?: number
	attack?: number
	decay: number
}

export const SOUND_STORAGE_KEY = '17hwliao:sound:v1'
export const SOUND_EVENT = '17hwliao:sound-change'

/* Shared AudioContext: browsers cap how many contexts a document may open. */
let ctx: AudioContext | null = null

function audio(): AudioContext | null {
	if (typeof window === 'undefined') return null
	const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
	if (!Ctor) return null
	ctx ??= new Ctor()
	if (ctx.state === 'suspended') {
		void ctx.resume().catch(() => {})
	}
	return ctx
}

function voice({ freq, to, type = 'sine', at = 0, peak = 0.1, attack, decay }: Tone) {
	const c = audio()
	if (!c) return
	const osc = c.createOscillator()
	const gain = c.createGain()
	osc.connect(gain)
	gain.connect(c.destination)
	osc.type = type

	const t = c.currentTime + at
	osc.frequency.setValueAtTime(freq, t)
	if (to) osc.frequency.exponentialRampToValueAtTime(to, t + decay)
	gain.gain.setValueAtTime(attack ? 0.0001 : peak, t)
	if (attack) gain.gain.linearRampToValueAtTime(peak, t + attack)
	gain.gain.exponentialRampToValueAtTime(0.001, t + decay)
	osc.start(t)
	osc.stop(t + decay + 0.005)
}

export function isSoundEnabled(): boolean {
	if (typeof window === 'undefined') return true
	try {
		const modern = localStorage.getItem(SOUND_STORAGE_KEY)
		if (modern === 'false' || modern === '0') return false
		if (modern === 'true' || modern === '1') return true
		const legacy = localStorage.getItem('soundEnabled')
		if (legacy === 'false') return false
	} catch {}
	return true
}

export function setSoundEnabled(enabled: boolean): void {
	if (typeof window === 'undefined') return
	try {
		localStorage.setItem(SOUND_STORAGE_KEY, String(enabled))
		localStorage.setItem('soundEnabled', String(enabled))
	} catch {}
	window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: { enabled } }))
}

export function play(tones: Tone[]): void {
	if (!isSoundEnabled()) return
	try {
		tones.forEach(voice)
	} catch {}
}

/** Signature arpeggio chime from Ladvace/astro-bento-portfolio (theme / style switch) */
export const CHIME: Tone[] = [440, 554, 659].map((freq, i) => ({
	freq,
	type: 'triangle',
	at: i * 0.055,
	peak: 0.09,
	attack: 0.01,
	decay: 0.18
}))

/** Double low pulse heartbeat from Ladvace/astro-bento-portfolio (PixelHeart & reactions) */
export const HEARTBEAT: Tone[] = [0, 0.18].map(at => ({
	freq: 80,
	at,
	peak: 0.18,
	decay: 0.12
}))

/** Subtle tactile tick when hovering Bento cards */
export const CARD_HOVER: Tone[] = [{ freq: 1100, to: 500, peak: 0.12, decay: 0.018 }]

/** Gentle Zenbot chirp when opening companion or selecting a preset question */
export const ZENBOT_CHIRP: Tone[] = [
	{ freq: 587, to: 740, type: 'triangle', at: 0, peak: 0.075, attack: 0.008, decay: 0.11 },
	{ freq: 880, type: 'sine', at: 0.065, peak: 0.065, attack: 0.008, decay: 0.14 }
]
