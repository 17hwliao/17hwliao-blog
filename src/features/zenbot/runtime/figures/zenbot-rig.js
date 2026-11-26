import { createRig } from '../kit/rig.js';
import {
  ZENBOT_RIG_ERROR_CODES,
  ZenbotRigError,
  chooseZenbotRigExpression,
  createZenbotRigModel,
  getZenbotRigFacePart,
  isZenbotRigError,
  resolveZenbotRigExpression,
  validateZenbotRigManifest,
} from '../characters/zenbot-rig-manifest.js';
import { ZENBOT_EXPRESSION_IDS, ZENBOT_MOTION_IDS } from '../characters/zenbot-manifest.js';
import { ZENBOT_GESTURES, ZENBOT_PARTICLES, chooseZenbotMotion } from './zenbot.js';
import { createZenbotFaceAnimator } from './zenbot-face.js';
import { sampleZenbotGait, installZenbotGait, constrainZenbotGait } from '../characters/zenbot-gait.js';
import { installZenbotHair, anchorZenbotHair } from '../characters/zenbot-hair.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const IMAGE_CACHE_LIMIT = 32;
const RETRY_DELAY_SECONDS = 2.5;
const DEFAULT_CONTEXT_LOSS_TIMEOUT_MS = 4000;

export { ZENBOT_RIG_ERROR_CODES, ZenbotRigError, isZenbotRigError, chooseZenbotRigExpression };

/** Motion durations from docs/zenbot/RIG_BASELINE.md. They seed the procedural fallback. */
export const ZENBOT_RIG_MOTION_SECONDS = Object.freeze({
  stand: 1.2,
  jump: 1.2,
  hop: 0.9,
  look: 2.7,
  turn: 0.4,
  nod: 0.8,
  shake: 0.8,
  spin: 0.8,
  sit: 0.8,
  sleep: 0.8,
  dizzy: 3.2,
  walk: 12,
  run: 12,
  wave: 1.7,
  bow: 1.7,
  shiver: 1.9,
  flap: 1.5,
  dance: 3.4,
});

export const ZENBOT_RIG_PARAM_KEYS = Object.freeze([
  'breath', 'blink', 'gazeX', 'gazeY', 'talk',
  'bodyX', 'bodyY', 'bodyRot', 'bodyScaleX', 'bodyScaleY', 'squash',
  'headX', 'headY', 'headRot',
  'chestY',
  'armLRot', 'armRRot',
  'hairSway', 'skirtSway',
  'legL', 'legR',
  'turn', 'jaw', 'faceMix',
]);

const ZERO_POSE = Object.freeze(Object.fromEntries(ZENBOT_RIG_PARAM_KEYS.map((key) => [
  key,
  key === 'bodyScaleX' || key === 'bodyScaleY' ? 1 : 0,
])));

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function copyJson(value) {
  if (Array.isArray(value)) return value.map(copyJson);
  if (!value || typeof value !== 'object') return value;
  const copy = {};
  for (const [key, item] of Object.entries(value)) copy[key] = copyJson(item);
  return copy;
}

function smooth(value) {
  const k = clamp(value, 0, 1);
  return k * k * (3 - 2 * k);
}

function envelope(k, rise, fall) {
  const value = clamp(k, 0, 1);
  const up = rise <= 0 ? 1 : smooth(value / rise);
  const down = fall >= 1 ? 1 : 1 - smooth((value - fall) / (1 - fall));
  return up * down;
}

function svgNode(doc, name, attrs = {}) {
  const node = doc.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    if (value != null) node.setAttribute(key, String(value));
  }
  return node;
}

function setAttr(node, name, value) {
  const text = String(value);
  if (node.getAttribute(name) !== text) node.setAttribute(name, text);
}

function joinUrl(baseUrl, file) {
  return `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}${file}`;
}

function parentBaseUrl(baseUrl) {
  const trimmed = baseUrl.replace(/\/+$/, '');
  const slash = trimmed.lastIndexOf('/');
  return slash >= 0 ? `${trimmed.slice(0, slash + 1)}` : baseUrl;
}

function normaliseCalibration(value = {}) {
  const x = value.x == null ? 0 : Number(value.x);
  const y = value.y == null ? 0 : Number(value.y);
  const scale = value.scale == null ? 1 : Number(value.scale);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new TypeError('calibration x and y must be finite numbers');
  if (!Number.isFinite(scale) || scale <= 0) throw new TypeError('calibration scale must be greater than zero');
  return { x, y, scale };
}

function decodeHtmlImage(doc, url) {
  return new Promise((resolve, reject) => {
    const img = doc.createElement('img');
    img.decoding = 'async';
    img.onerror = () => reject(new Error(`failed to load image: ${url}`));
    img.src = url;
    if (typeof img.decode === 'function') {
      img.decode().then(() => resolve(img), reject);
      return;
    }
    img.onload = () => resolve(img);
  });
}

function createGuide(doc, manifest) {
  const { centerX, feetY, logoHeight } = manifest.drawing;
  const [hitX, hitY, hitRadius] = manifest.defaults.hit;
  const [bubbleX, bubbleY] = manifest.defaults.bubbleAnchor;
  const group = svgNode(doc, 'g', {
    class: 'zenbot-rig-calibration-guide',
    display: 'none',
    'pointer-events': 'none',
  });
  const common = {
    fill: 'none',
    stroke: '#63d8ff',
    'stroke-width': 1.5,
    'vector-effect': 'non-scaling-stroke',
  };
  group.append(
    svgNode(doc, 'line', {
      ...common,
      x1: centerX,
      y1: feetY - logoHeight - 24,
      x2: centerX,
      y2: feetY + 10,
      'stroke-dasharray': '5 4',
    }),
    svgNode(doc, 'line', {
      ...common,
      x1: centerX - 120,
      y1: feetY,
      x2: centerX + 120,
      y2: feetY,
    }),
    svgNode(doc, 'circle', {
      ...common,
      cx: hitX,
      cy: hitY,
      r: hitRadius,
      opacity: 0.55,
    }),
    svgNode(doc, 'circle', {
      ...common,
      cx: bubbleX,
      cy: bubbleY,
      r: 5,
      fill: '#63d8ff',
    }),
    svgNode(doc, 'line', {
      ...common,
      x1: bubbleX - 10,
      y1: bubbleY,
      x2: bubbleX + 10,
      y2: bubbleY,
    }),
    svgNode(doc, 'line', {
      ...common,
      x1: bubbleX,
      y1: bubbleY - 10,
      x2: bubbleX,
      y2: bubbleY + 10,
    }),
  );
  return group;
}

/** Idle pose in rig space. `look` comes from the kit pointer tracking and is already clamped to logo units. */
export function zenbotRigIdlePose(time = 0, frame = {}, timing = {}) {
  const breathSeconds = Math.max(0.5, finiteOr(Number(timing.breathSeconds), 4.2));
  const breath = Math.sin((time * Math.PI * 2) / breathSeconds);
  const look = Array.isArray(frame.look) ? frame.look : [0, 0];
  const gazeX = clamp(finiteOr(Number(look[0]), 0), -5, 5);
  const gazeY = clamp(finiteOr(Number(look[1]), 0), -4, 4);
  const talk = clamp(finiteOr(Number(frame.talk), 0), 0, 1);
  return {
    ...ZERO_POSE,
    breath,
    gazeX,
    gazeY,
    talk,
    chestY: -breath * 0.6,
    headY: breath * 0.2 + Math.sin(time * Math.PI * 18) * 0.18 * talk,
    hairSway: -gazeX * 0.28,
    jaw: talk,
  };
}

/**
 * Pure procedural motion evaluator. It consumes the same frame as the sprite figure and returns
 * every deformer parameter named by the rig contract. Missing motion declarations do not disable it:
 * the 18 action IDs always have a usable pose while art/motion curves are still being produced.
 */
export function evaluateZenbotRigMotion(motion, frame = {}, time = 0, options = {}) {
  const timing = options.timing ?? {};
  const mode = typeof frame?.mode === 'string' ? frame.mode : 'idle';
  const modeT = Math.max(0, finiteOr(Number(frame?.modeT), 0));
  const gesture = frame?.gesture;
  const gestureKind = typeof gesture?.kind === 'string' ? gesture.kind : null;
  const gestureK = clamp(finiteOr(Number(gesture?.k), 0), 0, 1);
  const seconds = Math.max(0.05, finiteOr(
    Number(options.motionSeconds?.[motion] ?? ZENBOT_RIG_MOTION_SECONDS[motion]),
    1,
  ));
  const k = gestureKind === motion ? gestureK : clamp(modeT / seconds, 0, 1);
  const turnK = clamp(finiteOr(Number(options.turnK), 0), 0, 1);
  const pose = zenbotRigIdlePose(time, frame, timing);
  pose.turn = turnK;

  if (!motion) {
    if (turnK > 0) {
      pose.bodyRot += 7 * turnK;
      pose.headRot -= 5 * turnK;
      pose.hairSway += 4 * turnK;
      pose.skirtSway -= 2.5 * turnK;
      pose.squash = 0.1 * turnK;
    }
    return pose;
  }

  switch (motion) {
    case 'stand': {
      const e = Math.sin(Math.PI * clamp(modeT / ZENBOT_RIG_MOTION_SECONDS.stand, 0, 1));
      pose.bodyY -= 1.2 * e;
      pose.headRot -= 2.2 * e;
      pose.armLRot -= 3 * e;
      pose.armRRot += 3 * e;
      pose.squash = -0.12 * e;
      break;
    }
    case 'jump':
    case 'hop': {
      const big = motion === 'jump';
      if (mode === 'crouch') {
        pose.squash = big ? 0.55 : 0.34;
        pose.bodyY += big ? 2.8 : 1.6;
        pose.legL -= 11;
        pose.legR -= 11;
        pose.armLRot += 9;
        pose.armRRot -= 9;
        pose.headRot += 2.5;
      } else if (mode === 'air') {
        const throwKind = frame?.airKind === 'throw';
        pose.squash = -0.18;
        pose.legL = throwKind ? -42 : -27;
        pose.legR = throwKind ? -20 : -27;
        pose.armLRot = throwKind ? 58 : 34;
        pose.armRRot = throwKind ? -58 : -34;
        pose.hairSway = throwKind ? 6 : 3.5;
        pose.skirtSway = throwKind ? -5 : -3;
        pose.bodyRot = throwKind ? -4 : 0;
      } else {
        const e = Math.sin(Math.PI * k);
        pose.squash = -0.14 * e;
        pose.bodyY -= (big ? 2.4 : 1.2) * e;
        pose.legL -= 15 * e;
        pose.legR -= 15 * e;
        pose.armLRot += 18 * e;
        pose.armRRot -= 18 * e;
      }
      break;
    }
    case 'look': {
      const s = Math.sin(modeT * 2.25);
      const s2 = Math.sin(modeT * 1.15 + 0.4);
      pose.headRot += 8 * s;
      pose.gazeX += 4.5 * s;
      pose.gazeY += 1.2 * s2;
      pose.bodyRot += 1.5 * s;
      pose.hairSway -= 3 * s;
      break;
    }
    case 'turn': {
      pose.bodyRot += 7 * turnK;
      pose.headRot -= 7 * turnK;
      pose.hairSway += 5 * turnK;
      pose.skirtSway -= 3 * turnK;
      pose.squash = 0.12 * turnK;
      break;
    }
    case 'walk':
    case 'run': {
      const run = motion === 'run';
      const phase = Number.isFinite(frame.gaitPhase) ? frame.gaitPhase * Math.PI * 2 : modeT * Math.PI * 2 * (run ? 4.4 : 2.1);
      const s = Math.sin(phase);
      const feet = sampleZenbotGait(frame, phase, run, smooth(modeT / 0.2));
      pose.legL = -Math.atan2(feet[0].dx, 78 - feet[0].lift) * 180 / Math.PI;
      pose.legR = -Math.atan2(feet[1].dx, 78 - feet[1].lift) * 180 / Math.PI;
      pose.armLRot = -pose.legL * 0.5;
      pose.armRRot = -pose.legR * 0.5;
      pose.bodyY += Math.abs(s) * (run ? 2.4 : 1.2);
      pose.bodyRot += run ? 3 : 1;
      pose.hairSway += -2.6 * Math.sin(phase + 0.6);
      pose.skirtSway += -2 * Math.sin(phase + 1);
      break;
    }
    case 'sit': {
      const e = smooth(modeT / 0.35);
      pose.bodyY += 9 * e;
      pose.legL -= 52 * e;
      pose.legR -= 52 * e;
      pose.headRot += 2 * e;
      pose.armLRot += 8 * e;
      pose.armRRot -= 8 * e;
      pose.skirtSway += 3 * e;
      pose.squash = 0.05 * e;
      pose.bodyScaleY *= 1 - 0.015 * e;
      break;
    }
    case 'sleep': {
      const e = smooth(modeT / 0.5);
      const slower = Math.sin((time * Math.PI * 2) / (Math.max(0.5, timing.breathSeconds ?? 4.2) * 1.35));
      pose.breath = slower * 1.2;
      pose.chestY = -slower * 0.85;
      pose.bodyY += 11 * e;
      pose.headRot += 7 * e;
      pose.headY += 1.4 * e;
      pose.legL -= 43 * e;
      pose.legR -= 43 * e;
      pose.armLRot += 6 * e;
      pose.armRRot -= 6 * e;
      pose.squash = 0.07 * e;
      break;
    }
    case 'dizzy': {
      pose.bodyRot += 6 * Math.sin(modeT * 5.2);
      pose.headRot += 14 * Math.sin(modeT * 7.4 + 1);
      pose.gazeX += 3 * Math.sin(modeT * 5.2);
      pose.armLRot += 10 + 12 * Math.sin(modeT * 5.2);
      pose.armRRot -= 10 + 12 * Math.sin(modeT * 5.2 + 0.7);
      pose.hairSway += 5 * Math.sin(modeT * 5.6);
      pose.skirtSway += 4 * Math.sin(modeT * 5.6 + 0.8);
      pose.bodyY += 1 * Math.sin(modeT * 5.2);
      break;
    }
    case 'nod': {
      const dip = Math.sin(k * Math.PI * 4) * (1 - 0.35 * k);
      pose.headRot += 12 * dip;
      pose.headY += 1.1 * Math.sin(k * Math.PI * 4) * (1 - 0.4 * k);
      pose.chestY += 0.7 * Math.sin(k * Math.PI * 2) * (1 - k);
      pose.bodyY += 0.5 * Math.sin(k * Math.PI * 2) * (1 - k);
      break;
    }
    case 'shake': {
      const e = 1 - 0.45 * k;
      const s = Math.sin(k * Math.PI * 9);
      pose.bodyRot += 5 * s * e;
      pose.headRot -= 4 * s * e;
      pose.hairSway += 4.5 * Math.sin(k * Math.PI * 9 + 0.4) * e;
      pose.skirtSway += 2.5 * Math.sin(k * Math.PI * 9 + 0.8) * e;
      break;
    }
    case 'spin': {
      const phase = k * Math.PI * 2;
      pose.bodyScaleX *= Math.cos(phase);
      pose.bodyRot += 7 * Math.sin(k * Math.PI);
      pose.hairSway += 8 * Math.sin(phase);
      pose.skirtSway -= 6 * Math.sin(phase);
      pose.squash = 0.1 * Math.sin(k * Math.PI);
      break;
    }
    case 'wave': {
      const e = envelope(k, 0.18, 0.76);
      pose.armRRot += (-98 - 18 * Math.sin(k * Math.PI * 10)) * e;
      pose.armLRot += 6 * e;
      pose.headRot -= 3 * e;
      pose.bodyRot -= 1.5 * e;
      pose.hairSway += 2.4 * Math.sin(k * Math.PI * 8) * e;
      break;
    }
    case 'bow': {
      const e = envelope(k, 0.22, 0.8);
      pose.bodyRot += 12 * e;
      pose.headRot += 18 * e;
      pose.bodyY += 1.4 * e;
      pose.armLRot += 12 * e;
      pose.armRRot -= 12 * e;
      pose.skirtSway -= 3 * e;
      break;
    }
    case 'shiver': {
      const e = 1 - k * 0.55;
      pose.bodyRot += 1.4 * Math.sin(time * 60) * e;
      pose.headRot += 1.6 * Math.sin(time * 52 + 0.4) * e;
      pose.armLRot += 3.4 * Math.sin(time * 58) * e;
      pose.armRRot -= 3.4 * Math.sin(time * 58 + 0.5) * e;
      pose.hairSway += 2.2 * Math.sin(time * 47) * e;
      pose.squash = 0.035 * e;
      pose.bodyScaleY *= 1 - 0.018 * e;
      break;
    }
    case 'flap': {
      const e = Math.sin(Math.PI * k);
      const phase = k * Math.PI * 8;
      pose.armLRot += 35 + 28 * Math.sin(phase);
      pose.armRRot -= 35 + 28 * Math.sin(phase);
      pose.bodyY -= 1.4 * e;
      pose.hairSway += 4 * Math.sin(phase * 0.5);
      pose.skirtSway -= 3 * e;
      pose.squash = (mode === 'crouch' ? 0.32 : -0.08) * e;
      break;
    }
    case 'dance': {
      const phase = modeT * 6.2;
      const s = Math.sin(phase);
      pose.bodyRot += 6 * s;
      pose.bodyY -= Math.abs(Math.sin(phase * 2)) * 1.2;
      pose.armLRot += 22 * Math.sin(phase);
      pose.armRRot -= 22 * Math.sin(phase + Math.PI);
      pose.legL += 12 * Math.sin(phase + 0.5);
      pose.legR -= 12 * Math.sin(phase + 0.5);
      pose.hairSway += 4 * Math.sin(phase + 0.6);
      pose.skirtSway += 4.5 * Math.sin(phase + 0.3);
      pose.squash = 0.045 * Math.abs(s);
      break;
    }
    default:
      break;
  }

  return pose;
}

export function smoothZenbotRigPose(previous, target, dt, rate = 22) {
  const alpha = 1 - Math.exp(-Math.max(0, rate) * Math.max(0, dt));
  const next = {};
  for (const key of ZENBOT_RIG_PARAM_KEYS) {
    const from = finiteOr(Number(previous?.[key]), ZERO_POSE[key]);
    const to = finiteOr(Number(target?.[key]), ZERO_POSE[key]);
    next[key] = from + (to - from) * alpha;
  }
  return next;
}

function poseToState(pose, manifest, faceMix) {
  const states = { mix: clamp(finiteOr(faceMix, 0), 0, 1) };
  const rot = (id, values) => {
    if (id && manifest.deformers[id]?.kind === 'rot') states[id] = values;
  };

  const bodyId = manifest.deformers.body
    ? 'body'
    : manifest.deformers.root
      ? 'root'
      : null;
  const bodyState = {
    a: pose.bodyRot,
    tx: pose.bodyX,
    ty: pose.bodyY,
    sx: pose.bodyScaleX * (1 + pose.squash * 0.06),
    sy: pose.bodyScaleY * (1 - pose.squash * 0.1),
  };
  rot(bodyId, bodyState);

  if (manifest.deformers.chest) {
    rot('chest', { ty: pose.chestY });
  } else if (bodyId && states[bodyId]) {
    states[bodyId].ty += pose.chestY * 0.5;
  }

  rot('head', {
    a: pose.headRot,
    tx: pose.headX + pose.gazeX * 0.22,
    ty: pose.headY + pose.gazeY * 0.22 + pose.breath * 0.2,
  });
  rot('hair_back', { a: pose.hairSway + pose.gazeX * 0.15 });
  rot('skirt', { a: pose.skirtSway });
  rot('arm_l', { a: pose.armLRot });
  rot('arm_r', { a: pose.armRRot });
  rot('leg_l', { a: pose.legL });
  rot('leg_r', { a: pose.legR });
  rot('jaw', { a: pose.jaw * 3.5 });
  const eyelids = manifest.parts.filter((part) => /^eyelid(?:s|_[lr])$/.test(part.id));
  if (eyelids.length) {
    states.alpha = Object.fromEntries(eyelids.map((part) => [part.id, clamp(pose.blink, 0, 1)]));
  }
  return states;
}

function addDeformerState(states, manifest, id, values = {}) {
  if (!id || manifest.deformers[id]?.kind !== 'rot') return;
  const current = states[id] ?? {};
  states[id] = {
    a: (finiteOr(Number(current.a), 0)) + (values.a ?? 0),
    tx: (finiteOr(Number(current.tx), 0)) + (values.tx ?? 0),
    ty: (finiteOr(Number(current.ty), 0)) + (values.ty ?? 0),
    sx: (finiteOr(Number(current.sx), 1)) * (values.sx ?? 1),
    sy: (finiteOr(Number(current.sy), 1)) * (values.sy ?? 1),
  };
}

function applyOptionalFaceParts(states, manifest, { blink = 0, mouth = null } = {}) {
  const eyelids = manifest.parts.filter((part) => /^eyelid(?:s|_[lr])$/.test(part.id));
  if (eyelids.length) {
    states.alpha = Object.fromEntries(eyelids.map((part) => [part.id, clamp(blink, 0, 1)]));
  }
  if (mouth && manifest.deformers.jaw?.kind === 'rot') {
    addDeformerState(states, manifest, 'jaw', { ty: Math.max(0, finiteOr(Number(mouth.height), 0)) });
  }
}

function wrapError(code, message, cause) {
  if (isZenbotRigError(cause)) return cause;
  return new ZenbotRigError(code, message, { cause });
}

function manifestUrlFromBase(baseUrl) {
  return joinUrl(baseUrl, 'manifest.json');
}

function hasKeys(value, key) {
  return value && typeof value === 'object' && value[key] && typeof value[key] === 'object'
    ? Object.keys(value[key])
    : undefined;
}

/**
 * Creates the optional zenbot rig figure. The factory resolves only after the manifest, the rig
 * surface, and the initial face/part textures are ready; every initialisation failure throws a
 * `ZenbotRigError` with a stable `code`, so the caller can fall back to `createZenbotFigure`.
 */
export async function createZenbotRigFigure(options = {}) {
  const doc = options.document ?? (typeof document === 'undefined' ? null : document);
  if (!doc || typeof doc.createElementNS !== 'function' || typeof doc.createElement !== 'function') {
    throw new ZenbotRigError(
      ZENBOT_RIG_ERROR_CODES.DOM,
      'createZenbotRigFigure requires a DOM document with createElementNS and createElement',
    );
  }

  let baseUrl = options.rigBaseUrl ?? options.baseUrl ?? '/characters/zenbot/rig/';
  if (typeof baseUrl !== 'string' || !baseUrl.trim()) {
    throw new ZenbotRigError(ZENBOT_RIG_ERROR_CODES.BASE_URL, 'baseUrl must be a non-empty string');
  }
  if (/\/zenbot\/?$/i.test(baseUrl) && !/\/rig\/?$/i.test(baseUrl)) {
    baseUrl = `${baseUrl.replace(/\/+$/, '')}/rig/`;
  }

  let lastError = null;
  let failure = null;
  let disposed = false;
  let state = 'ready';
  const reportedErrors = new WeakSet();
  const reportError = (error) => {
    lastError = error instanceof Error ? error : new Error(String(error));
    if (lastError && typeof lastError === 'object') {
      if (reportedErrors.has(lastError)) return;
      reportedErrors.add(lastError);
    }
    try {
      options.onError?.(lastError);
    } catch {}
  };

  let rawManifest = options.manifest ?? null;
  if (!rawManifest) {
    if (typeof fetch !== 'function') {
      const error = new ZenbotRigError(ZENBOT_RIG_ERROR_CODES.FETCH, 'createZenbotRigFigure requires fetch or a manifest option');
      reportError(error);
      throw error;
    }
    const url = manifestUrlFromBase(baseUrl);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      rawManifest = await response.json();
    } catch (cause) {
      const error = wrapError(ZENBOT_RIG_ERROR_CODES.FETCH, `failed to load ${url}`, cause);
      reportError(error);
      throw error;
    }
  }

  let referenceManifest = options.spriteManifest ?? options.referenceManifest ?? null;
  if (!referenceManifest && options.loadReferenceManifest !== false && typeof fetch === 'function') {
    const spriteBaseUrl = options.spriteBaseUrl ?? parentBaseUrl(baseUrl);
    const spriteManifestUrl = options.spriteManifestUrl ?? manifestUrlFromBase(spriteBaseUrl);
    try {
      const response = await fetch(spriteManifestUrl);
      if (response.ok) referenceManifest = await response.json();
    } catch {
      referenceManifest = null;
    }
  }

  let manifest;
  try {
    manifest = validateZenbotRigManifest(rawManifest, {
      availableFiles: options.availableFiles,
      expressionIds: options.expressionIds
        ?? hasKeys(referenceManifest, 'expressions')
        ?? ZENBOT_EXPRESSION_IDS,
      motionIds: options.motionIds
        ?? hasKeys(referenceManifest, 'motions')
        ?? ZENBOT_MOTION_IDS,
      expectedAliases: options.expectedAliases
        ?? (referenceManifest?.expressionAliases && typeof referenceManifest.expressionAliases === 'object'
          ? referenceManifest.expressionAliases
          : null),
      expectedDrawing: options.expectedDrawing,
    });
  } catch (cause) {
    const error = wrapError(ZENBOT_RIG_ERROR_CODES.MANIFEST, 'rig manifest validation failed', cause);
    reportError(error);
    throw error;
  }

  const facePart = getZenbotRigFacePart(manifest);
  if (!facePart) {
    const error = new ZenbotRigError(ZENBOT_RIG_ERROR_CODES.MANIFEST, 'rig manifest has no face_base part');
    reportError(error);
    throw error;
  }

  let calibration = normaliseCalibration(options.calibration ?? { x: 0, y: 0, scale: 1 });
  const model = createZenbotRigModel(manifest);
  const gaitContacts = installZenbotGait(model);
  const hairBinding = installZenbotHair(model);
  let gaitWeight = 0;
  let lastGaitRun = false;
  const root = svgNode(doc, 'g', {
    class: 'zenbot-rig-figure',
    'aria-hidden': 'true',
    'pointer-events': 'none',
  });
  const calibrationGroup = svgNode(doc, 'g', { class: 'zenbot-rig-calibration-root' });
  const [viewX, viewY, viewX1, viewY1] = manifest.drawing.view;
  const viewWidth = viewX1 - viewX;
  const viewHeight = viewY1 - viewY;
  const pixelRatio = clamp(finiteOr(Number(options.pixelRatio), 0) || Math.min(2, Math.max(1, globalThis.devicePixelRatio || 1)), 1, 4);
  const foreign = svgNode(doc, options.raster ? 'image' : 'foreignObject', {
    class: 'zenbot-rig-surface',
    x: viewX,
    y: viewY,
    width: viewWidth,
    height: viewHeight,
    overflow: 'hidden',
  });
  const canvas = doc.createElement('canvas');
  canvas.width = Math.max(1, Math.round(viewWidth * pixelRatio));
  canvas.height = Math.max(1, Math.round(viewHeight * pixelRatio));
  if (canvas.style) {
    canvas.style.width = `${viewWidth}px`;
    canvas.style.height = `${viewHeight}px`;
    canvas.style.display = 'block';
    canvas.style.pointerEvents = 'none';
  }
  if (typeof canvas.setAttribute === 'function') {
    canvas.setAttribute('class', 'zenbot-rig-canvas');
    canvas.setAttribute('aria-hidden', 'true');
  }
  if (!options.raster) foreign.append(canvas);
  const guide = createGuide(doc, manifest);
  calibrationGroup.append(foreign, guide);
  root.append(calibrationGroup);

  let rig;
  try {
    rig = createRig(canvas, model);
  } catch (cause) {
    root.remove?.();
    const error = wrapError(ZENBOT_RIG_ERROR_CODES.WEBGL, `WebGL initialisation failed: ${cause?.message ?? cause}`, cause);
    reportError(error);
    throw error;
  }

  let motionEvaluator = typeof options.motionEvaluator === 'function' ? options.motionEvaluator : null;
  let motionAdapter = typeof options.motionAdapter === 'function' ? options.motionAdapter : null;
  let motionEngineReported = false;
  async function initialiseMotionEngine() {
    if (motionEvaluator || options.useMotionLibrary === false) return;
    try {
      const module = await import('../characters/zenbot-rig-motions.js');
      if (typeof module.evaluateZenbotRig === 'function') motionEvaluator = module.evaluateZenbotRig;
      if (!motionAdapter && typeof module.adaptZenbotRigState === 'function') {
        motionAdapter = module.adaptZenbotRigState;
      }
    } catch {
      motionEvaluator = null;
      motionAdapter = null;
    }
  }

  let displayTime = 0;
  let lastFrameTime = null;
  let draws = 0;
  let contextLosses = 0;
  let lossTimer = null;
  let appliedGuide = null;
  let lastFacingSign = null;
  let turnUntil = 0;
  let blinkAge = 9;
  let blinkNext = 1.4 + Math.random() * 2.2;
  let pose = zenbotRigIdlePose(0, {}, manifest.timing);
  let currentExpression = {
    id: 'neutral',
    file: manifest.expressions.neutral.file,
  };
  let pendingExpression = null;
  let expressionTransition = null;
  let faceMix = 0;
  const imageCache = new Map();
  const failureAt = new Map();
  const reportedFailures = new Set();
  let useClock = 0;

  const faceTexture = facePart.tex;
  let faceAnimator = null;
  const expressionFadeSeconds = Math.max(1e-3, manifest.timing.expressionFadeMs / 1000);
  const turnSeconds = Math.max(1e-3, manifest.timing.turnMs / 1000);
  const contextLossTimeoutMs = Math.max(50, finiteOr(Number(options.contextLossTimeoutMs), DEFAULT_CONTEXT_LOSS_TIMEOUT_MS));

  function protectedUrls() {
    const urls = new Set();
    if (currentExpression.file) urls.add(joinUrl(baseUrl, currentExpression.file));
    if (expressionTransition?.file) urls.add(joinUrl(baseUrl, expressionTransition.file));
    if (pendingExpression && manifest.expressions[pendingExpression]) {
      urls.add(joinUrl(baseUrl, manifest.expressions[pendingExpression].file));
    }
    return urls;
  }

  function trimCache() {
    if (imageCache.size <= IMAGE_CACHE_LIMIT) return;
    const protectedKeys = protectedUrls();
    const candidates = [...imageCache.entries()]
      .filter(([url, entry]) => !protectedKeys.has(url) && entry.ready)
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    while (imageCache.size > IMAGE_CACHE_LIMIT && candidates.length) {
      const [url] = candidates.shift();
      imageCache.delete(url);
    }
  }

  function loadImage(file) {
    const url = joinUrl(baseUrl, file);
    const cached = imageCache.get(url);
    if (cached?.ready) {
      cached.lastUsed = ++useClock;
      return Promise.resolve(cached);
    }
    if (cached?.promise) {
      cached.lastUsed = ++useClock;
      return cached.promise;
    }
    const retryAt = failureAt.get(url);
    if (retryAt != null && displayTime < retryAt) {
      return Promise.reject(new ZenbotRigError(
        ZENBOT_RIG_ERROR_CODES.TEXTURE,
        `texture is waiting for retry: ${url}`,
      ));
    }

    const entry = {
      url,
      file,
      img: null,
      width: 0,
      height: 0,
      ready: false,
      promise: null,
      lastUsed: ++useClock,
    };
    imageCache.set(url, entry);
    entry.promise = decodeHtmlImage(doc, url).then((img) => {
      if (disposed) throw new ZenbotRigError(ZENBOT_RIG_ERROR_CODES.DISPOSED, 'rig disposed during image load');
      entry.img = img;
      entry.width = img.naturalWidth || img.width;
      entry.height = img.naturalHeight || img.height;
      if (!(entry.width > 0 && entry.height > 0)) throw new Error(`image has no dimensions: ${url}`);
      entry.ready = true;
      failureAt.delete(url);
      reportedFailures.delete(url);
      trimCache();
      return entry;
    }).catch((cause) => {
      imageCache.delete(url);
      failureAt.set(url, displayTime + RETRY_DELAY_SECONDS);
      const error = wrapError(ZENBOT_RIG_ERROR_CODES.TEXTURE, `failed to load rig texture ${url}`, cause);
      if (!disposed && !reportedFailures.has(url)) {
        reportedFailures.add(url);
        reportError(error);
      }
      throw error;
    });
    trimCache();
    return entry.promise;
  }

  function uploadImage(key, entry) {
    if (!entry?.img) throw new ZenbotRigError(ZENBOT_RIG_ERROR_CODES.TEXTURE, `texture ${key} is not loaded`);
    rig.upload(key, entry.img);
  }

  function startExpressionTransition(id, file, entry) {
    try {
      rig.upload(`${faceTexture}@mix`, entry.img);
    } catch (cause) {
      failRuntime(wrapError(ZENBOT_RIG_ERROR_CODES.WEBGL, 'failed to upload the expression mix texture', cause));
      return;
    }
    expressionTransition = {
      fromId: currentExpression.id,
      toId: id,
      file,
      img: entry.img,
      start: displayTime,
    };
    faceMix = 0;
  }

  function finishExpressionTransition() {
    if (!expressionTransition) return;
    const transition = expressionTransition;
    try {
      rig.upload(faceTexture, transition.img);
    } catch (cause) {
      expressionTransition = null;
      faceMix = 0;
      failRuntime(wrapError(ZENBOT_RIG_ERROR_CODES.WEBGL, 'failed to upload the expression texture', cause));
      return;
    }
    currentExpression = { id: transition.toId, file: transition.file };
    expressionTransition = null;
    faceMix = 0;
  }

  function requestExpression(id) {
    if (!id || disposed || state !== 'ready') return;
    const expression = manifest.expressions[id];
    if (!expression) return;
    const file = expression.file;

    if (expressionTransition) {
      if (expressionTransition.toId === id) return;
      finishExpressionTransition();
      if (state === 'failed' || disposed) return;
    }
    if (currentExpression.id === id) {
      faceMix = 0;
      return;
    }
    if (currentExpression.file === file) {
      currentExpression = { id, file };
      faceMix = 0;
      return;
    }

    const cached = imageCache.get(joinUrl(baseUrl, file));
    if (cached?.ready) {
      pendingExpression = null;
      startExpressionTransition(id, file, cached);
      return;
    }
    if (pendingExpression === id) return;

    const url = joinUrl(baseUrl, file);
    const retryAt = failureAt.get(url);
    if (retryAt != null && displayTime < retryAt) {
      if (id !== 'neutral' && currentExpression.id !== 'neutral') requestExpression('neutral');
      return;
    }

    pendingExpression = id;
    loadImage(file).then(() => {
      if (disposed || pendingExpression !== id) return;
      pendingExpression = null;
    }).catch((error) => {
      if (pendingExpression === id) pendingExpression = null;
      if (disposed) return;
      if (id !== 'neutral' && currentExpression.id !== 'neutral') requestExpression('neutral');
      else if (id === 'neutral') failRuntime(error);
    });
  }

  function failRuntime(error) {
    if (state === 'failed' || state === 'disposed') return;
    const wrapped = isZenbotRigError(error)
      ? error
      : wrapError(ZENBOT_RIG_ERROR_CODES.WEBGL, error?.message ?? String(error), error);
    state = 'failed';
    failure = wrapped;
    if (lossTimer) {
      clearTimeout(lossTimer);
      lossTimer = null;
    }
    reportError(wrapped);
    try {
      options.onFailure?.(wrapped);
    } catch {}
  }

  function onContextLost() {
    if (disposed || state === 'failed') return;
    contextLosses += 1;
    state = 'lost';
    lastError = new ZenbotRigError(
      ZENBOT_RIG_ERROR_CODES.CONTEXT_LOST,
      'WebGL context lost; waiting for the browser to restore it',
    );
    if (lossTimer) clearTimeout(lossTimer);
    lossTimer = setTimeout(() => {
      lossTimer = null;
      if (state === 'lost') {
        failRuntime(new ZenbotRigError(
          ZENBOT_RIG_ERROR_CODES.CONTEXT_LOST,
          `WebGL context was not restored within ${contextLossTimeoutMs} ms`,
        ));
      }
    }, contextLossTimeoutMs);
  }

  function onContextRestored() {
    if (disposed || state === 'failed') return;
    if (lossTimer) {
      clearTimeout(lossTimer);
      lossTimer = null;
    }
    state = 'ready';
    if (lastError?.code === ZENBOT_RIG_ERROR_CODES.CONTEXT_LOST) lastError = null;
  }

  if (typeof canvas.addEventListener === 'function') {
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
  }

  function calibratedPoint(x, y) {
    return [
      manifest.drawing.centerX + calibration.x + (x - manifest.drawing.centerX) * calibration.scale,
      manifest.drawing.feetY + calibration.y + (y - manifest.drawing.feetY) * calibration.scale,
    ];
  }

  function updateCalibrationTransform() {
    const { centerX, feetY } = manifest.drawing;
    setAttr(
      calibrationGroup,
      'transform',
      `translate(${calibration.x} ${calibration.y}) translate(${centerX} ${feetY}) scale(${calibration.scale}) translate(${-centerX} ${-feetY})`,
    );
  }

  function updateGuide() {
    const visible = Boolean(options.calibrate);
    if (appliedGuide === visible) return;
    appliedGuide = visible;
    setAttr(guide, 'display', visible ? 'inline' : 'none');
  }

  function updateBlink(dt) {
    blinkAge += dt;
    blinkNext -= dt;
    if (blinkNext <= 0) {
      blinkAge = 0;
      blinkNext = Math.random() < 0.2 ? 0.28 : 2.4 + Math.random() * 2.8;
    }
    const close = Math.max(0.04, manifest.timing.blinkCloseMs / 1000);
    return blinkAge < close ? Math.sin((Math.PI * blinkAge) / close) : 0;
  }

  function updateExpressionTransition() {
    if (!expressionTransition) {
      faceMix = 0;
      return;
    }
    const progress = clamp((displayTime - expressionTransition.start) / expressionFadeSeconds, 0, 1);
    faceMix = progress;
    if (progress >= 1) finishExpressionTransition();
  }

  function externalMotionStates(frame, turnK, blink) {
    const selection = chooseZenbotMotion(frame, { turn: turnK > 0 });
    const evalOptions = {
      manifest,
      expressionAliases: manifest.expressionAliases,
      blink,
      phase: options.phase,
      gaitPhase: frame?.gaitPhase,
      velocityX: finiteOr(Number(frame?.velX), finiteOr(Number(options.velocityX), 0)),
      gaitWeight: options.gaitWeight,
      sitK: frame?.sit,
    };
    let evalFrame = { ...frame, blink, eyeClose: blink };
    if (selection === 'turn') {
      const elapsed = Math.max(0, turnSeconds * (1 - clamp(turnK, 0, 1)));
      evalFrame = { ...evalFrame, motionT: elapsed };
      evalOptions.motion = 'turn';
    }
    const state = motionEvaluator(evalFrame, displayTime, evalOptions);
    if (!state || typeof state !== 'object' || !state.deformers || typeof state.deformers !== 'object') {
      throw new Error('motion engine returned no deformer state');
    }
    const adapted = motionAdapter ? motionAdapter(state, manifest) : state;
    if (!adapted || typeof adapted.deformers !== 'object') {
      throw new Error('motion adapter returned no deformer state');
    }
    const states = { ...adapted.deformers };
    const bodyKey = adapted.deformerMapping?.body ?? 'body';
    if (states[bodyKey]) {
      const bodyState = { ...states[bodyKey] };
      // kit/body.js already applies horizontal card-flip (`faceVis`) on turn/spin and
      // vertical physics + squash (`fy`/`sq`) on crouch/air/land; damp rig body transforms
      // so the two layers do not double-compress or double-jump.
      if (selection === 'turn' || selection === 'spin') {
        bodyState.sx = 1 + (finiteOr(bodyState.sx, 1) - 1) * 0.25;
      }
      if (frame?.mode === 'air' || frame?.mode === 'crouch' || frame?.mode === 'land') {
        if (bodyState.ty < 0) bodyState.ty *= 0.25;
        bodyState.sy = clamp(finiteOr(bodyState.sy, 1), 0.94, 1.04);
      }
      states[bodyKey] = bodyState;
    }
    applyOptionalFaceParts(states, manifest, {
      blink: finiteOr(Number(state.expression?.blink), blink),
      mouth: state.mouth ?? null,
    });
    states.mix = expressionTransition ? faceMix : 0;
    return {
      states,
      face: typeof state.expression?.face === 'string' ? state.expression.face : null,
    };
  }

  function initialRenderState() {
    if (motionEvaluator) {
      try {
        return externalMotionStates({ mode: 'idle', face: 'neutral', t: 0 }, 0, 0).states;
      } catch {}
    }
    return poseToState(pose, manifest, 0);
  }

  async function initialiseTextures() {
    const neutral = manifest.expressions.neutral;
    let neutralEntry;
    try {
      neutralEntry = await loadImage(neutral.file);
    } catch (cause) {
      const error = wrapError(ZENBOT_RIG_ERROR_CODES.TEXTURE, `failed to load neutral expression ${neutral.file}`, cause);
      reportError(error);
      throw error;
    }
    try {
      uploadImage(faceTexture, neutralEntry);
    } catch (cause) {
      const error = wrapError(ZENBOT_RIG_ERROR_CODES.WEBGL, 'failed to upload the neutral expression', cause);
      reportError(error);
      throw error;
    }
    currentExpression = { id: 'neutral', file: neutral.file };
    try {
      const closedFace = await loadImage(manifest.expressions.happy.file);
      faceAnimator = createZenbotFaceAnimator(doc, closedFace.img);
    } catch (error) {
      reportError(error);
    }

    const uploads = [];
    const uploaded = new Set([faceTexture]);
    for (const part of manifest.parts) {
      if (part.id === 'face_base' || uploaded.has(part.tex)) continue;
      uploaded.add(part.tex);
      uploads.push(loadImage(part.file).then((entry) => {
        uploadImage(part.tex, entry);
      }).catch((cause) => {
        throw wrapError(ZENBOT_RIG_ERROR_CODES.TEXTURE, `failed to load part ${part.id} (${part.file})`, cause);
      }));
    }
    try {
      await Promise.all(uploads);
    } catch (cause) {
      const error = wrapError(ZENBOT_RIG_ERROR_CODES.TEXTURE, 'failed to initialise rig part textures', cause);
      reportError(error);
      throw error;
    }
  }

  function cleanupInitialisation() {
    disposed = true;
    try {
      rig.dispose();
    } catch {}
    try {
      root.replaceChildren();
      root.remove?.();
    } catch {}
  }

  try {
    await initialiseMotionEngine();
    await initialiseTextures();
    updateCalibrationTransform();
    updateGuide();
    const initialStates = initialRenderState();
    anchorZenbotHair(initialStates, hairBinding);
    rig.render(initialStates);
  } catch (cause) {
    cleanupInitialisation();
    const error = wrapError(ZENBOT_RIG_ERROR_CODES.TEXTURE, 'zenbot rig initialisation failed', cause);
    reportError(error);
    throw error;
  }

  function draw(petG, face, frame = {}) {
    if (disposed || state === 'failed') return;
    if (!petG) throw new Error('draw requires a parent SVG group');
    if (root.parentNode !== petG) petG.append(root);

    const suppliedTime = Number(frame?.t);
    const t = Number.isFinite(suppliedTime) ? suppliedTime : displayTime + 1 / 60;
    const first = lastFrameTime == null;
    const previousTime = lastFrameTime ?? t;
    lastFrameTime = t;
    displayTime = Math.max(displayTime, t);
    const dt = first ? 0 : clamp(t - previousTime, 0, 0.05);

    updateCalibrationTransform();
    updateGuide();

    const facing = Number(frame?.facing);
    if (Number.isFinite(facing)) {
      const sign = Math.sign(facing) || lastFacingSign || 1;
      if (lastFacingSign != null && sign !== lastFacingSign) {
        turnUntil = displayTime + turnSeconds;
      }
      lastFacingSign = sign;
    }
    const turnK = turnUntil > displayTime
      ? clamp((turnUntil - displayTime) / turnSeconds, 0, 1)
      : 0;

    const faceName = typeof frame?.face === 'string'
      ? frame.face
      : typeof face === 'string'
        ? face
        : 'neutral';
    const scheduledBlink = updateBlink(dt);
    const frameEyeClose = Number(frame?.eyeClose);
    const frameBlink = Number(frame?.blink);
    const blink = Number.isFinite(frameEyeClose) || Number.isFinite(frameBlink)
      ? Math.max(
        Number.isFinite(frameBlink) ? clamp(frameBlink, 0, 1) : 0,
        Number.isFinite(frameEyeClose) ? clamp(frameEyeClose, 0, 1) : 0,
      )
      : scheduledBlink;
    const motion = chooseZenbotMotion(frame, { turn: turnK > 0 });
    const targetPose = evaluateZenbotRigMotion(motion, frame, displayTime, {
      timing: manifest.timing,
      turnK,
      blink,
    });
    targetPose.blink = blink;
    let states = null;
    let expressionFace = null;
    if (motionEvaluator) {
      try {
        const external = externalMotionStates(frame, turnK, blink);
        states = external.states;
        expressionFace = external.face;
        pose = targetPose;
      } catch (cause) {
        if (!motionEngineReported) {
          motionEngineReported = true;
          reportError(wrapError(
            ZENBOT_RIG_ERROR_CODES.MOTION,
            'zenbot rig motion engine failed; using the built-in pose fallback',
            cause,
          ));
        }
        motionEvaluator = null;
        motionAdapter = null;
      }
    }
    if (!states) {
      pose = first ? targetPose : smoothZenbotRigPose(pose, targetPose, dt, options.poseRate ?? 22);
      pose.blink = blink;
      states = poseToState(pose, manifest, expressionTransition ? faceMix : 0);
    }

    const expressionId = chooseZenbotRigExpression(expressionFace ?? faceName, manifest);
    if (expressionId) requestExpression(expressionId);
    if (state === 'ready') updateExpressionTransition();

    if (state !== 'ready') return;
    try {
      anchorZenbotHair(states, hairBinding);
      const walking = frame.mode === 'walk' || frame.mode === 'run';
      if (walking) lastGaitRun = frame.mode === 'run';
      const gaitTarget = walking ? smooth(finiteOr(frame.modeT, 0) / 0.2) : 0;
      gaitWeight = walking ? gaitTarget : ['idle', 'look'].includes(frame.mode) ? Math.max(0, gaitWeight - dt / 0.18) : 0;
      if (gaitWeight > 0) {
        const phase = Number.isFinite(frame.gaitPhase) ? frame.gaitPhase * Math.PI * 2 : finiteOr(frame.modeT, 0) * Math.PI * 2 * (lastGaitRun ? 4.4 : 2.1);
        const feet = sampleZenbotGait(frame, phase, lastGaitRun, gaitWeight);
        constrainZenbotGait(rig, states, gaitContacts, feet, gaitWeight);
      }
      if (faceAnimator && !expressionTransition) {
        const entry = imageCache.get(joinUrl(baseUrl, currentExpression.file));
        if (entry?.ready) {
          const animatedFace = faceAnimator.render(entry.img, {
            face: currentExpression.id,
            blink,
            talk: finiteOr(Number(frame?.talk), 0),
            time: displayTime,
          });
          if (animatedFace) rig.upload(faceTexture, animatedFace);
        }
      }
      if (expressionTransition) states.mix = faceMix;
      else states.mix = 0;
      rig.render(states);
      if (options.raster) foreign.setAttribute('href', canvas.toDataURL('image/png'));
      draws += 1;
    } catch (cause) {
      failRuntime(wrapError(ZENBOT_RIG_ERROR_CODES.WEBGL, 'rig render failed', cause));
    }
  }

  function preloadWord(word) {
    if (disposed) return Promise.reject(new ZenbotRigError(
      ZENBOT_RIG_ERROR_CODES.DISPOSED,
      'cannot preload a word on a disposed zenbot rig',
    ));
    const name = typeof word === 'string' ? word : '';
    if (!name) return Promise.reject(new Error('unknown zenbot rig preview word: (empty)'));
    if (manifest.motions[name] || ZENBOT_MOTION_IDS.includes(name)) return Promise.resolve();
    const resolved = resolveZenbotRigExpression(name, manifest);
    if (resolved.id && (manifest.expressions[name] || manifest.expressionAliases[name] || ZENBOT_EXPRESSION_IDS.includes(name))) {
      if (!resolved.file) return Promise.resolve();
      return loadImage(resolved.file).then(() => undefined);
    }
    return Promise.reject(new Error(`unknown zenbot rig preview word: ${name}`));
  }

  function setCalibration(next = {}) {
    calibration = normaliseCalibration({
      x: next.x == null ? calibration.x : next.x,
      y: next.y == null ? calibration.y : next.y,
      scale: next.scale == null ? calibration.scale : next.scale,
    });
    updateCalibrationTransform();
    return { ...calibration };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    state = 'disposed';
    if (lossTimer) {
      clearTimeout(lossTimer);
      lossTimer = null;
    }
    if (typeof canvas.removeEventListener === 'function') {
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
    }
    try {
      rig.dispose();
    } catch {}
    expressionTransition = null;
    pendingExpression = null;
    for (const entry of imageCache.values()) entry.img?.removeAttribute?.('src');
    imageCache.clear();
    failureAt.clear();
    reportedFailures.clear();
    try {
      root.replaceChildren();
      root.remove?.();
    } catch {}
  }

  const accent = manifest.defaults.accent;
  const wordList = [...new Set([
    ...ZENBOT_EXPRESSION_IDS,
    ...ZENBOT_MOTION_IDS,
    ...Object.keys(manifest.motions),
  ])];

  return {
    renderer: 'rig',
    draw,
    ready: Promise.resolve(),
    get anchors() {
      return { bubble: calibratedPoint(...manifest.defaults.bubbleAnchor) };
    },
    get extent() {
      const [x0, y0, x1, y1] = manifest.defaults.extent;
      const points = [
        calibratedPoint(x0, y0),
        calibratedPoint(x1, y0),
        calibratedPoint(x0, y1),
        calibratedPoint(x1, y1),
      ];
      return [
        Math.min(...points.map((point) => point[0])),
        Math.min(...points.map((point) => point[1])),
        Math.max(...points.map((point) => point[0])),
        Math.max(...points.map((point) => point[1])),
      ];
    },
    get hits() {
      const [x, y, radius] = manifest.defaults.hit;
      return [[...calibratedPoint(x, y), radius * calibration.scale]];
    },
    get gestures() { return [...ZENBOT_GESTURES]; },
    groupTilt(mode, tilt) {
      return mode === 'drag' || mode === 'air' ? tilt * 0.45 : 0;
    },
    get particles() { return { ...ZENBOT_PARTICLES }; },
    get accent() { return accent; },
    get skinMeta() {
      return {
        id: manifest.id,
        label: manifest.name ?? manifest.id.replace(/-rig$/i, ''),
        accent,
        eye: manifest.defaults.eye ?? accent,
      };
    },
    get calibration() { return { ...calibration }; },
    get colors() {
      return {
        get z() { return accent; },
      };
    },
    get words() { return [...wordList]; },
    get state() { return state; },
    get failure() { return failure; },
    get complete() { return manifest.coverage.complete; },
    get coverage() { return copyJson(manifest.coverage); },
    get warnings() { return copyJson(manifest.warnings); },
    get stats() {
      return {
        renderer: 'rig',
        state,
        motionEngine: motionEvaluator ? 'zenbot-rig-motions' : 'builtin',
        draws,
        contextLosses,
        parts: manifest.parts.length,
        expressions: Object.keys(manifest.expressions).length,
        motions: Object.keys(manifest.motions).length,
        cachedTextures: imageCache.size,
        failedTextures: failureAt.size,
        missingExpressions: [...manifest.coverage.expressions.missing],
        missingMotions: [...manifest.coverage.motions.missing],
        lastError: lastError ? { code: lastError.code ?? null, message: lastError.message } : null,
      };
    },
    get manifest() { return copyJson(manifest); },
    setSkin() { return false; },
    preloadWord,
    setCalibration,
    dispose,
  };
}
