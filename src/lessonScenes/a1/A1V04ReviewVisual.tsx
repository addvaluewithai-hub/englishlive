import { useId, type ReactNode } from 'react';

/**
 * Content-led A1 v04 board.
 *
 * Each authored teaching beat uses one semantic representation of its learning
 * target. No two-person portrait loop and no keyed answer leakage on first listen
 * or when a quiz is awaiting an independent response.
 */
type Mode = 'listen'|'check'|'phrase'|'exchange'|'contrast'|'note'|'rhythm'|'transfer';
type BoardFrame = {
  mode:Mode; title:string; alt:string;
  primary?:string; secondary?:string;
  left?:string; right?:string; leftHint?:string; rightHint?:string;
  footer?:string;
};

/** Typed, keyed to the actual A1 v04 authored beat IDs, not a repeated scene drawing. */
export const A1_V04_CONTENT_FRAMES:Readonly<Record<string,BoardFrame>> = {
  's01-first-listen/neutral-instruction':{
    mode:'listen',title:'LISTEN FIRST',primary:'Listen · Notice',secondary:'اسمع الأول، وبعدين اختار',footer:'NO TRANSCRIPT YET',
    alt:'A listening waveform only. No clues about who is speaking or why.'
  },
  's01-first-listen/play-full':{
    mode:'listen',title:'HEAR THE CONVERSATION',primary:'Listen to the whole audio',footer:'FIRST LISTEN',
    alt:'Neutral listening waveform, with no story or answer revealed during the recording.'
  },
  's01-first-listen/gist-choice':{
    mode:'check',title:'YOUR LISTENING CHECK',primary:'What happened?',secondary:'اختار المعنى من اللي سمعته',footer:'THINK · THEN CHOOSE',
    alt:'An unmarked listening question; the answer is not shown.'
  },
  's02-greet-names/replay-intro':{
    mode:'listen',title:'HEAR THE FIRST LINES',primary:'Listen again',footer:'GREETING + NAMES',
    alt:'Replay cue without giving the exact source expressions before the replay.'
  },
  's02-greet-names/greet':{
    mode:'exchange',title:'START A CONVERSATION',left:'Good morning!',right:'Hi!',leftHint:'تحية الصبح',rightHint:'رد بسيط',footer:'GREETING → REPLY',
    alt:'Good morning means a morning greeting; Hi is a natural friendly answer.'
  },
  's02-greet-names/give-name':{
    mode:'contrast',title:'SAY YOUR NAME',left:"I'm Maya.",right:'My name is Leo.',leftHint:"I'm = I am",rightHint:'أنا اسمي',footer:'TWO NATURAL WAYS',
    alt:'Compare I am Maya and My name is Leo as two natural ways to introduce a name.'
  },
  's02-greet-names/ask-name':{
    mode:'exchange',title:'ASK → ANSWER',left:"What's your name?",right:"I'm ...",leftHint:'سؤال الاسم',rightHint:'الإجابة: اسمك',footer:'QUESTION → NAME',
    alt:'What is your name asks about identity, and I am followed by a name answers it.'
  },
  's02-greet-names/name-choice':{
    mode:'check',title:'YOUR TURN TO CHOOSE',primary:'Which question?',footer:'NO ANSWER SHOWN',
    alt:'An unmarked choice about which question asks for a name; the correct question is not displayed.'
  },
  's03-wellbeing/replay-how':{
    mode:'listen',title:'HEAR TWO REPLIES',primary:'Listen for the difference',footer:'NO REPLIES ON BOARD YET',
    alt:'A neutral replay waveform before either wellbeing reply is shown.'
  },
  's03-wellbeing/how-question':{
    mode:'phrase',title:'ASK ABOUT FEELINGS',primary:'How are you?',secondary:'إزيك؟',footer:'A WELLBEING QUESTION',
    alt:'How are you is a polite question about how someone is feeling.'
  },
  's03-wellbeing/two-replies':{
    mode:'contrast',title:'TWO POSITIVE REPLIES',left:'Pretty good',right:'Really good',leftHint:'كويس إلى حد كبير',rightHint:'كويس جدًا',footer:'BOTH ARE NATURAL',
    alt:'Pretty good is fairly good; Really good is very good, both natural wellbeing answers.'
  },
  's03-wellbeing/feeling-excited':{
    mode:'phrase',title:'TALK ABOUT A FEELING',primary:"I'm feeling excited!",secondary:'أنا حاسس بحماس',footer:'feeling + excited',
    alt:'I am feeling excited expresses enthusiasm about a new experience.'
  },
  's03-wellbeing/thank-you':{
    mode:'exchange',title:'KEEP IT POLITE',left:'Thanks!',right:'And you?',leftHint:'Thank you = شكرًا',rightHint:'وإنت؟',footer:'THANK → ASK BACK',
    alt:'Thanks or Thank you expresses politeness, and And you returns the question.'
  },
  's03-wellbeing/wellbeing-choice':{
    mode:'check',title:'LISTENING MEANING',primary:'What did she mean?',footer:'CHOOSE YOUR ANSWER',
    alt:'A listening meaning check with no preselected or revealed response.'
  },
  's04-reading-note/read-silently':{
    mode:'note',title:'READ A NEW NOTE',primary:'Read it yourself',footer:'THE REAL NOTE IS BELOW',
    alt:'A classroom note reading task; the full, selectable English text appears below this graphic.'
  },
  's04-reading-note/reading-choice':{
    mode:'note',title:'USE THE WRITTEN NOTE',primary:'Read → Think → Choose',footer:'LOOK AT THE TEXT BELOW',
    alt:'Use the original written note below when deciding who should introduce themselves.'
  },
  's05-short-variant/tired-variant':{
    mode:'listen',title:'HEAR ANOTHER ANSWER',primary:'Listen to the sentence',footer:'MEANING AFTER LISTENING',
    alt:'A neutral listening cue for a new wellbeing reply; no pre-answer emotion clue.'
  },
  's05-short-variant/tired-choice':{
    mode:'check',title:'LISTENING MEANING',primary:'What does it mean?',footer:'THINK · THEN CHOOSE',
    alt:'Choose the heard sentence meaning with no visual cue about the correct emotion.'
  },
  's06-pronunciation/listen-question':{
    mode:'rhythm',title:'HEAR THE QUESTION',primary:'How are you?',secondary:'Listen to the real rhythm',footer:'DO NOT ASSUME RISING PITCH',
    alt:'The phrase How are you split into spoken words for rhythm listening, not a fake pitch measurement.'
  },
  's06-pronunciation/student-repeat':{
    mode:'rhythm',title:'TRY IT OUT LOUD',primary:'How are you?',secondary:'اسمع · قول · جرّب تاني',footer:'A REAL SPOKEN ATTEMPT',
    alt:'Repeat How are you aloud, after hearing a real example. Saying it is required for pronunciation evidence.'
  },
  's07-new-speaking/new-person':{
    mode:'transfer',title:'MEET SOMEONE NEW',left:'YOU',right:'SAM',footer:'SPEAK IN YOUR OWN WORDS',
    alt:'New classmate Sam is ready. The board intentionally gives no target sentence to copy.'
  },
  's07-new-speaking/changed-moments':{
    mode:'transfer',title:'TWO NEW MOMENTS',left:'BEFORE CLASS',right:'AFTER CLASS',footer:'ANSWER NATURALLY',
    alt:'Different before-class and after-class situations without suggested English responses.'
  }
};

const INK='#214e49',GREEN='#18786c',MUTED='#537d76',LINE='#b4dcd1',BGCARD='#fffefb';

/** Text is untruncated and displayed against high-contrast surfaces. */
function BoardText({x,y,children,size=20,color=INK,weight=800,rtl=false}:
  {x:number;y:number;children:string;size?:number;color?:string;weight?:number;rtl?:boolean}) {
  return <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
    fontSize={size} fontWeight={weight} fill={color}
    direction={rtl?'rtl':'ltr'} unicodeBidi="isolate">{children}</text>;
}
function Card({x,w=318,accent='#e0f6ef',children,y=81,h=111}:
  {x:number;w?:number;accent?:string;children:ReactNode;y?:number;h?:number}) {
  return <g><rect x={x} y={y} width={w} height={h} rx={20} fill={BGCARD} stroke={LINE} strokeWidth="2"/>
    <rect x={x+3} y={y+3} width={w-6} height={7} rx={4} fill={accent}/>{children}</g>;
}

export function A1V04ReviewVisual({sceneId,beatId}:{sceneId:string;beatId:string}) {
  const id=useId().replace(/:/g,'');
  const key=sceneId+'/'+beatId;
  const frame=A1_V04_CONTENT_FRAMES[key];
  // Fail closed for unknown authoring beats: never display another beat's answer.
  if (!frame) return <svg className="teacher-lab-visual a1-audio-board-art" viewBox="0 0 360 280"
    role="img" aria-label="Lesson board state not authored" data-v04-learning-board={key}>
      <rect width="360" height="280" rx="20" fill="#fff6ed"/>
      <text x="180" y="130" textAnchor="middle" fontSize="16" fill="#7c3f33">Board content unavailable</text>
    </svg>;
  const isComparison=frame.mode==='contrast'||frame.mode==='exchange';
  const isBlank=frame.mode==='listen'||frame.mode==='check';
  return <svg className="teacher-lab-visual a1-audio-board-art a1-v04-learning-visual" viewBox="0 0 360 280"
    role="img" aria-label={frame.alt} data-v04-learning-board={key}
    direction="ltr" style={{direction:'ltr',fontFamily:'Inter,system-ui,sans-serif'}}>
    <title>{frame.alt}</title>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f4fcf8"/><stop offset="1" stopColor="#dff1ed"/></linearGradient>
    </defs>
    <rect width="360" height="280" rx="23" fill={'url(#'+id+')'}/>
    <rect x="15" y="14" width="330" height="42" rx="13" fill="#fff" fillOpacity=".95"/>
    <BoardText x={180} y={36} size={14} color={GREEN}>{frame.title}</BoardText>
    {isBlank && <>
      <Card x={21} y={73} h={139}>
        {frame.mode==='listen'?<>
          <path d="M69 144h16v-14h11v31h13v-49h12v60h13v-74h13v80h12v-58h14v42h12v-27h12v23h13v-15h12v13h14"
            fill="none" stroke={GREEN} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="180" cy="103" r="15" fill="#d5f2e8" stroke={LINE}/>
          <path d="m176 96 13 8-13 8Z" fill={GREEN}/>
        </>:<>
          <circle cx="180" cy="132" r="43" fill="#e7f6f0"/>
          <BoardText x={180} y={129} size={52} color={GREEN}>?</BoardText>
          <path d="M97 181h166" stroke={LINE} strokeWidth="4" strokeLinecap="round"/>
        </>}
        <BoardText x={180} y={195} size={frame.primary?.length&&frame.primary.length>24?12:15}>{frame.primary||''}</BoardText>
      </Card>
    </>}
    {frame.mode==='phrase' && <Card x={21} y={73} h={139}>
      <BoardText x={180} y={124} size={frame.primary && frame.primary.length>21?21:27} color={GREEN}>{frame.primary||''}</BoardText>
      <path d="M82 150h196" stroke={LINE} strokeWidth="2"/>
      <BoardText x={180} y={175} size={20} weight={750} rtl>{frame.secondary||''}</BoardText>
    </Card>}
    {isComparison && <>
      <Card x={17} w={157} y={77} h={137} accent="#caf0e1">
        <BoardText x={95} y={127} size={frame.left&&frame.left.length>16?14:frame.left&&frame.left.length>11?17:20} color={GREEN}>{frame.left||''}</BoardText>
        <path d="M35 157h120" stroke={LINE} strokeWidth="2"/>
        <BoardText x={95} y={181} size={frame.leftHint&&frame.leftHint.length>15?12:14} weight={700} rtl>{frame.leftHint||''}</BoardText>
      </Card>
      <path d="M174 143h12m-6-6 6 6-6 6" fill="none" stroke={GREEN} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Card x={187} w={157} y={77} h={137} accent="#ffe1b5">
        <BoardText x={265} y={127} size={frame.right&&frame.right.length>16?14:frame.right&&frame.right.length>11?17:20} color={INK}>{frame.right||''}</BoardText>
        <path d="M206 157h119" stroke={LINE} strokeWidth="2"/>
        <BoardText x={265} y={181} size={frame.rightHint&&frame.rightHint.length>15?12:14} weight={700} rtl>{frame.rightHint||''}</BoardText>
      </Card>
    </>}
    {frame.mode==='note'&&<Card x={21} y={73} h={139}>
      <path d="M116 92h111l21 21v80H116Z" fill="#fefcf5" stroke={GREEN} strokeWidth="2.5"/>
      <path d="M227 92v21h21" fill="none" stroke={GREEN} strokeWidth="2"/>
      <path d="M132 125h92m-92 12h79m-79 12h92" stroke={LINE} strokeWidth="4" strokeLinecap="round"/>
      <BoardText x={180} y={177} size={14} color={GREEN}>{frame.primary||''}</BoardText>
    </Card>}
    {frame.mode==='rhythm' && <Card x={21} y={73} h={139}>
      {['How','are','you?'].map((word,i)=><g key={word}>
        <rect x={38+i*98} y="113" width="88" height="59" rx="16" fill={i===0?'#def5e8':'#e9f5f1'} stroke={LINE} strokeWidth="2"/>
        <BoardText x={82+i*98} y={143} size={23} color={GREEN}>{word}</BoardText>
      </g>)}
      <BoardText x={180} y={192} size={13} color={MUTED}>{frame.secondary||''}</BoardText>
    </Card>}
    {frame.mode==='transfer'&&<>
      <Card x={18} y={81} w={155} h={117}>
        <BoardText x={95} y={122} size={frame.left&&frame.left.length>11?15:24} color={GREEN}>{frame.left||''}</BoardText>
        <path d="M59 158h71" stroke={LINE} strokeWidth="4" strokeLinecap="round"/>
      </Card>
      <Card x={187} y={81} w={155} h={117}>
        <BoardText x={264} y={122} size={frame.right&&frame.right.length>11?15:24} color={GREEN}>{frame.right||''}</BoardText>
        <path d="M230 158h71" stroke={LINE} strokeWidth="4" strokeLinecap="round"/>
      </Card>
      <path d="M173 140h14m-6-6 6 6-6 6" stroke={GREEN} strokeWidth="2.7" fill="none" strokeLinecap="round"/>
    </>}
    <rect x="19" y="226" width="322" height="37" rx="12" fill="#fff" stroke={LINE}/>
    <BoardText x={180} y={245} size={frame.footer&&frame.footer.length>27?11:13} color={MUTED} weight={750}>{frame.footer||'LEARN WITH OTTI'}</BoardText>
  </svg>;
}

/** HTML, not inaccessible fake lines inside an SVG, for an independent reading check. */
export function A1V04ReadingNote({text}:{text:string}) {
  const lines=text.split('\n').map(x=>x.trim()).filter(Boolean);
  return <section className="a1-v04-readable-note" lang="en" dir="ltr" aria-label="English classroom note to read yourself">
    <strong>{lines[0]}</strong>
    {lines.slice(1).map((line,i)=><p key={i}>{line}</p>)}
  </section>;
}
