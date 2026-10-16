import type { SceneLessonDefinition } from '../types';
/** A1 U1-L01 pilot is a DIFFERENT, source-accurate ID from old legacy u1l1.ts. */
export const A1_U1_L01_LISTENING_PILOT:SceneLessonDefinition={
  id:'a1-u1-l01-listening-lab',
  levelId:'a1',
  unitId:'a1-u1-first-contact',
  unitTitle:'First Contact: Me and You',
  order:1,
  title:"Hello. I'm … · Listening Classroom",
  subtitle:'Hear a first meeting; learn to greet, exchange names, and ask how someone is.',
  performance:'Greet, exchange names, handle wellbeing and simple politeness in a fresh first meeting.',
  coreLanguage:['Hello / Hi','Good morning',"I'm … / My name is …","What's your name?","How are you?","I'm fine / I'm okay","pretty good / really good","Thanks / Thank you","Bye"],
  boundaries:[
    'Follow A1 Stage 07 U1-L01, not the older broader A1 legacy scene definition.',
    'No age, origin, job, spelling, long numbers, or news-reaction routines; those belong to later lessons.',
    'Explain I am → I’m as a useful conversational chunk. Do not teach a be-conjugation chart.',
    'MC checks listening comprehension only. Final speaking must be a fresh person/context with no script on the board.',
    'Use only the authored clips in listeningAudioPilot.ts; do not invent another recording.',
  ],
  source:{repository:'addvaluewithai-hub/english-course',branch:'main',path:'curriculum/levels/a1/design-review/07-lesson-briefs/lesson-briefs.md',sourceLessonId:'U1-L01'},
  scenes:[
    {
      id:'first-listen',
      title:'Listen to a first meeting',
      goal:'Recognize what two people exchange when they meet for the first time.',
      teaching:{explainInArabic:['Give a very short setup, let the full two-person audio play, then ask one broad comprehension question. Do not preteach answers.'],englishTargets:['Good morning','Hi','How are you?'],constraints:['Keep first listening meaning-focused, no full visible transcript until after listening.']},
      interaction:{kind:'elicitation',setup:'Ask broad comprehension MC after the first listening.',learnerTask:'Choose what the people were doing.',supportLadder:['Replay the full conversation','Explain that they are meeting for the first time']},
      activity:{promptAr:'Maya وLeo كانوا بيتكلموا عن إيه؟',options:[
        {id:'meeting',text:'They meet, say their names, and ask how they are.'},
        {id:'shopping',text:'They are buying something.'},
        {id:'directions',text:'They ask for directions.'},
      ],correctOptionId:'meeting',
      successAr:'تمام! اتقابلوا، عرفوا أسماءهم، وسألوا عن الحال.',
      retryAr:'اسمع البداية: Good morning و What’s your name? دول تحية وتعارف، مش شراء أو اتجاهات.'
      }
    },
    {
      id:'say-your-name',
      title:'Say your name',
      goal:'Recognize I’m / My name is and the question What’s your name?',
      teaching:{explainInArabic:['Replay the two authored name lines; explain natural name chunks in context.'],englishTargets:['Good morning',"I'm Maya.","My name is Leo.","What's your name?"],constraints:['No age/country/job questions','No conjugation tables']},
      interaction:{kind:'micro_practice',setup:'Ask a changed-name choice.',learnerTask:'Choose a natural answer to What’s your name?',supportLadder:['Replay the name exchange','Explain the answer choice with a new example']},
      activity:{promptAr:'لما حد يسألك What’s your name? أنهي رد مناسب؟',options:[
        {id:'name',text:"I'm Noor."},
        {id:'okay',text:"I'm okay, thanks."},
        {id:'bye',text:"Bye!"},
      ],correctOptionId:'name',
      successAr:'بالضبط! I’m Noor معناها أنا نور. ونقدر نقول My name is Noor.',
      retryAr:'السؤال عن الاسم، مش عن الحال أو نهاية الكلام. نقول: I’m Noor أو My name is Noor.'
      }
    },
    {
      id:'ask-how-are-you',
      title:'How are you?',
      goal:'Recognize a polite response to a basic wellbeing question.',
      teaching:{explainInArabic:['Replay the authored wellbeing lines and explain question/answer with thanks and And you?.'],englishTargets:['How are you?','Pretty good, thanks.','Really good, thank you.',"I'm fine, thanks.",'And you?'],constraints:['Stay in short basic wellbeing and politeness','No feelings chart']},
      interaction:{kind:'micro_practice',setup:'Use contextual comprehension MC.',learnerTask:'Choose the answer to How are you?',supportLadder:['Replay wellbeing clip','Contrast answer about how someone is with answer about their name']},
      activity:{promptAr:'Leo سأل عن الحال. أنهي رد طبيعي؟',options:[
        {id:'name',text:"My name is Maya."},
        {id:'fine',text:"I'm fine, thanks. And you?"},
        {id:'place',text:"I'm from Cairo."},
      ],correctOptionId:'fine',
      successAr:'أحسنت! I’m fine, thanks إجابة طبيعية عن الحال، زي Pretty good, thanks وReally good, thank you اللي سمعناهم.',
      retryAr:'How are you? معناها إزيك، فالإجابة عن الحال: I’m fine, thanks. And you?'
      }
    },
    {
      id:'fresh-meeting',
      title:'Your turn · A new person',
      goal:'Independently greet, exchange names, ask how the person is, respond politely and close.',
      teaching:{explainInArabic:['New person and location, NO prior model; talk to Otti as a person arriving for a short course.'],englishTargets:['greeting','name','wellbeing','politeness','closing'],constraints:['No answer-bearing board','Do not count generic Bye loops or nonsense as success','Support and retry if needed']},
      interaction:{kind:'fresh_transfer',setup:'You are Sam, a new person at a community class. Meet the learner, let them ask/say names and wellbeing, then close naturally.',learnerTask:'Have a short first meeting in English with Sam.',teacherMoves:['Wait for user to initiate; invite with a simple greeting if needed','Respond as Sam naturally','Complete only after substantial independent exchange'],supportLadder:['One Arabic functional hint','One key phrase only; then start a changed attempt']},
    }
  ]
};
