import { CharacterState } from '../tsuyukusa-021/runtime/character-state.mjs';
import { pageContext, welcomeText } from '../unitychan/runtime/page-context.mjs';

const skin = new URLSearchParams(location.search).get('skin') === 'amber' ? 'amber' : 'silver';
const files = skin === 'silver'
  ? { idle: 'idle', blink: 'blink', shy: 'shy', listen: 'listen', closed: 'closed', wave: 'idle' }
  : { idle: 'idle', shy: 'shy', listen: 'listen', wave: 'wave' };
const actions = [
  { id: 'wave', duration: 1.65 },
  { id: 'nod', duration: .85 },
  { id: 'shy', duration: 1.45 },
];
const state = new CharacterState({
  actions,
  agentNativeActions: { hello: 'wave', wave: 'wave', doubleWave: 'wave', happyNod: 'nod', shyPeek: 'shy' },
});
const preference = matchMedia('(prefers-reduced-motion: reduce)');
state.setReduced(preference.matches);
const figure = document.querySelector('#figure');
const pose = document.querySelector('#pose');
const bubble = document.querySelector('#bubble');
const images = new Map();
let page = null, queued = null, drag = null, skipClick = false, touches = 0, serial = 0;
let gesture = null, face = null;

async function load(name, file) {
  const img = new Image();
  img.alt = '';
  img.draggable = false;
  img.hidden = true;
  img.src = './' + skin + '/' + file + '.webp';
  await img.decode();
  pose.append(img);
  images.set(name, img);
}
const idle = load('idle', files.idle);
const preload = Promise.allSettled(Object.entries(files).filter(([name]) => name !== 'idle').map(([name, file]) => load(name, file)));

function look(x, y) {
  figure.style.setProperty('--look', Math.max(-.8, Math.min(.8, x)) * 3 + 'deg');
  figure.style.setProperty('--rise', Math.max(-.8, Math.min(.8, y)) * 2 + 'px');
}
function move(x, y) {
  figure.style.setProperty('--x', x + 'px');
  figure.style.setProperty('--y', y + 'px');
}
function animate(name, id = 0) {
  if (pose.dataset.motion === name && serial === id) return;
  if (pose.dataset.motion === name) { delete pose.dataset.motion; void pose.offsetWidth; }
  pose.dataset.motion = name;
  serial = id;
}
function show() {
  if (queued) {
    if (state.now - queued.time > 12) queued = null;
    else if (state.ambient(queued.action, queued.text)) queued = null;
  }
  const frame = state.frame();
  const local = gesture && frame.now < gesture.until ? gesture : null;
  let next = 'idle', motion = '', id = frame.native?.sequence ?? local?.id ?? 0;
  if (frame.dragging) {
    next = 'shy'; motion = 'wiggle';
  } else if (local?.action === 'settle') {
    next = 'shy'; motion = 'settle';
  } else if (frame.expression || frame.native?.id === 'shy' || local?.action === 'shy') {
    next = 'shy'; motion = 'nod';
  } else if (frame.native?.id === 'wave' || local?.action === 'wave') {
    next = 'wave'; motion = 'welcome';
  } else if (frame.logicalPhase === 'thinking') {
    next = 'listen';
  } else if (frame.bubble?.tone === 'answer') {
    next = frame.speech > .28 || frame.reduced ? 'listen' : 'closed';
    if (!images.has(next)) next = 'listen';
  } else if (frame.native?.id === 'nod' || local?.action === 'nod') {
    motion = 'nod';
  } else if (frame.blink < .7) {
    next = 'blink';
  }
  next = images.has(next) ? next : 'idle';
  if (face !== next) {
    if (face) images.get(face).hidden = true;
    images.get(next).hidden = false;
    face = next;
  }
  animate(motion, id);
  const text = frame.bubble?.text;
  bubble.hidden = !text;
  if (text && bubble.textContent !== text) bubble.textContent = text;
}
function play(action, duration) {
  gesture = { action, until: state.now + duration, id: ++touches };
}

figure.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || drag) return;
  skipClick = false;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  figure.setPointerCapture(event.pointerId);
});
figure.addEventListener('pointermove', event => {
  if (drag?.id !== event.pointerId) {
    look((event.clientX - innerWidth / 2) / innerWidth, (event.clientY - innerHeight / 2) / innerHeight);
    return;
  }
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) > 7) {
    drag.moved = true;
    queued = null;
    gesture = null;
    state.drag(true);
    figure.dataset.dragging = '';
  }
  if (drag.moved) {
    const limit = Math.max(0, (innerWidth - figure.offsetWidth) / 2 - 3);
    move(Math.min(limit, Math.max(-limit, dx * .6)), Math.min(8, Math.max(-32, dy * .6)));
    look(Math.max(-.8, Math.min(.8, dx / 35)), 0);
  }
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  figure.addEventListener(type, event => {
    if (drag?.id !== event.pointerId) return;
    const wasMoved = drag.moved;
    drag = null;
    if (!wasMoved) return;
    skipClick = true;
    delete figure.dataset.dragging;
    state.drag(false);
    play('settle', .65);
    move(0, 0);
    look(0, 0);
  });
}
figure.addEventListener('pointerleave', () => { if (!drag) look(0, 0); });
figure.addEventListener('click', event => {
  if (event.detail && skipClick) { skipClick = false; return; }
  if (state.phase === 'thinking' || state.phase === 'presenting') return;
  queued = null;
  state.touch();
  const action = ['wave', 'shy', 'nod'][touches % 3];
  play(action, 1.35);
  state.show({ wave: '你好呀！', shy: '被你发现了。', nod: '我在这里。' }[action], 'warm', 2.2);
});

await idle;
show();
preference.addEventListener('change', () => state.setReduced(preference.matches));
window.addEventListener('message', event => {
  if (event.source !== parent || event.origin !== location.origin) return;
  const data = event.data;
  if (data?.type === 'zenix.agent.event') {
    if (state.receive(data.event) && ['begin', 'clear'].includes(data.event.type)) gesture = null;
  } else if (data?.type === 'zenix.companion.pointer' && !drag) {
    if (Number.isFinite(data.x) && Number.isFinite(data.y)) look(data.x, data.y);
  } else if (data?.type === 'zenix.companion.context') {
    const context = pageContext(data.path);
    if (!context || (page === context.path && data.replay !== true)) return;
    page = context.path;
    const greet = data.greet === true;
    queued = { action: greet || context.action === 'm-3' ? 'wave' : 'nod', text: greet ? welcomeText : context.text, time: state.now };
    if (greet && state.reduced && !state.userBusy) play('wave', 1.65);
  }
});
let timer;
function tick() {
  clearInterval(timer);
  if (!document.hidden) { show(); timer = setInterval(show, 64); }
}
document.addEventListener('visibilitychange', tick);
window.addEventListener('pagehide', () => clearInterval(timer));
window.addEventListener('pageshow', tick);
tick();
parent.postMessage({ type: 'zenix.character.ready', modelId: 'xingyin-' + skin }, location.origin);
void preload;
