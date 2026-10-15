import type { CSSProperties } from 'react';

/** Editorially-authored vector illustrations. Each board is a single fixed canvas. */
export function TeacherLabVisual({ sceneId, beatId }: { sceneId: string; beatId?: string }) {
  // English teaching labels must not inherit the Arabic RTL direction.
  const common = { fontFamily: "Inter, system-ui, sans-serif", direction: 'ltr', unicodeBidi: 'isolate' } as CSSProperties;
  return (
    <svg className="teacher-lab-visual" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet" role="img"
      aria-label={sceneId === 'warm-up' ? 'A conversation grows from news to a reaction and a follow-up question'
        : sceneId === 'get-to-know' ? 'A timeline from first meeting to becoming familiar'
        : sceneId === 'keep-in-touch' ? 'Two friends in different cities still exchanging messages'
        : 'Compare getting to know a new person with staying in touch with an old friend'}
      style={common} direction="ltr">
      <defs>
        <linearGradient id="lab-paper" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f7fcf8"/><stop offset="1" stopColor="#ebf7f6"/>
        </linearGradient>
        <linearGradient id="lab-card" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffffff"/><stop offset="1" stopColor="#eff8f6"/>
        </linearGradient>
        <filter id="lab-shadow" x="-25%" y="-35%" width="160%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#195c59" floodOpacity=".12"/>
        </filter>
      </defs>
      <rect width="720" height="360" rx="28" fill="url(#lab-paper)" />
      {sceneId === 'warm-up' ? (
        <g>
          <text x="38" y="48" fontSize="18" fontWeight="800" fill="#14746e">KEEP THE CONVERSATION GOING</text>
          <rect x="35" y="69" width="650" height="68" rx="20" fill="#fff" stroke="#b5dbd4" strokeWidth="2"/>
          <circle cx="72" cy="103" r="20" fill="#ffd1bd"/>
          <path d="M62 104q10 9 20 0 M62 98h2 M80 98h2" stroke="#713f43" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <text x="112" y="110" fontSize="22" fontWeight="750" fill="#193e3d">I joined a photography club!</text>
          {[
            {n:"01",title:"REACT",sub:"Really?",x:40,c:"#fa7f94"},
            {n:"02",title:"PICK",sub:"Photography club",x:270,c:"#f5b75b"},
            {n:"03",title:"CONTINUE",sub:"What do you do there?",x:500,c:"#49b8ac"},
          ].map((v,i)=>(
            <g key={v.n} opacity={beatId==='story'&&i>0?.38:beatId==='reaction'&&i===2?.38:1}>
              <rect x={v.x} y="179" width="187" height="122" rx="19" fill="url(#lab-card)" stroke="#b4d7d4" strokeWidth="2" filter="url(#lab-shadow)"/>
              <circle cx={v.x+29} cy="208" r="18" fill={v.c}/>
              <text x={v.x+29} y="214" fontSize="15" fontWeight="900" fill="#fff" textAnchor="middle">{v.n}</text>
              <text x={v.x+57} y="212" fontSize="17" fontWeight="850" fill="#214c49">{v.title}</text>
              <text x={v.x+16} y="260" fontSize={i===2?13:16} fontWeight="750" fill="#325f5b">{v.sub}</text>
              {i<2 ? <path d={`M${v.x+193} 240h31m-10 -9l10 9l-10 9`} stroke="#087d75" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>:null}
            </g>
          ))}
        </g>
      ) : sceneId === 'get-to-know' ? (
        <g>
          <text x="35" y="44" fontSize="18" fontWeight="850" fill="#14746e">GET TO KNOW</text>
          <text x="35" y="75" fontSize="24" fontWeight="850" fill="#244945">A relationship grows over time</text>
          <path d="M100 218H625" stroke="#9ccdc6" strokeWidth="8" strokeLinecap="round"/>
          {[122,358,592].map((x,i)=>(
            <g key={x}>
              <circle cx={x} cy="217" r="16" fill={i===2?"#e96b8d":"#158a80"} stroke="#fff" strokeWidth="5"/>
              <circle cx={x-20} cy="142" r="24" fill={i===2?"#f4ac8a":"#ffcaaf"} stroke="#fff" strokeWidth="3"/>
              <circle cx={x+20} cy="142" r="24" fill="#f2aa9b" stroke="#fff" strokeWidth="3"/>
              <path d={`M${x-55} 188q10 -33 35 -33q20 0 28 33 M${x-4} 188q10 -33 32 -33q25 0 36 33`} fill="#2b8e85" stroke="#fff" strokeWidth="3"/>
              <rect x={x-99} y="251" width="198" height="56" rx="16" fill="#fff" stroke="#cce5dc" strokeWidth="2"/>
              <text x={x} y="275" textAnchor="middle" fontSize="15" fontWeight="900" fill="#1b615b">{["FIRST MEETING","MORE TALKS","FAMILIAR FRIENDS"][i]}</text>
              <text x={x} y="293" textAnchor="middle" fontSize="12" fill="#567772">{["Say hello","Discover interests","Know each other"][i]}</text>
            </g>
          ))}
        </g>
      ) : sceneId === 'keep-in-touch' ? (
        <g>
          <text x="35" y="46" fontSize="18" fontWeight="850" fill="#14746e">KEEP IN TOUCH</text>
          <text x="35" y="76" fontSize="22" fontWeight="800" fill="#244945">Different places. Same connection.</text>
          {[60,490].map((x,i)=>(
            <g key={x}>
              <rect x={x} y="112" width="170" height="168" rx="22" fill="#fff" stroke="#cae5df" strokeWidth="2" filter="url(#lab-shadow)"/>
              <rect x={x+20} y="179" width="130" height="69" rx="7" fill={i?"#bddce8":"#c5e2d7"}/>
              <rect x={x+31} y="155" width="41" height="24" rx="6" fill={i?"#bddce8":"#c5e2d7"}/>
              <rect x={x+94} y="140" width="40" height="39" rx="6" fill={i?"#bddce8":"#c5e2d7"}/>
              <circle cx={x+85} cy="180" r="20" fill="#f8c1a3"/>
              <path d={`M${x+47} 249q38 -73 76 0`} fill={i?"#e98997":"#17897c"}/>
              <text x={x+85} y="300" textAnchor="middle" fontSize="17" fontWeight="850" fill="#244945">{i?"LINA":"YOU"}</text>
            </g>
          ))}
          <path d="M239 189q115 -110 244 0" fill="none" stroke="#289b91" strokeWidth="5" strokeDasharray="10 11" strokeLinecap="round"/>
          <path d="M473 177l12 12-16 5" fill="none" stroke="#289b91" strokeWidth="5" strokeLinecap="round"/>
          <rect x="266" y="122" width="190" height="57" rx="23" fill="#e5fff3" stroke="#8bcec0" strokeWidth="2"/>
          <text x="361" y="158" textAnchor="middle" fontSize="19" fontWeight="800" fill="#16796d">Message · Call</text>
          <text x="360" y="305" textAnchor="middle" fontSize="16" fontWeight="750" fill="#436b65">We still talk every week</text>
        </g>
      ) : (
        <g>
          <text x="35" y="45" fontSize="18" fontWeight="850" fill="#14746e">COMPARE THE MEANINGS</text>
          <rect x="30" y="78" width="310" height="243" rx="23" fill="#fff" stroke="#a8d4cc" strokeWidth="2" filter="url(#lab-shadow)"/>
          <rect x="380" y="78" width="310" height="243" rx="23" fill="#fff" stroke="#f7c7bd" strokeWidth="2" filter="url(#lab-shadow)"/>
          <circle cx="185" cy="152" r="42" fill="#d6f5ea"/>
          <circle cx="535" cy="152" r="42" fill="#ffe0d3"/>
          <path d="M167 151l15 16l29-31" stroke="#158a80" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M517 142v21m18-31v31m18-40v40" stroke="#e8797f" strokeWidth="6" strokeLinecap="round"/>
          <text x="185" y="221" textAnchor="middle" fontSize="26" fontWeight="900" fill="#176c64">get to know</text>
          <text x="535" y="221" textAnchor="middle" fontSize="26" fontWeight="900" fill="#ad5964">keep in touch</text>
          <text x="185" y="260" textAnchor="middle" fontSize="15" fill="#436960">NEW CONNECTION</text>
          <text x="535" y="260" textAnchor="middle" fontSize="15" fill="#826464">CONTINUING CONTACT</text>
          <text x="185" y="288" textAnchor="middle" fontSize="13" fill="#4a7771">A new coworker</text>
          <text x="535" y="288" textAnchor="middle" fontSize="13" fill="#977676">An old school friend</text>
        </g>
      )}
    </svg>
  );
}
