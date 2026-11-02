import {VarietyPicker} from './variety-picker.mjs';
import {SPEECH} from './speech-catalog.mjs';
const urgent=state=>['dragging','recover','agent-thinking','agent-presenting','agent-error','agent-cancelled'].includes(state);
export class SpeechDirector {
  constructor({random=Math.random}={}){
    this.picker=new VarietyPicker(random);this.current=null;this.serial=0;this.lastAt=-Infinity;this.lastCue=null;this.nextRepeat=Infinity;this.nextIdle=28;this.disposed=false;
  }
  context(frame,mode){
    if(frame.state==='agent-presenting')return SPEECH['agent-presenting-'+mode]?'agent-presenting-'+mode:'agent-presenting-no-evidence';
    if(frame.state==='dragging')return frame.dragAge>3.5?(frame.dragIntensity>.5?'drag-sway':'drag-hold'):'dragging';
    return frame.state;
  }
  update(frame,{mode='retrieval-only'}={}){
    if(this.disposed)return null;
    const now=frame.elapsed,ctx=this.context(frame,mode),key=`${frame.state}:${frame.cue??frame.state}:${frame.state==='agent-presenting'?mode:''}`;
    if(frame.state==='idle'){
      if(this.lastCue!==key){this.current=null;this.lastCue=key;this.nextIdle=Math.max(this.nextIdle,now+22);}
      if(now>=this.nextIdle&&!frame.reducedMotion){this.show('idle',key,now,3);this.nextIdle=now+38;}
    }else if(SPEECH[ctx]){
      const changed=key!==this.lastCue;
      const repeat=(frame.state==='dragging'||frame.state==='agent-thinking')&&now>=this.nextRepeat;
      // Click bursts keep only the latest visible reaction; real request/drag boundaries are immediate.
      if((changed&&(urgent(frame.state)||now-this.lastAt>=.65))||(!changed&&repeat)){
        this.show(ctx,key,now,frame.state==='agent-thinking'?4:3.2);
        this.nextRepeat=now+(frame.state==='agent-thinking'?8:6.5);
      }
    }else{this.current=null;this.lastCue=key;}
    if(this.current&&now>=this.current.until)this.current=null;
    return this.current?{...this.current}:null;
  }
  show(context,key,now,duration){
    const entry=SPEECH[context],text=this.picker.next(context,entry.lines);
    this.current={text,tone:entry.tone,context,serial:++this.serial,until:now+duration};this.lastCue=key;this.lastAt=now;
  }
  dispose(){this.disposed=true;this.current=null;this.picker.clear();}
}
