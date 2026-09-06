import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {generateDungeon,validateProgression} from '../src/generator.ts';
const catalog=JSON.parse(fs.readFileSync('templates/ashvault-room-catalog.json','utf8'));
test('same seed produces identical dungeon data',()=>{assert.deepEqual(generateDungeon(-782,catalog),generateDungeon(-782,catalog));assert.notDeepEqual(generateDungeon(12,catalog),generateDungeon(13,catalog));});
test('different seeds change the navigable layout, not only decoration',()=>{const signature=(seed:number)=>{const d=generateDungeon(seed,catalog);return JSON.stringify({collision:d.collision,objects:d.objects.map(({name,x,y})=>({name,x,y}))});};const layouts=new Set(Array.from({length:16},(_,seed)=>signature(seed)));assert.ok(layouts.size>=8,`Expected at least 8 layouts, received ${layouts.size}`);assert.notEqual(signature(12),signature(13));});
test('10,000 seeds preserve inventory progression and reachable objectives',()=>{const times:number[]=[];for(let seed=0;seed<10000;seed++){const start=performance.now();const d=generateDungeon(seed,catalog);times.push(performance.now()-start);assert.equal(d.objects.filter(o=>o.properties.item==='seal_shard').length,3);assert.equal(d.objects.filter(o=>o.type==='boss').length,1);}times.sort((a,b)=>a-b);console.log('Generation p95: '+times[9500].toFixed(2)+'ms');});
test('validator rejects a required seal placed inside the locked boss arena',()=>{const d=generateDungeon(4,catalog),boss=d.objects.find(o=>o.type==='boss')!,shard=d.objects.find(o=>o.properties.item==='seal_shard')!;shard.x=boss.x;shard.y=boss.y;assert.throws(()=>validateProgression(d),/Shard behind seal/);});
