const rad = Math.PI / 180;
export const rotate = (x, y, degrees) => ({ x, y, radians: degrees * rad });
/** Geometry shared by browser and desktop. Arms use shoulder -> elbow -> wrist inheritance. */
export function layerPose(id, p) {
  const body = rotate(510, 850, p.ParamBodyAngleZ * .72);
  const head = rotate(510, 320, p.ParamAngleZ * .75);
  const result = { rotations: [body], x: p.ParamZenixWeight * 8, y: (p.ParamBreath - .5) * -3 + p.ParamZenixKnee * 13, alpha: 1 };
  if (['HairBack','HairFront','FaceBase','ClipZ'].includes(id) || /^(EyeWhite|Iris|Lash|ClosedEye|Brow|Mouth|Blush)/.test(id)) {
    result.rotations.push(head); result.x += p.ParamAngleX * .4; result.y -= p.ParamAngleY * .32;
  }
  if (id === 'Tail') result.rotations.push(rotate(360, 1040, p.ParamZenixTail * 17));
  if (id === 'HairBack') result.rotations.push(rotate(510, 75, p.ParamZenixHairSide * 3));
  if (id === 'HairFront') result.rotations.push(rotate(510, 80, p.ParamZenixHairFront * 2));
  if (/^Ear[RL]$/.test(id)) {
    const side = id.at(-1); result.rotations.push(head, rotate(side==='R'?420:600,100,p['ParamZenixEar'+side]*(side==='R'?-12:12)));
    result.x += p.ParamAngleX*.4; result.y -= p.ParamAngleY*.32;
  }
  if (/^(UpperArm|Forearm|Hand)[RL]$/.test(id)) {
    const side=id.at(-1), right=side==='R', direction=right?1:-1;
    result.rotations.push(rotate(right?319:699,500,p['ParamZenixArm'+side]*75*direction));
    if (!id.startsWith('UpperArm')) result.rotations.push(rotate(right?254:763,635,p['ParamZenixForearm'+side]*96*direction));
    if (id.startsWith('Hand')) result.rotations.push(rotate(right?193:822,right?758:764,p['ParamZenixWrist'+side]*26*direction));
    result.y -= p.ParamZenixShoulder*4;
  }
  if(/^Arm[RL]$/.test(id))result.y-=p.ParamZenixShoulder*4;
  if (id.startsWith('Brow')) {
    const side=id.at(-1); result.y -= p['ParamBrow'+side+'Y']*7;
    result.rotations.push(rotate(side==='R'?458:554,167,p['ParamBrow'+side+'Angle']*12));
  }
  if(id.startsWith('Blush')) result.alpha=p.ParamZenixBlush*.8;
  return result;
}

export function mouthWeights(p, expression) {
  const open=Math.min(1, Math.max(0,p.ParamMouthOpenY));
  const surprised=['surprised','startled'].includes(expression);
  const pout=p.ParamMouthForm<-.35;
  const t=Math.min(1,Math.max(0,(open-.025)/.1)),opening=t*t*(3-2*t);
  return {Mouth:pout?0:1-opening,MouthOpen:surprised?0:opening,MouthO:surprised?opening:0,MouthPout:pout?1-opening:0};
}

/** Silent visual syllables with real closed-mouth intervals, rather than a permanently half-open grin. */
export function speechOpening(time){
  const syllable=Math.max(0,Math.sin(time*11.8)+.18*Math.sin(time*21.1));
  return Math.min(.92,Math.pow(syllable,.75)*.88);
}
