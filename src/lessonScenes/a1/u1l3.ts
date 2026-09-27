import type { SceneLessonDefinition } from '../types';

export const A1_U1_L03_SCENE_LESSON: SceneLessonDefinition = {
  id: 'a1-u1-l03-where-are-you-from',
  levelId: 'a1',
  unitId: 'a1-u1-first-contact',
  unitTitle: 'First Connections',
  order: 3,
  title: 'Introduce Yourself',
  subtitle: 'Give a short self-introduction with essential personal details in four or five clear sentences.',
  performance: 'In a fresh first-meeting situation, give a short self-introduction with name, origin, residence or role, and one family or interest detail without a complete model.',
  coreLanguage: [
    "Hi, I'm …",
    'My name is …',
    "I'm from …",
    'I live in …',
    "I'm a / an …",
    'I work in …',
    'I like …',
    'I have …',
    'Nice to meet you.',
  ],
  boundaries: [
    'Keep the introduction to four or five short connected statements; do not train a memorised paragraph.',
    'Introduce my only in My name is ...; do not teach the full possessive system.',
    'Introduce a/an only with a small set of job phrases; do not teach the full article system.',
    'Keep origin and current residence distinct.',
    'Use one optional family or interest detail only, and allow fictional safe information.',
    'Do not systematically teach the live /lɪv/ versus /laɪv/ contrast here.',
    'The final performance gets field labels only, not sentence frames or a complete model.',
  ],
  source: {
    repository: 'addvaluewithai-hub/english-course',
    branch: 'curriculum/level-source-of-truth-v1',
    path: 'units/a1-v1/unit-01-first-connections/lessons/u1-l03',
    sourceLessonId: 'U1-L03',
  },
  scenes: [
    {
      id: 'notice-introduction-fields',
      title: 'Notice what a short introduction contains',
      goal: 'The learner can identify the key information fields in a short model introduction.',
      teaching: {
        explainInArabic: [
          'قدّم نموذج قصير مرة واحدة: اسم، أصل، سكن، دور/وظيفة، واهتمام. بعده اسأل المتعلم إيه أنواع المعلومات اللي سمعها.',
          'أكد إن الهدف مش حفظ النموذج؛ الهدف فهم البنية والمعلومات المطلوبة.',
        ],
        englishTargets: ["Hi, I'm Maya.", "I'm from Jordan.", 'I live in Amman.', "I'm a designer.", 'I like photography.'],
        constraints: ['Use the model only as input, not as a script to memorise.', 'Do not require every learner introduction to use all five exact sentences.'],
      },
      board: {
        type: 'examples',
        title: 'What information?',
        items: [{ title: 'name' }, { title: 'origin' }, { title: 'residence / role' }, { title: 'family / interest' }],
      },
      interaction: {
        kind: 'elicitation',
        setup: 'Say the model introduction naturally, then ask which information types the learner heard.',
        learnerTask: 'Tell me the main kinds of information in the introduction.',
        supportLadder: ['Ask in Arabic: سمعت اسم؟ بلد؟ سكن؟ شغل؟ اهتمام؟', 'Point to the field labels.', 'Replay only the relevant model sentence after the learner attempts.'],
      },
    },
    {
      id: 'name-openers',
      title: 'Open with your name',
      goal: "The learner can introduce their name with I'm ... or My name is ... .",
      teaching: {
        explainInArabic: [
          "اشرح إن Hi, I'm ... هي أبسط بداية، وMy name is ... بديل طبيعي.",
          'هنا بنتعلم my مع name فقط؛ ما نفتحش نظام الملكية كله.',
        ],
        englishTargets: ["Hi, I'm Maya.", 'Hello, my name is Maya.'],
        constraints: ['Use the teacher name in examples, not private learner profile data.', 'Do not teach possessive adjectives beyond this chunk.'],
      },
      board: { type: 'compare', title: 'Two natural openers', left: { title: "Hi, I'm ___." }, right: { title: 'My name is ___.' } },
      interaction: {
        kind: 'micro_practice',
        setup: 'Ask the learner to introduce a real or fictional name using either opener, then switch to the other form once.',
        learnerTask: 'Say your name in two natural ways.',
        supportLadder: ['Point to one opener.', "Give only 'I'm…' or 'My name is…'", 'Model with a fictional teacher name, then retry.'],
      },
    },
    {
      id: 'origin-and-residence',
      title: 'Separate origin from residence',
      goal: "The learner can use I'm from ... for origin and I live in ... for current residence.",
      teaching: {
        explainInArabic: [
          "وضح الفرق: I'm from ... للأصل/البلد، وI live in ... للمكان اللي عايش فيه دلوقتي. ممكن المكانين يكونوا مختلفين.",
        ],
        englishTargets: ["I'm from Egypt.", 'I live in Cairo.'],
        constraints: ['Use only a few familiar place examples.', 'Do not expand to nationality, address, moving history, or travel language.'],
      },
      board: {
        type: 'compare',
        title: 'Origin ↔ residence',
        left: { title: "I'm from ___", body: 'origin' },
        right: { title: 'I live in ___', body: 'where you live now' },
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give one meaning contrast, then ask the learner for a real or fictional origin/residence pair.',
        learnerTask: 'Make two sentences: where you are from and where you live now.',
        supportLadder: ['Explain the meaning contrast in Arabic once more.', 'Point to origin vs residence.', 'Give the two starters only, then let the learner finish.'],
      },
    },
    {
      id: 'role-with-article',
      title: 'Add a role or job',
      goal: 'The learner can add one simple role/job sentence with a/an or one bounded work phrase.',
      teaching: {
        explainInArabic: [
          "قدّم أمثلة عملية صغيرة: I'm a student. I'm a designer. I'm an engineer. ووضح إن an بتيجي هنا قبل engineer لأن النطق يبدأ بصوت vowel.",
          'يمكن استخدام I work in sales كبديل بسيط لو أنسب للمتعلم.',
        ],
        englishTargets: ["I'm a student.", "I'm a designer.", "I'm an engineer.", 'I work in sales.'],
        constraints: ['Teach only the phrase-level contrast needed here.', 'Do not teach the full a/an article system or a long job list.'],
      },
      board: {
        type: 'examples',
        title: 'One role sentence',
        items: [{ title: "I'm a student." }, { title: "I'm a designer." }, { title: "I'm an engineer." }, { title: 'I work in sales.' }],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Offer a few safe fictional roles and ask the learner to make one role sentence.',
        learnerTask: 'Add one role or job sentence to your introduction.',
        supportLadder: ['Offer two role choices.', "Give only 'I'm a…' / 'I'm an…' / 'I work in…'", 'Model one fictional role and ask for a different one.'],
      },
    },
    {
      id: 'one-personal-detail',
      title: 'Add one family or interest detail',
      goal: 'The learner can add one short optional family or interest sentence without expanding the lesson scope.',
      teaching: {
        explainInArabic: [
          'قول إن المقدمة القصيرة محتاجة تفصيلة واحدة إضافية فقط: اهتمام أو معلومة أسرية بسيطة. استخدم بيانات حقيقية أو خيالية براحتك.',
        ],
        englishTargets: ['I like football.', 'I like reading.', 'I have two sisters.'],
        constraints: ['One detail is enough.', 'Do not introduce broader family grammar or hobby vocabulary lists.'],
      },
      board: { type: 'examples', title: 'One extra detail', items: [{ title: 'I like football.' }, { title: 'I like reading.' }, { title: 'I have two sisters.' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Ask the learner to choose one real or fictional interest/family detail and say one short sentence.',
        learnerTask: 'Add one interest or family detail.',
        supportLadder: ['Offer interest vs family as two choices.', "Give only 'I like…' or 'I have…'", 'Model one fictional example and ask for a different one.'],
      },
    },
    {
      id: 'chunk-the-introduction',
      title: 'Build four or five short sense groups',
      goal: 'The learner can organise an introduction into short clear statements with natural pauses.',
      teaching: {
        explainInArabic: [
          'وضح إن المقدمة مش فقرة طويلة بنفس واحد. خلي كل معلومة في جملة قصيرة، مع وقفة بسيطة بين الجمل.',
          'ركز على وضوح الكلمات المهمة زي البلد أو الوظيفة، مش على إزالة اللهجة.',
        ],
        englishTargets: ["Hi, I'm Maya. | I'm from Jordan. | I live in Amman. | I'm a designer. | I like photography."],
        constraints: ['Do not require the exact model order.', 'Pronunciation feedback should protect intelligibility only.'],
      },
      board: {
        type: 'examples',
        title: 'Short information groups',
        items: [{ title: 'name' }, { title: 'origin' }, { title: 'residence / role' }, { title: 'family / interest' }],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give four short learner-selected details as keywords and have the learner turn them into a short introduction with pauses.',
        learnerTask: 'Say four short sentences, one information group at a time.',
        supportLadder: ['Use field labels only.', 'Remind the learner to pause between details.', 'Give one starter for the stuck field, not a full introduction.'],
      },
    },
    {
      id: 'personal-plan',
      title: 'Plan with keywords, not a script',
      goal: 'The learner can choose four safe details for a personal or fictional introduction without writing a paragraph.',
      teaching: {
        explainInArabic: ['خلي المتعلم يختار كلمات فقط لأربع خانات: الاسم، الأصل، السكن أو الدور، والأسرة أو الاهتمام. ممنوع نكتب فقرة كاملة قبل الأداء.'],
        englishTargets: ['name', 'origin', 'residence or role', 'family or interest'],
        constraints: ['Allow fictional information.', 'Keep support to field labels/keywords only.'],
      },
      board: {
        type: 'examples',
        title: 'Your four fields',
        items: [{ title: 'name' }, { title: 'origin' }, { title: 'residence OR role' }, { title: 'family OR interest' }],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Ask the learner to choose one keyword/value for each field. Do not turn the plan into full written sentences for them.',
        learnerTask: 'Choose four details for your introduction. Real or fictional is fine.',
        supportLadder: ['Offer a safe fictional identity option.', 'Offer two choices for one stuck field.', 'Fill one keyword only, never a complete sentence.'],
      },
    },
    {
      id: 'guided-introduction',
      title: 'Give a supported short introduction',
      goal: 'The learner can produce four or five connected short statements using field labels only.',
      teaching: {
        explainInArabic: ['قول Tell me about yourself، وخلي المتعلم يستخدم خطته. التدخل يكون بأسماء الخانات فقط؛ ما تعرضش نموذج كامل أثناء المحاولة.'],
        englishTargets: ['name', 'origin', 'residence or role', 'family or interest'],
        constraints: ['No full model during the attempt.', 'At least four requested detail categories should be intelligible.'],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Prompt Tell me about yourself. Let the learner use their keyword plan and field labels.',
        learnerTask: 'Tell me about yourself in four or five short sentences.',
        teacherMoves: ['Listen through the whole attempt before correcting.', 'Correct at most one meaning-critical issue, then ask for a retry of that sentence.'],
        supportLadder: ['Name the missing field only.', 'Give an Arabic functional cue for that field.', 'Give the first English words of that one sentence, then let the learner complete it.'],
      },
    },
    {
      id: 'fresh-self-introduction',
      title: 'Fresh self-introduction',
      goal: 'The learner can transfer the four required detail categories to a new first-meeting situation without a complete model.',
      teaching: {
        explainInArabic: ['اعمل setup فقط: أول يوم في study group أونلاين. حد قالك Tell me about yourself. قدم نفسك في أربع أو خمس جمل قصيرة.'],
        englishTargets: ['name', 'origin', 'residence or role', 'family or interest'],
        constraints: [
          'Show field labels only; no sentence frames or complete model before the first attempt.',
          'The setting and field order should differ from guided practice.',
          'Allow real or fictional safe information.',
          'If answer-revealing correction is required, treat the attempt as practice and restart with a new first-meeting scenario.',
        ],
      },
      interaction: {
        kind: 'fresh_transfer',
        setup: 'Roleplay a new online study-group first meeting and prompt Tell me about yourself.',
        learnerTask: 'Introduce yourself in four or five short sentences with the four requested detail categories.',
        teacherMoves: ['Do not interrupt minor errors if the essential details remain intelligible.', 'After the full attempt, check whether all four categories were present and clear.'],
        supportLadder: ['Give field labels only.', 'Give a non-answer-bearing Arabic cue for the missing category.', 'If you must provide a sentence frame or model, use a fresh replacement scenario before judging mastery.'],
      },
    },
  ],
};
