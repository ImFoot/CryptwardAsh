import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildEnvironment} from '../src/engine/environment.ts';
import type {DungeonDefinition} from '../src/dungeon.ts';

function fixture():DungeonDefinition {
 const width=15,height=15,collision=Array(width*height).fill(0);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(!x||!y||x===width-1||y===height-1)collision[y*width+x]=1;
 for(let y=2;y<height-2;y++)collision[y*width+7]=1;
 for(let x=2;x<width-2;x++)collision[8*width+x]=1;
 return {schemaVersion:1,id:'cutaway-regression',displayName:'Cutaway fixture',source:'authored',seed:11,width,height,tileSize:32,ground:Array(width*height).fill(1),collision,zones:Array(width*height).fill(4),objects:[{name:'spawn',type:'spawn',x:80,y:80,width:0,height:0,properties:{}}]};
}

function matrices(root:T.Object3D){
 const result:{mesh:T.InstancedMesh;index:number;position:T.Vector3;scale:T.Vector3}[]=[];
 root.traverse(o=>{if(!(o instanceof T.InstancedMesh))return;for(let i=0;i<o.count;i++){const matrix=new T.Matrix4();o.getMatrixAt(i,matrix);const position=new T.Vector3(),scale=new T.Vector3();matrix.decompose(position,new T.Quaternion(),scale);result.push({mesh:o,index:i,position,scale});}});
 return result;
}

test('environment cutaway changes height without moving frames and disposes cleanly',()=>{
 const dungeon=fixture(),collision=structuredClone(dungeon.collision),objects=structuredClone(dungeon.objects);
 const environment=buildEnvironment(dungeon),initial=matrices(environment.root);
 const tall=initial.filter(v=>v.scale.y>1.9),tallKeys=new Set(tall.map(v=>`${v.mesh.id}:${v.index}`));
 assert.ok(tall.length>0,'fixture creates visible cutaway piers');
 const initialFaces=new Map(initial.map(v=>[`${v.mesh.id}:${v.index}`,v.position.clone()]));

 // Look west from the central intersection, then east. The same nearby frame
 // should lower for the foreground and restore when it moves behind the camera.
 for(let i=0;i<3;i++)environment.updateCutaway(7.5,7.5,-1,0,1);
 const lowered=matrices(environment.root).filter(v=>tallKeys.has(`${v.mesh.id}:${v.index}`)&&v.scale.y<.4);
 assert.ok(lowered.length>0,'foreground tall decorations lower for the cutaway');
 for(let i=0;i<3;i++)environment.updateCutaway(7.5,7.5,1,0,1);
 const restored=matrices(environment.root);
 const loweredKeys=new Set(lowered.map(v=>`${v.mesh.id}:${v.index}`));
 assert.ok(restored.some(v=>loweredKeys.has(`${v.mesh.id}:${v.index}`)&&v.scale.y>1.9),'tall decorations restore when camera front changes');
 for(const value of restored){const before=initialFaces.get(`${value.mesh.id}:${value.index}`)!;assert.ok(value.position.x===before.x&&value.position.z===before.z,'cutaway updates preserve each face position');}

 const instances: T.InstancedMesh[]=[];environment.root.traverse(o=>{if(o instanceof T.InstancedMesh)instances.push(o);});
 const disposals=new Map(instances.map(mesh=>[mesh,0]));
 for(const mesh of instances)mesh.addEventListener('dispose',()=>disposals.set(mesh,disposals.get(mesh)!+1));
 environment.dispose();environment.dispose();
 assert.deepEqual([...disposals.values()],Array(instances.length).fill(1),'every instanced batch disposes exactly once');
 assert.deepEqual(dungeon.collision,collision,'environment build and cutaway do not mutate collision data');
 assert.deepEqual(dungeon.objects,objects,'environment build and cutaway do not mutate objects');
});
