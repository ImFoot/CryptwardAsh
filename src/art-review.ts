// Development-only visual tour: deterministic scenes without changing the save.
export function installArtReview(s:any){
 const panel=document.createElement('div');panel.id='art-review';
 Object.assign(panel.style,{position:'fixed',bottom:'3px',left:'3px',zIndex:'100',display:'flex',gap:'4px',flexWrap:'wrap',maxWidth:'calc(100vw - 6px)'});
 for(const [label,target]of [['Vestibule','spawn'],['Rat Run','nest_rat_run'],['Gallery','lever_gallery'],['Warden','boss'],['Expedition','generated']]){
  const button=document.createElement('button');button.textContent=label;
  Object.assign(button.style,{background:'#101d24',color:'#d8c69e',border:'1px solid #776747',padding:'6px',fontSize:'10px'});
  button.onclick=()=>{
   const started=performance.now();s.start(target==='generated',731942);panel.dataset.buildMs=String(Math.round(performance.now()-started));s.furnaceOpen=s.gateOpen=true;s.invuln=99999;
   const o=s.objects.find((o:any)=>o.name===target||o.type===target)||s.objects.find((o:any)=>o.type==='spawn');
   s.x=o.x+(target==='boss'?-95:0);s.y=o.y+(target==='boss'?60:0);s.simulate(0);
   const p=s.project(s.x,s.y);s.cameras.main.centerOn(p.x,p.y);s.updateHud();
   document.querySelector('#toast')?.classList.add('hidden');s.toastUntil=0;
  };panel.append(button);
 }
 const hide=document.createElement('button');hide.textContent='Hide review controls';hide.onclick=()=>panel.remove();panel.append(hide);document.body.append(panel);
}
