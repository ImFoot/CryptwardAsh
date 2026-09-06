import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import type {DungeonDefinition} from '../dungeon';

/**
 * Static environmental dressing for the Ashvault.
 *
 * The renderer owns the scene and camera; this module only owns the generated
 * meshes and returns a small disposable scene graph in world (tile) units.
 * Decorations deliberately stay on the edge of walkable cells or below the
 * player's silhouette so telegraphs, routes, and the near-camera wall cutaway
 * remain readable.
 */

type Stamp = {x:number;y:number;z:number;sx:number;sy:number;sz:number;ry?:number;rx?:number;rz?:number};
type Batch = {geometry:T.BufferGeometry;material:T.MeshStandardMaterial;items:Stamp[]};
type CutFrame = {x:number;z:number;longX:boolean;faceX:number;faceZ:number;current:number};
type CutBatch = {mesh:T.InstancedMesh;frames:CutFrame[];mode:'pier'|'lintel'|'recess'};

const hashString=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
const seedFor=(d:DungeonDefinition)=>hashString(`${d.id}:${d.seed??0}`);
const noise=(seed:number,x:number,z:number)=>{
  let h=(seed^Math.imul(x|0,374761393)^Math.imul(z|0,668265263))>>>0;
  h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;
};

export function buildEnvironment(d:DungeonDefinition): {root:T.Group;dispose:()=>void;updateCutaway:(x:number,z:number,frontX:number,frontZ:number,dt:number)=>void} {
  const root=new T.Group();
  root.name='ashvault-environment';
  const madeGeometry=new Set<T.BufferGeometry>();
  const madeMaterial=new Set<T.MeshStandardMaterial>();
  const batches:Batch[]=[];
  const seed=seedFor(d);
  const tile=d.tileSize||32;
  const walkable=(x:number,z:number)=>x>=0&&z>=0&&x<d.width&&z<d.height&&!d.collision[z*d.width+x];
  const zoneAt=(x:number,z:number)=>d.zones[z*d.width+x]||0;
  const interactive=d.objects
    .filter(o=>['spawn','pickup','checkpoint','door','lever','chest','secret','boss','exit'].includes(o.type))
    .map(o=>({x:o.x/tile,z:o.y/tile}));
  const clearOfObjective=(x:number,z:number,r=1.5)=>interactive.every(o=>Math.hypot(o.x-x,o.z-z)>r);

  const basalt=new T.MeshStandardMaterial({color:0x303a3d,roughness:.9,metalness:.08});
  const basaltEdge=new T.MeshStandardMaterial({color:0x4d5553,roughness:.84,metalness:.12});
  const iron=new T.MeshStandardMaterial({color:0x1d2427,roughness:.72,metalness:.62});
  const ironWarm=new T.MeshStandardMaterial({color:0x3b302a,roughness:.67,metalness:.7});
  const brass=new T.MeshStandardMaterial({color:0x92724a,roughness:.54,metalness:.74});
  const ash=new T.MeshStandardMaterial({color:0x655b52,roughness:.98,metalness:.02});
  const bone=new T.MeshStandardMaterial({color:0xb09b78,roughness:.88,metalness:.02});
  const ember=new T.MeshStandardMaterial({color:0x9a3d1d,emissive:0x4d160a,emissiveIntensity:1.15,roughness:.66,metalness:.12});
  const teal=new T.MeshStandardMaterial({color:0x3c9b9e,emissive:0x0b4148,emissiveIntensity:1.3,roughness:.54,metalness:.3});
  [basalt,basaltEdge,iron,ironWarm,brass,ash,bone,ember,teal].forEach(m=>madeMaterial.add(m));
  // One bevel segment keeps the architectural edge highlights while keeping
  // the instanced triangle count small across large generated floors.
  const columnGeo=new RoundedBoxGeometry(1,1,1,1,.065);madeGeometry.add(columnGeo);
  const trimGeo=new T.BoxGeometry(1,1,1);madeGeometry.add(trimGeo);
  const slabGeo=new T.BoxGeometry(1,1,1);madeGeometry.add(slabGeo);
  const stoneGeo=new T.DodecahedronGeometry(1,0);madeGeometry.add(stoneGeo);
  const boneGeo=new T.CylinderGeometry(.82,.7,1,8);madeGeometry.add(boneGeo);
  const pegGeo=new T.CylinderGeometry(1,1,1,8);madeGeometry.add(pegGeo);

  const addBatch=(geometry:T.BufferGeometry,material:T.MeshStandardMaterial,items:Stamp[])=>{
    if(!items.length)return;
    const mesh=new T.InstancedMesh(geometry,material,items.length);
    const dummy=new T.Object3D();
    for(let i=0;i<items.length;i++){
      const a=items[i];
      dummy.position.set(a.x,a.y,a.z);dummy.rotation.set(a.rx||0,a.ry||0,a.rz||0);dummy.scale.set(a.sx,a.sy,a.sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    }
    // Instance transforms span the whole dungeon; disabling per-batch culling
    // avoids Three.js testing the unexpanded unit-geometry bound at the origin.
    // The batches remain a single draw each and are tiny compared with the
    // existing wall/floor instancers.
    mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.StaticDrawUsage);
    root.add(mesh);batches.push({geometry,material,items});
  };

  const buttresses:Stamp[]=[];
  const trim:Stamp[]=[];
  const footTrim:Stamp[]=[];
  const wallPanels:Stamp[]=[];
  const rubble:Stamp[]=[];
  const drains:Stamp[]=[];
  const drainBars:Stamp[]=[];
  const furnacePlates:Stamp[]=[];
  const furnaceBars:Stamp[]=[];
  const brassMarkers:Stamp[]=[];
  const boneStacks:Stamp[]=[];
  const galleryRibs:Stamp[]=[];
  const galleryPins:Stamp[]=[];
  const cutFrames:CutFrame[]=[];

  // Boundary dressing is derived from the collision layer, so authored and
  // generated floors receive the same architectural language.
  for(let z=1;z<d.height-1;z++)for(let x=1;x<d.width-1;x++){
    if(!walkable(x,z))continue;
    const zone=zoneAt(x,z);
    const edge=[
      {dx:-1,dz:0,side:'w'},{dx:1,dz:0,side:'e'},
      {dx:0,dz:-1,side:'n'},{dx:0,dz:1,side:'s'},
    ].filter(v=>!walkable(x+v.dx,z+v.dz));
    if(edge.length){
      // One broad wall-foot pilaster per several boundary tiles. Keeping these
      // low and sparse makes them read as a continuous architectural base,
      // rather than as a row of free-standing posts in the cutaway foreground.
      const e=edge[Math.floor(noise(seed+zone*31,x,z)*edge.length)];
      if(noise(seed+7,x,z)>.79){
        const px=x+.5+e.dx*.46,pz=z+.5+e.dz*.46;
        const alongX=e.dz!==0;
        buttresses.push({x:px,y:.14,z:pz,sx:alongX?.34:.28,sy:.14,sz:alongX?.28:.34});
        trim.push({x:px,y:.31,z:pz,sx:alongX?.38:.31,sy:.035,sz:alongX?.31:.38});
        footTrim.push({x:px,y:.035,z:pz,sx:alongX?.4:.34,sy:.035,sz:alongX?.34:.4});
        // A shallow dark panel behind each selected pilaster reads as a
        // recessed socket at floor level without adding a light or silhouette.
        if(noise(seed+91,x,z)>.72)wallPanels.push({x:x+.5+e.dx*.48,y:.18,z:z+.5+e.dz*.48,sx:alongX?.11:.24,sy:.18,sz:alongX?.24:.11});
      }
      // Zone-specific wall dressing sits beside the route rather than across it.
      if(zone===5&&noise(seed+12,x,z)>.55){
        const px=x+.5+e.dx*.3,pz=z+.5+e.dz*.3;
        boneStacks.push({x:px,y:.17,z:pz,sx:.095,sy:.18,sz:.095});
        boneStacks.push({x:px+(along(e)==='x'?.1:0),y:.29,z:pz+(along(e)==='z'?.1:0),sx:.07,sy:.13,sz:.07,ry:.7});
      }
      if(zone===6&&noise(seed+17,x,z)>.5){
        const px=x+.5+e.dx*.28,pz=z+.5+e.dz*.28;
        galleryRibs.push({x:px,y:.08,z:pz,sx:e.dz!==0?.045:.23,sy:.035,sz:e.dz!==0?.23:.045});
        galleryPins.push({x:px,y:.14,z:pz,sx:.045,sy:.08,sz:.045});
      }
    }
    if(!clearOfObjective(x+.5,z+.5,1.7))continue;
    const n=noise(seed+53,x,z);
    // Ashfall gathers in corners; fragments never exceed ankle height.
    if((x+z*3)%4===0&&n>.81){
      rubble.push({x:x+.27+n*.34,y:.075,z:z+.25+noise(seed+54,x,z)*.46,sx:.07+n*.1,sy:.055+n*.06,sz:.08+n*.08,ry:n*6.28,rx:n*.7});
    }
    // A sparse drain language follows the Rat Run and long passages.
    if((zone===2||zone===0)&&((x*13+z*7+seed)%17===0)&&edge.length===0){
      const horizontal=noise(seed+61,x,z)>.5;
      drains.push({x:x+.5,y:.012,z:z+.5,sx:horizontal?.3:.62,sy:.012,sz:horizontal?.62:.3,ry:horizontal?0:Math.PI/2});
      for(let i=-1;i<=1;i++)drainBars.push({x:x+.5+(horizontal?i*.16:0),y:.035,z:z+.5+(horizontal?0:i*.16),sx:horizontal?.025:.7,sy:.025,sz:horizontal?.7:.025,ry:horizontal?0:Math.PI/2});
    }
    // Furnace Cross: dark iron grate panels with a single burnt-orange spine.
    if(zone===4&&(x+z*5+seed)%13===0){
      furnacePlates.push({x:x+.5,y:.012,z:z+.5,sx:.7,sy:.018,sz:.7});
      for(let i=-1;i<=1;i++)furnaceBars.push({x:x+.5+i*.19,y:.04,z:z+.5,sx:.025,sy:.026,sz:.57,ry:0});
      furnaceBars.push({x:x+.5,y:.043,z:z+.5,sx:.035,sy:.028,sz:.57,ry:0});
    }
    // Key Vault markers are small brass survey studs, not interactable objects.
    if(zone===3&&(x*11+z*3+seed)%19===0)brassMarkers.push({x:x+.5,y:.035,z:z+.5,sx:.12,sy:.028,sz:.12,ry:Math.PI/8});
    // Gallery ribs are inset in the open floor at a low cadence.
    if(zone===6&&(x*7+z*11+seed)%23===0){
      galleryRibs.push({x:x+.5,y:.017,z:z+.5,sx:.42,sy:.018,sz:.035});
      galleryRibs.push({x:x+.5,y:.018,z:z+.5,sx:.035,sy:.018,sz:.42});
    }
  }

  // Sparse vault frames live on solid boundary cells, exactly where the
  // renderer's wall instancer places its wall blocks. Their height is updated
  // with the camera cutaway below, so the foreground can open up while rear
  // rooms retain a strong cathedral silhouette.
  for(let z=1;z<d.height-1;z++)for(let x=1;x<d.width-1;x++){
    if(walkable(x,z))continue;
    const neighbors=[
      {dx:-1,dz:0},{dx:1,dz:0},{dx:0,dz:-1},{dx:0,dz:1},
    ].filter(v=>walkable(x+v.dx,z+v.dz));
    if(!neighbors.length||((x+z*3+seed)%5!==0))continue;
    const face=neighbors[Math.floor(noise(seed+101,x,z)*neighbors.length)];
    cutFrames.push({x:x+.5,z:z+.5,longX:face.dx===0,faceX:face.dx,faceZ:face.dz,current:1.95});
  }

  addBatch(columnGeo,basalt,buttresses);
  addBatch(trimGeo,basaltEdge,trim);
  addBatch(trimGeo,ironWarm,footTrim);
  addBatch(slabGeo,iron,wallPanels);
  addBatch(stoneGeo,ash,rubble);
  addBatch(slabGeo,iron,drains);
  addBatch(trimGeo,brass,drainBars);
  addBatch(slabGeo,iron,furnacePlates);
  addBatch(trimGeo,ember,furnaceBars);
  addBatch(pegGeo,brass,brassMarkers);
  addBatch(boneGeo,bone,boneStacks);
  addBatch(trimGeo,teal,galleryRibs);
  addBatch(pegGeo,teal,galleryPins);

  const cutBatches:CutBatch[]=[];
  const addCutBatch=(geometry:T.BufferGeometry,material:T.MeshStandardMaterial,mode:CutBatch['mode'])=>{
    if(!cutFrames.length)return;
    const mesh=new T.InstancedMesh(geometry,material,cutFrames.length);
    const dummy=new T.Object3D();
    for(let i=0;i<cutFrames.length;i++){
      const frame=cutFrames[i];
      const alongX=frame.longX;
      const sx=mode==='pier'?(alongX?.72:.18):mode==='lintel'?(alongX?.82:.26):alongX?.56:.06;
      const sz=mode==='pier'?(alongX?.18:.72):mode==='lintel'?(alongX?.26:.82):alongX?.06:.56;
      const sy=mode==='pier'?1.95:mode==='lintel'?.12:.9;
      const y=mode==='pier'?sy/2:mode==='lintel'?1.88:1.0;
      // Recess panels sit just on the walkable-facing side of the wall cell.
      dummy.position.set(frame.x+frame.faceX*.485,y,frame.z+frame.faceZ*.485);
      dummy.scale.set(sx,sy,sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    }
    mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    root.add(mesh);cutBatches.push({mesh,frames:cutFrames,mode});
  };
  addCutBatch(columnGeo,basalt,'pier');
  addCutBatch(trimGeo,brass,'lintel');
  addCutBatch(slabGeo,iron,'recess');

  // The boss room receives a restrained iron seal around its perimeter. It is
  // deliberately outside the likely hazard radius and has no gameplay state.
  const boss=d.objects.find(o=>o.type==='boss');
  const bossMeshes:T.Object3D[]=[];
  if(boss){
    const center=new T.Vector3(boss.x/tile,0,boss.y/tile);
    const ringMaterial=new T.MeshStandardMaterial({color:0x574a3c,roughness:.7,metalness:.63});madeMaterial.add(ringMaterial);
    for(const [radius,tube] of [[4.05,.028],[4.42,.018]] as [number,number][]){
      const geo=new T.TorusGeometry(radius,tube,6,72);madeGeometry.add(geo);
      const mesh=new T.Mesh(geo,ringMaterial);mesh.rotation.x=Math.PI/2;mesh.position.copy(center);mesh.position.y=.022;mesh.receiveShadow=true;root.add(mesh);bossMeshes.push(mesh);
    }
    const spokes:Stamp[]=[];
    for(let i=0;i<8;i++){const a=i*Math.PI/4;spokes.push({x:center.x+Math.cos(a)*4.22,y:.035,z:center.z+Math.sin(a)*4.22,sx:.055,sy:.025,sz:.34,ry:-a});}
    addBatch(trimGeo,ironWarm,spokes);
  }

  const cutDummy=new T.Object3D();
  const updateCutaway=(x:number,z:number,frontX:number,frontZ:number,dt:number)=>{
    const blend=1-Math.exp(-Math.max(0,dt)*12);
    for(const frame of cutFrames){
      const dx=frame.x-x,dz=frame.z-z;
      const front=dx*frontX+dz*frontZ;
      const side=Math.abs(dx*frontZ-dz*frontX);
      const cut=front>-.25&&front<9&&side<6.2;
      frame.current=T.MathUtils.lerp(frame.current,cut?.28:1.95,blend);
    }
    for(const batch of cutBatches){
      for(let i=0;i<batch.frames.length;i++){
        const frame=batch.frames[i],alongX=frame.longX,current=frame.current;
        const sx=batch.mode==='pier'?(alongX?.72:.18):batch.mode==='lintel'?(alongX?.82:.26):alongX?.56:.06;
        const sz=batch.mode==='pier'?(alongX?.18:.72):batch.mode==='lintel'?(alongX?.26:.82):alongX?.06:.56;
        let sy:number,y:number,px=frame.x+frame.faceX*.485,pz=frame.z+frame.faceZ*.485;
        if(batch.mode==='pier'){sy=current;y=current/2;}
        else if(batch.mode==='lintel'){sy=Math.min(.12,Math.max(.045,current*.12));y=Math.max(sy/2,current-sy/2);}
        else {sy=Math.max(.045,Math.min(1.5,current-.08));y=.04+sy/2;}
        cutDummy.position.set(px,y,pz);cutDummy.rotation.set(0,0,0);cutDummy.scale.set(sx,sy,sz);cutDummy.updateMatrix();batch.mesh.setMatrixAt(i,cutDummy.matrix);
      }
      batch.mesh.instanceMatrix.needsUpdate=true;
    }
  };

  // Expose a compact debug count to the renderer/art review without coupling
  // this module to a particular scene implementation.
  root.userData.environmentStats={batches:batches.length+cutBatches.length,instances:batches.reduce((n,b)=>n+b.items.length,0)+cutFrames.length*cutBatches.length,bossRing:!!boss};

  let disposed=false;
  const dispose=()=>{
    if(disposed)return;disposed=true;
    // InstancedMesh owns a separate instanceMatrix GPU attribute. Dispose it
    // while the meshes are still reachable so the renderer receives the
    // release event before the scene graph is detached.
    root.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});
    root.clear();
    root.removeFromParent();
    madeGeometry.forEach(g=>g.dispose());madeMaterial.forEach(m=>m.dispose());
    batches.length=0;cutFrames.length=0;cutBatches.length=0;bossMeshes.length=0;
  };
  return {root,dispose,updateCutaway};
}

function along(edge:{dx:number;dz:number}){return edge.dz!==0?'x':'z';}
