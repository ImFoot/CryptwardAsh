import {validateDungeon,type DungeonDefinition,type DungeonObject} from './dungeon.ts';
type Template={id:string;width:number;height:number;roles:string[]};
export const GENERATOR_VERSION='ashvault-pc-1.0';
export function generateDungeon(seed:number,catalog:{templates:Template[]}):DungeonDefinition{
 let state=seed|0;const random=()=>{state=(state+0x6d2b79f5)|0;let t=Math.imul(state^state>>>15,1|state);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
 const pick=(role:string)=>{const choices=catalog.templates.filter(t=>t.roles.includes(role));if(!choices.length)throw Error('Missing template role '+role);return choices[Math.floor(random()*choices.length)];};
 const w=84,h=84,d:DungeonDefinition={schemaVersion:1,id:`expedition-${GENERATOR_VERSION}-${seed|0}`,displayName:'Ashvault Expedition',source:'generated',seed:seed|0,width:w,height:h,tileSize:32,ground:new Array(w*h).fill(23),collision:new Array(w*h).fill(1),zones:new Array(w*h).fill(0),objects:[]};
 const specs:[string,number,number,number][]=[['start',0,1,1],['combat',1,1,2],['objective',1,0,3],['junction',2,1,4],['combat',2,2,5],['combat',3,1,6],['boss_approach',3,2,7],['boss',3,3,8],['treasure',0,0,3],['checkpoint',2,0,4]];
 const rooms=specs.map(([role,gx,gy,zone],id)=>{const t=role==='boss'?catalog.templates.find(t=>t.id==='bellows_arena')!:pick(role);return {id,t,zone,cx:gx*20+12,cy:gy*20+12,x:gx*20+12-Math.floor(t.width/2),y:gy*20+12-Math.floor(t.height/2)};});
 const carve=(x:number,y:number,zone:number)=>{const i=y*w+x;d.collision[i]=0;d.ground[i]=[1,2,3,7][Math.floor(random()*4)];d.zones[i]=zone;};
 const edges=[[0,1],[1,2],[2,8],[8,0],[1,3],[3,9],[3,4],[3,5],[5,6],[6,7]];
 // Three-wide corridors attach along room centerlines, leaving all sockets clear.
 for(const [ai,bi]of edges){const a=rooms[ai],b=rooms[bi],zone=bi===3?2:bi===7?7:b.zone;let x=a.cx,y=a.cy;while(x!==b.cx){for(let q=-1;q<=1;q++)carve(x,y+q,zone);x+=Math.sign(b.cx-x);}while(y!==b.cy){for(let q=-1;q<=1;q++)carve(x+q,y,zone);y+=Math.sign(b.cy-y);}for(let q=-1;q<=1;q++)carve(x+q,y,zone);}
 for(const r of rooms)for(let y=r.y;y<r.y+r.t.height;y++)for(let x=r.x;x<r.x+r.t.width;x++)carve(x,y,r.zone);
 const obj=(name:string,type:string,x:number,y:number,properties:Record<string,any>={})=>{const o:DungeonObject={name,type,x:x*32+16,y:y*32+16,width:32,height:32,properties};d.objects.push(o);return o;};
 const center=(r:number,name:string,type:string,properties:Record<string,any>={},dx=0,dy=0)=>obj(name,type,rooms[r].cx+dx,rooms[r].cy+dy,properties);
 center(0,'player_spawn','spawn',{},-2,0);center(0,'checkpoint_01','checkpoint',{},1,-2);
 center(1,'nest_rat_run','spawner',{family:'ash_rat',cap:6,cadence:3.8},2,2);center(1,'seal_shard_a','pickup',{item:'seal_shard'},3,3);
 center(2,'key_brass_01','pickup',{item:'brass_key'},2,-2);center(2,'nest_key_vault','spawner',{family:'bonebound',cap:4,cadence:5},-2,-2);
 obj('gate_furnace','door',rooms[3].x-1,rooms[3].cy,{locked:true,key:'brass_key'});
 center(3,'nest_furnace','spawner',{family:'furnace_brute',cap:2,cadence:8.5},3,-2);
 center(4,'seal_shard_b','pickup',{item:'seal_shard'},2,2);
 center(5,'seal_shard_c','pickup',{item:'seal_shard'},2,-3);center(5,'lever_gallery','lever',{toggles:'bridge_01'},-2,3);
 center(6,'bridge_01','bridge',{initially:'down'},0,-3);
 obj('seal_gate','door',rooms[7].cx,rooms[7].y-1,{locked:true,requirement:'seal_shards:3'});
 center(7,'boss_spawn','boss',{family:'bellows_warden'},0,0);center(7,'exit_portal','exit',{requires:'boss_defeated'},5,2);
 center(8,'secret_wall','secret',{reveals:'treasure_cache'},-2,0);center(8,'treasure_cache','chest',{contents:'score_relic,health_tonic_large'},0,0);center(9,'checkpoint_02','checkpoint');
 for(const [i,f,count]of [[1,'ash_rat',3],[2,'bonebound',2],[3,'bonebound',3],[4,'bonebound',4],[5,'cinder_acolyte',3],[6,'furnace_brute',1]] as const){center(i,'encounter_'+i,'enemy_group',{family:f,count,activationRadius:224},-2,1);center(i,'tonic_'+i,'pickup',{item:random()>.5?'health_tonic_large':'ember_charge'},-3,3);}
 center(0,'pickup_01','pickup',{item:'coin_pile'},2,2);validateDungeon(d);validateProgression(d);return d;
}
export function validateProgression(d:DungeonDefinition){
 const w=d.width,spawn=d.objects.find(o=>o.type==='spawn')!;const initial=Math.floor(spawn.y/32)*w+Math.floor(spawn.x/32);
 const flood=(unlocked:boolean,sealed:boolean)=>{const seen=new Set<number>([initial]),q=[initial];for(let k=0;k<q.length;k++){const i=q[k],x=i%w,y=Math.floor(i/w);for(const [nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const n=ny*w+nx,z=d.zones[n];if(nx<0||ny<0||nx>=w||ny>=d.height||d.collision[n]||seen.has(n)||!unlocked&&z>=4||!sealed&&z===8)continue;seen.add(n);q.push(n);}}return seen;};
 const before=flood(false,false),after=flood(true,false),all=flood(true,true),has=(set:Set<number>,o:DungeonObject)=>set.has(Math.floor(o.y/32)*w+Math.floor(o.x/32));
 for(const o of d.objects){if(o.properties.item==='brass_key'&&!has(before,o))throw Error('Key behind gate');if(o.properties.item==='seal_shard'&&!has(after,o))throw Error('Shard behind seal');if(o.type==='boss'&&has(after,o))throw Error('Boss isolation failure');if(!has(all,o))throw Error('Unreachable object '+o.name);}
}
