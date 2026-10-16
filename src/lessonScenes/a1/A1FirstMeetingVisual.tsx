/** Bespoke lesson SVG: identity/wellbeing cues, not a reused B1 board. */
export function A1FirstMeetingVisual({sceneId,beatId}:{sceneId:string;beatId:string}){
  const listening=sceneId==='first-listen';
  const names=sceneId==='say-your-name';
  return <svg className="teacher-lab-visual a1-audio-board-art" viewBox="0 0 360 294"
    direction="ltr" style={{direction:'ltr',fontFamily:'Inter,system-ui,sans-serif'}}
    role="img" aria-label={listening?'Two learners meet for the first time':names?'Two people saying their names':'Polite wellbeing exchange'}>
    <defs><linearGradient id="a1-stage" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#effbf7"/><stop offset="1" stopColor="#e6f5f8"/></linearGradient></defs>
    <rect x="0" y="0" width="360" height="294" rx="24" fill="url(#a1-stage)"/>
    <text x="20" y="31" fontSize="17" fontWeight="900" fill="#187269">{listening?'FIRST MEETING':names?'SAY YOUR NAME':'HOW ARE YOU?'}</text>
    {[{cx:88,name:'MAYA',skin:'#f4c1a0',shirt:'#ed7298'},{cx:268,name:'LEO',skin:'#cba37c',shirt:'#38a598'}].map(x=><g key={x.name}>
      <circle cx={x.cx} cy="103" r="37" fill="#fff" opacity=".75"/>
      <path d={`M${x.cx-38} 174q-8 -63 38 -63q46 0 38 63`} fill={x.shirt}/>
      <circle cx={x.cx} cy="101" r="29" fill={x.skin}/>
      <path d={`M${x.cx-21} 92q20 -31 43 0`} fill="none" stroke="#554e4b" strokeWidth="9" strokeLinecap="round"/>
      <circle cx={x.cx-9} cy="103" r="2.5" fill="#333"/><circle cx={x.cx+9} cy="103" r="2.5" fill="#333"/>
      <path d={`M${x.cx-7} 118q7 7 14 0`} stroke="#765457" strokeWidth="2" fill="none"/>
      <text x={x.cx} y="196" textAnchor="middle" fontSize="17" fontWeight="900" fill="#2a615e">{x.name}</text>
    </g>)}
    <path d="M139 117q39 -36 79 0" stroke="#5ab1a1" strokeWidth="4" strokeDasharray="5 6" fill="none"/>
    <circle cx="180" cy="113" r="15" fill="#fff" stroke="#99d5c9"/><path d="M174 113h12m-6-6v12" stroke="#208479" strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="18" y="210" width="324" height="62" rx="18" fill="#fff" stroke="#c2e6dc" strokeWidth="2"/>
    {listening?<><text x="180" y="235" fontSize="17" fontWeight="850" textAnchor="middle" fill="#215e58">{beatId==='scene-set'?'Two people meet': 'Good morning! · Hi!'}</text>
      <text x="180" y="255" fontSize="13" textAnchor="middle" fill="#66807b">{beatId==='scene-set'?'Listen first. Notice their interaction.':'Greeting → Names → How are you?'}</text></>:
      names?<><text x="180" y="234" fontSize="17" fontWeight="850" textAnchor="middle" fill="#215e58">“I'm Maya.” · “My name is Leo.”</text>
      <text x="180" y="255" fontSize="13" textAnchor="middle" fill="#66807b">I'm = I am</text></>:
      <><text x="180" y="235" fontSize="17" fontWeight="850" textAnchor="middle" fill="#215e58">“How are you?”</text>
      <text x="180" y="255" fontSize="13" textAnchor="middle" fill="#66807b">“Pretty good!” · “Really good!”</text></>}
  </svg>;
}
