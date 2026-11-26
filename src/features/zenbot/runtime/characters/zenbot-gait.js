const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = value => { const bounded = clamp(value, 0, 1); return bounded * bounded * (3 - 2 * bounded); };

export function sampleZenbotGait(frame = {}, phase = 0, run = false, weight = 1) {
  const stride = run ? 17 : 10;
  const lift = run ? 15 : 8;
  const feet = [0, 1].map(side => {
    const segment = frame.legs?.[side];
    const angle = phase + side * Math.PI;
    const valid = Array.isArray(segment) && segment.length === 4 && segment.every(Number.isFinite);
    return {
      dx: clamp(valid ? segment[2] - segment[0] : stride * Math.sin(angle), -stride, stride),
      lift: clamp(valid ? 241 - segment[3] : lift * Math.max(0, Math.cos(angle)), 0, lift),
    };
  });
  const supportLift = Math.min(...feet.map(foot => foot.lift));
  return feet.map(foot => ({ dx: foot.dx * weight, lift: (foot.lift - supportLift) * weight }));
}

export function installZenbotGait(model) {
  return ['leg_l', 'leg_r'].map((id, side) => {
    const definition = model.deformers[id];
    if (!definition || !model.deformers.body) return null;
    const shoe = model.parts.find(part => part.id === (side ? 'shoe_r' : 'shoe_l'));
    const leg = model.parts.find(part => part.id === id);
    const box = shoe?.box ?? leg?.box;
    if (!box) return null;
    const ankle = shoe ? box[1] : box[1] + box[3] * 0.7;
    const sole = shoe ? box[1] + box[3] * (side ? 182 / 186 : 195 / 198) : box[1] + box[3];
    const key = `${id}_contact`;
    model.deformers[key] = { kind: 'warp', parent: 'body', rect: [0, definition.pivot[1], 256, 256] };
    definition.parent = key;
    return { id, key, hip: definition.pivot[1], ankle, sole };
  });
}

export function constrainZenbotGait(rig, states, contacts, feet, weight = 1) {
  const origin = rig.point('body', states, 0, 0);
  const axisX = rig.point('body', states, 1, 0).map((value, index) => value - origin[index]);
  const axisY = rig.point('body', states, 0, 1).map((value, index) => value - origin[index]);
  const determinant = axisX[0] * axisY[1] - axisX[1] * axisY[0];
  if (Math.abs(determinant) < 1e-6) return;
  contacts.forEach((contact, side) => {
    if (!contact) return;
    const foot = feet[side];
    states[contact.id] = { a: 0, tx: 0, ty: 0, sx: 1, sy: 1 };
    states[contact.key] = { fn: (horizontal, vertical, pointX, pointY) => {
      const progression = smooth((pointY - contact.hip) / Math.max(1, contact.ankle - contact.hip));
      const desiredX = pointX + foot.dx - origin[0];
      const desiredY = pointY + (256 - contact.sole) * weight - foot.lift - origin[1];
      const localX = (desiredX * axisY[1] - desiredY * axisY[0]) / determinant;
      const localY = (axisX[0] * desiredY - axisX[1] * desiredX) / determinant;
      return [(localX - pointX) * progression, (localY - pointY) * progression];
    } };
  });
}
