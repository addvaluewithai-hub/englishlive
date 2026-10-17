import { useId } from 'react';
/** L02 meaning-first boards — authored per beat, not recurrent character portraits.
 * Every frame is an instructional semantic diagram, independently indexed by
 * the same scene/beat IDs as actual Otti narration. */
type Mode='listen'|'question'|'phrase'|'exchange'|'contrast'|'number'|'cards'|'transfer';
type Frame={mode:Mode;title:string;items:string[];gloss?:string;footer:string;alt:string};
export const A1_L02_FRAMES:Readonly<Record<string,Frame>> = {
  'listen-first/listen-neutral':{mode:'listen',title:'LISTEN FIRST',items:['♪'],footer:'NO STORY HINTS',alt:'A neutral waveform invites listening without revealing the conversation.'},
  'listen-first/listen-question':{mode:'question',title:'THINK BACK',items:['?'],footer:'ANSWER ONLY AFTER SOUND',alt:'A neutral question without the answer or a form image.'},
  'age-meaning/replay-age':{mode:'listen',title:'HEAR THE AGE EXCHANGE',items:['♪'],footer:'NO SPOKEN ANSWERS SHOWN',alt:'A replay waveform; age sentence remains hidden until heard.'},
  'age-meaning/ask-age':{mode:'phrase',title:'ASK THE AGE',items:['How old are you?'],gloss:'عندك كام سنة؟',footer:'QUESTION → AGE',alt:'How old are you? is the question asking for someone’s age.'},
  'age-meaning/answer-age':{mode:'number',title:'ANSWER WITH AN AGE',items:["I'm",'19','years old'],gloss:'أنا عندي ١٩ سنة',footer:'I AM + AGE + YEARS OLD',alt:'I am nineteen years old, segmented into I am, nineteen and years old.'},
  'age-meaning/two-ages':{mode:'exchange',title:'RETURN THE QUESTION',items:['What about you?',"I'm twenty-one."],gloss:'وإنت؟ · عندي ٢١ سنة',footer:'ASK BACK → SHORT ANSWER',alt:'What about you returns the question; I am twenty-one is a valid shorter response.'},
  'age-meaning/age-choice':{mode:'question',title:'HEAR LEO’S AGE',items:['?'],footer:'LISTEN · THEN CHOOSE',alt:'Remember Leo’s heard age; no number or correct answer is displayed.'},
  'number-patterns/number-hear':{mode:'listen',title:'LISTEN TO THE SOUND',items:['♪'],footer:'HEAR BOTH NUMBERS FIRST',alt:'Listen for stress differences before seeing either candidate digit.'},
  'number-patterns/teen-ty':{mode:'contrast',title:'NUMBER STRESS',items:['thirTEEN','THIRty'],gloss:'13 ≠ 30 · nineTEEN ≠ NINEty',footer:'SOUND + STRESS',alt:'Thirteen has teen stress, while thirty has first syllable stress; nineteen versus ninety works similarly.'},
  'number-patterns/twenty-one':{mode:'number',title:'BUILD A NUMBER',items:['twenty','+ one','= 21'],gloss:'20 + 1 = 21',footer:'ONE HUNDRED = 100',alt:'Twenty and one combine to twenty-one; one hundred is a separate recognition example.'},
  'number-patterns/number-choice':{mode:'question',title:'WHICH NUMBER?',items:['?'],footer:'HEAR THE WORD BEFORE TAPPING',alt:'Listening quiz with no correct number or target word on the board.'},
  'pictured-cards/picture-set':{mode:'cards',title:'READ THE NUMBER CARDS',items:['13','19','90'],footer:'THREE DIFFERENT CARDS',alt:'Three cards labeled 13, 19 and 90 in large readable digits.'},
  'pictured-cards/picture-query':{mode:'cards',title:'WHICH CARD?',items:['13','19','90'],footer:'NONE IS HIGHLIGHTED',alt:'Three unmarked numeric cards; learner answers the separate spoken question.'},
  'voicemail/voicemail-context':{mode:'listen',title:'RECORDED PHONE MESSAGE',items:['♪'],footer:'DIGITS ARE HIDDEN',alt:'Play a real separate recorded message with the digits not shown beforehand.'},
  'voicemail/voicemail-question':{mode:'question',title:'THE LAST TWO DIGITS?',items:['?'],footer:'PLAY AGAIN IF NEEDED',alt:'The learner recalls the last two spoken digits without a displayed answer.'},
  'be-questions/are-you':{mode:'contrast',title:'ASK OR CONFIRM?',items:['How old are you?','Are you nineteen?'],gloss:'السؤال عن السن · تأكيد رقم',footer:'OPEN QUESTION · YES/NO',alt:'Ask an age openly versus confirm if someone is nineteen.'},
  'be-questions/who-is':{mode:'phrase',title:'ASK ABOUT A PERSON',items:['Who is nineteen?'],gloss:'مين عنده 19 سنة؟',footer:'WHO → PERSON',alt:'Who is nineteen? selects the person matching that age.'},
  'be-questions/question-check':{mode:'question',title:'CONFIRM THE NUMBER 19',items:['19','?'],footer:'CHOOSE YOUR OWN QUESTION',alt:'A class card shows 19 without printing the confirmation question answer.'},
  'fresh-speaking/sam-role':{mode:'transfer',title:'FICTIONAL ROLE CARD',items:['24','SAM'],footer:'SAY THE AGE IN YOUR WORDS',alt:'Fictional learner age twenty-four; Sam is the new classmate, no English model answer.'},
  'fresh-speaking/ask-sam':{mode:'transfer',title:'ASK SAM',items:['YOU','SAM'],footer:'INDEPENDENT ENGLISH',alt:'Empty speaking roles invite the learner to ask a real new age question in their own words.'}
};
export function A1L02LearningVisual({sceneId,beatId}:{sceneId:string;beatId:string}) {
  const id=useId().replace(/:/g,'');
  const frame=A1_L02_FRAMES[sceneId+'/'+beatId];
  if (!frame) return <svg className="teacher-lab-visual a1-l02-meaning-board" role="img" viewBox="0 0 360 280" aria-label="No authored board for beat"><rect width="360" height="280" fill="#fff4df"/><text x="180" y="140" textAnchor="middle">Board unavailable</text></svg>;
  const isNeutral=frame.mode==='listen'||frame.mode==='question';
  const itemCount=frame.items.length;
  const tileW=itemCount===3?97:itemCount===2?148:318;
  const start=itemCount===3?20:itemCount===2?24:21;
  const step=itemCount===3?111:itemCount===2?164:0;
  return <svg className="teacher-lab-visual a1-l02-meaning-board" role="img"
    data-l02-learning-board={sceneId+'/'+beatId} viewBox="0 0 360 280" aria-label={frame.alt}
    direction="ltr" style={{fontFamily:'Inter,system-ui,sans-serif',direction:'ltr'}}>
    <title>{frame.alt}</title>
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f6fcf6"/><stop offset="1" stopColor="#e4f5f0"/></linearGradient></defs>
    <rect width="360" height="280" rx="23" fill={'url(#'+id+')'}/>
    <rect x="15" y="14" width="330" height="44" rx="13" fill="#fff"/>
    <text x="180" y="41" fontWeight="800" fontSize={frame.title.length>20?12:15} textAnchor="middle" fill="#166d60">{frame.title}</text>
    {frame.items.map((item,i)=>{
      const x=start+i*step;
      const small=item.length>19?12:item.length>13?15:item.length>8?18:item.length>4?22:frame.mode==='cards'||frame.mode==='transfer'?34:27;
      return <g key={i}>
        <rect x={x} y={81} width={tileW} height="127" rx="18" fill="#fffefb" stroke="#acd8cb" strokeWidth="2"/>
        <rect x={x+4} y="85" width={tileW-8} height="8" rx="4" fill={isNeutral?'#e2f4ec':i%2===0?'#7fcbba':'#ffd29e'}/>
        {frame.mode==='listen'? <path d="M44 150h33v-24h14v48h13v-72h14v90h14v-64h14v37h14v-27h14v26h14v-17h14v20h14v-26h14v20h14v-13h14v15h14v-9h14" stroke="#218d7a" strokeWidth="4" strokeLinecap="round" fill="none"/> :
          <text x={x+tileW/2} y="149" textAnchor="middle" dominantBaseline="middle" fontWeight="800" fontSize={small} fill="#245950">{item}</text>}
      </g>;
    })}
    {frame.mode==='exchange'&&<path d="M175 141h12m-6-5 6 5-6 5" fill="none" stroke="#187f70" strokeWidth="3" strokeLinecap="round"/>}
    {frame.gloss&&<text x="180" y="229" textAnchor="middle" direction="rtl" unicodeBidi="isolate" fontSize={frame.gloss.length>30?11:14} fontWeight="650" fill="#28665c">{frame.gloss}</text>}
    <rect x="16" y="239" width="328" height="30" rx="11" fill="#fff" stroke="#c0dfd6"/>
    <text x="180" y="258" textAnchor="middle" fontSize={frame.footer.length>27?10:12} fontWeight="700" fill="#477c70">{frame.footer}</text>
  </svg>;
}
