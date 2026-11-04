import {normalizeAgentEvent} from '../../zenix-cat/runtime/agent-link.mjs';

export const AGENT_MOTIONS=Object.freeze(['hello','wave','happyNod','lookAround','shyPeek']);
export const NATIVE_ACTIONS=Object.freeze([
  {id:'wave',label:'挥手',file:'WabeHand.motion3.json',index:3,duration:4.967},
  {id:'sparkle',label:'星光',file:'HeartKirakira_5sec.motion3.json',index:1,duration:4.967},
  {id:'heart',label:'爱心',file:'HeartMark_5sec.motion3.json',index:2,duration:5.3},
  {id:'angry',label:'怒气标记',file:'AngryMark_5sec.motion3.json',index:0,duration:5.3},
]);
export const EXPRESSIONS=Object.freeze({aozame:'青脸',eye_heart:'爱心眼',eye_highlight_off:'隐藏高光',eye_kira:'星星眼',eye_leaf:'四叶草眼',tere:'害羞'});
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export class CharacterState{
  constructor({clock=()=>performance.now()/1000,actions=NATIVE_ACTIONS,expressionLabels=EXPRESSIONS,greetingAction='wave',agentNativeActions={hello:'wave',wave:'wave'},shyExpression='tere'}={}){
    this.actions=actions;this.expressionLabels=expressionLabels;this.greetingAction=greetingAction;this.agentNativeActions=agentNativeActions;this.shyExpression=shyExpression;
    this.clock=clock;this.turn=-1;this.phase='idle';this.mode='retrieval-only';this.phaseUntil=0;
    this.answerReceived=false;this.pending=null;this.native=null;this.expression=null;this.bubble=null;
    this.activity=null;this.sequence=0;this.userUntil=0;this.dragging=false;this.paused=false;this.reduced=false;this.greeted=false;this.disposed=false;
  }
  get now(){return this.clock();}
  ambient(id,text){
    if(this.disposed||this.paused||this.userBusy||this.phase==='thinking'||this.phase==='presenting')return false;
    const action=this.actions.find(a=>a.id===id);this.clearDecoration();
    if(action&&!this.reduced)this.native={...action,sequence:++this.sequence,until:this.now+action.duration};
    this.show(text,'warm',4.5);return true;
  }
  show(text,tone='warm',duration=3.5){this.bubble={text,tone,until:this.now+duration,serial:++this.sequence};}
  get userBusy(){return this.dragging||this.now<this.userUntil;}
  clearDecoration(){this.native=null;this.expression=null;this.activity=null;this.bubble=null;this.userUntil=0;}
  setPaused(value){this.paused=Boolean(value);this.pending=null;this.clearDecoration();}
  setReduced(value){this.reduced=Boolean(value);if(this.reduced){this.native=null;this.activity=null;}}
  greet(){if(this.greeted||this.disposed)return;this.greeted=true;this.local(this.greetingAction);this.userUntil=0;}
  local(id){
    if(this.disposed||this.paused||this.dragging)return false;
    const definition=this.actions.find(a=>a.id===id);if(!definition)return false;
    this.pending=null;this.clearDecoration();
    this.userUntil=this.now+Math.max(3.5,definition.duration);
    if(!this.reduced)this.native={...definition,sequence:++this.sequence,until:this.now+definition.duration};
    this.show(definition.text??{wave:'你好呀，欢迎来逛逛～',sparkle:'收到啦。',heart:'谢谢你来找我。',angry:'这个是作者制作的怒气标记。'}[id]??definition.label,id==='angry'?'thought':'warm');
    return true;
  }
  setExpression(name){
    if(!Object.hasOwn(this.expressionLabels,name)||this.paused||this.dragging||this.disposed)return false;
    this.pending=null;this.clearDecoration();this.userUntil=this.now+4;this.expression={name,until:this.now+4};
    this.show(this.expressionLabels[name]+'表情',name===this.shyExpression?'shy':'warm',2.5);return true;
  }
  touch(){
    if(this.paused||this.disposed)return;
    this.pending=null;this.clearDecoration();this.userUntil=this.now+2.5;if(!this.reduced)this.activity={name:'nod',until:this.now+1.2,started:this.now};
    this.show('我在这里。','warm',2.5);
  }
  drag(value){
    this.dragging=Boolean(value);this.pending=null;this.clearDecoration();
    if(value)this.show('轻轻拖就好啦。','shy',3);
    else {this.userUntil=this.now+.6;if(!this.reduced)this.activity={name:'recover',until:this.now+.6,started:this.now};}
  }
  receive(raw){
    if(this.disposed)return false;
    const e=normalizeAgentEvent(raw);if(!e)return false;
    if(e.type==='clear'){
      if(e.turn<this.turn)return false;
      this.turn=e.turn;this.phase='idle';this.pending=null;this.answerReceived=false;this.clearDecoration();return true;
    }
    if(e.type==='begin'){
      if(e.turn<=this.turn)return false;
      this.turn=e.turn;this.mode=e.mode??'retrieval-only';this.phase='thinking';this.pending=null;this.answerReceived=false;
      if(!this.userBusy){this.clearDecoration();if(!this.paused)this.show('让我看看…','thought',4);}return true;
    }
    if(e.turn!==this.turn||this.phase!=='thinking')return false;
    if(e.mode)this.mode=e.mode;
    if(e.type==='answer'){
      this.answerReceived=true;
      const validSource=(e.performance?.source==='model'&&this.mode==='adk-rag')||(e.performance?.source==='local'&&this.mode==='retrieval-only');
      this.pending=!this.paused&&!this.userBusy&&validSource?{performance:e.performance,text:e.bubbleText}:null;
    }
    if(e.type==='done'){
      if(!this.answerReceived)return false;
      this.phase='presenting';this.phaseUntil=this.now+5;
      const pending=this.pending;this.pending=null;
      if(!this.paused&&!this.userBusy){
        this.bubble=null;
        if(pending){
          this.show(pending.text,'answer',5);
          const p=pending.performance;
          if(!this.activity&&!this.native){
            const a=this.actions.find(action=>action.id===this.agentNativeActions[p.motion]);if(a&&!this.reduced)this.native={...a,sequence:++this.sequence,until:this.now+a.duration};
            if(p.motion==='happyNod'&&!this.reduced)this.activity={name:'nod',until:this.now+1.2,started:this.now};
            if(p.motion==='lookAround'&&!this.reduced)this.activity={name:'look',until:this.now+1.8,started:this.now};
            if((p.motion==='shyPeek'||p.expression==='shy')&&this.shyExpression)this.expression={name:this.shyExpression,until:this.now+3};
            if(p.expression==='wink'&&!this.reduced)this.activity={name:'wink',until:this.now+1.1,started:this.now};
          }
        }else this.show(this.mode==='no-evidence'?'这次还没找到合适的信息。':this.mode==='scope-limit'?'我可以帮你了解小站的功能。':'希望这些能帮到你。','warm',3);
      }
    }
    if(e.type==='error'||e.type==='cancel'){
      this.pending=null;this.phase=e.type==='error'?'error':'cancelled';this.phaseUntil=this.now+(e.type==='error'?3:1.2);
      if(!this.userBusy){this.clearDecoration();if(!this.paused)this.show(e.type==='error'?'这次没有完成，可以再试试。':'已停下这次查找。','thought',2.5);}
    }
    return true;
  }
  frame(){
    const now=this.now;
    for(const key of ['native','expression','bubble','activity'])if(this[key]&&now>=this[key].until)this[key]=null;
    if(this.phase!=='thinking'&&this.phase!=='idle'&&now>=this.phaseUntil)this.phase='idle';
    const speaking=!this.paused&&!this.reduced&&!this.dragging&&this.bubble&&!['thought','shy'].includes(this.bubble.tone);
    const speech=speaking?Math.min(.85,Math.pow(Math.max(0,Math.sin(now*11.8)),.75)*.8):0;
    const blinkAge=now%4.3,blink=blinkAge<.16?Math.abs(blinkAge-.08)/.08:1;
    return{now,turn:this.turn,phase:this.userBusy?'idle':this.phase,logicalPhase:this.phase,mode:this.mode,native:this.paused?null:this.native,expression:this.expression,bubble:this.bubble,
      activity:this.activity,dragging:this.dragging,paused:this.paused,reduced:this.reduced,speech,blink:this.reduced?1:clamp(blink,0,1)};
  }
  dispose(){this.disposed=true;this.pending=null;this.clearDecoration();}
}
