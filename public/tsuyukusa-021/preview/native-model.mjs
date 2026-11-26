import {CharacterState,AGENT_MOTIONS,NATIVE_ACTIONS,EXPRESSIONS} from '../runtime/character-state.mjs';
const embedded=new URLSearchParams(location.search).get('embed')==='1',state=new CharacterState(),abort=new AbortController();
const $=id=>document.getElementById(id),listen=(target,type,fn,options={})=>target.addEventListener(type,fn,{...options,signal:abort.signal});
let app,model,disposed=false,loaded=false,currentNative=0,frame,parameters={},drag=null,offset={x:0,y:0},focus={x:0,y:0},baseSize;
const expressionData=new Map(),nativeParameterIDs=new Set();
const params=()=>model?.internalModel.coreModel;
function put(id,value){const core=params();if(core.getParameterIndex(id)>=0)core.setParameterValueById(id,value);}
function get(id){const core=params();return core.getParameterIndex(id)>=0?core.getParameterValueById(id):undefined;}
function resetNative(){if(!model)return;model.internalModel.motionManager.stopAllMotions();for(const id of nativeParameterIDs){const core=params(),index=core.getParameterIndex(id);if(index>=0)core.setParameterValueByIndex(index,core.getParameterDefaultValue(index));}currentNative=0;}
function resize(){
  if(!app||!model)return;
  const rect=$('stage').getBoundingClientRect(),width=Math.max(1,rect.width),height=Math.max(1,rect.height);app.renderer.resize(width,height);
  const scale=Math.min(width*.82/baseSize.width,Math.max(1,height-60)*.94/baseSize.height);
  model.scale.set(scale);model.anchor.set(.5,.5);
  const limitX=Math.max(0,(width-baseSize.width*scale)/2-12),limitY=Math.max(0,(height-60-baseSize.height*scale)/2-10);
  offset.x=Math.max(-limitX,Math.min(limitX,offset.x));offset.y=Math.max(-limitY,Math.min(limitY,offset.y));
  model.x=width/2+offset.x;model.y=60+(height-60)/2+offset.y;
}
function bubble(){const value=state.frame().bubble,node=$('bubble');node.hidden=!value;if(value){node.textContent=value.text;node.dataset.tone=value.tone;}}
function pose(){
  const f=frame;if(!f)return;
  const age=f.activity?f.now-f.activity.started:0;
  const gaze=f.reduced?{x:0,y:0}:f.dragging?{x:-.18,y:.1}:f.phase==='thinking'?{x:.2,y:.12}:focus;
  put('ParamAngleX',gaze.x*7+(f.activity?.name==='look'?Math.sin(age*3.5)*5:0));put('ParamAngleY',gaze.y*4);
  put('ParamAngleZ',f.dragging?-3:f.phase==='thinking'?2:f.activity?.name==='nod'?Math.sin(age*5)*2:0);
  put('ParamBreath',f.reduced?.5:.5+Math.sin(f.now*1.6)*.18);
  put('ParamEyeBallX',gaze.x*.35);put('ParamEyeBallY',gaze.y*.25);
  put('ParamEyeLOpen',f.activity?.name==='wink'?0:f.blink);put('ParamEyeROpen',f.blink);
  put('ParamMouthOpenY',f.speech);put('ParamMouthForm',f.phase==='presenting'?.25:0);
  if(f.dragging)put('ParamCheek',.65);
  if(f.expression){
    const definition=expressionData.get(f.expression.name),weight=Math.min(1,(f.expression.until-f.now)/.35);
    for(const p of definition?.Parameters??[]){const base=get(p.Id);if(base===undefined)continue;const v=p.Blend==='Multiply'?base*(1+(p.Value-1)*weight):p.Blend==='Overwrite'?base+(p.Value-base)*weight:base+p.Value*weight;put(p.Id,v);}
  }
  parameters=Object.fromEntries(['ParamArmR','ParamUArmR','ParamArmL','ParamMouthOpenY','ParamEyeLOpen','ParamEyeROpen','ParamCheek','ParamAozame','ParamEyeEffect','ParamEyeEffect2','ParamEyeEffect3','ParamEyeHighLight','ParamAngryMark','ParamKirakiraMark','Param2'].map(id=>[id,get(id)]));
}
function stop(){resetNative();state.clearDecoration();bubble();if(app&&!disposed){frame=state.frame();model.update(0);app.renderer.render(app.stage);}}
async function playNative(cue){
  const sequence=cue.sequence;currentNative=sequence;
  try{await model.motion('',cue.index,3);if(!disposed&&currentNative===sequence&&state.frame().native?.sequence!==sequence)resetNative();}
  catch(error){if(!disposed){state.native=null;resetNative();state.show('这个动作暂时没有载入。','thought');bubble();}}
}
function tick(){
  if(disposed||!loaded)return;
  frame=state.frame();
  if(frame.native&&frame.native.sequence!==currentNative)void playNative(frame.native);
  else if(!frame.native&&currentNative)resetNative();
  model.update(Math.min(100,app.ticker.deltaMS));bubble();
  $('phase').textContent=frame.dragging?'轻轻拖动':({idle:'悠闲待机',thinking:'查找说明',presenting:'展示回答',error:'本次未完成',cancelled:'已停止'}[frame.phase]??'待机');
}
function togglePause(){if(!loaded)return;state.setPaused(!state.paused);stop();$('pause').textContent=state.paused?'继续':'暂停';if(state.paused)app.ticker.stop();else if(!document.hidden)app.ticker.start();}
const preference=matchMedia('(prefers-reduced-motion: reduce)');state.setReduced(preference.matches);
listen(preference,'change',()=>{state.setReduced(preference.matches);if(state.reduced)resetNative();});
listen(window,'message',event=>{if(!embedded||event.source!==parent||event.origin!==location.origin||event.data?.type!=='zenix.agent.event')return;if(state.receive(event.data.event)){if(!state.native)resetNative();bubble();}});
listen(window,'pagehide',()=>{disposed=true;abort.abort();state.dispose();observer.disconnect();if(app)app.destroy(true,{children:true,texture:true,baseTexture:true});else if(model&&!model.destroyed)model.destroy({children:true,texture:true,baseTexture:true});model=null;},{once:true});
listen(document,'visibilitychange',()=>{if(!app)return;if(document.hidden){if(drag)finish(true);app.ticker.stop();}else if(!state.paused)app.ticker.start();});
listen($('retry'),'click',()=>location.reload());
const observer=new ResizeObserver(resize);observer.observe($('stage'));
function finish(cancelled=false){
  if(!drag)return;const id=drag.id,moved=drag.moved;drag=null;$('model').classList.remove('dragging');if($('model').hasPointerCapture(id))$('model').releasePointerCapture(id);
  if(moved)state.drag(false);else if(!cancelled)state.touch();bubble();
}
listen($('model'),'pointerdown',event=>{
  if(event.button!==0||!event.isPrimary||drag||!loaded||state.paused)return;
  const r=$('model').getBoundingClientRect(),x=event.clientX-r.left,y=event.clientY-r.top;
  // This author model has no HitAreas. Test the rendered alpha rather than inventing a clickable rectangle.
  app.renderer.render(app.stage);const pixel=new Uint8Array(4),gl=app.renderer.gl;
  gl.readPixels(Math.floor(x),app.renderer.height-Math.floor(y)-1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
  if(pixel[3]<=28)return;
  drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,offset:{...offset},moved:false};$('model').setPointerCapture(event.pointerId);event.preventDefault();
});
listen($('model'),'pointermove',event=>{
  const r=$('model').getBoundingClientRect();focus={x:Math.max(-.8,Math.min(.8,(event.clientX-r.left-r.width/2)/(r.width/2))),y:Math.max(-.8,Math.min(.8,(event.clientY-r.top-r.height/2)/(r.height/2)))};
  if(drag?.id!==event.pointerId)return;
  const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
  if(!drag.moved&&Math.hypot(dx,dy)>7){drag.moved=true;state.drag(true);resetNative();$('model').classList.add('dragging');}
  if(drag.moved){offset={x:drag.offset.x+dx,y:drag.offset.y+dy};resize();bubble();}
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])listen($('model'),type,event=>{if(drag?.id===event.pointerId)finish(type!=='pointerup');});
listen($('model'),'pointerleave',()=>{if(!drag)focus={x:0,y:0};});
if(!embedded){
  document.body.classList.add('standalone');$('controls').hidden=false;
  for(const action of NATIVE_ACTIONS){const button=document.createElement('button');button.textContent=action.label;button.dataset.action=action.id;listen(button,'click',()=>{if(state.local(action.id))resetNative();bubble();});$('motion-controls').append(button);}
  for(const [value,label]of Object.entries(EXPRESSIONS)){const option=document.createElement('option');option.value=value;option.textContent=label;$('expression').append(option);}
  listen($('expression'),'change',()=>{state.setExpression($('expression').value);resetNative();bubble();$('expression').value='';});
  listen($('reset'),'click',()=>{state.pending=null;state.phase='idle';stop();});listen($('pause'),'click',togglePause);
  for(const control of $('controls').querySelectorAll('button,select'))control.disabled=true;
}
try{
  if(!window.PIXI?.live2d?.Live2DModel)throw Error('本地 Live2D 运行库未加载');
  const response=await fetch('/live2d/tsuyukusa-021/model-config.json',{signal:abort.signal});if(!response.ok)throw Error('尚未导入 021.zip');const config=await response.json();
  if(config.id!=='tsuyukusa-021'||config.modelURL!=='/live2d/tsuyukusa-021/021.model3.json')throw Error('模型配置与所选资源不一致');
  const loadedModel=await PIXI.live2d.Live2DModel.from(config.modelURL,{autoInteract:false,autoUpdate:false,autoFocus:false});
  if(disposed){loadedModel.destroy({children:true,texture:true,baseTexture:true});}else{
    model=loadedModel;const manager=model.internalModel.motionManager;
    for(const a of NATIVE_ACTIONS){const motion=await manager.loadMotion('',a.index);if(!motion)throw Error('原生动作未加载：'+a.label);motion.setIsLoop(false);
      const data=await fetch(new URL(a.file,new URL(config.modelURL,location.href)),{signal:abort.signal}).then(r=>{if(!r.ok)throw Error('动作数据缺失');return r.json();});for(const curve of data.Curves??[])if(curve.Target==='Parameter')nativeParameterIDs.add(curve.Id);}
    for(const item of config.expressions){const data=await fetch(new URL(item.file,new URL(config.modelURL,location.href)),{signal:abort.signal}).then(r=>{if(!r.ok)throw Error('表情数据缺失');return r.json();});expressionData.set(item.name,data);}
    if(disposed){if(!loadedModel.destroyed)loadedModel.destroy({children:true,texture:true,baseTexture:true});}else{
      baseSize={width:model.width,height:model.height};app=new PIXI.Application({view:$('model'),width:100,height:100,backgroundAlpha:0,antialias:true});app.ticker.maxFPS=30;
      app.stage.addChild(model);model.internalModel.on('beforeModelUpdate',pose);resize();app.ticker.add(tick);loaded=true;$('loading').hidden=true;for(const control of $('controls').querySelectorAll('button,select'))control.disabled=false;state.greet();
      if(embedded)parent.postMessage({type:'zenix.character.ready',motions:AGENT_MOTIONS,modelId:'tsuyukusa-021'},location.origin);
    }
  }
}catch(error){
  if(!disposed){$('loading').hidden=true;$('error').hidden=false;$('error-text').textContent='人物暂未载入：'+error.message+'。问答仍可使用。';if(model&&!app)model.destroy({children:true,texture:true,baseTexture:true});}
}
Object.defineProperty(window,'nativeCharacterSnapshot',{get:()=>({loaded,modelId:'tsuyukusa-021',frame:state.frame(),parameters:{...parameters},nativeMotionCount:NATIVE_ACTIONS.length,expressionCount:expressionData.size,offset:{...offset}})});
