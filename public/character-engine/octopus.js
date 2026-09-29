/* Octo art: one continuous skin silhouette, eight soft tentacles and a deformable
   mantle. Driven exclusively by octopus-motion.js. */
(function(host){
 'use strict';
 const f=n=>+n.toFixed(3);
 const rest={lx:164,ly:383,rx:442,ry:383,lean:0,squash:1,lift:0,tuck:0,curlL:0,curlR:0};
 const poses={none:{},wave:{rx:430,ry:252,lean:-1.8,curlR:1},think:{rx:389,ry:311,lean:1.6,curlR:.7},explain:{rx:437,ry:344,lean:-1.2,curlR:.4},celebrate:{lx:181,ly:280,rx:425,ry:276,lean:-.8,curlL:.8,curlR:1}};
 const eyes={l:{x:257,y:278,rx:33,ry:39},r:{x:349,y:278,rx:33,ry:39}};
 // The seated base stays planted while the mantle fills and rises on inhale.
 // The face rides the expansion slightly, without scaling eyes or changing gaze.
 function bodyShape(b=0){
  const w=f(b*3.8),h=f(b*4.8);
  return `M${168-w} ${f(274-h*.4)} C${f(166-w*.5)} ${f(205-h*.8)} 216 ${159-h} 281 ${155-h} C351 ${147-h} 412 ${177-h} ${f(431+w*.5)} ${f(232-h*.55)} C${447+w} ${f(279-h*.3)} ${432+w} 325 ${407+w} 351 C384 381 349 397 303 397 C257 397 224 381 ${199-w} 351 C${179-w} 329 ${168-w} 302 ${168-w} ${f(274-h*.4)}Z`;
 }
 const body=bodyShape();
 function mantle(q,time,reduced){
  const sy=q.squash,sx=1/Math.sqrt(sy),angle=q.lean*Math.PI/180;
  const bob=reduced?0:-(q.attention||0)*.8+(q.nod||0)*2.8;
  const point=([x,y])=>{const dx=(x-303)*sx,dy=(y-366)*sy;return [303+dx*Math.cos(angle)-dy*Math.sin(angle),366+bob+dx*Math.sin(angle)+dy*Math.cos(angle)];};
  return {point,transform:`translate(303 ${f(366+bob)}) rotate(${f(q.lean)}) scale(${f(sx)} ${f(sy)}) translate(-303 -366)`};
 }

 // Sample two joined Beziers. Normal offsets make the silhouette, underside and
 // suckers travel together, including when a gesture changes mid-curve.
 function curve(points,t){
  const second=t>.5,u=second?(t-.5)*2:t*2,i=second?3:0,[a,b,c,d]=points.slice(i,i+4),v=1-u;
  const p=[0,1].map(k=>v*v*v*a[k]+3*v*v*u*b[k]+3*v*u*u*c[k]+u*u*u*d[k]);
  const tangent=[0,1].map(k=>3*v*v*(b[k]-a[k])+6*v*u*(c[k]-b[k])+3*u*u*(d[k]-c[k])),len=Math.hypot(...tangent)||1;
  return {p,n:[-tangent[1]/len,tangent[0]/len],angle:Math.atan2(tangent[1],tangent[0])*180/Math.PI};
 }
 const radius=(width,t)=>width*Math.pow(1-t,1.15)+5;
 function ribbon(points,width,side,start=0){
  const a=[],b=[];
  for(let i=0;i<=48;i++){
   const t=start+(1-start)*i/48,{p,n}=curve(points,t),r=radius(width,t);
   const offset=side===undefined?0:r*.38*side,fade=Math.min(1,Math.max(0,(t-start)/.16)),w=side===undefined?r:r*.48*fade*fade*(3-2*fade);
   a.push(p.map((x,k)=>f(x+n[k]*(offset+w))));b.push(p.map((x,k)=>f(x+n[k]*(offset-w))));
  }
  const end=curve(points,1),cap=end.p.map((v,k)=>f(v+(k===0?end.n[1]:-end.n[0])*4));
  return 'M'+a.map(p=>p.join(' ')).join(' L')+' Q'+cap.join(' ')+' '+b[b.length-1].join(' ')+' L'+b.reverse().map(p=>p.join(' ')).join(' L')+'Z';
 }
 // Union of round swept sections: all subpaths have the same winding, so a
 // tight curl overlaps as solid skin instead of punching a hole or flipping an
 // offset edge. No browser filters or raster skin are involved.
 function tube(points,width,start=0){
  const sections=[];let d='';
  for(let i=0;i<=32;i++){
   const t=start+(1-start)*i/32,{p,n}=curve(points,t),r=radius(width,t);
   sections.push({p,n,r});
   d+=`M${f(p[0]+r)} ${f(p[1])} A${f(r)} ${f(r)} 0 1 1 ${f(p[0]-r)} ${f(p[1])} A${f(r)} ${f(r)} 0 1 1 ${f(p[0]+r)} ${f(p[1])}Z `;
  }
  for(let i=1;i<sections.length;i++){
   const a=sections[i-1],b=sections[i],point=(s,sign)=>s.p.map((v,k)=>v+s.n[k]*s.r*sign);
   let polygon=[point(a,1),point(b,1),point(b,-1),point(a,-1)];
   const area=polygon.reduce((sum,p,j)=>sum+p[0]*polygon[(j+1)%4][1]-polygon[(j+1)%4][0]*p[1],0);
   if(area<0)polygon.reverse();
   d+='M'+polygon.map(p=>p.map(f).join(' ')).join(' L')+'Z ';
  }
  return d;
 }
 function geometry(q,time,reduced){
  const limbs=[],m=mantle(q,time,reduced);
  // Resting limbs spread along the ground instead of hanging as a scalloped
  // skirt. The front pair reach outward; their curled tips turn back toward us.
  const defs=[
   [-1,0,[[277,350],[272,367],[268,376],[273,373],[278,370],[280,366],[277,362]]],
   [1,0,[[329,350],[334,367],[338,376],[333,373],[328,370],[326,366],[329,362]]],
   [-1,1,[[245,358],[227,405],[181,440],[177,416],[173,392],[201,384],[203,402]]],
   [1,1,[[361,358],[379,405],[425,440],[429,416],[433,392],[405,384],[403,402]]],
   [-1,2,[[285,377],[291,424],[245,449],[237,426],[229,403],[250,393],[254,412]]],
   [1,2,[[321,377],[315,424],[361,449],[369,426],[377,403],[356,393],[352,412]]]
  ];
  for(const [sign,layer,points]of defs){
   const dx=-sign*q.tuck*8,dy=-q.tuck*12;
   limbs.push({id:'base-'+limbs.length,layer,width:layer===0?15:layer===2?29:26,
    compression:layer===0?1:.65,side:-sign,
    points:points.map((p,i)=>i<2?m.point(p):[p[0]+dx,p[1]+dy])});
  }
  for(const side of ['l','r']){
   const sign=side==='l'?-1:1,curl=q[side==='l'?'curlL':'curlR']+(q[side==='l'?'speechCurlL':'speechCurlR']||0);
   const x=q[side+'x'],y=q[side+'y']+(q[side==='l'?'speechLY':'speechRY']||0),xAccent=q[side==='l'?'speechLX':'speechRX']||0,rootX=303+sign*75;
   // Bend follows a continuous curl channel; movement does not pivot a rigid
   // arm around a shoulder. Matching tangents at the join prevent a kink.
   const reach=10+curl*35;
   limbs.push({id:side,layer:3,width:28,side:-sign,points:[m.point([rootX,348]),m.point([rootX+sign*reach,407-curl*30]),[x+xAccent+sign*7,y+33],[x+xAccent+sign*17,y+9],[x+xAccent+sign*27,y-15],[x+xAccent-sign*9,y-33],[x+xAccent-sign*13,y-13]]});
  }
  return limbs;
 }
 // Flatten only the resting pairs; authored offsets align their contact edges
 // around y=446. Gesture arms retain a round cross section and full reach.
 const supportTransform=limb=>{
  const compression=limb.compression||1,contactOffset=limb.layer===1?7:limb.layer===2?-2:0;
  return `translate(0 ${f(430*(1-compression)+contactOffset)}) scale(1 ${compression})`;
 };
 function seam(limb){
  const points=[];
  for(let i=0;i<=24;i++){
   const t=.04+i*.016,{p,n}=curve(limb.points,t),r=radius(limb.width,t);
   points.push([f(p[0]-n[0]*r*limb.side*.82),f(p[1]-n[1]*r*limb.side*.82)]);
  }
  return 'M'+points.map(p=>p.join(' ')).join(' L');
 }
 function armLight(limb){
  const {p}=curve(limb.points,.58);
  const root=limb.points[0],fade=curve(limb.points,.34).p;
  return {light:{x1:f(p[0]-32),y1:f(p[1]-26),x2:f(p[0]+32),y2:f(p[1]+26)},fade:{x1:f(root[0]),y1:f(root[1]),x2:f(fade[0]),y2:f(fade[1])}};
 }
 const attrs=object=>Object.entries(object).map(([k,v])=>`${k}="${v}"`).join(' ');
 function draw(attr,q,time,reduced){
  const m=mantle(q,time,reduced);
  for(const id of ['o-body','o-body-cut']){attr(id,'transform',m.transform);attr(id,'d',bodyShape(reduced?0:q.breath||0));}
  attr('o-mantle-details','transform',m.transform+` translate(0 ${f(reduced?0:-(q.breath||0)*1.8)})`);
  for(const limb of geometry(q,time,reduced)){
   attr('o-t-'+limb.id,'transform',supportTransform(limb));
   attr('o-limb-'+limb.id,'transform',supportTransform(limb));
   if(limb.layer===1||limb.layer===2){
    attr('o-seam-'+limb.id,'transform',supportTransform(limb));
    attr('o-seam-'+limb.id,'d',seam(limb));
   }
   attr('o-t-'+limb.id,'d',tube(limb.points,limb.width));attr('o-under-'+limb.id,'d',ribbon(limb.points,limb.width,limb.side,.38));
   attr('o-depth-'+limb.id,'d',ribbon(limb.points,limb.width,-limb.side,.06));
   if(limb.layer===3){
    const surface=tube(limb.points,limb.width,.08),light=armLight(limb);
    attr('o-front-'+limb.id,'d',surface);attr('o-arm-shadow-'+limb.id,'d',surface);
    for(const [k,v]of Object.entries(light.light))attr('o-arm-light-'+limb.id,k,v);
    for(const [k,v]of Object.entries(light.fade))attr('o-arm-fade-'+limb.id,k,v);
   }
   for(let i=0;i<3;i++){
    const t=.62+i*.11,{p,n,angle}=curve(limb.points,t),r=radius(limb.width,t);
    const transform=`translate(${f(p[0]+n[0]*r*.36*limb.side)} ${f(p[1]+n[1]*r*.36*limb.side)}) rotate(${f(angle)}) scale(${f(r/18)})`;
    attr('o-s-'+limb.id+'-'+i,'transform',transform);
   }
   if(limb.layer===3){const tip=limb.points[6];attr('hand-'+limb.id,'transform',`translate(${tip.map(f).join(' ')})`);}
  }
 }
 function render(p,portrait){
  const limbs=geometry({...rest,voice:0},0,true);
  const tentacle=l=>`<g id="o-limb-${l.id}" transform="${supportTransform(l)}" opacity="${l.layer===0?0:1}"><path id="o-depth-${l.id}" d="${ribbon(l.points,l.width,-l.side,.06)}" fill="url(#o-soft-depth)"/><path id="o-under-${l.id}" d="${ribbon(l.points,l.width,l.side,.38)}" fill="#FFB1C2" opacity=".78"/>${[0,1,2].map(i=>{const t=.62+i*.11,{p:pt,n,angle}=curve(l.points,t),r=radius(l.width,t);return `<g id="o-s-${l.id}-${i}" transform="translate(${f(pt[0]+n[0]*r*.36*l.side)} ${f(pt[1]+n[1]*r*.36*l.side)}) rotate(${f(angle)}) scale(${f(r/18)})"><ellipse rx="6.5" ry="5.5" fill="#FFD0D9"/><ellipse rx="3.3" ry="2.5" fill="#ED7795"/></g>`;}).join('')}</g>`;
  const eye=side=>{const e=eyes[side];return `<g id="m-eye-${side}" transform="translate(${e.x} ${e.y})"><path id="m-white-${side}" d="M-${e.rx} 0 C-${e.rx} -${e.ry*1.333} ${e.rx} -${e.ry*1.333} ${e.rx} 0 C${e.rx} ${e.ry*1.333} -${e.rx} ${e.ry*1.333} -${e.rx} 0Z" fill="#FFFCF6"/><g clip-path="url(#m-eye-clip-${side})"><g id="m-pupil-${side}"><ellipse id="o-iris-${side}" cx="0" cy="1" rx="21" ry="28" fill="url(#o-iris)"/><ellipse cx="-7" cy="-11" rx="6" ry="8" fill="#FFFFFF"/><circle cx="8" cy="11" r="2.5" fill="#FFFFFF" opacity=".65"/></g></g><path id="m-closed-${side}" fill="none" stroke="#692A43" stroke-width="6" stroke-linecap="round" opacity="0"/><path id="m-brow-${side}" d="M-15 -45 Q0 -54 15 -45" fill="none" stroke="#A72E54" stroke-width="6" stroke-linecap="round" opacity="0"/></g>`;};
  // Paths (rather than ellipses) let the shared eye solver close the complete eye.
  const eyeMarkup=eye('l')+eye('r');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${portrait?'110 138 386 326':'80 55 445 415'}" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="m-title"><title id="m-title">${p.name}</title><defs>
   <radialGradient id="o-skin" gradientUnits="userSpaceOnUse" cx="249" cy="200" r="279"><stop stop-color="#FF819E"/><stop offset=".32" stop-color="#FF527C"/><stop offset=".75" stop-color="#F94370"/><stop offset="1" stop-color="#DF305D"/></radialGradient>
   <radialGradient id="o-iris" cx=".35" cy=".2" r=".9"><stop stop-color="#493349"/><stop offset="1" stop-color="#241D30"/></radialGradient>
   <radialGradient id="o-blush"><stop stop-color="#E83E67" stop-opacity=".3"/><stop offset="1" stop-color="#E83E67" stop-opacity="0"/></radialGradient>
   <radialGradient id="o-light"><stop stop-color="#FFF0EF" stop-opacity=".11"/><stop offset="1" stop-color="#FFF5EF" stop-opacity="0"/></radialGradient>
   <radialGradient id="o-soft-depth"><stop stop-color="#BD2750" stop-opacity=".18"/><stop offset="1" stop-color="#BD2750" stop-opacity="0"/></radialGradient>
   <linearGradient id="o-rest-crease" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#B92951" stop-opacity="0"/><stop offset=".6" stop-color="#B92951" stop-opacity=".15"/><stop offset="1" stop-color="#B92951" stop-opacity="0"/></linearGradient>
   <radialGradient id="o-ground"><stop stop-color="#773746" stop-opacity=".16"/><stop offset="1" stop-color="#773746" stop-opacity="0"/></radialGradient>
   <clipPath id="o-body-clip"><path id="o-body-cut" d="${body}"/></clipPath>
   ${limbs.filter(l=>l.layer===3).map(l=>{const lighting=armLight(l);return `<linearGradient id="o-arm-light-${l.id}" gradientUnits="userSpaceOnUse" ${attrs(lighting.light)}><stop stop-color="#FF90A9"/><stop offset=".42" stop-color="#FF6387"/><stop offset=".8" stop-color="#F74772"/><stop offset="1" stop-color="#DD365F"/></linearGradient><linearGradient id="o-arm-fade-${l.id}" gradientUnits="userSpaceOnUse" ${attrs(lighting.fade)}><stop stop-color="black"/><stop offset=".25" stop-color="black"/><stop offset="1" stop-color="white"/></linearGradient><mask id="o-arm-mask-${l.id}" maskUnits="userSpaceOnUse" x="70" y="70" width="480" height="415"><rect x="70" y="70" width="480" height="415" fill="url(#o-arm-fade-${l.id})"/></mask>`;}).join('')}
   <mask id="o-silhouette" maskUnits="userSpaceOnUse" x="70" y="70" width="480" height="415"><g fill="white"><path id="o-body" d="${body}"/>${limbs.map(l=>`<path id="o-t-${l.id}" transform="${supportTransform(l)}" d="${tube(l.points,l.width)}"/>`).join('')}</g></mask>
   ${Object.entries(eyes).map(([s,e])=>`<clipPath id="m-eye-clip-${s}"><path id="m-cut-${s}" d="M-${e.rx} 0 C-${e.rx} -${e.ry*1.333} ${e.rx} -${e.ry*1.333} ${e.rx} 0 C${e.rx} ${e.ry*1.333} -${e.rx} ${e.ry*1.333} -${e.rx} 0Z"/></clipPath>`).join('')}

   <clipPath id="m-mouth-clip"><path id="mouth-cut"/></clipPath></defs>
   <ellipse id="m-shadow" cx="303" cy="447" rx="162" ry="9" fill="url(#o-ground)"/>
   <g id="m-character">
    <rect x="90" y="90" width="430" height="385" fill="url(#o-skin)" mask="url(#o-silhouette)"/>
    ${limbs.filter(l=>l.layer===1||l.layer===2).map(l=>`<path id="o-seam-${l.id}" transform="${supportTransform(l)}" d="${seam(l)}" fill="none" stroke="url(#o-rest-crease)" stroke-width="4" stroke-linecap="round"/>`).join('')}
    <g clip-path="url(#o-body-clip)">${limbs.filter(l=>l.layer===3).map(l=>`<g mask="url(#o-arm-mask-${l.id})"><path id="o-arm-shadow-${l.id}" d="${tube(l.points,l.width,.08)}" transform="translate(3 3)" fill="#B22850" opacity=".12"/></g>`).join('')}</g>
    ${limbs.filter(l=>l.layer===3).map(l=>`<path id="o-front-${l.id}" d="${tube(l.points,l.width,.08)}" fill="url(#o-arm-light-${l.id})" mask="url(#o-arm-mask-${l.id})"/>`).join('')}
    ${limbs.map(l=>tentacle(l)).join('')}
    <g id="o-mantle-details">
     <ellipse cx="260" cy="212" rx="85" ry="51" fill="url(#o-light)" transform="rotate(-18 260 212)"/>
    <g id="m-face">${eyeMarkup}
     <g fill="url(#o-blush)"><ellipse cx="220" cy="317" rx="28" ry="18"/><ellipse cx="386" cy="317" rx="28" ry="18"/></g>
     <g id="mouth" transform="translate(303 329) scale(1.02 1.15)"><path id="mouth-fill" fill="#672336"/><g clip-path="url(#m-mouth-clip)"><path id="teeth" fill="#FFF9F1"/><path id="lower-teeth" fill="#FFF9F1"/><ellipse id="tongue" cx="0" cy="18" rx="12" ry="6" fill="#FF8EAD"/></g><path id="mouth-edge" d="M-13 -2 Q0 13 13 -2" fill="none" stroke="#672336" stroke-width="3" stroke-linecap="round"/></g>
     <g id="m-tears" fill="#73CFE8" opacity="0"><path d="M244 308 Q234 323 244 327 Q254 323 244 308Z"/><path d="M356 298 Q346 313 356 317 Q366 313 356 298Z"/></g>
    </g></g><g id="hand-l"/><g id="hand-r"/>
   </g></svg>`;
 }
 host.OctopusAnatomy={rest,poses,eyes,mouth:{x:303,y:329,sx:1.02,sy:1.15},render,draw};
})(typeof window!=='undefined'?window:this);
