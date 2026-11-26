import {
  ZENBOT_EXPRESSION_IDS,
  ZENBOT_MOTION_IDS,
} from './zenbot-manifest.js';
import { sampleZenbotGait } from './zenbot-gait.js';

const TAU = Math.PI * 2;
const MOTION_SCHEMA_VERSION = 1;

export const ZENBOT_RIG_MOTION_IDS = Object.freeze([...ZENBOT_MOTION_IDS]);

export const ZENBOT_RIG_DEFORMER_IDS = Object.freeze([
  'body',
  'chest',
  'head',
  'hair_back',
  'arm_l',
  'arm_r',
  'skirt',
  'leg_l',
  'leg_r',
]);

export const ZENBOT_RIG_GESTURE_IDS = Object.freeze([
  'nod',
  'shake',
  'spin',
  'wave',
  'bow',
  'shiver',
  'flap',
]);

const GESTURE_SET = new Set(ZENBOT_RIG_GESTURE_IDS);
const MODE_MOTIONS = new Set(['look', 'walk', 'run', 'sit', 'sleep', 'dizzy', 'dance']);
const EXPRESSION_SET = new Set(ZENBOT_EXPRESSION_IDS);

/**
 * Motion timing follows RIG_BASELINE.md. `segments` are in seconds and name the
 * wind-up, peak/hold, and tail portions of a one-shot motion. Loop motions keep
 * their manifest clip length for preview purposes but are evaluated continuously.
 */
export const ZENBOT_RIG_MOTION_SPECS = Object.freeze({
  stand: Object.freeze({
    seconds: 1.2,
    loop: false,
    gesture: false,
    segments: Object.freeze({ windup: [0, 0.18], peak: [0.18, 0.45], tail: [0.45, 1.2] }),
  }),
  jump: Object.freeze({
    seconds: 1.2,
    loop: false,
    gesture: false,
    segments: Object.freeze({ windup: [0, 0.16], peak: [0.16, 0.58], tail: [0.58, 1.2] }),
  }),
  hop: Object.freeze({
    seconds: 0.9,
    loop: false,
    gesture: false,
    segments: Object.freeze({ windup: [0, 0.12], peak: [0.12, 0.42], tail: [0.42, 0.9] }),
  }),
  look: Object.freeze({
    seconds: 2.7,
    loop: false,
    gesture: false,
    segments: Object.freeze({ windup: [0, 0.25], peak: [0.25, 1.8], tail: [1.8, 2.7] }),
  }),
  turn: Object.freeze({
    seconds: 0.4,
    loop: false,
    gesture: false,
    segments: Object.freeze({ windup: [0, 0.12], peak: [0.12, 0.3], tail: [0.3, 0.4] }),
  }),
  nod: Object.freeze({
    seconds: 0.8,
    loop: false,
    gesture: true,
    segments: Object.freeze({ windup: [0, 0.12], peak: [0.12, 0.62], tail: [0.62, 0.8] }),
  }),
  shake: Object.freeze({
    seconds: 0.8,
    loop: false,
    gesture: true,
    segments: Object.freeze({ windup: [0, 0.1], peak: [0.1, 0.64], tail: [0.64, 0.8] }),
  }),
  spin: Object.freeze({
    seconds: 0.8,
    loop: false,
    gesture: true,
    segments: Object.freeze({ windup: [0, 0.12], peak: [0.12, 0.64], tail: [0.64, 0.8] }),
  }),
  sit: Object.freeze({
    seconds: 0.8,
    loop: false,
    lasting: true,
    gesture: false,
    segments: Object.freeze({ windup: [0, 0.35], peak: [0.35, 0.6], tail: [0.6, null] }),
  }),
  sleep: Object.freeze({
    seconds: 0.8,
    loop: false,
    lasting: true,
    gesture: false,
    segments: Object.freeze({ windup: [0, 0.5], peak: [0.5, 2.0], tail: [2.0, null] }),
  }),
  dizzy: Object.freeze({
    seconds: 3.2,
    loop: false,
    gesture: false,
    segments: Object.freeze({ windup: [0, 0.25], peak: [0.25, 2.4], tail: [2.4, 3.2] }),
  }),
  walk: Object.freeze({
    seconds: 12,
    loop: true,
    gesture: false,
    cadence: 2.1,
    segments: Object.freeze({ windup: [0, 0.2], peak: [0.2, 0.8], tail: [0.8, 12] }),
  }),
  run: Object.freeze({
    seconds: 12,
    loop: true,
    gesture: false,
    cadence: 4.4,
    segments: Object.freeze({ windup: [0, 0.16], peak: [0.16, 0.52], tail: [0.52, 12] }),
  }),
  wave: Object.freeze({
    seconds: 1.7,
    loop: false,
    gesture: true,
    segments: Object.freeze({ windup: [0, 0.18], peak: [0.18, 1.2], tail: [1.2, 1.7] }),
  }),
  bow: Object.freeze({
    seconds: 1.7,
    loop: false,
    gesture: true,
    segments: Object.freeze({ windup: [0, 0.22], peak: [0.22, 0.8], tail: [0.8, 1.7] }),
  }),
  shiver: Object.freeze({
    seconds: 1.9,
    loop: false,
    gesture: true,
    segments: Object.freeze({ windup: [0, 0.16], peak: [0.16, 1.35], tail: [1.35, 1.9] }),
  }),
  flap: Object.freeze({
    seconds: 1.5,
    loop: false,
    gesture: true,
    segments: Object.freeze({ windup: [0, 0.16], peak: [0.16, 0.85], tail: [0.85, 1.5] }),
  }),
  dance: Object.freeze({
    seconds: 3.4,
    loop: false,
    gesture: false,
    cadence: 1.1,
    segments: Object.freeze({ windup: [0, 0.25], peak: [0.25, 2.8], tail: [2.8, 3.4] }),
  }),
});

export const ZENBOT_RIG_LIMITS = Object.freeze({
  gazeX: 5,
  gazeY: 4,
  hairSway: 3.5,
  skirtSway: 4,
  mouthUnits: 5.5,
  talkHzMin: 8,
  talkHzMax: 12,
  breathSeconds: 4.2,
  blinkPeriodSeconds: 3.8,
  blinkJitterSeconds: 1.4,
  blinkCloseSeconds: 0.13,
});

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, value) {
  if (edge1 <= edge0) return value < edge0 ? 0 : 1;
  const k = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return k * k * (3 - 2 * k);
}

function bell(value) {
  const k = clamp(value, 0, 1);
  return Math.sin(Math.PI * k) ** 2;
}

function wrap(value, period) {
  if (!(period > 0)) return 0;
  return ((value % period) + period) % period;
}

function clean(value) {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round(value * 1e6) / 1e6;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function state(a = 0, tx = 0, ty = 0, sx = 1, sy = 1) {
  return { a, tx, ty, sx, sy };
}

function copyState(value) {
  return state(value.a, value.tx, value.ty, value.sx, value.sy);
}

function pose() {
  const deformers = {};
  for (const id of ZENBOT_RIG_DEFORMER_IDS) deformers[id] = state();
  return {
    deformers,
    touched: new Set(),
    gaze: null,
    hints: {},
  };
}

function addDeformer(target, id, values = {}) {
  const item = target.deformers[id];
  item.a += values.a ?? 0;
  item.tx += values.tx ?? 0;
  item.ty += values.ty ?? 0;
  item.sx *= values.sx ?? 1;
  item.sy *= values.sy ?? 1;
  target.touched.add(id);
}

function scaledCopy(value, k) {
  return state(
    value.a * k,
    value.tx * k,
    value.ty * k,
    1 + (value.sx - 1) * k,
    1 + (value.sy - 1) * k,
  );
}

function mergedCopy(primary, secondary, secondaryWeight) {
  const under = scaledCopy(secondary, secondaryWeight);
  return state(
    primary.a + under.a,
    primary.tx + under.tx,
    primary.ty + under.ty,
    primary.sx * under.sx,
    primary.sy * under.sy,
  );
}

function mergePose(base, gesture) {
  const out = pose();
  for (const id of ZENBOT_RIG_DEFORMER_IDS) {
    const inBase = base.touched.has(id);
    const inGesture = gesture.touched.has(id);
    if (inGesture && inBase) {
      out.deformers[id] = mergedCopy(gesture.deformers[id], base.deformers[id], 0.15);
      out.touched.add(id);
    } else if (inGesture) {
      out.deformers[id] = copyState(gesture.deformers[id]);
      out.touched.add(id);
    } else if (inBase) {
      out.deformers[id] = copyState(base.deformers[id]);
      out.touched.add(id);
    }
  }
  if (gesture.gaze) out.gaze = { ...gesture.gaze };
  else if (base.gaze) out.gaze = { ...base.gaze };
  out.hints = { ...base.hints, ...gesture.hints };
  return out;
}

function normalizedFacing(value) {
  const facing = finite(value, 1);
  if (facing < 0) return -1;
  if (facing > 0) return 1;
  return 1;
}

function normalizeTime(time, frame) {
  const direct = Number(time);
  if (Number.isFinite(direct)) return Math.max(0, direct);
  const fromFrame = Number(frame?.t);
  return Number.isFinite(fromFrame) ? Math.max(0, fromFrame) : 0;
}

function specOf(id) {
  return ZENBOT_RIG_MOTION_SPECS[id] ?? null;
}

function resolveModeMotion(frame, options, mode) {
  if (mode === 'wake') return 'stand';
  if (MODE_MOTIONS.has(mode)) return mode;
  if (mode === 'crouch') {
    const jumpV = Number(frame?.jumpV);
    return Number.isFinite(jumpV) && jumpV >= 650 ? 'jump' : 'hop';
  }
  if (mode === 'air') return 'jump';
  if (mode === 'land') return 'jump';
  if (options.turn === true) return 'turn';
  if (
    options.previousFacing != null
    && frame?.facing != null
    && normalizedFacing(options.previousFacing) !== normalizedFacing(frame.facing)
  ) {
    return 'turn';
  }
  return null;
}

/**
 * Resolves the gesture and base layers without evaluating any curves.
 * Gestures always win as the active layer; the base mode is retained so a walk
 * or run can continue under a short wave, nod, bow, and so on.
 */
export function resolveZenbotRigMotion(frame = {}, options = {}) {
  const gestureKind = frame?.gesture?.kind;
  const explicit = typeof options.motion === 'string'
    ? options.motion
    : typeof frame?.motion === 'string'
      ? frame.motion
      : null;
  const mode = typeof frame?.mode === 'string' ? frame.mode : 'idle';

  let gestureId = GESTURE_SET.has(gestureKind) ? gestureKind : null;
  if (!gestureId && explicit && GESTURE_SET.has(explicit)) gestureId = explicit;

  let baseId = null;
  if (explicit && !GESTURE_SET.has(explicit) && specOf(explicit)) baseId = explicit;
  if (!baseId) baseId = resolveModeMotion(frame, options, mode);
  if (baseId && !specOf(baseId)) baseId = null;

  const id = gestureId ?? baseId;
  const spec = id ? specOf(id) : null;
  return {
    id,
    gestureId,
    baseId,
    layer: gestureId ? 'gesture' : baseId ? 'base' : 'idle',
    duration: spec?.seconds ?? null,
    loop: Boolean(spec?.loop),
  };
}

function elapsedFor(id, layer, frame, options, time) {
  const spec = specOf(id);
  if (!spec) return 0;
  const override = Number(options.motionT);
  if (Number.isFinite(override)) return Math.max(0, override);
  const frameTime = Number(frame?.motionT);
  if (Number.isFinite(frameTime)) return Math.max(0, frameTime);

  if (layer === 'gesture') {
    const k = Number(frame?.gesture?.k);
    if (Number.isFinite(k)) return clamp(k, 0, 1) * spec.seconds;
    const started = Number(options.gestureStartedAt);
    if (Number.isFinite(started)) return Math.max(0, time - started);
  }

  const modeT = Number(frame?.modeT);
  if (Number.isFinite(modeT)) {
    const local = Math.max(0, modeT);
    if (id === 'jump') {
      if (frame?.mode === 'air') {
        const jumpV = Number(frame?.jumpV);
        const liftAt = Number.isFinite(jumpV) && jumpV < 650 ? 0.12 : 0.16;
        return liftAt + local;
      }
      if (frame?.mode === 'land') return 0.58 + local;
    }
    return local;
  }
  const started = Number(options.motionStartedAt);
  if (Number.isFinite(started)) return Math.max(0, time - started);
  return 0;
}

function applyIdleBreath(target, time, options, context) {
  const manifestBreath = options.manifest?.timing?.breathSeconds;
  const seconds = Math.max(
    2,
    finite(options.breathSeconds, finite(manifestBreath, ZENBOT_RIG_LIMITS.breathSeconds))
      * (context.mode === 'sleep' ? 1.25 : 1),
  );
  const phase = finite(options.breathPhase, 0);
  const breath = Math.sin((TAU * time) / seconds + phase);
  const amplitude = context.mode === 'sleep' ? 0.75 : 1;

  addDeformer(target, 'body', { ty: 0.15 * breath * amplitude });
  addDeformer(target, 'chest', { ty: -0.6 * breath * amplitude, sy: 1 + 0.0025 * breath * amplitude });
  addDeformer(target, 'head', { ty: 0.2 * breath * amplitude, a: -0.15 * breath * amplitude });
  addDeformer(target, 'arm_l', { a: 0.25 * breath * amplitude });
  addDeformer(target, 'arm_r', { a: -0.25 * breath * amplitude });
  addDeformer(target, 'hair_back', { a: 0.2 * Math.sin((TAU * time) / (seconds * 1.15) - 0.4) });
  addDeformer(target, 'skirt', { a: 0.18 * Math.sin((TAU * time) / (seconds * 1.25) - 0.7) });
  return breath;
}

function applyStand(target, elapsed) {
  const p = clamp(elapsed / 1.2, 0, 1);
  const lift = smoothstep(0, 0.18, p) * (1 - smoothstep(0.45, 1.2, p));
  const stretch = bell(clamp((p - 0.15) / 0.38, 0, 1)) * (1 - smoothstep(0.75, 1, p));
  addDeformer(target, 'body', { ty: -2.1 * lift, sy: 1 + 0.025 * stretch });
  addDeformer(target, 'chest', { a: -1.4 * stretch, ty: -0.7 * lift });
  addDeformer(target, 'head', { a: 2.2 * stretch, ty: -0.35 * lift });
  addDeformer(target, 'arm_l', { a: 7 * lift });
  addDeformer(target, 'arm_r', { a: -7 * lift });
  addDeformer(target, 'skirt', { a: -1.2 * lift });
}

function applyJump(target, elapsed, hop = false) {
  const seconds = hop ? 0.9 : 1.2;
  const p = clamp(elapsed / seconds, 0, 1);
  const crouchEnd = hop ? 0.12 : 0.16;
  const airStart = crouchEnd;
  const airEnd = hop ? 0.42 : 0.58;
  const crouch = smoothstep(0, crouchEnd * 0.75, p) * (1 - smoothstep(airStart, airStart + 0.065, p));
  const air = Math.sin(Math.PI * clamp((p - airStart) / (airEnd - airStart), 0, 1));
  const land = bell(clamp((p - airEnd) / 0.2, 0, 1)) * (1 - smoothstep(0.82, 1, p));
  const height = hop ? 15 : 34;
  const armLift = hop ? 26 : 52;

  addDeformer(target, 'body', {
    ty: 4.2 * crouch - height * air + 3 * land,
    sy: 1 - (hop ? 0.09 : 0.14) * crouch - 0.08 * land + 0.03 * air,
    sx: 1 + 0.025 * land,
  });
  addDeformer(target, 'chest', { a: 1.5 * air, ty: -1.4 * air, sy: 1 + 0.025 * air });
  addDeformer(target, 'head', { a: -1.8 * air + 1.2 * land, ty: 0.8 * crouch });
  addDeformer(target, 'arm_l', { a: armLift * air - 5 * crouch });
  addDeformer(target, 'arm_r', { a: -armLift * air + 5 * crouch });
  addDeformer(target, 'hair_back', { a: -2.1 * air + 1.2 * land });
  addDeformer(target, 'skirt', { a: -1.7 * air + 1.8 * land });
  addDeformer(target, 'leg_l', { a: 9 * crouch - 5 * air, ty: -2.5 * air });
  addDeformer(target, 'leg_r', { a: -9 * crouch + 5 * air, ty: -2.5 * air });
}

function applyLook(target, elapsed) {
  const p = clamp(elapsed / 2.7, 0, 1);
  const turnIn = smoothstep(0, 0.25, p);
  const settle = smoothstep(1.8 / 2.7, 1, p);
  const hold = turnIn * (1 - settle);
  const side = elapsed < 0.9 ? -1 : elapsed < 1.8 ? 1 : 0.35;
  const glance = hold * side;
  addDeformer(target, 'body', { a: 0.7 * glance });
  addDeformer(target, 'chest', { a: 1.2 * glance, tx: 0.6 * glance });
  addDeformer(target, 'head', {
    a: 2.4 * glance,
    tx: 2.1 * glance,
    ty: elapsed > 1.8 && elapsed < 2.6 ? 0.7 : 0,
  });
  addDeformer(target, 'arm_l', { a: -2.2 * glance });
  addDeformer(target, 'arm_r', { a: 2.2 * glance });
  addDeformer(target, 'hair_back', { a: -1.2 * glance });
  addDeformer(target, 'skirt', { a: -0.8 * glance });
  target.gaze = {
    x: 5 * glance,
    y: elapsed > 1.8 && elapsed < 2.6 ? -3.8 : -0.8 * hold,
    weight: 0.9 * hold,
  };
}

function applyTurn(target, elapsed) {
  const p = clamp(elapsed / 0.4, 0, 1);
  const turn = bell(clamp((p - 0.05) / 0.55, 0, 1)) * (1 - smoothstep(0.72, 1, p));
  addDeformer(target, 'body', {
    a: -3.5 * turn,
    sx: 1 - 0.56 * turn,
    tx: 1.5 * turn,
  });
  addDeformer(target, 'chest', { a: 2.2 * turn, sx: 1 - 0.08 * turn });
  addDeformer(target, 'head', { a: 4.5 * turn, tx: 3 * turn });
  addDeformer(target, 'arm_l', { a: 4 * turn });
  addDeformer(target, 'arm_r', { a: -4 * turn });
  addDeformer(target, 'hair_back', { a: 3.1 * turn });
  addDeformer(target, 'skirt', { a: 3.4 * turn });
  target.hints.turn = turn;
}

function applyNod(target, elapsed) {
  const p = clamp(elapsed / 0.8, 0, 1);
  const ramp = smoothstep(0, 0.12, p) * (1 - smoothstep(0.62, 1, p));
  const q = clamp((p - 0.12) / 0.5, 0, 1);
  const dip = Math.abs(Math.sin(TAU * q)) * ramp;
  addDeformer(target, 'body', { ty: 0.8 * dip });
  addDeformer(target, 'chest', { a: 2.1 * dip, ty: 0.9 * dip });
  addDeformer(target, 'head', { a: 4.8 * dip, ty: 3.6 * dip });
  addDeformer(target, 'hair_back', { a: -1.6 * dip, ty: 1.1 * dip });
  addDeformer(target, 'arm_l', { a: 0.8 * dip });
  addDeformer(target, 'arm_r', { a: -0.8 * dip });
}

function applyShake(target, elapsed) {
  const p = clamp(elapsed / 0.8, 0, 1);
  const ramp = smoothstep(0, 0.1, p) * (1 - smoothstep(0.64, 1, p));
  const decay = 1 - 0.55 * smoothstep(0.45, 1, p);
  const q = clamp((p - 0.1) / 0.54, 0, 1);
  const wiggle = Math.sin(TAU * 2.6 * q) * ramp * decay;
  addDeformer(target, 'body', { tx: 2.6 * wiggle, a: -0.8 * wiggle });
  addDeformer(target, 'chest', { a: 1.5 * wiggle, tx: 1.1 * wiggle });
  addDeformer(target, 'head', { a: 4.2 * wiggle, tx: 3.2 * wiggle });
  addDeformer(target, 'arm_l', { a: -2.2 * wiggle });
  addDeformer(target, 'arm_r', { a: -2.2 * wiggle });
  addDeformer(target, 'hair_back', { a: -2.8 * wiggle });
  addDeformer(target, 'skirt', { a: 2.7 * wiggle });
}

function applySpin(target, elapsed) {
  const p = clamp(elapsed / 0.8, 0, 1);
  const spin = smoothstep(0.12 / 0.8, 0.64 / 0.8, p);
  const envelope = smoothstep(0, 0.12, p) * (1 - smoothstep(0.64, 1, p));
  const angle = TAU * spin;
  addDeformer(target, 'body', {
    a: 2.5 * Math.sin(angle) * envelope,
    sx: 1 - 0.82 * envelope * (1 - Math.cos(angle)) / 2,
    ty: -2 * Math.sin(Math.PI * spin) * envelope,
  });
  addDeformer(target, 'chest', { a: -1.6 * Math.sin(angle) * envelope });
  addDeformer(target, 'head', { a: 3 * Math.sin(angle + 0.5) * envelope, tx: 2.2 * Math.sin(angle) * envelope });
  addDeformer(target, 'arm_l', { a: 10 * envelope + 4 * Math.sin(angle) * envelope });
  addDeformer(target, 'arm_r', { a: -10 * envelope - 4 * Math.sin(angle) * envelope });
  addDeformer(target, 'hair_back', { a: 3.4 * Math.sin(angle - 0.6) * envelope });
  addDeformer(target, 'skirt', { a: -3.8 * Math.sin(angle - 0.75) * envelope });
  target.hints.spin = spin;
}

function lastingProgress(elapsed, seconds) {
  return clamp(elapsed / seconds, 0, 1);
}

function applySit(target, elapsed) {
  const p = lastingProgress(elapsed, 0.8);
  const bend = smoothstep(0, 0.35, p) * (1 - smoothstep(0.35, 0.6, p));
  const seat = smoothstep(0.35, 0.6, p);
  addDeformer(target, 'body', { ty: 8.5 * seat + 1.2 * bend, sy: 1 - 0.025 * bend });
  addDeformer(target, 'chest', { a: 1.2 * seat, ty: 1.8 * seat });
  addDeformer(target, 'head', { a: 1.5 * seat, ty: 0.8 * seat });
  addDeformer(target, 'arm_l', { a: 5 * seat });
  addDeformer(target, 'arm_r', { a: -5 * seat });
  addDeformer(target, 'hair_back', { a: 1.3 * seat });
  addDeformer(target, 'skirt', { a: -2.8 * seat, ty: 1.6 * seat });
  addDeformer(target, 'leg_l', { a: 27 * seat + 3 * bend, tx: 2.4 * seat, ty: -2 * seat });
  addDeformer(target, 'leg_r', { a: -27 * seat - 3 * bend, tx: -2.4 * seat, ty: -2 * seat });
}

function applySleep(target, elapsed, time) {
  const p = lastingProgress(elapsed, 0.8);
  const settle = smoothstep(0, 0.5, p);
  const breath = Math.sin((TAU * time) / 5.25);
  addDeformer(target, 'body', { ty: 8 * settle, sy: 1 + 0.005 * breath });
  addDeformer(target, 'chest', { a: 2.2 * settle, ty: 1.2 * settle - 0.45 * breath });
  addDeformer(target, 'head', { a: 3.8 * settle, ty: 2 * settle + 0.25 * breath });
  addDeformer(target, 'arm_l', { a: 8 * settle });
  addDeformer(target, 'arm_r', { a: -8 * settle });
  addDeformer(target, 'hair_back', { a: 2.2 * settle });
  addDeformer(target, 'skirt', { a: -2.5 * settle, ty: 1.8 * settle });
  addDeformer(target, 'leg_l', { a: 24 * settle, tx: 2 * settle, ty: -1.5 * settle });
  addDeformer(target, 'leg_r', { a: -24 * settle, tx: -2 * settle, ty: -1.5 * settle });
  target.hints.eyeClose = 0.85 * settle;
}

function applyDizzy(target, elapsed) {
  const p = clamp(elapsed / 3.2, 0, 1);
  const attack = smoothstep(0, 0.25, p);
  const release = 1 - smoothstep(2.4 / 3.2, 1, p);
  const amplitude = attack * release;
  const wobble = Math.sin(elapsed * 4.8);
  const cross = Math.cos(elapsed * 4.8);
  addDeformer(target, 'body', { a: 4.8 * wobble * amplitude, tx: 1.2 * cross * amplitude });
  addDeformer(target, 'chest', { a: -3.7 * wobble * amplitude, tx: 1.5 * cross * amplitude });
  addDeformer(target, 'head', { a: -5.2 * wobble * amplitude, tx: 3.2 * cross * amplitude, ty: 1.2 * amplitude });
  addDeformer(target, 'arm_l', { a: 12 * amplitude + 2 * wobble * amplitude });
  addDeformer(target, 'arm_r', { a: -12 * amplitude - 2 * wobble * amplitude });
  addDeformer(target, 'hair_back', { a: 3 * wobble * amplitude, tx: 1.4 * cross * amplitude });
  addDeformer(target, 'skirt', { a: -3.4 * wobble * amplitude, tx: 1.1 * cross * amplitude });
  addDeformer(target, 'leg_l', { a: 3 * cross * amplitude });
  addDeformer(target, 'leg_r', { a: -3 * cross * amplitude });
  target.gaze = { x: 3.5 * wobble * amplitude, y: 2.3 * cross * amplitude, weight: amplitude };
}

function applyGait(target, elapsed, options, run) {
  const phaseOffset = finite(options.phase, 0);
  const cadence = specOf(run ? 'run' : 'walk').cadence;
  const phase = TAU * (Number.isFinite(options.gaitPhase) ? options.gaitPhase : phaseOffset + cadence * elapsed);
  const s = Math.sin(phase);
  const s2 = Math.sin(phase * 2);
  const lean = run ? 3 : 1;
  const entry = smoothstep(0, run ? 0.16 : 0.2, elapsed);
  const weight = clamp(finite(options.gaitWeight, 1), 0, 1) * entry;
  const feet = sampleZenbotGait(options.gaitFrame, phase, run, weight);
  const angles = feet.map(foot => -Math.atan2(foot.dx, 78 - foot.lift) * 180 / Math.PI);

  addDeformer(target, 'body', {
    a: lean * weight,
    tx: (run ? 0.8 : 0.4) * s2 * weight,
    ty: (run ? 2.4 : 1.2) * Math.abs(s) * weight,
  });
  addDeformer(target, 'chest', { a: (run ? 2.2 : 0.7) * weight, tx: -0.4 * s2 * weight });
  addDeformer(target, 'head', { a: -(run ? 4.2 : 1.5) * weight, ty: 0.4 * Math.abs(s) * weight });
  addDeformer(target, 'arm_l', { a: -angles[0] * 0.5 });
  addDeformer(target, 'arm_r', { a: -angles[1] * 0.5 });
  addDeformer(target, 'hair_back', { a: (run ? 3.1 : 2.2) * Math.sin(phase - 0.55) * weight });
  addDeformer(target, 'skirt', { a: (run ? 3.8 : 2.8) * Math.sin(phase - 0.7) * weight });
  addDeformer(target, 'leg_l', { a: angles[0], ty: -feet[0].lift });
  addDeformer(target, 'leg_r', { a: angles[1], ty: -feet[1].lift });

  return {
    phase: wrap(phase / TAU, 1),
    phaseRadians: wrap(phase, TAU),
    cadence,
    step: Math.sin(phase) >= 0 ? 0 : 1,
    weight,
  };
}

function applyDance(target, elapsed, options) {
  const p = clamp(elapsed / 3.4, 0, 1);
  const amplitude = smoothstep(0, 0.25, p) * (1 - smoothstep(2.8 / 3.4, 1, p));
  const phaseOffset = finite(options.phase, 0);
  const phase = TAU * (phaseOffset + 1.1 * elapsed);
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  addDeformer(target, 'body', { a: 4.8 * s * amplitude, tx: 2.2 * Math.sin(phase * 0.5) * amplitude, ty: -1.4 * Math.abs(s) * amplitude });
  addDeformer(target, 'chest', { a: -2.5 * s * amplitude, tx: 1.1 * c * amplitude });
  addDeformer(target, 'head', { a: 3.1 * Math.sin(phase + 0.4) * amplitude, ty: 0.8 * Math.abs(c) * amplitude });
  addDeformer(target, 'arm_l', { a: (14 + 18 * c) * amplitude });
  addDeformer(target, 'arm_r', { a: (-14 + 18 * c) * amplitude });
  addDeformer(target, 'hair_back', { a: 3.2 * Math.sin(phase - 0.5) * amplitude });
  addDeformer(target, 'skirt', { a: -3.7 * Math.sin(phase - 0.65) * amplitude });
  addDeformer(target, 'leg_l', { a: -18 * s * amplitude, ty: -2.3 * Math.max(0, c) * amplitude });
  addDeformer(target, 'leg_r', { a: 18 * s * amplitude, ty: -2.3 * Math.max(0, -c) * amplitude });
  return { phase: wrap(phaseOffset + 1.1 * elapsed, 1), phaseRadians: wrap(phase, TAU), cadence: 1.1, step: s >= 0 ? 0 : 1 };
}

function applyWave(target, elapsed) {
  const raise = smoothstep(0, 0.18, elapsed) * (1 - smoothstep(1.2, 1.7, elapsed));
  const wave = Math.sin((elapsed - 0.18) * TAU * 2.35) * raise;
  addDeformer(target, 'body', { a: 1.2 * raise, ty: -0.8 * raise });
  addDeformer(target, 'chest', { a: -1.1 * raise, tx: 0.8 * raise });
  addDeformer(target, 'head', { a: 2.4 * raise, tx: 1.8 * raise });
  addDeformer(target, 'arm_r', { a: -112 * raise + 12 * wave, tx: 2.5 * raise });
  addDeformer(target, 'arm_l', { a: 2 * raise });
  addDeformer(target, 'hair_back', { a: -1.8 * raise });
  addDeformer(target, 'skirt', { a: 1.4 * raise });
}

function applyBow(target, elapsed) {
  const bend = smoothstep(0, 0.22, elapsed) * (1 - smoothstep(0.8, 1.7, elapsed));
  addDeformer(target, 'body', { a: 5 * bend, ty: 0.8 * bend });
  addDeformer(target, 'chest', { a: 21 * bend });
  addDeformer(target, 'head', { a: 8 * bend, ty: 1.5 * bend });
  addDeformer(target, 'arm_l', { a: 7 * bend });
  addDeformer(target, 'arm_r', { a: -7 * bend });
  addDeformer(target, 'hair_back', { a: 3.4 * bend });
  addDeformer(target, 'skirt', { a: -2.3 * bend });
}

function applyShiver(target, elapsed) {
  const amplitude = smoothstep(0, 0.16, elapsed) * (1 - smoothstep(1.35, 1.9, elapsed));
  const vibration = Math.sin(elapsed * 64);
  const counter = Math.sin(elapsed * 57 + 0.9);
  addDeformer(target, 'body', { tx: 1.1 * vibration * amplitude });
  addDeformer(target, 'chest', { a: 1.8 * vibration * amplitude, tx: 0.7 * counter * amplitude });
  addDeformer(target, 'head', { a: 2.4 * vibration * amplitude, tx: 1.4 * counter * amplitude });
  addDeformer(target, 'arm_l', { a: 7 * amplitude + 2.2 * counter * amplitude });
  addDeformer(target, 'arm_r', { a: -7 * amplitude - 2.2 * counter * amplitude });
  addDeformer(target, 'hair_back', { a: 2.1 * counter * amplitude });
  addDeformer(target, 'skirt', { a: -2.4 * vibration * amplitude });
  addDeformer(target, 'leg_l', { a: -1.6 * counter * amplitude });
  addDeformer(target, 'leg_r', { a: 1.6 * counter * amplitude });
}

function applyFlap(target, elapsed) {
  const p = clamp(elapsed / 1.5, 0, 1);
  const crouch = smoothstep(0, 0.16, p) * (1 - smoothstep(0.16, 0.23, p));
  const air = Math.sin(Math.PI * clamp((p - 0.16) / 0.69, 0, 1));
  const settle = bell(clamp((p - 0.85) / 0.25, 0, 1)) * (1 - smoothstep(0.92, 1, p));
  const flutter = Math.sin(elapsed * TAU * 4.5);
  addDeformer(target, 'body', { ty: 4 * crouch - 23 * air + 2 * settle, sy: 1 - 0.1 * crouch - 0.06 * settle + 0.02 * air });
  addDeformer(target, 'chest', { a: 1.8 * air, ty: -0.8 * air });
  addDeformer(target, 'head', { a: -2.2 * air, ty: 0.7 * air });
  addDeformer(target, 'arm_l', { a: (52 + 30 * flutter) * air });
  addDeformer(target, 'arm_r', { a: (-52 - 30 * flutter) * air });
  addDeformer(target, 'hair_back', { a: -3.2 * air });
  addDeformer(target, 'skirt', { a: 3.6 * air + 0.8 * flutter * air });
  addDeformer(target, 'leg_l', { a: 7 * crouch - 4 * air });
  addDeformer(target, 'leg_r', { a: -7 * crouch + 4 * air });
}

function applyMotion(target, id, elapsed, time, options, context) {
  switch (id) {
    case 'stand': applyStand(target, elapsed); break;
    case 'jump': applyJump(target, elapsed, false); break;
    case 'hop': applyJump(target, elapsed, true); break;
    case 'look': applyLook(target, elapsed); break;
    case 'turn': applyTurn(target, elapsed); break;
    case 'nod': applyNod(target, elapsed); break;
    case 'shake': applyShake(target, elapsed); break;
    case 'spin': applySpin(target, elapsed); break;
    case 'sit': applySit(target, elapsed); break;
    case 'sleep': applySleep(target, elapsed, time); break;
    case 'dizzy': applyDizzy(target, elapsed); break;
    case 'walk':
      context.gait = applyGait(target, elapsed, options, false);
      break;
    case 'run':
      context.gait = applyGait(target, elapsed, options, true);
      break;
    case 'wave': applyWave(target, elapsed); break;
    case 'bow': applyBow(target, elapsed); break;
    case 'shiver': applyShiver(target, elapsed); break;
    case 'flap': applyFlap(target, elapsed); break;
    case 'dance':
      context.gait = applyDance(target, elapsed, options);
      break;
    default: break;
  }
}

function hash01(value, seed) {
  let x = (Math.imul(value | 0, 0x9e3779b1) ^ Math.imul((seed | 0) + 0x7f4a7c15, 0x85ebca6b)) | 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

function blinkFromSchedule(time, options) {
  const period = Math.max(0.6, finite(options.period, ZENBOT_RIG_LIMITS.blinkPeriodSeconds));
  const jitter = clamp(finite(options.jitter, ZENBOT_RIG_LIMITS.blinkJitterSeconds), 0, period - 0.2);
  const manifestCloseSeconds = finite(options.manifest?.timing?.blinkCloseMs, 0) / 1000;
  const requestedClose = options.closeSeconds ?? options.blinkCloseSeconds;
  const explicitClose = Number.isFinite(Number(requestedClose))
    ? clamp(Number(requestedClose), 0.04, 0.6)
    : null;
  const manifestClose = manifestCloseSeconds > 0
    ? clamp(manifestCloseSeconds, 0.04, 0.6)
    : null;
  const seed = finite(options.seed, 1);
  const cycle = Math.floor(time / period);
  let amount = 0;
  for (let index = cycle - 1; index <= cycle + 1; index += 1) {
    if (index < 0) continue;
    const start = index * period + hash01(index, seed) * jitter;
    const duration = explicitClose ?? manifestClose
      ?? 0.11 + hash01(index, seed ^ 0x5bd1e995) * 0.05;
    const q = (time - start) / duration;
    if (q >= 0 && q <= 1) amount = Math.max(amount, Math.sin(Math.PI * q));
  }
  return clamp(amount, 0, 1);
}

function blinkAmount(frame, time, options) {
  const frameClose = Number(frame?.eyeClose);
  if (Number.isFinite(frameClose)) return clamp(frameClose, 0, 1);
  const frameBlink = Number(frame?.blink);
  if (Number.isFinite(frameBlink)) return clamp(frameBlink, 0, 1);

  const option = options.blink;
  if (option === false || option === null) return 0;
  if (typeof option === 'number') return clamp(option, 0, 1);
  if (typeof option === 'function') return clamp(finite(option(time, options), 0), 0, 1);
  if (option && typeof option === 'object') {
    if (option.enabled === false) return 0;
    if (option.at != null) {
      if (typeof option.at === 'function') return clamp(finite(option.at(time, options), 0), 0, 1);
      return clamp(finite(option.at, 0), 0, 1);
    }
    const value = option.value ?? option.amount ?? option.close;
    if (value != null) return clamp(finite(value, 0), 0, 1);
    return blinkFromSchedule(time, { ...options, ...option });
  }
  return blinkFromSchedule(time, options);
}

function resolveExpressionFace(frame, options) {
  const name = typeof frame?.face === 'string' && frame.face
    ? frame.face
    : typeof options.face === 'string' && options.face
      ? options.face
      : 'neutral';
  const aliasSource = options.expressionAliases ?? options.manifest?.expressionAliases;
  const aliases = aliasSource && typeof aliasSource === 'object'
    ? aliasSource
    : {};
  const resolved = typeof aliases[name] === 'string' ? aliases[name] : name;
  return EXPRESSION_SET.has(resolved) ? resolved : 'neutral';
}

function baseGaze(frame, options) {
  let x = 0;
  let y = 0;
  const look = frame?.look;
  if (Array.isArray(look)) {
    x = finite(look[0], 0);
    y = finite(look[1], 0);
  } else if (look && typeof look === 'object') {
    x = finite(look.x, 0);
    y = finite(look.y, 0);
  }
  const gaze = options.gaze;
  if (Array.isArray(gaze)) {
    x = finite(gaze[0], x);
    y = finite(gaze[1], y);
  } else if (gaze && typeof gaze === 'object') {
    x = finite(gaze.x, x);
    y = finite(gaze.y, y);
  }
  return {
    x: clamp(x, -ZENBOT_RIG_LIMITS.gazeX, ZENBOT_RIG_LIMITS.gazeX),
    y: clamp(y, -ZENBOT_RIG_LIMITS.gazeY, ZENBOT_RIG_LIMITS.gazeY),
  };
}

function talkParams(frame, time, options) {
  const talk = clamp(
    finite(frame?.talk, finite(options.talk, 0)),
    0,
    1,
  );
  const hz = clamp(
    finite(options.talkHz, 9.5),
    ZENBOT_RIG_LIMITS.talkHzMin,
    ZENBOT_RIG_LIMITS.talkHzMax,
  );
  const carrier = 0.5 + 0.5 * Math.sin(TAU * hz * time + 0.65 * Math.sin(TAU * 2.3 * time));
  const open = talk * (0.18 + 0.82 * Math.pow(carrier, 0.72));
  return {
    open: clamp(open, 0, 1),
    openUnits: clamp(open * ZENBOT_RIG_LIMITS.mouthUnits, 0, ZENBOT_RIG_LIMITS.mouthUnits),
    width: 42 + open * 8,
    height: open * ZENBOT_RIG_LIMITS.mouthUnits,
    rate: hz,
    shape: open > 0.04 ? 'talk' : 'closed',
    talk,
  };
}

function applySecondary(target, frame, options, context) {
  const velocity = finite(options.velocityX, 0);
  const facing = normalizedFacing(frame?.facing);
  const bodySwing = finite(frame?.swing, 0);
  const velocitySway = clamp(-velocity * 0.012 * facing, -3, 3);
  const carriedSway = clamp(bodySwing * 0.085, -3.2, 3.2);
  const danceSway = context.motionId === 'dance'
    ? clamp(target.deformers.skirt.a * 0.28, -1.2, 1.2)
    : 0;
  const hair = target.deformers.hair_back.a + velocitySway * 0.5 + carriedSway + danceSway;
  const skirt = target.deformers.skirt.a + velocitySway + carriedSway * 0.8 + danceSway;
  target.deformers.hair_back.a = clamp(hair, -ZENBOT_RIG_LIMITS.hairSway, ZENBOT_RIG_LIMITS.hairSway);
  target.deformers.skirt.a = clamp(skirt, -ZENBOT_RIG_LIMITS.skirtSway, ZENBOT_RIG_LIMITS.skirtSway);
}

function applySeatedContinuity(target, frame, options, context) {
  const sit = clamp(finite(frame?.sit, finite(options.sitK, 0)), 0, 1);
  if (sit <= 0) return;
  if (['sit', 'sleep'].includes(context.baseId) || ['sit', 'sleep'].includes(context.motionId)) return;
  addDeformer(target, 'body', { ty: 8.5 * sit, sy: 1 - 0.01 * sit });
  addDeformer(target, 'chest', { a: 1.2 * sit, ty: 1.8 * sit });
  addDeformer(target, 'head', { a: 1.5 * sit, ty: 0.8 * sit });
  addDeformer(target, 'arm_l', { a: 5 * sit });
  addDeformer(target, 'arm_r', { a: -5 * sit });
  addDeformer(target, 'hair_back', { a: 1.3 * sit });
  addDeformer(target, 'skirt', { a: -2.8 * sit, ty: 1.6 * sit });
  addDeformer(target, 'leg_l', { a: 27 * sit, tx: 2.4 * sit, ty: -2 * sit });
  addDeformer(target, 'leg_r', { a: -27 * sit, tx: -2.4 * sit, ty: -2 * sit });
}

function finalizeDeformers(target) {
  const result = {};
  for (const id of ZENBOT_RIG_DEFORMER_IDS) {
    const item = target.deformers[id];
    result[id] = {
      a: clean(item.a),
      tx: clean(item.tx),
      ty: clean(item.ty),
      sx: clean(clamp(item.sx, 0.05, 4)),
      sy: clean(clamp(item.sy, 0.05, 4)),
    };
  }
  return result;
}

/**
 * Evaluates one frame of the zenbot rig motion system.
 *
 * `frame` follows the existing figure contract (`mode`, `modeT`, `talk`,
 * `facing`, `gesture`, `jumpV`, `airKind`, `look`, `blink`/`eyeClose`, `t`).
 * `time` is monotonic seconds. The result depends only on the arguments: no
 * ambient clock, no `Math.random`, and no hidden previous-frame state.
 *
 * Deformer states use logo units and the fields understood by kit/rig.js:
 * `a` (degrees), `tx`/`ty` (logo units), `sx`/`sy` (scale).
 */
export function evaluateZenbotRig(frame = {}, time, options = {}) {
  const safeFrame = frame && typeof frame === 'object' ? frame : {};
  const safeOptions = options && typeof options === 'object' ? options : {};
  const t = normalizeTime(time, safeFrame);
  const mode = typeof safeFrame.mode === 'string' ? safeFrame.mode : 'idle';
  const resolved = resolveZenbotRigMotion(safeFrame, safeOptions);
  const context = {
    mode,
    motionId: resolved.id,
    baseId: resolved.baseId,
    gait: null,
  };

  const base = pose();
  if (resolved.baseId) {
    applyMotion(
      base,
      resolved.baseId,
      elapsedFor(resolved.baseId, 'base', safeFrame, safeOptions, t),
      t,
      { ...safeOptions, gaitFrame: safeFrame },
      context,
    );
  }

  const gesture = pose();
  let gestureElapsed = 0;
  if (resolved.gestureId) {
    gestureElapsed = elapsedFor(resolved.gestureId, 'gesture', safeFrame, safeOptions, t);
    applyMotion(gesture, resolved.gestureId, gestureElapsed, t, safeOptions, context);
  }

  const active = resolved.gestureId ? mergePose(base, gesture) : base;
  applySeatedContinuity(active, safeFrame, safeOptions, context);
  const breath = applyIdleBreath(active, t, safeOptions, context);

  if (resolved.id === 'walk' || resolved.id === 'run') {
    const elapsed = elapsedFor(resolved.id, 'base', safeFrame, safeOptions, t);
    context.gait = context.gait ?? applyGait(active, elapsed, safeOptions, resolved.id === 'run');
  }
  applySecondary(active, safeFrame, safeOptions, context);
  const deformers = finalizeDeformers(active);

  const spec = resolved.id ? specOf(resolved.id) : null;
  const activeElapsed = resolved.id
    ? elapsedFor(
      resolved.gestureId ? resolved.gestureId : resolved.baseId,
      resolved.gestureId ? 'gesture' : 'base',
      safeFrame,
      safeOptions,
      t,
    )
    : 0;
  const progress = spec
    ? spec.loop
      ? wrap(activeElapsed, spec.seconds)
      : clamp(activeElapsed / spec.seconds, 0, 1)
    : 0;

  const gazeBase = baseGaze(safeFrame, safeOptions);
  const gazeMotion = active.gaze;
  const gazeWeight = gazeMotion ? clamp(finite(gazeMotion.weight, 0), 0, 1) : 0;
  const gazeX = clamp(
    gazeBase.x * (1 - gazeWeight) + finite(gazeMotion?.x, 0) * gazeWeight,
    -ZENBOT_RIG_LIMITS.gazeX,
    ZENBOT_RIG_LIMITS.gazeX,
  );
  const gazeY = clamp(
    gazeBase.y * (1 - gazeWeight) + finite(gazeMotion?.y, 0) * gazeWeight,
    -ZENBOT_RIG_LIMITS.gazeY,
    ZENBOT_RIG_LIMITS.gazeY,
  );

  const blink = clamp(
    Math.max(blinkAmount(safeFrame, t, safeOptions), finite(active.hints.eyeClose, 0)),
    0,
    1,
  );
  const mouth = talkParams(safeFrame, t, safeOptions);
  const faceMixRaw = safeFrame.faceMix ?? safeOptions.faceMix;
  let faceMix = clamp(finite(faceMixRaw, 1), 0, 1);
  const expressionAge = Number(safeOptions.expressionAge);
  if (Number.isFinite(expressionAge) && Number.isFinite(safeOptions.expressionFadeSeconds)) {
    faceMix = smoothstep(0, Math.max(0.001, safeOptions.expressionFadeSeconds), expressionAge);
  }

  const gait = context.gait ?? null;
  return {
    schemaVersion: MOTION_SCHEMA_VERSION,
    time: clean(t),
    motion: {
      id: resolved.id,
      gestureId: resolved.gestureId,
      baseId: resolved.baseId,
      layer: resolved.layer,
      elapsed: clean(activeElapsed),
      duration: spec?.seconds ?? null,
      progress: clean(progress),
      loop: Boolean(spec?.loop),
      phase: gait ? clean(gait.phase) : null,
      phaseRadians: gait ? clean(gait.phaseRadians) : null,
      cadence: gait ? clean(gait.cadence) : null,
      step: gait ? gait.step : null,
      gaitWeight: gait ? clean(gait.weight) : null,
    },
    expression: {
      face: resolveExpressionFace(safeFrame, safeOptions),
      mix: clean(faceMix),
      blink: clean(blink),
      eyeOpen: clean(1 - blink),
      drowse: clean(clamp(finite(safeFrame.drowse, 0), 0, 1)),
      gazeX: clean(gazeX),
      gazeY: clean(gazeY),
      gazeWeight: clean(gazeWeight),
    },
    mouth,
    params: {
      breath: clean(breath),
      blink: clean(blink),
      gazeX: clean(gazeX),
      gazeY: clean(gazeY),
      talk: clean(mouth.talk),
      bodyY: deformers.body.ty,
      bodyRot: deformers.body.a,
      headRot: deformers.head.a,
      armLRot: deformers.arm_l.a,
      armRRot: deformers.arm_r.a,
      hairSway: deformers.hair_back.a,
      skirtSway: deformers.skirt.a,
      legL: deformers.leg_l.a,
      legR: deformers.leg_r.a,
      squash: clean(1 - deformers.body.sy),
      turn: clean(finite(active.hints.turn, 0)),
      faceMix: clean(faceMix),
    },
    deformers,
  };
}

function deformerIdsOf(manifestOrDeformers) {
  if (manifestOrDeformers == null) return null;
  if (manifestOrDeformers instanceof Set) {
    return new Set([...manifestOrDeformers].filter((id) => typeof id === 'string'));
  }
  if (Array.isArray(manifestOrDeformers)) {
    return new Set(manifestOrDeformers.filter((id) => typeof id === 'string'));
  }
  if (typeof manifestOrDeformers !== 'object') {
    throw new TypeError('manifestOrDeformers must be a rig manifest, a deformer map, or an id array');
  }
  const group = manifestOrDeformers.deformers && typeof manifestOrDeformers.deformers === 'object'
    ? manifestOrDeformers.deformers
    : manifestOrDeformers;
  return new Set(Object.keys(group));
}

function aliasMapOf(manifestOrDeformers, options) {
  const explicit = options.aliases;
  if (explicit && typeof explicit === 'object') return explicit;
  const manifestBindings = manifestOrDeformers?.motionBindings?.deformers;
  if (manifestBindings && typeof manifestBindings === 'object') return manifestBindings;
  const group = manifestOrDeformers?.deformers;
  if (!group || typeof group !== 'object') return {};
  const aliases = {};
  for (const [name, definition] of Object.entries(group)) {
    const canonical = definition?.motionId ?? definition?.motionDeformer ?? definition?.canonicalId;
    if (typeof canonical === 'string' && ZENBOT_RIG_DEFORMER_IDS.includes(canonical)) aliases[canonical] = name;
  }
  return aliases;
}

/**
 * Adapts canonical motion deformer states to the ids present in a rig manifest.
 * Exact names are stable per RIG_CONTRACT.md; aliases cover future suffixing or
 * renamed sub-rigs. Missing ids are dropped (or throw when `strict` is true).
 */
export function adaptZenbotRigState(state, manifestOrDeformers, options = {}) {
  if (!state || typeof state !== 'object' || !state.deformers) {
    throw new TypeError('adaptZenbotRigState requires an evaluated motion state');
  }
  const ids = deformerIdsOf(manifestOrDeformers);
  const aliases = aliasMapOf(manifestOrDeformers, options);
  const mapping = {};
  const missing = [];
  const deformers = {};

  for (const canonical of ZENBOT_RIG_DEFORMER_IDS) {
    const requested = typeof aliases[canonical] === 'string' ? aliases[canonical] : canonical;
    const actual = ids == null || ids.has(requested)
      ? requested
      : ids.has(canonical)
        ? canonical
        : null;
    if (!actual) {
      missing.push(canonical);
      continue;
    }
    mapping[canonical] = actual;
    deformers[actual] = copyState(state.deformers[canonical]);
  }

  if (options.strict === true && missing.length) {
    throw new Error(`rig manifest is missing motion deformers: ${missing.join(', ')}`);
  }

  return {
    ...state,
    deformers,
    deformerMapping: mapping,
    missingDeformers: missing,
  };
}

/**
 * Creates a reusable adapter for one manifest. The returned function keeps the
 * stable canonical-to-manifest mapping between frames.
 */
export function createZenbotRigDeformerAdapter(manifestOrDeformers, options = {}) {
  const ids = deformerIdsOf(manifestOrDeformers);
  const aliases = aliasMapOf(manifestOrDeformers, options);
  return (state) => adaptZenbotRigState(state, ids, { ...options, aliases });
}
