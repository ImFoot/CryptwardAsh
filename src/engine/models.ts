import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Mesh-built characters: every silhouette has real volume, joint motion, and shadows.
const steel=new T.MeshStandardMaterial({color:0x68767c,metalness:.65,roughness:.54});
const dark=new T.MeshStandardMaterial({color:0x24272a,metalness:.48,roughness:.66});
const brass=new T.MeshStandardMaterial({color:0x887250,metalness:.63,roughness:.56});
const cloth=new T.MeshStandardMaterial({color:0x962f1b,roughness:.96,side:T.DoubleSide});
const bone=new T.MeshStandardMaterial({color:0xb8ac8c,roughness:.86});
const coal=new T.MeshStandardMaterial({color:0x282b30,roughness:.85});
const fire=new T.MeshStandardMaterial({color:0xff6b14,emissive:0xff4806,emissiveIntensity:3.5,roughness:.4});
const cyan=new T.MeshStandardMaterial({color:0x58c6cf,emissive:0x37b4d6,emissiveIntensity:2.4,metalness:.4,roughness:.24});
const red=new T.MeshStandardMaterial({color:0x962c18,emissive:0xc42a07,emissiveIntensity:1.5});
export const materials={steel,dark,brass,cloth,bone,coal,fire,cyan,red};
const boxGeometry=new RoundedBoxGeometry(1,1,1,2,.07);
const sphereGeometry=new T.SphereGeometry(1,12,8);
const cylinderGeometry=new T.CylinderGeometry(1,1,1,12);
const spikeGeometry=new T.ConeGeometry(1,1,5);
const ringGeometry=new T.TorusGeometry(1,.07,6,28);
const sharedGeometry=new Set<T.BufferGeometry>([boxGeometry,sphereGeometry,cylinderGeometry,spikeGeometry,ringGeometry]);
const sharedMaterial=new Set<T.Material>(Object.values(materials));
/** Release model-specific GPU allocations, preserving the shared mesh palette. */
export function disposeModel(root:T.Object3D){const geometries=new Set<T.BufferGeometry>(),mats=new Set<T.Material>();root.traverse(o=>{if(!(o instanceof T.Mesh))return;if(!sharedGeometry.has(o.geometry))geometries.add(o.geometry);for(const mat of Array.isArray(o.material)?o.material:[o.material])if(!sharedMaterial.has(mat))mats.add(mat);});geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}
// Combine rigid pieces per joint and material; limbs remain independently animated.
function compact(root:T.Group){for(const child of root.children)if(child instanceof T.Group)compact(child);const groups=new Map<T.Material,T.Mesh[]>();for(const child of root.children){if(!(child instanceof T.Mesh)||Array.isArray(child.material)||child.userData.base)continue;const list=groups.get(child.material)||[];list.push(child);groups.set(child.material,list);}for(const [mat,list]of groups){if(list.length<2)continue;const parts=list.map(m=>{m.updateMatrix();let geo=m.geometry.clone();if(geo.index){const original=geo;geo=geo.toNonIndexed();original.dispose();}geo.applyMatrix4(m.matrix);return geo;});const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(!geometry)continue;for(const old of list){root.remove(old);if(!sharedGeometry.has(old.geometry))old.geometry.dispose();}const joined=new T.Mesh(geometry,mat);joined.castShadow=true;joined.receiveShadow=true;root.add(joined);}}
function finish(model:Character){compact(model.root);return model;}
export function mesh(parent:T.Object3D,geometry:T.BufferGeometry,material:T.Material,x:number,y:number,z:number,sx=1,sy=sx,sz=sx){
 const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
export const box=(p:T.Object3D,m:T.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>mesh(p,boxGeometry,m,x,y,z,sx,sy,sz);
export const orb=(p:T.Object3D,m:T.Material,x:number,y:number,z:number,sx:number,sy=sx,sz=sx)=>mesh(p,sphereGeometry,m,x,y,z,sx,sy,sz);
export const cylinder=(p:T.Object3D,m:T.Material,x:number,y:number,z:number,r:number,h:number)=>mesh(p,cylinderGeometry,m,x,y,z,r,h,r);
export const ring=(p:T.Object3D,m:T.Material,x:number,y:number,z:number,r:number)=>mesh(p,ringGeometry,m,x,y,z,r);
export interface Character {root:T.Group;body:T.Group;legs:T.Group[];arms:T.Group[];cape?:T.Mesh;family:string;scale:number;lastX:number;lastZ:number;phase:number;}

export function character(family:string):Character {
 const root=new T.Group(),body=new T.Group();root.add(body);
 const model:Character={root,body,legs:[],arms:[],family,scale:1,lastX:0,lastZ:0,phase:0};
 if(family==='ember_nest'){root.add(furnace());return finish(model);}
 if(family==='ash_rat'){
  orb(body,coal,0,.28,0,.27,.25,.47);orb(body,dark,0,.31,.34,.2,.19,.22);
  for(const x of [-.11,.11]){orb(body,red,x,.39,.49,.035);orb(body,coal,x*1.6,.52,.23,.095,.12,.04);}
  const tail=mesh(body,new T.ConeGeometry(.055,.75,8),coal,0,.19,-.63);tail.rotation.x=-1.8;
  for(const x of [-.23,.23])for(const z of [-.24,.23]){const leg=new T.Group();leg.position.set(x,.24,z);box(leg,dark,0,-.13,0,.1,.25,.15);body.add(leg);model.legs.push(leg);}return finish(model);
 }
 const hero=family==='hero',skeleton=family==='bonebound',acolyte=family==='cinder_acolyte';
 const boss=family==='bellows_warden',brute=family==='furnace_brute';
 const armour=hero?steel:boss||brute?dark:skeleton?bone:coal;
 model.scale=boss?2.3:brute?1.55:hero?1.15:1;root.scale.setScalar(model.scale);
 // Layered breastplate and articulated cuirass, with a narrow illuminated gorget.
 orb(body,armour,0,.96,0,.3,.4,.19);box(body,dark,0,.62,0,.4,.17,.25);
 for(let i=0;i<3;i++)box(body,hero?steel:armour,0,.64+i*.095,.13,.42-i*.035,.105,.1);
 cylinder(body,brass,0,.65,0,.25,.05);
 if(hero||boss||brute){
  const plate=mesh(body,new T.IcosahedronGeometry(1,0),armour,0,1.02,.025,.33,.34,.23);plate.rotation.y=Math.PI/5;
  box(body,brass,0,1.04,.185,.055,.32,.025);
  for(const side of [-1,1]){const strap=box(body,brass,side*.14,1.04,.17,.025,.36,.025);strap.rotation.z=side*.25;}
 }
 // Helmet is a faceted closed shell with a slit, cheek plates and a crest.
 orb(body,armour,0,1.42,.01,.235,.28,.22);
 box(body,dark,0,1.44,.203,.35,.095,.055);
 for(const side of [-1,1]){
  box(body,hero?cyan:red,side*.075,1.452,.235,.095,.022,.015);
  const cheek=box(body,armour,side*.15,1.30,.18,.095,.17,.065);cheek.rotation.z=side*.24;
 }
 if(hero){box(body,steel,0,1.63,.01,.045,.18,.29);cylinder(body,cloth,0,1.2,0,.25,.13);for(const side of [-1,1]){const tasset=box(body,steel,side*.18,.59,.1,.2,.27,.075);tasset.rotation.z=side*.18;}}
 if(skeleton){box(body,dark,0,1.31,.21,.14,.045,.02);for(let i=0;i<4;i++)box(body,bone,-.075+i*.05,1.31,.226,.024,.065,.02);}
 if(boss||brute){
  for(const side of [-1,1]){const horn=mesh(body,spikeGeometry,brass,side*.25,1.68,0,.075,.48,.075);horn.rotation.z=-side*.42;}
  orb(body,fire,0,.97,.18,.15,.2,.06);
  for(let i=0;i<3;i++)box(body,dark,-.12+i*.12,.97,.26,.045,.34,.08);
  for(const side of [-1,1]){cylinder(body,dark,side*.22,1.2,-.24,.095,.7);cylinder(body,fire,side*.22,1.57,-.24,.06,.06);}
 }
 for(const side of [-1,1]){
  const leg=new T.Group();leg.position.set(side*.135,.58,0);body.add(leg);model.legs.push(leg);
  box(leg,dark,0,-.12,0,.15,.27,.16);box(leg,armour,0,-.31,.02,.17,.24,.19);orb(leg,brass,0,-.24,.105,.083,.09,.035);box(leg,dark,0,-.49,.07,.18,.11,.3);
  const arm=new T.Group();arm.position.set(side*.32,1.13,0);body.add(arm);model.arms.push(arm);
  const shoulder=mesh(arm,new T.IcosahedronGeometry(1,0),armour,side*.02,0,0,.23,.19,.25);shoulder.rotation.z=side*.2;
  box(arm,brass,side*.03,-.08,.19,.22,.035,.035);
  if(boss||brute){for(let i=0;i<3;i++){const ridge=box(arm,dark,side*(.06+i*.045),.015-i*.055,0,.22,.07,.39);ridge.rotation.z=side*.2;}const thorn=mesh(arm,spikeGeometry,steel,side*.09,.22,0,.065,.3,.065);thorn.rotation.z=-side*.25;}
  box(arm,dark,side*.02,-.18,0,.13,.24,.15);box(arm,armour,side*.03,-.32,.035,.15,.2,.17);orb(arm,dark,side*.03,-.45,.025,.09);
 }
 if(acolyte){
  const robe=mesh(body,new T.ConeGeometry(.44,.94,12,1,true),new T.MeshStandardMaterial({color:0x243c44,roughness:.94,side:T.DoubleSide}),0,.49,0);robe.rotation.y=.2;
  const hood=mesh(body,new T.ConeGeometry(.31,.58,8),coal,0,1.53,-.02);hood.rotation.x=-.15;
  const staff=model.arms[1];cylinder(staff,brass,.02,-.25,.16,.035,1.5);orb(staff,fire,.02,.53,.16,.15);
 }else{
  const weapon=model.arms[1];
  if(boss||brute){cylinder(weapon,brass,0,-.3,.3,.048,1.1);box(weapon,dark,0,-.78,.3,.66,.3,.35);for(const side of [-1,1]){box(weapon,brass,side*.27,-.78,.3,.065,.33,.38);for(const z of [.16,.44])orb(weapon,steel,side*.3,-.68,z,.027);}box(weapon,fire,0,-.78,.49,.25,.022,.025);for(const x of [-.1,.1])box(weapon,dark,x,-.78,.51,.055,.25,.035);}
  else {box(weapon,brass,.03,-.52,.12,.36,.05,.09);const blade=box(weapon,steel,.03,-.94,.12,.095,.8,.045);blade.rotation.z=-.04;box(weapon,hero?cyan:brass,.03,-.87,.15,.019,.61,.012);}
  if(hero){const shield=model.arms[0];const rim=cylinder(shield,brass,-.06,-.25,.19,.29,.09);rim.rotation.x=Math.PI/2;const face=cylinder(shield,dark,-.06,-.25,.245,.25,.055);face.rotation.x=Math.PI/2;orb(shield,brass,-.06,-.25,.29,.09,.09,.045);}
 }
 if(hero){
  const geo=new T.PlaneGeometry(.68,1.1,5,8);const cape=new T.Mesh(geo,cloth);cape.position.set(0,.79,-.23);cape.rotation.x=.19;cape.castShadow=true;body.add(cape);cape.userData.base=Float32Array.from(geo.attributes.position.array);model.cape=cape;
 }
 return finish(model);
}

export function animateCharacter(m:Character,t:number,dt:number,moving:boolean,attack:number,face:number,dead:boolean){
 m.root.rotation.y=Math.PI/2-face;
 if(dead){m.body.rotation.z=T.MathUtils.lerp(m.body.rotation.z,Math.PI/2,1-Math.exp(-dt*8));m.body.position.y=-.12;return;}
 m.body.rotation.z=0;m.phase+=dt*(moving?11.4:1.5);
 const walk=Math.sin(m.phase),stride=moving?.55:.02;
 m.body.position.y=(moving?Math.abs(walk)*.045:Math.sin(t*2)*.012);
 for(let i=0;i<m.legs.length;i++)m.legs[i].rotation.x=Math.sin(m.phase+(i%2)*Math.PI)*stride;
 for(let i=0;i<m.arms.length;i++){m.arms[i].rotation.x=-Math.sin(m.phase+i*Math.PI)*stride*.5;m.arms[i].rotation.z=(i?-.1:.1);}
 if(attack>0&&m.arms[1]){m.arms[1].rotation.x=-1.4+Math.sin(attack*Math.PI)*2.3;m.arms[1].rotation.z=-.5;}
 if(m.cape){const pos=m.cape.geometry.attributes.position,base=m.cape.userData.base as Float32Array;for(let i=0;i<pos.count;i++){const fall=(.48-base[i*3+1]);pos.setZ(i,base[i*3+2]-fall*.16+Math.sin(t*6+base[i*3]*5-fall*3)*fall*(moving?.11:.045));}pos.needsUpdate=true;m.cape.geometry.computeVertexNormals();}
}

export function furnace(){
 const g=new T.Group();cylinder(g,dark,0,.11,0,.7,.22);cylinder(g,brass,0,.24,0,.59,.08);
 orb(g,fire,0,.65,0,.4,.46,.4);
 for(let n=0;n<12;n++){const a=n*Math.PI/6;const bar=box(g,dark,Math.cos(a)*.43,.72,Math.sin(a)*.43,.065,.83,.12);bar.rotation.y=-a;}
 for(const y of [.33,1.06,1.2])cylinder(g,brass,0,y,0,.5,.065);
 mesh(g,new T.ConeGeometry(.5,.38,12),dark,0,1.4,0);
 cylinder(g,dark,0,1.72,0,.16,.45);cylinder(g,fire,0,1.95,0,.12,.035);
 for(const side of [-1,1]){cylinder(g,dark,side*.58,.7,0,.09,1.14);ring(g,brass,side*.58,.38,0,.1).rotation.x=Math.PI/2;}
 return g;
}

export function pickup(item:string){
 const g=new T.Group();g.userData.item=item;
 if(item==='seal_shard'||item.includes('mana')||item==='ember_charge'){
  mesh(g,new T.OctahedronGeometry(.21),item==='seal_shard'?cyan:fire,0,.44,0,1,1.7,1);
  const orbit=ring(g,item==='seal_shard'?brass:dark,0,.44,0,.3);orbit.rotation.x=.5;orbit.rotation.y=.5;
 }else if(item.startsWith('health')){
  cylinder(g,brass,0,.06,0,.13,.06);orb(g,new T.MeshPhysicalMaterial({color:0xaa1813,metalness:.1,roughness:.18,clearcoat:1}),0,.23,0,.16,.19,.16);cylinder(g,brass,0,.42,0,.075,.12);
 }else if(item==='brass_key'){
  ring(g,brass,0,.45,0,.13);box(g,brass,0,.22,0,.045,.25,.045);box(g,brass,.045,.12,0,.13,.05,.045);
 }else if(item==='shield_charm'){const shield=cylinder(g,brass,0,.35,0,.2,.1);shield.rotation.x=Math.PI/2;}
 else {for(let n=0;n<7;n++)cylinder(g,brass,Math.sin(n*9)*.17,.04+(n%3)*.03,Math.cos(n*5)*.16,.1,.04);}
 return g;
}

export function checkpoint(){
 const g=new T.Group();cylinder(g,coal,0,.08,0,.62,.16);cylinder(g,brass,0,.18,0,.48,.07);
 for(let n=0;n<3;n++){const a=n*Math.PI*2/3;const arch=ring(g,brass,0,.63,0,.42);arch.rotation.y=a;}
 orb(g,cyan,0,.63,0,.21);cylinder(g,dark,0,.24,0,.22,.1);return g;
}

export function gate(width=1.8){
 const g=new T.Group();for(let n=0;n<8;n++)box(g,dark,(n/7-.5)*width,.8,0,.06,1.6,.1);
 for(const y of [.15,1.25,1.55])box(g,brass,0,y,0,width+.15,.07,.12);box(g,brass,0,.8,.1,.2,.28,.1);return g;
}

export function portal(){
 const g=new T.Group();const outer=ring(g,coal,0,1,0,.91);outer.scale.z=2;const inner=ring(g,cyan,0,1,.04,.73);inner.name='portal-ring';
 for(const side of [-1,1])box(g,dark,side*.82,.47,0,.24,.96,.3);
 const veil=new T.Mesh(new T.CircleGeometry(.72,48),new T.MeshBasicMaterial({color:0x148b9d,transparent:true,opacity:.3,side:T.DoubleSide}));veil.position.set(0,1,.03);g.add(veil);return g;
}
