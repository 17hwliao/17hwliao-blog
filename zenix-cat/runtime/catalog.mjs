// This contract is owned by this character. Custom IDs must be bound in Cubism.
// Values do not imply that the corresponding ArtMeshes have already been made.
const p = (min, max, initial, label, standard = false) => ({ min, max, initial, label, standard });
export const PARAMETERS = Object.freeze({
  ParamAngleX: p(-30, 30, 0, '头部左右', true),
  ParamAngleY: p(-30, 30, 0, '头部上下', true),
  ParamAngleZ: p(-30, 30, 0, '头部侧倾', true),
  ParamBodyAngleX: p(-10, 10, 0, '身体左右', true),
  ParamBodyAngleY: p(-10, 10, 0, '身体前后', true),
  ParamBodyAngleZ: p(-10, 10, 0, '身体侧倾', true),
  ParamEyeLOpen: p(0, 1, 1, '左眼开合', true),
  ParamEyeROpen: p(0, 1, 1, '右眼开合', true),
  ParamEyeLSmile: p(0, 1, 0, '左笑眼', true),
  ParamEyeRSmile: p(0, 1, 0, '右笑眼', true),
  ParamEyeBallX: p(-1, 1, 0, '视线左右', true),
  ParamEyeBallY: p(-1, 1, 0, '视线上下', true),
  ParamBrowLY: p(-1, 1, 0, '左眉高低', true),
  ParamBrowRY: p(-1, 1, 0, '右眉高低', true),
  ParamBrowLAngle: p(-1, 1, 0, '左眉角度', true),
  ParamBrowRAngle: p(-1, 1, 0, '右眉角度', true),
  ParamMouthOpenY: p(0, 1, 0, '嘴部开合', true),
  ParamMouthForm: p(-1, 1, 0.15, '嘴形', true),
  ParamBreath: p(0, 1, 0.5, '呼吸', true),
  ParamZenixBlush: p(0, 1, 0, '脸红'),
  ParamZenixCheekPuff: p(0, 1, 0, '鼓腮'),
  ParamZenixEarL: p(-1, 1, 0, '左耳转动'),
  ParamZenixEarR: p(-1, 1, 0, '右耳转动'),
  ParamZenixTail: p(-1, 1, 0, '尾巴摆动'),
  ParamZenixHairFront: p(-1, 1, 0, '前发惯性'),
  ParamZenixHairSide: p(-1, 1, 0, '侧发惯性'),
  ParamZenixArmL: p(-1, 1, 0, '左上臂'),
  ParamZenixArmR: p(-1, 1, 0, '右上臂'),
  ParamZenixForearmL: p(-1, 1, 0, '左前臂'),
  ParamZenixForearmR: p(-1, 1, 0, '右前臂'),
  ParamZenixWristL: p(-1, 1, 0, '左手腕'),
  ParamZenixWristR: p(-1, 1, 0, '右手腕'),
  ParamZenixFingerL: p(0, 1, 0, '左手指收拢'),
  ParamZenixFingerR: p(0, 1, 0, '右手指收拢'),
  ParamZenixWeight: p(-1, 1, 0, '站姿重心'),
  ParamZenixShoulder: p(-1, 1, 0, '肩部起伏'),
  ParamZenixKnee: p(0, 1, 0, '落地缓冲'),
  ParamZenixLegL: p(-1, 1, 0, '左腿悬垂'),
  ParamZenixLegR: p(-1, 1, 0, '右腿悬垂'),
  ParamZenixFootL: p(-1, 1, 0, '左脚摆动'),
  ParamZenixFootR: p(-1, 1, 0, '右脚摆动'),
  ParamZenixDizzy: p(0, 1, 0, '短暂晕眩眼形'),
  ParamZenixBounce: p(-1, 1, 0, 'Q版弹跳'),
  ParamZenixSquash: p(-1, 1, 0, 'Q版弹性压缩'),
});

export const EXPRESSIONS = Object.freeze({
  neutral: {},
  happy: { ParamMouthForm: 0.8, ParamEyeLSmile: 0.65, ParamEyeRSmile: 0.65, ParamZenixEarL: 0.25, ParamZenixEarR: 0.25 },
  wink: { ParamEyeLOpen: 0, ParamEyeRSmile: 0.6, ParamMouthForm: 0.85 },
  sleepy: { ParamEyeLOpen: 0.38, ParamEyeROpen: 0.38, ParamMouthOpenY: 0.15, ParamZenixEarL: -0.3, ParamZenixEarR: -0.3 },
  thinking: { ParamBrowLY: 0.35, ParamEyeBallX: -0.35, ParamEyeBallY: 0.25, ParamMouthForm: -0.1 },
  surprised: { ParamBrowLY: 0.7, ParamBrowRY: 0.7, ParamMouthOpenY: 0.5, ParamZenixEarL: 0.75, ParamZenixEarR: 0.75 },
  pout: { ParamZenixCheekPuff: 0.8, ParamBrowLY: -0.25, ParamBrowRY: -0.25, ParamMouthForm: -0.7 },
  shy: { ParamZenixBlush: 0.8, ParamEyeLOpen: 0.85, ParamEyeROpen: 0.85, ParamMouthForm: 0.4, ParamZenixEarL: -0.2, ParamZenixEarR: -0.2 },
  startled: { ParamBrowLY: 0.9, ParamBrowRY: 0.9, ParamMouthOpenY: 0.65, ParamZenixEarL: 1, ParamZenixEarR: 1 },
  dizzy: { ParamZenixDizzy: 0.85, ParamBrowLY: 0.35, ParamBrowRY: -0.15, ParamMouthForm: -0.25, ParamZenixEarL: -0.6, ParamZenixEarR: -0.6 },
  focused: { ParamBrowLY: -0.15, ParamBrowRY: -0.15, ParamMouthForm: 0.05 },
  speaking: { ParamMouthForm: 0.65, ParamMouthOpenY: 0.4, ParamEyeLSmile: 0.25, ParamEyeRSmile: 0.25 },
});

// Explicit key poses in seconds. Cubic smoothstep interpolation is used online;
// the exporter converts the same source to Cubism cubic Bezier segments.
const c = (...frames) => frames;
export const MOTIONS = Object.freeze({
  idle: { duration: 6, loop: true, expression: 'neutral', curves: {
    ParamBodyAngleZ: c([0, 0], [1.5, 1.1], [3, 0], [4.5, -1.1], [6, 0]),
    ParamAngleZ: c([0, 0], [1.5, -1.4], [3, 0], [4.5, 1.4], [6, 0]),
    ParamZenixWeight: c([0, -0.15], [3, 0.15], [6, -0.15]),
    ParamZenixWristL: c([0, 0], [2, 0.08], [4, -0.05], [6, 0]),
    ParamZenixWristR: c([0, 0], [2, -0.05], [4, 0.08], [6, 0]),
    ParamZenixTail: c([0, -0.15], [2, 0.2], [4, -0.2], [6, -0.15]),
  } },
  hello: { duration: 3.6, expression: 'happy', curves: {
    ParamAngleZ: c([0,0],[.45,-6],[1.1,-3],[2.7,-5],[3.6,0]),
    ParamAngleY: c([0,0],[.4,3],[.75,-3],[1.1,0],[3.6,0]),
    ParamZenixArmR: c([0,0],[.45,.85],[2.65,.85],[3.6,0]),
    ParamZenixForearmR: c([0,0],[.5,.85],[2.65,.85],[3.6,0]),
    ParamZenixWristR: c([0,0],[.65,-.5],[.95,.55],[1.25,-.5],[1.55,.55],[1.85,-.5],[2.15,.55],[2.55,-.3],[3.6,0]),
    ParamMouthOpenY: c([0,0],[.6,.35],[.85,.05],[1.1,.45],[1.4,.05],[1.7,.3],[2,0],[3.6,0]),
    ParamZenixBounce: c([0,0],[.25,-.15],[.5,.5],[.85,0],[1.05,.18],[1.35,0],[3.6,0]),
    ParamZenixSquash: c([0,0],[.25,.6],[.5,-.3],[.85,.35],[1.2,0],[3.6,0]),
  } },
  nuzzle: { duration: 2.6, expression: 'happy', curves: {
    ParamAngleZ: c([0,0],[.45,12],[1.1,7],[1.65,11],[2.6,0]),
    ParamEyeLOpen: c([0,1],[.4,.15],[1.8,.15],[2.6,1]),
    ParamEyeROpen: c([0,1],[.4,.15],[1.8,.15],[2.6,1]),
    ParamZenixEarL: c([0,0],[.4,-.5],[.8,.3],[1.3,-.2],[2.6,0]),
    ParamZenixBlush: c([0,0],[.4,.7],[1.8,.6],[2.6,0]),
  } },
  lookAround: { duration: 3.4, expression:'thinking', curves:{
    ParamAngleX:c([0,0],[.65,-12],[1.35,-8],[2.2,11],[2.8,7],[3.4,0]),
    ParamEyeBallX:c([0,0],[.5,-.5],[1.4,-.35],[2.1,.5],[2.8,.35],[3.4,0]),
    ParamAngleZ:c([0,0],[.8,-3],[2.2,4],[3.4,0]),
    ParamZenixEarR:c([0,0],[.7,.35],[1.4,0],[2.2,-.2],[3.4,0]),
  } },
  earFlick: { duration:2.2,expression:'happy',curves:{
    ParamZenixEarL:c([0,0],[.3,-.65],[.55,.5],[.8,-.25],[1.05,0],[2.2,0]),
    ParamZenixEarR:c([0,0],[.85,0],[1.1,-.6],[1.35,.5],[1.6,-.2],[2.2,0]),
    ParamAngleZ:c([0,0],[.5,3],[1.2,-3],[2.2,0]),
    ParamZenixHairFront:c([0,0],[.55,.2],[1.3,-.15],[2.2,0]),
  } },
  tailSwish: { duration:3.2,expression:'happy',curves:{
    ParamZenixTail:c([0,0],[.5,-.6],[1.1,.65],[1.7,-.65],[2.3,.5],[3.2,0]),
    ParamZenixWeight:c([0,0],[.7,-.3],[1.8,.3],[3.2,0]),
    ParamAngleZ:c([0,0],[1,3],[2.1,-2],[3.2,0]),
  } },
  toeTap: { duration:2.8,expression:'happy',curves:{
    ParamZenixFootR:c([0,0],[.4,-.6],[.7,.35],[1,-.55],[1.3,.3],[1.6,-.4],[2.8,0]),
    ParamZenixLegR:c([0,0],[.45,.25],[1.4,.15],[2.8,0]),
    ParamZenixWeight:c([0,0],[.4,.3],[1.9,.3],[2.8,0]),
    ParamZenixWristL:c([0,0],[.7,-.2],[1.4,.2],[2.8,0]),
  } },
  happyNod: { duration:2.3,expression:'happy',curves:{
    ParamAngleY:c([0,0],[.35,-7],[.7,4],[1.05,-6],[1.4,3],[2.3,0]),
    ParamEyeLOpen:c([0,1],[.35,.65],[1.35,.65],[2.3,1]),
    ParamEyeROpen:c([0,1],[.35,.65],[1.35,.65],[2.3,1]),
    ParamZenixShoulder:c([0,0],[.4,.25],[1.1,.1],[2.3,0]),
    ParamZenixBounce:c([0,0],[.7,.12],[1,0],[2.3,0]),
  } },
  startleHop: { duration:1.9,expression:'surprised',curves:{
    ParamZenixBounce:c([0,0],[.12,-.1],[.3,.7],[.55,0],[.8,.2],[1.9,0]),
    ParamZenixSquash:c([0,0],[.12,.45],[.3,-.5],[.55,.55],[1,0],[1.9,0]),
    ParamZenixArmL:c([0,0],[.25,.55],[.65,.2],[1.9,0]),
    ParamZenixArmR:c([0,0],[.3,.6],[.7,.2],[1.9,0]),
    ParamZenixEarL:c([0,0],[.2,1],[.7,.4],[1.9,0]),
    ParamZenixEarR:c([0,0],[.2,1],[.7,.4],[1.9,0]),
    ParamZenixKnee:c([0,0],[.55,.4],[.9,0],[1.9,0]),
  } },
  headShake: { duration:2.4,expression:'pout',curves:{
    ParamAngleX:c([0,0],[.35,-10],[.7,10],[1.05,-8],[1.4,8],[1.8,-3],[2.4,0]),
    ParamAngleZ:c([0,0],[.35,-3],[.7,3],[1.05,-2],[1.4,2],[2.4,0]),
    ParamZenixEarL:c([0,0],[.3,-.3],[1.6,-.3],[2.4,0]),
    ParamZenixEarR:c([0,0],[.3,-.3],[1.6,-.3],[2.4,0]),
  } },
  wristRoll: { duration:2.7,expression:'happy',curves:{
    ParamZenixArmR:c([0,0],[.45,.45],[1.9,.45],[2.7,0]),
    ParamZenixForearmR:c([0,0],[.5,.7],[1.9,.7],[2.7,0]),
    ParamZenixWristR:c([0,0],[.7,-.7],[1.1,.7],[1.5,-.65],[1.9,.65],[2.7,0]),
    ParamAngleZ:c([0,0],[.6,-4],[1.9,-4],[2.7,0]),
  } },
  shyPeek: { duration: 2.8, expression: 'shy', curves: {
    ParamAngleX: c([0,0],[.45,-9],[1.8,-5],[2.8,0]),
    ParamAngleZ: c([0,0],[.4,7],[1.8,5],[2.8,0]),
    ParamEyeBallX: c([0,0],[.5,-.5],[1.4,.2],[2.8,0]),
    ParamZenixArmL: c([0,0],[.45,.3],[1.8,.3],[2.8,0]),
    ParamZenixForearmL: c([0,0],[.5,.85],[1.8,.85],[2.8,0]),
    ParamZenixWristL: c([0,0],[.7,-.3],[1.2,.25],[1.8,-.2],[2.8,0]),
    ParamZenixBlush: c([0,0],[.35,1],[1.9,.9],[2.8,0]),
  } },
  doubleWave: { duration: 2.6, expression: 'happy', curves: {
    ParamZenixArmL: c([0,0],[.4,.7],[1.9,.7],[2.6,0]),
    ParamZenixArmR: c([0,0],[.5,.8],[1.9,.8],[2.6,0]),
    ParamZenixForearmL: c([0,0],[.45,.8],[1.9,.8],[2.6,0]),
    ParamZenixForearmR: c([0,0],[.55,.85],[1.9,.85],[2.6,0]),
    ParamZenixWristL: c([0,0],[.7,-.5],[1,.5],[1.3,-.5],[1.6,.5],[2.6,0]),
    ParamZenixWristR: c([0,0],[.8,.5],[1.1,-.5],[1.4,.5],[1.7,-.5],[2.6,0]),
    ParamZenixBounce: c([0,0],[.5,.25],[.8,0],[1.2,.2],[1.5,0],[2.6,0]),
  } },
  bounce: { duration: 2.1, expression: 'happy', curves: {
    ParamZenixBounce: c([0,0],[.2,-.2],[.45,.85],[.75,0],[1,.4],[1.25,0],[2.1,0]),
    ParamZenixSquash: c([0,0],[.2,.8],[.45,-.5],[.75,.6],[1,-.2],[1.25,.3],[2.1,0]),
    ParamZenixArmL: c([0,0],[.45,.35],[1.25,.2],[2.1,0]),
    ParamZenixArmR: c([0,0],[.45,.4],[1.25,.15],[2.1,0]),
    ParamZenixFootL: c([0,0],[.45,.4],[.75,0],[2.1,0]),
    ParamZenixFootR: c([0,0],[.45,-.4],[.75,0],[2.1,0]),
  } },
  shuffle: { duration: 2.6, expression: 'shy', curves: {
    ParamAngleZ: c([0,0],[.5,-5],[1.2,5],[1.9,-4],[2.6,0]),
    ParamZenixLegL: c([0,0],[.45,.5],[.8,-.2],[1.2,.4],[1.6,-.2],[2.6,0]),
    ParamZenixLegR: c([0,0],[.45,-.2],[.8,.5],[1.2,-.2],[1.6,.4],[2.6,0]),
    ParamZenixFootL: c([0,0],[.45,-.4],[.8,.3],[1.2,-.3],[2.6,0]),
    ParamZenixFootR: c([0,0],[.45,.3],[.8,-.4],[1.2,.3],[2.6,0]),
  } },
  fidget: { duration: 4.2, expression: 'happy', curves: {
    ParamZenixWeight: c([0, 0], [1.1, -0.5], [3, -0.35], [4.2, 0]),
    ParamAngleZ: c([0, 0], [1.2, 6], [3, 4], [4.2, 0]),
    ParamZenixArmL: c([0, 0], [1, 0.35], [3, 0.35], [4.2, 0]),
    ParamZenixForearmL: c([0, 0], [1.1, 0.65], [3, 0.65], [4.2, 0]),
    ParamZenixFingerL: c([0, 0], [1.3, 0.5], [3, 0.5], [4.2, 0]),
  } },
  wave: { duration: 2.8, expression: 'happy', curves: {
    ParamAngleZ: c([0, 0], [0.5, -5], [2.3, -5], [2.8, 0]),
    ParamZenixArmR: c([0, 0], [0.5, 0.85], [2.15, 0.85], [2.8, 0]),
    ParamZenixForearmR: c([0, 0], [0.55, 0.8], [2.15, 0.8], [2.8, 0]),
    ParamZenixWristR: c([0, 0], [0.65, -0.5], [0.95, 0.55], [1.25, -0.5], [1.55, 0.55], [1.85, -0.4], [2.15, 0.35], [2.8, 0]),
    ParamZenixFingerR: c([0, 0], [0.55, 0.1], [2.15, 0.1], [2.8, 0]),
  } },
  stretch: { duration: 4.5, expression: 'sleepy', curves: {
    ParamZenixArmL: c([0, 0], [1.2, 1], [2.8, 1], [4.5, 0]),
    ParamZenixForearmL: c([0, 0], [1.2, -0.25], [2.8, -0.25], [4.5, 0]),
    ParamZenixShoulder: c([0, 0], [1.1, 0.7], [2.8, 0.7], [4.5, 0]),
    ParamAngleY: c([0, 0], [1.1, 7], [2.8, 7], [4.5, 0]),
    ParamBodyAngleZ: c([0, 0], [1.2, -3], [2.8, -3], [4.5, 0]),
  } },
  pat: { duration: 2.4, expression: 'happy', curves: {
    ParamAngleZ: c([0, 0], [0.35, 8], [1.2, 5], [1.7, 7], [2.4, 0]),
    ParamEyeLOpen: c([0, 1], [0.3, 0.2], [1.8, 0.2], [2.4, 1]),
    ParamEyeROpen: c([0, 1], [0.3, 0.2], [1.8, 0.2], [2.4, 1]),
    ParamZenixEarL: c([0, 0], [0.3, -0.5], [0.8, 0.1], [1.4, -0.35], [2.4, 0]),
    ParamZenixEarR: c([0, 0], [0.3, -0.4], [1, 0.1], [1.6, -0.3], [2.4, 0]),
    ParamZenixBlush: c([0, 0], [0.6, 0.35], [1.8, 0.35], [2.4, 0]),
  } },
  poke: { duration: 1.6, expression: 'surprised', curves: {
    ParamAngleX: c([0, 0], [0.18, -7], [0.5, -4], [1.6, 0]),
    ParamBodyAngleZ: c([0, 0], [0.2, 2], [0.65, -1], [1.6, 0]),
    ParamMouthOpenY: c([0, 0], [0.18, 0.45], [0.6, 0.2], [1.6, 0]),
    ParamZenixArmL: c([0, 0], [0.2, 0.2], [1.6, 0]),
  } },
  pickup: { duration: 1.4, expression: 'startled', curves: {
    ParamZenixShoulder: c([0, 0], [0.25, 0.4], [1.4, 0.2]),
    ParamZenixArmL: c([0, 0], [0.2, 0.35], [1.4, 0.2]),
    ParamZenixArmR: c([0, 0], [0.25, 0.3], [1.4, 0.2]),
    ParamZenixLegL: c([0, 0], [0.3, 0.25], [1.4, 0.15]),
    ParamZenixLegR: c([0, 0], [0.3, 0.35], [1.4, 0.25]),
    ParamZenixFootL: c([0, 0], [0.3, -0.25], [1.4, -0.15]),
    ParamZenixFootR: c([0, 0], [0.3, 0.3], [1.4, 0.2]),
  } },
  sway: { duration: 2.4, loop: true, expression: 'startled', curves: {
    ParamBodyAngleZ: c([0, 0], [0.6, 7], [1.2, 0], [1.8, -7], [2.4, 0]),
    ParamAngleZ: c([0, 0], [0.6, -5], [1.2, 0], [1.8, 5], [2.4, 0]),
    ParamZenixArmL: c([0, 0], [0.7, -0.6], [1.3, 0], [1.9, 0.6], [2.4, 0]),
    ParamZenixArmR: c([0, 0], [0.7, -0.6], [1.3, 0], [1.9, 0.6], [2.4, 0]),
    ParamZenixWristL: c([0, 0], [0.8, -0.5], [1.4, 0], [2, 0.5], [2.4, 0]),
    ParamZenixWristR: c([0, 0], [0.8, -0.5], [1.4, 0], [2, 0.5], [2.4, 0]),
    ParamZenixTail: c([0, 0], [0.8, -0.6], [1.4, 0], [2, 0.6], [2.4, 0]),
  } },
  recover: { duration: 2.5, expression: 'shy', curves: {
    ParamZenixKnee: c([0, 0], [0.22, 0.7], [0.55, 0.1], [0.8, 0.2], [1.3, 0], [2.5, 0]),
    ParamBodyAngleZ: c([0, 0], [0.25, 3], [0.65, -2], [1.1, 1], [1.7, 0], [2.5, 0]),
    ParamZenixArmL: c([0, 0], [0.3, 0.35], [1, 0.2], [2.5, 0]),
    ParamZenixArmR: c([0, 0], [0.3, 0.3], [0.9, 0.15], [2.5, 0]),
    ParamZenixForearmL: c([0, 0], [0.3, 0.25], [1, -0.15], [2.5, 0]),
  } },
});

export const CLICK_REACTIONS = Object.freeze({
  head: Object.freeze(['pat','nuzzle','shyPeek','happyNod','headShake']),
  ear: Object.freeze(['earFlick','nuzzle','lookAround','shyPeek']),
  hand: Object.freeze(['wave','doubleWave','wristRoll','shyPeek']),
  body: Object.freeze(['poke','bounce','shyPeek','shuffle','startleHop','happyNod']),
  foot: Object.freeze(['shuffle','toeTap','bounce','doubleWave']),
  tail: Object.freeze(['tailSwish','startleHop','lookAround']),
});
export const IDLE_MOTIONS=Object.freeze(['fidget','stretch','lookAround','earFlick','tailSwish','toeTap']);
export const MOTION_LABELS=Object.freeze({idle:'悠闲站立',hello:'打招呼',wave:'挥手',doubleWave:'双手招呼',pat:'摸头反应',nuzzle:'歪头蹭蹭',shyPeek:'害羞偷看',poke:'被轻轻戳',bounce:'开心弹跳',shuffle:'挪挪脚',stretch:'伸懒腰',fidget:'整理站姿',lookAround:'好奇张望',earFlick:'抖抖耳朵',tailSwish:'轻摆尾巴',toeTap:'脚尖打拍',happyNod:'开心点头',startleHop:'惊讶小跳',headShake:'摇头抗议',wristRoll:'换手招呼',pickup:'被抱起',sway:'晃动演练',recover:'站稳恢复',dragging:'害羞晃动',speaking:'无声嘴型','agent-thinking':'查找说明','agent-presenting':'展示回答','agent-error':'本次未完成','agent-cancelled':'已经停止'});

export function defaults() {
  return Object.fromEntries(Object.entries(PARAMETERS).map(([id, spec]) => [id, spec.initial]));
}

export function sampleCurve(frames, time) {
  if (time <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    if (time <= frames[i][0]) {
      const [t0, v0] = frames[i - 1], [t1, v1] = frames[i];
      const u = (time - t0) / (t1 - t0);
      return v0 + (v1 - v0) * u * u * (3 - 2 * u);
    }
  }
  return frames.at(-1)[1];
}
