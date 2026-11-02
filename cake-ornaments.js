import { softenMaterial } from './surface-materials.js?v=20261102-9';
import * as THREE from './three.module.js';
export function decorateCake(cake) {
 const white=new THREE.MeshStandardMaterial({color:0xfff6fb,roughness:.36}), pink=new THREE.MeshPhysicalMaterial({color:0xff6b9e,roughness:.3,clearcoat:1}), dark=new THREE.MeshStandardMaterial({color:0x201630,roughness:.4}), gold=new THREE.MeshStandardMaterial({color:0xffcb55,metalness:.45,roughness:.26}), yellow=new THREE.MeshStandardMaterial({color:0xffd35a,roughness:.4});
 softenMaterial(white,'grain',.024);softenMaterial(pink,'grain',.018);
 function ball(parent,mat,x,y,z,sx,sy,sz){const o=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o}
 function kitty(a,y){const g=new THREE.Group();g.position.set(Math.sin(a)*2.02,y,Math.cos(a)*2.02);g.rotation.y=a;cake.add(g);
 ball(g,white,0,0,0,.28,.23,.15);
 for(const side of [-1,1]){const ear=ball(g,white,side*.19,.19,-.005,.105,.14,.09);ear.rotation.z=-side*.38;ball(g,dark,side*.105,.005,.143,.022,.035,.018);
 for(let j=0;j<3;j++){const bar=new THREE.Mesh(new THREE.CapsuleGeometry(.006,.15,3,6),dark);bar.rotation.z=Math.PI/2+side*(j-1)*.17;bar.position.set(side*.235,-.055+(j-1)*.035,.13);g.add(bar)}}
 ball(g,yellow,0,-.05,.154,.032,.022,.015);for(const side of [-1,1]){const b=ball(g,pink,.18+side*.062,.17,.135,.075,.045,.035);b.rotation.z=side*.55}ball(g,pink,.18,.17,.17,.033,.035,.03);return g;}
 [0,2.094,4.188].forEach((a,i)=>kitty(a,.78+(i%2)*.72));
 const colors=[0xffb3d1,0xc6b4ff,0x9ee8ff,0xffdd9a];
 for(let i=0;i<32;i++){const a=i*Math.PI*2/32,r=1.78,mat=new THREE.MeshStandardMaterial({color:colors[i%4],roughness:.34,metalness:.06});const g=new THREE.Group();g.position.set(Math.sin(a)*r,2.81,Math.cos(a)*r);cake.add(g);for(let j=0;j<5;j++){const b=ball(g,mat,Math.cos(j*6.283/5)*.075,.05,Math.sin(j*6.283/5)*.075,.075,.09,.075);b.rotation.z=.18;}ball(g,white,0,.13,0,.055,.065,.055);}
 const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.48:1;i?shape.lineTo(Math.sin(a)*r,Math.cos(a)*r):shape.moveTo(Math.sin(a)*r,Math.cos(a)*r)}shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:true,bevelSize:.07,bevelThickness:.06,bevelSegments:3});
 for(let i=0;i<48;i++){const a=i*2.399,y=.38+(i%7)*.31,r=2.035,mat=i%3===0?gold:i%3===1?pink:white,m=new THREE.Mesh(geo,mat);m.position.set(Math.sin(a)*r,y,Math.cos(a)*r);m.rotation.set(0,a,i*.9);m.scale.setScalar(.055+(i%4)*.018);cake.add(m);}
 for(let i=0;i<14;i++){const a=i*2.399,r=.75+(i%3)*.29;const stem=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.17,8),gold);stem.position.set(Math.sin(a)*r,2.96,Math.cos(a)*r);cake.add(stem);const m=new THREE.Mesh(geo,i%2?gold:pink);m.position.set(Math.sin(a)*r,3.1,Math.cos(a)*r);m.rotation.y=a;m.scale.setScalar(.09);cake.add(m);}
}
