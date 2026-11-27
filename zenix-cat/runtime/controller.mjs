import { PARAMETERS, EXPRESSIONS, MOTIONS, CLICK_REACTIONS, IDLE_MOTIONS, defaults, sampleCurve } from './catalog.mjs';
import {VarietyPicker} from './variety-picker.mjs';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value)) || 0;
const finite = (n, fallback = 0) => Number.isFinite(n) ? n : fallback;
const smooth = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
const spring = (value = 0) => ({ value, velocity: 0 });
function integrate(s, target, dt, frequency, damping) {
  const w = 2 * Math.PI * frequency;
  s.velocity += (w * w * (target - s.value) - 2 * damping * w * s.velocity) * dt;
  s.value += s.velocity * dt;
}

/** Parameter-only animator: no renderer, framework, DOM or proprietary Core dependency. */
export class CharacterController {
  constructor({ random = Math.random, reducedMotion = false, bounds = { width: 800, height: 650, characterWidth: 250, characterHeight: 500 } } = {}) {
    this.random = () => clamp(finite(random(), 0.5), 0, 0.999999);
    this.reducedMotion = reducedMotion;
    this.elapsed = 0;
    this.disposed = false;
    this.gaze = { x: 0, y: 0 };
    this.position = { x: 0, y: 0 };
    this.pointer = null;
    this.activity = null;
    this.expression = null;
    this.greeted = false;
    this.lastReaction = new Map();
    this.choices=new VarietyPicker(this.random);this.eventSequence=0;
    this.transition = null;
    this.agentState = null;
    this.speaking = 0;
    this.energy = 0;
    this.nextBlink = 2 + this.random() * 3;
    this.blinkAge = -1;
    this.nextIdle = 10 + this.random() * 8;
    this.body = spring();
    this.head = spring();
    this.hair = spring();
    this.tail = spring();
    this.arm = spring();
    this.wrist = spring();
    this.setBounds(bounds);
  }

  setBounds(bounds) {
    const width = Math.max(1, finite(bounds.width, 800));
    const height = Math.max(1, finite(bounds.height, 650));
    this.bounds = { width, height,
      characterWidth: Math.max(1, finite(bounds.characterWidth, 250)),
      characterHeight: Math.max(1, finite(bounds.characterHeight, 500)) };
    this.limits = { x: Math.max(0, (width - this.bounds.characterWidth) / 2),
      y: Math.max(0, (height - this.bounds.characterHeight) / 2) };
    this.position.x = clamp(this.position.x, -this.limits.x, this.limits.x);
    this.position.y = clamp(this.position.y, -this.limits.y, this.limits.y);
    // Rebase the active gesture when a resize clamps its position.
    if (this.pointer) {
      this.pointer.originX = this.pointer.lastX;
      this.pointer.originY = this.pointer.lastY;
      this.pointer.position = { ...this.position };
    }
  }

  lookAt(x, y) { this.gaze = { x: clamp(finite(x), -1, 1), y: clamp(finite(y), -1, 1) }; }
  setAgentState(phase,duration=Infinity){
    if(!['idle','thinking','presenting','error','cancelled'].includes(phase))throw new RangeError('Unknown agent state');
    if(phase==='idle'){this.agentState=null;return;}
    if(this.disposed)return;
    this.agentState={phase,started:this.elapsed,duration,variant:this.choices.next('agent-'+phase,[0,1,2]),sequence:++this.eventSequence};
    // The greeting may be interrupted by the first question; deliberate clicks and dragging retain priority.
    if(this.activity?.name==='hello'||this.activity?.automatic)this.activity=null;
  }
  setSpeaking(level) { this.speaking = clamp(finite(level), 0, 1); }
  setReducedMotion(value) {
    this.reducedMotion = Boolean(value);
    if (this.reducedMotion) for (const s of [this.body, this.head, this.hair, this.tail, this.arm, this.wrist]) { s.value = 0; s.velocity = 0; }
  }
  setExpression(name, duration = 2) {
    if (!Object.hasOwn(EXPRESSIONS, name)) throw new RangeError(`Unknown expression: ${name}`);
    if (!Number.isFinite(duration) || duration <= 0) throw new RangeError('Expression duration must be positive');
    this.expression = { name, started: this.elapsed, duration,sequence:++this.eventSequence };
  }
  play(name) {
    if (!Object.hasOwn(MOTIONS, name) || name === 'idle') throw new RangeError(`Unknown action: ${name}`);
    if (this.disposed || this.pointer?.dragging) return false;
    this.transition = this.snapshot ? { from: this.snapshot.parameters, started: this.elapsed } : null;
    this.expression = null;
    this.activity = { name, started: this.elapsed,sequence:++this.eventSequence };
    this.nextIdle = this.elapsed + 12 + this.random() * 10;
    return true;
  }

  /** Host calls once after its assets have loaded; focus/hover never replays it. */
  greet() {
    if (this.greeted || this.disposed || this.pointer) return false;
    this.greeted = true;
    return this.play('hello');
  }
  react(region = 'body') {
    if(this.disposed || this.pointer?.dragging) return null;
    const key=Object.hasOwn(CLICK_REACTIONS,region)?region:'body', pool=CLICK_REACTIONS[key];
    const action=this.choices.next('click-'+key,pool,{first:true});
    if(!this.play(action))return null;
    this.lastReaction.set(key,action);return action;
  }

  pointerDown({ id, x, y, time = 0, region = 'body' }) {
    if (this.disposed || this.pointer || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    this.pointer = { id, originX: x, originY: y, lastX: x, lastY: y,
      lastTime: finite(time), vx: 0, vy: 0, maxDistance: 0, dragging: false,
      region, position: { ...this.position } };
    return true;
  }
  pointerMove({ id, x, y, time = 0 }) {
    const p = this.pointer;
    if (!p || p.id !== id || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    const distance = Math.hypot(x - p.originX, y - p.originY);
    p.maxDistance = Math.max(p.maxDistance, distance);
    const stamp = finite(time, p.lastTime);
    const dt = clamp((stamp - p.lastTime) / 1000, 0.008, 0.1);
    const vx = clamp((x - p.lastX) / dt, -1800, 1800);
    const vy = clamp((y - p.lastY) / dt, -1800, 1800);
    p.vx = p.vx * 0.4 + vx * 0.6;
    p.vy = p.vy * 0.4 + vy * 0.6;
    if (p.maxDistance >= 7) {
      if (!p.dragging) { this.activity = null; this.expression = null; this.transition = null; p.dragStarted = this.elapsed; p.phase = this.random()*Math.PI*2;p.sequence=++this.eventSequence; }
      p.dragging = true;
      this.position.x = clamp(p.position.x + x - p.originX, -this.limits.x, this.limits.x);
      this.position.y = clamp(p.position.y + y - p.originY, -this.limits.y, this.limits.y);
      this.energy = Math.max(this.energy, Math.hypot(p.vx, p.vy) / 1400);
    }
    p.lastX = x; p.lastY = y; p.lastTime = Math.max(stamp, p.lastTime);
    return true;
  }
  pointerUp({ id, x, y, time = 0, cancelled = false }) {
    const p = this.pointer;
    if (!p || p.id !== id) return { kind: 'ignored' };
    if (!cancelled && Number.isFinite(x) && Number.isFinite(y) && (x !== p.lastX || y !== p.lastY)) this.pointerMove({ id, x, y, time });
    this.pointer = null;
    if (p.dragging) {
      // Holding still before release must not retain the old high velocity.
      const decay = Math.exp(-Math.max(0, finite(time, p.lastTime) - p.lastTime) / 100);
      if (!this.reducedMotion && !cancelled) {
        this.body.velocity += clamp(p.vx * decay / 100, -14, 14);
        this.arm.velocity -= clamp(p.vx * decay / 600, -2.5, 2.5);
        this.wrist.velocity -= clamp(p.vx * decay / 700, -2, 2);
      }
      this.play('recover');
      if (this.energy > 0.7 && !cancelled) this.setExpression('dizzy', 1.25);
      return { kind: cancelled ? 'cancelled' : 'drag', position: { ...this.position } };
    }
    if (cancelled) return { kind: 'cancelled' };
    const action = this.react(p.region);
    return { kind: 'click', action };
  }
  cancelPointer(id) { return this.pointerUp({ id, cancelled: true }); }

  update(deltaSeconds) {
    if (this.disposed) return this.snapshot ?? this.makeFrame(defaults(), 'disposed', 'neutral');
    const dt = clamp(finite(deltaSeconds), 0, 0.1);
    this.elapsed += dt;
    const dragging = Boolean(this.pointer?.dragging);
    if(this.agentState&&this.elapsed-this.agentState.started>=this.agentState.duration)this.agentState=null;
    if (this.activity && this.elapsed - this.activity.started >= MOTIONS[this.activity.name].duration) this.activity = null;
    if (this.expression && this.elapsed - this.expression.started >= this.expression.duration) this.expression = null;
    if (!dragging && !this.activity && !this.expression && !this.agentState && !this.reducedMotion && this.elapsed >= this.nextIdle) {
      this.play(this.choices.next('idle',IDLE_MOTIONS));this.activity.automatic=true;
    }

    const vx = dragging ? this.pointer.vx : 0;
    const speed = dragging ? Math.hypot(vx,this.pointer.vy)/1200 : 0;
    // Stable substeps cap integration error at uneven display frame rates.
    let rest = dt;
    while (rest > 0) {
      const step = Math.min(rest, 1 / 240);
      if (!this.reducedMotion) {
        integrate(this.body, clamp(-vx / 95, -9, 9), step, 2.0, 0.65);
        integrate(this.head, -this.body.value * 0.65, step, 2.6, 0.65);
        integrate(this.hair, clamp(-this.body.velocity / 45 - vx / 1900, -0.9, 0.9), step, 2.3, 0.56);
        integrate(this.tail, clamp(-vx / 1900 - this.body.value / 22, -0.9, 0.9), step, 1.5, 0.55);
        integrate(this.arm, clamp(-vx / 1700, -0.85, 0.85), step, 1.7, 0.6);
        integrate(this.wrist, clamp(-this.arm.velocity / 13, -0.9, 0.9), step, 2.2, 0.58);
      }
      rest -= step;
    }
    // Pointer velocity decays even if no new pointermove event arrives.
    if (dragging) { this.pointer.vx *= Math.exp(-dt * 8); this.pointer.vy *= Math.exp(-dt * 8); }
    this.energy = Math.max(0, this.energy - dt * 0.55);
    const params = defaults();
    if (!this.reducedMotion) {
      this.applyMotion(params, MOTIONS.idle, this.elapsed % MOTIONS.idle.duration, 1);
      params.ParamBreath = 0.5 + Math.sin(this.elapsed * 1.55) * 0.3;
    }
    params.ParamAngleX += this.gaze.x * 9;
    params.ParamAngleY += this.gaze.y * 6;
    params.ParamEyeBallX = this.gaze.x * 0.65;
    params.ParamEyeBallY = this.gaze.y * 0.6;

    let expressionName = 'neutral';
    const agentActive=this.agentState&&!dragging&&!this.activity&&!this.expression;
    if(agentActive){
      const age=this.elapsed-this.agentState.started;
      const phase=this.agentState.phase;
      expressionName=phase==='thinking'?'thinking':phase==='presenting'?'speaking':phase==='error'?'shy':'neutral';
      this.applyExpression(params,expressionName,1);
      if(phase==='thinking'){
        const v=this.agentState.variant;
        params.ParamAngleZ=v===1?-4:4;params.ParamAngleY=v===2?-2:2;params.ParamZenixEarL=-.15;
        if(v===1){params.ParamEyeBallX=.35;params.ParamBrowRY=.3;}
        if(v===2){params.ParamZenixArmL=.08;params.ParamZenixForearmL=.2;}
        if(!this.reducedMotion)params.ParamAngleZ+=Math.sin(age*1.6)*1.3;
      }
      if(phase==='presenting'){
        params.ParamMouthOpenY=this.reducedMotion?0:Math.min(.9,Math.pow(Math.max(0,Math.sin(age*11.8)),.75)*.88);
        if(!this.reducedMotion){params.ParamAngleZ+=Math.sin(age*2)*2;params.ParamZenixWristL+=Math.sin(age*2.5)*.1;}
        if(this.agentState.variant===1){params.ParamZenixArmR=.12;params.ParamZenixForearmR=.25;}
        if(this.agentState.variant===2&&!this.reducedMotion)params.ParamAngleY=Math.sin(age*2.2)*3;
      }
      if(phase==='error'){params.ParamBrowLY=.35;params.ParamBrowRY=.35;params.ParamMouthForm=-.15;}
    }
    if (this.activity) {
      const motion = MOTIONS[this.activity.name];
      const age = this.elapsed - this.activity.started;
      const weight = Math.min(smooth(age / 0.18), smooth((motion.duration - age) / 0.28));
      expressionName = motion.expression;
      this.applyExpression(params, expressionName, weight);
      if (!(this.reducedMotion && this.activity.name === 'hello')) this.applyMotion(params, motion, age, weight);
    }
    if (dragging) {
      expressionName = 'shy';
      this.applyExpression(params, 'shy', 1);
      params.ParamZenixBlush = 1;
      params.ParamEyeBallX = -.3 + Math.sin(this.elapsed*2)*.12;
      params.ParamEyeBallY = .35;
      params.ParamBrowLY = .25; params.ParamBrowRY = .2;
      params.ParamMouthOpenY = .12;
      params.ParamZenixShoulder = .4;
      if (!this.reducedMotion) {
        const age=this.elapsed-this.pointer.dragStarted, t=age*10.5+this.pointer.phase;
        const a=smooth(age/.22)*(.55+Math.min(speed,1)*.3);
        // Incommensurate frequencies and alternating phases look flustered without per-frame random jitter.
        params.ParamZenixArmL += .3+a*(Math.sin(t)*.4+Math.sin(t*.67)*.12);
        params.ParamZenixArmR += .3+a*(Math.sin(t*1.13+2)*.4);
        params.ParamZenixForearmL += .25+a*Math.sin(t*1.23+.8)*.6;
        params.ParamZenixForearmR += .25+a*Math.sin(t*.93+3)*.6;
        params.ParamZenixWristL += a*Math.sin(t*1.6)*.8;
        params.ParamZenixWristR += a*Math.sin(t*1.47+1)*.8;
        params.ParamZenixLegL += a*Math.sin(t*.85)*.8;
        params.ParamZenixLegR += a*Math.sin(t*.97+2.5)*.8;
        params.ParamZenixFootL += a*Math.sin(t*1.3+.7)*.9;
        params.ParamZenixFootR += a*Math.sin(t*1.43+2)*.9;
        params.ParamAngleZ += Math.sin(t*.5)*3;
        params.ParamZenixBounce = Math.sin(t*.65)*.16;
        params.ParamZenixSquash = Math.sin(t*.65+1)*.2;
      }
    }
    if (this.expression && !dragging) {
      expressionName = this.expression.name;
      const age = this.elapsed - this.expression.started;
      const weight = Math.min(smooth(age / 0.12), smooth((this.expression.duration - age) / 0.22));
      this.applyExpression(params, expressionName, weight);
    }
    params.ParamBodyAngleZ += this.body.value;
    params.ParamAngleZ += this.head.value;
    params.ParamZenixHairFront += this.hair.value * 0.55;
    params.ParamZenixHairSide += this.hair.value;
    params.ParamZenixTail += this.tail.value;
    params.ParamZenixArmL += this.arm.value;
    params.ParamZenixArmR += this.arm.value;
    params.ParamZenixForearmL += this.arm.value * 0.5;
    params.ParamZenixForearmR += this.arm.value * 0.55;
    params.ParamZenixWristL += this.wrist.value;
    params.ParamZenixWristR += this.wrist.value;
    params.ParamZenixLegL += this.arm.value * 0.2;
    params.ParamZenixLegR += this.arm.value * 0.25;
    params.ParamZenixFootL += this.wrist.value * 0.2;
    params.ParamZenixFootR += this.wrist.value * 0.25;
    if (this.speaking > 0 && !dragging && !this.reducedMotion) {
      params.ParamMouthOpenY = this.speaking;
      if (!this.activity && !this.expression && !dragging) expressionName = 'speaking';
    }

    if (this.transition) {
      const weight=smooth((this.elapsed-this.transition.started)/.18);
      for(const id of Object.keys(params)) params[id]=this.transition.from[id]+(params[id]-this.transition.from[id])*weight;
      if(weight>=1)this.transition=null;
    }
    if(this.reducedMotion){params.ParamZenixBounce=0;params.ParamZenixSquash=0;}

    if (this.blinkAge < 0 && this.elapsed >= this.nextBlink) this.blinkAge = 0;
    if (this.blinkAge >= 0) {
      this.blinkAge += dt;
      const t = this.blinkAge;
      const openness = t < 0.07 ? 1 - t / 0.07 : t < 0.11 ? 0 : clamp((t - 0.11) / 0.12, 0, 1);
      params.ParamEyeLOpen *= openness;
      params.ParamEyeROpen *= openness;
      if (t >= 0.23) { this.blinkAge = -1; this.nextBlink = this.elapsed + 2 + this.random() * 4; }
    }
    for (const [id, spec] of Object.entries(PARAMETERS)) params[id] = clamp(finite(params[id], spec.initial), spec.min, spec.max);
    const state = dragging ? 'dragging' : this.activity?.name ?? (agentActive?'agent-'+this.agentState.phase:(this.speaking ? 'speaking' : 'idle'));
    this.snapshot = this.makeFrame(params, state, expressionName);
    return this.snapshot;
  }

  applyExpression(params, name, weight) {
    for (const [id, value] of Object.entries(EXPRESSIONS[name])) params[id] += (value - params[id]) * weight;
  }
  applyMotion(params, motion, time, weight) {
    for (const [id, frames] of Object.entries(motion.curves)) {
      const value = sampleCurve(frames, time);
      params[id] += (value - params[id]) * weight;
    }
  }
  makeFrame(parameters, state, expression) {
    const cue=state==='dragging'?'drag:'+this.pointer?.sequence:this.activity?'motion:'+this.activity.sequence:
      state.startsWith('agent-')?'agent:'+this.agentState?.sequence:this.expression?'expression:'+this.expression.sequence:state;
    return { parameters: { ...parameters }, state, expression, position: { ...this.position },
      elapsed: this.elapsed, reducedMotion: this.reducedMotion,cue,
      dragAge:state==='dragging'?this.elapsed-this.pointer.dragStarted:0,dragIntensity:state==='dragging'?Math.min(1,Math.hypot(this.pointer.vx,this.pointer.vy)/1400):0 };
  }
  dispose() { this.disposed = true; this.pointer = null; this.activity = null; this.expression = null; this.transition = null; this.agentState=null;this.lastReaction.clear();this.choices.clear(); }
}

export { PARAMETERS, EXPRESSIONS, MOTIONS } from './catalog.mjs';
