import {MOTIONS,EXPRESSIONS} from './catalog.mjs';
export const PERFORMANCE_MOTIONS=Object.freeze(['hello','wave','doubleWave','fidget','shyPeek','bounce','nuzzle','lookAround','earFlick','tailSwish','toeTap','happyNod','headShake','wristRoll']);
export const PERFORMANCE_EXPRESSIONS=Object.freeze(['neutral','happy','focused','thinking','shy','surprised','wink']);

export function normalizePerformance(value){
  if(!value||typeof value!=='object'||value.version!==1||!PERFORMANCE_MOTIONS.includes(value.motion)||!PERFORMANCE_EXPRESSIONS.includes(value.expression)||!['soft','normal'].includes(value.intensity)||!['local','model'].includes(value.source)||!value.bubble||value.bubble.kind!=='answer'||!Number.isSafeInteger(value.bubble.paragraph)||value.bubble.paragraph<0||value.bubble.paragraph>7)return null;
  return{version:1,motion:value.motion,expression:value.expression,bubble:{kind:'answer',paragraph:value.bubble.paragraph},intensity:value.intensity,source:value.source};
}
export function normalizePerformanceText(value){
  if(typeof value!=='string')return '';
  const points=[...value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim()];
  return points.length>96?points.slice(0,95).join('')+'…':points.join('');
}

/** One committed cue per answer, no timers/window operations, no model code. */
export class PerformanceDirector{
  constructor(controller){this.controller=controller;this.pending=null;this.active=null;this.suspended=false;this.lastResult='none';}
  stage(performance,bubbleText,mode){
    this.pending=null;
    const p=normalizePerformance(performance),text=normalizePerformanceText(bubbleText);
    if(!text||!['preset','retrieval-only','adk-rag','scope-limit','no-evidence'].includes(mode)||(p?.source==='model'&&!['adk-rag'].includes(mode))||(p?.source==='local'&&!['preset','retrieval-only'].includes(mode)))return false;
    this.pending={performance:p,text};return true;
  }
  commit(){
    const cue=this.pending;this.pending=null;if(!cue)return false;
    const c=this.controller;
    // Drop, never queue, if the user is holding/dragging/clicking the character.
    if(this.suspended||c.disposed||c.pointer||c.activity||c.expression){this.lastResult='user-priority';return false;}
    const p=cue.performance;
    if(!p){
      this.active={...cue,expires:c.elapsed+5,activity:null,expression:null,motion:null};
      this.lastResult='bubble-only';return true;
    }
    const motion=p.intensity==='soft'&&['hello','doubleWave','bounce'].includes(p.motion)?'wave':p.motion;
    const duration=Math.min(8,Math.max(3,[...cue.text].length/20,MOTIONS[motion]?.duration??0));
    this.active={...cue,expires:c.elapsed+duration,activity:null,expression:null,motion:null};
    if(!c.reducedMotion&&MOTIONS[motion]&&EXPRESSIONS[p.expression]){
      if(c.play(motion)){
        this.active.activity=c.activity;this.active.motion=motion;
        c.setExpression(p.expression,Math.min(MOTIONS[motion].duration,3));this.active.expression=c.expression;
      }
    }
    this.lastResult=c.reducedMotion?'bubble-only':'performed';return true;
  }
  tick(){
    const a=this.active,c=this.controller;if(!a)return;
    if(c.pointer||(c.activity&&c.activity!==a.activity)||(c.expression&&c.expression!==a.expression)){this.clear('user-priority');return;}
    if(c.elapsed>=a.expires)this.clear('expired');
  }
  clear(reason='cleared'){
    this.pending=null;const a=this.active,c=this.controller;
    if(a){if(a.activity&&c.activity===a.activity)c.activity=null;if(a.expression&&c.expression===a.expression)c.expression=null;}
    this.active=null;this.lastResult=reason;
  }
  setSuspended(value){this.suspended=Boolean(value);if(this.suspended)this.clear('paused');}
  get bubbleText(){this.tick();return this.active?.text??'';}
  get snapshot(){this.tick();return{pending:Boolean(this.pending),active:Boolean(this.active),motion:this.active?.motion??null,source:this.active?.performance?.source??null,bubbleText:this.active?.text??'',result:this.lastResult};}
}
