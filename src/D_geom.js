
/* ---------- piece geometry: clip section, extrude ---------- */
function clipSec(poly,z0,z1){ // poly: [[z,y,flag]]  flag=edge from this vertex is a cut face
  let P=poly.map(p=>[p[0],p[1],p[2]||0]);
  const clip=(P,inside,isect)=>{const out=[];for(let i=0;i<P.length;i++){const S=P[i],E=P[(i+1)%P.length],si=inside(S),ei=inside(E);
      if(si&&ei)out.push([E[0],E[1],E[2]]);else if(si&&!ei){const I=isect(S,E);out.push([I[0],I[1],1]);}else if(!si&&ei){const I=isect(S,E);out.push([I[0],I[1],S[2]]);out.push([E[0],E[1],E[2]]);}}
    // rotate so flags line up: out[j] flag is edge out[j]->out[j+1]; constructed list has that property already
    return out;};
  const ix=z=>(S,E)=>{const t=(z-S[0])/(E[0]-S[0]);return [z,S[1]+(E[1]-S[1])*t];};
  if(z0!==null)P=clip(P,p=>p[0]>=z0-1e-9,ix(z0));
  if(z1!==null)P=clip(P,p=>p[0]<=z1+1e-9,ix(z1));
  return P;}
function bandColor(ing,t){for(const b of ing.bands)if(t<=b[0]+1e-6)return b[1];return ing.bands[ing.bands.length-1][1];}
function buildPieceProc(ing,x0,x1,z0,z1){
  const sec=ing.sec, zs=sec.map(p=>p[0]), zmin=Math.min(...zs), zmax=Math.max(...zs), W=zmax-zmin, L=ing.L;
  const Z0=zmin+W*z0, Z1=zmin+W*z1;
  const P=clipSec(sec,z0>0.0001?Z0:null,z1<0.9999?Z1:null);
  const X0=-L/2+L*x0, X1=-L/2+L*x1;
  const tq=ing.taper||[1,1], sm=tq[0]+(tq[1]-tq[0])*(x0+x1)/2;const cx=(X0+X1)/2, cz=(Z0+Z1)/2*sm, ys=P.map(p=>p[1]*sm), cy=(Math.min(...ys)+Math.max(...ys))/2;
  const skin=hex(bandColor(ing,(x0+x1)/2)), inner=hex(ing.inner), endSkin0=hex(bandColor(ing,0.001)), endSkin1=hex(bandColor(ing,0.999));
  const tp=ing.taper||[1,1], sAt=t=>tp[0]+(tp[1]-tp[0])*t, s0=sAt(x0), s1=sAt(x1);
  const pos=[],col=[];
  const jitter=c=>{const k=0.94+Math.random()*0.1;return [c.r*k,c.g*k,c.b*k];};
  const tri=(a,b,c,color)=>{const cc=jitter(color);for(const v of[a,b,c]){pos.push(v[0]-cx,v[1]-cy,v[2]-cz);col.push(...cc);}};
  for(let i=0;i<P.length;i++){const A=P[i],B=P[(i+1)%P.length];const c=A[2]?inner:skin;
    const a0=[X0,A[1]*s0,A[0]*s0],b0=[X0,B[1]*s0,B[0]*s0],a1=[X1,A[1]*s1,A[0]*s1],b1=[X1,B[1]*s1,B[0]*s1];tri(a0,b0,b1,c);tri(a0,b1,a1,c);}
  const capC0=x0<0.0001?endSkin0:inner, capC1=x1>0.9999?endSkin1:inner;
  for(let i=1;i<P.length-1;i++){tri([X0,P[0][1]*s0,P[0][0]*s0],[X0,P[i+1][1]*s0,P[i+1][0]*s0],[X0,P[i][1]*s0,P[i][0]*s0],capC0);tri([X1,P[0][1]*s1,P[0][0]*s1],[X1,P[i][1]*s1,P[i][0]*s1],[X1,P[i+1][1]*s1,P[i+1][0]*s1],capC1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,shininess:6,specular:0x111111,side:THREE.DoubleSide}));
  m.userData={cx,cy,cz,col0:new Float32Array(col)};
  return m;}
function wholeModel(ing){const m=buildPiece(ing,0,1,0,1);const grp=new THREE.Group();m.position.set(m.userData.cx,m.userData.cy,m.userData.cz);grp.add(m);return grp;}

/* ---------- thumbnails ---------- */
const TR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});TR.setSize(160,140);
function snap(obj,dist,camY){const sc=new THREE.Scene();lights(sc);sc.add(obj);const box=new THREE.Box3().setFromObject(obj),c=box.getCenter(new THREE.Vector3()),sz=box.getSize(new THREE.Vector3()).length();
  const cam=new THREE.PerspectiveCamera(35,160/140,0.1,50);cam.position.set(c.x+sz*0.55,c.y+sz*(camY||0.75),c.z+sz*(dist||1.25));cam.lookAt(c);TR.render(sc,cam);return TR.domElement.toDataURL();}
const THUMB={};
function makeThumbs(){INGS.forEach(i=>THUMB[i.k]=snap(wholeModel(i)));SEAS.forEach(s=>THUMB['s_'+s.k]=snap(container(s)));STORES.forEach(s=>THUMB['st_'+s.k]=snap(storeModel(s.k),1.1,0.7));}

/* ---------- containers ---------- */
function containerProc(s){const g=new THREE.Group();const c=s.c;
  if(s.shape==='jar'){const b=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.42,8),mat('#f4f1ea',{transparent:true,opacity:0.55}));b.position.y=0.21;g.add(b);const f=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.3,8),mat(c));f.position.y=0.16;g.add(f);const l=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.1,8),mat('#d9d4cc'));l.position.y=0.47;g.add(l);}
  else if(s.shape==='bottle'){const b=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.18,0.55,7),mat(c));b.position.y=0.28;g.add(b);const n=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.13,0.2,7),mat(c));n.position.y=0.64;g.add(n);const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.08,7),mat('#d9482f'));cap.position.y=0.77;g.add(cap);const lb=new THREE.Mesh(new THREE.CylinderGeometry(0.185,0.185,0.2,7),mat('#fff7e4'));lb.position.y=0.3;g.add(lb);}
  else if(s.shape==='bag'){const b=new THREE.Mesh(new THREE.BoxGeometry(0.46,0.6,0.26),mat('#a9cbe8'));b.position.y=0.3;b.rotation.z=0.06;g.add(b);const w=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.22,0.27),mat(c));w.position.y=0.36;g.add(w);}
  else if(s.shape==='can'){const b=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.17,0.48,9),mat('#c8281e'));b.position.y=0.24;g.add(b);const t=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.17,0.05,9),mat('#cfd3d6'));t.position.y=0.5;g.add(t);}
  return g;}
function storeModel(k){const g=new THREE.Group();
  if(k==='now'){const p=new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.6,0.12,10),mat('#f7f3ec'));g.add(p);for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(0.17,0),mat(i%3?'#d0402a':'#e9e3a4'));m.position.set((Math.random()-.5)*0.9,0.15+Math.random()*0.12,(Math.random()-.5)*0.9);m.rotation.set(Math.random()*3,Math.random()*3,0);g.add(m);}}
  else if(k==='box'){const b=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.8,1.0),mat('#e9eef0',{transparent:true,opacity:0.8}));b.position.y=0.4;g.add(b);const f=new THREE.Mesh(new THREE.BoxGeometry(1.3,0.55,0.9),mat('#c33a22'));f.position.y=0.3;g.add(f);const l=new THREE.Mesh(new THREE.BoxGeometry(1.48,0.12,1.08),mat('#5f9fd0'));l.position.y=0.86;g.add(l);}
  else{const j=onggi(0.62);g.add(j);const lid=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.46,0.1,8),mat('#5a3a28'));lid.position.y=1.1;g.add(lid);}
  return g;}

