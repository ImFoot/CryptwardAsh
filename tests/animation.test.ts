import test from 'node:test';
import assert from 'node:assert/strict';
import {animateCharacter,character,disposeModel} from '../src/engine/models.ts';

test('articulated motion covers the same stride at 30 and 120 frames per second',()=>{
 const slow=character('hero'),fast=character('hero');
 for(let i=1;i<=30;i++)animateCharacter(slow,i/30,1/30,true,0,.3,false);
 for(let i=1;i<=120;i++)animateCharacter(fast,i/120,1/120,true,0,.3,false);
 assert.ok(Math.abs(slow.phase-fast.phase)<1e-10);
 assert.ok(Math.abs(slow.legs[0].rotation.x-fast.legs[0].rotation.x)<1e-10);
 assert.ok(Math.abs(slow.root.rotation.y-fast.root.rotation.y)<1e-10);
 disposeModel(slow.root);disposeModel(fast.root);
});

test('corpse collapse is independent of rendering frame rate',()=>{
 const slow=character('bonebound'),fast=character('bonebound');
 for(let i=1;i<=30;i++)animateCharacter(slow,i/30,1/30,false,0,0,true);
 for(let i=1;i<=120;i++)animateCharacter(fast,i/120,1/120,false,0,0,true);
 assert.ok(Math.abs(slow.body.rotation.z-fast.body.rotation.z)<1e-10);
 assert.ok(slow.body.rotation.z>1.5);
 disposeModel(slow.root);disposeModel(fast.root);
});
