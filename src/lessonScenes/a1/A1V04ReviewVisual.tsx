import { useId } from 'react';

/** Bespoke v04 A1 storyboard illustration. This is source-aware visual art,
 * NOT a substitute for the board's selectable/readable text or real-audio QA. */
const VISUALS: Record<string,{heading:string;left:string;right:string;footer:string;alt:string;kind:'voices'|'names'|'feelings'|'paper'|'answer'|'speech'|'speaking'}> = {
  's01-first-listen/neutral-instruction': {heading:'LISTEN FIRST',left:'VOICE 1',right:'VOICE 2',footer:'?',alt:'Two anonymous speakers. Listen before answering.',kind:'voices'},
  's01-first-listen/play-full': {heading:'LISTEN FIRST',left:'VOICE 1',right:'VOICE 2',footer:'♪    ♪    ♪',alt:'An unlabelled conversation is playing. No transcript or answer cues.',kind:'voices'},
  's01-first-listen/gist-choice': {heading:'WHAT DID YOU HEAR?',left:'VOICE 1',right:'VOICE 2',footer:'?',alt:'Think back to the two speakers. The correct choice is not marked.',kind:'voices'},
  's02-greet-names/replay-intro': {heading:'HEAR THEIR NAMES',left:'MAYA',right:'LEO',footer:'♪',alt:'Two speakers replay greetings and names.',kind:'names'},
  's02-greet-names/greet': {heading:'A GREETING',left:'Good morning',right:'Hi!',footer:'HELLO',alt:'Maya greets Leo, and Leo answers Hi.',kind:'names'},
  's02-greet-names/give-name': {heading:'TWO WAYS TO SAY IT',left:"I'm Maya",right:'My name is Leo',footer:"I'm = I am",alt:'Two natural ways to introduce yourself by name.',kind:'names'},
  's02-greet-names/ask-name': {heading:'ASK A NAME',left:"What's your name?",right:'My name is ...',footer:'?',alt:'A name question leads to an identity answer.',kind:'names'},
  's02-greet-names/name-choice': {heading:'CHOOSE THE QUESTION',left:'MAYA',right:'LEO',footer:'?',alt:'Decide which question asks a classmate for their name.',kind:'answer'},
  's03-wellbeing/replay-how': {heading:'LISTEN TO REPLIES',left:'MAYA',right:'LEO',footer:'♪',alt:'Listen before wellbeing answers appear on the illustration.',kind:'voices'},
  's03-wellbeing/how-question': {heading:'HOW ARE YOU?',left:'MAYA',right:'LEO',footer:'?',alt:'A polite wellbeing question invites a reply.',kind:'feelings'},
  's03-wellbeing/two-replies': {heading:'TWO NATURAL REPLIES',left:'Pretty good',right:'Really good',footer:'Thanks / Thank you',alt:'Two distinct positive responses with politeness.',kind:'feelings'},
  's03-wellbeing/feeling-excited': {heading:'FIRST DAY',left:"I'm feeling",right:'excited!',footer:'ENGLISH CLASS',alt:'Leo feels excited about his first class.',kind:'feelings'},
  's03-wellbeing/thank-you': {heading:'BE POLITE',left:'Thanks',right:'And you?',footer:'THANK YOU',alt:'A thank-you and a polite return question.',kind:'feelings'},
  's03-wellbeing/wellbeing-choice': {heading:'HOW DOES SHE FEEL?',left:'MAYA',right:'LEO',footer:'?',alt:'Choose the meaning of a heard wellbeing answer.',kind:'answer'},
  's04-reading-note/read-silently': {heading:'READ YOUR NOTE',left:'WELCOME',right:'YOURSELF',footer:'READ',alt:'A new written welcome note, not a recording transcript.',kind:'paper'},
  's04-reading-note/reading-choice': {heading:'WHO SHOULD DO IT?',left:'READ',right:'THINK',footer:'?',alt:'Use the separate written instruction to answer.',kind:'paper'},
  's05-short-variant/tired-variant': {heading:'ANOTHER REPLY',left:'VOICE',right:'LISTEN',footer:'♪',alt:'Listen to a short alternative reply before seeing its meaning.',kind:'voices'},
  's05-short-variant/tired-choice': {heading:'CHOOSE THE MEANING',left:'HEARD',right:'MEANING',footer:'?',alt:'Select the meaning of a short spoken reply.',kind:'answer'},
  's06-pronunciation/listen-question': {heading:'HEAR THE RHYTHM',left:'How are you?',right:'♪',footer:'LISTEN',alt:'A spoken question has natural rhythm, not a mandated rising pitch contour.',kind:'speech'},
  's06-pronunciation/student-repeat': {heading:'NOW YOUR TURN',left:'LISTEN',right:'SPEAK',footer:'MIC',alt:'Repeat a spoken question and observe pronunciation with the microphone if available.',kind:'speech'},
  's07-new-speaking/new-person': {heading:'MEET SOMEONE NEW',left:'YOU',right:'SAM',footer:'YOUR TURN',alt:'A new person is ready. No target answers are written.',kind:'speaking'},
  's07-new-speaking/changed-moments': {heading:'A NEW MOMENT',left:'BEFORE CLASS',right:'AFTER CLASS',footer:'YOUR WORDS',alt:'Two changed situations without prescribed target wording.',kind:'speaking'},
};

export function A1V04ReviewVisual({sceneId,beatId}:{sceneId:string;beatId:string}) {
  const gradientId=useId().replace(/:/g,'');
  const key=sceneId+'/'+beatId;
  const item=VISUALS[key] ?? {heading:'LISTEN & LEARN',left:'YOU',right:'OTTI',footer:'REVIEW',alt:'Visual for the reviewed English lesson.',kind:'voices' as const};
  const paper=item.kind==='paper';
  const isSpeaking=item.kind==='speaking';
  const isNeutral=item.kind==='voices'||item.kind==='answer';
  return <svg className="teacher-lab-visual a1-audio-board-art" viewBox="0 0 360 294" role="img" aria-label={item.alt}
    direction="ltr" style={{direction:'ltr',fontFamily:'Inter,system-ui,sans-serif'}}>
    <title>{item.alt}</title>
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#edf9f5"/><stop offset="1" stopColor="#def4f6"/></linearGradient></defs>
    <rect x="0" y="0" width="360" height="294" rx="24" fill={`url(#${gradientId})`}/>
    <rect x="12" y="13" width="336" height="37" rx="12" fill="#ffffff" opacity=".94"/>
    <text x="180" y="37" textAnchor="middle" fill="#196f63" fontSize="14" fontWeight="800">{item.heading}</text>
    {paper ? <>
      <rect x="91" y="60" width="178" height="141" rx="9" fill="#fff" stroke="#81c6bb" strokeWidth="3"/>
      <path d="M112 88h135M112 107h107M112 126h131M112 145h91M112 164h121" stroke="#91c5bc" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="245" cy="176" r="13" fill="#1e8d7c"/><path d="m239 176 5 5 8-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/>
    </> : <>
      <g>
        <circle cx="94" cy="117" r="47" fill="#fff" opacity=".86"/>
        <circle cx="266" cy="117" r="47" fill="#fff" opacity=".86"/>
        <path d="M57 175q4-48 37-48t37 48" fill={isNeutral?'#8ebeb5':'#f18e9e'}/>
        <path d="M229 175q4-48 37-48t37 48" fill={isNeutral?'#8ebeb5':'#4eb6a3'}/>
        <circle cx="94" cy="110" r="28" fill="#e5b38f"/><circle cx="266" cy="110" r="28" fill="#c5a080"/>
        <path d="M74 99q20-26 40 0M246 99q20-26 40 0" fill="none" stroke="#4f625d" strokeWidth="7" strokeLinecap="round"/>
        <circle cx="85" cy="114" r="2.5" fill="#374a45"/><circle cx="103" cy="114" r="2.5" fill="#374a45"/>
        <circle cx="257" cy="114" r="2.5" fill="#374a45"/><circle cx="275" cy="114" r="2.5" fill="#374a45"/>
        <path d="M86 126q8 6 16 0M258 126q8 6 16 0" stroke="#745d53" fill="none" strokeWidth="2"/>
        <path d="M148 108h64m-13-9 13 9-13 9" fill="none" stroke="#449c8f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>}
    <rect x="18" y="208" width="324" height="67" rx="16" fill="#fff" stroke="#b5dfd4" strokeWidth="2"/>
    <text x="95" y="235" textAnchor="middle" fill="#225e57" fontSize={item.left.length>17?10:13} fontWeight="750">{item.left}</text>
    <text x="264" y="235" textAnchor="middle" fill="#225e57" fontSize={item.right.length>17?10:13} fontWeight="750">{item.right}</text>
    <path d="M178 219v20" stroke="#b5dfd4" strokeWidth="2"/>
    <text x="180" y="260" textAnchor="middle" fill="#5e827a" fontWeight="650" fontSize="11">{item.footer}</text>
    {isSpeaking&&<circle cx="180" cy="180" r="10" fill="#e4f6f0" stroke="#358c79" strokeDasharray="3 3"/>}
  </svg>;
}
