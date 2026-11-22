
/* =========================================================
   STATE
   ========================================================= */
const S={sel:[],cut:{},pieces:[],season:{},store:null,photo:null,plate:null};
function stats(withSeason){const t=Object.fromEntries(STATS.map(s=>[s[0],0]));
  S.sel.forEach(k=>{for(const[a,v]of Object.entries(ING[k].st))t[a]+=v;});
  if(withSeason)for(const[k,n]of Object.entries(S.season))for(const[a,v]of Object.entries(SEA[k].st))t[a]+=v*n;
  return t;}
function resetRound(){S.sel=[];S.cut={};S.pieces=[];S.season={};S.store=null;S.photo=null;S.plate=null;}
function dexOpen(){const d=document.getElementById('dex');return d&&d.classList.contains('on');}
let DEX={found:{},recent:[],custom:[]};
try{const d=JSON.parse(localStorage.getItem('kimchi-dex-v1')||'null');if(d&&d.found)DEX=d;}catch(e){}
DEX.custom=DEX.custom||[];DEX.recent=DEX.recent||[];
function saveDex(){try{localStorage.setItem('kimchi-dex-v1',JSON.stringify(DEX));}catch(e){}}

/* =========================================================
   UTIL / AUDIO
   ========================================================= */
const $=id=>document.getElementById(id);
function fit(){const s=Math.min(innerWidth/1280,innerHeight/720)*0.98;$('stage').style.transform=`scale(${s})`;}
addEventListener('resize',fit);fit();
let AC=null;function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC;}
addEventListener('pointerdown',ac);
function noise(dur,freq,q,vol){const a=ac();if(!a)return;const b=a.createBuffer(1,a.sampleRate*dur,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q;const g=a.createGain();g.gain.value=vol;s.connect(f).connect(g).connect(a.destination);s.start();}
function tone(f0,f1,dur,vol,type){const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f0,a.currentTime);o.frequency.exponentialRampToValueAtTime(f1,a.currentTime+dur);g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+dur);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+dur);}
function squelch(t0,dur,f,vol){const a=ac();if(!a)return;const st=a.currentTime+(t0||0);const n=Math.floor(a.sampleRate*dur),buf=a.createBuffer(1,n,a.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<n;i++){const x=i/n;d[i]=(Math.random()*2-1)*Math.pow(Math.sin(Math.PI*x),1.5);}
  const s=a.createBufferSource();s.buffer=buf;const bp=a.createBiquadFilter();bp.type='bandpass';bp.Q.value=3.5;
  bp.frequency.setValueAtTime(f*0.6,st);bp.frequency.exponentialRampToValueAtTime(f*1.8,st+dur*0.45);bp.frequency.exponentialRampToValueAtTime(f*0.7,st+dur);
  const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1100;const g=a.createGain();g.gain.value=vol;
  s.connect(bp).connect(lp).connect(g).connect(a.destination);s.start(st);
  const o=a.createOscillator(),og=a.createGain();o.type='sine';o.frequency.setValueAtTime(f*0.9,st+dur*0.2);o.frequency.exponentialRampToValueAtTime(f*2.2,st+dur*0.55);
  og.gain.setValueAtTime(0.0001,st);og.gain.exponentialRampToValueAtTime(vol*0.35,st+dur*0.3);og.gain.exponentialRampToValueAtTime(0.0001,st+dur*0.6);o.connect(og).connect(a.destination);o.start(st);o.stop(st+dur);}
function pinkBurst(a,t,dur,ftype,f0,f1,q,vol,attack){const n=Math.floor(a.sampleRate*dur),buf=a.createBuffer(1,n,a.sampleRate),d=buf.getChannelData(0);let b0=0,b1=0,b2=0;
  for(let i=0;i<n;i++){const w=Math.random()*2-1;b0=0.997*b0+w*0.029591;b1=0.985*b1+w*0.032534;b2=0.95*b2+w*0.048056;d[i]=(b0+b1+b2+w*0.05)*2;}
  const s=a.createBufferSource();s.buffer=buf;const f=a.createBiquadFilter();f.type=ftype;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);
  const g=a.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+dur*attack);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(f).connect(g).connect(a.destination);s.start(t);s.stop(t+dur);}
const SFX={chop(){noise(0.09,2400,1.2,0.9);tone(180,60,0.12,0.5);},plop(){tone(700,180,0.15,0.35);},squish(){noise(0.12,700,0.8,0.25);},ding(){tone(880,880,0.25,0.25,'triangle');setTimeout(()=>tone(1320,1320,0.35,0.2,'triangle'),120);},click(){tone(520,400,0.06,0.15,'triangle');},stir(total){const a=ac();if(!a)return;const m=3.5,T=total||2.4,t0=a.currentTime;for(let t=0;t<T;t+=0.3){pinkBurst(a,t0+t,0.6,'bandpass',220*m,480*m,1.5,1.6,0.5);pinkBurst(a,t0+t+0.15,0.3,'lowpass',900*m,300*m,2,0.4,0.3);}},boing(){tone(300,700,0.18,0.25,'triangle');}};
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1600);}
const hex=c=>new THREE.Color(c);
const rnd=(a,b)=>a+Math.random()*(b-a);

/* =========================================================
   THREE SETUP
   ========================================================= */
const canvas=$('gl');
const R=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
R.setPixelRatio(Math.min(devicePixelRatio||1,1.5));R.setSize(1280,720,false);
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const camera=new THREE.PerspectiveCamera(48,1280/720,0.1,100);
let scene=null, frameFn=null, INSET=null;
function mat(c,o){return new THREE.MeshPhongMaterial(Object.assign({color:c,flatShading:true,shininess:6,specular:0x111111},o||{}));}
function lights(sc,opt){opt=opt||{};sc.add(new THREE.HemisphereLight(0xfff3e2,0x6a4a30,opt.hemi||0.5));
  const d=new THREE.DirectionalLight(0xfff0dc,opt.sun||0.62);d.position.set(opt.sx||2.5,opt.sy||6,opt.sz||4.5);
  if(opt.shadow){d.castShadow=true;d.shadow.mapSize.set(2048,2048);const c=d.shadow.camera;c.left=-5;c.right=5;c.top=5;c.bottom=-5;c.near=0.5;c.far=20;d.shadow.bias=-0.0008;d.shadow.radius=3;}
  sc.add(d);const d2=new THREE.DirectionalLight(0xffd8b0,0.2);d2.position.set(-4,3,-2);sc.add(d2);}
function shadowAll(o,cast,recv){o.traverse(m=>{if(m.isMesh){if(cast!==false)m.castShadow=true;if(recv!==false)m.receiveShadow=true;}});return o;}
function box(w,h,d,c,o){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof c==='string'?mat(c,o):c);}
function cyl(rt,rb,h,seg,c,o){return new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||8),typeof c==='string'?mat(c,o):c);}

/* ---------- canvas textures (floral fabrics like the model sheets) ---------- */
function fabric(bg,cols,opt){opt=opt||{};const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,256,256);
  if(opt.noise){for(let i=0;i<1600;i++){g.fillStyle=opt.noise[i%opt.noise.length];g.fillRect(Math.random()*256|0,Math.random()*256|0,6,6);}}
  if(opt.blobs){for(let i=0;i<70;i++){g.fillStyle=opt.blobs[i%opt.blobs.length];g.beginPath();g.ellipse(Math.random()*256,Math.random()*256,rnd(8,22),rnd(5,14),Math.random()*3,0,7);g.fill();}}
  const n=opt.n||46,sz=opt.size||9;
  for(let i=0;i<n;i++){const x=Math.random()*256,y=Math.random()*256,r=sz*rnd(0.7,1.2),col=cols[i%cols.length];g.fillStyle=col;
    for(let p=0;p<5;p++){const a=p/5*Math.PI*2;g.beginPath();g.arc(x+Math.cos(a)*r*0.6,y+Math.sin(a)*r*0.6,r*0.5,0,7);g.fill();}
    g.fillStyle=opt.center||'#fff3c4';g.beginPath();g.arc(x,y,r*0.28,0,7);g.fill();}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(opt.rx||2,opt.ry||2);return t;}
const TEX={
  apron:fabric('#c9342b',['#3f6fc0','#5b8fd8','#f2c440','#2f5fb0','#e9e2d6'],{n:60,size:9,center:'#fff3c4',rx:2,ry:2}),
  pSleeve:fabric('#6d7a68',['#b58c92','#c9b7b2','#8c9a86'],{blobs:['#5f6e5b','#8a9884','#a07a80','#7d8b78'],n:24,size:7,center:'#d8c8c4',rx:2,ry:2}),
  gSleeve:fabric('#1d5a45',['#b8432f','#d0603a','#a8382a'],{n:70,size:6,center:'#e7b45a',rx:2,ry:2}),
  vest:fabric('#3d3d40',['#3d3d40'],{noise:['#34343a','#47474b','#3a3a3f','#505055'],n:0,rx:2,ry:2}),
};
function tileTex(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');const cols=['#d7e6ef','#eef4f7','#b9d2e2','#eef4f7'];for(let y=0;y<4;y++)for(let x=0;x<4;x++){g.fillStyle=cols[(x+y*3)%4];g.fillRect(x*64,y*64,64,64);if((x+y)%3===0){g.strokeStyle='#6f97b8';g.lineWidth=3;g.beginPath();g.arc(x*64+32,y*64+32,15,0,7);g.stroke();g.beginPath();g.arc(x*64+32,y*64+32,6,0,7);g.stroke();}}g.strokeStyle='#ffffff';g.lineWidth=4;for(let i=0;i<=4;i++){g.beginPath();g.moveTo(i*64,0);g.lineTo(i*64,256);g.stroke();g.beginPath();g.moveTo(0,i*64);g.lineTo(256,i*64);g.stroke();}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
const TILE=tileTex();
function woodTex(base,line){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,128,128);g.strokeStyle=line;g.lineWidth=2;for(let i=0;i<8;i++){g.beginPath();g.moveTo(0,i*16+8);for(let x=0;x<=128;x+=16)g.lineTo(x,i*16+8+Math.sin(x*0.08+i)*2);g.stroke();}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
const WOOD=woodTex('#a8774b','#93653d');

/* ---------- faces (painted onto the low-poly head, like the sheets) ---------- */
const FACECACHE={};
function faceTex(kind,expr){const key=kind+expr;if(FACECACHE[key])return FACECACHE[key];
  const P=kind==='player';const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d');
  g.fillStyle=P?'#efc7a4':'#e7bc95';g.fillRect(0,0,1024,512);
  // subtle low-poly shading bands
  const cx=256,ey=232,dx=P?44:42,my=304;g.save();g.translate(cx,268);g.scale(1.25,1.25);g.translate(-cx,-268);
  const line=(pts,w,col)=>{g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))g.lineTo(p[0],p[1]);g.stroke();};
  // blush
  const blushA=expr==='spicy'?0.75:expr==='wince'?0.5:0.28;g.fillStyle=`rgba(232,110,95,${blushA})`;[-1,1].forEach(s=>{g.beginPath();g.ellipse(cx+s*54,272,expr==='spicy'?24:17,10,0,0,7);g.fill();});
  // grandma wrinkles
  if(!P){g.strokeStyle='rgba(120,70,45,0.45)';g.lineWidth=2.5;[[180],[192]].forEach(([y])=>{g.beginPath();g.moveTo(cx-34,y);g.quadraticCurveTo(cx,y-5,cx+34,y);g.stroke();});
    [-1,1].forEach(s=>{g.beginPath();g.moveTo(cx+s*20,266);g.quadraticCurveTo(cx+s*36,288,cx+s*30,306);g.stroke();line([[cx+s*(dx+14),ey-4],[cx+s*(dx+22),ey-8]],2,'rgba(120,70,45,0.45)');line([[cx+s*(dx+14),ey+4],[cx+s*(dx+22),ey+8]],2,'rgba(120,70,45,0.45)');g.beginPath();g.arc(cx+s*dx,ey+12,9,0.15*Math.PI,0.85*Math.PI);g.stroke();});}
  // nose
  g.fillStyle=P?'rgba(190,120,90,0.45)':'rgba(170,100,70,0.5)';g.beginPath();g.moveTo(cx,246);g.lineTo(cx-7,270);g.lineTo(cx+7,270);g.closePath();g.fill();
  // brows
  const bc=P?'#3a2620':'#8d8a86',by=ey-(expr==='surprise'?32:24);
  [-1,1].forEach(s=>{if(expr==='wince'||expr==='spicy')line([[cx+s*(dx+14),by-4],[cx+s*(dx-12),by+5]],5,bc);else line([[cx+s*(dx+14),by+3],[cx+s*dx,by-3],[cx+s*(dx-13),by+1]],5,bc);});
  // eyes
  const closedHappy=expr==='laugh'||expr==='yum';
  [-1,1].forEach(s=>{const x=cx+s*dx;
    if(closedHappy){g.strokeStyle='#2a1a14';g.lineWidth=5;g.beginPath();g.arc(x,ey+5,10,1.15*Math.PI,1.85*Math.PI);g.stroke();}
    else if(expr==='wince'||expr==='spicy'){line([[x-s*-10,ey-7],[x+s*-1*-0,ey],[x-s*-10,ey+7]].map((p,i)=>[x+(i===1?(s>0?-8:8):(s>0?8:-8)),p[1]]),5,'#2a1a14');}
    else{const big=expr==='surprise'?1.35:1;g.fillStyle='#fffaf4';g.beginPath();g.ellipse(x,ey,13*big,10*big,0,0,7);g.fill();g.fillStyle=P?'#2a1a14':'#4a3020';g.beginPath();g.ellipse(x,ey+1,8.5*big,9*big,0,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x+3,ey-3,2.8,0,7);g.fill();
      g.strokeStyle='#2a1a14';g.lineWidth=3.5;g.beginPath();g.ellipse(x,ey,13*big,10*big,0,1.05*Math.PI,1.95*Math.PI);g.stroke();}});
  // mouth
  const lip=P?'#b24a40':'#9a4a3a',dark='#5e1f1c';
  if(expr==='smile'){g.strokeStyle=lip;g.lineWidth=5;g.lineCap='round';g.beginPath();g.arc(cx,my-14,18,0.22*Math.PI,0.78*Math.PI);g.stroke();}
  else if(expr==='talk'){g.fillStyle=dark;g.beginPath();g.ellipse(cx,my,13,8,0,0,7);g.fill();g.fillStyle='#e07a7a';g.beginPath();g.ellipse(cx,my+4,7,3,0,0,7);g.fill();}
  else if(expr==='laugh'){g.fillStyle=dark;g.beginPath();g.moveTo(cx-21,my-6);g.quadraticCurveTo(cx,my+30,cx+21,my-6);g.closePath();g.fill();g.fillStyle='#fff';g.fillRect(cx-15,my-6,30,5);g.fillStyle='#e07a7a';g.beginPath();g.ellipse(cx,my+9,9,4,0,0,7);g.fill();}
  else if(expr==='surprise'){g.fillStyle=dark;g.beginPath();g.ellipse(cx,my+2,8,12,0,0,7);g.fill();}
  else if(expr==='wince'){line([[cx-18,my],[cx-9,my-5],[cx,my],[cx+9,my-5],[cx+18,my]],4,lip);}
  else if(expr==='yum'){g.strokeStyle=lip;g.lineWidth=5;g.beginPath();g.arc(cx,my-12,15,0.2*Math.PI,0.8*Math.PI);g.stroke();g.fillStyle='#e07a7a';g.beginPath();g.ellipse(cx+8,my+5,6,5,0,0,7);g.fill();}
  else if(expr==='spicy'){g.fillStyle=dark;g.beginPath();g.ellipse(cx,my+2,16,11,0,0,7);g.fill();g.fillStyle='#e85a5a';g.beginPath();g.ellipse(cx,my+9,10,6,0,0,7);g.fill();g.fillStyle='rgba(120,180,255,.85)';g.beginPath();g.ellipse(cx+70,ey-30,6,10,0,0,7);g.fill();}
  else if(expr==='worry'){g.strokeStyle=lip;g.lineWidth=5;g.beginPath();g.arc(cx,my+14,16,1.25*Math.PI,1.75*Math.PI);g.stroke();}
  g.restore();const t=new THREE.CanvasTexture(c);t.anisotropy=4;FACECACHE[key]=t;return t;}

/* =========================================================
   CHARACTERS  (built from the modeling sheets: 플레이어 / 할머니)
   ========================================================= */
const POSES={
  idle:{shX:[0,0],out:[0.13,0.13],el:[-0.18,-0.18],tx:0,hx:0},
  wave:{shX:[0,-0.2],out:[0.13,2.6],el:[-0.18,-0.4],tx:0,hx:0,anim:'wave'},
  hold:{shX:[-0.95,-0.95],out:[0.18,0.18],el:[-0.85,-0.85],tx:0.04,hx:0.2},
  cheer:{shX:[0,0],out:[2.5,2.5],el:[-0.35,-0.35],tx:-0.05,hx:-0.1,anim:'cheer'},
  thumbs:{shX:[0,-1.25],out:[0.13,0.3],el:[-0.18,-1.05],tx:0,hx:0,thumb:true},
  taste:{shX:[0,-1.35],out:[0.13,0.42],el:[-0.18,-2.15],tx:0,hx:0.05,anim:'chew'},
  shock:{shX:[-1.1,-1.1],out:[0.55,0.55],el:[-1.9,-1.9],tx:-0.1,hx:-0.08},
  fan:{shX:[0,-1.15],out:[0.13,0.65],el:[-0.18,-1.75],tx:0,hx:-0.05,anim:'fan'},
  look:{shX:[-0.35,-0.35],out:[0.2,0.2],el:[-0.6,-0.6],tx:0.12,hx:0.45},
  think:{shX:[-0.5,-1.0],out:[0.2,0.3],el:[-1.3,-2.0],tx:0,hx:-0.05,hy:0.2},
  phone:{shX:[0,-1.0],out:[0.13,0.25],el:[-0.18,-1.7],tx:0,hx:0},
};
function makeChar(kind){
  const P=kind==='player';const C={kind,root:new THREE.Group(),j:{},cur:null,pose:'idle',baseExpr:'smile',tmpExpr:null,tmpT:0,talkT:0,hopT:0,t:0,look:0};
  const root=C.root;const skinC=P?'#efc7a4':'#e7bc95';
  const pantsC=P?'#3a2622':'#18181a', legR=P?0.058:0.088, legTop=P?0.84:0.72, legX=P?0.078:0.095;
  for(const s of[-1,1]){const leg=cyl(legR*0.9,legR*(P?0.95:1.05),legTop-0.07,7,pantsC);leg.position.set(s*legX,(legTop+0.07)/2,0);root.add(leg);
    const shoe=box(P?0.09:0.11,0.065,P?0.2:0.22,P?'#2b201c':'#5a4a3e');shoe.position.set(s*legX,0.033,0.03);root.add(shoe);
    const sock=cyl(legR*0.85,legR*0.85,0.05,7,'#f2efe8');sock.position.set(s*legX,0.09,0);root.add(sock);}
  const torso=new THREE.Group();torso.position.y=P?0.86:0.74;root.add(torso);C.j.torso=torso;
  const sleeveM=mat('#ffffff',{map:P?TEX.pSleeve:TEX.gSleeve});
  if(P){const body=cyl(0.135,0.155,0.56,9,sleeveM);body.position.y=0.3;torso.add(body);
    const hip=cyl(0.155,0.15,0.16,9,pantsC);hip.position.y=-0.04;torso.add(hip);
    const apron=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.235,0.98,12,1,true,-1.38,2.76),mat('#ffffff',{map:TEX.apron,side:THREE.DoubleSide}));apron.position.set(0,0.09,0.012);torso.add(apron);
    const bib=box(0.2,0.12,0.02,mat('#ffffff',{map:TEX.apron}));bib.position.set(0,0.54,0.138);torso.add(bib);
    for(const s of[-1,1]){const st=box(0.025,0.1,0.02,mat('#ffffff',{map:TEX.apron}));st.position.set(s*0.085,0.62,0.1);st.rotation.x=-0.5;torso.add(st);}
  }else{const body=cyl(0.15,0.17,0.5,9,sleeveM);body.position.y=0.33;torso.add(body);
    const vest=cyl(0.168,0.2,0.52,9,mat('#ffffff',{map:TEX.vest}));vest.position.y=0.27;torso.add(vest);
    const vt=cyl(0.17,0.172,0.06,9,mat('#ffffff',{map:TEX.vest}));vt.position.y=0.56;torso.add(vt);}
  // collar (white V) + 고름
  const neckY=P?0.6:0.6;
  for(const s of[-1,1]){const col=box(0.022,0.15,0.02,'#f7f3ea');col.position.set(s*0.035,neckY-0.07,P?0.13:0.155);col.rotation.z=s*0.55;torso.add(col);}
  const gor=box(0.032,0.2,0.012,P?'#3b2a26':'#2a2a2c');gor.position.set(-0.03,neckY-0.2,P?0.148:0.18);gor.rotation.z=0.06;torso.add(gor);
  const knot=box(0.06,0.035,0.02,P?'#3b2a26':'#2a2a2c');knot.position.set(-0.03,neckY-0.1,P?0.15:0.18);torso.add(knot);
  const neck=cyl(0.045,0.05,0.06,7,skinC);neck.position.y=neckY+0.01;torso.add(neck);
  // head
  const headP=new THREE.Group();headP.position.y=neckY+0.03;torso.add(headP);C.j.head=headP;
  C.faceMat=new THREE.MeshPhongMaterial({map:faceTex(kind,'smile'),shininess:4,specular:0x111111});
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.13,22,16),C.faceMat);head.scale.set(0.95,1.12,1.0);head.position.y=0.125;headP.add(head);C.headMesh=head;
  for(const s of[-1,1]){const ear=new THREE.Mesh(new THREE.IcosahedronGeometry(0.025,0),mat(skinC));ear.position.set(s*0.122,0.12,-0.005);ear.scale.set(0.6,1,0.8);headP.add(ear);}
  if(P){const hc='#2e211c';const cap=new THREE.Mesh(new THREE.SphereGeometry(0.137,12,8,0,Math.PI*2,0,Math.PI*0.4),mat(hc));cap.scale.set(0.97,1.14,1.03);cap.position.y=0.128;headP.add(cap);
    const back=new THREE.Mesh(new THREE.SphereGeometry(0.139,12,9,Math.PI*0.9,Math.PI*1.2,0,Math.PI*0.74),mat(hc,{side:THREE.DoubleSide}));back.scale.set(0.97,1.13,1.03);back.position.y=0.128;headP.add(back);
    for(const [x,y,z,rz,s] of[[-0.05,0.215,0.085,0.5,1.25],[0.04,0.225,0.09,-0.35,1.0],[-0.105,0.15,0.06,1.2,0.8],[0.105,0.15,0.06,-1.2,0.8]]){const fr=new THREE.Mesh(new THREE.IcosahedronGeometry(0.06,0),mat(hc));fr.scale.set(1.3*s,0.5,0.6);fr.position.set(x,y,z);fr.rotation.z=rz;headP.add(fr);}
    const pts=[[0.06,0.06,-0.1],[0.11,-0.03,-0.06],[0.13,-0.13,0.0],[0.13,-0.24,0.04],[0.12,-0.33,0.06]];
    pts.forEach((p,i)=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(0.055-i*0.006,0),mat(hc));m.scale.set(0.9,1.35,0.9);m.position.set(p[0],p[1]+0.06,p[2]);headP.add(m);});
    const scr=new THREE.Mesh(new THREE.TorusGeometry(0.035,0.017,5,8),mat('#3f6fc0'));scr.position.set(0.1,0.05,-0.08);scr.rotation.set(1.2,0.4,0);headP.add(scr);
  }else{const cols=['#c9c9cb','#a9a9ac','#dcdcde','#b8b8bb'];const cap=new THREE.Mesh(new THREE.SphereGeometry(0.138,10,8,0,Math.PI*2,0,Math.PI*0.4),mat('#b9b9bc'));cap.scale.set(1,1.14,1.03);cap.position.y=0.128;headP.add(cap);
    const back=new THREE.Mesh(new THREE.SphereGeometry(0.14,10,8,Math.PI*0.95,Math.PI*1.1,0,Math.PI*0.62),mat('#b9b9bc',{side:THREE.DoubleSide}));back.scale.set(1,1.12,1.03);back.position.y=0.128;headP.add(back);
    for(let i=0;i<46;i++){const th=Math.random()*Math.PI*0.5,ph=Math.random()*Math.PI*2;if(Math.sin(ph)>0.2&&th>Math.PI*0.32)continue;const r=0.145;const m=new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(0.032,0.05),0),mat(cols[i%4]));
      m.position.set(-r*Math.cos(ph)*Math.sin(th)*1.02,0.128+r*Math.cos(th)*1.14,r*Math.sin(ph)*Math.sin(th)*1.02);headP.add(m);}}
  // arms
  for(const [s,n] of[[1,'L'],[-1,'R']]){const sh=new THREE.Group();sh.position.set(s*(P?0.165:0.185),neckY-0.07,0);torso.add(sh);C.j['sh'+n]=sh;
    const up=cyl(0.044,0.05,0.27,7,sleeveM);up.position.y=-0.135;sh.add(up);
    const el=new THREE.Group();el.position.y=-0.27;sh.add(el);C.j['el'+n]=el;
    if(P){const fa=cyl(0.043,0.05,0.25,7,'#e8789a');fa.position.y=-0.12;el.add(fa);const cuff=cyl(0.052,0.052,0.05,7,'#e8789a');cuff.position.y=-0.01;el.add(cuff);}
    else{const fa=cyl(0.04,0.045,0.17,7,sleeveM);fa.position.y=-0.085;el.add(fa);const wr=cyl(0.033,0.036,0.08,7,skinC);wr.position.y=-0.2;el.add(wr);}
    const hand=new THREE.Group();hand.position.y=-0.25;el.add(hand);C.j['hand'+n]=hand;const hc=P?'#e8789a':skinC;
    const palm=box(0.07,0.095,0.035,hc);palm.position.y=-0.045;hand.add(palm);
    const fing=box(0.065,0.05,0.03,hc);fing.position.set(0,-0.105,0.006);hand.add(fing);
    const th=box(0.022,0.05,0.022,hc);th.position.set(s*0.04,-0.04,0.022);th.rotation.z=s*0.4;hand.add(th);
    if(n==='R'){const tu=box(0.026,0.07,0.026,hc);tu.position.set(-0.01,-0.14,0.03);tu.visible=false;hand.add(tu);C.thumbUp=tu;}}
  shadowAll(root,true,false);
  C.cur=JSON.parse(JSON.stringify(POSES.idle));
  C.setPose=(p)=>{C.pose=p;};
  C.setExpr=(e)=>{C.baseExpr=e;};
  C.flash=(e,d)=>{C.tmpExpr=e;C.tmpT=d||1.2;};
  C.say=(d)=>{C.talkT=d||1.5;};
  C.hop=()=>{C.hopT=0.45;};
  C.update=(dt)=>{C.t+=dt;const tgt=POSES[C.pose]||POSES.idle;const k=Math.min(1,dt*9);
    for(const key of['tx','hx'])C.cur[key]+=((tgt[key]||0)-C.cur[key])*k;C.cur.hy=(C.cur.hy||0)+(((tgt.hy||0)+C.look)-(C.cur.hy||0))*k;
    for(const key of['shX','out','el'])for(let i=0;i<2;i++)C.cur[key][i]+=(tgt[key][i]-C.cur[key][i])*k;
    let outR=C.cur.out[1],elR=C.cur.el[1],outL=C.cur.out[0],hx=C.cur.hx;
    if(tgt.anim==='wave')elR+=Math.sin(C.t*9)*0.45;
    if(tgt.anim==='fan')outR+=Math.sin(C.t*14)*0.25;
    if(tgt.anim==='cheer'){outR+=Math.sin(C.t*10)*0.15;outL+=Math.sin(C.t*10)*0.15;}
    if(tgt.anim==='chew')hx+=Math.sin(C.t*12)*0.05;
    C.j.shL.rotation.set(C.cur.shX[0],0,outL);C.j.shR.rotation.set(C.cur.shX[1],0,-outR);
    C.j.elL.rotation.x=C.cur.el[0];C.j.elR.rotation.x=elR;
    C.j.torso.rotation.x=C.cur.tx;C.j.head.rotation.set(hx+Math.sin(C.t*1.6)*0.015,C.cur.hy,0);
    C.j.torso.scale.y=1+Math.sin(C.t*2.2)*0.006;
    if(C.thumbUp)C.thumbUp.visible=!!tgt.thumb;
    let y=0;if(C.hopT>0){C.hopT-=dt;y=Math.sin((1-C.hopT/0.45)*Math.PI)*0.12;}if(tgt.anim==='cheer')y+=Math.abs(Math.sin(C.t*6))*0.05;C.root.position.y=C.baseY+y;
    let ex=C.baseExpr;if(C.tmpT>0){C.tmpT-=dt;ex=C.tmpExpr;}
    if(C.talkT>0){C.talkT-=dt;if(ex==='smile'||ex==='laugh'||ex==='worry')ex=(Math.floor(C.t*7.5)%2)?'talk':ex;}
    const tx=faceTex(kind,ex);if(C.faceMat.map!==tx){C.faceMat.map=tx;C.faceMat.needsUpdate=true;}};
  C.baseY=0;return C;}
const PLAYER=makeChar('player'), GRANDMA=makeChar('grandma');

/* =========================================================
   ENVIRONMENTS (같은 로우폴리 스타일)
   ========================================================= */
function onggi(r){const pts=[[0,0],[r*0.7,0],[r*1.05,r*0.7],[r,r*1.3],[r*0.6,r*1.6],[r*0.65,r*1.72],[0,r*1.72]].map(p=>new THREE.Vector2(p[0],p[1]));return new THREE.Mesh(new THREE.LatheGeometry(pts,8),mat('#6b4632'));}
function basin(r,h,c){const pts=[[0,0],[r*0.62,0],[r*0.95,h*0.85],[r,h],[r*0.96,h],[r*0.9,h*0.85],[r*0.57,0.06],[0,0.06]].map(p=>new THREE.Vector2(p[0],p[1]));return new THREE.Mesh(new THREE.LatheGeometry(pts,8),mat(c||'#b9bec4',{side:THREE.DoubleSide}));}
function pepperString(len){const g=new THREE.Group();const n=Math.round(len/0.09);for(let i=0;i<n;i++){const p=new THREE.Mesh(new THREE.ConeGeometry(0.035,0.16,5),mat(i%3?'#b3241a':'#8f1a12'));p.position.set(Math.sin(i*2.1)*0.04,-i*0.085,Math.cos(i*2.1)*0.04);p.rotation.set(Math.PI+Math.sin(i)*0.5,0,Math.cos(i*1.3)*0.5);g.add(p);}return g;}
function garlicWreath(){const g=new THREE.Group();for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const m=new THREE.Mesh(new THREE.IcosahedronGeometry(0.06,0),mat('#f3ecd8'));m.position.set(Math.cos(a)*0.2,Math.sin(a)*0.2,0);g.add(m);}return g;}
function sack(c){const m=cyl(0.16,0.2,0.36,6,c||'#cdb48a');m.position.y=0.18;const g=new THREE.Group();g.add(m);const t=new THREE.Mesh(new THREE.ConeGeometry(0.15,0.12,6),mat(c||'#cdb48a'));t.position.y=0.42;g.add(t);return g;}
function kimchiBowl(r,fill){const g=new THREE.Group();const b=basin(r,r*0.45,'#c5cacf');g.add(b);const f=new THREE.Mesh(new THREE.CylinderGeometry(r*0.9,r*0.7,r*0.3,8),mat(fill||'#c33a22'));f.position.y=r*0.33;g.add(f);
  for(let i=0;i<7;i++){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(r*0.2,0),mat(fill==='#e9edb8'?'#cfe08e':i%2?'#c9341f':'#e8d070'));m.position.set(rnd(-.5,.5)*r,r*0.48,rnd(-.5,.5)*r);m.rotation.set(rnd(0,3),rnd(0,3),0);g.add(m);}return g;}
function cabbageHalf(s){const ing=ING.cabbage;const m=wholeModel(ing);m.scale.setScalar(s||0.4);return m;}

// 1인칭 주방 (조리대 윗면 y=0)
function kitchen(sc){
  sc.background=hex('#efe2cc');
  const counter=new THREE.Mesh(new THREE.BoxGeometry(14,0.6,7),mat('#ffffff',{map:WOOD}));WOOD.repeat.set(6,3);counter.position.set(0,-0.3,-1);sc.add(counter);
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(14,5),new THREE.MeshPhongMaterial({map:TILE,shininess:20}));TILE.repeat.set(10,3.5);wall.position.set(0,2.2,-4.5);sc.add(wall);
  const shelf=box(14,0.15,0.8,'#8a5a34');shelf.position.set(0,2.6,-4.1);sc.add(shelf);
  for(let i=0;i<7;i++){const j=onggi(0.35+Math.random()*0.15);j.position.set(-5.5+i*1.8,2.68,-4.1);sc.add(j);}
  for(let i=0;i<4;i++){const p=pepperString(1.4);p.position.set(-4.8+i*0.35,4.2,-3.9);sc.add(p);}
  const gw=garlicWreath();gw.position.set(4.6,3.6,-4.3);sc.add(gw);
  for(let i=0;i<3;i++){const s=sack();s.position.set(5.2+i*0.5,0,-2.9);sc.add(s);}
  const kb=kimchiBowl(0.7);kb.position.set(-4.2,0,-2.4);sc.add(kb);const cb=kimchiBowl(0.6,'#e9edb8');cb.position.set(-2.7,0,-3.0);sc.add(cb);
}
// 3인칭 주방 (플레이어 무대)
function buildK3(){const sc=new THREE.Scene();sc.background=hex('#f1e4cf');lights(sc,{shadow:true,sx:1.5,sy:5,sz:4});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(14,10),mat('#ffffff',{map:woodTex('#b98c5e','#a77b4f')}));floor.rotation.x=-Math.PI/2;floor.material.map.repeat.set(8,6);sc.add(floor);
  const tiles=TILE.clone();tiles.needsUpdate=true;tiles.repeat.set(9,3);const wall=new THREE.Mesh(new THREE.PlaneGeometry(9,3.2),new THREE.MeshPhongMaterial({map:tiles,shininess:20}));wall.position.set(0,1.6,-2.2);sc.add(wall);
  const upper=box(9,0.9,0.1,'#e9dcc6');upper.position.set(0,3.6,-2.18);sc.add(upper);
  // shelves with sacks & jars (left)
  for(const y of[1.55,2.35]){const sh=box(2.4,0.08,0.5,'#8a5a34');sh.position.set(-2.4,y,-1.95);sc.add(sh);}
  [[-3.3,1.59],[-2.85,1.59],[-2.2,1.59],[-3.2,2.39],[-2.6,2.39]].forEach(([x,y],i)=>{const s=i%2?sack('#d8c39a'):sack('#c9ad80');s.scale.setScalar(0.8);s.position.set(x,y,-1.95);sc.add(s);});
  [[-1.75,1.59],[-1.6,2.39]].forEach(([x,y])=>{const g=new THREE.Group();for(let i=0;i<5;i++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(0.07,0),mat('#f1ead6'));m.position.set(rnd(-.12,.12),0.07,rnd(-.1,.1));g.add(m);}g.position.set(x,y,-1.95);sc.add(g);});
  for(let i=0;i<4;i++){const p=pepperString(1.0);p.position.set(-3.5+i*0.28,3.15,-1.8);sc.add(p);}
  const gw=garlicWreath();gw.position.set(2.6,2.6,-2.12);sc.add(gw);
  // onggi on right
  for(const [x,z,r] of[[2.6,-1.7,0.38],[3.2,-1.5,0.3],[2.2,-1.2,0.24],[3.0,-0.9,0.22]]){const j=onggi(r);j.position.set(x,0,z);sc.add(j);}
  for(const y of[1.5,2.2]){const sh=box(1.8,0.07,0.45,'#8a5a34');sh.position.set(2.7,y,-1.98);sc.add(sh);for(let i=0;i<3;i++){const j=onggi(0.13);j.position.set(2.1+i*0.6,y+0.04,-1.98);sc.add(j);}}
  // counter
  const ctr=box(4.4,0.86,0.9,'#9c6b42');ctr.position.set(0,0.43,0.75);sc.add(ctr);
  const top=new THREE.Mesh(new THREE.BoxGeometry(4.5,0.07,1.08),mat('#ffffff',{map:woodTex('#b98552','#a4733f')}));top.position.set(0,0.895,0.75);sc.add(top);
  const kb=kimchiBowl(0.32);kb.position.set(-1.65,0.93,0.7);sc.add(kb);
  const cb=kimchiBowl(0.3,'#e9edb8');cb.position.set(1.75,0.93,0.75);sc.add(cb);
  const ch=cabbageHalf(0.32);ch.position.set(2.0,0.93,0.55);ch.rotation.y=0.6;sc.add(ch);
  const board=box(0.7,0.05,0.42,'#c99a63');board.position.set(-0.75,0.955,0.95);sc.add(board);
  const scale=new THREE.Group();const sb=box(0.3,0.2,0.26,'#b8bcc0');sb.position.y=0.1;scale.add(sb);const sd=cyl(0.1,0.1,0.03,10,'#ffffff');sd.rotation.x=Math.PI/2;sd.position.set(0,0.13,0.135);scale.add(sd);scale.position.set(1.15,0.93,1.0);sc.add(scale);
  shadowAll(sc);floor.castShadow=false;wall.castShadow=false;
  const items=new THREE.Group();sc.add(items);
  PLAYER.root.position.set(0,0,0.05);sc.add(PLAYER.root);
  return {scene:sc,items,board,decor:[board,scale,cb,ch]};}
// 시장 (할머니 무대)
function buildMarket(){const sc=new THREE.Scene();sc.background=hex('#e9dcc6');sc.fog=new THREE.Fog(0xe9dcc6,6,14);lights(sc,{shadow:true,sx:-2,sy:5,sz:3.5,sun:0.9});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(16,12),mat('#cdbfa6'));floor.rotation.x=-Math.PI/2;sc.add(floor);
  for(let i=0;i<30;i++){const t=box(rnd(0.4,0.8),0.01,rnd(0.3,0.6),'#c3b499');t.position.set(rnd(-5,5),0.005,rnd(-3,3));sc.add(t);}
  // back shelves with onggi
  const back=box(5,2.6,0.1,'#8a6444');back.position.set(-1.4,1.3,-2.3);sc.add(back);
  for(const y of[0.95,1.75]){const sh=box(4,0.08,0.5,'#6e4a30');sh.position.set(-1.6,y,-2.05);sc.add(sh);for(let i=0;i<6;i++){const j=onggi(rnd(0.17,0.22));j.position.set(-3.3+i*0.68,y+0.04,-2.05);sc.add(j);}}
  for(let i=0;i<6;i++){const j=onggi(rnd(0.22,0.3));j.position.set(-3.5+i*0.75,0,-1.9);sc.add(j);}
  const beam=box(7,0.12,0.12,'#6e4a30');beam.position.set(0,2.6,-1.9);sc.add(beam);
  for(let i=0;i<6;i++){const p=pepperString(rnd(0.7,1.0));p.position.set(-3.0+i*0.55,2.55,-1.85);sc.add(p);}for(let i=0;i<4;i++){const p=pepperString(rnd(0.7,1.0));p.position.set(1.6+i*0.5,2.55,-1.85);sc.add(p);}
  // grandma's table
  const tbl=box(2.6,0.76,0.9,'#7a5236');tbl.position.set(0,0.38,0.8);sc.add(tbl);
  const ttop=box(2.7,0.06,0.98,'#9c6b42');ttop.position.set(0,0.79,0.8);sc.add(ttop);
  const kb=kimchiBowl(0.3);kb.position.set(-0.85,0.82,0.75);sc.add(kb);const cb=kimchiBowl(0.27,'#e9edb8');cb.position.set(0.9,0.82,0.7);sc.add(cb);
  const gb=basin(0.22,0.12,'#c5cacf');gb.position.set(1.0,0.82,1.05);sc.add(gb);const gm=new THREE.Mesh(new THREE.ConeGeometry(0.17,0.12,8),mat('#c8281e'));gm.position.set(1.0,0.92,1.05);sc.add(gm);
  for(let i=0;i<3;i++){const ch=cabbageHalf(0.17);ch.position.set(-0.95+i*0.2,0.82,1.0);ch.rotation.y=rnd(-.4,.4);sc.add(ch);}
  const plate=cyl(0.3,0.22,0.04,10,'#f7f3ec');plate.position.set(0.05,0.84,0.62);sc.add(plate);
  const plateGrp=new THREE.Group();plateGrp.position.set(0.05,0.86,0.62);sc.add(plateGrp);
  // neighbour stalls & people (background)
  for(const [x,z] of[[3.6,-1.2],[-4.4,-0.6]]){const t=box(1.8,0.74,0.8,'#7a5236');t.position.set(x,0.37,z);sc.add(t);for(let i=0;i<3;i++){const b=kimchiBowl(0.22,i===1?'#e9edb8':'#c33a22');b.position.set(x-0.55+i*0.55,0.75,z);sc.add(b);}}
  const folk=(x,z,c1,c2,ry)=>{const g=new THREE.Group();const b=cyl(0.17,0.21,0.75,7,c1);b.position.y=0.95;g.add(b);const l=cyl(0.15,0.17,0.6,7,'#2b2622');l.position.y=0.3;g.add(l);const h=new THREE.Mesh(new THREE.SphereGeometry(0.12,8,6),mat('#e2b892'));h.position.y=1.45;g.add(h);const hr=new THREE.Mesh(new THREE.SphereGeometry(0.125,8,6,0,Math.PI*2,0,Math.PI*0.55),mat(c2));hr.position.y=1.47;g.add(hr);g.position.set(x,0,z);g.rotation.y=ry||0;sc.add(g);};
  folk(3.6,-2.0,'#5f8a6a','#3a2a22',0.2);folk(-4.3,-1.5,'#8a5f6a','#2a2220',-0.3);folk(4.6,-0.4,'#6a6f8a','#555',-0.8);
  shadowAll(sc);floor.castShadow=false;
  GRANDMA.root.position.set(0,0,0);sc.add(GRANDMA.root);
  return {scene:sc,plateGrp};}

function glove(){const g=new THREE.Group();const gm=mat('#e8789a');const palm=box(0.42,0.14,0.48,gm);g.add(palm);
  for(let i=0;i<4;i++){const f=cyl(0.045,0.05,0.3,6,gm);f.rotation.x=Math.PI/2;f.position.set(-0.15+i*0.1,0,-0.36);g.add(f);}
  const th=cyl(0.05,0.055,0.24,6,gm);th.rotation.set(Math.PI/2,0,-0.8);th.position.set(0.26,0,-0.08);g.add(th);
  const cuff=cyl(0.24,0.26,0.6,7,gm);cuff.rotation.x=Math.PI/2.4;cuff.position.set(0,0.18,0.5);g.add(cuff);g.scale.setScalar(0.55);return g;}
