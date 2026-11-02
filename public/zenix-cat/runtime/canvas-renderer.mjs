import { layerPose, mouthWeights } from './rig-pose.mjs';
import { bodyMesh, triangleMatrix } from './body-mesh.mjs';
import { armMesh } from './arm-mesh.mjs';

export function characterViewport(width,height,{topInset=0}={}){
  const availableHeight=Math.max(1,height-topInset),scale=Math.min(width/1280,availableHeight/1740);
  return{scale,x:(width-1024*scale)/2,y:topInset+(availableHeight-1536*scale)/2,
    characterWidth:Math.min(width,1280*scale),characterHeight:Math.min(height,1680*scale+topInset)};
}

/** Articulated PNG-layer preview. Replace with Cubism renderer when a bound model exists. */
export class CanvasCharacterRenderer {
  constructor(canvas) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d',{willReadFrequently:true});
    this.layers=new Map(); this.origins=new Map(); this.scratch=document.createElement('canvas'); this.scratch.width=100; this.scratch.height=70;
    this.eyeCtx=this.scratch.getContext('2d'); this.layout={scale:1,x:0,y:0}; this.frame=null;
  }
  async load(manifestUrl=new URL('../source/v3/manifest.json',import.meta.url)) {
    const response=await fetch(manifestUrl); if(!response.ok) throw new Error('人物图层清单读取失败');
    this.manifest=await response.json();
    await Promise.all(this.manifest.layers.map(async layer=>{
      const image=new Image(); image.src=new URL(layer.file,manifestUrl).href; await image.decode(); this.layers.set(layer.id,image);this.origins.set(layer.id,layer.bounds?.slice(0,2)??[0,0]);
    }));
    return this;
  }
  resize(width,height) { this.canvas.width=Math.round(width);this.canvas.height=Math.round(height); }
  coordinates(x,y) { const l=this.layout; return {x:(x-l.x)/l.scale,y:(y-l.y)/l.scale}; }
  hitTest(x,y) {
    if(!this.frame || x<0 || y<0 || x>=this.canvas.width || y>=this.canvas.height) return false;
    return this.ctx.getImageData(Math.floor(x),Math.floor(y),1,1).data[3]>28;
  }
  transform(pose) {
    const c=this.ctx; c.translate(pose.x,pose.y);
    for(const r of pose.rotations) {c.translate(r.x,r.y);c.rotate(r.radians);c.translate(-r.x,-r.y);}
    c.globalAlpha=pose.alpha;
  }
  paint(id,ctx=this.ctx,dx=0,dy=0){const [x,y]=this.origins.get(id);ctx.drawImage(this.layers.get(id),x+dx,y+dy);}
  draw(id,pose,alpha=1) {
    if(!this.layers.has(id) || alpha<=.001) return;
    const c=this.ctx;c.save();this.transform(pose);c.globalAlpha*=alpha;
    const p=this.frame.parameters;
    if(id==='BodyCore'&&['LegL','LegR','FootL','FootR'].some(key=>Math.abs(p['ParamZenix'+key])>.005))this.drawBody(p);
    else if(/^Arm[RL]$/.test(id)&&['Arm','Forearm','Wrist'].some(key=>Math.abs(p['ParamZenix'+key+id.at(-1)])>.001))this.drawTriangles(id,armMesh([...this.origins.get(id),this.layers.get(id).naturalWidth,this.layers.get(id).naturalHeight],id.at(-1),p));
    else if(['MouthOpen','MouthO'].includes(id)){
      // One opaque mouth silhouette opens geometrically instead of stacking two full mouths.
      const open=Math.max(0,Math.min(1,p.ParamMouthOpenY));
      c.translate(509,246);c.scale(.9+open*.1,.4+open*.6);c.translate(-509,-246);this.paint(id);
    }
    else this.paint(id);
    c.restore();
  }
  drawBody(p){
    const image=this.layers.get('BodyCore'),origin=this.origins.get('BodyCore');
    this.drawTriangles('BodyCore',bodyMesh([...origin,image.naturalWidth,image.naturalHeight],p));
  }
  drawTriangles(id,triangles){
    const c=this.ctx;
    for(const triangle of triangles){
      c.save();c.beginPath();
      const center=triangle.reduce((r,v)=>({x:r.x+v.target.x/3,y:r.y+v.target.y/3}),{x:0,y:0});
      triangle.forEach((v,i)=>{
        const dx=v.target.x-center.x,dy=v.target.y-center.y,n=Math.hypot(dx,dy)||1;
        // Expand in output pixels: subpixel triangle clips otherwise expose pale seams at desktop scale.
        const overlap=1.5/this.layout.scale;
        const x=v.target.x+dx/n*overlap,y=v.target.y+dy/n*overlap;
        if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
      });
      c.closePath();c.clip();c.transform(...triangleMatrix(triangle));this.paint(id);c.restore();
    }
  }
  drawEye(side,p) {
    const c=this.ctx, ex=side==='R'?458:554, ey=198, open=p['ParamEye'+side+'Open']*(1-p['ParamEye'+side+'Smile']*.28);
    const pose=layerPose('EyeWhite'+side,p);
    c.save();this.transform(pose);c.translate(ex,ey);c.scale(1,Math.max(.015,open));c.translate(-ex,-ey);
    if(open>.035) {
      this.paint('EyeWhite'+side);
      // Clip moving iris to the actual painted sclera alpha, retaining transparent outer corners.
      const e=this.eyeCtx;e.clearRect(0,0,100,70);e.globalCompositeOperation='source-over';
      const sx=ex-50,sy=ey-35;
      e.save();e.translate(-sx,-sy);
      if(p.ParamZenixDizzy>.1){e.translate(ex,ey);e.rotate(Math.sin(this.frame.elapsed*12)*p.ParamZenixDizzy*1.3);e.translate(-ex,-ey);}
      this.paint('Iris'+side,e,p.ParamEyeBallX*5,p.ParamEyeBallY*3);e.restore();
      e.globalCompositeOperation='destination-in';this.paint('EyeWhite'+side,e,-sx,-sy);
      e.globalCompositeOperation='source-over';c.drawImage(this.scratch,sx,sy);
      this.paint('Lash'+side);
    }
    c.restore();
    if(open<.28) this.draw('ClosedEye'+side,pose,1-open/.28);
  }
  render(frame,{offsetX=0,offsetY=0,topInset=0}={}) {
    if(!this.manifest) return;
    this.frame=frame;const c=this.ctx,p=frame.parameters,w=this.canvas.width,h=this.canvas.height;
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);
    const viewport=characterViewport(w,h,{topInset}),{scale}=viewport,x=viewport.x+offsetX,y=viewport.y+offsetY;
    this.layout={scale,x,y};c.translate(x,y);c.scale(scale,scale);
    // Small squash/stretch and bounce give a chibi reaction while preserving the character design.
    c.translate(510,1536-p.ParamZenixBounce*45);c.scale(1+p.ParamZenixSquash*.045,1-p.ParamZenixSquash*.035);c.translate(-510,-1536);
    const weights=mouthWeights(p,frame.expression);
    for(const layer of this.manifest.layers) {
      const id=layer.id;
      if(/^(EyeWhite|Iris|Lash|ClosedEye)/.test(id)) {if(id.startsWith('EyeWhite'))this.drawEye(id.at(-1),p);continue;}
      const opacity=id.startsWith('Mouth')?weights[id]:1;
      this.draw(id,layerPose(id,p),opacity);
    }
  }
  dispose(){this.layers.clear();this.frame=null;this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);}
}
