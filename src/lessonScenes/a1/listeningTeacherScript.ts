import type { TeachingBeat } from '../b1/teacherLabScript';
import type { SupportBoard } from '../../presentation/types';

/** Spoken A1 lines are written and author-owned. Audio runs after the named beat, before next beat. */
export const A1_LISTENING_BEATS:Readonly<Record<string,readonly TeachingBeat[]>>={
  'first-listen':[
    {id:'scene-set',line:'النهاردة هنتعلم نتعرف على حد لأول مرة بالإنجليزي. هنسمع Maya وLeo بيتقابلوا، من غير ما تحفظ حوار. اسمع بس وركّز: هم بيعملوا إيه؟',board:{type:'note',title:'First meeting',body:'Two people meet for the first time.'},audioClipId:'full-conversation'},
    {id:'big-picture',line:'سمعت تحية في الأول، وأساميهم، وسؤال How are you؟ وبعدها ودّعوا بعض. دلوقتي اختار الفكرة العامة من اللي سمعته.',board:{type:'steps',title:'Meeting',items:[{title:'Hello',body:'greeting'},{title:'Names',body:'introductions'},{title:'How are you?',body:'wellbeing'}]}},
  ],
  'say-your-name':[
    {id:'listen-again',line:'تعالى نرجع لأول جزئية بس. اسمع Maya وهي بتسأل عن الاسم، وLeo وهو بيرد. هتسمع جملتين مفيدين جدًا.',board:{type:'note',title:'Exchanging names',body:"What's your name?"},audioClipId:'name-exchange'},
    {id:'name-chunk',line:'Maya بتقول I’m Maya، يعني أنا مايا. I’m اختصار طبيعي لـ I am. وLeo بيقول My name is Leo. الاتنين طريقة صحيحة تقول بيها اسمك. ولما تسأل حد: What’s your name؟',board:{type:'examples',title:'Say your name',items:[{title:"I'm Maya.",body:'I am Maya.'},{title:'My name is Leo.',body:'Leo is my name.'}]}},
    {id:'name-check',line:'دلوقتي افترض إن حد بيسألك What’s your name؟ اختار الرد اللي بيجاوب عن الاسم.',board:{type:'note',title:"What's your name?",body:'Which answer introduces you?'}},
  ],
  'ask-how-are-you':[
    {id:'listen-wellbeing',line:'دلوقتي اسمع الجزء اللي Maya بتسأل فيه: How are you؟ وخد بالك Leo رد عليها إزاي، وسألها هي كمان.',board:{type:'note',title:'How are you?',body:'Listen to the reply.'},audioClipId:'wellbeing-exchange'},
    {id:'wellbeing-meaning',line:'How are you معناها إزيك؟ وLeo رد: I’m fine, thanks. يعني أنا كويس شكرًا. وبعد كده قال And you؟ يعني وإنت؟ تقدر كمان تقول I’m okay، وردود بسيطة زي دي مناسبة تمامًا.',board:{type:'examples',title:'How are you?',items:[{title:"I'm fine, thanks.",body:'Feeling fine'},{title:"I'm okay.",body:'Feeling okay'},{title:'And you?',body:'Ask back politely'}]}},
    {id:'wellbeing-check',line:'كده انت سمعت جملة عن الحال، وشفت الرد الطبيعي. اختار الإجابة اللي تناسب سؤال How are you؟',board:{type:'note',title:'Choose the reply',body:'How are you?'}},
  ],
  'fresh-meeting':[
    {id:'new-person',line:'دلوقتي دورك تتكلم مع شخص جديد، مش Maya ولا Leo. تخيل إنك وصلت كلاس جديد وقابلت Sam. سلّم عليه، عرفه بنفسك، اسأله عن حاله، ورد بأدب، وبعدها اقفل الكلام بشكل طبيعي. أنا Sam، وهستنى ردك.',board:null},
  ]
};
export const A1_LISTENING_FEEDBACK:Readonly<Record<string,{correct:string;wrong:string}>>={
  'first-listen':{
    correct:'بالضبط! سمعت اتنين بيتقابلوا، بيقولوا أسماءهم، ويسألوا عن الحال. الهدف هنا نفهم الموقف قبل ما نحفظ العبارات.',
    wrong:'المحادثة مش عن التسوق أو الاتجاهات. بدأوا بـ Hello و What’s your name، وسألوا How are you. يعني كانوا بيتقابلوا ويتعرفوا على بعض.',
  },
  'say-your-name':{
    correct:'تمام! I’m Noor أو My name is Noor الاتنين بيعرّفوا اسمك. لاحظ إن I’m اختصار I am، وده طبيعي في الكلام.',
    wrong:'مش الرد المناسب لسؤال عن الاسم. I’m okay بيجاوب عن الحال، وBye بتنهي الكلام. إنما لو حد سألك What’s your name، تقول I’m Noor.',
  },
  'ask-how-are-you':{
    correct:'مظبوط! I’m fine, thanks معناها أنا كويس شكرًا، وAnd you بترد السؤال للطرف التاني بلطف.',
    wrong:'السؤال How are you عن الحال، مش اسمك أو بلدك. الرد المناسب I’m fine, thanks. And you؟',
  }
};
export type A1LessonBoard = SupportBoard;
