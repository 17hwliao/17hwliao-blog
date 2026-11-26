export const ZENBOT_MANIFEST_SCHEMA_VERSION = 1;

export const ZENBOT_EXPRESSION_IDS = [
  'neutral',
  'happy',
  'wink',
  'love',
  'shy',
  'surprised',
  'angry',
  'sad',
  'sleepy',
  'thinking',
  'smug',
  'pout',
  'worried',
  'determined',
  'flustered',
  'scared',
  'excited',
  'cry',
  'confused',
];

export const ZENBOT_MOTION_IDS = [
  'stand',
  'jump',
  'hop',
  'look',
  'turn',
  'nod',
  'shake',
  'spin',
  'sit',
  'sleep',
  'dizzy',
  'walk',
  'run',
  'wave',
  'bow',
  'shiver',
  'flap',
  'dance',
];

const HEX_COLOUR = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const WINDOWS_ABSOLUTE = /^[a-z]:/i;
const URL_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const UNSAFE_FILE_CHARS = /[\u0000-\u001f<>:"|?*#]/;
const ENCODED_SEPARATOR = /%(?:2e|2f|5c)/i;

function fail(path, message, Type = TypeError) {
  throw new Type(`${path}: ${message}`);
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

function requiredNumber(value, path) {
  if (!Number.isFinite(value)) fail(path, 'must be a finite number');
  return value;
}

function positiveNumber(value, path) {
  const number = requiredNumber(value, path);
  if (number <= 0) fail(path, 'must be greater than zero');
  return number;
}

function nonNegativeNumber(value, path) {
  const number = requiredNumber(value, path);
  if (number < 0) fail(path, 'must not be negative');
  return number;
}

function optionalNumber(value, path, fallback) {
  if (value == null) return fallback;
  return requiredNumber(value, path);
}

function numberPair(value, path) {
  if (!Array.isArray(value) || value.length !== 2) fail(path, 'must be a two-number array');
  return [
    requiredNumber(value[0], `${path}[0]`),
    requiredNumber(value[1], `${path}[1]`),
  ];
}

function positivePair(value, path) {
  const pair = numberPair(value, path);
  if (pair[0] <= 0 || pair[1] <= 0) fail(path, 'dimensions must be greater than zero');
  return pair;
}

function hitCircle(value, path) {
  if (!Array.isArray(value) || value.length !== 3) fail(path, 'must be a [x, y, radius] array');
  return [
    requiredNumber(value[0], `${path}[0]`),
    requiredNumber(value[1], `${path}[1]`),
    positiveNumber(value[2], `${path}[2]`),
  ];
}

function extentBox(value, path) {
  if (!Array.isArray(value) || value.length !== 4) fail(path, 'must be an [x0, y0, x1, y1] array');
  const extent = value.map((item, index) => requiredNumber(item, `${path}[${index}]`));
  if (extent[0] >= extent[2] || extent[1] >= extent[3]) fail(path, 'must have x0 < x1 and y0 < y1');
  return extent;
}

function hexColour(value, path) {
  const colour = requiredString(value, path);
  if (!HEX_COLOUR.test(colour)) fail(path, 'must be a CSS hexadecimal colour');
  return colour;
}

function assetFile(value, path) {
  const file = requiredString(value, path);
  if (!file.toLowerCase().endsWith('.png')) fail(path, 'must end with .png');
  if (file.split('/').at(-1).length <= 4) fail(path, 'must include a PNG filename');
  if (file.startsWith('/') || file.startsWith('\\') || WINDOWS_ABSOLUTE.test(file) || URL_SCHEME.test(file)) {
    fail(path, 'must be a relative asset path');
  }
  if (file.includes('\\')) fail(path, 'must use forward slashes, not backslashes');
  if (UNSAFE_FILE_CHARS.test(file) || ENCODED_SEPARATOR.test(file)) fail(path, 'contains an unsafe character');
  const segments = file.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    fail(path, 'must not contain empty, current, or parent path segments');
  }
  return file;
}

function normalizeAsset(value, path) {
  const raw = typeof value === 'string' ? { file: value } : value;
  if (!isRecord(raw)) fail(path, 'must be a PNG filename or an asset object');
  const asset = cloneValue(raw);
  asset.file = assetFile(raw.file, `${path}.file`);
  asset.scale = raw.scale == null ? 1 : positiveNumber(raw.scale, `${path}.scale`);
  asset.offsetX = optionalNumber(raw.offsetX, `${path}.offsetX`, 0);
  asset.offsetY = optionalNumber(raw.offsetY, `${path}.offsetY`, 0);
  if (raw.seconds != null) asset.seconds = positiveNumber(raw.seconds, `${path}.seconds`);
  if (raw.lasting != null) asset.lasting = Boolean(raw.lasting);
  return asset;
}

function normalizeAssetMap(value, path) {
  if (!isRecord(value)) fail(path, 'must be an object keyed by expression or motion id');
  const map = {};
  for (const [id, asset] of Object.entries(value)) {
    if (!/^[a-z][a-z0-9-]*$/i.test(id)) fail(`${path}.${id}`, 'has an unsafe id');
    map[id] = normalizeAsset(asset, `${path}.${id}`);
  }
  return map;
}

function availableFileSet(value) {
  if (value === undefined) return null;
  if (!value || typeof value.has !== 'function') {
    fail('options.availableFiles', 'must be a Set of asset filenames');
  }
  return value;
}

function filterAvailable(map, files) {
  if (!files) return map;
  const out = {};
  for (const [id, asset] of Object.entries(map)) {
    if (files.has(asset.file)) out[id] = asset;
  }
  return out;
}

export function validateZenbotManifest(raw, { availableFiles } = {}) {
  if (!isRecord(raw)) fail('manifest', 'must be an object');
  if (raw.schemaVersion !== ZENBOT_MANIFEST_SCHEMA_VERSION) {
    throw new Error(`manifest.schemaVersion: expected ${ZENBOT_MANIFEST_SCHEMA_VERSION}`);
  }

  const manifest = cloneValue(raw);
  manifest.id = requiredString(raw.id, 'manifest.id');
  manifest.name = requiredString(raw.name, 'manifest.name');
  manifest.license = requiredString(raw.license, 'manifest.license');

  const drawing = requiredRecord(raw.drawing, 'manifest.drawing');
  drawing.logoHeight = positiveNumber(raw.drawing.logoHeight, 'manifest.drawing.logoHeight');
  drawing.centerX = requiredNumber(raw.drawing.centerX, 'manifest.drawing.centerX');
  drawing.feetY = requiredNumber(raw.drawing.feetY, 'manifest.drawing.feetY');
  drawing.referenceCanvas = positivePair(raw.drawing.referenceCanvas, 'manifest.drawing.referenceCanvas');
  manifest.drawing = drawing;

  const defaults = requiredRecord(raw.defaults, 'manifest.defaults');
  defaults.bubbleAnchor = numberPair(raw.defaults.bubbleAnchor, 'manifest.defaults.bubbleAnchor');
  defaults.hit = hitCircle(raw.defaults.hit, 'manifest.defaults.hit');
  defaults.extent = extentBox(raw.defaults.extent, 'manifest.defaults.extent');
  defaults.accent = hexColour(raw.defaults.accent, 'manifest.defaults.accent');
  if (raw.defaults.eye != null) defaults.eye = hexColour(raw.defaults.eye, 'manifest.defaults.eye');
  manifest.defaults = defaults;

  const timing = requiredRecord(raw.timing ?? {}, 'manifest.timing');
  timing.crossfadeMs = raw.timing?.crossfadeMs == null
    ? 140
    : nonNegativeNumber(raw.timing.crossfadeMs, 'manifest.timing.crossfadeMs');
  timing.motionTailMs = raw.timing?.motionTailMs == null
    ? 140
    : nonNegativeNumber(raw.timing.motionTailMs, 'manifest.timing.motionTailMs');
  timing.turnMs = raw.timing?.turnMs == null
    ? 420
    : nonNegativeNumber(raw.timing.turnMs, 'manifest.timing.turnMs');
  timing.expressionSeconds = raw.timing?.expressionSeconds == null
    ? 0.9
    : positiveNumber(raw.timing.expressionSeconds, 'manifest.timing.expressionSeconds');
  if (raw.timing?.preload != null && !Array.isArray(raw.timing.preload)) {
    fail('manifest.timing.preload', 'must be an array');
  }
  timing.preload = Array.isArray(raw.timing?.preload)
    ? raw.timing.preload.map((key, index) => requiredString(key, `manifest.timing.preload[${index}]`))
    : [];
  manifest.timing = timing;

  const files = availableFileSet(availableFiles);
  manifest.expressions = filterAvailable(normalizeAssetMap(raw.expressions, 'manifest.expressions'), files);
  manifest.motions = filterAvailable(normalizeAssetMap(raw.motions, 'manifest.motions'), files);

  if (!manifest.expressions.neutral) {
    throw new Error('zenbot manifest has no available neutral expression');
  }
  if (!manifest.motions.stand) {
    throw new Error('zenbot manifest has no available stand motion');
  }

  manifest.defaultExpression = requiredString(
    raw.defaultExpression ?? 'neutral',
    'manifest.defaultExpression',
  );
  if (!manifest.expressions[manifest.defaultExpression]) {
    manifest.defaultExpression = 'neutral';
  }
  manifest.defaultMotion = requiredString(raw.defaultMotion ?? 'stand', 'manifest.defaultMotion');
  if (!manifest.motions[manifest.defaultMotion]) {
    manifest.defaultMotion = 'stand';
  }

  const aliases = {};
  if (raw.expressionAliases != null) {
    if (!isRecord(raw.expressionAliases)) fail('manifest.expressionAliases', 'must be an object');
    for (const [face, expression] of Object.entries(raw.expressionAliases)) {
      if (!/^[a-z][a-z0-9-]*$/i.test(face)) fail(`manifest.expressionAliases.${face}`, 'has an unsafe id');
      if (typeof expression !== 'string' || !expression.trim()) {
        fail(`manifest.expressionAliases.${face}`, 'must name an expression');
      }
      if (manifest.expressions[expression]) aliases[face] = expression;
    }
  }
  manifest.expressionAliases = aliases;

  manifest.timing.preload = manifest.timing.preload.filter((key) => {
    const [kind, id] = key.split(':');
    if (!id) return false;
    if (kind === 'expression') return Boolean(manifest.expressions[id]);
    if (kind === 'motion') return Boolean(manifest.motions[id]);
    return false;
  });

  return manifest;
}

export function listZenbotAssets(manifest) {
  const files = [];
  const seen = new Set();
  const groups = [manifest?.expressions, manifest?.motions];
  for (const group of groups) {
    for (const asset of Object.values(group ?? {})) {
      if (!asset || typeof asset.file !== 'string' || seen.has(asset.file)) continue;
      seen.add(asset.file);
      files.push(asset.file);
    }
  }
  return files;
}

export function resolveZenbotAsset(manifest, kind, id) {
  const group = kind === 'expression' ? manifest?.expressions : manifest?.motions;
  const asset = group?.[id];
  return asset ? cloneValue(asset) : null;
}
