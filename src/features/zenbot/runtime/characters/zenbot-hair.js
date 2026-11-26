export function installZenbotHair(model) {
  const definition = model.deformers.hair_back;
  const head = model.deformers.head;
  if (!definition || definition.kind !== 'rot' || !head?.pivot) return null;
  const anchorY = head.pivot[1];
  const binding = { pivot: [...definition.pivot], anchorY, freeY: anchorY + 64 };
  model.deformers.hair_back = { ...definition, kind: 'warp', rect: [-28, anchorY, 284, binding.freeY] };
  return binding;
}

export function anchorZenbotHair(states, binding) {
  const sway = states.hair_back;
  if (!binding || !sway || sway.fn) return;
  const radians = (sway.a || 0) * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const [pivotX, pivotY] = binding.pivot;
  states.hair_back = { fn: (horizontal, vertical, pointX, pointY) => {
    const progress = Math.max(0, Math.min(1, (pointY - binding.anchorY) / (binding.freeY - binding.anchorY)));
    const weight = progress * progress * (3 - 2 * progress);
    const localX = (pointX - pivotX) * (sway.sx ?? 1);
    const localY = (pointY - pivotY) * (sway.sy ?? 1);
    const rotatedX = pivotX + (sway.tx || 0) + localX * cosine - localY * sine;
    const rotatedY = pivotY + (sway.ty || 0) + localX * sine + localY * cosine;
    return [(rotatedX - pointX) * weight, (rotatedY - pointY) * weight];
  } };
}
