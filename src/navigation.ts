export type Point={x:number;y:number};
type Walkable=(x:number,y:number)=>boolean;

/** Sweep the player's collision footprint, including between tile centres. */
export function clearPath(from:Point,to:Point,walkable:Walkable){
 const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/4));
 for(let i=1;i<=steps;i++)if(!walkable(from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps))return false;
 return true;
}

/** Find a safe route, or the closest reachable floor when a click hits stone/a locked crossing. */
export function findPath(from:Point,to:Point,width:number,height:number,walkable:Walkable):Point[]{
 if(![from.x,from.y,to.x,to.y].every(Number.isFinite))return [];
 to={x:Math.max(0,Math.min(width*32,to.x)),y:Math.max(0,Math.min(height*32,to.y))};
 if(clearPath(from,to,walkable))return [{...to}];
 const point=(i:number)=>({x:(i%width)*32+16,y:Math.floor(i/width)*32+16});
 const startX=Math.floor(from.x/32),startY=Math.floor(from.y/32);
 const parents=new Int32Array(width*height).fill(-2),queue:number[]=[];
 // Seed visible neighbours as well: a player standing near a corner may not reach its tile centre.
 for(let y=startY-1;y<=startY+1;y++)for(let x=startX-1;x<=startX+1;x++){
  if(x<0||y<0||x>=width||y>=height)continue;
  const i=y*width+x,p=point(i);
  if(walkable(p.x,p.y)&&clearPath(from,p,walkable)){parents[i]=-1;queue.push(i);}
 }
 let best=-1,bestDistance=Math.hypot(from.x-to.x,from.y-to.y),exact=false;
 for(let head=0;head<queue.length;head++){
  const i=queue[head],p=point(i),distance=Math.hypot(p.x-to.x,p.y-to.y);
  if(distance<bestDistance){best=i;bestDistance=distance;}
  if(distance<48&&clearPath(p,to,walkable)){best=i;exact=true;break;}
  const x=i%width,y=Math.floor(i/width);
  for(const [nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
   if(nx<0||ny<0||nx>=width||ny>=height)continue;
   const next=ny*width+nx,q=point(next);
   if(parents[next]!==-2||!walkable(q.x,q.y)||!clearPath(p,q,walkable))continue;
   parents[next]=i;queue.push(next);
  }
 }
 if(best<0)return [];
 const route:Point[]=[];
 for(let i=best;i>=0;i=parents[i])route.push(point(i));
 route.reverse();if(exact)route.push({...to});
 // Remove grid zigzags only when the entire player footprint clears the shortcut.
 const smooth:Point[]=[];let anchor=from;
 for(let i=0;i<route.length;){let next=route.length-1;while(next>i&&!clearPath(anchor,route[next],walkable))next--;smooth.push(route[next]);anchor=route[next];i=next+1;}
 return smooth;
}
