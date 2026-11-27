/** Small per-context shuffle bags. A full bag is used before reshuffling; adjacent picks never repeat. */
export class VarietyPicker {
  constructor(random=Math.random){this.random=random;this.bags=new Map();}
  shuffle(values){
    const result=[...values];
    for(let i=result.length-1;i>0;i--){const r=this.random(),n=Number.isFinite(r)?Math.min(.999999,Math.max(0,r)):.5,j=Math.floor(n*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  next(key,values,{first=false}={}){
    if(!values.length)return null;
    const signature=JSON.stringify(values);let bag=this.bags.get(key);
    if(!bag||bag.signature!==signature){
      bag={signature,remaining:this.shuffle(first?values.slice(1):values),last:null};this.bags.set(key,bag);
      if(first){bag.last=values[0];return values[0];}
    }
    if(!bag.remaining.length){
      bag.remaining=this.shuffle(values);
      if(bag.remaining.length>1&&bag.remaining[0]===bag.last)[bag.remaining[0],bag.remaining[1]]=[bag.remaining[1],bag.remaining[0]];
    }
    const next=bag.remaining.shift();bag.last=next;return next;
  }
  clear(){this.bags.clear();}
}
