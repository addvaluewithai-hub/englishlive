import type { SceneLessonDefinition } from '../types';

export const A1_U1_L02_SCENE_LESSON: SceneLessonDefinition = {
  id: 'a1-u1-l02-how-old-are-you',
  levelId: 'a1',
  unitId: 'a1-u1-first-contact',
  unitTitle: 'First Connections',
  order: 2,
  title: 'Understand an Introduction',
  subtitle: 'Listen for who the person is and capture the main personal details without a transcript.',
  performance: "From a fresh clear spoken introduction, identify the person, their name, and three essential personal details after two full listens without a transcript.",
  coreLanguage: [
    "I'm Alex.",
    "I'm from Canada.",
    'I live in Cairo.',
    "I'm an engineer.",
    'This is Omar.',
    "He's a student.",
    "She's a teacher.",
    "I'm / He's / She's",
  ],
  boundaries: [
    'This is primarily a listening-comprehension lesson, not a self-introduction production lesson.',
    'Use I, he, and she to establish whose information is being described; do not teach the full pronoun paradigm.',
    'Introduce present be only inside clear identity, role, state, and location chunks.',
    "Learners should recognise I'm, he's, and she's in clear slow connected speech; do not require fast reduced-speech listening.",
    'Do not use a visible transcript during the listening attempts.',
  ],
  source: {
    repository: 'addvaluewithai-hub/english-course',
    branch: 'curriculum/level-source-of-truth-v1',
    path: 'units/a1-v1/unit-01-first-connections/lessons/u1-l02',
    sourceLessonId: 'U1-L02',
  },
  scenes: [
    {
      id: 'gist-before-detail',
      title: 'Listen for the big picture first',
      goal: 'The learner can use a first listen for the person/topic and a second listen for details.',
      teaching: {
        explainInArabic: [
          'اشرح استراتيجية السماع: أول مرة ما نحاولش نمسك كل كلمة؛ نعرف مين بيتكلم ونوع المعلومات. المرة الثانية نركز على التفاصيل.',
          'قدّم تقديمًا صوتيًا قصيرًا وواضحًا من غير ما تعرض النص المكتوب.',
        ],
        englishTargets: ["Hi. I'm Alex.", "I'm from Canada.", 'I live in Cairo.', "I'm an engineer."],
        constraints: ['Speak the model; do not put the full transcript on the board.', 'Use two complete listens rather than line-by-line dictation.'],
      },
      board: {
        type: 'examples',
        title: 'Two listens',
        items: [{ title: '1st listen', body: 'Who? What kind of information?' }, { title: '2nd listen', body: 'Name + three details' }],
      },
      interaction: {
        kind: 'elicitation',
        setup: 'Deliver one short spoken introduction twice. After the first listen ask for person/topic; after the second ask for the main detail types.',
        learnerTask: 'First tell me who/what the message is about. Then listen again and tell me the main details.',
        supportLadder: ['Repeat the complete introduction once at the same clear speed.', 'Give blank detail labels only: name / origin / location / role.', 'After the attempt, reveal one missed detail and use a new introduction for the retry.'],
      },
    },
    {
      id: 'detail-types',
      title: 'Recognise the kind of information',
      goal: 'The learner can recognise name, country/origin, city/location, and job/role as information types.',
      teaching: {
        explainInArabic: [
          'وضح إنك مش محتاج تترجم كل كلمة؛ اسمع نوع المعلومة: اسم، بلد/أصل، مدينة/مكان، وظيفة.',
          'استخدم جمل present be وlive في chunks كاملة من غير جدول قواعد.',
        ],
        englishTargets: ["I'm Alex.", "I'm from Canada.", 'I live in Cairo.', "I'm an engineer."],
        constraints: ['Keep vocabulary familiar and limited.', 'Do not teach country/city lists or job vocabulary as separate lists.'],
      },
      board: {
        type: 'examples',
        title: 'Listen for detail types',
        items: [{ title: 'name' }, { title: 'country / origin' }, { title: 'city / location' }, { title: 'job / role' }],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Say four short chunks in mixed order and ask the learner to identify the information type, not translate every word.',
        learnerTask: 'For each sentence, tell me what kind of detail it gives.',
        supportLadder: ['Repeat the whole chunk.', 'Offer two detail-type choices.', 'Give one matched example, then use a new chunk.'],
      },
    },
    {
      id: 'who-is-it-about',
      title: 'Track I, he, and she',
      goal: 'The learner can attribute a detail to the speaker or to another named person.',
      teaching: {
        explainInArabic: [
          'اشرح إن I معناها إن المتكلم بيتكلم عن نفسه، وhe أو she معناها إن المعلومة تخص شخصًا آخر مذكورًا.',
          'أكد إن المعلومة ممكن تكون صحيحة لكن منسوبة للشخص الغلط، وده خطأ في المعنى.',
        ],
        englishTargets: ["I'm from Canada.", "This is Omar. He's a student.", "This is Lina. She's a teacher."],
        constraints: ['Do not expand to all English pronouns.', 'Keep referents explicit and concrete.'],
      },
      board: {
        type: 'compare',
        title: 'Whose information?',
        left: { title: 'I / I’m', body: 'the speaker' },
        right: { title: 'he / she', body: 'another person' },
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Say short self- and third-person introduction chunks and ask whose information each sentence describes.',
        learnerTask: 'Tell me: is this about the speaker or the other person?',
        supportLadder: ['Repeat the name and pronoun clearly.', 'Point to speaker vs other person.', 'Model one referent match, then test a fresh sentence.'],
      },
    },
    {
      id: 'hear-contractions',
      title: 'Hear common contractions',
      goal: "The learner can recognise I'm, he's, and she's as I am, he is, and she is in clear speech.",
      teaching: {
        explainInArabic: [
          "خلّي المتعلم يسمع I'm وhe's وshe's كوحدات شائعة، واربط كل واحدة بالمعنى الكامل من غير شرح تصريف شامل.",
        ],
        englishTargets: ["I'm → I am", "He's → He is", "She's → She is"],
        constraints: ['Recognition is the target; perfect productive control is not required.', 'Keep speech clear and A1-paced.'],
      },
      board: { type: 'examples', title: 'Hear the short forms', items: [{ title: "I'm", body: 'I am' }, { title: "He's", body: 'He is' }, { title: "She's", body: 'She is' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Say a few short chunks with contractions and ask the learner to identify the full meaning/referent.',
        learnerTask: 'Match each short form to its full meaning and person.',
        supportLadder: ['Say the contraction in a full sentence.', 'Show the three written contraction choices.', 'Match one example, then use a different sentence.'],
      },
    },
    {
      id: 'guided-fresh-listen',
      title: 'Capture a new introduction in two listens',
      goal: 'The learner can recover a name and three personal details from a new clear introduction with field-label support only.',
      teaching: {
        explainInArabic: ['قول إنك هتسمع رسالة جديدة مرتين. في الآخر سجل الاسم وثلاث معلومات. مفيش transcript لأن الهدف إننا نفهم من السماع.'],
        englishTargets: ['fresh spoken introduction', 'name', 'origin', 'location', 'role'],
        constraints: ['Use a new person and changed detail order.', 'No transcript or answer-bearing picture.', 'Allow two complete plays.'],
      },
      board: {
        type: 'examples',
        title: 'Capture',
        items: [{ title: 'name' }, { title: 'detail 1' }, { title: 'detail 2' }, { title: 'detail 3' }],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Create a fresh fictional introduction with a new name/place/role. Deliver it twice in full, then ask for the four captured fields.',
        learnerTask: 'Listen twice. Give me the name and three details you understood.',
        teacherMoves: ['Use the first pass for gist and the second for detail.', 'Accept concise captured facts rather than requiring full sentences.'],
        supportLadder: ['Repeat the full message once more only during guided practice.', 'Name the missing detail type without giving its value.', 'Reveal the missed value only after the attempt, then use a new message for retry.'],
      },
    },
    {
      id: 'fresh-introduction-listen',
      title: 'Fresh listening mastery',
      goal: 'The learner can identify the correct person, name, and three facts from a new spoken introduction without a transcript.',
      teaching: {
        explainInArabic: ['اعمل setup فقط: عضو جديد بعت voice introduction لمجموعة دراسة. هتسمع الرسالة مرتين وتطلع الاسم وثلاث معلومات.'],
        englishTargets: ['correct person', 'name', 'three personal details'],
        constraints: [
          'Two complete plays only before the response; no transcript or answer-bearing visual.',
          'Change voice/person, places, role, and detail order from guided practice.',
          'A third-person introduction is valid as a replacement task.',
          'If answer-revealing help is required, use a new message before judging mastery.',
        ],
      },
      interaction: {
        kind: 'fresh_transfer',
        setup: 'Deliver a brand-new fictional voice-style introduction. The learner gets two full listens and blank field labels only.',
        learnerTask: 'Tell me who the information is about, the name, and three personal details.',
        teacherMoves: ['Deliver the same fresh message twice without inserting hints between lines.', 'Do not confirm individual details until the learner gives the complete capture.'],
        supportLadder: ['Give only the blank field labels.', 'Remind the learner to use I/he/she to track the person without revealing an answer.', 'If an answer must be revealed, switch to a new introduction and treat the previous attempt as practice.'],
      },
    },
  ],
};
