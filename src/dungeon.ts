export type DungeonObject = {name:string;type:string;x:number;y:number;width:number;height:number;properties:Record<string,any>};
export type DungeonDefinition = {schemaVersion:1;id:string;displayName:string;source:'authored'|'generated';seed?:number;width:number;height:number;tileSize:32;ground:number[];collision:number[];zones:number[];objects:DungeonObject[]};
export const ZONES = ['Passage','Ember Vestibule','Rat Run','Key Vault','Furnace Cross','Bone Barracks','Cinder Gallery','Seal Approach','Bellows Arena'];
export function loadAuthored(raw:any):DungeonDefinition {
  const layer=(name:string)=>[...raw.layers.find((l:any)=>l.name===name).data];
  const d:DungeonDefinition={schemaVersion:1,id:raw.properties.id,displayName:raw.properties.displayName,source:'authored',width:raw.width,height:raw.height,tileSize:32,ground:layer('ground'),collision:layer('collision'),zones:layer('zones'),objects:structuredClone(raw.layers.find((l:any)=>l.type==='objectgroup').objects)};
  // The source's arena zone overlaps the Barracks shard. Keep its authored
  // geometry, but assign the shared western approach to the Barracks.
  for(let i=0;i<d.zones.length;i++)if(d.zones[i]===8&&i%d.width<46)d.zones[i]=5;
  validateDungeon(d);return d;
}
export function validateDungeon(d:DungeonDefinition) {
  for(const a of [d.ground,d.collision,d.zones])if(a.length!==d.width*d.height)throw Error('Invalid dungeon layer size');
  const names=new Set<string>();
  for(const o of d.objects){if(names.has(o.name))throw Error('Duplicate object '+o.name);names.add(o.name);if(o.x<0||o.y<0||o.x>=d.width*32||o.y>=d.height*32)throw Error('Object outside dungeon: '+o.name);}
  const spawn=d.objects.find(o=>o.type==='spawn');if(!spawn)throw Error('Missing player spawn');
  const start=Math.floor(spawn.y/32)*d.width+Math.floor(spawn.x/32),seen=new Set([start]),queue=[start];
  for(let q=0;q<queue.length;q++){const i=queue[q],x=i%d.width,y=Math.floor(i/d.width);for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const n=ny*d.width+nx;if(nx>=0&&ny>=0&&nx<d.width&&ny<d.height&&!d.collision[n]&&!seen.has(n)){seen.add(n);queue.push(n);}}}
  for(const o of d.objects.filter(o=>['spawn','pickup','boss','exit','lever','checkpoint'].includes(o.type))){const i=Math.floor(o.y/32)*d.width+Math.floor(o.x/32);if(!seen.has(i))throw Error('Unreachable object: '+o.name);}
}
export function lineOfSight(d:DungeonDefinition,ax:number,ay:number,bx:number,by:number,blocked?:(x:number,y:number)=>boolean){const n=Math.ceil(Math.hypot(bx-ax,by-ay)/8);for(let i=1;i<=n;i++){const x=ax+(bx-ax)*i/n,y=ay+(by-ay)*i/n;if(blocked?blocked(x,y):d.collision[Math.floor(y/32)*d.width+Math.floor(x/32)])return false;}return true;}
