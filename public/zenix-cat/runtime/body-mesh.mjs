const rad=Math.PI/180,clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
function rotated(x,y,cx,cy,degrees){const a=degrees*rad,c=Math.cos(a),s=Math.sin(a);return{x:cx+(x-cx)*c-(y-cy)*s,y:cy+(x-cx)*s+(y-cy)*c};}
/** Continuous geometric warp of existing pants/shoes. No new artwork or hidden-region painting. */
export function bodyVertex(x,y,p){
  if(y<=800)return{x,y};
  const seam=545+(y-850)*.13,rightWeight=1-smooth((x-seam+100)/200),hipWeight=smooth((y-800)/120);
  const side=side=>{
    const right=side==='R',hipX=right?430:620,ankleX=right?475:750;
    // Inward kicks are smaller so the continuous cloth bridge cannot cross itself.
    const rawLeg=p['ParamZenixLeg'+side],leg=rawLeg<0?rawLeg*.22:rawLeg,foot=p['ParamZenixFoot'+side];
    const legPoint=rotated(x,y,hipX,815,leg*13*(right?1:-1)*hipWeight);
    const ankle=rotated(ankleX,1410,hipX,815,leg*13*(right?1:-1));
    const point=rotated(legPoint.x,legPoint.y,ankle.x,ankle.y,foot*14*smooth((y-1320)/150));
    point.y-=Math.abs(leg)*38*smooth((y-950)/500);return point;
  };
  const r=side('R'),l=side('L');return{x:l.x+(r.x-l.x)*rightWeight,y:l.y+(r.y-l.y)*rightWeight};
}
export function bodyMesh(bounds,p){
  const [left,top,width,height]=bounds,bottom=top+height;
  const xs=Array.from({length:9},(_,i)=>left+width*i/8);
  const ys=[top,...[750,800,860,940,1050,1200,1320,1410,1480].filter(y=>y>top&&y<bottom),bottom];
  const grid=ys.map(y=>xs.map(x=>({source:{x,y},target:bodyVertex(x,y,p)}))),triangles=[];
  for(let r=0;r<ys.length-1;r++)for(let c=0;c<xs.length-1;c++){
    const a=grid[r][c],b=grid[r][c+1],d=grid[r+1][c],e=grid[r+1][c+1];triangles.push([a,b,e],[a,e,d]);
  }
  return triangles;
}
export function triangleMatrix(triangle){
  const [a,b,c]=triangle,s=a.source,t=a.target,ux=b.source.x-s.x,uy=b.source.y-s.y,vx=c.source.x-s.x,vy=c.source.y-s.y;
  const dx=b.target.x-t.x,dy=b.target.y-t.y,ex=c.target.x-t.x,ey=c.target.y-t.y,det=ux*vy-uy*vx;
  if(Math.abs(det)<1e-8)throw new Error('Degenerate body triangle');
  const aa=(dx*vy-ex*uy)/det,cc=(ex*ux-dx*vx)/det,bb=(dy*vy-ey*uy)/det,dd=(ey*ux-dy*vx)/det;
  return[aa,bb,cc,dd,t.x-aa*s.x-cc*s.y,t.y-bb*s.x-dd*s.y];
}
