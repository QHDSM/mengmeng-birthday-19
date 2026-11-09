import { softenMaterial } from './surface-materials.js?v=20261102-10';
import * as THREE from './three.module.js';
export function decorateCake(cake, compact) {
 const white=new THREE.MeshStandardMaterial({color:0xfff6fb,roughness:.36}), pink=new THREE.MeshPhysicalMaterial({color:0xff6b9e,roughness:.3,clearcoat:1}), dark=new THREE.MeshStandardMaterial({color:0x201630,roughness:.4}), gold=new THREE.MeshStandardMaterial({color:0xffcb55,metalness:.45,roughness:.26}), yellow=new THREE.MeshStandardMaterial({color:0xffd35a,roughness:.4});
 softenMaterial(white,'grain',.024);softenMaterial(pink,'grain',.018);
 function ball(parent,mat,x,y,z,sx,sy,sz){const o=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o}
 function kitty(a,y){
 const g=new THREE.Group();g.name='kitty-ornament';g.position.set(Math.sin(a)*2.02,y,Math.cos(a)*2.02);g.rotation.y=a;cake.add(g);
 // A softly rounded, wider-than-tall confection with pointed ears.
 ball(g,white,0,0,0,.30,.225,.12);
 const earShape=new THREE.Shape();earShape.moveTo(-.095,0);earShape.quadraticCurveTo(-.09,.07,-.07,.17);earShape.quadraticCurveTo(-.05,.20,-.02,.18);earShape.lineTo(.09,.08);earShape.quadraticCurveTo(.11,.03,.09,0);earShape.closePath();
 const earGeo=new THREE.ExtrudeGeometry(earShape,{depth:.10,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:3,curveSegments:8});
 for(const side of [-1,1]){const ear=new THREE.Mesh(earGeo,white);ear.position.set(side*.19,.12,-.055);ear.scale.x=side;ear.rotation.z=-side*.12;g.add(ear);
 ball(g,dark,side*.115,-.005,.116,.018,.031,.009);
 for(let j=0;j<3;j++){const bar=new THREE.Mesh(new THREE.CapsuleGeometry(.0045,.105,3,6),dark);bar.rotation.z=Math.PI/2+side*(j-1)*.15;bar.position.set(side*.268,-.055+(j-1)*.034,.105);g.add(bar)}}
 ball(g,yellow,0,-.052,.121,.027,.017,.01);
 // Folded pink sugar bow, with distinct knot and two angled loops.
 for(const side of [-1,1]){const loop=ball(g,pink,.19+side*.054,.16,.125,.067,.047,.022);loop.rotation.z=side*.42}
 ball(g,pink,.19,.16,.15,.027,.03,.02);return g;}
 [0,2.094,4.188].forEach((a,i)=>kitty(a,.78+(i%2)*.72));
 // Piped buttercream rosettes: a single ridged, tapering mesh, with a subtle spiral twist.
 const creamColors=[0xfff4ed,0xffe9ed,0xf3eafb,0xfff1e4];
 const creamMats=creamColors.map(color=>{const m=new THREE.MeshPhysicalMaterial({color,roughness:.76,metalness:0,clearcoat:.08,clearcoatRoughness:.7});softenMaterial(m,'grain',.035);return m});
 const positions=[],uv=[],indices=[],rings=compact?8:12,segments=32;
 for(let j=0;j<=rings;j++){const t=j/rings,y=.205*t;const radius=.155*Math.pow(Math.max(0,1-t),.72)*(.83+.17*Math.sin(Math.PI*t));for(let k=0;k<=segments;k++){const a=k/segments*Math.PI*2,groove=1+.14*Math.cos(8*a-3*t);positions.push(Math.cos(a)*radius*groove+.025*t*t,y,Math.sin(a)*radius*groove);uv.push(k/segments,t);}}
 for(let j=0;j<rings;j++)for(let k=0;k<segments;k++){const q=j*(segments+1)+k;indices.push(q,q+segments+1,q+1,q+1,q+segments+1,q+segments+2);}
 const rosette=new THREE.BufferGeometry();rosette.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));rosette.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));rosette.setIndex(indices);rosette.computeVertexNormals();
 for(let i=0;i<30;i++){const a=i*Math.PI*2/30,r=1.77+.012*Math.sin(i*2.4),m=new THREE.Mesh(rosette,creamMats[i%4]);m.name='piped-cream';m.position.set(Math.sin(a)*r,2.805,Math.cos(a)*r);m.rotation.y=a+i*.31;m.scale.set(1+.045*Math.sin(i*3.1),.9+.1*Math.sin(i*2.1),1+.04*Math.cos(i*2.7));cake.add(m);}
 const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.48:1;i?shape.lineTo(Math.sin(a)*r,Math.cos(a)*r):shape.moveTo(Math.sin(a)*r,Math.cos(a)*r)}shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:true,bevelSize:.07,bevelThickness:.06,bevelSegments:3});
 for(let i=0;i<48;i++){const a=i*2.399,y=.38+(i%7)*.31,r=2.035,mat=i%3===0?gold:i%3===1?pink:white,m=new THREE.Mesh(geo,mat);m.position.set(Math.sin(a)*r,y,Math.cos(a)*r);m.rotation.set(0,a,i*.9);m.scale.setScalar(.055+(i%4)*.018);cake.add(m);}
 for(let i=0;i<14;i++){const a=i*2.399,r=.75+(i%3)*.29;const stem=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.17,8),gold);stem.position.set(Math.sin(a)*r,2.96,Math.cos(a)*r);cake.add(stem);const m=new THREE.Mesh(geo,i%2?gold:pink);m.position.set(Math.sin(a)*r,3.1,Math.cos(a)*r);m.rotation.y=a;m.scale.setScalar(.09);cake.add(m);}
}
