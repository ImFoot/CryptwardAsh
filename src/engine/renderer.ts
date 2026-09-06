import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {character,animateCharacter,disposeModel,checkpoint,pickup,gate,portal,box,cylinder,ring,orb,materials,type Character} from './models';
import {buildEnvironment} from './environment';
import type {DungeonDefinition} from '../dungeon';
import type {RenderState,Obj} from './types';

type Wall={x:number;z:number;height:number;current:number;};
type Pulse={mesh:T.Mesh;age:number;duration:number;radius:number;};
type Label={element:HTMLSpanElement;x:number;z:number;age:number;};
const asset=(path:string)=>`${import.meta.env.BASE_URL}${path}`;
const up=new T.Vector3(0,1,0),dummy=new T.Object3D();
const hash=(x:number,y:number)=>(((x*73856093)^(y*19349663))>>>0)/4294967295;

/** A real 3D world renderer. Game coordinates stay in pixels; mesh coordinates use metres. */
export class DungeonRenderer {
 readonly renderer:T.WebGLRenderer;
 readonly scene=new T.Scene();
 readonly camera=new T.PerspectiveCamera(40,1,.15,160);
 readonly composer:EffectComposer;
 readonly bloom:UnrealBloomPass;
 readonly ao:SSAOPass;
 readonly world=new T.Group();
 readonly actors=new T.Group();
 readonly effects=new T.Group();
 readonly labels=document.createElement('div');
 private resources:{dispose:()=>void}[]=[];
 private environment?:ReturnType<typeof buildEnvironment>;
 private models=new Map<number,Character>();
 private objectModels=new Map<string,T.Group>();
 private cage?:T.Group;
 private hero=character('hero');
 private wallMesh?:T.InstancedMesh;
 private caps?:T.InstancedMesh;
 private walls:Wall[]=[];
 private seals:{mesh:T.Group;kind:'furnace'|'boss'}[]=[];
 private lightSources:{position:T.Vector3;color:number;intensity:number;name?:string}[]=[];
 private pointLights:T.PointLight[]=[];
 private moon=new T.DirectionalLight(0x8299b2,2.25);
 private heroLamp=new T.PointLight(0xffb16d,9,5.5,2);
 private motes:T.Points;
 private particleGeometry=new T.BufferGeometry();
 private particlePositions=new Float32Array(1500*3);
 private particleColors=new Float32Array(1500*3);
 private pulses:Pulse[]=[];
 private floating:Label[]=[];
 private enemyBars=new Map<number,HTMLDivElement>();
 private target=new T.Vector3();
 private raycaster=new T.Raycaster();
 private destination=new T.Mesh(new T.RingGeometry(.25,.32,48),new T.MeshBasicMaterial({color:0x89f5d0,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));
 private ground=new T.Plane(up,0);
 private basalt?:T.Texture;
 private bump?:T.Texture;
 private telegraphs:T.Mesh[]=[];
 private telegraphGeometry=new T.RingGeometry(.88,1,48);
 private telegraphMaterial=new T.MeshBasicMaterial({color:0xff7330,transparent:true,opacity:.55,side:T.DoubleSide,depthWrite:false});
 private dangerGeometry=new T.CircleGeometry(1,48);
 private dangerMaterial=new T.MeshBasicMaterial({color:0xff571f,transparent:true,opacity:.10,side:T.DoubleSide,depthWrite:false});
 private menuCamera=false;
 private shakeAmount=0;
 azimuth=Math.PI/4;
 distance=16.8;
 time=0;
 drawCalls=0;
 triangles=0;
 frameMs=0;
 constructor(parent:HTMLElement){
  this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.14;
  this.renderer.outputColorSpace=T.SRGBColorSpace;parent.replaceChildren(this.renderer.domElement);
  this.renderer.info.autoReset=false;
  this.scene.background=new T.Color(0x05090d);this.scene.fog=new T.FogExp2(0x101923,.024);
  this.scene.add(this.world,this.actors,this.effects);
  this.destination.rotation.x=-Math.PI/2;this.destination.visible=false;this.scene.add(this.destination);
  // A blue-black skylight keeps shadowed stone readable while leaving the firelight to lead the eye.
  const hemi=new T.HemisphereLight(0x68819c,0x1a1010,1.14);this.scene.add(hemi);
  this.moon.intensity=2.5;this.moon.castShadow=true;this.moon.shadow.mapSize.set(2048,2048);
  Object.assign(this.moon.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:.5,far:65});
  this.moon.shadow.bias=-.0003;this.moon.shadow.normalBias=.045;this.moon.shadow.radius=2.5;
  this.scene.add(this.moon,this.moon.target,this.heroLamp);
  for(let i=0;i<4;i++){const light=new T.PointLight(0xff782c,0,11,2);this.pointLights.push(light);this.scene.add(light);}
  const pmrem=new T.PMREMGenerator(this.renderer),room=new RoomEnvironment();
  const env=pmrem.fromScene(room,.08);this.scene.environment=env.texture;this.scene.environmentIntensity=.25;room.dispose();pmrem.dispose();
  this.composer=new EffectComposer(this.renderer);
  this.composer.addPass(new RenderPass(this.scene,this.camera));
  this.ao=new SSAOPass(this.scene,this.camera,1280,720,12);this.ao.kernelRadius=.5;this.ao.minDistance=.0003;this.ao.maxDistance=.032;this.composer.addPass(this.ao);
  this.bloom=new UnrealBloomPass(new T.Vector2(1280,720),.26,.35,1.5);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());
  this.actors.add(this.hero.root);
  const particleMaterial=new T.PointsMaterial({size:.06,vertexColors:true,transparent:true,opacity:.54,depthWrite:false,blending:T.AdditiveBlending,map:this.softTexture()});
  this.particleGeometry.setAttribute('position',new T.BufferAttribute(this.particlePositions,3).setUsage(T.DynamicDrawUsage));
  this.particleGeometry.setAttribute('color',new T.BufferAttribute(this.particleColors,3).setUsage(T.DynamicDrawUsage));
  this.motes=new T.Points(this.particleGeometry,particleMaterial);this.motes.frustumCulled=false;this.effects.add(this.motes);
  this.labels.className='world-labels';parent.append(this.labels);
  this.resize();window.addEventListener('resize',()=>this.resize());
  this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.dispatchEvent(new Event('cryptward-context-lost'));});
 }
 async load(){
  this.basalt=await new T.TextureLoader().loadAsync(asset('assets/materials/basalt.webp'));
  this.basalt.colorSpace=T.SRGBColorSpace;this.basalt.wrapS=this.basalt.wrapT=T.RepeatWrapping;this.basalt.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
  this.bump=this.basalt.clone();this.bump.colorSpace=T.NoColorSpace;
  for(const mat of [materials.steel,materials.dark,materials.brass]){mat.bumpMap=this.bump;mat.bumpScale=.011;mat.envMapIntensity=.34;mat.needsUpdate=true;}
 }
 private softTexture(){const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d')!;const g=ctx.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'white');g.addColorStop(.25,'#ffffffc0');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,0,32,32);return new T.CanvasTexture(c);}
 resize(){const w=window.innerWidth,h=window.innerHeight;this.camera.aspect=w/h;if(this.menuCamera)this.camera.setViewOffset(w,h,-w*.19,0,w,h);this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);this.composer.setSize(w,h);}
 private own<V extends {dispose:()=>void}>(resource:V):V{this.resources.push(resource);return resource;}
 private stone(color:number,roughness=.85){return this.own(new T.MeshStandardMaterial({color,map:this.basalt,bumpMap:this.bump,bumpScale:.16,roughness,metalness:.025,envMapIntensity:.12}));}
 private instances(geometry:T.BufferGeometry,material:T.Material,items:{x:number;y:number;z:number;sx:number;sy:number;sz:number;rotation?:number;color?:T.Color}[]){
  const mesh=new T.InstancedMesh(geometry,material,items.length);const c=new T.Color();
  items.forEach((v,i)=>{dummy.position.set(v.x,v.y,v.z);dummy.rotation.set(0,v.rotation||0,0);dummy.scale.set(v.sx,v.sy,v.sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,v.color||c.set(0xffffff));});
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.world.add(mesh);this.own(mesh);return mesh;
 }
 build(d:DungeonDefinition){
  this.environment?.dispose();this.environment=undefined;
  for(const resource of this.resources)resource.dispose();this.resources=[];this.world.clear();
  for(const model of this.models.values())disposeModel(model.root);for(const model of this.objectModels.values())disposeModel(model);
  this.actors.clear();this.actors.add(this.hero.root);this.models.clear();this.objectModels.clear();this.walls=[];this.seals=[];this.lightSources=[];this.cage=undefined;
  for(const p of this.pulses){p.mesh.geometry.dispose();(p.mesh.material as T.Material).dispose();this.effects.remove(p.mesh);}this.pulses=[];
  this.labels.replaceChildren();this.floating=[];this.enemyBars.clear();
  const solid=(x:number,z:number)=>x<0||z<0||x>=d.width||z>=d.height||d.collision[z*d.width+x]>0;
  const floorGeo=this.own(new RoundedBoxGeometry(1,.18,1,2,.04));
  // Basalt stays well below white so the floor holds its value under a warm pool of light.
  const floorMaterial=this.stone(0xa0a59e,.9),wallMaterial=this.stone(0x68737a,.95),capMaterial=this.stone(0x6a7472,.92);
  const floorItems=[] as Parameters<DungeonRenderer['instances']>[2];
  const bedItems=[] as Parameters<DungeonRenderer['instances']>[2];
  for(let z=0;z<d.height;z++)for(let x=0;x<d.width;x++){
   const n=hash(x,z),zone=d.zones[z*d.width+x];
   if(!solid(x,z)){
    const color=new T.Color(zone===8?0xb09c7d:zone===6?0x7e9994:0xb3b5aa).multiplyScalar(.68+n*.3);
    // Paired slabs form staggered flagstones instead of a checkerboard.
    const paired=!solid(x+1,z)&&((x+(z%2))%2===0),previous=!solid(x-1,z)&&((x-1+(z%2))%2===0);
    if(!previous)floorItems.push({x:x+(paired?1:.5),y:-.10+n*.009,z:z+.5,sx:paired?1.995:.995,sy:1,sz:.997,color});
    if(solid(x+1,z)||solid(x-1,z)||solid(x,z+1)||solid(x,z-1))bedItems.push({x:x+.5,y:-.67,z:z+.5,sx:1,sy:1,sz:1});
   }else if(!solid(x+1,z)||!solid(x-1,z)||!solid(x,z+1)||!solid(x,z-1)){
    this.walls.push({x:x+.5,z:z+.5,height:1.95+n*.14,current:1.95});
    bedItems.push({x:x+.5,y:-.64,z:z+.5,sx:1.1,sy:1.1,sz:1.1});
   }
  }
  this.instances(floorGeo,floorMaterial,floorItems);
  this.instances(this.own(new T.BoxGeometry(1,1,1)),this.stone(0x151b21,.96),bedItems);
  const wallGeo=this.own(new RoundedBoxGeometry(1,1,1,2,.045));
  this.wallMesh=this.instances(wallGeo,wallMaterial,this.walls.map(w=>({x:w.x,y:w.height/2,z:w.z,sx:.97,sy:w.height,sz:.97,color:new T.Color().setScalar(.7+hash(w.x,w.z)*.3)})));
  this.caps=this.instances(this.own(new RoundedBoxGeometry(1,.12,1,2,.035)),capMaterial,this.walls.map(w=>({x:w.x,y:w.height+.02,z:w.z,sx:1.06,sy:1,sz:1.06})));
  // Broad mineral drift and soot remain visible at game scale; mortar follows cutaway walls.
  for(const material of [floorMaterial,capMaterial])material.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 rockWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 rp=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nrp=instanceMatrix*rp;\n#endif\nrockWorld=(modelMatrix*rp).xyz;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 rockWorld;').replace('#include <map_fragment>','diffuseColor *= texture2D(map,rockWorld.xz*.24);\nfloat soot=.9+.1*sin(rockWorld.x*1.7+rockWorld.z*.9)*sin(rockWorld.z*1.3-rockWorld.x*.45);\ndiffuseColor.rgb*=soot;');
  };
  wallMaterial.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 stonePosition;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 sp=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nsp=instanceMatrix*sp;\n#endif\nstonePosition=(modelMatrix*sp).xyz;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 stonePosition;').replace('#include <map_fragment>','diffuseColor *= texture2D(map,vec2(stonePosition.x+stonePosition.z,stonePosition.y)*.3);').replace('#include <color_fragment>','#include <color_fragment>\nfloat course=abs(fract(stonePosition.y*1.48)-.5);\nfloat joint=smoothstep(.035,.1,course);\nfloat soot=.88+.12*sin(stonePosition.x*1.4+stonePosition.z*.7)*sin(stonePosition.y*2.2);\ndiffuseColor.rgb*=mix(.72,1.,joint)*soot;');
  };
  const spawn=d.objects.find(o=>o.type==='spawn')!;
  // An imposing recessed vault door anchors the starting chamber's rear wall.
  let rear=Math.floor(spawn.y/32);const sx=Math.floor(spawn.x/32);
  while(rear>1&&!solid(sx,rear-1))rear--;
  this.vaultEntrance(sx+.5,rear-.34);
  for(const o of d.objects){
   let model:T.Group|undefined;
   if(o.type==='pickup')model=pickup(o.properties.item);
   else if(o.type==='checkpoint')model=checkpoint();
   else if(o.type==='door'&&o.name!=='door_rat_run')model=gate();
   else if(o.type==='exit')model=portal();
   else if(o.type==='lever'){model=new T.Group();box(model,materials.coal,0,.12,0,.5,.24,.5);const lever=cylinder(model,materials.brass,0,.46,0,.045,.6);lever.rotation.z=-.5;orb(model,materials.brass,-.15,.72,0,.09);}
   else if(o.type==='chest'){model=new T.Group();box(model,materials.dark,0,.17,0,.7,.34,.46);for(const x of [-.25,.25])box(model,materials.brass,x,.17,0,.045,.36,.49);const lid=new T.Group();lid.position.set(0,.35,-.23);box(lid,materials.dark,0,.06,.23,.7,.12,.46);for(const x of [-.25,.25])box(lid,materials.brass,x,.06,.23,.045,.13,.49);model.add(lid);model.userData.lid=lid;box(model,materials.brass,0,.26,.245,.1,.12,.03);}
   else if(o.type==='secret'){model=new T.Group();const fissure=box(model,materials.fire,0,.42,0,.025,.85,.03);fissure.rotation.z=.25;}
   if(model){model.position.set(o.x/32,0,o.y/32);this.actors.add(model);this.objectModels.set(o.name,model);}
   if(o.name==='seal_shard_c'){this.cage=gate(1.8);const side=gate(1.8);side.rotation.y=Math.PI/2;this.cage.add(side);this.cage.position.set(o.x/32,0,o.y/32);this.actors.add(this.cage);}
   if(['checkpoint','spawner','boss','exit'].includes(o.type))this.lightSources.push({position:new T.Vector3(o.x/32,1.2,o.y/32),color:o.type==='checkpoint'||o.type==='exit'?0x54c7e4:0xff6a20,intensity:o.type==='boss'?46:o.type==='checkpoint'?17:31,name:o.name});
  }
  this.buildBarriers(d);
  this.buildLandmarks(d);
  // Sparse industrial wall vents cast localized orange light; one per long wall run.
  for(const w of this.walls){const x=Math.floor(w.x),z=Math.floor(w.z);if((x+z*3)%17!==0||solid(x,z+1))continue;
   const vent=new T.Group();box(vent,materials.dark,0,.69,0,.7,.48,.12);box(vent,materials.fire,0,.69,.07,.56,.28,.025);
   for(let i=0;i<5;i++)box(vent,materials.dark,-.25+i*.125,.7,.095,.045,.36,.05);
   vent.position.set(w.x,0,w.z+.51);this.world.add(vent);this.lightSources.push({position:new T.Vector3(w.x,.7,w.z+.9),color:0xff7833,intensity:13});
  }
  // Cracked fragments remain low enough to preserve the walkable silhouette.
  const rubble=[] as Parameters<DungeonRenderer['instances']>[2];
  for(const w of this.walls){const n=hash(w.x+9,w.z+4);if(n<.78)continue;for(let i=0;i<3;i++)rubble.push({x:w.x+Math.sin(i*4)*.55,y:.05,z:w.z+Math.cos(i*3)*.55,sx:.15+n*.18,sy:.09+i*.05,sz:.14,rotation:n*6});}
  this.instances(this.own(new T.DodecahedronGeometry(.7,0)),this.stone(0x39444a,.94),rubble);
  this.environment=buildEnvironment(d);this.world.add(this.environment.root);
  this.snapTo(spawn.x,spawn.y);
 }
 private buildLandmarks(d:DungeonDefinition){
  // Inlaid navigation circles are flush with the floor and never obscure combat.
  for(const o of d.objects.filter(o=>['checkpoint','boss'].includes(o.type))){const boss=o.type==='boss',g=new T.Group();g.position.set(o.x/32,.015,o.y/32);this.world.add(g);const r=boss?3.5:1.5;
   for(const radius of [r,r-.12,r*.7]){const geometry=this.own(new T.RingGeometry(radius-.018,radius,96));const track=new T.Mesh(geometry,materials.brass);track.rotation.x=-Math.PI/2;g.add(track);}
   for(let i=0;i<12;i++){const angle=i*Math.PI/6;const rune=box(g,materials.brass,Math.cos(angle)*(r-.35),.01,Math.sin(angle)*(r-.35),.025,.025,.17);rune.rotation.y=-angle;}
  }
  const spawn=d.objects.find(o=>o.type==='spawn')!;
  let rear=Math.floor(spawn.y/32),x=Math.floor(spawn.x/32);while(rear>1&&!d.collision[(rear-1)*d.width+x])rear--;
  const g=new T.Group();g.position.set(x+.5,0,rear+.4);this.world.add(g);
  for(const side of [-1,1]){const chain=new T.Group();chain.position.set(side*1.75,0,0);g.add(chain);for(let i=0;i<10;i++){const link=ring(chain,materials.dark,0,.5+i*.24,0,.13);link.rotation.y=(i%2)*Math.PI/2;link.scale.y=1.5;}box(g,materials.dark,side*1.75,2.9,0,.6,.25,.4);}
 }
 private vaultEntrance(x:number,z:number){
  const g=new T.Group();g.position.set(x,0,z);this.world.add(g);
  const stone=this.stone(0x4e5e6c),metal=materials.dark;
  for(const side of [-1,1]){box(g,stone,side*1.05,1.65,0,.42,3.3,.65);box(g,stone,side*1.05,.16,0,.65,.32,.85);box(g,materials.brass,side*1.05,2.65,.35,.28,.1,.08);}
  box(g,stone,0,3.16,0,2.6,.5,.7);box(g,metal,0,1.46,.03,1.7,2.9,.22);
  for(const side of [-1,1])box(g,materials.brass,side*.42,1.5,.18,.025,2.6,.03);
  for(const y of [.4,1.6,2.6])box(g,materials.brass,0,y,.18,1.5,.07,.04);
  const wheel=ring(g,materials.brass,0,1.6,.24,.36);for(let n=0;n<6;n++){const spoke=box(g,materials.brass,0,1.6,.24,.65,.035,.035);spoke.rotation.z=n*Math.PI/3;}wheel.castShadow=true;
  box(g,materials.cyan,0,3.07,.38,.7,.035,.035);
  this.lightSources.push({position:new T.Vector3(x,2.6,z+.9),color:0x75cde6,intensity:12});
 }
 private buildBarriers(d:DungeonDefinition){
  const zone=(x:number,y:number)=>d.zones[y*d.width+x]||0;
  const locked=(x:number,y:number,kind:string)=>kind==='furnace'?(d.source==='authored'?x*32+16>=928:zone(x,y)>=4):zone(x,y)===8;
  for(const kind of ['furnace','boss'] as const){const g=new T.Group();
   for(let z=1;z<d.height-1;z++)for(let x=1;x<d.width-1;x++){if(d.collision[z*d.width+x]||!locked(x,z,kind))continue;
    for(const [dx,dz]of [[-1,0],[1,0],[0,-1],[0,1]]){if(d.collision[(z+dz)*d.width+x+dx]||locked(x+dx,z+dz,kind))continue;
     for(let i=0;i<4;i++){const px=x+(dx===1?1:dx===-1?0:(i+.5)/4),pz=z+(dz===1?1:dz===-1?0:(i+.5)/4);box(g,materials.brass,px,.42,pz,.045,.85,.045);}
     box(g,materials.brass,x+(dx===1?1:dx===-1?0:.5),.8,z+(dz===1?1:dz===-1?0:.5),dx?.055:1,.055,dz?.055:1);
    }
   }this.world.add(g);this.seals.push({mesh:g,kind});
  }
 }
 snapTo(x:number,y:number){this.target.set(x/32,.35,y/32);this.positionCamera(1);}
 rotate(direction:number){this.azimuth+=direction*Math.PI/4;this.positionCamera(1);}
 zoom(delta:number){this.distance=T.MathUtils.clamp(this.distance+delta,12.5,25);this.positionCamera(1);}
 screenDirection(x:number,y:number){return{x:x*Math.cos(this.azimuth)+y*Math.sin(this.azimuth),y:-x*Math.sin(this.azimuth)+y*Math.cos(this.azimuth)};}
 project(x:number,y:number,elevation=0){const p=new T.Vector3(x/32,elevation/32,y/32).project(this.camera);return{x:(p.x+1)*window.innerWidth/2,y:(1-p.y)*window.innerHeight/2};}
 unproject(x:number,y:number){this.raycaster.setFromCamera(new T.Vector2(x/window.innerWidth*2-1,1-y/window.innerHeight*2),this.camera);const p=new T.Vector3();this.raycaster.ray.intersectPlane(this.ground,p);return{x:p.x*32,y:p.z*32};}
 private positionCamera(alpha:number){const offset=new T.Vector3(Math.sin(this.azimuth)*this.distance*.62,this.distance*.78,Math.cos(this.azimuth)*this.distance*.62);this.camera.position.lerp(this.target.clone().add(offset),alpha);this.camera.lookAt(this.target);this.camera.updateMatrixWorld();}
 shake(amount=.15){this.shakeAmount=Math.max(this.shakeAmount,amount);}
 pulse(x:number,y:number,color:number,radius:number,duration=.5){
  const mesh=new T.Mesh(new T.RingGeometry(.88,1,64),new T.MeshBasicMaterial({color,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x/32,.08,y/32);mesh.scale.setScalar(.1);this.effects.add(mesh);this.pulses.push({mesh,age:0,duration,radius:radius/32});
 }
 slash(x:number,y:number,face:number){
  const mesh=new T.Mesh(new T.RingGeometry(1.3,1.58,24,1,face-.9,1.8),new T.MeshBasicMaterial({color:0xffd697,transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));mesh.rotation.x=Math.PI/2;mesh.position.set(x/32,.5,y/32);this.effects.add(mesh);this.pulses.push({mesh,age:0,duration:.2,radius:1});
 }
 damageLabel(x:number,y:number,amount:number){const element=document.createElement('span');element.className='damage-number';element.textContent=String(amount);this.labels.append(element);this.floating.push({element,x:x/32,z:y/32,age:0});}
 render(state:RenderState,dt:number,brightness=1,reduced=false){
  const start=performance.now();
  const frozen=state.paused||(!state.active&&!state.menu);if(!frozen)this.time+=dt;
  const t=this.time;
  this.destination.visible=!!state.moveTarget&&state.active&&!state.paused;
  if(state.moveTarget)this.destination.position.set(state.moveTarget.x/32,.06,state.moveTarget.y/32);
  const wanted=new T.Vector3(state.x/32,.35,state.y/32);if(state.menu)wanted.add(new T.Vector3(.6,0,-.3));
  if(this.menuCamera!==state.menu){this.menuCamera=state.menu;if(state.menu)this.camera.setViewOffset(window.innerWidth,window.innerHeight,-window.innerWidth*.19,0,window.innerWidth,window.innerHeight);else this.camera.clearViewOffset();}
  this.target.lerp(wanted,1-Math.exp(-dt*7));this.positionCamera(1);
  if(!reduced&&this.shakeAmount>.001){this.camera.position.x+=(Math.random()-.5)*this.shakeAmount;this.camera.position.z+=(Math.random()-.5)*this.shakeAmount;}this.shakeAmount*=Math.exp(-dt*13);
  this.renderer.toneMappingExposure=1.14*brightness;this.bloom.strength=reduced?.09:.24;
  this.moon.position.copy(this.target).add(new T.Vector3(-7,13,-4));this.moon.target.position.copy(this.target);
  this.heroLamp.position.set(state.x/32,.9,state.y/32+.2);
  const activeLights=this.lightSources.filter(l=>!l.name||!state.objects.find(o=>o.name===l.name&&o.type==='spawner'&&o.done)).sort((a,b)=>a.position.distanceToSquared(this.target)-b.position.distanceToSquared(this.target));
  for(let i=0;i<this.pointLights.length;i++){const l=activeLights[i],p=this.pointLights[i];if(l){p.position.copy(l.position);p.color.set(l.color);p.intensity=l.intensity*(reduced?1:1+Math.sin(t*4+i)*.04);}else p.intensity=0;}
  // Low foreground walls expose the player; rear walls retain their full volume.
  const frontX=Math.sin(this.azimuth),frontZ=Math.cos(this.azimuth);
  this.walls.forEach((w,i)=>{const dx=w.x-state.x/32,dz=w.z-state.y/32,front=dx*frontX+dz*frontZ,side=Math.abs(dx*frontZ-dz*frontX);const cut=front>-.25&&front<9&&side<6.2;w.current=T.MathUtils.lerp(w.current,cut?.28:w.height,1-Math.exp(-dt*12));
   dummy.position.set(w.x,w.current/2,w.z);dummy.scale.set(.97,w.current,.97);dummy.rotation.set(0,0,0);dummy.updateMatrix();this.wallMesh?.setMatrixAt(i,dummy.matrix);
   dummy.position.y=w.current+.03;dummy.scale.set(1.06,1,1.06);dummy.updateMatrix();this.caps?.setMatrixAt(i,dummy.matrix);
  });if(this.wallMesh)this.wallMesh.instanceMatrix.needsUpdate=true;if(this.caps)this.caps.instanceMatrix.needsUpdate=true;
  this.environment?.updateCutaway(state.x/32,state.y/32,frontX,frontZ,dt);
  this.hero.root.position.set(state.x/32,0,state.y/32);this.hero.root.visible=true;
  if(!frozen)animateCharacter(this.hero,t,dt,state.move,state.attackAnim>state.clock?(state.attackAnim-state.clock)/.3:0,state.face,state.hp<=0);
  const keep=new Set<number>();
  for(const e of state.enemies){if(e.dead&&state.clock-e.hit>2.5)continue;keep.add(e.id);let m=this.models.get(e.id);if(!m){m=character(e.family);this.models.set(e.id,m);this.actors.add(m.root);}
   const distance=Math.hypot(e.x-state.x,e.y-state.y);m.root.visible=distance<850;if(!m.root.visible)continue;
   const moving=Math.hypot(e.x/32-m.lastX,e.y/32-m.lastZ)>.002;m.root.position.set(e.x/32,0,e.y/32);m.lastX=e.x/32;m.lastZ=e.y/32;
   if(!frozen)animateCharacter(m,t,dt,moving,e.tell?.until?Math.max(0,1-(e.tell.until-state.clock)):0,Math.atan2(state.y-e.y,state.x-e.x),!!e.dead);
   if(e.family==='ember_nest')m.body.visible=false;
  }
  for(const [id,m]of this.models)if(!keep.has(id)){this.actors.remove(m.root);disposeModel(m.root);this.models.delete(id);}
  const barIds=new Set<number>();
  for(const e of state.enemies){if(e.dead||e.hp>=e.max||!this.models.get(e.id)?.root.visible||state.menu)continue;barIds.add(e.id);let bar=this.enemyBars.get(e.id);if(!bar){bar=document.createElement('div');bar.className='enemy-health';bar.append(document.createElement('i'));this.labels.append(bar);this.enemyBars.set(e.id,bar);}const elevation=e.family==='bellows_warden'?132:e.family==='furnace_brute'?96:e.family==='ash_rat'?29:70,p=this.project(e.x,e.y,elevation);bar.style.transform=`translate(${p.x}px,${p.y}px) translateX(-50%)`;(bar.firstElementChild as HTMLElement).style.width=`${Math.max(0,e.hp/e.max)*100}%`;}
  for(const [id,bar]of this.enemyBars)if(!barIds.has(id)){bar.remove();this.enemyBars.delete(id);}
  for(const o of state.objects){const m=this.objectModels.get(o.name);if(!m)continue;
   m.visible=!(o.done&&['pickup','door','secret'].includes(o.type));
   if(o.type==='pickup'){m.position.y=Math.sin(t*2+o.x)*.045;m.rotation.y=t*.55;}
   if(o.type==='lever')m.rotation.z=o.done?.2:0;
   if(o.type==='chest')m.userData.lid.rotation.x=o.done?-1.1:0;
   if(o.type==='exit')m.scale.setScalar(state.bossDead?1:.8);
  }
  if(this.cage)this.cage.visible=!state.objects.find(o=>o.name==='lever_gallery')?.done;
  for(const seal of this.seals)seal.mesh.visible=seal.kind==='furnace'?!state.furnaceOpen:!state.gateOpen;
  this.renderEffects(state,frozen?0:dt,t,reduced);
  this.renderer.info.reset();this.composer.render();this.drawCalls=this.renderer.info.render.calls;this.triangles=this.renderer.info.render.triangles;this.frameMs=performance.now()-start;
 }
 private renderEffects(s:RenderState,dt:number,t:number,reduced:boolean){
  // Telegraph rings are genuine ground geometry, so perspective and walls remain consistent.
  let used=0;this.telegraphMaterial.opacity=reduced?.35:.55;
  const danger=[...s.enemies.filter(e=>!e.dead&&e.tell).map(e=>e.tell!),...s.impacts];
  this.dangerMaterial.opacity=reduced?.055:.10;
  for(const tell of danger){let mesh=this.telegraphs[used++];if(!mesh){mesh=new T.Mesh(this.telegraphGeometry,this.telegraphMaterial);mesh.rotation.x=-Math.PI/2;mesh.add(new T.Mesh(this.dangerGeometry,this.dangerMaterial));this.effects.add(mesh);this.telegraphs.push(mesh);}mesh.visible=true;mesh.scale.setScalar(tell.radius/32);mesh.position.set(tell.x/32,.04,tell.y/32);}
  for(let i=used;i<this.telegraphs.length;i++)this.telegraphs[i].visible=false;
  for(let i=this.pulses.length-1;i>=0;i--){const p=this.pulses[i];p.age+=dt;const a=p.age/p.duration;if(a>=1){this.effects.remove(p.mesh);p.mesh.geometry.dispose();(p.mesh.material as T.Material).dispose();this.pulses.splice(i,1);continue;}p.mesh.scale.setScalar(p.radius*(.25+a*.75));(p.mesh.material as T.MeshBasicMaterial).opacity=(1-a)*(reduced?.25:.8);}
  for(let i=this.floating.length-1;i>=0;i--){const label=this.floating[i];label.age+=dt;const p=new T.Vector3(label.x,1.6+label.age,label.z).project(this.camera);label.element.style.transform=`translate(${(p.x+1)*window.innerWidth/2}px,${(1-p.y)*window.innerHeight/2}px)`;label.element.style.opacity=String(1-label.age);if(label.age>1){label.element.remove();this.floating.splice(i,1);}}
  let count=0;const color=new T.Color();
  const add=(x:number,y:number,z:number,c:number,strength=1)=>{if(count>=1500)return;color.set(c).multiplyScalar(strength);this.particlePositions.set([x,y,z],count*3);this.particleColors.set([color.r,color.g,color.b],count*3);count++;};
  // Shadow mist is deliberately quiet; only furnaces and action get bright particles.
  for(let i=0;i<110;i++){const x=s.x/32+Math.sin(i*43.17)*11,z=s.y/32+Math.cos(i*23.91)*11,y=((i*.293+t*.08)%4);add(x,y,z,i%5?0x354959:0xb86a32,.2);}
  for(const l of this.lightSources){if(l.position.distanceToSquared(this.target)>90)continue;for(let i=0;i<7;i++){const a=(t*.6+i*.147)%1;add(l.position.x+Math.sin(i*17+t)*.16,l.position.y+a*1.3,l.position.z+Math.cos(i*11)*.15,l.color,(1-a)*.9);}}
  for(const spark of s.sparks)add(spark.x/32,.25+(1-spark.life/spark.max)*1.3,spark.y/32,spark.color,Math.max(0,spark.life/spark.max)*2);
  for(const shot of s.shots){add(shot.x/32,.5,shot.y/32,0xff5920,4);for(let i=1;i<6;i++)add((shot.x-shot.vx*.012*i)/32,.5,(shot.y-shot.vy*.012*i)/32,0xff7022,2-i*.3);}
  this.particleGeometry.setDrawRange(0,count);this.particleGeometry.attributes.position.needsUpdate=true;this.particleGeometry.attributes.color.needsUpdate=true;
 }
 get objectCount(){return this.models.size+this.objectModels.size;}
 objectVisible(name:string){return this.objectModels.get(name)?.visible??false;}
 get cageVisible(){return this.cage?.visible??false;}
 get meshCount(){let n=0;this.scene.traverse(o=>{if((o as T.Mesh).isMesh)n++;});return n;}
}
