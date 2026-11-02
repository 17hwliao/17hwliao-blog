const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
export const ARM_JOINTS=Object.freeze({
  R:{shoulder:{x:370,y:460},elbow:{x:353,y:637},wrist:{x:304,y:801}},
  L:{shoulder:{x:654,y:460},elbow:{x:671,y:637},wrist:{x:720,y:801}},
});
function turn(point,pivot,degrees){const a=degrees*Math.PI/180,c=Math.cos(a),s=Math.sin(a),x=point.x-pivot.x,y=point.y-pivot.y;return{x:pivot.x+x*c-y*s,y:pivot.y+x*s+y*c};}
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
/** One painted limb, continuously skinned across elbow/wrist; no independently scaled cut pieces. */
export function armVertex(x,y,side,p){
  const joints=ARM_JOINTS[side],direction=side==='R'?1:-1;
  let point={x,y};
  point=mix(point,turn(point,joints.wrist,p['ParamZenixWrist'+side]*22*direction),smooth((y-joints.wrist.y+24)/48));
  point=mix(point,turn(point,joints.elbow,p['ParamZenixForearm'+side]*78*direction),smooth((y-joints.elbow.y+38)/76));
  return turn(point,joints.shoulder,p['ParamZenixArm'+side]*67*direction);
}
export function armMesh(bounds,side,p){
  const [left,top,width,height]=bounds,columns=4,rows=28;
  const grid=Array.from({length:rows+1},(_,r)=>Array.from({length:columns+1},(_,c)=>{
    const x=left+width*c/columns,y=top+height*r/rows;return{source:{x,y},target:armVertex(x,y,side,p)};
  }));
  const triangles=[];
  for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){const a=grid[r][c],b=grid[r][c+1],d=grid[r+1][c],e=grid[r+1][c+1];triangles.push([a,b,e],[a,e,d]);}
  return triangles;
}
