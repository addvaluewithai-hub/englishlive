import type { SceneLessonDefinition } from '../types';

export const A1_U1_L01_SCENE_LESSON: SceneLessonDefinition = {
  id: 'a1-u1-l01-hello-im',
  levelId: 'a1',
  unitId: 'a1-u1-first-contact',
  unitTitle: 'First Connections',
  order: 1,
  title: 'Start and End a Conversation',
  subtitle: 'Open a short social exchange, ask how someone is, react appropriately, and close naturally.',
  performance: 'Complete one fresh four-move social exchange: greeting, wellbeing question, fitting reaction, and closing.',
  coreLanguage: [
    'Hi. / Hello. / Good morning.',
    'How are you?',
    "I'm fine, thanks. / I'm okay. / I'm tired.",
    "That's good. / Oh, I'm sorry. / And you?",
    'Goodbye. / Bye. / See you soon.',
  ],
  boundaries: [
    'Keep the repertoire small: greeting, wellbeing, feeling, reaction, and closing only.',
    "Treat I'm as a frequent natural contraction; do not teach the full present-be paradigm.",
    'Practise thanks/that’s only for intelligibility; do not turn pronunciation into accent correction.',
    'Do not introduce personal-detail questions, names, age, country, job, or free discussion of emotions.',
    'The final scene must be a fresh exchange with no answer-bearing model before the first attempt.',
  ],
  source: {
    repository: 'addvaluewithai-hub/english-course',
    branch: 'curriculum/level-source-of-truth-v1',
    path: 'units/a1-v1/unit-01-first-connections/lessons/u1-l01',
    sourceLessonId: 'U1-L01',
  },
  scenes: [
    {
      id: 'exchange-shape',
      title: 'See the shape of a short conversation',
      goal: 'The learner can identify the three stages: greeting, wellbeing exchange, and closing.',
      teaching: {
        explainInArabic: [
          'اشرح إن المحادثة القصيرة هنا لها شكل بسيط: نبدأ بتحية، نسأل عن الحال ونتفاعل مع الرد، وبعدها نقفل الكلام بشكل طبيعي.',
          'أكد إن المطلوب مش حفظ حوار ثابت؛ المطلوب فهم وظيفة كل جزء.',
        ],
        englishTargets: ['Hi.', 'How are you?', 'Bye.'],
        constraints: ['Do not introduce personal details.', 'Keep this as meaning and sequence, not grammar.'],
      },
      board: {
        type: 'examples',
        title: 'A short social exchange',
        items: [
          { title: '1. Hi / Hello', body: 'open' },
          { title: '2. How are you?', body: 'wellbeing exchange' },
          { title: '3. Bye / See you soon', body: 'close' },
        ],
      },
      interaction: {
        kind: 'elicitation',
        setup: 'Give the three moves out of order and ask the learner to put them in a natural order.',
        learnerTask: 'Put greeting, wellbeing exchange, and closing in the natural order.',
        supportLadder: ['قل بالعربي: بنبدأ بإيه وبنقفل بإيه؟', 'Point to the three board stages.', 'Model the first stage only, then ask the learner to finish the order.'],
      },
    },
    {
      id: 'wellbeing',
      title: 'Ask and answer How are you?',
      goal: 'The learner can ask How are you? and understand a small set of simple wellbeing answers.',
      teaching: {
        explainInArabic: [
          'علّم How are you? كسؤال اجتماعي بسيط، وبعدها قدّم عدد صغير من الردود: fine, okay, tired.',
          "اشرح إن I'm اختصار طبيعي لـ I am، والشكلين مقبولين.",
        ],
        englishTargets: ['How are you?', "I'm fine, thanks.", "I'm okay.", "I'm tired."],
        constraints: ['Do not open a large feelings vocabulary list.', 'Accept another simple intelligible wellbeing answer.'],
      },
      board: {
        type: 'examples',
        title: 'How are you?',
        items: [{ title: "I'm fine, thanks." }, { title: "I'm okay." }, { title: "I'm tired." }],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Ask How are you? naturally, then switch roles and let the learner ask you.',
        learnerTask: 'Answer How are you?, then ask me the same question.',
        supportLadder: ['Repeat the question slowly.', "Give only 'I'm…' for the answer.", "Give only 'How are…' for the question, then retry."],
      },
    },
    {
      id: 'fitting-reaction',
      title: 'React to the meaning',
      goal: 'The learner can choose a reaction that fits positive or negative wellbeing news.',
      teaching: {
        explainInArabic: [
          "وضح إن الرد المناسب أهم من طول الرد: لو الشخص قال I'm great ينفع That's good، ولو قال I'm tired ينفع Oh, I'm sorry.",
          'قدّم And you? كطريقة قصيرة ترجع السؤال للطرف الآخر.',
        ],
        englishTargets: ["That's good.", "Oh, I'm sorry.", 'And you?'],
        constraints: ['Do not teach a general emotion system.', 'Meaning fit matters more than exact wording.'],
      },
      board: {
        type: 'compare',
        title: 'Match the reaction',
        left: { title: "I'm great.", body: "That's good." },
        right: { title: "I'm tired.", body: "Oh, I'm sorry." },
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give two short wellbeing statements, one positive and one negative, and ask for fitting reactions.',
        learnerTask: 'React naturally to each short wellbeing statement.',
        supportLadder: ['قل بالعربي: الخبر كويس ولا مش كويس؟', 'Point to the matching side of the board.', 'Offer the first word of the fitting reaction, then retry with a new feeling.'],
      },
    },
    {
      id: 'social-pronunciation',
      title: 'Keep key social words clear',
      goal: "The learner can recognise I'm and keep selected social words intelligible without accent correction.",
      teaching: {
        explainInArabic: [
          "خلّي المتعلم يسمع I'm كوحدة واحدة بدل فصل I وam.",
          "في thanks وthat's ركز فقط إن الكلمة تفضل مفهومة؛ لا تطلب تغيير اللهجة.",
        ],
        englishTargets: ["I'm", 'thanks', "that's"],
        constraints: ['Correct only if meaning becomes unclear.', 'No phonetics lecture or accent-removal framing.'],
      },
      board: { type: 'examples', title: 'Hear the chunks', items: [{ title: "I'm", body: 'I am' }, { title: 'thanks' }, { title: "that's" }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Use the target words inside short social phrases and check recognition and one clear production.',
        learnerTask: 'Say one short social phrase clearly enough to be understood.',
        supportLadder: ['Repeat the whole phrase more slowly.', 'Isolate the key word once.', 'Return immediately to the full phrase and retry.'],
      },
    },
    {
      id: 'choose-close',
      title: 'Close the conversation',
      goal: 'The learner can choose and use a simple natural closing.',
      teaching: {
        explainInArabic: ['اشرح إن Goodbye وBye وSee you soon كلها طرق بسيطة لإنهاء الكلام، ومش لازم نستخدمهم كلهم مع بعض.'],
        englishTargets: ['Goodbye.', 'Bye.', 'See you soon.'],
        constraints: ['Keep closings simple and social.', 'Do not add scheduling or future-plan language.'],
      },
      board: { type: 'examples', title: 'Close naturally', items: [{ title: 'Bye.' }, { title: 'See you soon.' }, { title: 'Goodbye.' }] },
      interaction: {
        kind: 'elicitation',
        setup: 'Give three candidate lines and ask the learner which one can end the exchange, then have them use one.',
        learnerTask: 'Choose a closing and end the conversation.',
        supportLadder: ['قل بالعربي: أي جملة تقفل الكلام؟', 'Point to the closing examples.', 'Model one closing, then ask for a different one.'],
      },
    },
    {
      id: 'guided-exchange',
      title: 'Put the four moves together',
      goal: 'The learner can complete a supported four-move social exchange without reciting a fixed model.',
      teaching: {
        explainInArabic: ['قول إن المطلوب أربع وظائف: تحية، سؤال عن الحال، رد مناسب على الخبر، وإنهاء الكلام. الترتيب طبيعي لكن الجمل نفسها مش لازم تكون نسخة من المثال.'],
        englishTargets: ['greeting', 'How are you?', 'fitting reaction', 'closing'],
        constraints: ['Use functional cues, not a full dialogue.', 'Let the learner choose among the small taught repertoire.'],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Roleplay a new study-group member and complete a short social exchange. Use only functional prompts if help is needed.',
        learnerTask: 'Start, ask how I am, react to my answer, and close.',
        supportLadder: ['Give the four function labels only.', 'Give a short Arabic cue for the missing move.', 'Give the first word of one missing chunk, then continue naturally.'],
      },
    },
    {
      id: 'fresh-social-exchange',
      title: 'Fresh social exchange',
      goal: 'The learner can independently transfer the four social moves to a new first-meeting situation.',
      teaching: {
        explainInArabic: ['اعمل setup فقط: قابلت شخص جديد قبل كلاس مسائي. ابدأ الكلام، اسأل عن حاله، اتفاعل مع الرد، واقفل الكلام.'],
        englishTargets: ['greeting', 'wellbeing question', 'fitting reaction', 'closing'],
        constraints: [
          'No dialogue, sentence frame, or answer-bearing model before the first attempt.',
          'Use a new partner context and a different reported feeling from guided practice.',
          'If answer-revealing help is required, treat the attempt as practice and restart with a fresh situation.',
        ],
      },
      interaction: {
        kind: 'fresh_transfer',
        setup: 'Roleplay a new person before an evening class. Report a feeling that differs from guided practice.',
        learnerTask: 'Have a short conversation with me: open, ask how I am, react, and close.',
        teacherMoves: ['Respond naturally to the wellbeing question.', 'Do not prompt the next move unless the learner stalls.'],
        supportLadder: ['Give only a non-answer-bearing Arabic functional cue.', 'Name the missing function, not the phrase.', 'If you must model the phrase, restart with a new partner/feeling and do not count the prior attempt as mastery.'],
      },
    },
  ],
};
