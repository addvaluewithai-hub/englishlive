/** Portrait-first semantic SVGs: a re-layout, NOT a 720px desktop board shrunk. */
export function TeacherLabPortraitVisual({sceneId,beatId}:{sceneId:string;beatId?:string}) {
  const state=sceneId==='warm-up'?
    'React, pick the detail, and ask a follow-up question':
    sceneId==='get-to-know'?'A new relationship grows from meeting to friendship':
    sceneId==='keep-in-touch'?'Two old friends continue to message over distance':
    'New relationships versus continuing contact';
  return <svg className="teacher-lab-visual teacher-lab-portrait" viewBox="0 0 360 310"
    xmlns="http://www.w3.org/2000/svg" role="img" aria-label={state}
    direction="ltr" style={{direction:'ltr',fontFamily:'system-ui, sans-serif'}}>
    <defs>
      <linearGradient id="portrait-green" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#e1f5ed"/><stop offset="1" stopColor="#f7fffb"/>
      </linearGradient>
      <linearGradient id="portrait-pink" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#ffe1e8"/><stop offset="1" stopColor="#fff8f6"/>
      </linearGradient>
    </defs>
    <rect width="360" height="310" rx="18" fill="#f3fbf7"/>
    {sceneId==='warm-up'?<>
      <text x="20" y="34" fontSize="19" fontWeight="900" fill="#145c55">KEEP TALKING</text>
      <rect x="13" y="47" width="334" height="48" rx="14" fill="#fff" stroke="#badbd2"/>
      <circle cx="38" cy="71" r="13" fill="#ffc9ad"/>
      <path d="M32 70q6 8 12 0" fill="none" stroke="#7c4b47" strokeWidth="2"/>
      <text x="60" y="77" fontSize="15" fontWeight="780" fill="#1b4e4a">I joined a photography club!</text>
      {[
        {n:1,y:105,title:'REACT',example:'Really?',fill:'#ffe1e8'},
        {n:2,y:174,title:'PICK A DETAIL',example:'photography club',fill:'#fff0d6'},
        {n:3,y:243,title:'ASK / CONTINUE',example:'What do you do there?',fill:'#d9f4eb'},
      ].map((v,i)=><g key={v.n} opacity={beatId==='story'&&i>0?.3:beatId==='reaction'&&i===2?.3:1}>
        <rect x="20" y={v.y} width="320" height="60" rx="15" fill={v.fill} stroke="#bcd8d1"/>
        <circle cx="48" cy={v.y+30} r="18" fill={i===0?'#db6585':i===1?'#d99732':'#2b9784'}/>
        <text x="48" y={v.y+36} textAnchor="middle" fontWeight="900" fontSize="16" fill="#fff">{v.n}</text>
        <text x="78" y={v.y+23} fontSize="15" fontWeight="900" fill="#1a5650">{v.title}</text>
        <text x="78" y={v.y+45} fontSize="13.5" fontWeight="700" fill="#427269">{v.example}</text>
      </g>)}
    </>:sceneId==='get-to-know'?<>
      <text x="20" y="37" fontSize="23" fontWeight="900" fill="#17675b">GET TO KNOW</text>
      <text x="20" y="59" fontSize="13.5" fontWeight="620" fill="#547a71">From strangers to friends · over time</text>
      <path d="M64 98v178" stroke="#aeddd1" strokeWidth="8" strokeLinecap="round"/>
      {[
        {y:87,title:'FIRST MEETING',hint:'We say hello',c:'#b0e9da'},
        {y:155,title:'MORE TALKS',hint:'We share stories',c:'#83cfc0'},
        {y:223,title:'GETTING FAMILIAR',hint:'I know Lina better',c:'#ed89a7'},
      ].map((v,i)=><g key={v.y}>
        <circle cx="64" cy={v.y+24} r="18" fill={v.c} stroke="#fff" strokeWidth="4"/>
        <path d={`M${59} ${v.y+23}l5 5l9 -12`} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
        <rect x="96" y={v.y} width="242" height="58" rx="15" fill="#fff" stroke="#c7e3db"/>
        <text x="113" y={v.y+23} fontSize="16" fontWeight="850" fill="#165c54">{v.title}</text>
        <text x="113" y={v.y+44} fontSize="13" fill="#658077">{v.hint}</text>
      </g>)}
    </>:sceneId==='keep-in-touch'?<>
      <text x="18" y="35" fontSize="22" fontWeight="900" fill="#156c61">KEEP IN TOUCH</text>
      <text x="18" y="56" fontSize="13.5" fill="#537b72">Far away, still connected</text>
      <rect x="18" y="82" width="138" height="147" rx="20" fill="#fff" stroke="#c7e2da"/>
      <rect x="204" y="82" width="138" height="147" rx="20" fill="#fff" stroke="#f1cccf"/>
      {[[87,0],[273,1]].map(([x,i])=><g key={x}>
        <circle cx={x} cy="128" r="26" fill={i?'#f4b29a':'#ffd0b4'}/>
        <path d={`M${x-35} 192q0 -47 35 -47q35 0 35 47`} fill={i?'#ec87a3':'#339b8b'}/>
        <circle cx={x-9} cy="126" r="2.5" fill="#5b3a3c"/>
        <circle cx={x+9} cy="126" r="2.5" fill="#5b3a3c"/>
        <path d={`M${x-9} 138q9 9 18 0`} fill="none" stroke="#9e6262" strokeWidth="2"/>
        <text x={x} y="215" textAnchor="middle" fontSize="13.5" fontWeight="850" fill="#2b5c53">{i?'LINA · CITY B':'YOU · CITY A'}</text>
      </g>)}
      <path d="M158 137q23 -30 44 0M158 155q23 30 44 0" stroke="#218b7c" strokeWidth="3.5" strokeDasharray="4 5" fill="none"/>
      <rect x="70" y="246" width="218" height="45" rx="19" fill="url(#portrait-green)" stroke="#83cdbd"/>
      <text x="179" y="265" fontSize="14.5" textAnchor="middle" fontWeight="850" fill="#1a6158">Message · Call · Talk</text>
      <text x="179" y="282" fontSize="11.5" textAnchor="middle" fill="#4e786c">We still talk every week</text>
    </>:<>
      <text x="19" y="39" fontSize="21" fontWeight="900" fill="#18594e">TWO RELATIONSHIP MOMENTS</text>
      <rect x="17" y="61" width="326" height="110" rx="20" fill="url(#portrait-green)" stroke="#abd7cc"/>
      <circle cx="64" cy="115" r="27" fill="#89cbbc"/>
      <path d="M53 115l8 9l17 -21" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round"/>
      <text x="107" y="104" fontWeight="900" fontSize="20" fill="#126557">get to know</text>
      <text x="107" y="128" fontSize="13" fill="#387a69">NEW relationship</text>
      <text x="107" y="148" fontSize="12" fill="#53857b">a coworker you just met</text>
      <rect x="17" y="184" width="326" height="110" rx="20" fill="url(#portrait-pink)" stroke="#f3c3cf"/>
      <circle cx="64" cy="236" r="27" fill="#f4a1b4"/>
      <path d="M54 232q10 -13 20 0M54 243q10 13 20 0" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <text x="107" y="228" fontWeight="900" fontSize="20" fill="#a64d69">keep in touch</text>
      <text x="107" y="251" fontSize="13" fill="#9c5871">CONTINUING contact</text>
      <text x="107" y="272" fontSize="12" fill="#a76c7d">a friend from school</text>
    </>}
  </svg>;
}
