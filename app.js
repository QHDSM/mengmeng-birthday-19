const $=s=>document.querySelector(s), scenes=[...document.querySelectorAll('.scene')];let current=0, collected=new Set(), selected=null;
function go(n){current=Math.max(0,Math.min(scenes.length-1,n));scenes.forEach((s,i)=>{s.classList.toggle('active',i===current);s.inert=i!==current});$('#counter').textContent=String(current+1).padStart(2,'0')+' / 05';$('#progress').style.width=((current+1)*20)+'%';$('#back').style.visibility=current?'visible':'hidden';syncCakeScene();syncSceneVideo();if(current!==4&&!finalSong.paused){finalSong.pause();finalSong.currentTime=0}}
document.querySelectorAll('[data-next]').forEach(b=>b.onclick=()=>go(current+1));$('#back').onclick=()=>go(current-1);$('#restart').onclick=e=>{e.preventDefault();reset();go(0)};$('#again').onclick=()=>{reset();go(0)};
function reset(){pendingCards.forEach(clearTimeout);pendingCards.clear();$('#wish-bursts').replaceChildren();collected.clear();document.querySelectorAll('.card').forEach(c=>{c.classList.remove('collected','opening');c.disabled=false;c.setAttribute('aria-expanded','false')});$('#wish-count').textContent='已收集 0 / 3';$('#wish-instruction').innerHTML='点击卡片，收下三份星际祝福。<br>每收下一份，它就会化作星光。';$('#to-cake').hidden=true;relight()}
// The reference opens the wish in place before a small ring of blessings appears.
const messages=[['愿你自在探索','愿好奇心陪你走过每一段旅程，喜欢的事都能尽兴，想去的地方都能抵达。'],['愿你勇敢出发','愿你有追逐梦想的勇气，也有随时停下来休息的自由。'],['愿你温柔闪耀','愿你被世界温柔以待，也永远相信自己独一无二的光。']];const blessings=[['平安喜乐','日日有光','自在探索'],['心愿成真','勇敢出发','好运常在'],['被爱包围','自由闪耀','岁岁欢愉']],pendingCards=new Set();
function createWishBurst(card,index){const rect=card.getBoundingClientRect(),x=Math.max(90,Math.min(innerWidth-90,rect.right-20)),y=Math.max(85,Math.min(innerHeight-85,rect.bottom-20)),burst=document.createElement('div');burst.className='wish-spark-burst';burst.style.left=x+'px';burst.style.top=y+'px';const ring=document.createElement('i');ring.className='wish-spark-ring';burst.appendChild(ring);for(let j=0;j<10;j++){let ray=document.createElement('i');ray.className='wish-spark-ray';ray.style.setProperty('--ray-angle',(j*36)+'deg');ray.style.setProperty('--ray-delay',(j*22)+'ms');burst.appendChild(ray)}blessings[index].forEach((word,j)=>{let item=document.createElement('span');item.textContent=word;item.style.setProperty('--word-index',j);burst.appendChild(item)});$('#wish-bursts').appendChild(burst);const timer=setTimeout(()=>{burst.remove();pendingCards.delete(timer)},2200);pendingCards.add(timer)}
document.querySelectorAll('.card').forEach(card=>{let index=+card.dataset.card,image=card.querySelector('.card-image'),overlay=document.createElement('span');overlay.className='card-reveal';overlay.textContent=messages[index][1];image.appendChild(overlay);card.setAttribute('aria-expanded','false');card.onclick=()=>{if(card.classList.contains('opening')||collected.has(index))return;card.classList.add('opening');card.setAttribute('aria-expanded','true');card.disabled=true;const burstTimer=setTimeout(()=>{if(current===2)createWishBurst(card,index);pendingCards.delete(burstTimer)},1200);pendingCards.add(burstTimer);const collectTimer=setTimeout(()=>{collected.add(index);card.classList.add('collected');$('#wish-count').textContent=`已收集 ${collected.size} / 3`;if(collected.size===3){$('#wish-instruction').textContent='三份祝福已化作星光，下一站是你的生日惊喜。';$('#to-cake').hidden=false}pendingCards.delete(collectTimer)},2700);pendingCards.add(collectTimer)}});$('#to-cake').onclick=()=>go(3);
// Keep muted background motion in the active scene only.
const sceneVideos = document.querySelectorAll('[data-scene-video]');
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const cakeScene = $('.cake-scene');
const cakeCheer = $('#cake-cheer-video');

function canPlaySceneVideo() {
  return !document.hidden && !reducedMotion?.matches;
}

function syncSceneVideo() {
  const canPlay = canPlaySceneVideo();
  if (current !== 3 || !canPlay) stopCakeCheer();
  for (const video of sceneVideos) {
    if (!canPlay || Number(video.dataset.sceneVideo) !== current) {
      if (!video.paused) video.pause();
    } else if (video.paused) {
      video.play()?.catch(() => {}); // The poster stays visible if playback is blocked.
    }
  }
}

function stopCakeCheer() {
  cakeScene.classList.remove('is-cheering');
  if (!cakeCheer.paused) cakeCheer.pause();
}

async function playCakeCheer() {
  if (!canPlaySceneVideo()) return;
  cakeCheer.currentTime = 0;
  try {
    await cakeCheer.play();
    if (current === 3 && canPlaySceneVideo() && !cakeCheer.paused) {
      cakeScene.classList.add('is-cheering');
    }
  } catch {
    // Keep the idle cake background if the celebration clip cannot start.
  }
}

cakeCheer.addEventListener('ended', stopCakeCheer);
cakeCheer.addEventListener('error', stopCakeCheer);
document.addEventListener('visibilitychange', syncSceneVideo);
reducedMotion?.addEventListener?.('change', syncSceneVideo);
// A tap retries the current background if the browser blocked autoplay.
$('#app').addEventListener('click', syncSceneVideo);
// Finale audio is started by a deliberate visitor gesture; failures remain retryable.
// The continuous blessing loop and the finale song are separate audio sources.
const finalSong=$('#final-song'),songButton=$('#play-final'),songStatus=$('#song-status'),musicControl=$('#music-control'),musicLabel=$('#music-label'),musicSubtitle=$('#music-subtitle');let musicContext=null,musicGain=null,musicTimer=null,musicPlaying=false,musicBusy=false;
function setBackgroundState(state){const playing=state==='playing';musicControl.classList.toggle('is-playing',playing);musicControl.setAttribute('aria-pressed',String(playing));musicControl.setAttribute('aria-label',playing?'暂停祝福音乐':'播放祝福音乐');musicLabel.textContent=playing?'祝福音乐播放中':state==='error'?'点击重试祝福音乐':'播放祝福音乐';musicSubtitle.textContent=playing?'BIRTHDAY LOOP':state==='error'?'AUDIO UNAVAILABLE':'TAP TO START'}
function setFinalState(state){const playing=state==='playing';songButton.textContent=playing?'❚❚ 暂停周杰伦彩蛋':state==='ended'?'♫ 再听一次彩蛋':state==='error'?'♫ 点击重试彩蛋':'♫ 播放周杰伦彩蛋';songButton.setAttribute('aria-pressed',String(playing));songStatus.textContent=state==='error'?'彩蛋加载失败，请检查网络后重试。':playing?'彩蛋播放中':''}
function duckBlessing(){if(!musicContext||!musicGain)return;const target=finalSong.paused?.32:.055;musicGain.gain.cancelScheduledValues(musicContext.currentTime);musicGain.gain.setTargetAtTime(target,musicContext.currentTime,.18)}
function note(ctx,master,freq,start,duration,peak,attack){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(peak,start+attack);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+duration+.03)}
function scheduleBlessing(){if(!musicContext||!musicGain||!musicPlaying)return;const ctx=musicContext,now=ctx.currentTime+.06,chords=[[261.63,329.63,392],[196,246.94,392],[220,261.63,329.63],[174.61,220,349.23]],melody=[523.25,659.25,783.99,659.25,493.88,587.33,783.99,587.33,440,523.25,659.25,523.25,392,523.25,698.46,659.25];chords.forEach((chord,i)=>chord.forEach(f=>note(ctx,musicGain,f/2,now+i*3,3.5,.045,.45)));melody.forEach((f,i)=>{note(ctx,musicGain,f,now+i*.75,1.35,.065,.025);note(ctx,musicGain,f*2,now+i*.75,.65,.015,.02)})}
async function toggleBlessing(){if(musicBusy)return;musicBusy=true;try{if(musicPlaying){musicPlaying=false;clearInterval(musicTimer);musicTimer=null;const old=musicContext;musicContext=null;musicGain=null;setBackgroundState('paused');if(old&&old.state!=='closed')await old.close();return}const AudioEngine=window.AudioContext||window.webkitAudioContext;if(!AudioEngine)throw new Error('Audio unavailable');musicContext=new AudioEngine();musicGain=musicContext.createGain();musicGain.gain.value=finalSong.paused?.32:.055;musicGain.connect(musicContext.destination);if(musicContext.state==='suspended')await musicContext.resume();musicPlaying=true;setBackgroundState('playing');scheduleBlessing();musicTimer=setInterval(scheduleBlessing,12000)}catch(error){musicPlaying=false;if(musicTimer)clearInterval(musicTimer);musicTimer=null;if(musicContext&&musicContext.state!=='closed')musicContext.close().catch(()=>{});musicContext=null;musicGain=null;setBackgroundState('error')}finally{musicBusy=false}}
async function toggleFinale(){if(!finalSong.paused){finalSong.pause();setFinalState('paused');duckBlessing();return}try{if(finalSong.ended)finalSong.currentTime=0;await finalSong.play();setFinalState('playing');duckBlessing()}catch(error){setFinalState('error');duckBlessing()}}musicControl.addEventListener('click',toggleBlessing);songButton.addEventListener('click',toggleFinale);finalSong.addEventListener('play',duckBlessing);finalSong.addEventListener('pause',()=>{if(!finalSong.ended)setFinalState('paused');duckBlessing()});finalSong.addEventListener('ended',()=>{setFinalState('ended');duckBlessing()});finalSong.addEventListener('error',()=>{setFinalState('error');duckBlessing()});
// Use small, cached halos for the stars instead of blurring every particle every frame.
const stars = $('#stars'), sx = stars.getContext('2d');
const life = $('#hero-life'), lc = life.getContext('2d');
const halo = document.createElement('canvas');
halo.width = halo.height = 16;
const hx = halo.getContext('2d');
const haloFill = hx.createRadialGradient(8, 8, 0, 8, 8, 8);
haloFill.addColorStop(0, '#fff7fc');
haloFill.addColorStop(.18, '#f4d9ffb0');
haloFill.addColorStop(1, '#e5d8ff00');
hx.fillStyle = haloFill;
hx.fillRect(0, 0, 16, 16);
let dots, motes, lifeWidth, lifeHeight, lastSkyFrame = 0;
function sizeSky() {
  stars.width = innerWidth;
  stars.height = innerHeight;
  dots = Array.from({length: Math.min(100, Math.floor(innerWidth / 8))}, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight, alpha: .2 + Math.random() * .45
  }));
  lifeWidth = life.width = Math.max(1, life.clientWidth);
  lifeHeight = life.height = Math.max(1, life.clientHeight);
  motes = Array.from({length: 42}, () => ({
    x: Math.random() * lifeWidth, y: Math.random() * lifeHeight, size: 4 + Math.random() * 8,
    speed: .2 + Math.random() * .6, phase: Math.random() * 6
  }));
}
function drawSky(now) {
  requestAnimationFrame(drawSky);
  if (document.hidden || (current !== 0 && current !== 2) || now - lastSkyFrame < 33) return;
  lastSkyFrame = now;
  sx.clearRect(0, 0, stars.width, stars.height);
  sx.fillStyle = '#d9e8ff';
  for (const dot of dots) {
    if ((dot.y -= .15) < 0) dot.y = stars.height;
    sx.globalAlpha = dot.alpha;
    sx.fillRect(dot.x, dot.y, 1, 1);
  }
  if (current !== 0) return;
  lc.clearRect(0, 0, lifeWidth, lifeHeight);
  for (const mote of motes) {
    if ((mote.y -= mote.speed) < 0) {
      mote.y = lifeHeight;
      mote.x = Math.random() * lifeWidth;
    }
    lc.globalAlpha = .12 + .72 * (.5 + .5 * Math.sin(now * .0015 + mote.phase));
    lc.drawImage(halo, mote.x, mote.y, mote.size, mote.size);
  }
}
sizeSky();
window.addEventListener('resize', sizeSky);
requestAnimationFrame(drawSky);

let cakePreviews, cakeModule, cakeSetup, cake, blowAt = 0, fireTimer;
function loadCakeModule() {
  cakeModule ??= import('./cake.js?v=20261109-22').catch(error => {
    cakeModule = undefined;
    console.warn('Cake module unavailable', error);
    return null;
  });
  return cakeModule;
}
function cakeIsVisible() {
  return current === 3 && !document.hidden && !reducedMotion?.matches;
}
async function startCake() {
  const module = await loadCakeModule();
  if (!module || !cakeIsVisible()) {
    cakeSetup = undefined;
    return;
  }
  // Let the poster and the controls paint before starting WebGL.
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  if (!cakeIsVisible()) {
    cakeSetup = undefined;
    return;
  }
  cake = await module.createCake();
  if (!cake) return;
  if (blowAt) cake.blow(blowAt);
  cake.setActive(cakeIsVisible());
}
function syncCakeScene() {
  if (current === 2) {
    cakePreviews ??= ['cake-preview.webp', 'cake-preview-blown.webp'].map(src => {
      const preview = new Image();
      preview.src = src;
      return preview;
    });
    if (!reducedMotion?.matches) loadCakeModule();
  }
  if (cakeIsVisible()) {
    if (cake) cake.setActive(true);
    else cakeSetup ??= startCake();
  } else {
    cake?.setActive(false);
    clearCelebration();
  }
}
document.addEventListener('visibilitychange', syncCakeScene);
reducedMotion?.addEventListener?.('change', syncCakeScene);

// Celebration: two party cannons fire from the lower corners, then a long firework show with confetti.
const celebration=$('#confetti-canvas'),cc=celebration.getContext('2d');
let stream=[],rockets=[],sparks=[],flakes=[],smoke=[],popperFlash=0,showStart=0,launchPlan=[],launchedCount=0,lastDraw=0,celebrationFrame;
const FIRE_COLORS=['#ffd86b','#ff8fb8','#b79bff','#8fe3ff','#fff3c9','#ff6b6b','#8dffb0','#ffb066'];
function sizeCelebration(){const d=1,r=celebration.getBoundingClientRect();celebration.width=Math.max(1,Math.round(r.width*d));celebration.height=Math.max(1,Math.round(r.height*d));cc.setTransform(d,0,0,d,0,0)}
function makeFlake(w,h,initial){return{x:Math.random()*w,y:initial?Math.random()*h*.45:-20-Math.random()*h*.25,vx:(Math.random()-.5)*.9,vy:initial?.7+Math.random()*1.2:.9+Math.random()*1.3,sway:Math.random()*6.283,swaySpeed:.5+Math.random()*1.1,size:3.4+Math.random()*7,rot:Math.random()*6.283,spin:(Math.random()-.5)*.16,shape:Math.random()<.32?'star':(Math.random()<.58?'ribbon':'rect'),color:FIRE_COLORS[(Math.random()*FIRE_COLORS.length)|0]}}
function burst(){sizeCelebration();const w=celebration.clientWidth,h=celebration.clientHeight;stream.length=0;rockets.length=0;sparks.length=0;flakes.length=0;smoke.length=0;showStart=performance.now();cake?.fire(showStart);popperFlash=showStart;lastDraw=0;launchPlan=[];launchedCount=0;for(const side of [-1,1]){const tip=cake?.tip(side,w,h),x=tip?.x??(side<0?w*.1:w*.9),y=tip?.y??h*.93;for(let i=0;i<125;i++){const ang=(side<0?-1.0:-2.14)+(Math.random()-.5)*.75,sp=7+Math.random()*13;stream.push({x,y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,g:.3,age:0,life:70+Math.random()*70,size:3+Math.random()*6,spin:(Math.random()-.5)*.45,angle:Math.random()*6.283,shape:Math.random()<.34?'star':(Math.random()<.55?'ribbon':'rect'),color:FIRE_COLORS[(Math.random()*FIRE_COLORS.length)|0]})}smoke.push({x,y,r:34+Math.random()*18,age:0,life:42})}for(let i=0;i<105;i++)flakes.push(makeFlake(w,h,true));for(let i=0;i<20;i++)launchPlan.push(350+i*700+Math.random()*110);const cx=w*.5,cy=h*.42;for(let i=0;i<50;i++){const a=Math.random()*6.283,sp=.6+Math.random()*3;sparks.push({x:cx,y:cy,px:cx,py:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1.1,g:.02,drag:.97,color:Math.random()<.5?'#fff3c9':'#ffe08a',life:55+Math.random()*35,size:1+Math.random()*1.6,glint:true})}celebrationFrame=requestAnimationFrame(drawCelebration)}
function launchFirework(index,w,h){const side=index%2===0?-1:1;rockets.push({x:side<0?w*.18:w*.82,y:h*.93,fromX:side<0?w*.18:w*.82,fromY:h*.93,targetX:w*(.16+Math.random()*.68),targetY:h*(.1+Math.random()*.26),progress:0,style:index%4,color:FIRE_COLORS[index%FIRE_COLORS.length]})}
function explode(r){if(sparks.length>=420)return;const push=(a,sp,life,color,g,drag,size)=>{sparks.push({x:r.x,y:r.y,px:r.x,py:r.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,g,drag,color,life,size})};const style=r.style;
 if(style===1){for(let ring=0;ring<2;ring++){const n=ring?56:38,sp0=ring?1.2:2.5,life=ring?80:60;for(let i=0;i<n;i++){const a=i/n*Math.PI*2+ring*.4;if(sparks.length>=420)break;push(a,sp0*(.8+Math.random()*.5),life+Math.random()*20,ring?r.color:'#fff3c9',.03,.975,1+Math.random()*1.4)}}
 }else if(style===2){for(let i=0;i<72;i++){if(sparks.length>=420)break;const a=i/72*Math.PI*2+Math.random()*.1;push(a,1.4+Math.random()*2.2,100+Math.random()*45,r.color,.02,.985,1+Math.random()*1.5)}
 }else if(style===3){for(let arm=0;arm<6;arm++){const base=arm/6*Math.PI*2;for(let i=0;i<14;i++){if(sparks.length>=420)break;push(base+(Math.random()-.5)*.16,1.6+Math.random()*2.4,70+Math.random()*30,i===0?'#fff3c9':r.color,.03,.974,1+Math.random()*1.6)}}
 }else{for(let i=0;i<74;i++){if(sparks.length>=420)break;const a=i/74*Math.PI*2+(Math.random()-.5)*.08;push(a,1.3+Math.random()*2.5,60+Math.random()*40,r.color,.03,.975,1+Math.random()*1.8)}}
 for(let i=0;i<14;i++){if(sparks.length>=420)break;push(Math.random()*6.283,3+Math.random()*4,80+Math.random()*35,'#fff6d8',.06,.965,1.2)}}
function drawShape(shape,size,color,alpha){cc.globalAlpha=alpha;cc.fillStyle=color;if(shape==='star'){cc.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?size*.42:size;const px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?cc.lineTo(px,py):cc.moveTo(px,py)}cc.closePath();cc.fill()}else if(shape==='ribbon'){cc.fillRect(-size*.26,-size*1.7,size*.52,size*3.4)}else{cc.fillRect(-size/2,-size/2,size,size)}}
function clearCelebration() {
  clearTimeout(fireTimer);
  if (celebrationFrame === undefined) return;
  cancelAnimationFrame(celebrationFrame);
  celebrationFrame = undefined;
  cc.clearRect(0, 0, celebration.width, celebration.height);
  stream.length = rockets.length = sparks.length = flakes.length = smoke.length = 0;
  showStart = popperFlash = 0;
}
function drawCelebration(now) {
  if (!showStart && !stream.length && !rockets.length && !sparks.length && !flakes.length && !smoke.length) {
    clearCelebration();
    return;
  }
  celebrationFrame = requestAnimationFrame(drawCelebration);
  if (lastDraw && now - lastDraw < 33) return;
  const w = celebration.width, h = celebration.height;
  const dt = Math.min(.2, Math.max(.004, (now - (lastDraw || now - 16)) / 1000));
  lastDraw = now;
 cc.clearRect(0,0,w,h);const f=dt*60;
 if(showStart){const elapsed=now-showStart;while(launchedCount<launchPlan.length&&elapsed>=launchPlan[launchedCount]){launchFirework(launchedCount,w,h);launchedCount++}if(elapsed>15500)showStart=0}
 for(let i=smoke.length-1;i>=0;i--){const s=smoke[i];s.age+=f;const p=s.age/s.life;if(p>=1){smoke.splice(i,1);continue}cc.save();cc.globalAlpha=(1-p)*.4;cc.fillStyle='#dde5f4';cc.beginPath();cc.arc(s.x,s.y,s.r*(.4+p*1.4),0,7);cc.fill();cc.restore()}
 for(let i=rockets.length-1;i>=0;i--){const r=rockets[i],px=r.x,py=r.y;r.progress=Math.min(1,r.progress+dt*1.2);const q=1-Math.pow(1-r.progress,2);r.x=r.fromX+(r.targetX-r.fromX)*q;r.y=r.fromY+(r.targetY-r.fromY)*q;cc.save();cc.globalCompositeOperation='lighter';cc.strokeStyle=r.color;cc.globalAlpha=.9;cc.lineWidth=2;cc.beginPath();cc.moveTo(px,py);cc.lineTo(r.x,r.y);cc.stroke();cc.restore();if(r.progress>=1){explode(r);rockets.splice(i,1)}}
 cc.globalCompositeOperation='lighter';
 for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];p.px=p.x;p.py=p.y;p.x+=p.vx*f;p.y+=p.vy*f;p.vx*=Math.pow(p.drag,f);p.vy=p.vy*Math.pow(p.drag,f)+p.g*f;p.life-=f;cc.save();cc.globalAlpha=Math.min(1,p.life/24)*.9;cc.strokeStyle=p.color;cc.lineWidth=p.size;cc.beginPath();cc.moveTo(p.px,p.py);cc.lineTo(p.x,p.y);cc.stroke();cc.restore();if(p.life<=0)sparks.splice(i,1)}
 cc.globalCompositeOperation='source-over';
 for(let i=stream.length-1;i>=0;i--){const p=stream[i];p.x+=p.vx*f;p.y+=p.vy*f;p.vy+=p.g*f;p.vx*=.998;p.angle+=p.spin*f;p.age+=f;const k=p.age/p.life;cc.save();cc.translate(p.x,p.y);cc.rotate(p.angle);drawShape(p.shape,p.size,p.color,Math.max(0,1-k));cc.restore();if(k>=1||p.y>h+30)stream.splice(i,1)}
 for(let i=flakes.length-1;i>=0;i--){const fl=flakes[i];fl.sway+=fl.swaySpeed*.05*f;fl.x+=fl.vx*f+Math.sin(fl.sway)*1.1*f;fl.y+=fl.vy*f;fl.rot+=fl.spin*f;fl.vy=Math.min(4.4,fl.vy+.014*f);cc.save();cc.translate(fl.x,fl.y);cc.rotate(fl.rot);drawShape(fl.shape,fl.size,fl.color,.92);cc.restore();if(fl.y>h+40){flakes.splice(i,1);if(showStart&&flakes.length<105)flakes.push(makeFlake(w,h,false))}}
}
window.addEventListener('resize', () => { if (celebrationFrame !== undefined) sizeCelebration(); });

function relight() {
  stopCakeCheer();
  clearCelebration();
  cake?.reset();
  blowAt = 0;
  $('.cake-scene').classList.remove('is-blown');
  $('#blow').hidden = false;
  $('#next-final').hidden = true;
  $('#cake-result').textContent = '';
  $('#cake-plaque').style.visibility = '';
}
$('#blow').onclick = () => {
  if (blowAt) return;
  blowAt = performance.now();
  $('.cake-scene').classList.add('is-blown');
  playCakeCheer();
  cake?.blow(blowAt);
  if (!reducedMotion?.matches) fireTimer = setTimeout(burst, 1530);
  $('#blow').hidden = true;
  $('#cake-result').textContent = ($('#cake-plaque').textContent || '萌萌，19岁生日快乐') + ' ✨ 愿你的每个愿望都闪闪发光。';
  $('#next-final').hidden = false;
  $('#cake-plaque').style.visibility = 'hidden';
};
$('#next-final').onclick = () => go(4);
go(0);
