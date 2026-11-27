import {CharacterState} from '../../tsuyukusa-021/runtime/character-state.mjs';
import {pageContext,welcomeText} from '../runtime/page-context.mjs';
const embedded=new URLSearchParams(location.search).get('embed')==='1',$=id=>document.getElementById(id),abort=new AbortController();
const companion=new URLSearchParams(location.search).get('companion')==='1';let currentPage=null,pendingPage=null;
const listen=(target,type,fn,options={})=>target.addEventListener(type,fn,{...options,signal:abort.signal});
const preference=matchMedia('(prefers-reduced-motion: reduce)'),labels={smile:'微笑',shy:'害羞',wink:'眨眼'};
let app,model,state,profile,loaded=false,disposed=false,frame,parameterIDs=new Set(),defaults=new Map(),currentNative=0,idleIndex=0,idlePending=false,idleActive=false,idleGeneration=0,parameters={},drag=null,offset={x:0,y:0},focus={x:0,y:0},baseSize;
const core=()=>model.internalModel.coreModel;
const put=(id,value)=>{if(parameterIDs.has(id))core().setParamFloat(id,value);};
const get=id=>parameterIDs.has(id)?core().getParamFloat(id):undefined;
function resetMotion(){if(!model)return;idleGeneration++;model.internalModel.motionManager.stopAllMotions();for(const [id,value]of defaults)put(id,value);core().saveParam();currentNative=0;idlePending=false;idleActive=false;}
function resize(){
 if(!app||!model)return;const r=$('stage').getBoundingClientRect(),width=Math.max(1,r.width),height=Math.max(1,r.height);app.renderer.resize(width,height);
 const scale=Math.min(width*.9/baseSize.width,Math.max(1,height-56)*.95/baseSize.height);model.scale.set(scale);model.anchor.set(.5,.5);
 const lx=Math.max(0,(width-baseSize.width*scale)/2-8),ly=Math.max(0,(height-56-baseSize.height*scale)/2-8);offset.x=Math.max(-lx,Math.min(lx,offset.x));offset.y=Math.max(-ly,Math.min(ly,offset.y));model.position.set(width/2+offset.x,56+(height-56)/2+offset.y);
}
function bubble(){const b=state?.frame().bubble,node=$('bubble');node.hidden=!b;if(b){node.textContent=b.text;node.dataset.tone=b.tone;}}
function pose(){
 const f=frame;if(!f)return;const age=f.activity?f.now-f.activity.started:0;
 if(f.reduced||f.paused)for(const [id,value]of defaults)put(id,value);
 // Authored .mtn curves retain control of the whole pose, including face and mouth.
 if(!f.native){
  const x=f.reduced?0:focus.x,y=f.reduced?0:focus.y;
  if(!idleActive){put('PARAM_ANGLE_X',x*6);put('PARAM_ANGLE_Y',y*4);put('PARAM_ANGLE_Z',f.phase==='thinking'?2:0);put('PARAM_BREATH',f.reduced?.5:.5+Math.sin(f.now*1.6)*.15);put('PARAM_EYE_L_OPEN',f.blink);put('PARAM_EYE_R_OPEN',f.blink);}
  if(f.activity?.name==='nod')put('PARAM_ANGLE_Y',Math.sin(age*5)*5);
  if(f.activity?.name==='look')put('PARAM_ANGLE_X',Math.sin(age*3.5)*8);
  if(f.activity?.name==='wink'||f.expression?.name==='wink')put('PARAM_EYE_L_OPEN',0);
  if(f.bubble)put('PARAM_MOUTH_OPEN_Y',f.speech);
  put('PARAM_EYE_BALL_X',x*.3);put('PARAM_EYE_BALL_Y',y*.2);
 }
 if(f.dragging||f.expression?.name==='shy'){put('PARAM_CHEEK',.75);put('PARAM_ANGLE_Z',-3);}
 if(f.expression?.name==='smile'){put('PARAM_MOUTH_FORM',.65);put('PARAM_EYE_L_SMILE',.5);put('PARAM_EYE_R_SMILE',.5);}
 parameters=Object.fromEntries([...parameterIDs].map(id=>[id,get(id)]));
}
function tick(){
 if(!loaded||disposed)return;
 if(pendingPage){if(state.now-pendingPage.time>12)pendingPage=null;else if(state.ambient(pendingPage.action,pendingPage.text))pendingPage=null;}
 frame=state.frame();const manager=model.internalModel.motionManager;
 if(frame.native&&frame.native.sequence!==currentNative){resetMotion();const cue=frame.native;currentNative=cue.sequence;void model.motion(cue.group,cue.index,3).catch(()=>{if(!disposed&&currentNative===cue.sequence){state.native=null;resetMotion();state.show('这次动作未能载入。','thought');}});}
 else if(!frame.native&&currentNative)resetMotion();
 const idleAllowed=!frame.native&&!frame.paused&&!frame.reduced&&!frame.dragging&&!frame.activity&&!frame.expression;
 if(!idleAllowed&&idleActive&&!frame.native)resetMotion();
 if(idleAllowed&&!idlePending&&manager.isFinished()){
  idlePending=true;idleActive=true;const generation=idleGeneration,index=idleIndex++%2;
  void model.motion('idle',index,1).then(started=>{if(!disposed&&generation===idleGeneration){idlePending=false;if(!started)idleActive=false;}}).catch(()=>{if(!disposed&&generation===idleGeneration){idlePending=false;idleActive=false;}});
 }
 model.update(Math.min(100,app.ticker.deltaMS));bubble();$('phase').textContent=frame.dragging?'轻轻拖动':frame.native?frame.native.label:({idle:'悠闲待机',thinking:'查找说明',presenting:'展示回答',error:'本次未完成',cancelled:'已停止'}[frame.phase]??'待机');
}
function renderRest(){if(!loaded)return;resetMotion();frame=state.frame();model.update(0);app.renderer.render(app.stage);bubble();}
function finish(cancelled=false){if(!drag)return;const d=drag;drag=null;$('model').classList.remove('dragging');if($('model').hasPointerCapture(d.id))$('model').releasePointerCapture(d.id);if(d.moved)state.drag(false);else if(!cancelled)state.touch();bubble();}
const observer=new ResizeObserver(resize);observer.observe($('stage'));
listen(window,'message',event=>{if(!loaded||!embedded||event.source!==parent||event.origin!==location.origin||event.data?.type!=='zenix.agent.event')return;if(state.receive(event.data.event)){if(!state.native)resetMotion();bubble();}});
listen(window,'message',event=>{
 if(!loaded||!embedded||!companion||event.source!==parent||event.origin!==location.origin)return;
 if(event.data?.type==='zenix.companion.pointer'){
  const {x,y}=event.data;if(Number.isFinite(x)&&Number.isFinite(y))focus={x:Math.max(-.8,Math.min(.8,x)),y:Math.max(-.8,Math.min(.8,y))};
 }
 if(event.data?.type==='zenix.companion.context'){
  const context=pageContext(event.data.path);if(!context||(context.path===currentPage&&event.data.replay!==true))return;currentPage=context.path;
  pendingPage={...context,text:event.data.greet===true?welcomeText:context.text,time:state.now};
 }
});
listen(preference,'change',()=>{state?.setReduced(preference.matches);if(loaded&&preference.matches)renderRest();});
listen(document,'visibilitychange',()=>{if(!loaded)return;if(document.hidden){finish(true);app.ticker.stop();}else if(!state.paused)app.ticker.start();});
listen(window,'pagehide',()=>{disposed=true;abort.abort();state?.dispose();observer.disconnect();if(app)app.destroy(true,{children:true,texture:true,baseTexture:true});else if(model&&!model.destroyed)model.destroy({children:true,texture:true,baseTexture:true});model=null;},{once:true});
listen($('retry'),'click',()=>location.reload());
listen($('model'),'pointerdown',event=>{
 if(!loaded||state.paused||drag||event.button!==0||!event.isPrimary)return;const r=$('model').getBoundingClientRect();app.renderer.render(app.stage);const pixel=new Uint8Array(4),gl=app.renderer.gl;gl.readPixels(Math.floor(event.clientX-r.left),app.renderer.height-Math.floor(event.clientY-r.top)-1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);if(pixel[3]<=28)return;
 drag={id:event.pointerId,x:event.clientX,y:event.clientY,offset:{...offset},moved:false};$('model').setPointerCapture(event.pointerId);event.preventDefault();
});
listen($('model'),'pointermove',event=>{
 const r=$('model').getBoundingClientRect();focus={x:Math.max(-.8,Math.min(.8,(event.clientX-r.left-r.width/2)/(r.width/2))),y:Math.max(-.8,Math.min(.8,(event.clientY-r.top-r.height/2)/(r.height/2)))};
 if(drag?.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)>7){drag.moved=true;state.drag(true);resetMotion();$('model').classList.add('dragging');}if(drag.moved){offset={x:drag.offset.x+dx,y:drag.offset.y+dy};resize();bubble();}
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])listen($('model'),type,event=>{if(drag?.id===event.pointerId)finish(type!=='pointerup');});
listen($('model'),'pointerleave',()=>{if(!drag)focus={x:0,y:0};});
if(!embedded){document.body.classList.add('standalone');$('controls').hidden=false;}
for(const control of $('controls').querySelectorAll('button,select'))control.disabled=true;
try{
 if(!window.PIXI?.live2d?.Live2DModel)throw Error('Cubism 2 本地运行库未载入');
 const r=await fetch('/17hwliao-blog/live2d/unitychan/model-config.json',{signal:abort.signal});if(!r.ok)throw Error('Unity-Chan 资源未配置');profile=await r.json();if(profile.id!=='unitychan'||profile.modelURL!=='/17hwliao-blog/live2d/unitychan/unitychan.model.json'||profile.nativeActions.length!==16)throw Error('模型资源不完整');
 parameterIDs=new Set(profile.parameterIDs);state=new CharacterState({actions:profile.nativeActions,expressionLabels:labels,greetingAction:'m-1',agentNativeActions:{hello:'m-1',happyNod:'m-1',headShake:'m-2'},shyExpression:'shy'});state.setReduced(preference.matches);
 const candidate=await PIXI.live2d.Live2DModel.from(profile.modelURL,{autoInteract:false,autoUpdate:false,autoFocus:false,motionPreload:'NONE'});
 if(disposed)candidate.destroy({children:true,texture:true,baseTexture:true});else{
  model=candidate;const manager=model.internalModel.motionManager;
  // Idle selection belongs to this controller so pause/reduced motion can suppress it.
  manager.state.shouldRequestIdleMotion=()=>false;
  for(const id of parameterIDs)defaults.set(id,get(id));
  for(const a of profile.nativeActions){if(!await manager.loadMotion(a.group,a.index))throw Error('缺少原生动作：'+a.file);if(disposed)break;}
  if(disposed){if(!candidate.destroyed)candidate.destroy({children:true,texture:true,baseTexture:true});}else{
   baseSize={width:model.width,height:model.height};app=new PIXI.Application({view:$('model'),width:100,height:100,backgroundAlpha:0,antialias:true});app.ticker.maxFPS=30;app.stage.addChild(model);model.internalModel.on('beforeModelUpdate',pose);resize();app.ticker.add(tick);loaded=true;$('loading').hidden=true;
   if(!embedded){
    for(const action of profile.nativeActions){const button=document.createElement('button');button.textContent=action.label;button.dataset.action=action.id;listen(button,'click',()=>{if(state.local(action.id))resetMotion();bubble();});$('motion-controls').append(button);}
    for(const [value,label]of Object.entries(labels)){const option=document.createElement('option');option.value=value;option.textContent=label;$('expression').append(option);}
    listen($('expression'),'change',()=>{state.setExpression($('expression').value);renderRest();$('expression').value='';});
    listen($('reset'),'click',()=>{state.pending=null;state.phase='idle';state.clearDecoration();renderRest();});
    listen($('pause'),'click',()=>{state.setPaused(!state.paused);renderRest();$('pause').textContent=state.paused?'继续':'暂停';if(state.paused)app.ticker.stop();else if(!document.hidden)app.ticker.start();});
    for(const control of $('controls').querySelectorAll('button,select'))control.disabled=false;
   }
   if(!companion)state.greet();if(document.hidden)app.ticker.stop();if(embedded)parent.postMessage({type:'zenix.character.ready',motions:['hello','happyNod','headShake','lookAround','shyPeek'],modelId:'unitychan'},location.origin);
  }
 }
}catch(error){if(!disposed){$('loading').hidden=true;$('error').hidden=false;$('error-text').textContent=companion?'人物暂未载入，稍后再试。':'Unity-Chan 暂未载入：'+error.message+'。问答仍可使用。';if(model&&!app&&!model.destroyed)model.destroy({children:true,texture:true,baseTexture:true});}}
Object.defineProperty(window,'nativeCharacterSnapshot',{get:()=>({loaded,modelId:'unitychan',runtime:'Cubism 2.1',page:currentPage,focus:{...focus},frame:state?.frame(),parameters:{...parameters},nativeMotionCount:14,idleMotionCount:2,nativeExpressionCount:0,parameterExpressionCount:3,motionEnginePlaying:loaded&&!disposed?!model.internalModel.motionManager.isFinished():false,idleActive,offset:{...offset}})});
