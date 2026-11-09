import { softenMaterial } from './surface-materials.js?v=20261102-9';
import * as THREE from './three.module.js';

// Sculpted bodies and articulated fins: no billboard fish are used here.
export function createKun(color = 0x9feaff, size = 1, compact = false) {
  const root = new THREE.Group(); root.name = 'animated-kun'; root.scale.setScalar(size);
  const skin = new THREE.MeshPhysicalMaterial({color, metalness:.05, roughness:.65, clearcoat:.18, emissive:color, emissiveIntensity:.4});
  softenMaterial(skin,'scales',.13);
  const belly = new THREE.MeshStandardMaterial({color:0xe5faff, roughness:.4, emissive:0x76bfff, emissiveIntensity:.3});
  const bodyGeo = new THREE.SphereGeometry(1,compact?16:24,compact?10:14); bodyGeo.scale(.75,.29,.32);
  const body = new THREE.Mesh(bodyGeo,skin); root.add(body);
  // Raised pearlescent markings give the creature visible surface detail at normal viewing size.
  const spotMat=new THREE.MeshStandardMaterial({color:0xc7efff,roughness:.62,emissive:0x175885,emissiveIntensity:.18});
  const rows=compact?2:4, columns=compact?8:12;
  const spots=new THREE.InstancedMesh(new THREE.SphereGeometry(.018,6,4),spotMat,rows*columns*2),matrix=new THREE.Matrix4(),pos=new THREE.Vector3(),quat=new THREE.Quaternion(),scale=new THREE.Vector3(1.1,.65,.48);let spotIndex=0;
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){const x=-.52+col*(.99/(columns-1)),y=-.06+row*(.255/(rows-1)),section=Math.max(.05,1-(x*x)/(.75*.75)-(y*y)/(.29*.29)),z=.322*Math.sqrt(section);for(const side of [-1,1]){pos.set(x,y,side*z);matrix.compose(pos,quat,scale);spots.setMatrixAt(spotIndex++,matrix);}}spots.instanceMatrix.needsUpdate=true;body.add(spots);
  const original = bodyGeo.attributes.position.array.slice();
  const underside = new THREE.Mesh(new THREE.SphereGeometry(1,24,12),belly); underside.scale.set(.57,.11,.27); underside.position.set(.08,-.19,0); root.add(underside);
  function fin(points, x,y,z, mat=skin) {
    const shape=new THREE.Shape(); shape.moveTo(...points[0]); points.slice(1).forEach(p=>shape.lineTo(...p)); shape.closePath();
    const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSize:.028,bevelThickness:.025,bevelSegments:2,steps:1}),mat);mesh.position.set(x,y,z);return mesh;
  }
  const tail=new THREE.Group();tail.position.x=-.61;root.add(tail);
  const stem=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),skin);stem.scale.set(.35,.11,.12);stem.position.x=-.14;tail.add(stem);
  for(const side of [-1,1]) {const fluke=fin([[0,0],[-.48,.32],[-.3,.03],[-.42,-.15],[.08,-.08]],-.25,0,0);fluke.rotation.x=side*Math.PI/2;tail.add(fluke);}
  const fins=[];
  for(const side of [-1,1]) {const pivot=new THREE.Group();pivot.position.set(.12,-.08,side*.24);const f=fin([[0,0],[-.2,-.18],[-.55,-.48],[-.48,-.06],[.1,.08]],0,0,0);f.rotation.x=side*.8;pivot.add(f);root.add(pivot);fins.push(pivot);
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.037,12,10),new THREE.MeshPhysicalMaterial({color:0x06142b,roughness:.1,clearcoat:1}));eye.position.set(.51,.05,side*.23);root.add(eye);
    const gleam=new THREE.Mesh(new THREE.SphereGeometry(.012,8,6),new THREE.MeshBasicMaterial({color:0xffffff}));gleam.position.copy(eye.position).add(new THREE.Vector3(.012,.015,side*.025));root.add(gleam);
    for(let i=0;i<(compact?2:4);i++){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(.4-i*.13,-.17,side*.19),new THREE.Vector3(.3-i*.13,-.265,side*.15),new THREE.Vector3(.15-i*.13,-.28,side*.06)]);root.add(new THREE.Mesh(new THREE.TubeGeometry(curve,10,.007,4,false),belly));}
  }
  const dorsal=fin([[0,0],[-.22,.25],[-.33,.03]],-.15,.24,0);root.add(dorsal);
  root.userData.animate=(t)=>{tail.rotation.y=Math.sin(t*3.6)*.48;tail.rotation.z=Math.sin(t*3.6+.4)*.12;fins.forEach((f,i)=>f.rotation.x=Math.sin(t*2.5+i)*.22);const p=bodyGeo.attributes.position;for(let i=0;i<p.count;i++){const x=original[i*3];p.setZ(i,original[i*3+2]+Math.sin(t*3.6+x*4)*.05*Math.max(0,-x));}p.needsUpdate=true;};
  return root;
}

export function createLivingCake(scene,camera,cakeGroup,cakeMat,compact,flashTexture) {
  // Translucent galaxy glaze reveals real moving geometry below its surface.
  cakeMat.transparent=true;cakeMat.opacity=.99;cakeMat.depthWrite=false;
  cakeMat.color.set(0x9ebaff);cakeMat.envMapIntensity=.45;cakeMat.roughness=.58;
  const animals=[];
  for(let i=0;i<(compact?7:11);i++) {const inside=i<(compact?2:4);const k=createKun([0x89e5ff,0xb6a0ff,0xffb4d8,0x77caff,0xffdfac][i%5],inside?.34+(i%2)*.12:.19+(i%3)*.10,compact);if(inside){k.traverse(o=>{if(o.isMesh&&o.material.emissive){o.material=o.material.clone();o.material.emissiveIntensity=3.2;}});}
    k.userData.path={inside,phase:i*2.4,rad:inside?.9+(i%2)*.28:3.15+(i%3)*.6,y:inside?.55+(i%3)*.6:.85+(i%6)*.72,speed:inside?.24:.13+(i%3)*.025};(inside?cakeGroup:scene).add(k);animals.push(k);}
  // Small light beads and stars occupy the lower hemisphere as well as the crown.
  const dustGeo=new THREE.BufferGeometry(),pts=[];for(let i=0;i<650;i++){const a=Math.random()*Math.PI*2,r=2.35+Math.random()*2.1;pts.push(Math.cos(a)*r,.85+Math.random()*3.3,Math.sin(a)*r);}
  dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0x99dcff,size:.024,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(dust);
  const stars=new THREE.Group();scene.add(stars);for(let i=0;i<48;i++){const a=i*2.399,r=2.7+(i%5)*.24;const s=new THREE.Mesh(new THREE.OctahedronGeometry(.025+(i%4)*.013),new THREE.MeshBasicMaterial({color:[0xffde7d,0x9beaff,0xe6a6ff][i%3]}));s.position.set(Math.cos(a)*r,.85+(i%7)*.34,Math.sin(a)*r);stars.add(s);}
  // Camera-mounted, genuinely three-dimensional party cannon tubes.
  scene.add(camera);const cannons=[];
  for(const side of [-1,1]) {const mount=new THREE.Group();camera.add(mount);const tube=new THREE.Group();tube.rotation.z=side*.52;mount.add(tube);
    const gold=new THREE.MeshPhysicalMaterial({color:0xf4be53,metalness:.82,roughness:.22,clearcoat:1,emissive:0x704000,emissiveIntensity:.15});
    const purple=new THREE.MeshPhysicalMaterial({color:0x452e89,metalness:.5,roughness:.24,clearcoat:1,emissive:0x261344,emissiveIntensity:.3});
    const shell=new THREE.Mesh(new THREE.CylinderGeometry(.17,.185,1.25,48,1,true),purple);shell.position.y=.52;tube.add(shell);
    for(const y of [-.08,.08,1.10,1.16]){const band=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.055,48),gold);band.position.y=y;tube.add(band);}
    const bore=new THREE.Mesh(new THREE.CylinderGeometry(.145,.145,.1,32),new THREE.MeshBasicMaterial({color:0x090812}));bore.position.y=1.10;tube.add(bore);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.17,.027,10,48),gold);rim.rotation.x=Math.PI/2;rim.position.y=1.18;tube.add(rim);
    for(let i=0;i<16;i++){const a=i/16*6.283;const rib=new THREE.Mesh(new THREE.BoxGeometry(.014,.22,.018),gold);rib.position.set(Math.sin(a)*.186,-.015,Math.cos(a)*.186);rib.rotation.y=a;tube.add(rib);}
    for(let i=0;i<14;i++){const a=i*2.4;const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.035),gold);gem.position.set(Math.sin(a)*.18,.24+(i%5)*.16,Math.cos(a)*.18);tube.add(gem);}
    const tip=new THREE.Object3D();tip.position.y=1.22;tube.add(tip);const flash=new THREE.Sprite(new THREE.SpriteMaterial({map:flashTexture,color:0xffd38a,opacity:0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));flash.position.y=1.3;flash.scale.setScalar(.9);tube.add(flash);mount.visible=false;cannons.push({mount,tube,tip,flash,side});
  }
  let started=0,fired=0;
  function layout(progress=1){const dist=7,half=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*dist;for(const c of cannons){const travel=1-progress;c.mount.position.set(c.side*(half*camera.aspect*.98+travel*.5),-half+.08-travel*.5,-dist);c.mount.scale.setScalar(.9);}}
  return {animals,cannons,
    start(now){started=now;fired=0;for(const c of cannons)c.mount.visible=true;},
    reset(){started=0;fired=0;cannons.forEach(c=>c.mount.visible=false);},
    fire(now){fired=now;},
    tip(side,w,h){camera.updateMatrixWorld();const c=cannons[side<0?0:1],v=c.tip.getWorldPosition(new THREE.Vector3()).project(camera);return{x:(v.x*.5+.5)*w,y:(-.5*v.y+.5)*h};},
    update(t,now){for(const k of animals){const d=k.userData.path,a=d.phase+t*d.speed;k.position.set(Math.sin(a)*d.rad,d.y+Math.sin(t*.85+d.phase)*.12,Math.cos(a)*d.rad);k.rotation.set(Math.sin(t+d.phase)*.045,a,Math.sin(a)*.06);k.userData.animate(t+d.phase);}dust.rotation.y=t*.025;stars.rotation.y=-t*.06;stars.children.forEach((s,i)=>{s.rotation.x=t+i;s.rotation.z=t*.6;});if(started){const p=Math.min(1,(now-started)/850);layout(1-Math.pow(1-p,3));const recoil=fired?Math.exp(-(now-fired)/180)*Math.sin((now-fired)/55):0;cannons.forEach(c=>{c.tube.position.y=-Math.max(0,recoil)*.13;c.flash.material.opacity=fired?Math.max(0,1-(now-fired)/250)*.85:0;});}},layout
  };
}
