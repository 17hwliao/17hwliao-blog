import {
  ZENBOT_EXPRESSION_IDS,
  resolveZenbotAsset,
  validateZenbotManifest,
} from '../characters/zenbot-manifest.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const IMAGE_CACHE_LIMIT = 10;
const RETRY_DELAY_SECONDS = 2.5;

export const ZENBOT_GESTURES = ['nod', 'shake', 'spin', 'wave', 'bow', 'shiver', 'flap'];

// The generated keyframes already carry their hearts, tears, Z's and notes.
// Keeping the kit's matching particles would draw each symbol twice.
export const ZENBOT_PARTICLES = Object.freeze({
  heart: false,
  z: false,
  tear: false,
  note: false,
});

const MODE_MOTIONS = new Set(['look', 'walk', 'run', 'sit', 'sleep', 'dizzy', 'dance']);

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

function assetUrl(baseUrl, asset) {
  return joinUrl(baseUrl, asset.file);
}

function normalizeCalibration(value = {}) {
  const x = value.x == null ? 0 : Number(value.x);
  const y = value.y == null ? 0 : Number(value.y);
  const scale = value.scale == null ? 1 : Number(value.scale);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('calibration x and y must be finite numbers');
  if (!Number.isFinite(scale) || scale <= 0) throw new Error('calibration scale must be greater than zero');
  return { x, y, scale };
}

export function chooseZenbotExpression(face, aliases = {}) {
  const name = typeof face === 'string' && face ? face : 'neutral';
  const resolved = typeof aliases[name] === 'string' ? aliases[name] : name;
  return ZENBOT_EXPRESSION_IDS.includes(resolved) ? resolved : 'neutral';
}

export function chooseZenbotMotion(frame = {}, { turn = false } = {}) {
  const gesture = frame?.gesture?.kind;
  if (ZENBOT_GESTURES.includes(gesture)) return gesture;

  const mode = typeof frame?.mode === 'string' ? frame.mode : 'idle';
  if (mode === 'wake') return 'stand';
  if (MODE_MOTIONS.has(mode)) return mode;
  if (mode === 'air') return 'jump';
  if (mode === 'crouch') {
    const jumpV = Number(frame?.jumpV);
    return Number.isFinite(jumpV) && jumpV >= 650 ? 'jump' : 'hop';
  }
  if (turn) return 'turn';
  return null;
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

function createLayer(doc, className) {
  const element = svgNode(doc, 'g', { class: className, opacity: 0, 'pointer-events': 'none' });
  const viewport = svgNode(doc, 'svg', {
    preserveAspectRatio: 'none',
    overflow: 'hidden',
  });
  const image = svgNode(doc, 'image', { preserveAspectRatio: 'none' });
  viewport.append(image);
  element.append(viewport);
  return { element, viewport, image, url: null, asset: null };
}

function createGuide(doc, manifest) {
  const [centerX, feetY] = [manifest.drawing.centerX, manifest.drawing.feetY];
  const [hitX, hitY, hitRadius] = manifest.defaults.hit;
  const [bubbleX, bubbleY] = manifest.defaults.bubbleAnchor;
  const group = svgNode(doc, 'g', {
    class: 'zenbot-calibration',
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
      y1: feetY - manifest.drawing.logoHeight - 24,
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

export async function createZenbotFigure(options = {}) {
  const {
    baseUrl = '/characters/zenbot/',
    calibration: initialCalibration = { x: 0, y: 0, scale: 1 },
    calibrate = false,
    onError = () => {},
  } = options;

  if (typeof baseUrl !== 'string' || !baseUrl.trim()) throw new Error('baseUrl must be a non-empty string');
  if (typeof document === 'undefined') throw new Error('createZenbotFigure requires a DOM document');
  if (typeof fetch !== 'function') throw new Error('createZenbotFigure requires fetch');

  const doc = document;
  let lastError = null;
  const reportError = (error) => {
    lastError = error instanceof Error ? error : new Error(String(error));
    try {
      onError(lastError);
    } catch {}
  };

  const manifestUrl = joinUrl(baseUrl, 'manifest.json');
  let rawManifest;
  try {
    const response = await fetch(manifestUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`failed to fetch ${manifestUrl}: HTTP ${response.status}`);
    rawManifest = await response.json();
  } catch (error) {
    reportError(error);
    throw error;
  }

  let manifest;
  try {
    manifest = validateZenbotManifest(rawManifest);
  } catch (error) {
    reportError(error);
    throw error;
  }

  let calibration = normalizeCalibration(initialCalibration);
  let appliedGuide = null;

  const root = svgNode(doc, 'g', { class: 'zenbot-figure', 'aria-hidden': 'true' });
  const calibrationGroup = svgNode(doc, 'g', { class: 'zenbot-calibration-root' });
  const spriteGroup = svgNode(doc, 'g', { class: 'zenbot-sprite-motion' });
  const layerA = createLayer(doc, 'zenbot-layer zenbot-layer-a');
  const layerB = createLayer(doc, 'zenbot-layer zenbot-layer-b');
  const guide = createGuide(doc, manifest);
  spriteGroup.append(layerA.element, layerB.element);
  calibrationGroup.append(spriteGroup, guide);
  root.append(calibrationGroup);

  const cache = new Map();
  const failedAt = new Map();
  let useClock = 0;
  let disposed = false;
  let displayTime = 0;
  let lastFrameTime = 0;
  let desiredUrl = '';
  let pendingUrl = '';
  let visibleUrl = '';
  let previousUrl = '';
  let transition = null;
  let currentLayer = layerA;
  let lastFacing = null;
  let turnUntil = 0;
  let heldMotion = null;
  let heldMotionUntil = 0;
  let lastSpriteTransform = '';

  const crossfadeSeconds = Math.max(1e-3, manifest.timing.crossfadeMs / 1000);
  const motionTailSeconds = manifest.timing.motionTailMs / 1000;
  const turnSeconds = manifest.timing.turnMs / 1000;

  function protectedUrls() {
    const keys = new Set([visibleUrl, previousUrl, desiredUrl, pendingUrl]);
    if (transition) {
      if (transition.fromUrl) keys.add(transition.fromUrl);
      if (transition.toUrl) keys.add(transition.toUrl);
    }
    keys.delete('');
    return keys;
  }

  function trimCache() {
    if (cache.size <= IMAGE_CACHE_LIMIT) return;
    const protectedKeys = protectedUrls();
    const candidates = [...cache.entries()]
      .filter(([url, entry]) => !protectedKeys.has(url) && entry.ready)
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    while (cache.size > IMAGE_CACHE_LIMIT && candidates.length) {
      const [url, entry] = candidates.shift();
      cache.delete(url);
      if (entry.img) entry.img.removeAttribute('src');
    }
  }

  function loadImage(asset) {
    const url = assetUrl(baseUrl, asset);
    let entry = cache.get(url);
    if (entry?.ready) {
      entry.lastUsed = ++useClock;
      return Promise.resolve(entry);
    }
    if (entry?.promise) {
      entry.lastUsed = ++useClock;
      return entry.promise;
    }
    if (failedAt.has(url)) {
      return Promise.reject(new Error(`image previously failed: ${url}`));
    }

    entry = {
      url,
      img: null,
      width: 0,
      height: 0,
      ready: false,
      lastUsed: ++useClock,
      promise: null,
    };
    cache.set(url, entry);
    entry.promise = decodeHtmlImage(doc, url).then((img) => {
      if (disposed) throw new Error('zenbot figure disposed during image load');
      entry.img = img;
      entry.width = img.naturalWidth || img.width;
      entry.height = img.naturalHeight || img.height;
      if (!(entry.width > 0 && entry.height > 0)) throw new Error(`image has no dimensions: ${url}`);
      entry.ready = true;
      failedAt.delete(url);
      trimCache();
      return entry;
    }).catch((error) => {
      cache.delete(url);
      failedAt.set(url, lastFrameTime + RETRY_DELAY_SECONDS);
      throw error;
    });
    trimCache();
    return entry.promise;
  }

  function configureLayer(layer, asset, entry) {
    const { centerX, feetY, logoHeight, referenceCanvas } = manifest.drawing;
    const logoWidth = logoHeight * (referenceCanvas[0] / referenceCanvas[1]);
    const scale = (logoWidth / entry.width) * (asset.scale ?? 1);
    const width = entry.width * scale;
    const height = entry.height * scale;
    const x = centerX - width / 2 + (asset.offsetX ?? 0);
    const y = feetY - height + (asset.offsetY ?? 0);

    setAttr(layer.viewport, 'x', x.toFixed(3));
    setAttr(layer.viewport, 'y', y.toFixed(3));
    setAttr(layer.viewport, 'width', width.toFixed(3));
    setAttr(layer.viewport, 'height', height.toFixed(3));
    setAttr(layer.viewport, 'viewBox', `0 0 ${entry.width} ${entry.height}`);
    setAttr(layer.image, 'x', 0);
    setAttr(layer.image, 'y', 0);
    setAttr(layer.image, 'width', entry.width);
    setAttr(layer.image, 'height', entry.height);
    const url = assetUrl(baseUrl, asset);
    setAttr(layer.image, 'href', url);
    layer.url = url;
    layer.asset = asset;
  }

  function settleTransition() {
    if (!transition) return;
    setAttr(transition.inLayer.element, 'opacity', 1);
    setAttr(transition.outLayer.element, 'opacity', 0);
    currentLayer = transition.inLayer;
    visibleUrl = transition.toUrl;
    previousUrl = transition.fromUrl;
    transition = null;
    trimCache();
  }

  function beginTransition(asset, entry) {
    if (disposed) return;
    settleTransition();
    const nextLayer = currentLayer === layerA ? layerB : layerA;
    configureLayer(nextLayer, asset, entry);
    setAttr(currentLayer.element, 'opacity', 1);
    setAttr(nextLayer.element, 'opacity', 0);
    transition = {
      outLayer: currentLayer,
      inLayer: nextLayer,
      fromUrl: visibleUrl,
      toUrl: assetUrl(baseUrl, asset),
      startTime: null,
    };
    pendingUrl = '';
    trimCache();
  }

  function cancelTransition() {
    if (!transition) return;
    setAttr(transition.outLayer.element, 'opacity', 1);
    setAttr(transition.inLayer.element, 'opacity', 0);
    transition = null;
    trimCache();
  }

  function syncAsset(asset) {
    const url = assetUrl(baseUrl, asset);
    desiredUrl = url;
    if (url === visibleUrl) {
      cancelTransition();
      return;
    }
    if (transition?.toUrl === url || pendingUrl === url) return;
    const cached = cache.get(url);
    if (cached?.ready) {
      beginTransition(asset, cached);
      return;
    }
    const retryAt = failedAt.get(url);
    if (retryAt != null && lastFrameTime < retryAt) return;

    pendingUrl = url;
    loadImage(asset).then((entry) => {
      if (disposed || desiredUrl !== url) return;
      pendingUrl = '';
      lastError = null;
      beginTransition(asset, entry);
    }).catch((error) => {
      if (disposed || desiredUrl !== url) return;
      pendingUrl = '';
      reportError(error);
    });
  }

  function calibratedPoint(x, y) {
    return [
      manifest.drawing.centerX + calibration.x + (x - manifest.drawing.centerX) * calibration.scale,
      manifest.drawing.feetY + calibration.y + (y - manifest.drawing.feetY) * calibration.scale,
    ];
  }

  function updateGuide() {
    const visible = !!calibrate;
    if (appliedGuide === visible) return;
    appliedGuide = visible;
    setAttr(guide, 'display', visible ? 'inline' : 'none');
  }

  function updateCalibrationTransform() {
    const { centerX, feetY } = manifest.drawing;
    setAttr(
      calibrationGroup,
      'transform',
      `translate(${calibration.x} ${calibration.y}) translate(${centerX} ${feetY}) scale(${calibration.scale}) translate(${-centerX} ${-feetY})`,
    );
  }

  function updateSpriteTransform(frame, motion) {
    const t = displayTime;
    const mode = typeof frame.mode === 'string' ? frame.mode : 'idle';
    const talk = clamp(finiteOr(Number(frame.talk), 0), 0, 1);
    const gesture = frame.gesture;
    const kind = gesture?.kind;
    const k = clamp(finiteOr(Number(gesture?.k), 0), 0, 1);

    let tx = 0;
    let ty = 0;
    let rot = 0;
    let sx = 1;
    let sy = 1;

    if (mode === 'walk') ty -= Math.abs(Math.sin(t * 10.5)) * 1.4;
    else if (mode === 'run') ty -= Math.abs(Math.sin(t * 17.5)) * 2.2;
    else if (mode === 'dance') {
      ty += Math.sin(t * 7) * 2.2;
      rot += Math.sin(t * 7) * 1.1;
    } else if (mode === 'sleep' && motion === 'sleep') {
      ty += Math.sin(t * 1.4) * 0.45;
    }

    ty += Math.sin(t * 26) * 0.8 * talk;

    if (kind === 'nod') {
      const e = Math.sin(Math.PI * k);
      sy *= 1 - 0.035 * e;
      ty += 2 * e;
    } else if (kind === 'shake') {
      tx += 1.8 * Math.sin(k * Math.PI * 6) * (1 - k);
    } else if (kind === 'spin') {
      const e = Math.sin(Math.PI * k);
      sx *= 1 - 0.12 * e;
      rot += 1.5 * Math.sin(k * Math.PI * 2);
    } else if (kind === 'wave') {
      rot += -0.9 * Math.sin(k * Math.PI * 8) * (1 - k);
      ty -= 1.2 * Math.sin(Math.PI * k);
    } else if (kind === 'shiver') {
      tx += Math.sin(t * 52) * 1.1 * (1 - k * 0.5);
      rot += Math.sin(t * 43) * 0.35;
    } else if (kind === 'flap') {
      const e = Math.sin(Math.PI * k);
      ty -= 3 * e;
      sy *= 1 + 0.02 * e;
    }

    const { centerX, feetY } = manifest.drawing;
    const transform = `translate(${centerX} ${feetY}) translate(${tx.toFixed(3)} ${ty.toFixed(3)}) rotate(${rot.toFixed(3)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-centerX} ${-feetY})`;
    if (transform !== lastSpriteTransform) {
      setAttr(spriteGroup, 'transform', transform);
      lastSpriteTransform = transform;
    }
  }

  function updateTransition() {
    if (!transition) return;
    if (transition.startTime == null) transition.startTime = displayTime;
    const progress = clamp((displayTime - transition.startTime) / crossfadeSeconds, 0, 1);
    setAttr(transition.outLayer.element, 'opacity', (1 - progress).toFixed(4));
    setAttr(transition.inLayer.element, 'opacity', progress.toFixed(4));
    if (progress >= 1) settleTransition();
  }

  const defaultExpression = manifest.expressions[manifest.defaultExpression] ?? manifest.expressions.neutral;
  let defaultEntry;
  try {
    defaultEntry = await loadImage(defaultExpression);
  } catch (error) {
    reportError(error);
    throw error;
  }

  configureLayer(currentLayer, defaultExpression, defaultEntry);
  setAttr(currentLayer.element, 'opacity', 1);
  setAttr((currentLayer === layerA ? layerB : layerA).element, 'opacity', 0);
  visibleUrl = assetUrl(baseUrl, defaultExpression);
  desiredUrl = visibleUrl;
  updateCalibrationTransform();
  updateGuide();
  trimCache();

  for (const key of manifest.timing.preload) {
    const [kind, id] = key.split(':');
    const asset = resolveZenbotAsset(manifest, kind, id);
    if (!asset) continue;
    loadImage(asset).catch((error) => {
      if (!disposed) reportError(error);
    });
  }

  function draw(petG, face, frame = {}) {
    if (disposed) return;
    if (!petG) throw new Error('draw requires a parent SVG group');
    if (root.parentNode !== petG) petG.append(root);

    const t = Number.isFinite(Number(frame.t)) ? Number(frame.t) : displayTime;
    const previousTime = lastFrameTime;
    lastFrameTime = t;
    displayTime = Math.max(displayTime, t);
    const dt = clamp(lastFrameTime - previousTime, 0, 0.05);

    updateCalibrationTransform();
    updateGuide();

    if (Number.isFinite(Number(frame.facing))) {
      const facing = Number(frame.facing);
      if (lastFacing != null && facing !== lastFacing) turnUntil = displayTime + turnSeconds;
      lastFacing = facing;
    }

    const faceName = typeof frame.face === 'string'
      ? frame.face
      : typeof face === 'string'
        ? face
        : 'neutral';
    let motion = chooseZenbotMotion(frame, { turn: displayTime < turnUntil });
    if (motion && !manifest.motions[motion]) motion = null;
    if (motion) {
      heldMotion = motion;
      heldMotionUntil = displayTime + motionTailSeconds;
    } else if (heldMotion && displayTime >= heldMotionUntil) {
      heldMotion = null;
    }
    const activeMotion = motion ?? heldMotion;

    updateSpriteTransform({ ...frame, t, dt }, activeMotion);
    updateTransition();

    if (activeMotion) {
      syncAsset(manifest.motions[activeMotion]);
      return;
    }

    const expressionId = chooseZenbotExpression(faceName, manifest.expressionAliases);
    const asset = manifest.expressions[expressionId]
      ?? manifest.expressions[manifest.defaultExpression]
      ?? manifest.expressions.neutral;
    if (asset) syncAsset(asset);
  }

  function groupTilt(mode, tilt, lean) {
    if (mode === 'run') return tilt + lean * 0.35;
    if (mode === 'walk') return tilt + lean * 0.5;
    if (mode === 'dance') return tilt * 0.75;
    return tilt + lean;
  }

  function setSkin() {
    return false;
  }

  function preloadWord(word) {
    const name = typeof word === 'string' ? word : '';
    let asset = manifest.motions[name];
    if (!asset && (manifest.expressions[name] || manifest.expressionAliases[name])) {
      asset = manifest.expressions[chooseZenbotExpression(name, manifest.expressionAliases)];
    }
    if (!asset) return Promise.reject(new Error(`unknown zenbot preview word: ${name || '(empty)'}`));
    return loadImage(asset).catch((error) => {
      reportError(error);
      throw error;
    });
  }

  function setCalibration(next = {}) {
    calibration = normalizeCalibration({
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
    transition = null;
    desiredUrl = '';
    pendingUrl = '';
    visibleUrl = '';
    previousUrl = '';
    for (const entry of cache.values()) entry.img?.removeAttribute('src');
    cache.clear();
    failedAt.clear();
    lastError = null;
    lastSpriteTransform = '';
    layerA.image.removeAttribute('href');
    layerB.image.removeAttribute('href');
    layerA.element.replaceChildren();
    layerB.element.replaceChildren();
    root.replaceChildren();
    root.remove();
  }

  const accent = manifest.defaults.accent;
  return {
    draw,
    groupTilt,
    setSkin,
    get skin() { return manifest.id; },
    get anchors() { return { bubble: calibratedPoint(...manifest.defaults.bubbleAnchor) }; },
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
    get particles() { return { ...ZENBOT_PARTICLES }; },
    get accent() { return accent; },
    get skinMeta() {
      return {
        id: manifest.id,
        label: manifest.name,
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
    get words() {
      return [
        ...Object.keys(manifest.expressions),
        ...Object.keys(manifest.motions),
      ];
    },
    preloadWord,
    setCalibration,
    dispose,
    /** @internal exposed for diagnostics only */
    get manifest() { return copyJson(manifest); },
  };
}
