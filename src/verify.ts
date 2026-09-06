// Development-only integration checks exercise the same scene methods as play.
export function installVerification(s:any){
 const button=document.createElement('button');button.id='verify-game';button.textContent='Run campaign verification';Object.assign(button.style,{position:'fixed',bottom:'5px',left:'5px',zIndex:'99',padding:'12px'});document.body.append(button);
 button.onclick=()=>{button.remove();const saved=localStorage.getItem('cryptward-save-v1');const results:string[]=[];const check=(v:boolean,label:string)=>{if(!v)throw Error(label);results.push('PASS · '+label);};
 try{
  const fresh=()=>{s.start();s.view.render(s,1/60);};
  fresh();s.active=false;
  check(s.hp===100&&s.ember===100,'Fresh run starts at full vitality and Ember');
  const start={x:s.x,y:s.y};s.moveBody(s,12,0);check(s.x===start.x+12,'Player movement works');
  check(s.solid(20,20),'Stone walls block movement');check(s.solid(1104,752),'Furnace Cross locked before key');check(s.solid(1744,1328),'Boss arena locked before three seals');
  const reach=(target:any,range=24)=>{const w=s.d.width,h=s.d.height,start=Math.floor(s.y/32)*w+Math.floor(s.x/32);const queue=[start],seen=new Set([start]);for(let q=0;q<queue.length;q++){const i=queue[q],x=(i%w)*32+16,y=Math.floor(i/w)*32+16;if(Math.hypot(x-target.x,y-target.y)<range)return true;for(const [nx,ny]of [[x-32,y],[x+32,y],[x,y-32],[x,y+32]]){const n=Math.floor(ny/32)*w+Math.floor(nx/32);if(nx>=0&&ny>=0&&nx<w*32&&ny<h*32&&!seen.has(n)&&s.canMove(nx,ny)){seen.add(n);queue.push(n);}}}return false;};
  const obj=(name:string)=>s.objects.find((o:any)=>o.name===name);
  check(!s.view.objectVisible('door_rat_run'),'Open passage has no freestanding geometry');
  check(reach(obj('key_brass_01')),'Brass key reachable before gate');check(reach(obj('seal_shard_a')),'First shard physically reachable');
  const nest=s.enemies.find((e:any)=>e.home?.name==='nest_rat_run');s.damageEnemy(nest,95);check(s.nests===1&&obj('nest_rat_run').done,'Destroyed furnace permanently stops its source');s.pick(obj('seal_shard_a'));check(s.shards===1,'First shard collected after furnace destruction');
  s.pick(obj('key_brass_01'));check(s.keys===1,'Brass key added to inventory');
  s.active=true;s.x=912;s.y=752;s.interact();check(s.furnaceOpen&&s.keys===0,'Brass gate opens and consumes key');
  check(reach(obj('seal_shard_b')),'Barracks shard reachable through unlocked gate');check(reach(obj('lever_gallery')),'Gallery lever reachable');
  const gallery=obj('seal_shard_c');check(s.solid(gallery.x,gallery.y)&&!s.canMove(gallery.x,gallery.y)&&s.view.cageVisible,'Gallery cage visibly blocks movement before lever');
  const refill=s.objects.find((o:any)=>o.properties.item==='teal_mana_shard');check(s.view.objectVisible(refill.name),'Ember refill has a visible 3D pickup');
  s.pick(obj('seal_shard_b'));s.pick(obj('seal_shard_c'));check(s.shards===2,'Gallery shard requires its lever');s.x=1776;s.y=624;s.interact();s.view.render(s,1/60);check(!s.solid(gallery.x,gallery.y)&&!s.view.cageVisible,'Lever removes cage and collision');s.pick(obj('seal_shard_c'));s.view.render(s,1/60);check(!s.view.objectVisible(gallery.name),'Collected 3D seal disappears');s.pick(gallery);check(s.shards===3,'Gallery lever releases third shard');
  check(reach(obj('seal_gate'),80),'Seal gate interactable from outside boss arena');s.x=1680;s.y=1136;s.interact();check(s.gateOpen,'Three seals open boss gate');check(reach(obj('exit_portal')),'Boss arena and exit reachable after gate opens');
  s.x=1904;s.y=1328;s.interact();check(s.active,'Portal refuses exit while boss is alive');
  s.x=688;s.y=848;s.face=0;s.clock=10;s.burstAt=0;const ember=s.ember;const target=s.spawn('bonebound',s.x+30,s.y);s.burst();check(s.ember===ember-18&&target.hp===12,'Burst consumes 18 Ember and deals 30 damage');
  s.invuln=0;s.dashAt=0;s.dash();const hp=s.hp;s.hit(20);check(s.hp===hp,'Dash grants contact-damage immunity');
  s.clock=20;s.invuln=0;s.dashUntil=0;s.hit(12);const h2=s.hp;s.hit(12);check(s.hp===h2,'Post-hit immunity prevents repeated damage');
  s.hp=0;s.die();document.querySelector<HTMLButtonElement>('#retry')!.click();check(s.hp===100&&s.shards===3&&s.nests===1&&s.gateOpen,'Checkpoint revival preserves permanent progression');
  const boss=s.enemies.find((e:any)=>e.family==='bellows_warden');s.damageEnemy(boss,boss.max);check(s.bossDead,'Warden defeat awakens exit');s.x=1904;s.y=1328;s.interact();check(!s.active&&document.body.textContent?.includes('You kept the flame.'),'Campaign completes and displays results');
  fresh();s.pause();const before={hp:s.hp,ember:s.ember,elapsed:s.elapsed};s.update(0,1000);check(s.hp===before.hp&&s.ember===before.ember&&s.elapsed===before.elapsed,'Pause freezes damage, timer, and Ember');
  for(const seed of [4701,-987,731942]){
   s.start(true,seed);check(reach(obj('key_brass_01')),'Expedition '+seed+': key reachable');
   s.pick(obj('key_brass_01'));const gate=obj('gate_furnace');s.x=gate.x-48;s.y=gate.y;s.interact();check(s.furnaceOpen,'Expedition '+seed+': brass gate opens');
   check(reach(obj('seal_shard_b'))&&reach(obj('lever_gallery')),'Expedition '+seed+': objectives reachable');
   for(const e of s.enemies.filter((e:any)=>e.family==='ember_nest'))s.damageEnemy(e,e.hp);s.pick(obj('seal_shard_a'));s.pick(obj('seal_shard_b'));const lever=obj('lever_gallery');s.x=lever.x;s.y=lever.y;s.interact();s.pick(obj('seal_shard_c'));
   const seal=obj('seal_gate');check(reach(seal,80),'Expedition '+seed+': seal approach reachable');s.x=seal.x;s.y=seal.y-48;s.interact();check(s.gateOpen&&reach(obj('exit_portal')),'Expedition '+seed+': boss and exit reachable');
  }
  fresh();s.keysDown.add('KeyD');const startScreen=s.project(s.x,s.y);for(let i=0;i<15;i++)s.simulate(1/60);s.keysDown.clear();const endScreen=s.project(s.x,s.y);check(endScreen.x-startScreen.x>25&&Math.abs(endScreen.y-startScreen.y)<.1,'Projected controls move right horizontally on screen');
  fresh();const melee=s.spawn('bonebound',s.x+48,s.y);s.face=0;for(let i=0;i<240;i++)s.simulate(1/60);check(melee.dead&&s.hp>0,'Live auto-attack defeats a telegraphing melee enemy');
  fresh();s.keysDown.add('KeyA');for(let i=0;i<240;i++)s.simulate(1/60);s.keysDown.clear();check(!s.solid(s.x,s.y),'Sustained movement stops safely at the wall');
  fresh();const startReveal=s.explored.reduce((sum:number,tile:number)=>sum+tile,0),exit=obj('exit_portal'),exitTile=Math.floor(exit.y/32)*s.d.width+Math.floor(exit.x/32);check(startReveal>0&&!s.explored[exitTile],'Minimap starts with distant rooms concealed');s.keysDown.add('KeyD');for(let i=0;i<120;i++)s.simulate(1/60);s.keysDown.clear();check(s.explored.reduce((sum:number,tile:number)=>sum+tile,0)>startReveal,'Minimap reveals only terrain explored along the path');
  for(let i=0;i<40;i++)s.spawn('ash_rat',240,784);check(s.enemies.filter((e:any)=>!e.dead).length===24,'Enemy population respects the global cap');
  fresh();for(let i=0;i<12;i++){const enemy=s.spawn('ash_rat',s.x+35,s.y);s.damageEnemy(enemy,enemy.max);}check(s.level===2&&s.maxHp===115&&s.bladeDamage===16&&s.burstDamage===33,'Kills grant XP and level 2 increases health and attack power');
  s.hp=1;s.die();document.querySelector<HTMLButtonElement>('#retry')!.click();check(s.level===2&&s.hp===115&&s.maxHp===115,'Checkpoint revival preserves earned levels and restores upgraded health');

  fresh();s.paused=true;const startAzimuth=s.view.azimuth;
  for(let turn=0;turn<8;turn++){s.view.rotate(1);const right=s.screenDirection(1,0),p=s.project(s.x,s.y),r=s.project(s.x+right.x*32,s.y+right.y*32);check(r.x>p.x+25&&Math.abs(r.y-p.y)<.1,'Camera turn '+(turn+1)+': screen-relative movement stays aligned');const back=s.view.unproject(p.x,p.y);check(Math.hypot(back.x-s.x,back.y-s.y)<.001,'Camera turn '+(turn+1)+': ground picking round-trips');}
  const memory=s.view.renderer.info.memory.geometries;
  for(let i=0;i<4;i++){fresh();s.view.render(s,1/60);}
  check(s.view.renderer.info.memory.geometries===memory,'Repeated restarts release model and level GPU geometry');
  check(s.view.meshCount>50&&s.view.renderer.shadowMap.enabled,'World renders physical meshes with real-time shadows');
 }catch(e){results.push('FAIL · '+String(e));}
 if(saved===null)localStorage.removeItem('cryptward-save-v1');else localStorage.setItem('cryptward-save-v1',saved);
 s.active=false;s.paused=true;const report=document.createElement('pre');report.id='test-report';report.textContent=results.join('\n');Object.assign(report.style,{position:'fixed',inset:'15px',zIndex:'100',background:'#102127',color:'#ccebdd',padding:'24px',overflow:'auto',fontSize:'13px'});document.body.append(report);
 };
}
