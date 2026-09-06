import Phaser from 'phaser';
import type {DungeonDefinition} from './dungeon';

type Point = {x:number;y:number};
type Projection = (x:number,y:number,elevation?:number)=>Point;
type Lamp = {x:number;y:number;color:number;phase:number;image:Phaser.GameObjects.Image};

/** Materials are baked once per floor. Animation only touches pooled light sprites. */
export function stonePainter(scene:Phaser.Scene,c:CanvasRenderingContext2D,d:DungeonDefinition,project:Projection) {
 const source=scene.textures.get('cathedral-stone').getSourceImage() as HTMLImageElement;
 const material=(tint:string)=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(source,0,0,512,512);ctx.fillStyle=tint;ctx.fillRect(0,0,512,512);
  const pattern=c.createPattern(canvas,'repeat')!;pattern.setTransform(new DOMMatrix().scale(320/512));return pattern;
 };
 const pattern=material('#16333d35'),wallPattern=material('#06131be8');
 const warmPattern=material('#23180e35'),tealPattern=material('#103b3a35');
 const medallion=scene.textures.get('ward-medallion').getSourceImage() as HTMLImageElement;
 const wards=d.objects.filter(o=>['checkpoint','boss','spawner'].includes(o.type));
 const origin=project(0,0),px=project(1,0),py=project(0,1);
 const wall=(x:number,y:number)=>x<0||y<0||x>=d.width||y>=d.height||d.collision[y*d.width+x]>0;
 return {
  surface(x:number,y:number,raised=false) {
   c.save();c.clip();
   c.setTransform(px.x-origin.x,px.y-origin.y,py.x-origin.x,py.y-origin.y,origin.x,origin.y-(raised?44:0));
   const zone=d.zones[y*d.width+x];
   c.fillStyle=raised?wallPattern:zone===8?warmPattern:zone===6?tealPattern:pattern;c.fillRect(x*32-2,y*32-2,36,36);
   if(!raised){
    for(const o of wards){const size=o.type==='boss'?260:o.type==='checkpoint'?180:140;if(Math.abs(x*32-o.x)<size&&Math.abs(y*32-o.y)<size){c.globalAlpha=.86;c.drawImage(medallion,o.x-size/2,o.y-size/2,size,size);c.globalAlpha=1;}}
    // Contact occlusion hugs the actual collision boundary, never a decorative grid.
    for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])if(wall(x+dx,y+dy)){
     const sx=x*32+(dx===1?32:0),sy=y*32+(dy===1?32:0);
     const g=c.createLinearGradient(sx,sy,sx+(dx?-dx*23:0),sy+(dy?-dy*23:0));
     g.addColorStop(0,'#02090bd9');g.addColorStop(1,'#02090b00');c.fillStyle=g;c.fillRect(x*32,y*32,32,32);
     c.strokeStyle='#baa27155';c.lineWidth=1;c.beginPath();c.moveTo(sx+(dx?-dx*5:0),sy+(dy?-dy*5:0));c.lineTo(sx+(dx?-dx*5:32),sy+(dy?-dy*5:32));c.stroke();
    }
   }
   c.restore();
  },
  face(a:Point,b:Point,bottom:Point,bright:boolean){
   c.save();c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineTo(bottom.x,bottom.y);c.lineTo(a.x,bottom.y-b.y+a.y);c.closePath();c.clip();
   c.setTransform((b.x-a.x)/32,(b.y-a.y)/32,0,1,a.x,a.y);
   c.fillStyle=pattern;c.fillRect(0,0,32,44);c.fillStyle=bright?'#0b242b99':'#08171dc0';c.fillRect(0,0,32,44);
   c.fillStyle='#02070a77';for(const y of [14,29])c.fillRect(0,y,32,1.3);
   c.restore();
  },
 };
}

export class CryptAtmosphere {
 private decor:Phaser.GameObjects.Image[]=[];
 private lamps:Lamp[]=[];
 private heroLight?:Phaser.GameObjects.Image;
 private haze:Phaser.GameObjects.Image[]=[];
 private objectLights:{name:string;image:Phaser.GameObjects.Image;type:string}[]=[];
 constructor(private scene:Phaser.Scene){
  const atlas=scene.textures.get('crypt-architecture');
  const image=atlas.getSourceImage() as HTMLImageElement;
  // The generated atlas has four equal cells; crop via texture frames, preserving alpha.
  for(let i=0;i<4;i++)if(!atlas.has(String(i)))atlas.add(String(i),0,Math.floor(i*image.width/4),0,Math.floor(image.width/4),image.height);
  if(!scene.textures.exists('soft-light')){
   const tex=scene.textures.createCanvas('soft-light',256,256)!;const c=tex.context;
   const g=c.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'#ffffff');g.addColorStop(.16,'#ffffffb0');g.addColorStop(.48,'#ffffff36');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(0,0,256,256);tex.refresh();
  }
 }
 private glow(x:number,y:number,color:number,width:number,height:number,alpha:number,depth=-70){
  const image=this.scene.add.image(x,y,'soft-light').setTint(color).setDisplaySize(width,height).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth);
  this.decor.push(image);return image;
 }
 rebuild(d:DungeonDefinition,project:Projection){
  this.destroy();
  const wall=(x:number,y:number)=>x<0||y<0||x>=d.width||y>=d.height||d.collision[y*d.width+x]>0;
  const prop=(x:number,y:number,frame:number,height:number)=>{
   const p=project(x,y,38),image=this.scene.add.image(p.x,p.y,'crypt-architecture',String(frame));
   image.setDisplaySize(height*image.width/image.height,height).setOrigin(.5,.96).setDepth(p.y+38);
   this.decor.push(image);
   const shadow=this.scene.add.image(p.x+22,p.y+12,'soft-light').setTint(0x000000).setDisplaySize(height*.9,height*.36).setAlpha(.8).setDepth(-80);this.decor.push(shadow);
   return p;
  };
  for(let y=1;y<d.height-1;y++)for(let x=1;x<d.width-1;x++){
   if(!wall(x,y)||wall(x,y+1))continue;
   const corner=!wall(x+1,y)&&wall(x-1,y);
   if(x%5===0){
    const p=prop(x*32+16,y*32+22,1,108);
    this.lamps.push({x:p.x,y:p.y-76,color:0xffa24d,phase:x*.73+y,image:this.glow(p.x,p.y+36,0xffa24d,270,170,.46)});
    this.glow(p.x,p.y-76,0xff9a42,75,90,.32,8500);
   }else if(corner||x%9===2){
    prop(x*32+16,y*32+18,corner?2:0,corner?148:124);
   }else if(x%11===3){prop(x*32+16,y*32+20,3,68);}
  }
  for(const o of d.objects.filter(o=>['checkpoint','spawner','exit','boss'].includes(o.type))){
   const p=project(o.x,o.y),image=this.glow(p.x,p.y,o.type==='spawner'||o.type==='boss'?0xf89649:0x51dac9,o.type==='boss'?340:230,150,.24);
   this.objectLights.push({name:o.name,image,type:o.type});
  }
  this.heroLight=this.glow(0,0,0xaddfd3,230,145,.16);
  for(let i=0;i<7;i++){
   const fog=this.glow(0,0,i%2?0x789baf:0x8bafa3,600+i*60,90+i*7,.028,8200);this.haze.push(fog);
  }
 }
 update(t:number,hero:Point,reduced:boolean,objects:{name:string;done?:boolean}[],bossDead:boolean){
  const view=this.scene.cameras.main.worldView;
  for(const image of this.decor)image.setVisible(image.x+image.displayWidth>view.x&&image.x-image.displayWidth<view.right&&image.y+image.displayHeight>view.y&&image.y-image.displayHeight<view.bottom);
  for(const light of this.objectLights){if((light.type==='spawner'&&objects.find(o=>o.name===light.name)?.done)||(light.type==='boss'&&bossDead))light.image.setVisible(false);if(light.type==='exit')light.image.setAlpha(bossDead?.4:.08);}
  for(const lamp of this.lamps){lamp.image.setAlpha(reduced?.34:.4+Math.sin(t*3.7+lamp.phase)*.045+Math.sin(t*7.3+lamp.phase)*.025);}
  this.heroLight?.setPosition(hero.x,hero.y+8);
  for(let i=0;i<this.haze.length;i++){
   const x=view.x+((i*251+(reduced?0:t*(4+i)))%(view.width+500))-150;
   this.haze[i].setPosition(x,view.y+view.height*(.25+i*.12));
  }
 }
 drawFire(g:Phaser.GameObjects.Graphics,t:number,reduced:boolean){
  const v=this.scene.cameras.main.worldView;
  for(const l of this.lamps){if(l.x<v.x-100||l.x>v.right+100||l.y<v.y-100||l.y>v.bottom+100)continue;
   for(let i=0;i<4;i++){const age=(t*(.35+i*.06)+l.phase+i*.23)%1;g.fillStyle(i%2?0xffcd78:0xff9143,(1-age)*(reduced?.3:.7));g.fillCircle(l.x+Math.sin(age*5+i)*9,l.y-age*36,1.1-age*.6);}
  }
 }
 destroy(){for(const image of this.decor)image.destroy();this.decor=[];this.lamps=[];this.haze=[];this.objectLights=[];this.heroLight=undefined;}
}
