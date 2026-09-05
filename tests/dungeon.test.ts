import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadAuthored,lineOfSight,validateDungeon} from '../src/dungeon.ts';
const raw=JSON.parse(fs.readFileSync('levels/level-01-ashvault.json','utf8'));
test('canonical authored map loads with all eight rooms and progression objects',()=>{const d=loadAuthored(raw);assert.equal(d.width,64);assert.equal(d.height,48);assert.equal(d.objects.filter(o=>o.properties.item==='seal_shard').length,3);assert.equal(d.objects.filter(o=>o.type==='spawner').length,3);assert.deepEqual([...new Set(d.zones)].sort(),[0,1,2,3,4,5,6,7,8]);});
test('rejects malformed layers and duplicate ids',()=>{const d=loadAuthored(raw);d.collision.pop();assert.throws(()=>validateDungeon(d),/layer size/);const d2=loadAuthored(raw);d2.objects.push(d2.objects[0]);assert.throws(()=>validateDungeon(d2),/Duplicate/);});
test('line of sight respects a wall and an open chamber',()=>{const d=loadAuthored(raw);assert.equal(lineOfSight(d,176,784,240,784),true);assert.equal(lineOfSight(d,176,784,176,300),false);assert.equal(lineOfSight(d,176,784,240,784,(x)=>x>210),false);});
test('all objective assets exist locally',()=>{const d=loadAuthored(raw);for(const o of d.objects.filter(o=>o.type==='pickup')){const item=o.properties.item==='seal_shard'?'teal_mana_shard':o.properties.item;assert.ok(fs.existsSync('public/assets/frames/items_ui/'+item+'.png'),item);}});
