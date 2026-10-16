import type { TeachingBeat } from '../b1/teacherLabScript';
import type { SupportBoard } from '../../presentation/types';

/** Spoken A1 lines are written and author-owned. Audio runs after the named beat, before next beat. */
export const A1_LISTENING_BEATS:Readonly<Record<string,readonly TeachingBeat[]>>={
  'first-listen':[
    {id:'scene-set',line:'النهاردة هنتعلم نتعرف على حد لأول مرة بالإنجليزي. هنسمع Maya وLeo بيتقابلوا، من غير ما تحفظ حوار. اسمع بس وركّز: هم بيعملوا إيه؟',board:{type:'note',title:'First meeting',body:'Two people meet for the first time.'},audioClipId:'full-conversation'},
    {id:'big-picture',line:'سمعت Good morning وHi في الأول، وأساميهم، وسؤال How are you؟ وبعدها ودّعوا بعض. دلوقتي اختار الفكرة العامة من اللي سمعته.',board:{type:'steps',title:'Meeting',items:[{title:'Hello',body:'greeting'},{title:'Names',body:'introductions'},{title:'How are you?',body:'wellbeing'}]}},
  ],
  'say-your-name':[
    {id:'listen-again',line:'تعالى نرجع لأول جزئية بس. اسمع Maya وهي بتسأل عن الاسم، وLeo وهو بيرد. هتسمع جملتين مفيدين جدًا.',board:{type:'note',title:'Exchanging names',body:"What's your name?"},audioClipId:'name-exchange'},
    {id:'name-chunk',line:'Maya بدأت بتحية Good morning، يعني صباح الخير. وتقدر تقول Hello أو Hi في التحية العامة. وبعدها قالت I’m Maya، يعني أنا مايا. I’m اختصار طبيعي لـ I am. وLeo قال My name is Leo. دول طريقتين تعرف بيهم اسمك. وتسأل: What’s your name؟',board:{type:'examples',title:'Say your name',items:[{title:"I'm Maya.",body:'I am Maya.'},{title:'My name is Leo.',body:'Leo is my name.'}]}},
    {id:'name-check',line:'دلوقتي افترض إن حد بيسألك What’s your name؟ اختار الرد اللي بيجاوب عن الاسم.',board:{type:'note',title:"What's your name?",body:'Which answer introduces you?'}},
  ],
  'ask-how-are-you':[
    {id:'listen-wellbeing',line:'دلوقتي اسمع الجزء اللي Maya بتسأل فيه: How are you؟ وخد بالك Leo رد عليها إزاي، وسألها هي كمان.',board:{type:'note',title:'How are you?',body:'Listen to the reply.'},audioClipId:'wellbeing-exchange'},
    {id:'wellbeing-meaning',line:'How are you معناها إزيك؟ اسمع Leo وهو بيرد Pretty good, thanks، يعني كويس إلى حد كبير، وبعدها And you؟ يعني وإنت؟ Maya قالت Really good, thank you، يعني كويس جدًا، شكرًا. Pretty good وReally good تعبيرين طبيعيين عن الحال، وThank you وThanks للرد بأدب. وممكن كمان تقول I’m fine أو I’m okay.',board:{type:'examples',title:'How are you?',items:[{title:"Pretty good, thanks.",body:'Positive reply'},{title:"Really good, thank you.",body:'Very positive reply'},{title:'And you?',body:'Ask back politely'}]}},
    {id:'wellbeing-check',line:'كده سمعت Pretty good وReally good، وعرفت إن الاتنين ردود على How are you؟ دلوقتي اختار الرد المناسب من غير ما تنقل الحوار حرفيًا.',board:{type:'note',title:'Choose the reply',body:'How are you?'}},
  ],
  'fresh-meeting':[
    {id:'new-person',line:'دلوقتي دورك تتكلم مع شخص جديد، مش Maya ولا Leo. تخيل إنك وصلت كلاس جديد وقابلت Sam. سلّم عليه، عرفه بنفسك، اسأله عن حاله، ورد بأدب، وبعدها اقفل الكلام بشكل طبيعي. أنا Sam، وهستنى ردك. استخدم تحية واسمك، واسأل عن الحال. لو حابب تقول Pretty good أو Really good أو Thank you بطريقتك هيكون ممتاز، المهم تكون محادثة طبيعية مش حفظ.',board:null},
  ]
};
export const A1_LISTENING_FEEDBACK:Readonly<Record<string,{correct:string;wrong:string}>>={
  'first-listen':{
    correct:'بالضبط! سمعت اتنين بيتقابلوا، بيقولوا أسماءهم، ويسألوا عن الحال. الهدف هنا نفهم الموقف قبل ما نحفظ العبارات.',
    wrong:'المحادثة مش عن التسوق أو الاتجاهات. بدأوا بـ Good morning و What’s your name، وسألوا How are you. يعني كانوا بيتقابلوا ويتعرفوا على بعض.',
  },
  'say-your-name':{
    correct:'تمام! I’m Noor أو My name is Noor الاتنين بيعرّفوا اسمك. لاحظ إن I’m اختصار I am، وده طبيعي في الكلام.',
    wrong:'مش الرد المناسب لسؤال عن الاسم. I’m okay بيجاوب عن الحال، وBye بتنهي الكلام. إنما لو حد سألك What’s your name، تقول I’m Noor.',
  },
  'ask-how-are-you':{
    correct:'مظبوط! I’m fine, thanks رد طبيعي برضه على سؤال الحال، زي Pretty good, thanks اللي سمعناه. وAnd you بترد السؤال بلطف.',
    wrong:'السؤال How are you عن الحال، مش اسمك أو بلدك. الرد المناسب ممكن يكون I’m fine, thanks. And you؟ وفي التسجيل سمعنا Pretty good, thanks.',
  }
};
export type A1LessonBoard = SupportBoard;
