import { ZENBOT_EXPRESSION_IDS, ZENBOT_MOTION_IDS } from './zenbot-manifest.js';

export const ZENBOT_RIG_SCHEMA_VERSION = 1;

/** Frozen registration values from docs/zenbot/RIG_CONTRACT.md. */
export const ZENBOT_RIG_REFERENCE = Object.freeze({
  logoHeight: 292,
  centerX: 128,
  feetY: 256,
  referenceCanvas: Object.freeze([1117, 1409]),
});

export const ZENBOT_RIG_REQUIRED_PART = 'face_base';
export const ZENBOT_RIG_FACE_TEXTURE = 'face_base';

export const ZENBOT_RIG_ERROR_CODES = Object.freeze({
  DOM: 'RIG_ERR_DOM',
  BASE_URL: 'RIG_ERR_BASE_URL',
  FETCH: 'RIG_ERR_FETCH',
  MANIFEST: 'RIG_ERR_MANIFEST',
  MOTION: 'RIG_ERR_MOTION',
  TEXTURE: 'RIG_ERR_TEXTURE',
  WEBGL: 'RIG_ERR_WEBGL',
  CONTEXT_LOST: 'RIG_ERR_CONTEXT_LOST',
  DISPOSED: 'RIG_ERR_DISPOSED',
});

export class ZenbotRigError extends Error {
  constructor(code, message, { cause, path } = {}) {
    super(`${code}: ${message}`, cause === undefined ? undefined : { cause });
    this.name = 'ZenbotRigError';
    this.code = code;
    this.path = path ?? null;
    this.fallback = true;
  }
}

export function isZenbotRigError(value) {
  return value instanceof ZenbotRigError;
}

const HEX_COLOUR = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const WINDOWS_ABSOLUTE = /^[a-z]:/i;
const URL_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const UNSAFE_FILE_CHARS = /[\u0000-\u001f<>:"|?*#]/;
const ENCODED_SEPARATOR = /%(?:2e|2f|5c)/i;
const PART_ID = /^[a-z][a-z0-9_-]*$/;
const TEXTURE_ID = /^[a-z][a-z0-9_.@-]*$/;
const DEFORMER_ID = /^[a-z][a-z0-9_-]*$/;

const DEFAULT_TIMING = Object.freeze({
  expressionFadeMs: 180,
  blinkCloseMs: 130,
  breathSeconds: 4.2,
  motionTailMs: 140,
  turnMs: 420,
});

/** Pivots recommended by the frozen contract, used when the manifest omits one. */
export const ZENBOT_RIG_DEFAULT_PIVOTS = Object.freeze({
  body: Object.freeze([128, 232]),
  chest: Object.freeze([128, 210]),
  head: Object.freeze([128, 96]),
  hair_back: Object.freeze([128, 78]),
  arm_l: Object.freeze([88, 156]),
  arm_r: Object.freeze([168, 156]),
  skirt: Object.freeze([128, 204]),
  leg_l: Object.freeze([109, 219]),
  leg_r: Object.freeze([147, 219]),
});

function fail(path, message, code = ZENBOT_RIG_ERROR_CODES.MANIFEST) {
  throw new ZenbotRigError(code, `${path}: ${message}`, { path });
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (!isRecord(value)) return value;
  const copy = {};
  for (const [key, item] of Object.entries(value)) copy[key] = cloneValue(item);
  return copy;
}

function requiredRecord(value, path) {
  if (!isRecord(value)) fail(path, 'must be an object');
  return cloneValue(value);
}

function requiredString(value, path) {
  if (typeof value !== 'string' || !value.trim()) fail(path, 'must be a non-empty string');
  return value;
}

function requiredFinite(value, path) {
  if (!Number.isFinite(value)) fail(path, 'must be a finite number');
  return value;
}

function positiveNumber(value, path) {
  const number = requiredFinite(value, path);
  if (number <= 0) fail(path, 'must be greater than zero');
  return number;
}

function nonNegativeNumber(value, path) {
  const number = requiredFinite(value, path);
  if (number < 0) fail(path, 'must not be negative');
  return number;
}

function positiveInteger(value, path, maximum = 64) {
  const number = requiredFinite(value, path);
  if (!Number.isInteger(number) || number <= 0) fail(path, 'must be a positive integer');
  if (number > maximum) fail(path, `must not exceed ${maximum}`);
  return number;
}

function numberPair(value, path) {
  if (!Array.isArray(value) || value.length !== 2) fail(path, 'must be a two-number array');
  return [
    requiredFinite(value[0], `${path}[0]`),
    requiredFinite(value[1], `${path}[1]`),
  ];
}

function positivePair(value, path) {
  const pair = numberPair(value, path);
  if (pair[0] <= 0 || pair[1] <= 0) fail(path, 'dimensions must be greater than zero');
  return pair;
}

function rectangle(value, path) {
  if (!Array.isArray(value) || value.length !== 4) fail(path, 'must be an [x, y, width, height] array');
  const box = value.map((item, index) => requiredFinite(item, `${path}[${index}]`));
  if (box[2] <= 0 || box[3] <= 0) fail(path, 'width and height must be greater than zero');
  return box;
}

function extentBox(value, path) {
  if (!Array.isArray(value) || value.length !== 4) fail(path, 'must be an [x0, y0, x1, y1] array');
  const extent = value.map((item, index) => requiredFinite(item, `${path}[${index}]`));
  if (extent[0] >= extent[2] || extent[1] >= extent[3]) fail(path, 'must have x0 < x1 and y0 < y1');
  return extent;
}

function uvBox(value, path) {
  if (!Array.isArray(value) || value.length !== 4) fail(path, 'must be a [u0, v0, u1, v1] array');
  const uv = value.map((item, index) => requiredFinite(item, `${path}[${index}]`));
  if (uv[0] < 0 || uv[1] < 0 || uv[2] > 1 || uv[3] > 1 || uv[0] >= uv[2] || uv[1] >= uv[3]) {
    fail(path, 'must be inside 0..1 with u0 < u1 and v0 < v1');
  }
  return uv;
}

function hitCircle(value, path) {
  if (!Array.isArray(value) || value.length !== 3) fail(path, 'must be a [x, y, radius] array');
  return [
    requiredFinite(value[0], `${path}[0]`),
    requiredFinite(value[1], `${path}[1]`),
    positiveNumber(value[2], `${path}[2]`),
  ];
}

function hexColour(value, path) {
  const colour = requiredString(value, path);
  if (!HEX_COLOUR.test(colour)) fail(path, 'must be a CSS hexadecimal colour');
  return colour;
}

function safeId(value, path, pattern) {
  const id = requiredString(value, path);
  if (!pattern.test(id)) fail(path, 'has an unsafe id');
  return id;
}

function safeRelativePath(value, path, { png = true } = {}) {
  const file = requiredString(value, path);
  if (png && !file.toLowerCase().endsWith('.png')) fail(path, 'must end with .png');
  if (file.startsWith('/') || file.startsWith('\\') || WINDOWS_ABSOLUTE.test(file) || URL_SCHEME.test(file)) {
    fail(path, 'must be a relative path');
  }
  if (file.includes('\\')) fail(path, 'must use forward slashes, not backslashes');
  if (UNSAFE_FILE_CHARS.test(file) || ENCODED_SEPARATOR.test(file)) fail(path, 'contains an unsafe character');
  const segments = file.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    fail(path, 'must not contain empty, current, or parent path segments');
  }
  return file;
}

function textureKey(value, path) {
  return safeId(value, path, TEXTURE_ID);
}

function normaliseTextures(raw, path) {
  if (raw == null) return {};
  if (!isRecord(raw)) fail(path, 'must be an object keyed by texture id');
  const textures = {};
  for (const [rawId, rawEntry] of Object.entries(raw)) {
    const id = textureKey(rawId, `${path}.${rawId}`);
    const entry = typeof rawEntry === 'string' ? { file: rawEntry } : rawEntry;
    if (!isRecord(entry)) fail(`${path}.${id}`, 'must be a PNG filename or a texture object');
    textures[id] = {
      id,
      file: safeRelativePath(entry.file, `${path}.${id}.file`),
    };
  }
  return textures;
}

function expressionFile(value, path, textures) {
  let file = null;
  let texture = null;
  if (typeof value === 'string') {
    if (/\.png$/i.test(value)) file = safeRelativePath(value, path);
    else {
      texture = textureKey(value, path);
      if (!textures[texture]) fail(path, `references unknown texture ${texture}`);
      file = textures[texture].file;
    }
  } else if (isRecord(value)) {
    if (value.file != null) file = safeRelativePath(value.file, `${path}.file`);
    const rawTexture = value.texture ?? value.tex ?? value.key;
    if (rawTexture != null) {
      texture = textureKey(rawTexture, `${path}.texture`);
      if (!textures[texture] && !file) fail(`${path}.texture`, `references unknown texture ${texture}`);
      if (!file && textures[texture]) file = textures[texture].file;
    }
    if (!file) fail(path, 'must provide a PNG file or a texture id');
  } else {
    fail(path, 'must be a PNG filename, a texture id, or an expression object');
  }
  return { file, texture };
}

function normaliseExpressions(raw, path, textures) {
  if (!isRecord(raw)) fail(path, 'must be an object keyed by expression id');
  const expressions = {};
  for (const [rawId, value] of Object.entries(raw)) {
    const id = safeId(rawId, `${path}.${rawId}`, PART_ID);
    const { file, texture } = expressionFile(value, `${path}.${id}`, textures);
    expressions[id] = { id, file, texture };
  }
  return expressions;
}

function normaliseMotions(raw, path) {
  if (raw == null) return {};
  if (!isRecord(raw)) fail(path, 'must be an object keyed by motion id');
  const motions = {};
  for (const [rawId, value] of Object.entries(raw)) {
    const id = safeId(rawId, `${path}.${rawId}`, PART_ID);
    if (isRecord(value) && value.file != null) {
      motions[id] = {
        ...cloneValue(value),
        file: safeRelativePath(value.file, `${path}.${id}.file`, { png: false }),
      };
    } else {
      motions[id] = cloneValue(value);
    }
  }
  return motions;
}

function normaliseDeformers(raw, path, drawing) {
  if (raw == null) return {};
  if (!isRecord(raw)) fail(path, 'must be an object keyed by deformer id');
  const deformers = {};
  for (const [rawId, entry] of Object.entries(raw)) {
    const id = safeId(rawId, `${path}.${rawId}`, DEFORMER_ID);
    if (!isRecord(entry)) fail(`${path}.${id}`, 'must be an object');
    const kind = entry.kind == null
      ? (entry.rect != null && entry.pivot == null ? 'warp' : 'rot')
      : requiredString(entry.kind, `${path}.${id}.kind`);
    if (kind !== 'rot' && kind !== 'warp') fail(`${path}.${id}.kind`, 'must be "rot" or "warp"');
    const parent = entry.parent == null || entry.parent === ''
      ? null
      : safeId(entry.parent, `${path}.${id}.parent`, DEFORMER_ID);
    const deformer = { ...cloneValue(entry), id, kind, parent };
    if (kind === 'rot') {
      const recommended = ZENBOT_RIG_DEFAULT_PIVOTS[id];
      deformer.pivot = entry.pivot == null
        ? (recommended ? [...recommended] : [drawing.centerX, drawing.feetY])
        : numberPair(entry.pivot, `${path}.${id}.pivot`);
    } else {
      deformer.rect = extentBox(entry.rect, `${path}.${id}.rect`);
    }
    deformers[id] = deformer;
  }

  for (const [id, deformer] of Object.entries(deformers)) {
    if (deformer.parent && !deformers[deformer.parent]) {
      fail(`${path}.${id}.parent`, `references unknown deformer ${deformer.parent}`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const walk = (id) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) fail(`${path}.${id}.parent`, 'deformer parent chain contains a cycle');
    visiting.add(id);
    const parent = deformers[id].parent;
    if (parent) walk(parent);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of Object.keys(deformers)) walk(id);
  return deformers;
}

function normaliseParts(raw, path, { textures, deformers, availableFiles, faceFile, warnings }) {
  if (!Array.isArray(raw) || raw.length === 0) fail(path, 'must be a non-empty array');
  const parts = [];
  const ids = new Set();
  const textureFiles = new Map();

  for (let index = 0; index < raw.length; index += 1) {
    const entry = raw[index];
    const itemPath = `${path}[${index}]`;
    if (!isRecord(entry)) fail(itemPath, 'must be an object');
    const id = safeId(entry.id, `${itemPath}.id`, PART_ID);
    if (ids.has(id)) fail(`${itemPath}.id`, `duplicate part id ${id}`);
    ids.add(id);

    const tex = textureKey(entry.tex ?? entry.texture ?? id, `${itemPath}.tex`);
    const rawFile = entry.file == null ? null : safeRelativePath(entry.file, `${itemPath}.file`);
    const textureFile = textures[tex]?.file ?? null;
    if (rawFile && textureFile && rawFile !== textureFile) {
      fail(`${itemPath}.file`, `does not match texture ${tex} (${textureFile})`);
    }
    let file = textureFile ?? rawFile;

    const previousFile = textureFiles.get(tex);
    if (previousFile && file && previousFile !== file) {
      fail(`${itemPath}.tex`, `texture ${tex} is used for both ${previousFile} and ${file}`);
    }
    if (file) textureFiles.set(tex, file);

    const box = rectangle(entry.box, `${itemPath}.box`);
    const gridRaw = entry.grid == null ? [6, 6] : entry.grid;
    if (!Array.isArray(gridRaw) || gridRaw.length !== 2) {
      fail(`${itemPath}.grid`, 'must be a two-integer array');
    }
    const grid = [
      positiveInteger(gridRaw[0], `${itemPath}.grid[0]`),
      positiveInteger(gridRaw[1], `${itemPath}.grid[1]`),
    ];
    if ((grid[0] + 1) * (grid[1] + 1) > 65536) {
      fail(`${itemPath}.grid`, 'produces more than 65536 vertices');
    }

    const parent = safeId(entry.parent, `${itemPath}.parent`, DEFORMER_ID);
    if (!deformers[parent]) fail(`${itemPath}.parent`, `references unknown deformer ${parent}`);

    const z = entry.z == null ? 0 : requiredFinite(entry.z, `${itemPath}.z`);
    const alpha = entry.alpha == null ? 1 : requiredFinite(entry.alpha, `${itemPath}.alpha`);
    if (alpha < 0 || alpha > 1) fail(`${itemPath}.alpha`, 'must be between zero and one');
    const blend = entry.blend == null ? null : requiredString(entry.blend, `${itemPath}.blend`);
    if (blend != null && blend !== 'multiply' && blend !== 'normal') {
      fail(`${itemPath}.blend`, 'must be "normal" or "multiply"');
    }

    if (availableFiles && file && !availableFiles.has(file)) {
      if (id === ZENBOT_RIG_REQUIRED_PART) {
        warnings.push({
          code: 'RIG_MANIFEST_MISSING_FACE_FILE',
          path: `${itemPath}.file`,
          message: `${file} is missing; the neutral expression texture will be used`,
        });
        file = null;
      } else {
        fail(`${itemPath}.file`, `asset is not available: ${file}`, ZENBOT_RIG_ERROR_CODES.MANIFEST);
      }
    }

    if (!file && id !== ZENBOT_RIG_REQUIRED_PART) {
      fail(`${itemPath}.tex`, `no PNG file is defined for texture ${tex}`);
    }

    parts.push({
      id,
      tex,
      file,
      box,
      grid,
      uvBox: entry.uvBox == null ? [0, 0, 1, 1] : uvBox(entry.uvBox, `${itemPath}.uvBox`),
      parent,
      z,
      alpha,
      blend,
      order: index,
    });
  }

  const face = parts.find((part) => part.id === ZENBOT_RIG_REQUIRED_PART);
  if (!face) fail(path, `must include the required ${ZENBOT_RIG_REQUIRED_PART} part`);
  if (!face.file) face.file = faceFile;
  if (!face.file) fail(path, 'face_base has no usable texture');
  return parts;
}

function samePair(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === 2 && b.length === 2
    && Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
}

function checkDrawing(drawing, expected, path) {
  if (!expected) return;
  if (expected.referenceCanvas && !samePair(drawing.referenceCanvas, expected.referenceCanvas)) {
    fail(`${path}.referenceCanvas`, `must be ${expected.referenceCanvas.join(' x ')}`);
  }
  for (const key of ['logoHeight', 'centerX', 'feetY']) {
    if (expected[key] != null && Math.abs(drawing[key] - expected[key]) > 1e-6) {
      fail(`${path}.${key}`, `must be ${expected[key]}`);
    }
  }
}

function checkAliases(aliases, expected, path, knownIds) {
  for (const [face, expression] of Object.entries(aliases)) {
    if (!knownIds.includes(expression)) {
      fail(`${path}.${face}`, `must name one of the 19 zenbot expressions, got ${expression}`);
    }
  }
  if (!expected) return;
  for (const [face, expression] of Object.entries(expected)) {
    if (aliases[face] !== expression) {
      fail(`${path}.${face}`, `must match the sprite manifest alias ${expression}`);
    }
  }
  for (const face of Object.keys(aliases)) {
    if (!Object.prototype.hasOwnProperty.call(expected, face)) {
      fail(`${path}.${face}`, 'is not present in the sprite manifest aliases');
    }
  }
}

/**
 * Validates and normalises `assets/characters/zenbot/rig/manifest.json`.
 *
 * The normalised result always has:
 *   textures[id] = { id, file }
 *   parts[]      = { id, tex, file, box, grid, uvBox, parent, z, alpha, blend, order }
 *   deformers[id]= { id, kind, parent, pivot | rect }
 *   expressions[id] = { id, file, texture }
 *   motions[id]  = raw value (validated id/file when present)
 *
 * Missing expression or motion coverage is recorded in `coverage` and `warnings`,
 * because the runtime can fall back to neutral / idle for those individual items.
 * Malformed geometry, missing parts or unsafe paths are fatal.
 */
export function validateZenbotRigManifest(raw, options = {}) {
  if (!isRecord(raw)) fail('manifest', 'must be an object');
  if (raw.schemaVersion !== ZENBOT_RIG_SCHEMA_VERSION) {
    throw new ZenbotRigError(
      ZENBOT_RIG_ERROR_CODES.MANIFEST,
      `manifest.schemaVersion: expected ${ZENBOT_RIG_SCHEMA_VERSION}`,
      { path: 'manifest.schemaVersion' },
    );
  }

  const availableFiles = options.availableFiles;
  if (availableFiles !== undefined && (!availableFiles || typeof availableFiles.has !== 'function')) {
    throw new ZenbotRigError(
      ZENBOT_RIG_ERROR_CODES.MANIFEST,
      'options.availableFiles: must be a Set of asset filenames',
      { path: 'options.availableFiles' },
    );
  }

  const expectedDrawing = options.expectedDrawing === undefined
    ? ZENBOT_RIG_REFERENCE
    : options.expectedDrawing;
  const expressionIds = Array.isArray(options.expressionIds) ? options.expressionIds : ZENBOT_EXPRESSION_IDS;
  const motionIds = Array.isArray(options.motionIds) ? options.motionIds : ZENBOT_MOTION_IDS;
  const warnings = [];

  const manifest = {
    schemaVersion: ZENBOT_RIG_SCHEMA_VERSION,
    id: requiredString(raw.id, 'manifest.id'),
    source: raw.source == null ? null : safeRelativePath(raw.source, 'manifest.source'),
  };
  if (raw.name != null) manifest.name = requiredString(raw.name, 'manifest.name');
  if (raw.license != null) manifest.license = requiredString(raw.license, 'manifest.license');

  const drawing = requiredRecord(raw.drawing, 'manifest.drawing');
  drawing.logoHeight = positiveNumber(raw.drawing.logoHeight, 'manifest.drawing.logoHeight');
  drawing.centerX = requiredFinite(raw.drawing.centerX, 'manifest.drawing.centerX');
  drawing.feetY = requiredFinite(raw.drawing.feetY, 'manifest.drawing.feetY');
  drawing.referenceCanvas = positivePair(raw.drawing.referenceCanvas, 'manifest.drawing.referenceCanvas');
  drawing.view = raw.drawing.view == null
    ? [0, 0, 256, 256]
    : extentBox(raw.drawing.view, 'manifest.drawing.view');
  checkDrawing(drawing, expectedDrawing, 'manifest.drawing');
  manifest.drawing = drawing;

  const rawDefaults = raw.defaults ?? {};
  if (!isRecord(rawDefaults)) fail('manifest.defaults', 'must be an object');
  const defaults = cloneValue(rawDefaults);
  defaults.bubbleAnchor = rawDefaults.bubbleAnchor == null
    ? [128, -58]
    : numberPair(rawDefaults.bubbleAnchor, 'manifest.defaults.bubbleAnchor');
  defaults.hit = rawDefaults.hit == null
    ? [128, 118, 142]
    : hitCircle(rawDefaults.hit, 'manifest.defaults.hit');
  defaults.extent = rawDefaults.extent == null
    ? [-28, -72, 284, 256]
    : extentBox(rawDefaults.extent, 'manifest.defaults.extent');
  defaults.accent = rawDefaults.accent == null
    ? '#63d8ff'
    : hexColour(rawDefaults.accent, 'manifest.defaults.accent');
  defaults.eye = rawDefaults.eye == null
    ? defaults.accent
    : hexColour(rawDefaults.eye, 'manifest.defaults.eye');
  manifest.defaults = defaults;

  const timing = requiredRecord(raw.timing ?? {}, 'manifest.timing');
  timing.expressionFadeMs = raw.timing?.expressionFadeMs == null
    ? DEFAULT_TIMING.expressionFadeMs
    : nonNegativeNumber(raw.timing.expressionFadeMs, 'manifest.timing.expressionFadeMs');
  timing.blinkCloseMs = raw.timing?.blinkCloseMs == null
    ? DEFAULT_TIMING.blinkCloseMs
    : nonNegativeNumber(raw.timing.blinkCloseMs, 'manifest.timing.blinkCloseMs');
  timing.breathSeconds = raw.timing?.breathSeconds == null
    ? DEFAULT_TIMING.breathSeconds
    : positiveNumber(raw.timing.breathSeconds, 'manifest.timing.breathSeconds');
  timing.motionTailMs = raw.timing?.motionTailMs == null
    ? DEFAULT_TIMING.motionTailMs
    : nonNegativeNumber(raw.timing.motionTailMs, 'manifest.timing.motionTailMs');
  timing.turnMs = raw.timing?.turnMs == null
    ? DEFAULT_TIMING.turnMs
    : nonNegativeNumber(raw.timing.turnMs, 'manifest.timing.turnMs');
  manifest.timing = timing;

  const textures = normaliseTextures(raw.textures, 'manifest.textures');
  manifest.textures = textures;

  let expressions = normaliseExpressions(raw.expressions ?? {}, 'manifest.expressions', textures);
  if (availableFiles) {
    for (const [id, expression] of Object.entries(expressions)) {
      if (!availableFiles.has(expression.file)) {
        warnings.push({
          code: 'RIG_MANIFEST_MISSING_EXPRESSION',
          path: `manifest.expressions.${id}`,
          message: `${expression.file} is not available`,
        });
        delete expressions[id];
      }
    }
  }
  if (!expressions.neutral) {
    throw new ZenbotRigError(
      ZENBOT_RIG_ERROR_CODES.MANIFEST,
      'manifest.expressions: a neutral expression texture is required',
      { path: 'manifest.expressions.neutral' },
    );
  }
  manifest.expressions = expressions;

  manifest.motions = normaliseMotions(raw.motions ?? {}, 'manifest.motions');
  if (raw.motionBindings != null) {
    manifest.motionBindings = requiredRecord(raw.motionBindings, 'manifest.motionBindings');
  }
  manifest.deformers = normaliseDeformers(raw.deformers ?? {}, 'manifest.deformers', drawing);
  manifest.parts = normaliseParts(raw.parts, 'manifest.parts', {
    textures,
    deformers: manifest.deformers,
    availableFiles,
    faceFile: expressions.neutral.file,
    warnings,
  });

  const aliases = {};
  if (raw.expressionAliases != null) {
    if (!isRecord(raw.expressionAliases)) fail('manifest.expressionAliases', 'must be an object');
    for (const [face, expression] of Object.entries(raw.expressionAliases)) {
      safeId(face, `manifest.expressionAliases.${face}`, PART_ID);
      aliases[face] = requiredString(expression, `manifest.expressionAliases.${face}`);
    }
  }
  checkAliases(aliases, options.expectedAliases, 'manifest.expressionAliases', ZENBOT_EXPRESSION_IDS);
  manifest.expressionAliases = aliases;

  const presentExpressions = expressionIds.filter((id) => Boolean(expressions[id]));
  const missingExpressions = expressionIds.filter((id) => !expressions[id]);
  const presentMotions = motionIds.filter((id) => Object.prototype.hasOwnProperty.call(manifest.motions, id));
  const missingMotions = motionIds.filter((id) => !Object.prototype.hasOwnProperty.call(manifest.motions, id));
  for (const id of missingExpressions) {
    warnings.push({
      code: 'RIG_MANIFEST_MISSING_EXPRESSION',
      path: `manifest.expressions.${id}`,
      message: `expression ${id} is missing; the runtime uses neutral`,
    });
  }
  for (const id of missingMotions) {
    warnings.push({
      code: 'RIG_MANIFEST_MISSING_MOTION',
      path: `manifest.motions.${id}`,
      message: `motion ${id} is missing; the runtime uses the procedural fallback`,
    });
  }
  manifest.coverage = {
    expressions: { present: presentExpressions, missing: missingExpressions },
    motions: { present: presentMotions, missing: missingMotions },
    complete: missingExpressions.length === 0 && missingMotions.length === 0,
  };
  manifest.warnings = warnings;

  if (raw.fallback != null) {
    const fallback = requiredRecord(raw.fallback, 'manifest.fallback');
    fallback.figure = fallback.figure == null
      ? 'sprite'
      : requiredString(fallback.figure, 'manifest.fallback.figure');
    if (fallback.manifest != null) {
      fallback.manifest = safeRelativePath(fallback.manifest, 'manifest.fallback.manifest', { png: false });
    }
    manifest.fallback = fallback;
  }

  return manifest;
}

/** Builds the exact model shape `kit/rig.js` expects. */
export function createZenbotRigModel(manifest) {
  return {
    view: [...manifest.drawing.view],
    deformers: Object.fromEntries(Object.entries(manifest.deformers).map(([id, deformer]) => [
      id,
      {
        kind: deformer.kind,
        parent: deformer.parent,
        ...(deformer.kind === 'rot' ? { pivot: [...deformer.pivot] } : { rect: [...deformer.rect] }),
      },
    ])),
    parts: manifest.parts.map((part) => ({
      id: part.id,
      tex: part.tex,
      box: [...part.box],
      grid: [...part.grid],
      uvBox: [...part.uvBox],
      parent: part.parent,
      z: part.z,
      alpha: part.alpha,
      ...(part.blend && part.blend !== 'normal' ? { blend: part.blend } : {}),
    })),
  };
}

export function getZenbotRigFacePart(manifest) {
  return manifest?.parts?.find((part) => part.id === ZENBOT_RIG_REQUIRED_PART) ?? null;
}

/** Follows the sprite alias list, then neutral, for an expression the rig cannot draw. */
export function chooseZenbotRigExpression(face, manifest) {
  const requested = typeof face === 'string' && face ? face : 'neutral';
  const alias = manifest?.expressionAliases?.[requested];
  const target = typeof alias === 'string' ? alias : requested;
  if (manifest?.expressions?.[target]) return target;
  return manifest?.expressions?.neutral ? 'neutral' : null;
}

export function resolveZenbotRigExpression(face, manifest) {
  const requested = typeof face === 'string' && face ? face : 'neutral';
  const alias = manifest?.expressionAliases?.[requested];
  const target = typeof alias === 'string' ? alias : requested;
  const id = chooseZenbotRigExpression(requested, manifest);
  const expression = id ? manifest.expressions[id] : null;
  return {
    requested,
    target,
    id,
    file: expression?.file ?? null,
    fallback: Boolean(id && id !== target),
  };
}

export function listZenbotRigFiles(manifest) {
  const files = new Set();
  for (const part of manifest?.parts ?? []) if (part.file) files.add(part.file);
  for (const expression of Object.values(manifest?.expressions ?? {})) {
    if (expression?.file) files.add(expression.file);
  }
  return [...files];
}
