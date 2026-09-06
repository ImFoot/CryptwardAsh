import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findPath,clearPath,type Point} from '../src/navigation.ts';

function grid(rows:string[]){
 const width=rows[0].length,height=rows.length;
 const walkable=(x:number,y:number)=>[[x-9,y-9],[x+9,y-9],[x-9,y+9],[x+9,y+9]].every(([a,b])=>rows[Math.floor(b/32)]?.[Math.floor(a/32)]==='.');
 return {width,height,walkable};
}
function route(rows:string[],from:Point,to:Point){
 const {width,height,walkable}=grid(rows),path=findPath(from,to,width,height,walkable);let previous=from;
 for(const point of path){assert.ok(clearPath(previous,point,walkable),'Every segment clears the full player footprint');previous=point;}
 return path;
}
test('open floor reaches the precise click without grid snapping',()=>{
 const to={x:111,y:81};assert.deepEqual(route(['#####','#...#','#...#','#...#','#####'],{x:48,y:48},to),[to]);
});
test('routes around a wall through the available doorway',()=>{
 const to={x:144,y:48},path=route(['#######','#..#..#','#..#..#','#.....#','#######'],{x:48,y:48},to);
 assert.deepEqual(path.at(-1),to);assert.ok(path.some(p=>p.y>=96));
});
test('a locked crossing stops on reachable floor and routes through only after opening',()=>{
 const from={x:48,y:48},to={x:144,y:48};
 const blocked=route(['#######','#..#..#','#..#..#','#######'],from,to);assert.ok(blocked.length);assert.ok(blocked.every(p=>p.x<96));
 assert.deepEqual(route(['#######','#.....#','#..#..#','#######'],from,to).at(-1),to);
});
test('diagonal corners cannot connect isolated chambers',()=>{
 const path=route(['#####','#.###','##..#','#####'],{x:48,y:48},{x:112,y:80});assert.deepEqual(path,[]);
});
test('wall and out-of-map clicks end at safe floor without invalid coordinates',()=>{
 const rows=['#####','#...#','#...#','#####'],from={x:48,y:48};
 for(const to of [{x:128,y:48},{x:1e9,y:-1e9}])assert.ok(route(rows,from,to).length);
 const {width,height,walkable}=grid(rows);assert.deepEqual(findPath(from,{x:NaN,y:48},width,height,walkable),[]);
});
test('sweeping checks gaps between endpoints rather than only tile centres',()=>{
 assert.equal(clearPath({x:16,y:16},{x:48,y:16},x=>x<28||x>36),false);
});
