
/* =========================================================
   FLOW
   ========================================================= */
let K3=null, MK=null;
const STEPNAMES=[['select','재료 고르기'],['cut','손질하기'],['season','양념 만들기'],['mix','버무리기'],['store','보관하기'],['eval','할머니 평가']];
const camG=new THREE.PerspectiveCamera(32,1,0.1,30), camP=new THREE.PerspectiveCamera(32,1,0.1,30);
function setInset(which,x,y,w,h){if(!which){INSET=null;$('callwin').classList.remove('on');return;}
  INSET={which,x,y,w,h};const e=$('callwin');e.style.left=x+'px';e.style.top=y+'px';e.style.width=w+'px';e.style.height=h+'px';e.classList.add('on');$('callName').innerHTML=MIC+(which==='g'?'할머니':'나');}
const MIC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
function setCam(p,l,fov){camera.fov=fov||40;camera.updateProjectionMatrix();camera.position.set(...p);camera.lookAt(...l);camera.userData.base={p,l};}
function go(id){document.querySelectorAll('.screen').forEach(s=>{if(s.id!=='dex')s.classList.remove('on');});$(id).classList.add('on');
  const idx=STEPNAMES.findIndex(s=>s[0]===id);const sb=$('steps');
  if(idx>=0){sb.classList.add('on');sb.innerHTML=STEPNAMES.map((s,i)=>(i?`<b class="ln${i<=idx?' done':''}"></b>`:'')+`<span class="${i<idx?'done':i===idx?'cur':''}"><i>${i<idx?'✓':i+1}</i>${s[1]}</span>`).join('');}else sb.classList.remove('on');
  handlers={};canvas.style.cursor='default';setInset(null);PLAYER.root.visible=true;PLAYER.root.position.set(0,0,0.05);PLAYER.root.rotation.y=0;if(K3)K3.decor.forEach(o=>o.visible=true);
  if(['cut','season','mix'].includes(id)){setInset('g',22,462,224,236);camera.fov=48;camera.updateProjectionMatrix();GRANDMA.setPose('idle');GRANDMA.setExpr('smile');}
  ({title:enterTitle,intro:enterIntro,select:enterSelect,cut:enterCut,season:enterSeason,mix:enterMix,store:enterStore,eval:enterEval}[id]||(()=>{}))();}
function headPos(C,up){const v=new THREE.Vector3();C.j.head.getWorldPosition(v);v.y+=up||0.42;return toScreen(v);}
function placeBubble(el,C,up,side){const p=headPos(C,up);const h=el.offsetHeight||50;
  if(!side&&p.y-h>78){el.style.whiteSpace='nowrap';el.style.maxWidth='none';el.className=el.className.replace(/ ?side[LR]/g,'');el.style.left=p.x+'px';el.style.top=p.y+'px';return;}
  const hp=headPos(C,0.12),scr=el.closest('.screen'),pn=scr&&[...scr.querySelectorAll('.panel')].find(x=>x.offsetParent);
  const lim=pn?pn.offsetLeft-12:1268,roomR=lim-(hp.x+58),roomL=hp.x-58-12;
  el.style.whiteSpace='nowrap';el.style.maxWidth='none';const w=el.offsetWidth||200;
  let sd=side||(hp.x>640?'L':'R');if(sd==='R'&&w>roomR&&roomL>roomR)sd='L';else if(sd==='L'&&w>roomL&&roomR>roomL)sd='R';
  const room=sd==='R'?roomR:roomL;if(w>room){el.style.whiteSpace='normal';el.style.maxWidth=Math.max(160,room)+'px';el.style.width='max-content';}
  el.className=el.className.replace(/ ?side[LR]/g,'')+' side'+sd;
  el.style.left=(hp.x+(sd==='L'?-58:58))+'px';el.style.top=hp.y+'px';}

/* ---------- TITLE ---------- */
function enterTitle(){scene=K3.scene;K3.items.clear();PLAYER.root.rotation.y=0;PLAYER.setPose('wave');PLAYER.setExpr('smile');PLAYER.look=0;
  setCam([-0.62,1.48,1.95],[-0.5,1.3,0],40);
  frameFn=(dt)=>{const t=performance.now()/1000;camera.position.x=-0.62+Math.sin(t*0.3)*0.06;camera.lookAt(-0.5,1.3,0);};}
/* ---------- INTRO ---------- */
const INTRO=[['나','외국 생활 3년째… 오늘따라 할머니 김치가 너무너무 먹고 싶다.','worry','idle'],['나','마트엔 이상한 김치밖에 없고… 에라 모르겠다, 내가 직접 담가 보자!','laugh','cheer'],['할머니','아이고 우리 강아지! 김장을 한다고? 할미가 영상통화로 다 봐주마~','laugh','phone'],['할머니','재료는 니 맘대로 골라 봐라. 뭘 넣든 할미가 맛 평가 해줄게!','smile','phone']];
let introI=0;
function enterIntro(){scene=K3.scene;setCam([0.3,1.7,2.3],[0.3,1.38,0],40);frameFn=null;introI=0;showIntro();}
function showIntro(){const [w,t,ex,pose]=INTRO[introI];$('introWho').textContent=w;$('introWho').className='who'+(w==='할머니'?' g':'');$('introText').textContent=t;
  if(w==='나'){PLAYER.setExpr(ex);PLAYER.setPose(pose);PLAYER.say(2.2);setInset(null);}
  else{PLAYER.setPose('phone');PLAYER.setExpr('smile');GRANDMA.setExpr(ex);GRANDMA.setPose('wave');GRANDMA.say(2.4);setInset('g',840,96,380,300);}}
$('introDlg').onclick=()=>{SFX.click();introI++;if(introI>=INTRO.length){GRANDMA.setPose('idle');go('select');}else showIntro();};

/* ---------- SELECT ---------- */
const SEL_LINES={cabbage:['배추는 기본이지!','smile'],radish:['무 넣으면 시원하겠다~','smile'],watermelon:['수박…? 해보는 거야!','laugh'],dujjon:['두쫀쿠 김치라니 ㅋㅋ','laugh'],mintchoco:['민초 김치… 괜찮을까?','worry'],cheese:['치즈 김치는 맛있을 듯?','laugh'],pineapple:['파인애플도 가 보자!','laugh'],oyster:['굴 넣으면 할머니 김치 맛!','smile']};
/* ---------- 대야 + 낙하 물리 (재료 무게에 따라 튕겨 나감) ---------- */
const WEIGHT={cabbage:3,radish:2.4,mustard:0.3,leek:0.4,chive:0.2,water:0.25,onion:1,pear:1.4,cucumber:0.8,oyster:0.3,watermelon:8,dujjon:0.6,mintchoco:0.7,cheese:0.8,pineapple:2.6};
const BOUNCE={watermelon:0.35,cabbage:0.3,radish:0.35,dujjon:0.6,mintchoco:0.5,cheese:0.45,pineapple:0.4,oyster:0.5};
const SIZE={watermelon:0.3,cabbage:0.28,pineapple:0.26,radish:0.26,dujjon:0.16};
const TUB={x:0.32,y:0.93,z:0.78,r:0.4,h:0.26};
const TUB_RB=TUB.r*0.6, TUB_RT=TUB.r*0.96, TUB_FLOOR=TUB.y+0.06, TUB_TOP=TUB.y+TUB.h;
const GRAV=-6.2;
let BODIES=[];
function tubR(y){const t=Math.max(0,Math.min(1,(y-TUB_FLOOR)/(TUB_TOP-TUB_FLOOR)));return TUB_RB+(TUB_RT-TUB_RB)*t;}
function spawnBody(k,fromSky){const m=wholeModel(ING[k]);const bb=new THREE.Box3().setFromObject(m),sz=bb.getSize(new THREE.Vector3());
  const s=(SIZE[k]||0.24)/Math.max(sz.x,sz.y,sz.z);m.scale.setScalar(s);
  const dims=[sz.x*s,sz.y*s,sz.z*s].sort((p,q)=>p-q);const r=Math.max(0.035,Math.cbrt(dims[0]*dims[1]*dims[2])*0.62);
  const ang=Math.random()*Math.PI*2,off=Math.random()*0.12;
  const p=new THREE.Vector3(TUB.x+Math.cos(ang)*off,fromSky?2.9+Math.random()*0.3:TUB_FLOOR+r+BODIES.length*0.05,TUB.z+Math.sin(ang)*off);
  m.position.copy(p);m.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);shadowAll(m);K3.items.add(m);
  const body={k,m,p,v:new THREE.Vector3(rnd(-.2,.2),fromSky?-0.5:0,rnd(-.2,.2)),w:new THREE.Vector3(rnd(-4,4),rnd(-4,4),rnd(-4,4)),r,mass:WEIGHT[k]||1,e:BOUNCE[k]||0.5,inside:true,landed:!fromSky,out:false};
  BODIES.push(body);return body;}
function removeBody(k){const i=BODIES.findIndex(b=>b.k===k);if(i<0)return;const b=BODIES[i];K3.items.remove(b.m);BODIES.splice(i,1);}
function splash(src){ // 무거운 재료가 떨어지면 주변 재료를 튕겨 냄
  BODIES.forEach(o=>{if(o===src)return;const d=o.p.distanceTo(src.p);if(d>0.55)return;const f=src.mass/(o.mass+0.3)*(1-d/0.55);
    const out=new THREE.Vector3(o.p.x-TUB.x,0,o.p.z-TUB.z);if(out.lengthSq()<1e-4)out.set(rnd(-1,1),0,rnd(-1,1));out.normalize();
    o.v.y+=f*0.42;o.v.addScaledVector(out,f*0.3);o.w.set(rnd(-1,1),rnd(-1,1),rnd(-1,1)).multiplyScalar(f*6);});
  if(src.mass>=2.4){SFX.boing();PLAYER.flash('surprise',1.0);}}
function stepPhysics(dt){const n=4,h=dt/n;
  for(let s=0;s<n;s++){
    BODIES.forEach(b=>{b.v.y+=GRAV*h;b.p.addScaledVector(b.v,h);
      const dx=b.p.x-TUB.x,dz=b.p.z-TUB.z,d=Math.hypot(dx,dz);
      if(b.p.y>TUB_TOP+b.r*0.3)b.inside=d<TUB_RT;
      if(b.inside&&b.p.y<TUB_TOP+b.r){ // 대야 안
        if(b.p.y-b.r<TUB_FLOOR){b.p.y=TUB_FLOOR+b.r;if(b.v.y<0){const imp=-b.v.y;b.v.y=imp*b.e;b.v.x*=0.8;b.v.z*=0.8;b.w.multiplyScalar(0.7);
            if(!b.landed){b.landed=true;SFX.plop();if(b.mass>=1)splash(b);}}}
        const R=tubR(b.p.y);if(d+b.r>R&&d>1e-4){const nx=dx/d,nz=dz/d,pen=d+b.r-R;b.p.x-=nx*pen;b.p.z-=nz*pen;const vn=b.v.x*nx+b.v.z*nz;if(vn>0){b.v.x-=(1+b.e)*vn*nx;b.v.z-=(1+b.e)*vn*nz;b.v.y+=vn*0.15;}}
      }else{ // 대야 밖
        if(b.p.y<TUB_TOP&&d<TUB_RT+b.r+0.02&&b.p.y>TUB.y-0.02){const nx=dx/d||1,nz=dz/d||0;const tgt=TUB_RT+b.r+0.02;b.p.x=TUB.x+nx*tgt;b.p.z=TUB.z+nz*tgt;const vn=b.v.x*nx+b.v.z*nz;if(vn<0){b.v.x-=(1+b.e)*vn*nx;b.v.z-=(1+b.e)*vn*nz;}}
        const onCounter=Math.abs(b.p.x)<2.25&&b.p.z>0.28&&b.p.z<1.25, ground=onCounter?0.93:0;
        if(b.p.y-b.r<ground){b.p.y=ground+b.r;if(b.v.y<0)b.v.y=-b.v.y*b.e*0.6;b.v.x*=0.86;b.v.z*=0.86;b.w.multiplyScalar(0.85);}
        if(!b.out&&b.landed&&b.p.y<TUB_TOP){b.out=true;const nm=ING[b.k].n;$('selBubble').textContent=`앗! ${nm} 튀어나갔다 ㅋㅋ`;PLAYER.flash('laugh',1.4);PLAYER.say(0.8);
          setTimeout(()=>{if(BODIES.includes(b)){b.p.set(TUB.x+rnd(-.08,.08),2.4,TUB.z+rnd(-.08,.08));b.v.set(0,-0.5,0);b.inside=true;b.out=false;b.landed=true;}},1600);}
      }
      if(b.p.y<-1){b.p.set(TUB.x,2.4,TUB.z);b.v.set(0,0,0);b.inside=true;}
    });
    // 재료끼리 충돌 (무게 비율로 밀어냄)
    for(let i=0;i<BODIES.length;i++)for(let j=i+1;j<BODIES.length;j++){const A=BODIES[i],B=BODIES[j];const nv=B.p.clone().sub(A.p),dist=nv.length(),rr=A.r+B.r;
      if(dist<rr&&dist>1e-5){nv.divideScalar(dist);const ia=1/A.mass,ib=1/B.mass,pen=rr-dist;A.p.addScaledVector(nv,-pen*ia/(ia+ib));B.p.addScaledVector(nv,pen*ib/(ia+ib));
        const vn=B.v.clone().sub(A.v).dot(nv);if(vn<0){const e=Math.min(A.e,B.e),jj=-(1+e)*vn/(ia+ib);A.v.addScaledVector(nv,-jj*ia);B.v.addScaledVector(nv,jj*ib);
          if(!B.landed&&B.v.y>=0){B.landed=true;SFX.plop();if(B.mass>=1)splash(B);}if(!A.landed&&A.v.y>=0){A.landed=true;SFX.plop();if(A.mass>=1)splash(A);}}}}
  }
  BODIES.forEach(b=>{b.m.position.copy(b.p);const sp=b.w.length();if(sp>0.01){b.m.rotateOnWorldAxis(b.w.clone().normalize(),sp*dt);}const rest=b.v.length()<0.2;b.w.multiplyScalar(rest?0.9:0.995);});}
function enterSelect(){scene=K3.scene;K3.items.clear();BODIES=[];PLAYER.root.rotation.y=0;PLAYER.root.position.set(TUB.x,0,0.16);PLAYER.setPose('idle');PLAYER.setExpr('smile');PLAYER.look=0;
  setCam([0.95,2.05,2.75],[0.95,1.2,0.25],40);
  const tub=basin(TUB.r,TUB.h,'#c3c8cd');tub.position.set(TUB.x,TUB.y,TUB.z);shadowAll(tub);K3.items.add(tub);
  const card=i=>`<div class="card ${i.g==='weird'?'weird':''} ${S.sel.includes(i.k)?'on':''}" data-k="${i.k}"><img src="${THUMB[i.k]}" alt=""><b>${i.n}</b><i>${i.d}</i></div>`;
  $('gridBasic').innerHTML=INGS.filter(i=>i.g==='basic').map(card).join('');
  $('gridWeird').innerHTML=INGS.filter(i=>i.g==='weird').map(card).join('');
  document.querySelectorAll('#ingPanel .card').forEach(c=>c.onclick=()=>toggleIng(c.dataset.k));
  $('selBubble').textContent='오늘은 뭘 넣어볼까?';S.sel.forEach(k=>spawnBody(k,false));refreshBasket();
  frameFn=(dt)=>{placeBubble($('selBubble'),PLAYER,0.38);stepPhysics(dt);};}
function toggleIng(k){const i=S.sel.indexOf(k);
  if(i>=0){S.sel.splice(i,1);removeBody(k);PLAYER.flash('worry',0.6);SFX.click();}
  else{if(S.sel.length>=6){toast('대야가 꽉 찼어요! (최대 6개)');PLAYER.flash('wince',0.8);return;}S.sel.push(k);spawnBody(k,true);
    const [line,ex]=SEL_LINES[k]||[ING[k].n+' 넣고~','smile'];$('selBubble').textContent=(WEIGHT[k]>=5?'으앗, 무거운 게 떨어진다! ':'')+line;PLAYER.flash(ex,1.4);PLAYER.say(1.0);PLAYER.hop();
    PLAYER.setPose(ING[k].g==='weird'?'cheer':'hold');clearTimeout(toggleIng.t);toggleIng.t=setTimeout(()=>PLAYER.setPose('idle'),900);}
  document.querySelectorAll('#ingPanel .card').forEach(c=>c.classList.toggle('on',S.sel.includes(c.dataset.k)));refreshBasket();}
function refreshBasket(){$('bCount').textContent=`대야 ${S.sel.length} / 6`;$('btnToCut').disabled=!S.sel.length;}
$('btnToCut').onclick=()=>{SFX.click();go('cut');};
$('btnCutBack').onclick=()=>{SFX.click();S.cut={};S.pieces=[];go('select');};

/* ---------- 시점 전환 (3인칭 ↔ 1인칭) ---------- */
let CAMTW=null;
const V3=(a)=>new THREE.Vector3(a[0],a[1],a[2]);
function camTween(fp,fl,tp,tl,dur,onDone,onStep){CAMTW={fp:V3(fp),fl:V3(fl),tp:V3(tp),tl:V3(tl),t:0,dur,onDone,onStep};}
function stepCamTween(dt){if(!CAMTW)return;const c=CAMTW;c.t+=dt;const k=Math.min(1,c.t/c.dur),e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
  camera.position.lerpVectors(c.fp,c.tp,e);camera.lookAt(c.fl.clone().lerp(c.tl,e));if(c.onStep)c.onStep(k);
  if(k>=1){CAMTW=null;if(c.onDone)c.onDone();}}
function eyeOf(C){const v=new THREE.Vector3();C.j.head.getWorldPosition(v);v.y+=0.12;v.z+=0.08;return v;}
// 재료 고르기 → 손질: 주인공 눈으로 날아 들어가 대야를 내려다본 뒤 1인칭 도마로
function camEnterToCut(){if(CAMTW)return;$('select').classList.remove('on');$('steps').classList.remove('on');frameFn=(dt)=>stepPhysics(dt);
  PLAYER.setPose('look');PLAYER.setExpr('smile');PLAYER.say(0.8);
  const base=camera.userData.base,eye=eyeOf(PLAYER);
  camTween(base.p,base.l,[eye.x,eye.y,eye.z],[TUB.x,TUB.y,TUB.z],1.35,()=>{
      go('cut');PLAYER.root.visible=true;camera.fov=48;camera.updateProjectionMatrix();
      camTween([0.15,4.6,3.6],[0.3,0.3,-0.2],[0.2,3.7,3.1],[0.3,0,-0.35],0.9);},
    (k)=>{if(k>0.62)PLAYER.root.visible=false;camera.fov=40+8*k;camera.updateProjectionMatrix();});}
// 버무리기 → 보관: 1인칭에서 주인공 눈으로 빠져나와 3인칭으로
function camExitToStore(){if(CAMTW)return;
  (()=>{go('store');$('store').style.opacity=0;PLAYER.root.visible=false;const base=camera.userData.base,eye=eyeOf(PLAYER);
    camera.fov=48;camTween([eye.x,eye.y,eye.z],[0,1.1,0.4],base.p,base.l,1.3,()=>{camera.fov=42;camera.updateProjectionMatrix();$('store').style.transition='opacity .3s';$('store').style.opacity=1;},
      (k)=>{if(k>0.28)PLAYER.root.visible=true;camera.fov=48-6*k;camera.updateProjectionMatrix();});
  })();}

/* ---------- STORE ---------- */
const STORE_X={now:0.0,box:0.7,onggi:1.38},STORE_PX=-0.9;
function enterStore(){scene=K3.scene;K3.items.clear();PLAYER.root.rotation.y=0.35;PLAYER.root.position.set(STORE_PX,0,0.05);PLAYER.setPose('hold');PLAYER.setExpr('smile');
  setCam([0.35,1.85,2.55],[0.35,1.08,0.4],42);K3.decor.forEach(o=>o.visible=false);
  // basin of finished kimchi in her hands
  const hb=new THREE.Group();const b=basin(0.2,0.11,'#c5cacf');hb.add(b);const sc=MIX.sauce||hex('#e9edb8');const f=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.13,0.07,8),mat(sc));f.position.y=0.07;hb.add(f);
  hb.position.set(STORE_PX+0.12,1.12,0.37);hb.userData.held=true;K3.items.add(hb);
  STORES.forEach(s=>{const m=storeModel(s.k);m.scale.setScalar(0.24);m.position.set(STORE_X[s.k],0.93,0.62);m.userData.store=s.k;shadowAll(m);
    m.userData.glow=[];m.traverse(o=>{if(o.isMesh&&!o.userData.isGlow){const gm=new THREE.Mesh(o.geometry,new THREE.MeshBasicMaterial({color:0xffd84d,side:THREE.BackSide,transparent:true,opacity:0.5,depthWrite:false}));gm.userData.isGlow=true;gm.scale.setScalar(1.12);o.add(gm);m.userData.glow.push(gm);}});
    K3.items.add(m);});
  $('storeLbls').innerHTML=STORES.map(s=>`<div class="lbl" id="slbl_${s.k}">${s.n} · ${s.d}</div>`).join('');
  $('btnToEval').disabled=!S.store;$('storeBubble').textContent='어디에 담을까?';
  handlers={down:storePick,move:()=>{const h=storeHit();STORE_HOVER=h;canvas.style.cursor=h?'pointer':'default';}};
  frameFn=(dt)=>{placeBubble($('storeBubble'),PLAYER,0.38,'R');const tt=performance.now()/1000;K3.items.children.forEach(o=>{if(o.userData.store){const on=o.userData.store===S.store,hov=STORE_HOVER===o;
      o.userData.glow.forEach(gm=>{gm.material.color.set(on?0xff8a3d:0xffd84d);gm.material.opacity=on?0.75+0.2*Math.sin(tt*6):hov?0.65:0.35+0.15*Math.sin(tt*2.5);gm.scale.setScalar(on?1.18:hov?1.15:1.11);});const ty=0.93+(on?Math.abs(Math.sin(performance.now()/250))*0.05:0);o.position.y+=(ty-o.position.y)*Math.min(1,dt*10);
      const el=$('slbl_'+o.userData.store);const p=toScreen(o.position.clone().add(new THREE.Vector3(0,0.34,0)));el.style.left=p.x+'px';el.style.top=p.y+'px';el.classList.toggle('on',on);}});};}
let STORE_HOVER=null;
function storeHit(){let best=null;K3.items.children.forEach(o=>{if(!o.userData.store)return;const h=ray.intersectObject(o,true).filter(x=>!x.object.userData.isGlow);if(h.length&&(!best||h[0].distance<best.d))best={o,d:h[0].distance};});return best&&best.o;}
function storePick(){const o=storeHit();if(!o)return;S.store=o.userData.store;SFX.boing();$('btnToEval').disabled=false;
  const L={now:['못 참겠어, 바로 먹을래!','laugh'],box:['김치통에 넣어서 익혀야지~','smile'],onggi:['항아리에 푹 묵혀 보자!','laugh']}[S.store];
  $('storeBubble').textContent=L[0];PLAYER.flash(L[1],1.4);PLAYER.say(1);PLAYER.look=0.25+(STORE_X[S.store]-STORE_X.now)*0.2;}
$('btnToEval').onclick=()=>{SFX.click();PLAYER.look=0;go('eval');};

/* ---------- EVAL ---------- */
function ctx(){return {sel:S.sel,cut:S.cut,season:S.season,store:S.store,stat:stats(true)};}
const ADJ={salty:['짭짤한','소금 폭탄'],spicy:['매콤한','불타는'],sweet:['달달한','설탕 듬뿍'],umami:['감칠맛 나는','감칠맛 폭발'],cool:['시원한','얼음장 같은'],weird:['수상한','정체불명']};
function genName(c){const st=STORE[c.store].pre;
  const cnt={};Object.entries(c.cut).forEach(([k,m])=>{cnt[m]=(cnt[m]||0)+(k==='cabbage'?1.5:1);});
  let type=Object.entries(cnt).filter(e=>e[0]!=='whole').sort((a,b)=>b[1]-a[1])[0];type=type?KIMCHI_TYPE[type[0]]:'통김치';
  if(sp(c,'gochu')===0&&Object.values(c.season).some(v=>v))type='백'+type;
  const order=['weird','salty','spicy','sweet','umami','cool'];let best=null,bv=0;order.forEach(k=>{if(c.stat[k]>bv+0.01){bv=c.stat[k];best=k;}});
  const adj=best&&bv>=3?ADJ[best][bv>=7?1:0]:'';
  const weird=c.sel.find(k=>ING[k].g==='weird');const main=weird||c.sel.filter(k=>k!=='cabbage')[0]||'';
  return [st,adj,(main?ING[main].n+' ':'')+type].filter(Boolean).join(' ');}
/* ---------- 할머니 채점표 (100점 → 엄지 1~5개) ----------
  간 25 · 맛 균형 25 · 재료 조화 20 · 손질 15 · 양념 완성도 15
  엉뚱한 재료·양념 하나당 -12 감점
  엄지: 85점↑ 5개, 70↑ 4개, 55↑ 3개, 35↑ 2개, 그 아래 1개 */
const CUT_FIT={cabbage:{pogi:1,mak:1,kkak:.5,chae:.5},radish:{kkak:1,chae:1,mak:1,pogi:.5},mustard:{mak:1,chae:1},leek:{mak:1,chae:1},chive:{mak:1,chae:1},water:{mak:1,chae:1},
  onion:{chae:1,mak:1,kkak:.5},pear:{chae:1,kkak:1,mak:.5},cucumber:{mak:1,kkak:1,chae:1,pogi:.5},oyster:{whole:1,mak:.5}};
const band=(v,full,half,low)=>v>=full[0]&&v<=full[1]?1:(v>=half[0]&&v<=half[1]?.6:(v>=low[0]&&v<=low[1]?.2:0));
function scoreKimchi(c){const st=c.stat,sv=k=>sp(c,k),spoons=Object.values(c.season).reduce((x,y)=>x+y,0);
  const basics=c.sel.filter(k=>ING[k].g==='basic'),weirdI=c.sel.filter(k=>ING[k].g==='weird').length,weirdS=SEAS.filter(s=>s.weird&&sv(s.k)>0).length;
  const P=[];
  // 1) 간 25: 짠맛 2~4 딱 좋음
  P.push(['간',Math.round(25*band(st.salty,[2,4],[1,5],[0.5,6.5])),25,st.salty<1?'싱거워요':st.salty>5?'너무 짜요':st.salty<2||st.salty>4?'간이 조금 아쉬워요':'간이 딱 좋아요']);
  // 2) 맛 균형 25: 매운맛 2~5(10) + 감칠맛(10) + 단맛 과하지 않게(5)
  const spicy=10*band(st.spicy,[2,5],[1,6.5],[0.5,8]),umami=st.umami>=2.5?10:st.umami>=1.5?6:st.umami>=0.5?3:0,sweet=st.sweet<=3?5:st.sweet<=5?2:0;
  P.push(['맛 균형',Math.round(spicy+umami+sweet),25,umami<6?'감칠맛이 부족해요':spicy<10?'매운맛이 어긋나요':sweet<5?'너무 달아요':'맛이 잘 어우러져요']);
  // 3) 재료 조화 20: 배추·무 바탕(8) + 기본 재료 3가지↑(6) + 향채(6), 엉뚱한 재료 하나당 -8, 엉뚱한 양념 하나당 -6
  let ing=(c.sel.some(k=>k==='cabbage'||k==='radish')?8:0)+(basics.length>=3?6:basics.length===2?3:0)+(c.sel.some(k=>['leek','chive','mustard','water'].includes(k))?6:0)-8*weirdI-6*weirdS;
  P.push(['재료 조화',Math.max(0,ing),20,weirdI+weirdS?'엉뚱한 재료가 들어갔어요':ing>=20?'재료 구성이 좋아요':'재료가 조금 단출해요']);
  // 4) 손질 15: 재료마다 어울리는 썰기인지
  const fits=c.sel.map(k=>{const m=c.cut[k];if(ING[k].g==='weird')return .5;return (CUT_FIT[k]||{})[m]||0;});
  const cut=fits.length?15*fits.reduce((x,y)=>x+y,0)/fits.length:0;
  P.push(['손질',Math.round(cut),15,cut>=13?'손질이 깔끔해요':'재료와 안 맞는 썰기가 있어요']);
  // 5) 양념 완성도 15: 마늘(5) + 젓갈(5) + 생강·찹쌀풀(3) + 양념 양 적당 4~14숟갈(2)
  const sea=(sv('garlic')>=1?5:0)+(sv('shrimp')+sv('fishsauce')>=1?5:0)+(sv('ginger')+sv('rice')>=1?3:0)+(spoons>=4&&spoons<=14?2:0);
  P.push(['양념',sea,15,sea>=13?'양념이 알차요':sv('garlic')<1?'마늘이 빠졌어요':sv('shrimp')+sv('fishsauce')<1?'젓갈이 빠졌어요':'양념이 조금 아쉬워요']);
  // 6) 엉뚱함 감점: 엉뚱한 재료·양념 하나당 -12 (할머니 기준에서 김치가 아님)
  const pen=12*(weirdI+weirdS);if(pen)P.push(['엉뚱함 −'+pen,-pen,0,`엉뚱한 재료·양념 ${weirdI+weirdS}개`]);
  const total=Math.max(0,P.reduce((x,p)=>x+p[1],0));const thumbs=total>=85?5:total>=70?4:total>=55?3:total>=35?2:1;
  return {total,thumbs,parts:P};}
let EV=null,EVINFO=null;
function platePhoto(){try{const pc=new THREE.PerspectiveCamera(30,4/3,0.05,20);const pg=MK.plateGrp.position;pc.position.set(pg.x+0.03,pg.y+0.95,pg.z+0.8);pc.lookAt(pg.x,pg.y,pg.z);
  const vis=GRANDMA.root.visible;GRANDMA.root.visible=false;MK.scene.updateMatrixWorld(true);
  R.setViewport(0,0,1280,720);R.setSize(640,480,false);R.render(MK.scene,pc);const url=R.domElement.toDataURL('image/jpeg',0.82);
  R.setSize(1280,720,false);GRANDMA.root.visible=vis;return url;}catch(e){console.warn(e);return S.photo;}}
function enterEval(){
  scene=MK.scene;setCam([0.15,1.5,2.75],[0.15,1.12,0],40);
  // the kimchi she made, on grandma's plate
  MK.plateGrp.clear();(S.plate||[]).forEach((m,i)=>{const p=m.position;const n=m.clone();n.position.set(p.x*0.17,0.02+Math.max(0,p.y-0.2)*0.15+(i%5)*0.012,p.z*0.17);n.scale.setScalar(m.scale.x*0.2);MK.plateGrp.add(n);});
  shadowAll(MK.plateGrp);S.photo=platePhoto();
  // player in the video call
  setInset('p',24,512,196,188);PLAYER.root.rotation.y=0;PLAYER.setPose('phone');PLAYER.setExpr('worry');
  GRANDMA.setPose('look');GRANDMA.setExpr('smile');GRANDMA.look=0;
  const c=ctx();const recipe=RECIPES.find(r=>{try{return r.test(c);}catch(e){return false;}});
  const name=recipe?recipe.n:genName(c);const isNew=recipe&&!DEX.found[recipe.k];
  if(recipe)DEX.found[recipe.k]={photo:S.photo,at:Date.now()};
  const SC=scoreKimchi(c),th=SC.thumbs;
  DEX.recent.unshift({n:name,photo:S.photo,score:SC.total});DEX.recent=DEX.recent.slice(0,8);saveDex();

  const lines=composeReactions(c,recipe);
  lines.push(CLOSERS[Math.floor(Math.random()*CLOSERS.length)]);
  // reaction choice
  let rPose='thumbs',rExpr='laugh';
  if(c.stat.salty>=5){rPose='fan';rExpr='wince';}else if(c.stat.spicy>=6){rPose='fan';rExpr='spicy';}else if(c.stat.weird>=3){rPose='shock';rExpr='surprise';}else if(th<=2){rPose='think';rExpr='worry';}else if(th===3){rPose='thumbs';rExpr='smile';}
  $('gBubble').innerHTML='<b class="jua" style="color:#3f6b4a">할머니</b><div class="line show">어디 보자~ 우리 강아지가 뭘 만들었나~</div>';
  $('resCard').classList.remove('show');$('evalBtns').classList.remove('show');
  $('resName').textContent=name;$('resNew').innerHTML=isNew?'<span class="new">✨ 새로운 김치 발견!</span>':recipe?'<span class="new" style="background:#e7dccd;color:#7a5a3a">도감에 있는 김치</span>':'';
  $('resThumbs').innerHTML=[1,2,3,4,5].map(i=>`<span class="${i<=th?'':'off'}">👍</span>`).join('');
  $('resTotal').innerHTML=`${SC.total}<small>점</small>`;
  $('resBars').innerHTML=STATS.map(([k,n,col])=>`<div class="bar"><label>${n}</label><div class="t"><div data-w="${Math.min(100,c.stat[k]/10*100)}" style="background:${col}"></div></div><span class="v">${Math.round(c.stat[k]*10)/10}</span></div>`).join('');
  const main=SC.parts.filter(p=>p[2]>0),bad=SC.parts.filter(p=>p[2]===0||p[1]<p[2]*0.8);
  $('resScore').innerHTML=main.map(([n,p,m])=>`<div class="row"><span>${n}</span><div class="t"><div style="width:${Math.round(p/m*100)}%"></div></div><b>${p}/${m}</b></div>`).join('');
  const w=$('resWarn');w.className='rc '+(bad.length?'warn':'ok');
  w.innerHTML=bad.length?'<h4>⚠ 감점 사유</h4><ul>'+bad.map(([n,p,m,why])=>`<li><b>${m===0?n:n+' −'+(m-p)}</b> · ${why}</li>`).join('')+'</ul>':'<h4>✓ 감점 없이 깔끔해요</h4>';
  const spoons=Object.values(c.season).reduce((a,b)=>a+b,0);
  $('resDetail').innerHTML=c.sel.map(k=>`<span>${ING[k].n}</span>`).join('')+(spoons?`<span>양념 ${spoons}숟갈</span>`:'')+`<span>${STORE[c.store].n}</span>`;
  GRANDMA.say(1.6);
  EV={t:0,steps:[
    [1.8,()=>{GRANDMA.setPose('taste');GRANDMA.setExpr('yum');PLAYER.flash('worry',2);}],
    [3.4,()=>{GRANDMA.setPose(rPose);GRANDMA.setExpr(rExpr);if(rPose==='shock')setTimeout(()=>{GRANDMA.setExpr('laugh');GRANDMA.setPose('cheer');},1400);
      PLAYER.setExpr(th>=4?'laugh':th<=2?'surprise':'smile');PLAYER.setPose(th>=4?'cheer':th<=2?'shock':'phone');if(isNew)SFX.ding();}],
    ...lines.map((l,i)=>[3.6+i*1.5,()=>{const d=document.createElement('div');d.className='line';d.textContent=l;$('gBubble').appendChild(d);requestAnimationFrame(()=>d.classList.add('show'));GRANDMA.say(1.3);SFX.click();}]),
    [3.8+lines.length*1.5,()=>{$('resCard').classList.add('show');setTimeout(()=>document.querySelectorAll('#resBars .t div').forEach(d=>d.style.width=d.dataset.w+'%'),300);$('evalBtns').classList.add('show');if(rPose!=='shock'&&rPose!=='fan')GRANDMA.setPose(th>=3?'thumbs':'idle');else GRANDMA.setPose('idle');}],
  ]};
  frameFn=(dt)=>{EV.t+=dt;while(EV.steps.length&&EV.t>=EV.steps[0][0])EV.steps.shift()[1]();};}
$('btnAgain').onclick=()=>{SFX.click();resetRound();GRANDMA.setPose('idle');go('select');};

/* ---------- DEX ---------- */
function openDex(){const f=Object.keys(DEX.found).length;$('dexCnt').textContent=`숨은 김치 ${f} / ${RECIPES.length} 발견`;
  $('dexGrid').innerHTML=RECIPES.map(r=>{const d=DEX.found[r.k];return d?`<div class="dcard"><img src="${d.photo||''}"><b>${r.n}</b><span class="taste">${r.taste||''}</span></div>`:`<div class="dcard lock"><div class="q">?</div><b>???</b><span>힌트: ${r.hint}</span></div>`;}).join('');
  $('dexRecent').innerHTML=DEX.recent.length?DEX.recent.map(r=>`<div class="dcard"><img src="${r.photo||''}"><b style="font-size:15px">${r.n}</b></div>`).join(''):'<span class="hint">아직 만든 김치가 없어요</span>';
  $('dex').classList.add('on');}
$('btnDexFloat').onclick=()=>{SFX.click();openDex();};
$('btnHome').onclick=()=>{SFX.click();resetRound();go('title');};
$('btnDexClose').onclick=()=>{SFX.click();$('dex').classList.remove('on');};
$('btnStart').onclick=()=>{SFX.click();resetRound();go('intro');};

/* ---------- LOOP ---------- */
let last=performance.now(),INSET_TICK=0;
function loop(now){const dt=Math.min(0.05,(now-last)/1000);last=now;
  PLAYER.update(dt);GRANDMA.update(dt);
  if(frameFn)frameFn(dt);
  stepCamTween(dt);
  if(scene){R.setViewport(0,0,1280,720);R.render(scene,camera);}
  if(INSET){const {which,x,y,w,h}=INSET;const sc=which==='g'?MK.scene:K3.scene;const cam=which==='g'?camG:camP;
    if(which==='g'){const hp=new THREE.Vector3();GRANDMA.j.head.getWorldPosition(hp);cam.position.set(hp.x+0.12,hp.y+0.02,hp.z+1.05);cam.lookAt(hp.x,hp.y-0.05,hp.z);}
    else{const hp=new THREE.Vector3();PLAYER.j.head.getWorldPosition(hp);cam.position.set(hp.x-0.1,hp.y+0.02,hp.z+1.05);cam.lookAt(hp.x,hp.y-0.05,hp.z);}
    cam.aspect=w/h;cam.updateProjectionMatrix();
    // hide the eval plate camera conflict: plate stays, fine
    R.shadowMap.autoUpdate=(INSET_TICK++%15===0);R.setScissorTest(true);R.setViewport(x,720-y-h,w,h);R.setScissor(x,720-y-h,w,h);R.render(sc,cam);R.setScissorTest(false);R.shadowMap.autoUpdate=true;R.setViewport(0,0,1280,720);}
  requestAnimationFrame(loop);}
window.addEventListener('load',()=>{loadAssets().then(info=>{console.log('assets:',info);ASSET_INFO=info;}).catch(e=>console.warn(e)).finally(()=>{
  try{makeThumbs();K3=buildK3();MK=buildMarket();}catch(e){console.error(e);}
  $('loading').style.display='none';go('title');requestAnimationFrame(loop);});});
let ASSET_INFO='';
window.__K={get ASSET_INFO(){return ASSET_INFO;},MODELS,get BODIES(){return BODIES;},scr:(k)=>{const g=SEASON.items.find(x=>x.userData.s.k===k);return toScreen(g.position.clone().add(new THREE.Vector3(0,0.3,0)));},sscr:(k)=>{const o=K3.items.children.find(x=>x.userData.store===k);return toScreen(o.position.clone().add(new THREE.Vector3(0,0.12,0)));},S,go,ING,toggleIng,pickMethod,CUT,SEASON,MIX,PLAYER,GRANDMA,get EV(){return EV;}};
