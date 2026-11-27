import {CharacterController} from '../runtime/controller.mjs';
import {CanvasCharacterRenderer,characterViewport} from '../runtime/canvas-renderer.mjs';
import {AgentCharacterLink} from '../runtime/agent-link.mjs';
import {SpeechDirector} from '../runtime/speech-director.mjs';
import {MOTIONS,MOTION_LABELS} from '../runtime/catalog.mjs';
import {speechOpening} from '../runtime/rig-pose.mjs';
const canvas=document.getElementById('pet'), bridge=window.zenixDesktop, error=document.getElementById('error');
const desktop=Boolean(bridge), renderer=new CanvasCharacterRenderer(canvas), controller=new CharacterController();
const agentLink=new AgentCharacterLink(controller),embedded=new URLSearchParams(location.search).get('embed')==='1';
const speechDirector=new SpeechDirector();let lastBubbleSerial=-1;
function agentEvent(value){if(agentLink.receive(value))dirty=true;}
let paused=false,talking=false,last=performance.now(),lastPaint=0,pointer=null,raf,ignore=null,disposed=false,dirty=true,ready=false,showingPerformance=false;
const listeners=[];
function listen(target,type,fn){target.addEventListener(type,fn);listeners.push(()=>target.removeEventListener(type,fn));}
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.resize(w,h);const viewport=characterViewport(w,h,{topInset:embedded?60:0});controller.setBounds(desktop?{width:10000,height:10000,characterWidth:300,characterHeight:500}:{width:w,height:h,characterWidth:viewport.characterWidth,characterHeight:viewport.characterHeight});dirty=true;}
resize();listen(window,'resize',resize);
const command=(name)=>{
  dirty=true;
  if(name==='pause'){paused=!paused;agentLink.presentation.setSuspended(paused);last=performance.now();document.getElementById('pause').textContent=paused?'继续':'暂停';}
  else if(name==='talk'){talking=!talking;controller.setSpeaking(talking?.5:0);}
  else if(name==='wink')controller.setExpression('wink',2);
  else if(Object.hasOwn(MOTIONS,name)&&name!=='idle')controller.play(name);
};
if(!desktop&&!embedded){document.body.classList.add('browser');document.getElementById('browser-tools').hidden=false;
  resize();
  for(const name of ['hello','wave','stretch','wink','talk','pause'])listen(document.getElementById(name),'click',()=>command(name));
  const selector=document.getElementById('motion-select');
  for(const name of Object.keys(MOTIONS).filter(n=>n!=='idle')){const option=document.createElement('option');option.value=name;option.textContent=MOTION_LABELS[name]??name;selector.append(option);}
  listen(selector,'change',()=>{if(selector.value)command(selector.value);selector.value='';});
}else if(desktop)bridge.onCommand(command);
bridge?.onAgent?.(agentEvent);
if(embedded)listen(window,'message',event=>{
  if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='zenix.agent.event')return;
  agentEvent(event.data.event);
});
const pos=event=>{const r=canvas.getBoundingClientRect();return{x:(event.clientX-r.left)*canvas.width/r.width,y:(event.clientY-r.top)*canvas.height/r.height};};
function interactive(value){if(ignore===!value)return;ignore=!value;bridge?.setInteractive(value);canvas.classList.toggle('interactive',value);}
function finish(event,cancelled=false){
  if(!pointer||pointer.id!==event.pointerId)return;
  const id=pointer.id;controller.pointerUp({id,x:event.screenX,y:event.screenY,time:event.timeStamp,cancelled});
  pointer=null;canvas.classList.remove('dragging');if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
  bridge?.endDrag();
}
listen(canvas,'pointerdown',event=>{
  const pt=pos(event);if(event.button!==0||!event.isPrimary||pointer||!renderer.hitTest(pt.x,pt.y))return;
  const model=renderer.coordinates(pt.x,pt.y), region=model.y<145&&(model.x<465||model.x>550)?'ear':model.y<330?'head':model.y>1250?'foot':model.y>850&&model.y<1180&&model.x<360?'tail':(model.y>620&&(model.x<310||model.x>710))?'hand':'body';
  controller.pointerDown({id:event.pointerId,x:event.screenX,y:event.screenY,time:event.timeStamp,region});
  pointer={id:event.pointerId};canvas.setPointerCapture(event.pointerId);bridge?.beginDrag();event.preventDefault();
});
listen(canvas,'pointermove',event=>{
  const pt=pos(event),model=renderer.coordinates(pt.x,pt.y);controller.lookAt((model.x-510)/450,(198-model.y)/650);
  if(pointer?.id===event.pointerId){controller.pointerMove({id:event.pointerId,x:event.screenX,y:event.screenY,time:event.timeStamp});
    if(controller.pointer?.dragging){canvas.classList.add('dragging');bridge?.moveDrag();}
  }else interactive(renderer.hitTest(pt.x,pt.y));
});
listen(canvas,'pointerup',event=>finish(event));listen(canvas,'pointercancel',event=>finish(event,true));listen(canvas,'lostpointercapture',event=>finish(event,true));
listen(canvas,'pointerleave',()=>{if(!pointer)interactive(false);});
listen(canvas,'contextmenu',event=>{event.preventDefault();bridge?.menu();});
listen(canvas,'dblclick',()=>bridge?.openAgent?.());
const preference=matchMedia('(prefers-reduced-motion: reduce)');controller.setReducedMotion(preference.matches);
listen(preference,'change',()=>controller.setReducedMotion(preference.matches));
let lastMouse={x:-1,y:-1};
// Main process supplies local cursor coordinates even while transparent background is click-through.
bridge?.onCursor(({x,y})=>{lastMouse={x,y};if(!pointer)interactive(renderer.hitTest(x,y));});
try{
  await renderer.load();
  controller.greet();last=performance.now();
  const paint=(now)=>{
    if(disposed)return;raf=requestAnimationFrame(paint);
    if(now-lastPaint<1000/30)return;
    const dt=Math.min(.1,(now-last)/1000);last=now;lastPaint=now;
    if(paused&&!dirty)return;
    const frame=paused&&controller.snapshot?controller.snapshot:controller.update(dt);dirty=false;
    if(!paused){
      const local=speechDirector.current,context=local?.context??'';
      const friendly=local&&frame.elapsed<local.until&&!/^(drag|recover|idle|agent-)/.test(context);
      controller.setSpeaking(!controller.reducedMotion&&(talking||friendly)?speechOpening(frame.elapsed):0);
    }
    // Desktop window follows the OS cursor; browser preview keeps the character inside its canvas.
    renderer.render(frame,desktop?{}:{offsetX:frame.position.x,offsetY:frame.position.y,topInset:embedded?60:0});
    if(!ready){ready=true;bridge?.ready();if(embedded)parent.postMessage({type:'zenix.character.ready'},location.origin);}
    const bubble=speechDirector.update(frame,{mode:agentLink.mode}),answerBubble=agentLink.presentation.bubbleText,speech=document.getElementById('speech');
    if(answerBubble){if(speech.textContent!==answerBubble)speech.textContent=answerBubble;speech.hidden=false;speech.dataset.performance='answer';speech.dataset.tone='answer';showingPerformance=true;}
    else{
      if(showingPerformance){showingPerformance=false;delete speech.dataset.performance;lastBubbleSerial=-1;}
      speech.hidden=!bubble;
      if(bubble&&bubble.serial!==lastBubbleSerial){
        lastBubbleSerial=bubble.serial;speech.textContent=bubble.text;speech.dataset.tone=bubble.tone;speech.dataset.context=bubble.context;
        if(!controller.reducedMotion)speech.animate?.([{opacity:.35},{opacity:1}],{duration:160});
      }
    }
    if(desktop&&!pointer)interactive(renderer.hitTest(lastMouse.x,lastMouse.y));
    document.getElementById('state').textContent=paused?'已暂停':(MOTION_LABELS[frame.state]??frame.state);
  };raf=requestAnimationFrame(paint);
}catch(e){error.hidden=false;error.textContent=`人物载入失败：${e.message}。请用桌面启动脚本重试；详细信息见项目 desktop/README.md。`;bridge?.loadFailed(String(e));}
listen(document,'visibilitychange',()=>{last=performance.now();if(document.hidden&&pointer)finish({pointerId:pointer.id},true);});
const canvasObserver=new ResizeObserver(resize);canvasObserver.observe(canvas);
listen(window,'pagehide',()=>{disposed=true;cancelAnimationFrame(raf);canvasObserver.disconnect();if(pointer)finish({pointerId:pointer.id},true);for(const off of listeners)off();speechDirector.dispose();agentLink.dispose();controller.dispose();renderer.dispose();},{once:true});
Object.defineProperty(window,'zenixPetSnapshot',{get:()=>({loaded:Boolean(renderer.manifest),paused,frame:controller.snapshot,layers:renderer.layers.size,desktop,agent:agentLink.snapshot,layout:{...renderer.layout},bubble:speechDirector.current?{...speechDirector.current}:null})});
