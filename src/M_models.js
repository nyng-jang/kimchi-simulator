
/* =========================================================
   MODEL FILES (assets/*.glb)  — 재료·양념 모델을 파일에서 불러와 사용
   - 재료: 불러온 메시를 그대로 평면으로 잘라 조각을 만듦 (모양이 바뀌어도 썰기 동작)
   - 파일을 못 불러오면 코드로 만든 기본 모델로 대체
   ========================================================= */
const MODELS={}, SEAMODELS={};
const ASSET_BASE='assets/';
function bakeGeometry(root){ // 씬 안의 모든 메시를 하나의 비인덱스 지오메트리(위치+색)로 합침
  root.updateMatrixWorld(true);const pos=[],col=[];
  root.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(g.index)g=g.toNonIndexed();
    const p=g.attributes.position,c=g.attributes.color,mc=(o.material&&o.material.color)?o.material.color:new THREE.Color(0xcccccc);
    for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));if(c)col.push(c.getX(i),c.getY(i),c.getZ(i));else col.push(mc.r,mc.g,mc.b);}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return g;}
function normalizeIngredient(geo,ing){ // x 길이를 데이터의 L에 맞추고, x·z 가운데 정렬, 바닥 y=0
  geo.computeBoundingBox();const b=geo.boundingBox,sx=b.max.x-b.min.x;const s=sx>1e-6?ing.L/sx:1;
  const t=[(b.min.x+b.max.x)/2,b.min.y,(b.min.z+b.max.z)/2];geo.translate(-t[0],-t[1],-t[2]);geo.scale(s,s,s);geo.computeBoundingBox();geo.userData={xf:{t,s}};return geo;}
function loadAssets(){
  if(!THREE.GLTFLoader)return Promise.resolve('no-loader');
  const loader=new THREE.GLTFLoader();
  const one=(url)=>new Promise(res=>{let done=false;const t=setTimeout(()=>{if(!done){done=true;res(null);}},8000);
    loader.load(url,g=>{if(!done){done=true;clearTimeout(t);res(g);}},undefined,()=>{if(!done){done=true;clearTimeout(t);res(null);}});});
  return Promise.all([
    ...INGS.map(i=>one(`${ASSET_BASE}ingredients/${i.k}.glb`).then(g=>{if(g){try{const geo=normalizeIngredient(bakeGeometry(g.scene),i);MODELS[i.k]={geo,box:geo.boundingBox.clone(),xf:geo.userData.xf};}catch(e){console.warn('model',i.k,e);}}})),
    ...SEAS.map(s=>one(`${ASSET_BASE}seasonings/${s.k}.glb`).then(g=>{if(g)SEAMODELS[s.k]=g.scene;})),
  ]).then(()=>`${Object.keys(MODELS).length}/${INGS.length} ingredients, ${Object.keys(SEAMODELS).length}/${SEAS.length} seasonings`);}

/* ---------- 단면 무늬: 원래 모델 좌표(p) → 색. 여기 없는 재료는 단색(ing.inner) ---------- */
const _h3=(a,b,c,s)=>{let n=Math.sin(a*127.1+b*311.7+c*74.7+(s||0)*19.3)*43758.5453;return n-Math.floor(n);};
function _vn(x,y,z){const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),fx=x-X,fy=y-Y,fz=z-Z,s=t=>t*t*(3-2*t),l=(a,b,t)=>a+(b-a)*t,h=(a,b,c)=>_h3(a,b,c);
  return l(l(l(h(X,Y,Z),h(X+1,Y,Z),s(fx)),l(h(X,Y+1,Z),h(X+1,Y+1,Z),s(fx)),s(fy)),l(l(h(X,Y,Z+1),h(X+1,Y,Z+1),s(fx)),l(h(X,Y+1,Z+1),h(X+1,Y+1,Z+1),s(fx)),s(fy)),s(fz));}
function _spots(p,cell,rad,prob,seed,stretch){ // 격자 칸마다 점 하나 (확률 prob), 반지름 rad 안이면 true
  const cx=Math.floor(p[0]/cell),cy=Math.floor(p[1]/cell),cz=Math.floor(p[2]/cell);
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(let k=-1;k<=1;k++){const a=cx+i,b=cy+j,c=cz+k;if(_h3(a,b,c,seed)>prob)continue;
    const q=[(a+_h3(a,b,c,seed+1))*cell,(b+_h3(a,b,c,seed+2))*cell,(c+_h3(a,b,c,seed+3))*cell];const st=stretch||[1,1,1];
    const d=Math.hypot((p[0]-q[0])/st[0],(p[1]-q[1])/st[1],(p[2]-q[2])/st[2]);if(d<rad)return [q,d/rad];}return null;}
const _mix=(a,b,t)=>{const A=hex(a),B=hex(b);return A.lerp(B,Math.max(0,Math.min(1,t)));};
const INNER={
  watermelon:p=>{const d=Math.hypot(p[0],p[1]-0.601,p[2])/0.61;
    if(d>0.95)return hex('#2f6b2a');if(d>0.86)return _mix('#e8f0c8','#b9d98a',(d-0.86)/0.09);
    const s=_spots(p,0.1,0.03,0.9,1,[0.7,1.4,0.7]);if(s&&d>0.2&&d<0.8)return hex(s[1]<0.5?'#1a0f08':'#3a2214');
    return _mix('#e8455a','#ff6a6a',_vn(p[0]*6,p[1]*6,p[2]*6)*0.6+(d<0.3?0.3:0));},
  dujjon:p=>{const e=Math.hypot(p[0]/0.45,(p[1]-0.3)/0.3,p[2]/0.34);if(e>0.9)return _mix('#3a1f10','#5a3420',_vn(p[0]*30,p[1]*30,p[2]*30));
    const strand=_vn(p[0]*8,p[1]*40,p[2]*40),fine=_vn(p[0]*60,p[1]*60,p[2]*60);let c=_mix('#6f9a3a','#a9c96a',strand);if(fine>0.72)c=_mix('#c9dc8a','#e8e2a8',fine);if(fine<0.15)c=hex('#4f7a2a');return c;},
  mintchoco:p=>{const s=_spots(p,0.1,0.035,0.75,5,[1.3,0.7,1]);if(s)return hex(s[1]<0.6?'#3a2214':'#5a3a24');return _mix('#8fe0c8','#b5efdc',_vn(p[0]*10,p[1]*10,p[2]*10));},
  cheese:p=>{const holes=[[0.0,0.42,0.08,0.09],[-0.25,0.42,-0.1,0.07],[0.18,0.42,-0.05,0.05],[-0.1,0.2,0.192,0.08],[0.12,0.12,0.124,0.06],[-0.38,0.25,0,0.1],[-0.3,0.1,-0.264,0.06],[0.05,0.28,-0.14,0.07]];
    for(const [x,y,z,r] of holes){const d=Math.hypot(p[0]-x,p[1]-y,p[2]-z);if(d<r)return _mix('#b8861f','#dcaa34',d/r);}
    const s=_spots(p,0.16,0.05,0.5,9);if(s)return _mix('#b8861f','#dcaa34',s[1]);return _mix('#f2c84b','#f7d76a',_vn(p[0]*8,p[1]*8,p[2]*8));},
  pineapple:p=>{const r=Math.hypot(p[1]-0.36,p[2])/0.36;if(p[0]>0.47)return hex('#7fa33a');
    if(r>0.93)return hex('#8a5a1e');if(r>0.85)return hex('#d9b04a');if(r<0.22)return _mix('#f7e7a0','#efd67a',r/0.22);
    const ang=Math.atan2(p[2],p[1]-0.36);const fiber=Math.abs(Math.sin(ang*18))<0.12;return fiber?hex('#f0cf52'):_mix('#ffd84d','#ffe27a',_vn(p[0]*12,r*6,ang));},
};
function _subdiv(a,b,c,h,out,depth){ // 가장 긴 변을 반으로 나누기 (넓이에 비례하는 개수만 생김)
  const L=[Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]),Math.hypot(b[0]-c[0],b[1]-c[1],b[2]-c[2]),Math.hypot(c[0]-a[0],c[1]-a[1],c[2]-a[2])];const e=Math.max(...L);
  if(e<=h||depth>14){out.push([a,b,c]);return;}const m=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2];
  if(e===L[0]){const x=m(a,b);_subdiv(a,x,c,h,out,depth+1);_subdiv(x,b,c,h,out,depth+1);}
  else if(e===L[1]){const x=m(b,c);_subdiv(a,b,x,h,out,depth+1);_subdiv(a,x,c,h,out,depth+1);}
  else{const x=m(c,a);_subdiv(a,b,x,h,out,depth+1);_subdiv(x,b,c,h,out,depth+1);}}

/* ---------- 평면 자르기: 반공간으로 자르고 잘린 면(단면)을 채움 ---------- */
function clipHalf(pos,col,axis,c,keepGreater,capColor){
  const out=[],oc=[],segs=[];const A=axis==='x'?0:2;
  const keyOf=(p)=>p.map(v=>(Math.round(v*1e4)+0)).join(','); // -0/0, 미세 오차를 같은 점으로
  const inside=(p)=>keepGreater?p[A]>=c:p[A]<=c;
  const isect=(P,Q,cp,cq)=>{ // 같은 변은 항상 같은 순서로 계산해 이웃 삼각형과 정확히 같은 점이 나오게
    let a=P,b=Q,ca=cp,cb=cq;if(keyOf(a)>keyOf(b)){a=Q;b=P;ca=cq;cb=cp;}
    const t=(c-a[A])/(b[A]-a[A]);return [[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],[ca[0]+(cb[0]-ca[0])*t,ca[1]+(cb[1]-ca[1])*t,ca[2]+(cb[2]-ca[2])*t]];};
  for(let i=0;i<pos.length;i+=9){const P=[[pos[i],pos[i+1],pos[i+2]],[pos[i+3],pos[i+4],pos[i+5]],[pos[i+6],pos[i+7],pos[i+8]]];
    const C=[[col[i],col[i+1],col[i+2]],[col[i+3],col[i+4],col[i+5]],[col[i+6],col[i+7],col[i+8]]];
    const ins=P.map(inside);const n=ins.filter(Boolean).length;
    if(n===3){for(let j=0;j<3;j++){out.push(...P[j]);oc.push(...C[j]);}continue;}
    if(n===0)continue;
    const poly=[],pc=[],cross=[];
    for(let j=0;j<3;j++){const S=P[j],E=P[(j+1)%3],cs=C[j],ce=C[(j+1)%3],si=ins[j],ei=ins[(j+1)%3];
      if(si){poly.push(S);pc.push(cs);}
      if(si!==ei){const [ip,ic]=isect(S,E,cs,ce);poly.push(ip);pc.push(ic);cross.push(ip);}}
    for(let j=1;j<poly.length-1;j++){out.push(...poly[0],...poly[j],...poly[j+1]);oc.push(...pc[0],...pc[j],...pc[j+1]);}
    if(cross.length===2)segs.push(cross);}
  // 단면: 교차 선분을 고리로 이어서 삼각분할
  const ends=new Map();segs.forEach((s,i)=>{for(const e of[0,1]){const k=keyOf(s[e]);if(!ends.has(k))ends.set(k,[]);ends.get(k).push([i,e]);}});
  const used=new Array(segs.length).fill(false);const U=axis==='x'?2:0;
  for(let i=0;i<segs.length;i++){if(used[i])continue;used[i]=true;const loop=[segs[i][0],segs[i][1]];const startK=keyOf(segs[i][0]);let curK=keyOf(segs[i][1]);let guard=0;
    while(curK!==startK&&guard++<5000){const cand=(ends.get(curK)||[]).find(([j])=>!used[j]);if(!cand)break;const [j,e]=cand;used[j]=true;const nxt=segs[j][1-e];curK=keyOf(nxt);if(curK!==startK)loop.push(nxt);}
    if(loop.length<3)continue;
    const contour=loop.map(p=>new THREE.Vector2(p[U],p[1]));let tris;try{tris=THREE.ShapeUtils.triangulateShape(contour,[]);}catch(e){continue;}
    const cc=typeof capColor==='function'?null:hex(capColor),want=keepGreater?-1:1;tris.forEach(t=>{const k=0.95+Math.random()*0.08;let [a,b,c2]=t.map(id=>loop[id]);
      const e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],e2=[c2[0]-a[0],c2[1]-a[1],c2[2]-a[2]];const nA=A===0?e1[1]*e2[2]-e1[2]*e2[1]:e1[0]*e2[1]-e1[1]*e2[0];
      if(Math.sign(nA)!==want)[b,c2]=[c2,b]; // 단면이 잘린 쪽 바깥을 보도록 방향 맞춤
      if(typeof capColor==='function'){const parts=[];_subdiv(a,b,c2,0.042,parts,0);for(const [p,q,r] of parts){const cen=[(p[0]+q[0]+r[0])/3,(p[1]+q[1]+r[1])/3,(p[2]+q[2]+r[2])/3];const col2=capColor(cen);out.push(...p,...q,...r);for(let z=0;z<3;z++)oc.push(col2.r,col2.g,col2.b);}}
      else for(const v of[a,b,c2]){out.push(...v);oc.push(cc.r*k,cc.g*k,cc.b*k);}});}
  return [out,oc];}
function slicePiece(ing,x0,x1,z0,z1){const M=MODELS[ing.k];const b=M.box,eps=1e-5;
  const pat=INNER[ing.k]&&M.xf?(p=>{const {t,s}=M.xf;return INNER[ing.k]([p[0]/s+t[0],p[1]/s+t[1],p[2]/s+t[2]]);}):null;const capC=pat||ing.inner;
  const X=t=>b.min.x+(b.max.x-b.min.x)*t, Z=t=>b.min.z+(b.max.z-b.min.z)*t;
  // 영역 밖 삼각형은 미리 버림 (자르기 연산량 감소)
  const P0=M.geo.attributes.position.array,C0=M.geo.attributes.color.array,xa=X(x0)-1e-4,xb=X(x1)+1e-4,za=Z(z0)-1e-4,zb=Z(z1)+1e-4;let pos=[],col=[];
  for(let i=0;i<P0.length;i+=9){const mnx=Math.min(P0[i],P0[i+3],P0[i+6]),mxx=Math.max(P0[i],P0[i+3],P0[i+6]),mnz=Math.min(P0[i+2],P0[i+5],P0[i+8]),mxz=Math.max(P0[i+2],P0[i+5],P0[i+8]);
    if(mxx<xa||mnx>xb||mxz<za||mnz>zb)continue;for(let j=0;j<9;j++){pos.push(P0[i+j]);col.push(C0[i+j]);}}
  if(x0>0.0001)[pos,col]=clipHalf(pos,col,'x',X(x0)+eps,true,capC);
  if(x1<0.9999)[pos,col]=clipHalf(pos,col,'x',X(x1)-eps,false,capC);
  if(z0>0.0001)[pos,col]=clipHalf(pos,col,'z',Z(z0)+eps,true,capC);
  if(z1<0.9999)[pos,col]=clipHalf(pos,col,'z',Z(z1)-eps,false,capC);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  g.computeBoundingBox();const bb=g.boundingBox;const cx=(bb.min.x+bb.max.x)/2,cy=(bb.min.y+bb.max.y)/2,cz=(bb.min.z+bb.max.z)/2;
  g.translate(-cx,-cy,-cz);g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,shininess:6,specular:0x111111,side:THREE.DoubleSide}));
  m.userData={cx,cy,cz,col0:new Float32Array(g.attributes.color.array)};return m;}
const PIECE_CACHE=new Map();
function buildPiece(ing,x0,x1,z0,z1){if(MODELS[ing.k]){try{const key=[ing.k,x0,x1,z0,z1].map(v=>typeof v==='number'?v.toFixed(4):v).join('|');let src=PIECE_CACHE.get(key);
      if(!src){src=slicePiece(ing,x0,x1,z0,z1);PIECE_CACHE.set(key,src);if(PIECE_CACHE.size>400)PIECE_CACHE.delete(PIECE_CACHE.keys().next().value);}
      const g=src.geometry.clone();const m=new THREE.Mesh(g,src.material);m.userData={cx:src.userData.cx,cy:src.userData.cy,cz:src.userData.cz,col0:src.userData.col0};return m;}catch(e){console.warn('slice',e);}}return buildPieceProc(ing,x0,x1,z0,z1);}
function modelZRange(ing){const M=MODELS[ing.k];if(M)return [M.box.min.z,M.box.max.z];const zs=ing.sec.map(p=>p[0]);return [Math.min(...zs),Math.max(...zs)];}
function modelTop(ing){const M=MODELS[ing.k];if(M)return M.box.max.y;return Math.max(...ing.sec.map(p=>p[1]));}
function container(s){const src=SEAMODELS[s.k];if(!src)return containerProc(s);
  const g=src.clone(true);g.traverse(o=>{if(o.isMesh){const m=o.material;o.material=mat(m.color?m.color.clone():'#cccccc',{transparent:!!m.transparent,opacity:m.opacity==null?1:m.opacity});}});return g;}
