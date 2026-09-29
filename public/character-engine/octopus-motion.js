/* Octo has its own soft-body performance rig. Live audio/tools still use the
   common CharacterPort contract; only mouth geometry is shared with other rigs. */
(function(host){
 'use strict';
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),f=n=>+n.toFixed(3),lerp=(a,b,t)=>a+(b-a)*t;
 const faces={
  neutral:{openL:1,openR:1,gazeX:0,gazeY:0,browL:0,browR:0,brows:0,smile:.6,lean:0},
  happy:{openL:.95,openR:1,gazeX:0,gazeY:0,browL:-5,browR:5,brows:0,smile:.85,lean:-1},
  sad:{openL:.65,openR:.72,gazeX:0,gazeY:5,browL:-22,browR:22,brows:.8,smile:-.7,lean:4},
  crying:{openL:.12,openR:.12,gazeX:0,gazeY:4,browL:-22,browR:22,brows:.8,smile:-.8,lean:4},
  surprised:{openL:1.2,openR:1.15,gazeX:0,gazeY:0,browL:0,browR:0,brows:0,smile:0,lean:-4},
  thinking:{openL:.75,openR:1.06,gazeX:7,gazeY:-7,browL:8,browR:-8,brows:.5,smile:.12,lean:5},
  angry:{openL:.66,openR:.7,gazeX:0,gazeY:1,browL:24,browR:-24,brows:1,smile:-.65,lean:-4},
  sleepy:{openL:.18,openR:.18,gazeX:0,gazeY:4,browL:0,browR:0,brows:0,smile:.1,lean:8},
  laughing:{openL:.015,openR:.015,gazeX:0,gazeY:0,browL:0,browR:0,brows:0,smile:1,lean:-5},
  excited:{openL:1.1,openR:1.08,gazeX:0,gazeY:-2,browL:0,browR:0,brows:0,smile:.95,lean:-2}
 };
 // Authored gestures have preparation, a held stroke and a softer return.
 // Audio selects opportunities, not a left/right oscillator or emotion labels.
 const speechChannels=['speechLX','speechLY','speechRX','speechRY','speechCurlL','speechCurlR','speechLean','speechNod'];
 const speechRest=Object.fromEntries(speechChannels.map(k=>[k,0]));
 const speechClips=[
  {name:'unfold',family:'arm',duration:2.1,keys:[
   [0,{}],[.1,{speechRX:-4,speechRY:3,speechCurlR:-.04}],
   [.34,{speechRX:19,speechRY:-30,speechCurlR:.25,speechLean:-.6}],
   [.6,{speechRX:22,speechRY:-26,speechCurlR:.34,speechLean:-.45}],
   [.82,{speechRX:8,speechRY:-10,speechCurlR:.16}],[1,{}]]},
  {name:'gather',family:'arm',duration:1.85,keys:[
   [0,{}],[.12,{speechLX:-3,speechLY:2,speechCurlL:.06}],
   [.36,{speechLX:10,speechLY:-23,speechCurlL:.42,speechLean:.45}],
   [.58,{speechLX:5,speechLY:-26,speechCurlL:.36,speechLean:.35}],
   [.83,{speechLX:-3,speechLY:-9,speechCurlL:.12}],[1,{}]]},
  {name:'acknowledge',family:'head',duration:1.4,keys:[
   [0,{}],[.19,{speechNod:-.16}],[.43,{speechNod:1.15,speechLean:.65}],
   [.7,{speechNod:.3,speechLean:.28}],[1,{}]]},
  {name:'open',family:'arm',duration:2.45,keys:[
   [0,{}],[.12,{speechLX:2,speechRX:-3,speechRY:2}],
   [.35,{speechLX:-14,speechLY:-12,speechRX:18,speechRY:-26,speechCurlR:.25,speechCurlL:.1,speechLean:-.3}],
   [.6,{speechLX:-16,speechLY:-10,speechRX:15,speechRY:-21,speechCurlR:.3,speechCurlL:.18}],
   [.84,{speechLX:-5,speechLY:-2,speechRX:6,speechRY:-7,speechCurlR:.1}],[1,{}]]}
 ];
 const ease=t=>{t=clamp(t);return t*t*t*(10+t*(-15+6*t));};
 function sampleClip(clip,t){
  const out={...speechRest},keys=clip.keys;
  for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){
   const [a,from]=keys[i-1],[b,to]=keys[i],u=ease((t-a)/(b-a));
   for(const k of speechChannels)out[k]=lerp(from[k]||0,to[k]||0,u);
   break;
  }
  return out;
 }
 function createSpeechPerformance(random){
  let clock=0,silence=1,voiced=0,phraseAge=0,peak=0,pending=false,phraseActive=false;
  let current=null,nextAt=0,strokes=0,history=[],lastFamily='',lastKind='rest';
  const reset=()=>{current=null;silence=1;voiced=0;phraseActive=false;pending=false;nextAt=clock+.25;};
  function value(){
   if(!current)return {...speechRest};
   if(current.release){const w=1-ease((clock-current.release.at)/.45);return Object.fromEntries(speechChannels.map(k=>[k,current.release.pose[k]*w]));}
   const pose=sampleClip(current.clip,(clock-current.at)/current.duration);
   return Object.fromEntries(speechChannels.map(k=>[k,pose[k]*current.strength]));
  }
  function update(dt,level,fast,slow,rising,enabled,scale){
   clock+=dt;
   if(!enabled){reset();return {...speechRest};}
   if(level>.025){
    if(!phraseActive||silence>.34){phraseActive=true;phraseAge=voiced=peak=strokes=0;pending=true;}
    silence=0;voiced+=dt;peak=Math.max(peak,level);
   }else silence+=dt;
   if(phraseActive)phraseAge+=dt;
   if(current&&silence>.22&&!current.release)current.release={at:clock,pose:value()};
   if(current&&(current.release?clock-current.release.at>=.45:clock-current.at>=current.duration))current=null;
   if(silence>.65){phraseActive=false;pending=false;}
   // A phrase may open with a gesture, or stay still. A long phrase gets at
   // most one additional strong accent; individual syllables never flap arms.
   const opening=pending&&voiced>.16&&phraseAge<.9;
   const emphasis=!pending&&phraseAge>2.4&&strokes<2&&rising&&fast>slow*1.65+.045;
   if(level>.045&&!current&&clock>=nextAt&&(opening||emphasis)){
    pending=false;strokes++;
    let choices=speechClips.filter(c=>!history.slice(-2).includes(c.name)&&(c.name!=='open'||peak>.6));
    if(lastFamily==='arm')choices=choices.filter(c=>c.family==='head');
    // Quiet speech and recent activity leave room for stillness. Variation is
    // constrained by phrase energy and recent gestures, not random twitching.
    const still=peak<.18||!choices.length||random()<(lastFamily==='arm'?.25:.12);
    if(still){lastKind='rest';lastFamily='rest';nextAt=clock+1.6+random()*.7;}
    else{
     const clip=choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];
     const duration=clip.duration*(.94+random()*.14);
     current={clip,at:clock,duration,strength:clamp(.55+peak*.65,.55,1)*scale};
     history.push(clip.name);history=history.slice(-3);lastKind=clip.name;lastFamily=clip.family;
     nextAt=clock+duration+.75+random()*.65;
    }
   }
   if(phraseAge>=.9)pending=false;
   return value();
  }
  return {update,reset,state:()=>({speechClip:current?.clip.name||'rest',lastSpeechChoice:lastKind})};
 }
 function createRig(root,options={}){
  const A=host.OctopusAnatomy,G=host.CharacterGeometry,nodes=new Map();
  const $=id=>{if(!nodes.has(id))nodes.set(id,root.querySelector('#'+id));return nodes.get(id);};
  const attr=(id,key,value)=>$(id)?.setAttribute(key,String(value));
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');let reduced=media.matches;
  let mode='idle',modeSince=0,lastMouthAt=-99,fastEnvelope=0,slowEnvelope=0;
  const random=options.random||Math.random,performance=createSpeechPerformance(random);
  let speechPose={...speechRest},breathPhase=0,breathIn=1.7,breathOut=2.9,breathPause=.7;
  let time=0,last=null,raf=0,disposed=false,emotion='neutral',intensity=.7,energy=0,externalMouth=null,gesture='none',until=0,blinkStart=-99,nextBlink=3.2,jumpStart=-99,gestureStart=-99;
  const q={...A.rest,...faces.neutral,...G.mouthBase,mouthSmile:.6,voice:0,wave:0,cheer:0,tears:0,attention:0,nod:0,breath:0,...speechRest,autoWeight:1};
  const velocity=Object.fromEntries(Object.keys(q).map(k=>[k,0]));
  // Preserve both pose and velocity when tools interrupt one another. Fixed small
  // integration steps keep the same trajectory on 30/60/120 Hz displays.
  function smooth(k,target,dt,omega){
   const x=q[k]-target,v=velocity[k],decay=Math.exp(-omega*dt);
   q[k]=target+(x+(v+omega*x)*dt)*decay;velocity[k]=(v-omega*(v+omega*x)*dt)*decay;
  }
  function targets(){
   const face=faces[emotion],goal={};
   for(const k of Object.keys(faces.neutral))goal[k]=lerp(faces.neutral[k],face[k],intensity);
   if(emotion==='laughing'&&intensity>.5)goal.openL=goal.openR=.015;
   const faceLean=goal.lean,active=time<until?gesture:'none';
   Object.assign(goal,A.rest,A.poses[active]||{},{wave:active==='wave'&&!reduced?1:0,cheer:active==='celebrate'&&!reduced?1:0,voice:0,tears:emotion==='crying'?intensity:0,attention:mode==='listening'?1:mode==='speaking'?.35:mode==='thinking'?.45:0,nod:0,breath:0,...speechRest,autoWeight:active==='none'||active==='blink'?1:0});
   goal.lean+=faceLean*.22;
   if(mode==='thinking'&&emotion==='neutral'&&active==='none')goal.lean+=.65;
   // Tip oscillation and curl have different phases; the mantle leads and the
   // tentacle follows. No whole-character rocking or eight synchronized arms.
   const gestureAge=time-gestureStart;
   const wavePhase=Math.max(0,gestureAge-.45)*4.2;
   goal.rx+=q.wave*Math.sin(wavePhase)*6;
   goal.curlR+=q.wave*Math.sin(wavePhase-.7)*.1;
   goal.ly+=q.cheer*Math.sin(time*3.6-.5)*3;goal.ry+=q.cheer*Math.sin(time*3.6)*3;
   const mouth=G.expressionMouth[emotion]||G.mouthBase;
   Object.assign(goal,G.mouthBase,mouth,{mouthOpen:(mouth.mouthOpen||0)*intensity,mouthSmile:goal.smile});
   if(externalMouth){
    const viseme=G.visemes[externalMouth.viseme]||G.visemes.REST,closed=['REST','MBP'].includes(externalMouth.viseme),voiced=externalMouth.energy>.012&&!closed;
    Object.assign(goal,viseme);goal.mouthOpen=voiced?clamp(externalMouth.open):0;
    goal.mouthSmile=voiced?viseme.mouthSmile:externalMouth.viseme==='MBP'?0:goal.smile;
    if(externalMouth.width!==undefined)goal.mouthWidth=.62+clamp(externalMouth.width)*.54;
    if(externalMouth.round!==undefined)goal.mouthRound=clamp(externalMouth.round);
    goal.voice=reduced||mode!=='speaking'?0:fastEnvelope;
   }
   // Baseline attention never moves the gaze away from the child. Intentional
   // face/gesture cues take priority; sound controls rhythm, never an emotion.
   const quiet=['sad','crying','sleepy','angry'].includes(emotion)? .25:1;
   const weight=reduced?0:q.autoWeight*quiet;
   if(emotion==='neutral'){
    goal.openL+=q.attention*.025;goal.openR+=q.attention*.025;
    goal.mouthSmile+=q.attention*.035;
   }
   if(mode==='speaking'){
    for(const k of speechChannels)goal[k]=speechPose[k]*weight;
    goal.nod=goal.speechNod;goal.lean+=goal.speechLean;
   }else if(mode==='listening'){
    // One acknowledgement on entering listening, followed by attentive stillness.
    const elapsed=time-modeSince;
    goal.nod=elapsed>.6&&elapsed<1.6?Math.sin((elapsed-.6)*Math.PI)**2*weight*.4:0;
   }
   const inhale=ease(breathPhase/breathIn),exhale=1-ease((breathPhase-breathIn)/breathOut);
   goal.breath=reduced?0:(breathPhase<breathIn?inhale:breathPhase<breathIn+breathOut?exhale:0)*(mode==='speaking'?.25:1);
   // One small preparation/compression per gesture, never a perpetual wobble.
   // Position leads curl: the soft tip catches up after the arm starts moving.
   if(!reduced&&['wave','explain','celebrate'].includes(active)&&gestureAge<.75){
    if(gestureAge<.18)goal.squash=1-.018*Math.sin(gestureAge/.18*Math.PI);
    else goal.squash=1+.01*Math.sin((gestureAge-.18)/.57*Math.PI);
   }
   const t=time-jumpStart;
   if(!reduced&&t>=0&&t<1.3){
    if(t<.24)goal.squash=1-.095*Math.sin(t/.24*Math.PI/2)**2;
    else if(t<1){const u=(t-.24)/.76,h=Math.sin(Math.PI*u);goal.lift=-58*h;goal.squash=1+.035*h;goal.tuck=h;}
    else goal.squash=1-.07*Math.sin((t-1)/.3*Math.PI);
   }
   return goal;
  }
  function draw(){
   attr('m-character','transform',`translate(0 ${f(q.lift)})`);
   A.draw(attr,q,time,reduced);
   attr('m-shadow','transform',`translate(303 447) scale(${f(clamp(1+q.lift/170,.6,1.05))} 1) translate(-303 -447)`);
   const bt=time-blinkStart,blink=bt>=0&&bt<.19?Math.sin(bt/.19*Math.PI):0;
   for(const side of ['l','r']){
    const rx=A.eyes[side].rx,ry=A.eyes[side].ry,open=clamp(q[side==='l'?'openL':'openR']*(1-blink),.005,1.25),top=-ry*1.333*open,bottom=ry*1.333*open;
    const d=`M${-rx} 0 C${-rx} ${f(top)} ${rx} ${f(top)} ${rx} 0 C${rx} ${f(bottom)} ${-rx} ${f(bottom)} ${-rx} 0Z`,closed=clamp((.15-open)/.1);
    attr('m-white-'+side,'d',d);attr('m-cut-'+side,'d',d);attr('m-white-'+side,'opacity',f(1-closed));attr('m-pupil-'+side,'opacity',f(1-closed));
    attr('m-pupil-'+side,'transform',`translate(${f(q.gazeX)} ${f(q.gazeY)})`);attr('m-closed-'+side,'opacity',f(closed));
    attr('m-closed-'+side,'d',`M${f(-rx*.72)} 0 Q0 ${f(-12*q.smile)} ${f(rx*.72)} 0`);
    attr('m-brow-'+side,'opacity',f(q.brows));attr('m-brow-'+side,'transform',`rotate(${f(q[side==='l'?'browL':'browR'])} 0 -42)`);
   }
   const mouth=G.mouth(q,'mascot');for(const [id,attrs]of Object.entries(mouth.attributes)){if(id==='mouth'||id==='muzzle-smile')continue;for(const [key,v]of Object.entries(attrs))attr(id,key,v);}
   const m=A.mouth;
   attr('mouth','transform',`translate(${f(m.x+q.mouthOffset*.7)} ${m.y}) scale(${m.sx} ${m.sy})`);attr('mouth-edge','stroke-width',3);
   attr('m-tears','opacity',f(q.tears));
  }
  function step(dt){
   time+=dt;
   if(!reduced&&time>nextBlink){blinkStart=time;nextBlink=time+3.5+random()*1.5;}
   const level=mode==='speaking'&&externalMouth&&time-lastMouthAt<.2?clamp(externalMouth.energy):0;
   const previousFast=fastEnvelope;
   fastEnvelope+=(level-fastEnvelope)*(1-Math.exp(-dt*24));
   slowEnvelope+=(level-slowEnvelope)*(1-Math.exp(-dt*3));
   const active=time<until?gesture:'none';
   speechPose=performance.update(dt,level,fastEnvelope,slowEnvelope,fastEnvelope>previousFast,
    !reduced&&mode==='speaking'&&(active==='none'||active==='blink'),(options.speechMotionScale??.5)/.5);
   breathPhase+=dt;
   if(breathPhase>breathIn+breathOut+breathPause){
    breathPhase=0;breathIn=1.5+random()*.5;breathOut=2.6+random()*.6;breathPause=.45+random()*.55;
   }
   const goal=targets();
   for(const [k,v]of Object.entries(goal)){
    const closed=k==='mouthOpen'&&externalMouth&&['REST','MBP'].includes(externalMouth.viseme);
    smooth(k,v,dt,closed?80:k.startsWith('mouth')?32:['curlL','curlR','speechCurlL','speechCurlR'].includes(k)?6.5:['lx','ly','rx','ry'].includes(k)?9:k==='lift'?24:k==='squash'?18:12);
   }
  }
  function frame(ms){
   if(disposed)return;
   let dt=last===null?1/60:clamp((ms-last)/1000,0,.05);last=ms;
   if(!document.hidden){while(dt>1e-7){const stepSize=Math.min(dt,1/120);step(stepSize);dt-=stepSize;}draw();}
   raf=requestAnimationFrame(frame);
  }
  const visibility=()=>{last=null;},preference=()=>{reduced=media.matches;};
  document.addEventListener('visibilitychange',visibility);media.addEventListener('change',preference);draw();raf=requestAnimationFrame(frame);
  return {
   setEmotion:name=>{if(Object.hasOwn(faces,name))emotion=name;},
   setIntensity:n=>{if(Number.isFinite(n))intensity=clamp(n);},setEnergy:n=>{if(Number.isFinite(n))energy=clamp(n);},
   setMode:value=>{if(['idle','listening','thinking','speaking'].includes(value)&&mode!==value){mode=value;modeSince=time;if(mode!=='speaking'){performance.reset();speechPose={...speechRest};fastEnvelope=slowEnvelope=0;}}},
   setMouthPose:value=>{externalMouth=value;lastMouthAt=time;},
   setGesture:(name,duration=3)=>{if(!['none','wave','blink','jump','explain','think','celebrate'].includes(name))return;performance.reset();speechPose={...speechRest};gesture=name;gestureStart=time;until=time+clamp(Number.isFinite(duration)?duration:3,.1,6);if(name==='blink')blinkStart=time;if(name==='jump')jumpStart=time;else jumpStart=-99;},
   cancelActions:()=>{gesture='none';until=0;jumpStart=-99;gestureStart=-99;performance.reset();speechPose={...speechRest};},setFlight:()=>false,stopFlight:()=>{},flightState:()=>null,
   destroy:()=>{disposed=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',preference);},
   getState:()=>({rig:'octopus',mode,emotion,intensity,energy,fastEnvelope,slowEnvelope,...performance.state(),gesture:time<until?gesture:'none',disposed,...q})
  };
 }
 host.OctopusMotion={createRig};
})(typeof window!=='undefined'?window:this);
