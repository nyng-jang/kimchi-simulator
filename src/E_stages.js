/* ---------- 3D raycast helper ---------- */
const ray=new THREE.Raycaster(),mouseN=new THREE.Vector2();
function setMouse(e){const r=canvas.getBoundingClientRect();mouseN.x=((e.clientX-r.left)/r.width)*2-1;mouseN.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(mouseN,camera);}
function planeHit(y){const p=new THREE.Plane(new THREE.Vector3(0,1,0),-y),v=new THREE.Vector3();return ray.ray.intersectPlane(p,v)?v:null;}
function toScreen(v){const p=v.clone().project(camera);return {x:(p.x+1)/2*1280,y:(1-p.y)/2*720};}
let pointerDown=false;
canvas.addEventListener('pointerdown',e=>{pointerDown=true;setMouse(e);handlers.down&&handlers.down(e);});
addEventListener('pointerup',e=>{pointerDown=false;handlers.up&&handlers.up(e);});
canvas.addEventListener('pointermove',e=>{setMouse(e);handlers.move&&handlers.move(e);});
addEventListener('keydown',e=>{if(e.code==='Space'&&handlers.key&&!dexOpen()){e.preventDefault();handlers.key();}});
let handlers={};

/* ---------- CUT ---------- */
const CUT={};
const BOARD_X=-0.5, BOWL_POS=new THREE.Vector3(3.1,0,-0.2);
function enterCut(){
  scene=new THREE.Scene();lights(scene);kitchen(scene);
  camera.position.set(0.2,3.7,3.1);camera.lookAt(0.3,0,-0.35);
  const board=new THREE.Mesh(new THREE.BoxGeometry(3.6,0.14,2.3),mat('#c99a63'));board.position.set(BOARD_X,0.07,0);scene.add(board);
  const b2=new THREE.Mesh(new THREE.BoxGeometry(3.6,0.02,2.3),mat('#b5844f'));b2.position.set(BOARD_X,0.005,0);scene.add(b2);
  const bowl=basin(0.95,0.55);bowl.position.copy(BOWL_POS);scene.add(bowl);
  // knife
  const knife=new THREE.Group();const blade=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.42,1.5),mat('#d7dde2'));blade.position.set(0,0.21,0);knife.add(blade);
  const edge=new THREE.Mesh(new THREE.BoxGeometry(0.031,0.04,1.5),mat('#f4f7f9'));edge.position.set(0,0.02,0);knife.add(edge);
  const handle=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.14,0.75),mat('#4a2e1c'));handle.position.set(0,0.36,1.1);knife.add(handle);
  const kg=glove();kg.scale.setScalar(0.62);kg.position.set(0,0.47,1.1);kg.rotation.set(0,Math.PI/2,0);knife.add(kg);
  scene.add(knife);CUT.knife=knife;
  CUT.queue=S.sel.slice();CUT.qi=0;CUT.inBowl=0;S.pieces=[];S.cut={};
  handlers={move:cutMove,down:cutChop,key:cutChop,up:null};
  frameFn=cutFrame;loadIng();}
function loadIng(){
  if(CUT.group)scene.remove(CUT.group);
  const k=CUT.queue[CUT.qi];const ing=ING[k];
  CUT.ing=ing;CUT.method=null;CUT.chops=[];CUT.done=[];CUT.busy=false;CUT.finished=false;
  CUT.group=new THREE.Group();CUT.group.position.set(BOARD_X,0.14,0);scene.add(CUT.group);
  CUT.pieces=[{x0:0,x1:1,z0:0,z1:1}];rebuildPieces();
  CUT.guides=new THREE.Group();CUT.group.add(CUT.guides);
  renderQueue();renderMethods();
  $('cutTip').textContent=`${ing.n} 손질! 아래에서 써는 방식을 골라요`;
  coach('cutCoach',{cabbage:'배추는 포기로 길게 갈라야 양념이 잘 배지~',radish:'무는 깍둑썰면 깍두기, 채썰면 무생채여!',watermelon:'수박을…? 그래 일단 썰어 봐라 허허',dujjon:'그 과자도 써냐? 할미는 모르겄다~',leek:'파는 송송 채썰어도 좋고 큼직해도 좋고~'}[ing.k]||`${ing.n}은(는) 니 맘대로 썰어 봐라~`);}
function coach(id,t){$(id).textContent=t;GRANDMA.say(Math.min(2.4,0.6+t.length*0.05));}
function rebuildPieces(){
  if(CUT.meshes)CUT.meshes.forEach(m=>CUT.group.remove(m));
  CUT.meshes=CUT.pieces.map(p=>{const m=buildPiece(CUT.ing,p.x0,p.x1,p.z0,p.z1);m.userData.reg=p;m.position.set(m.userData.cx,m.userData.cy,m.userData.cz);m.userData.tgt=m.position.clone();CUT.group.add(m);return m;});
  layoutPieces(true);}
function layoutPieces(instant){const gap=0.13;const doneX=CUT.done.filter(c=>c.ax==='x').map(c=>c.p),doneZ=CUT.done.filter(c=>c.ax==='z').map(c=>c.p);
  CUT.meshes.forEach(m=>{const r=m.userData.reg,xc=(r.x0+r.x1)/2,zc=(r.z0+r.z1)/2;
    const ox=(doneX.filter(p=>p<xc).length-doneX.length/2)*gap, oz=(doneZ.filter(p=>p<zc).length-doneZ.length/2)*gap;
    m.userData.tgt=new THREE.Vector3(m.userData.cx+ox,m.userData.cy,m.userData.cz+oz);if(instant)m.position.copy(m.userData.tgt);});}
function renderQueue(){$('cutQueue').innerHTML=CUT.queue.map((k,i)=>`<div class="q ${i===CUT.qi?'cur':i<CUT.qi?'done':''}"><img src="${THUMB[k]}">${ING[k].n}</div>`).join('');}
function renderMethods(){const started=CUT.done.length>0;
  $('methods').innerHTML=METHODS.map(m=>`<button data-k="${m.k}" class="${CUT.method===m.k?'on':''}" ${started||CUT.finished?'disabled':''}>${m.n}<small>${m.d}</small></button>`).join('');
  document.querySelectorAll('#methods button').forEach(b=>b.onclick=()=>pickMethod(b.dataset.k));}
function pickMethod(k){SFX.click();CUT.method=k;const m=METHOD[k];
  CUT.chops=[...m.x.map(p=>({ax:'x',p})),...m.z.map(p=>({ax:'z',p}))];CUT.done=[];renderMethods();drawGuides();
  if(!CUT.chops.length){$('cutTip').textContent='통째로 넣기! 그대로 그릇에 담아요';setTimeout(finishIng,500);CUT.finished=true;renderMethods();}
  else $('cutTip').textContent=`칼을 점선에 맞추고 클릭! (스페이스바도 OK) · 남은 칼질 ${CUT.chops.length}번`;}
function secW(ing){return modelZRange(ing);}
function secH(ing){return modelTop(ing);}
function guidePos(c){const ing=CUT.ing,[zmin,zmax]=secW(ing);const doneX=CUT.done.filter(d=>d.ax==='x'),doneZ=CUT.done.filter(d=>d.ax==='z'),gap=0.13;
  if(c.ax==='x'){const x=-ing.L/2+ing.L*c.p+(doneX.filter(d=>d.p<c.p).length-doneX.length/2)*gap;return x;}
  const z=zmin+(zmax-zmin)*c.p+(doneZ.filter(d=>d.p<c.p).length-doneZ.length/2)*gap;return z;}
function drawGuides(){while(CUT.guides.children.length)CUT.guides.remove(CUT.guides.children[0]);
  const ing=CUT.ing,[zmin,zmax]=secW(ing),h=secH(ing)+0.03;
  CUT.chops.forEach(c=>{if(CUT.done.includes(c))return;const pts=[];
    if(c.ax==='x'){const x=guidePos(c);pts.push(new THREE.Vector3(x,h,zmin-0.25),new THREE.Vector3(x,h,zmax+0.25));}
    else{const z=guidePos(c);pts.push(new THREE.Vector3(-ing.L/2-0.25,h,z),new THREE.Vector3(ing.L/2+0.25,h,z));}
    const g=new THREE.BufferGeometry().setFromPoints(pts);const l=new THREE.Line(g,new THREE.LineDashedMaterial({color:c===CUT.target?0xd9482f:0xffffff,dashSize:0.08,gapSize:0.06,depthTest:false,linewidth:2}));l.computeLineDistances();l.renderOrder=10;CUT.guides.add(l);});}
function remainingAxis(){const r=CUT.chops.filter(c=>!CUT.done.includes(c));if(!r.length)return null;return r.some(c=>c.ax==='x')?'x':'z';}
function cutMove(){if(!CUT.method||CUT.finished)return;const hit=planeHit(0.4);if(!hit)return;const ax=remainingAxis();if(!ax)return;
  const local=hit.clone().sub(CUT.group.position);const v=ax==='x'?local.x:local.z;
  let best=null,bd=1e9;CUT.chops.forEach(c=>{if(c.ax!==ax||CUT.done.includes(c))return;const d=Math.abs(guidePos(c)-v);if(d<bd){bd=d;best=c;}});
  if(best!==CUT.target){CUT.target=best;drawGuides();}}
function cutChop(){if(!CUT.method||CUT.finished||CUT.busy)return;cutMove();const c=CUT.target;if(!c)return;
  CUT.busy=true;CUT.anim={t:0,c};}
function applyCut(c){
  const np=[];CUT.pieces.forEach(p=>{if(c.ax==='x'&&p.x0<c.p&&p.x1>c.p){np.push({...p,x1:c.p},{...p,x0:c.p});}else if(c.ax==='z'&&p.z0<c.p&&p.z1>c.p){np.push({...p,z1:c.p},{...p,z0:c.p});}else np.push(p);});
  CUT.pieces=np;rebuildPieces();          // positions = layout before this cut
  CUT.done.push(c);
  CUT.meshes.forEach(m=>{m.rotation.y=(Math.random()-.5)*0.08;});
  layoutPieces(false);SFX.chop();CUT.shake=0.12;
  CUT.target=null;drawGuides();renderMethods();
  const left=CUT.chops.length-CUT.done.length;
  if(left>0){$('cutTip').textContent=`좋아! 남은 칼질 ${left}번`;if(remainingAxis()==='z'&&c.ax==='x'&&!CUT.chops.filter(q=>q.ax==='x'&&!CUT.done.includes(q)).length)$('cutTip').textContent=`이번엔 세로로! 남은 칼질 ${left}번`;}
  else{$('cutTip').textContent=`${CUT.ing.n} 손질 완료! 딱딱 잘 썰었다 👏`;CUT.finished=true;renderMethods();setTimeout(finishIng,650);}}
function finishIng(){if(!$('cut').classList.contains('on'))return;
  S.cut[CUT.ing.k]=CUT.method;
  CUT.flying=CUT.meshes.map((m,i)=>{const wp=new THREE.Vector3();m.getWorldPosition(wp);CUT.group.remove(m);m.position.copy(wp);scene.add(m);
    const a=Math.random()*Math.PI*2,r=Math.random()*0.55;const dst=new THREE.Vector3(BOWL_POS.x+Math.cos(a)*r,0.25+CUT.inBowl*0.006+Math.random()*0.15,BOWL_POS.z+Math.sin(a)*r*0.8);
    S.pieces.push({k:CUT.ing.k,reg:m.userData.reg,method:CUT.method});
    return {m,from:wp.clone(),to:dst,t:-i*0.03,s0:m.scale.x,s1:0.45};});
  CUT.inBowl+=CUT.meshes.length;CUT.meshes=[];SFX.plop();
  setTimeout(()=>{if(!$('cut').classList.contains('on'))return;CUT.qi++;if(CUT.qi>=CUT.queue.length){$('cutTip').textContent='손질 끝! 양념 만들러 가자~';renderQueue();$('methods').innerHTML='<button class="on" id="btnToSeason" style="background:#d9482f;color:#fff;border-color:#d9482f;font-size:22px;padding:10px 26px">양념 만들러 가기 ▶</button>';$('btnToSeason').onclick=()=>{SFX.click();go('season');};}else loadIng();},900);}
function cutFrame(dt){
  const k=CUT.knife;const ax=remainingAxis();
  // knife orientation & position
  if(ax==='z'||(!ax&&CUT.lastAx==='z')){k.rotation.y=Math.PI/2;}else k.rotation.y=0;if(ax)CUT.lastAx=ax;
  let tx=BOARD_X+1.4,tz=0.3,ty=0.9;
  if(CUT.method&&!CUT.finished&&CUT.target){const gp=guidePos(CUT.target);if(CUT.target.ax==='x'){tx=CUT.group.position.x+gp;tz=0;}else{tz=gp;tx=CUT.group.position.x;}ty=0.75;}
  if(CUT.anim){CUT.anim.t+=dt;const t=CUT.anim.t;ty=t<0.08?0.75-t/0.08*0.63:0.12+(t-0.08)/0.15*0.63;if(t>=0.08&&!CUT.anim.hit){CUT.anim.hit=true;applyCut(CUT.anim.c);}if(t>0.23){CUT.anim=null;CUT.busy=false;}}
  k.position.x+=(tx-k.position.x)*Math.min(1,dt*18);k.position.z+=(tz-k.position.z)*Math.min(1,dt*18);k.position.y=CUT.anim?ty:k.position.y+(ty-k.position.y)*Math.min(1,dt*10);
  if(CUT.meshes)CUT.meshes.forEach(m=>m.position.lerp(m.userData.tgt,Math.min(1,dt*10)));
  if(CUT.flying){let all=true;CUT.flying.forEach(f=>{f.t+=dt*1.8;const t=Math.max(0,Math.min(1,f.t));if(t<1)all=false;f.m.position.lerpVectors(f.from,f.to,t);f.m.position.y+=Math.sin(t*Math.PI)*1.2;const s=f.s0+(f.s1-f.s0)*t;f.m.scale.setScalar(s);f.m.rotation.x+=dt*4*(1-t);});if(all)CUT.flying=null;}
  if(!CAMTW){if(CUT.shake>0){CUT.shake-=dt;camera.position.y=3.7+Math.sin(CUT.shake*90)*0.02;}else camera.position.y=3.7;}}

/* ---------- SEASON ---------- */
const SEASON={};
function enterSeason(){
  scene=new THREE.Scene();lights(scene);kitchen(scene);
  camera.position.set(0,3.6,3.2);camera.lookAt(0,0,-0.6);
  const bowl=basin(1.05,0.6,'#c3c8cd');bowl.position.set(0,0,0.45);scene.add(bowl);SEASON.bowl=bowl;
  SEASON.items=SEAS.map((s,i)=>{const g=container(s);const row=i<6?0:1,col=i%6;g.position.set(-2.75+col*1.1+(row?0.55:0),0,row?-2.25:-1.25);g.userData.s=s;scene.add(g);return g;});
  SEASON.blobs=[];SEASON.paste=null;SEASON.mixed=false;SEASON.spoons=[];
  const spoon=new THREE.Group();const sc=new THREE.Mesh(new THREE.SphereGeometry(0.16,6,4,0,Math.PI*2,Math.PI/2,Math.PI/2),mat('#dfe3e6',{side:THREE.DoubleSide}));sc.scale.y=0.5;spoon.add(sc);const hd=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.04,0.9),mat('#dfe3e6'));hd.position.set(0,0.05,0.5);hd.rotation.x=-0.25;spoon.add(hd);const sg=glove();sg.scale.setScalar(0.32);sg.position.set(0,0.12,0.95);sg.rotation.set(-0.3,0,0);spoon.add(sg);spoon.visible=false;scene.add(spoon);SEASON.spoon=spoon;
  // rebuild blobs for existing season (when coming back)
  for(const[k,n]of Object.entries(S.season))for(let i=0;i<n;i++)addBlob(SEA[k],true);
  $('seasonLbls').innerHTML=SEAS.map(s=>`<div class="lbl ${s.weird?'weird':''}" id="lbl_${s.k}">${s.n}<em></em></div>`).join('');
  updSeasonUI();coach('seasonCoach','고춧가루, 젓갈, 마늘은 기본이고~ 나머지는 니 맘대로 넣어 봐라!');
  handlers={down:seasonClick,move:seasonHover,up:null,key:null};frameFn=seasonFrame;}
function seasonPick(){let best=null;SEASON.items.forEach(g=>{const h=ray.intersectObject(g,true);if(h.length&&(!best||h[0].distance<best.d))best={g,d:h[0].distance};});return best&&best.g;}
function seasonHover(){const g=seasonPick();canvas.style.cursor=g?'pointer':'default';SEASON.hover=g;}
function seasonClick(){const g=seasonPick();if(!g)return;const s=g.userData.s;if((S.season[s.k]||0)>=9){toast(`${s.n}은(는) 9숟갈까지만!`);return;}
  if(SEASON.mixed){unmix();}
  S.season[s.k]=(S.season[s.k]||0)+1;SEASON.spoons.push({s,from:g.position.clone().add(new THREE.Vector3(0,0.7,0)),t:0});updSeasonUI();
  const lines={gochu:'고춧가루는 2~4숟갈이면 딱 좋아~',shrimp:'새우젓! 그렇지 그거여~',fishsauce:'액젓 들어가면 감칠맛이 확 살지',salt:'소금은 조금씩! 짜면 못 먹어~',mayo:'마요네즈를…? 허허 해 봐라',choco:'초코를 왜 넣냐 얘야~',cola:'콜라? 김치가 톡 쏘겄다!',sugar:'설탕 조금은 괜찮어',maesil:'매실청 넣으면 단맛이 은은하지',rice:'찹쌀풀 넣어야 양념이 착 붙어!'};
  coach('seasonCoach',(S.season[s.k]>=5&&s.k==='gochu')?'아이고 고춧가루 너무 많다! 매워서 어쩌려고~':lines[s.k]||`${s.n} 들어간다~`);}
function addBlob(s,instant){const r=0.11+Math.random()*0.05;const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,0),mat(s.c));
  const a=Math.random()*Math.PI*2,d=Math.random()*0.55;m.position.set(Math.cos(a)*d,0.12+Math.min(SEASON.blobs.length,40)*0.004,0.45+Math.sin(a)*d);m.scale.y=0.55;m.rotation.y=Math.random()*3;
  if(!instant){m.userData.drop=0.6;m.position.y+=0.6;}scene.add(m);SEASON.blobs.push(m);}
function sauceColor(){let tot=0;const c=new THREE.Color(0,0,0);for(const[k,n]of Object.entries(S.season)){if(!n)continue;const sc=hex(SEA[k].c);const w=n*(k==='gochu'?2.2:k==='choco'||k==='cola'?1.6:1);c.r+=sc.r*w;c.g+=sc.g*w;c.b+=sc.b*w;tot+=w;}if(!tot)return null;c.r/=tot;c.g/=tot;c.b/=tot;return c;}
function updSeasonUI(){SEAS.forEach(s=>{const e=document.querySelector(`#lbl_${s.k} em`);if(e)e.textContent=S.season[s.k]?`×${S.season[s.k]}`:'';});
  const any=Object.values(S.season).some(v=>v);$('btnStir').disabled=!any||SEASON.mixed;$('btnToMix').disabled=!(SEASON.mixed||!any);
  $('btnToMix').textContent=any?'버무리러 가기 ▶':'양념 없이 버무리기 ▶';}
function unmix(){if(SEASON.paste){scene.remove(SEASON.paste);SEASON.paste=null;}SEASON.blobs.forEach(b=>b.visible=true);SEASON.mixed=false;}
$('btnSeasonReset').onclick=()=>{SFX.click();S.season={};SEASON.blobs.forEach(b=>scene.remove(b));SEASON.blobs=[];unmix();updSeasonUI();coach('seasonCoach','다 비웠다! 처음부터 다시 해 봐라~');};
$('btnStir').onclick=()=>{SFX.stir(1.4);SEASON.stir={t:0};$('btnStir').disabled=true;};
$('btnToMix').onclick=()=>{SFX.click();go('mix');};
function seasonFrame(dt){
  SEASON.items.forEach(g=>{const tgt=g===SEASON.hover?0.12:0;g.position.y+=(tgt-g.position.y)*Math.min(1,dt*12);const s=g.userData.s,el=$('lbl_'+s.k);if(el){const p=toScreen(g.position.clone().add(new THREE.Vector3(0,0.95,0)));el.style.left=p.x+'px';el.style.top=p.y+'px';}});
  const sp=SEASON.spoon;
  if(SEASON.spoons.length){const j=SEASON.spoons[0];j.t+=dt*2.4;const t=Math.min(1,j.t);const to=new THREE.Vector3((Math.random()-.5)*0.02,0.9,0.45);sp.visible=true;sp.position.lerpVectors(j.from,to,t);sp.position.y+=Math.sin(t*Math.PI)*0.7;sp.rotation.z=t>0.85?(t-0.85)*6:0;
    if(t>=1){addBlob(j.s,false);SFX.plop();SEASON.spoons.shift();}}else sp.visible=false;
  SEASON.blobs.forEach(b=>{if(b.userData.drop>0){const d=Math.min(b.userData.drop,dt*3);b.userData.drop-=d;b.position.y-=d;}});
  if(SEASON.stir){const st=SEASON.stir;st.t+=dt;sp.visible=true;const a=st.t*10;sp.position.set(Math.cos(a)*0.5,0.45,0.45+Math.sin(a)*0.5);sp.rotation.set(0,-a,0);
    SEASON.blobs.forEach(b=>{b.position.x*=0.985;b.position.z=0.45+(b.position.z-0.45)*0.985;b.scale.multiplyScalar(0.985);});
    if(st.t>1.4){SEASON.stir=null;SEASON.blobs.forEach(b=>b.visible=false);const c=sauceColor();const n=Object.values(S.season).reduce((a,b)=>a+b,0);
      const paste=new THREE.Mesh(new THREE.CylinderGeometry(0.62,0.55,0.08+Math.min(n,30)*0.008,8),mat(c));paste.position.set(0,0.12,0.45);scene.add(paste);SEASON.paste=paste;SEASON.mixed=true;SFX.ding();updSeasonUI();coach('seasonCoach','양념 완성! 이제 버무리러 가자~');}}}

/* ---------- MIX ---------- */
const MIX={};
function enterMix(){
  scene=new THREE.Scene();lights(scene);kitchen(scene);
  camera.position.set(0,4.6,2.9);camera.lookAt(0,0,-0.15);
  const b=basin(2.1,0.9,'#c3c8cd');scene.add(b);
  MIX.sauce=sauceColor();MIX.progress=0;MIX.done=false;
  if(MIX.sauce){const sd=new THREE.Mesh(new THREE.CylinderGeometry(1.0,0.9,0.12,8),mat(MIX.sauce));sd.position.set(0.1,0.16,0.1);scene.add(sd);MIX.sauceMesh=sd;}else MIX.sauceMesh=null;
  // 손질한 크기 그대로 사용. 대야가 넘칠 만큼 많을 때만 전체를 같은 비율로 살짝 줄임
  const built=S.pieces.map(p=>buildPiece(ING[p.k],p.reg.x0,p.reg.x1,p.reg.z0,p.reg.z1));
  let vol=0;built.forEach(m=>{m.geometry.computeBoundingBox();const s=m.geometry.boundingBox.getSize(new THREE.Vector3());vol+=s.x*s.y*s.z;});
  const sc=Math.max(0.75,Math.min(1,Math.cbrt(2.6/Math.max(vol,1e-3))));
  let bi=0;MIX.items=S.pieces.map(p=>{const m=built[bi++];m.scale.setScalar(sc);
    const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*1.25;m.position.set(Math.cos(a)*r,0.22+Math.random()*0.35,Math.sin(a)*r);m.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);
    m.userData.v=new THREE.Vector3();m.userData.spin=new THREE.Vector3();scene.add(m);return m;});
  const gl=glove();gl.scale.setScalar(1.0);
  gl.position.set(0.6,1.1,0.8);scene.add(gl);MIX.glove=gl;MIX.last=null;
  $('mixBar').style.width='0%';$('btnToStore').disabled=true;
  coach('mixCoach',MIX.sauce?'손맛이 제일 중요해~ 구석구석 문질러라!':'양념이 없으니… 그냥 섞기만 하는 거여?');
  handlers={move:mixMove,down:()=>{MIX.last=null;},up:()=>{MIX.last=null;},key:null};frameFn=mixFrame;}
function mixMove(){const hit=planeHit(0.35);if(!hit)return;MIX.cursor=hit;
  if(pointerDown){if(MIX.last){const d=hit.clone().sub(MIX.last);const len=d.length();if(len>0.001&&len<1){
      MIX.progress=Math.min(1,MIX.progress+len/38);
      MIX.items.forEach(m=>{const dd=m.position.distanceTo(hit);if(dd<0.75){m.userData.v.addScaledVector(d,6*(1-dd/0.75));m.userData.v.y+=len*2.5;m.userData.spin.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(len*30);}});
      if(Math.random()<len*1.5)squelch(0,0.1+Math.random()*0.06,240+Math.random()*200,0.6);}}MIX.last=hit.clone();}}
function mixFrame(dt){
  const g=MIX.glove;if(MIX.cursor){const ty=pointerDown?0.55:1.0;g.position.x+=(MIX.cursor.x-g.position.x)*Math.min(1,dt*16);g.position.z+=(MIX.cursor.z+0.15-g.position.z)*Math.min(1,dt*16);g.position.y+=(ty-g.position.y)*Math.min(1,dt*12);g.rotation.y=Math.sin(performance.now()/300)*0.15;}
  const coat=MIX.sauce?MIX.progress:0;
  MIX.items.forEach(m=>{const u=m.userData;m.position.addScaledVector(u.v,dt);u.v.multiplyScalar(Math.pow(0.04,dt));u.v.y-=dt*4;
    if(m.position.y<0.22){m.position.y=0.22;u.v.y=Math.abs(u.v.y)*0.2;}
    const r=Math.hypot(m.position.x,m.position.z),lim=1.45+ (m.position.y-0.2)*0.4;if(r>lim){m.position.x*=lim/r;m.position.z*=lim/r;u.v.x*=-0.3;u.v.z*=-0.3;}
    m.rotation.x+=u.spin.x*dt;m.rotation.y+=u.spin.y*dt;m.rotation.z+=u.spin.z*dt;u.spin.multiplyScalar(Math.pow(0.05,dt));
    if(MIX.sauce&&Math.abs((u.coat||0)-coat)>0.01){u.coat=coat;const col=m.geometry.attributes.color,c0=u.col0,k=coat*0.68,s=MIX.sauce;for(let i=0;i<col.count;i++){col.array[i*3]=c0[i*3]+(s.r-c0[i*3])*k;col.array[i*3+1]=c0[i*3+1]+(s.g-c0[i*3+1])*k;col.array[i*3+2]=c0[i*3+2]+(s.b-c0[i*3+2])*k;}col.needsUpdate=true;}});
  if(MIX.sauceMesh){const s=Math.max(0.02,1-MIX.progress*1.1);MIX.sauceMesh.scale.set(s,1,s);MIX.sauceMesh.visible=s>0.03;}
  $('mixBar').style.width=(MIX.progress*100).toFixed(0)+'%';
  if(MIX.progress>=1&&!MIX.done){MIX.done=true;SFX.ding();toast('다 버무렸다! 🎉');$('btnToStore').disabled=false;coach('mixCoach','아이고 잘 버무렸다! 빛깔 좋네~');}}
$('btnToStore').onclick=()=>{SFX.click();// photo
  MIX.glove.visible=false;const cp=camera.position.clone();camera.position.set(0,3.6,2.3);camera.lookAt(0,0.2,0);R.render(scene,camera);S.photo=R.domElement.toDataURL('image/jpeg',0.85);camera.position.copy(cp);
  S.plate=MIX.items;go('store');};

