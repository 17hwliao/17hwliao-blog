export const xingyinCapabilities = Object.freeze({
  version: 1,
  motions: ['hello', 'wave', 'happyNod', 'shyPeek', 'fidget', 'lookAround'],
  expressions: ['neutral', 'happy', 'focused', 'thinking', 'shy'],
});

// Costume sheets contain idle, shy, greeting and listening in reading order.
const atlasFrames = Object.freeze({ idle: [0, 0], shy: [1, 0], wave: [0, 1], listen: [1, 1] });

export const xingyinSkins = {
  silver: {
    title: '星音 · 银蓝',
    files: { idle: 'idle', blink: 'blink', shy: 'shy', listen: 'listen', closed: 'closed', wave: 'idle' },
  },
  amber: {
    title: '星音 · 暖橙书卷',
    files: { idle: 'idle', shy: 'shy', listen: 'listen', wave: 'wave' },
  },
  'ivory-dragon': { title: '星音 · 银龙礼服', atlas: 'ivory-dragon.png', frames: atlasFrames },
  'violet-stars': { title: '星音 · 紫星猫娘', atlas: 'violet-stars.png', frames: atlasFrames },
  'noir-gold': { title: '星音 · 黑金礼裙', atlas: 'noir-gold.png', frames: atlasFrames },
  'moon-piano': { title: '星音 · 月光琴音', atlas: 'moon-piano.png', frames: atlasFrames },
  'ink-fox': { title: '星音 · 墨色狐耳', atlas: 'ink-fox.png', frames: atlasFrames },
  'azure-fan': { title: '星音 · 青蓝折扇', atlas: 'azure-fan.png', frames: atlasFrames },
  'ocean-maid': { title: '星音 · 海蓝女仆', atlas: 'ocean-maid.png', frames: atlasFrames },
};

export function resolveSkin(value) {
  return typeof value === 'string' && Object.hasOwn(xingyinSkins, value) ? value : 'silver';
}
