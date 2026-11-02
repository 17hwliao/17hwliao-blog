import {PerformanceDirector,normalizePerformance,normalizePerformanceText} from './performance-director.mjs';
const types=new Set(['begin','meta','status','answer','done','error','cancel','clear']);
const modes=new Set(['retrieval-only','adk-rag','scope-limit','no-evidence']);
export function normalizeAgentEvent(value){
  if(!value||typeof value!=='object'||!types.has(value.type)||!Number.isSafeInteger(value.turn)||value.turn<0)return null;
  const out={type:value.type,turn:value.turn};
  if(value.mode!==undefined){if(!modes.has(value.mode))return null;out.mode=value.mode;}
  if(value.characters!==undefined){if(!Number.isFinite(value.characters)||value.characters<0)return null;out.characters=Math.min(10000,Math.round(value.characters));}
  if(value.type==='answer'&&value.performance!==undefined){
    const p=normalizePerformance(value.performance),text=normalizePerformanceText(value.bubbleText);
    if(p&&text){out.performance=p;out.bubbleText=text;}
  }
  return out;
}
/** Trusted UI lifecycle only; never consumes model HTML, text commands, or arbitrary motion names. */
export class AgentCharacterLink{
  constructor(controller){this.controller=controller;this.presentation=new PerformanceDirector(controller);this.turn=-1;this.phase='idle';this.mode='retrieval-only';this.characters=0;this.answerReceived=false;this.disposed=false;}
  receive(raw){
    const e=normalizeAgentEvent(raw);if(!e||this.disposed)return false;
    if(e.type==='clear'){
      if(e.turn<this.turn)return false;this.presentation.clear();this.turn=e.turn;this.phase='idle';this.answerReceived=false;this.controller.setAgentState('idle');return true;
    }
    if(e.type==='begin'){
      if(e.turn<=this.turn)return false;
      this.presentation.clear();this.turn=e.turn;this.mode=e.mode??'retrieval-only';this.answerReceived=false;this.characters=0;this.phase='thinking';this.controller.setAgentState('thinking');return true;
    }
    if(e.turn!==this.turn||this.phase!=='thinking')return false;
    if(e.type==='meta'){if(e.mode)this.mode=e.mode;}
    if(e.type==='answer'){this.answerReceived=true;this.characters=e.characters??0;if(e.mode)this.mode=e.mode;this.presentation.stage(e.performance,e.bubbleText,this.mode);}
    if(e.type==='done'){
      if(!this.answerReceived)return false;
      this.phase='presenting';this.controller.setAgentState('presenting',Math.min(8,2+this.characters/65));
      this.presentation.commit();
    }
    if(e.type==='error'){this.presentation.clear();this.phase='error';this.controller.setAgentState('error',3);}
    if(e.type==='cancel'){this.presentation.clear();this.phase='cancelled';this.controller.setAgentState('cancelled',1.2);}
    return true;
  }
  get snapshot(){return{turn:this.turn,phase:this.controller.agentState?.phase??'idle',mode:this.mode,performance:this.presentation.snapshot};}
  dispose(){this.disposed=true;this.presentation.clear();this.controller.setAgentState('idle');}
}
