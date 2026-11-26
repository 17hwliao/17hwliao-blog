const BLINK_FACES = new Set(['neutral', 'thinking', 'determined', 'worried', 'shy', 'sad', 'pout', 'smug', 'confused']);
const TALK_FACES = new Set([...BLINK_FACES, 'happy', 'excited']);

function createPatch(document, image, shapes) {
  const patch = document.createElement('canvas');
  const mask = document.createElement('canvas');
  patch.width = mask.width = 449;
  patch.height = mask.height = 613;
  const paint = patch.getContext('2d');
  const alpha = mask.getContext('2d');
  paint.drawImage(image, 0, 0, 449, 613);
  alpha.filter = 'blur(5px)';
  alpha.fillStyle = '#fff';
  for (const [centerX, centerY, radiusX, radiusY] of shapes) {
    alpha.beginPath();
    alpha.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    alpha.fill();
  }
  paint.globalCompositeOperation = 'destination-in';
  paint.drawImage(mask, 0, 0);
  return patch;
}

export function createZenbotFaceAnimator(document, closedFace) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext?.('2d');
  if (typeof context?.drawImage !== 'function') return null;
  const eyes = createPatch(document, closedFace, [[160, 487, 85, 82], [361, 487, 65, 82]]);
  const mouthPatch = createPatch(document, closedFace, [[270, 556, 33, 28]]);
  let previousKey = null;
  return {
    render(source, options) {
      const width = source.naturalWidth || source.width;
      const height = source.naturalHeight || source.height;
      const blink = BLINK_FACES.has(options.face) ? Math.max(0, Math.min(1, options.blink || 0)) : 0;
      const talk = TALK_FACES.has(options.face) ? Math.max(0, Math.min(1, options.talk || 0)) : 0;
      const mouth = talk * (0.2 + 0.8 * Math.abs(Math.sin(options.time * 17)));
      const key = `${options.face}:${Math.round(blink * 16)}:${Math.round(mouth * 12)}`;
      if (key === previousKey) return null;
      previousKey = key;
      canvas.width = width;
      canvas.height = height;
      context.drawImage(source, 0, 0, width, height);
      if (!blink && !talk) return source;
      const scaleX = width / 449;
      const scaleY = height / 613;
      context.save();
      context.scale(scaleX, scaleY);
      context.globalCompositeOperation = 'source-atop';
      if (blink > 0) {
        context.globalAlpha = blink;
        context.drawImage(eyes, 0, 0);
      }
      if (talk > 0) {
        context.globalAlpha = mouth;
        context.drawImage(mouthPatch, 0, 0);
      }
      context.restore();
      return canvas;
    },
  };
}
