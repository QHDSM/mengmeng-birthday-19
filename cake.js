import { softenMaterial, flickerMaterial } from './surface-materials.js?v=20261102-10';
import * as THREE from './three.module.js';
import { decorateCake } from './cake-ornaments.js?v=20261109-22';
import { createLivingCake } from './living-cake.js?v=20261109-22';

const cakeCanvas = document.querySelector('#cake-canvas');
const container = cakeCanvas.parentElement;
const compact = matchMedia('(max-width: 1024px), (pointer: coarse)').matches;
const frameInterval = 1000 / 30;
let renderer, scene, camera, cakeGroup, cakeMat, flame, flameLight, flameOuter, flameInner, particles;
let orbitSparkles = [], bokehSprites = [], plateGlow, flameHalo, smokeTex, smokePuffs = [], livingCake;
let frame, lastFrame, cakeEnterT, slowFrames, usePoster = false, blowStart = 0;
const SPRINKLE=['#ffe14d','#4a9bff','#ff4f8b','#ff3b30','#fff4d6','#b98bff','#6dffa2','#ffa947','#4fe6ff','#ffd36e'];const CANDY=['#ffd21f','#2f7dff','#ff3d7f','#ff2d2d','#a45bff','#22d67a','#ff8a1f','#25d4ff'];
function makeRng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function makeGlowTexture(star=true){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,'rgba(255,255,255,.92)');g.addColorStop(.42,'rgba(255,255,255,.16)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);if(star){x.save();x.translate(64,64);x.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?20:56;i?x.lineTo(Math.cos(a)*r,Math.sin(a)*r):x.moveTo(Math.cos(a)*r,Math.sin(a)*r)}x.closePath();x.shadowColor='rgba(255,255,255,.9)';x.shadowBlur=14;x.fillStyle='#fff';x.fill();x.fill();x.restore()}return new THREE.CanvasTexture(c)}
function makeSoftTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.35,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}
function sprinklePath(x,px,py,r,rot){x.beginPath();for(let i=0;i<10;i++){const a=rot+i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;const fx=px+Math.cos(a)*rr,fy=py+Math.sin(a)*rr;i?x.lineTo(fx,fy):x.moveTo(fx,fy)}x.closePath()}
function poolFill(x,w,h,cx,cy,r,stops){const g=x.createRadialGradient(cx,cy,0,cx,cy,r);for(const s of stops)g.addColorStop(s[0],s[1]);x.fillStyle=g;x.fillRect(0,0,w,h)}
// Night-sky glaze on the cake side: blue pools near the base, rainbow star stickers, hand-lettered greeting.
function drawCakeSide(canvas){const W=2048,H=1024,x=canvas.getContext('2d'),rand=makeRng(3112);x.clearRect(0,0,canvas.width,canvas.height);x.save();x.scale(canvas.width/W,canvas.height/H);x.fillStyle='#070811';x.fillRect(0,0,W,H);const lg=x.createLinearGradient(0,0,0,H);lg.addColorStop(0,'#0d1025');lg.addColorStop(.45,'#080a19');lg.addColorStop(1,'#04050e');x.fillStyle=lg;x.fillRect(0,0,W,H);
poolFill(x,W,H,W*.30,H*1.02,H*.95,[[0,'rgba(40,108,235,.8)'],[.42,'rgba(22,62,196,.4)'],[1,'rgba(8,18,70,0)']]);
poolFill(x,W,H,W*.64,H*1.06,H*1.0,[[0,'rgba(44,196,245,.55)'],[.5,'rgba(14,104,196,.28)'],[1,'rgba(4,18,58,0)']]);
poolFill(x,W,H,W*.85,H*.88,H*.68,[[0,'rgba(92,68,240,.4)'],[1,'rgba(0,0,0,0)']]);
poolFill(x,W,H,W*.12,H*.78,H*.55,[[0,'rgba(156,54,192,.34)'],[1,'rgba(0,0,0,0)']]);
poolFill(x,W,H,W*.52,H*.04,H*.5,[[0,'rgba(255,196,120,.24)'],[1,'rgba(0,0,0,0)']]);
for(let i=0;i<30;i++){const px=rand()*W,py=H*(.005+rand()*.2),r=4+rand()*20,rot=rand()*6.283,col=SPRINKLE[(rand()*SPRINKLE.length)|0];x.save();x.globalAlpha=.45+rand()*.5;x.fillStyle=col;x.shadowColor=col;x.shadowBlur=6;sprinklePath(x,px,py,r,rot);x.fill();x.restore()}
for(let i=0;i<32;i++){const px=rand()*W,py=H*(.06+rand()*.93),r=7+Math.pow(rand(),2.4)*56,rot=rand()*6.283,col=SPRINKLE[(rand()*SPRINKLE.length)|0];x.save();x.globalAlpha=.55+rand()*.35;x.fillStyle=col;x.shadowColor=col;x.shadowBlur=7;sprinklePath(x,px,py,r,rot);x.fill();x.restore()}
for(let i=0;i<45;i++){const px=rand()*W,py=rand()*H,r=3+rand()*11,rot=rand()*6.283,col=SPRINKLE[(rand()*SPRINKLE.length)|0];x.save();x.globalAlpha=.4+rand()*.45;x.fillStyle=col;x.shadowColor=col;x.shadowBlur=4;sprinklePath(x,px,py,r,rot);x.fill();x.restore()}for(let i=0;i<360;i++){const px=rand()*W,py=rand()*H,r=1.4+rand()*8;x.globalAlpha=.3+rand()*.6;x.fillStyle=SPRINKLE[(rand()*SPRINKLE.length)|0];x.beginPath();x.arc(px,py,r,0,7);x.fill()}
for(let i=0;i<760;i++){x.globalAlpha=.14+rand()*.55;x.fillStyle='#edf2ff';x.beginPath();x.arc(rand()*W,rand()*H,rand()*1.7,0,7);x.fill()}

x.globalAlpha=1;x.save();x.translate(900,430);x.rotate(-.04);x.textAlign='center';x.textBaseline='middle';x.font='400 42px Pacifico, "Segoe Script", "Comic Sans MS", cursive';x.shadowColor='rgba(0,0,0,.6)';x.shadowBlur=6;x.fillStyle='#f7efdd';x.fillText('happy birthday',0,0);x.font='600 24px "Noto Sans SC", "Microsoft YaHei", sans-serif';x.fillStyle='#efe4cd';x.shadowBlur=5;x.fillText('19 岁 · 生日快乐',0,38);x.restore();x.restore()}
function makeSideTexture(){const c=document.createElement('canvas');c.width=1024;c.height=512;drawCakeSide(c);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.RepeatWrapping;t.offset.x=.5;t.anisotropy=4;return{c,tex:t}}
// Glossy top: a heap of rainbow sprinkles over dark glaze, lit warm from the candle.
function makeTopTextures(){const S=512,map=document.createElement('canvas'),emi=document.createElement('canvas');map.width=map.height=emi.width=emi.height=S;const x=map.getContext('2d'),e=emi.getContext('2d'),rand=makeRng(7719);x.fillStyle='#090b17';x.fillRect(0,0,S,S);poolFill(x,S,S,S*.5,S*.5,S*.64,[[0,'rgba(255,206,132,.2)'],[.5,'rgba(122,82,190,.16)'],[1,'rgba(10,12,30,0)']]);poolFill(x,S,S,S*.26,S*.9,S*.5,[[0,'rgba(56,120,255,.55)'],[1,'rgba(0,0,0,0)']]);e.fillStyle='#000';e.fillRect(0,0,S,S);poolFill(e,S,S,S*.5,S*.5,S*.52,[[0,'rgba(255,232,186,.5)'],[.55,'rgba(255,180,90,.14)'],[1,'rgba(0,0,0,0)']]);for(let i=0;i<80;i++){const px=rand()*S,py=rand()*S,r=3.5+Math.pow(rand(),1.5)*15,rot=rand()*6.283,col=SPRINKLE[(rand()*SPRINKLE.length)|0];for(const ctx of [x,e]){ctx.save();ctx.globalAlpha=ctx===x?.85+rand()*.15:.5+rand()*.45;ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=9;sprinklePath(ctx,px,py,r,rot);ctx.fill();ctx.restore()}}for(let i=0;i<260;i++){const px=rand()*S,py=rand()*S,r=1.6+rand()*7,col=SPRINKLE[(rand()*SPRINKLE.length)|0];for(const ctx of [x,e]){ctx.globalAlpha=ctx===x?.4+rand()*.55:.25+rand()*.5;ctx.fillStyle=col;ctx.beginPath();ctx.arc(px,py,r,0,7);ctx.fill()}}x.globalAlpha=1;e.globalAlpha=1;const m=new THREE.CanvasTexture(map);m.colorSpace=THREE.SRGBColorSpace;const em=new THREE.CanvasTexture(emi);em.colorSpace=THREE.SRGBColorSpace;return{map:m,emi:em}}
// Studio-like environment so the clearcoated glaze picks up colourful streaks instead of flat black.
function makeEnvironment(){const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');x.scale(.25,.25);x.fillStyle='#04050b';x.fillRect(0,0,1024,512);
poolFill(x,1024,512,340,92,320,[[0,'rgba(255,246,228,.9)'],[.4,'rgba(255,222,176,.28)'],[1,'rgba(0,0,0,0)']]);
poolFill(x,1024,512,790,120,270,[[0,'rgba(198,224,255,.75)'],[1,'rgba(0,0,0,0)']]);
poolFill(x,1024,512,150,330,320,[[0,'rgba(52,112,255,.6)'],[1,'rgba(0,0,0,0)']]);
poolFill(x,1024,512,780,392,290,[[0,'rgba(178,72,255,.5)'],[1,'rgba(0,0,0,0)']]);
poolFill(x,1024,512,1000,300,240,[[0,'rgba(64,226,255,.42)'],[1,'rgba(0,0,0,0)']]);
const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.colorSpace=THREE.SRGBColorSpace;return t}
async function initCake() {
renderer=new THREE.WebGLRenderer({canvas:cakeCanvas,antialias:!compact,alpha:true,failIfMajorPerformanceCaveat:true});
const gl = renderer.getContext();
const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
// Some browsers expose a software renderer even when the performance flag is set.
if (debugInfo && /swiftshader|llvmpipe|software rasterizer|microsoft basic render driver/i.test(
  gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
)) {
  renderer.dispose();
  return false;
}
await new Promise(resolve => setTimeout(resolve, 0));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
scene=new THREE.Scene();
camera=new THREE.PerspectiveCamera(35,1,.1,120);
camera.position.set(0,6.9,12.8);
camera.lookAt(0,2.0,0);
if (!compact) {
  const envTex = makeEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(envTex).texture;
  pmrem.dispose();
  envTex.dispose();
  await new Promise(resolve => setTimeout(resolve, 0));
}
scene.add(new THREE.AmbientLight(0x93a8ff,compact?.78:.55));
for(const [color,power,pos]of [[0xffe2b4,26,[-3.2,7.2,5]],[0x3d7dff,55,[4.6,1.3,-1.4]],[0x3fe0ff,38,[-4.2,.9,2.4]],[0xffb9ef,30,[2.6,4.6,-4.2]]]){const l=new THREE.PointLight(color,power,34);l.position.set(...pos);scene.add(l)}
cakeGroup=new THREE.Group();cakeGroup.name='globe-cake';scene.add(cakeGroup);
const finish = (material, coating) => compact
  ? new THREE.MeshStandardMaterial(material)
  : new THREE.MeshPhysicalMaterial({...material, ...coating});
const phys=(color,roughness=.24,metalness=.06)=>finish({color,roughness,metalness,envMapIntensity:1.15},{clearcoat:1,clearcoatRoughness:.12});
function add(g,m,x,y,z,parent=cakeGroup){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o}
const glow=makeGlowTexture(),soft=makeSoftTexture();
// Luminous white tray under the cake.
const plateMat=new THREE.MeshStandardMaterial({color:0xf8faff,roughness:.2,metalness:.04,emissive:0xcfe0ff,emissiveIntensity:.62,envMapIntensity:1.15});
add(new THREE.CylinderGeometry(2.72,2.66,.06,128),plateMat,0,.033,0);
const rimGlow=add(new THREE.TorusGeometry(2.68,.03,8,150),new THREE.MeshBasicMaterial({color:0xeef6ff,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false}),0,.12,0);rimGlow.rotation.x=Math.PI/2;
plateGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:soft,color:0xc6dcff,transparent:true,opacity:.32,blending:THREE.AdditiveBlending,depthWrite:false}));
plateGlow.position.set(0,.08,0);plateGlow.scale.set(11.5,3.2,1);scene.add(plateGlow);
// Cake body: one wide tier of galaxy glaze with rainbow star decals.
const side=makeSideTexture();
const tops=makeTopTextures();
cakeMat=finish({color:0xffffff,map:side.tex,roughness:.24,metalness:.05,envMapIntensity:.85},{clearcoat:1,clearcoatRoughness:.06});
const topMat=finish({color:0xffffff,map:tops.map,emissive:0xffffff,emissiveMap:tops.emi,emissiveIntensity:.012,roughness:.55,metalness:.02,envMapIntensity:.55},{clearcoat:.55,clearcoatRoughness:.14});
const glazeMat=finish({color:0x080a16,roughness:.55,metalness:.14,envMapIntensity:1.15},{clearcoat:1,clearcoatRoughness:.04,iridescence:.72,iridescenceIOR:1.5,iridescenceThicknessRange:[120,760]});
if (!compact) { softenMaterial(cakeMat,'grain',.085);softenMaterial(topMat,'grain',.12);softenMaterial(glazeMat,'grain',.018); }
const body=add(new THREE.CylinderGeometry(1.95,1.98,2.62,128,1),[cakeMat,topMat,cakeMat],0,1.46,0);body.name='globe-cake-body';
const mound=add(new THREE.SphereGeometry(1.9,64,24,0,6.283,0,Math.PI/2),topMat,0,2.77,0);mound.scale.set(1,.06,1);
// Scalloped glaze rim that drips over the top edge.
const verts=[],indices=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2,low=2.77-.055-.13*Math.pow(.5+.5*Math.sin(a*13+.7),3)-.05*Math.pow(.5+.5*Math.sin(a*7),6);verts.push(Math.sin(a)*1.96,2.77,Math.cos(a)*1.96,Math.sin(a)*1.985,low,Math.cos(a)*1.985);if(i<160){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2)}}const drip=new THREE.BufferGeometry();drip.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));drip.setIndex(indices);drip.computeVertexNormals();add(drip,glazeMat,0,0,0);const topRim=add(new THREE.TorusGeometry(1.965,.045,10,160),glazeMat,0,2.76,0);topRim.rotation.x=Math.PI/2;
// Flat sprinkle bed: stars, hearts, rods and discs all lie flat on the icing.
const starShape=new THREE.Shape();for(let j=0;j<10;j++){const a=j*Math.PI/5-Math.PI/2,r=j%2?.56:1;j?starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r):starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r)}starShape.closePath();
const starGeo=new THREE.ExtrudeGeometry(starShape,{depth:.05,bevelEnabled:true,bevelThickness:.015,bevelSize:.035,bevelSegments:2});
const heartShape=(()=>{const sh=new THREE.Shape();sh.moveTo(0,-.55);sh.bezierCurveTo(-.95,-.02,-.74,.74,-.05,.46);sh.bezierCurveTo(.52,.74,.95,-.02,0,-.55);return sh})();
const heartGeo=new THREE.ExtrudeGeometry(heartShape,{depth:.05,bevelEnabled:true,bevelThickness:.015,bevelSize:.03,bevelSegments:2});
const rodGeo=new THREE.CylinderGeometry(.017,.017,.17,6),discGeo=new THREE.CylinderGeometry(.036,.036,.012,10);
const heapMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.7,metalness:0});
const m4=new THREE.Matrix4(),qq=new THREE.Quaternion(),qYaw=new THREE.Quaternion(),qFix=new THREE.Quaternion(),sv=new THREE.Vector3(),pv=new THREE.Vector3(),axisY=new THREE.Vector3(0,1,0),axisX=new THREE.Vector3(1,0,0),axisZ=new THREE.Vector3(0,0,1);
const heapRand=makeRng(4242),surfY=rr=>2.77+.1*(1-Math.pow(Math.min(1,rr/1.92),2));
function addSprinkles(geo,count,mode,unit){const mesh=new THREE.InstancedMesh(geo,heapMat,count);for(let i=0;i<count;i++){const a=heapRand()*6.283,rr=Math.sqrt(heapRand())*1.82,y=surfY(rr)+.01+heapRand()*.014;pv.set(Math.cos(a)*rr,y,Math.sin(a)*rr);qYaw.setFromAxisAngle(axisY,heapRand()*6.283);if(mode==='rod')qFix.setFromAxisAngle(axisZ,Math.PI/2+(heapRand()-.5)*.08);else if(mode==='disc')qFix.setFromAxisAngle(axisX,(heapRand()-.5)*.06);else qFix.setFromAxisAngle(axisX,-Math.PI/2);qq.copy(qYaw).multiply(qFix);const sc=(mode==='rod'||mode==='disc')?.9+heapRand()*.3:unit*(.7+heapRand()*.7);sv.set(sc,sc,sc);m4.compose(pv,qq,sv);mesh.setMatrixAt(i,m4);mesh.setColorAt(i,new THREE.Color(CANDY[i%CANDY.length]).multiplyScalar(.95))}mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;cakeGroup.add(mesh);return mesh}
const heap=addSprinkles(starGeo,65,'star',.095),hearts=addSprinkles(heartGeo,70,'heart',.085),rods=addSprinkles(rodGeo,105,'rod'),discs=addSprinkles(discGeo,65,'disc');
const beads=new THREE.InstancedMesh(new THREE.SphereGeometry(.02,8,6),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),240);for(let i=0;i<240;i++){const a=heapRand()*6.283,rr=Math.sqrt(heapRand())*1.84,y=surfY(rr)+.016+heapRand()*.025;pv.set(Math.cos(a)*rr,y,Math.sin(a)*rr);qq.setFromEuler(new THREE.Euler(heapRand()*6.283,heapRand()*6.283,0));const sc=.9+heapRand()*1.3;sv.set(sc,sc,sc);m4.compose(pv,qq,sv);beads.setMatrixAt(i,m4);beads.setColorAt(i,new THREE.Color(CANDY[(heapRand()*CANDY.length)|0]).multiplyScalar(1.05))}beads.instanceMatrix.needsUpdate=true;beads.instanceColor.needsUpdate=true;cakeGroup.add(beads);
decorateCake(cakeGroup, compact);
const waxProfile=[new THREE.Vector2(0,0),new THREE.Vector2(.11,0),new THREE.Vector2(.115,.08),new THREE.Vector2(.112,.58),new THREE.Vector2(.10,.74),new THREE.Vector2(.075,.77),new THREE.Vector2(0,.755)];const candle=add(new THREE.LatheGeometry(waxProfile,48),phys(0xffd991,.48,.02),0,2.84,0);candle.name='gold-candle';if (!compact) softenMaterial(candle.material,'grain',.065);
// Uneven raised wax trails and a recessed wax pool make the candle visibly sculpted.
const waxRidgeMat=new THREE.MeshStandardMaterial({color:0xffe3b4,roughness:.72});
for(let i=0;i<7;i++){const a=i*2.399,y=3.49-(i%3)*.06,length=.12+(i%3)*.055;const ridge=add(new THREE.CapsuleGeometry(.014,length,4,8),waxRidgeMat,Math.sin(a)*.109,y-length*.38,Math.cos(a)*.109);ridge.rotation.z=Math.sin(a)*.06;}
const melt=add(new THREE.TorusGeometry(.065,.014,10,32),waxRidgeMat,0,3.59,0);melt.rotation.x=Math.PI/2;
for(let i=0;i<4;i++){const a=i*1.7;const drip=add(new THREE.SphereGeometry(1,16,10),phys(0xffdfaa,.4,.02),Math.sin(a)*.105,3.53-(i%3)*.045,Math.cos(a)*.105);drip.scale.set(.024,.07+(i%2)*.035,.024);}
add(new THREE.CylinderGeometry(.009,.009,.06,6),new THREE.MeshBasicMaterial({color:0x2a1a10}),0,3.65,0);
flame=new THREE.Group();flame.position.set(0,3.63,0);cakeGroup.add(flame);
const profile=[new THREE.Vector2(0,0),new THREE.Vector2(.04,.06),new THREE.Vector2(.095,.17),new THREE.Vector2(.16,.25),new THREE.Vector2(.13,.43),new THREE.Vector2(.055,.65),new THREE.Vector2(0,.83)];
flameOuter=add(new THREE.LatheGeometry(profile,28),new THREE.MeshBasicMaterial({color:0xff7d20,transparent:true,opacity:.68,blending:THREE.AdditiveBlending,depthWrite:false}),0,0,0,flame);
flameInner=add(new THREE.LatheGeometry(profile,20),new THREE.MeshBasicMaterial({color:0xfff1bf,transparent:true,opacity:.94}),0,0,.015,flame);flameInner.scale.set(.5,.7,.5);
flickerMaterial(flameOuter.material);flickerMaterial(flameInner.material);
const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:soft,color:0xffc45e,transparent:true,opacity:.32,blending:THREE.AdditiveBlending,depthWrite:false}));halo.position.y=.4;halo.scale.set(1.45,1.8,1);flame.add(halo);flameHalo=halo;smokeTex=soft;
flameLight=new THREE.PointLight(0xffd07a,20,8);flameLight.position.y=4.08;cakeGroup.add(flameLight);
// No glass globe: mixed candy and koi/whales swim around the cake.
function shapeTex(painter){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.translate(64,64);x.fillStyle='#fff';x.strokeStyle='#fff';x.shadowColor='#fff';x.shadowBlur=5;painter(x);return new THREE.CanvasTexture(c)}
const texDot=shapeTex(x=>{const g=x.createRadialGradient(0,0,0,0,0,56);g.addColorStop(0,'#fff');g.addColorStop(.66,'#fff');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,54,0,7);x.fill()});
const texHeart=shapeTex(x=>{x.beginPath();x.moveTo(0,40);x.bezierCurveTo(-60,0,-46,-48,-4,-30);x.bezierCurveTo(40,-48,56,4,0,40);x.closePath();x.fill()});
const texMoon=shapeTex(x=>{x.beginPath();x.arc(0,0,46,0,7);x.fill();x.globalCompositeOperation='destination-out';x.beginPath();x.arc(17,-10,40,0,7);x.fill();x.globalCompositeOperation='source-over'});
const texFlower=shapeTex(x=>{for(let i=0;i<5;i++){const a=i*Math.PI*2/5;x.beginPath();x.ellipse(Math.cos(a)*26,Math.sin(a)*26,20,14,a,0,7);x.fill()}x.beginPath();x.arc(0,0,13,0,7);x.fill()});
const starSprinkle=makeGlowTexture(true);
const FLOAT_TEX=[starSprinkle,texDot,texHeart,texMoon,texFlower],FLOAT_COL=['#ffe14d','#8fe8ff','#ff7fb8','#b79bff','#8dffb0','#ffd7a1','#fff3c9'];
orbitSparkles=[];
for(let i=0;i<(compact?78:130);i++){let px=0,py=0,pz=0;for(let k=0;k<40;k++){const dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const d=Math.hypot(dx,dy,dz)||1,dist=2.6+Math.random()*1.0;px=dx/d*dist;py=1.5+dy/d*dist;pz=dz/d*dist;if(!(Math.hypot(px,pz)<2.05&&py>.2&&py<3.0))break}
py=Math.max(.85,py);const rad=Math.hypot(px,pz),a0=Math.atan2(px,pz),col=new THREE.Color(FLOAT_COL[i%FLOAT_COL.length]);
const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:FLOAT_TEX[i%FLOAT_TEX.length],color:col,toneMapped:false,transparent:true,opacity:.72,blending:THREE.NormalBlending,depthWrite:false}));
const size=i%12===0?.3:.09+Math.random()*.2;sp.scale.set(size,size,1);sp.position.set(px,py,pz);sp.userData={a0,rad,y:py,spd:.05+Math.random()*.12,seed:Math.random()*6.283};scene.add(sp);orbitSparkles.push(sp)}
bokehSprites=[];for(let i=0;i<(compact?10:18);i++){const a=Math.random()*6.283,r=3.15+Math.random()*2.3,y=.3+Math.random()*4.4,base=.1+Math.random()*.16;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:soft,color:new THREE.Color(FLOAT_COL[i%FLOAT_COL.length]).lerp(new THREE.Color(0xffffff),.25),transparent:true,opacity:base,blending:THREE.AdditiveBlending,depthWrite:false}));const sc=.3+Math.random()*.7;sp.scale.set(sc,sc,1);sp.position.set(Math.cos(a)*r,y,Math.sin(a)*r);sp.userData={y,base,seed:Math.random()*6.283};scene.add(sp);bokehSprites.push(sp)}
particles=new THREE.Group();scene.add(particles);for(let layer=0;layer<2;layer++){const ps=[],cs=[],count=layer===0?260:120;for(let i=0;i<count;i++){const dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const d=Math.hypot(dx,dy,dz)||1,dist=1.9+Math.random()*.75,px=dx/d*dist,py=Math.max(.85,2.3+dy/d*dist),pz=dz/d*dist;ps.push(px,py,pz);const c=new THREE.Color(FLOAT_COL[i%FLOAT_COL.length]);cs.push(c.r,c.g,c.b)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cs,3));particles.add(new THREE.Points(g,new THREE.PointsMaterial({map:glow,size:layer?.07:.04,vertexColors:true,transparent:true,opacity:layer?.5:.7,blending:THREE.AdditiveBlending,depthWrite:false})))}
livingCake=createLivingCake(scene,camera,cakeGroup,cakeMat,compact,soft);
resizeCake();
await new Promise(resolve => setTimeout(resolve, 0));
if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(scene, camera);
else renderer.compile(scene, camera);
return true;
}

function resizeCake() {
  const w = cakeCanvas.clientWidth, h = cakeCanvas.clientHeight;
  if (!w || !h) return;
  const pixelBudget = compact ? 300000 : 700000;
  const ratio = Math.min(devicePixelRatio || 1, compact ? 1 : 1.5, Math.sqrt(pixelBudget / (w * h)));
  renderer.setDrawingBufferSize(w, h, ratio);
  camera.aspect = w / h;
  const portrait = w / h < .8;
  camera.position.set(0, portrait ? 7.4 : 6.8, portrait ? 19.9 : 12.2);
  camera.lookAt(0, portrait ? 2.35 : 2.2, 0);
  camera.updateProjectionMatrix();
  livingCake.layout();
}
function spawnPoof(){if(!cakeGroup||!smokeTex)return;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTex,color:0xf4f7ff,transparent:true,opacity:.55,blending:THREE.NormalBlending,depthWrite:false}));s.position.set(0,3.55,0);s.scale.setScalar(.3);s.userData={poof:true,vx:0,vy:.25,vz:0,age:0,life:.55,size:.3,base:.55};cakeGroup.add(s);smokePuffs.push(s)}function spawnSmoke(){if(!cakeGroup||!smokeTex)return;const a=Math.random()*6.283,s=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTex,color:0xcfd6e8,transparent:true,opacity:.42,blending:THREE.NormalBlending,depthWrite:false}));s.position.set(Math.cos(a)*.05,3.55+Math.random()*.1,Math.sin(a)*.05);const size=.2+Math.random()*.14;s.scale.setScalar(size);s.userData={vx:Math.cos(a)*.06,vy:.32+Math.random()*.38,vz:Math.sin(a)*.06,age:0,life:1.9+Math.random()*.9,size,base:.58+Math.random()*.22};cakeGroup.add(s);smokePuffs.push(s)}
function drawCake(now) {
  frame = requestAnimationFrame(drawCake);
  if (lastFrame && now - lastFrame < frameInterval - 1) return;
  const gap = lastFrame ? now - lastFrame : 0;
  if (gap > 95) slowFrames += gap > 180 ? 3 : 1;
  else slowFrames = 0;
  if (slowFrames >= 5) {
    usePoster = true;
    setActive(false);
    return;
  }
  const t = now / 1000, dt = Math.min(.05, gap / 1000);
  lastFrame = now;
  cakeEnterT ??= t;
  if(flameOuter?.material.userData.flameTime)flameOuter.material.userData.flameTime.value=t;if(flameInner?.material.userData.flameTime)flameInner.material.userData.flameTime.value=t;livingCake?.update(t,now);cakeGroup.rotation.y=-.45+(t-cakeEnterT)*.055;orbitSparkles.forEach(s=>{const d=s.userData,a=d.a0+t*d.spd;s.position.set(Math.sin(a)*d.rad,d.y+Math.sin(t*.9+d.seed)*.05,Math.cos(a)*d.rad);s.material.opacity=.4+.5*(.5+.5*Math.sin(t*2.2+d.seed))});
  bokehSprites.forEach(s=>{const d=s.userData;s.position.y=d.y+Math.sin(t*.35+d.seed)*.14;s.material.opacity=d.base*(.7+.3*Math.sin(t*.7+d.seed))});
  particles.rotation.y=-t*.035;particles.children.forEach((layer,i)=>{layer.rotation.y=t*(.012+i*.012);layer.position.y=Math.sin(t*.32+i)*.1});
  if(flame){if(blowStart){const p=Math.min(1,(now-blowStart)/1700),f=1-p,flick=.55+.45*Math.sin(t*38)*Math.sin(p*Math.PI);flameOuter.material.opacity=.68*f*(.6+.4*flick);flameInner.material.opacity=.94*f;if(flameHalo)flameHalo.material.opacity=.32*f;flameLight.intensity=20*f;flameOuter.scale.set(1.14*(1-.3*p),1-.4*p,1.14*(1-.3*p));if(p>.24&&p<.96&&Math.random()<.45)spawnSmoke();if(p>=1){flame.visible=false;blowStart=0}}else if(flame.visible){flameOuter.scale.set(1.14+Math.sin(t*8)*.04,1+Math.sin(t*11)*.04,1.14);flameInner.scale.y=.7+Math.sin(t*10)*.025;flame.rotation.z=Math.sin(t*3.8)*.06+Math.sin(t*9)*.025;flame.rotation.x=Math.sin(t*5)*.035;flameLight.intensity=20+Math.sin(t*11)*3}}for(let i=smokePuffs.length-1;i>=0;i--){const s=smokePuffs[i],d=s.userData;d.age+=dt;s.position.x+=d.vx*dt;s.position.y+=d.vy*dt;s.position.z+=d.vz*dt;d.vy*=.985;const k=d.age/d.life;s.scale.setScalar(d.poof?(.3+k*2.8):d.size*(1+k*2.4));s.material.opacity=d.base*(1-k);if(k>=1){cakeGroup.remove(s);s.material.dispose();smokePuffs.splice(i,1)}}if(plateGlow)plateGlow.material.opacity=.32+.07*Math.sin(t*1.4);
  renderer.render(scene, camera);
  if (gap && gap <= 95) container.classList.add('has-live-cake');
}

function setActive(active) {
  if (!active || usePoster) {
    cancelAnimationFrame(frame);
    frame = undefined;
    container.classList.remove('has-live-cake');
    return;
  }
  if (frame !== undefined) return;
  resizeCake();
  lastFrame = 0;
  slowFrames = 0;
  cakeEnterT = undefined;
  frame = requestAnimationFrame(drawCake);
}

function resetCake() {
  blowStart = 0;
  livingCake.reset();
  flame.visible = true;
  flameOuter.material.opacity = .68;
  flameInner.material.opacity = .94;
  flameHalo.material.opacity = .32;
  flameOuter.scale.set(1, 1, 1);
  flameLight.intensity = 20;
  for (const puff of smokePuffs) {
    cakeGroup.remove(puff);
    puff.material.dispose();
  }
  smokePuffs.length = 0;
}

export async function createCake() {
  try {
    if (!await initCake()) return null;
    window.addEventListener('resize', () => { if (frame !== undefined) resizeCake(); });
    cakeCanvas.addEventListener('webglcontextlost', () => {
      usePoster = true;
      setActive(false);
    });
    return {
      setActive,
      reset: resetCake,
      blow(now) {
        if (usePoster) return;
        blowStart = now;
        livingCake.start(now);
        spawnPoof();
      },
      fire(now) { if (!usePoster) livingCake.fire(now); },
      tip(side, w, h) { if (!usePoster) return livingCake.tip(side, w, h); }
    };
  } catch (error) {
    renderer?.dispose();
    console.warn('3D cake unavailable', error);
    return null;
  }
}
