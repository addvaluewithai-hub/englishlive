import type { SceneLessonDefinition } from '../types';

const answerKinds = ['answer', 'continuation'] as const;
const interactiveKinds = ['answer', 'question', 'continuation'] as const;

export const A1_U1_L03_SCENE_LESSON: SceneLessonDefinition = {
  id: 'a1-u1-l03-where-are-you-from',
  levelId: 'a1',
  unitId: 'a1-u1-first-contact',
  unitTitle: 'First Contact: Me and You',
  order: 3,
  title: 'Where are you from?',
  subtitle: 'Ask and answer about origin and where someone lives now.',
  performance: 'Ask, say, and understand simple origin and residence information in a first-contact exchange.',
  coreLanguage: [
    'Where are you from?',
    "I'm from …",
    'I come from …',
    'Where do you live?',
    'I live in …',
  ],
  boundaries: [
    'Keep origin and current residence distinct; do not turn this into a geography vocabulary lesson.',
    'Use only a small active set of familiar country/city examples as support.',
    'Do not introduce nationality adjective systems unless needed for a brief clarification.',
    'Fresh evidence should use a new person/location context rather than repeating one memorized exchange.',
  ],
  source: {
    repository: 'addvaluewithai-hub/english-course',
    branch: 'curriculum/level-source-of-truth-v1',
    path: 'curriculum/levels/a1/design-review/07-lesson-briefs/lesson-briefs.md',
    sourceLessonId: 'U1-L03',
  },
  scenes: [
    {
      id: 'ask-and-say-origin',
      title: 'Ask where someone is from',
      goal: 'The learner can ask Where are you from? and answer with I’m from + place.',
      teaching: {
        explainInArabic: [
          'اشرح إن Where are you from? بنستخدمها عشان نسأل الشخص أصله أو جاي منين.',
          "قدّم الإجابة الأساسية I'm from + country/city، وخلي I come from… كصيغة إضافية خفيفة مش شرح جديد كبير.",
          'خلي التركيز على chunk كامل؛ ما تعملش جدول are / am.',
        ],
        englishTargets: [
          'Where are you from?',
          "I'm from Egypt.",
          'I come from Egypt.',
        ],
        constraints: [
          'Use one or two place examples only.',
          'Do not teach a country/nationality list.',
          'The learner may choose any real or invented place if they prefer privacy.',
        ],
      },
      board: {
        type: 'compare',
        title: 'Ask ↔ answer',
        left: { title: 'Where are you from?' },
        right: { title: "I'm from ___." },
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Run a tiny two-way origin exchange: the learner asks you, hears your answer, then answers the same question.',
        learnerTask: 'Ask where I am from, then tell me where you are from.',
        teacherMoves: [
          'Set the first-contact context briefly in Arabic.',
          'Invite the learner to ask your origin.',
          'Answer with one simple place.',
          'Ask the learner Where are you from? and wait for their answer.',
          'Repair only the missing question/answer chunk if needed.',
        ],
        acceptedResponseKinds: interactiveKinds,
        successCriteria: [
          { id: 'asks-origin', label: 'Uses a comprehensible origin question, with Where are you from? as the target production.' },
          { id: 'gives-origin', label: "Gives an origin using I'm from + place or an equally clear target-aligned pattern." },
        ],
        supportLadder: [
          'Give an Arabic functional cue for ask or answer.',
          'Point to the relevant side of the board.',
          "Give only the starter 'Where are…' or 'I'm from…'.",
          'Model one exchange with a different place, then retry with the learner’s chosen place.',
        ],
      },
    },
    {
      id: 'say-where-you-live',
      title: 'Say where you live now',
      goal: 'The learner can understand and use I live in + place for current residence.',
      teaching: {
        explainInArabic: [
          'اشرح إن I live in… معناها أنا عايش/ساكن في المكان ده دلوقتي.',
          'قدّم Where do you live? كسؤال بسيط يقابل الإجابة، من غير شرح do كقاعدة منفصلة.',
          'استخدم مثال ممكن يكون نفس بلد الأصل أو مكان مختلف.',
        ],
        englishTargets: [
          'Where do you live?',
          'I live in Cairo.',
        ],
        constraints: [
          'Do not teach address details; that belongs later.',
          'Do not expand into home vocabulary.',
          'The learner may use a real or invented city.',
        ],
      },
      board: {
        type: 'compare',
        title: 'Ask ↔ answer',
        left: { title: 'Where do you live?' },
        right: { title: 'I live in ___.' },
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Ask the learner where they live and allow a real or invented city. Then let them ask you the same question once.',
        learnerTask: 'Say where you live, then ask me where I live.',
        teacherMoves: [
          'Ask Where do you live? and wait.',
          'Accept a real or invented place.',
          'Invite the learner to ask you the same thing.',
          'Answer naturally with a different simple place.',
        ],
        acceptedResponseKinds: interactiveKinds,
        successCriteria: [
          { id: 'gives-residence', label: 'Uses I live in + place, or an equally clear current-residence pattern.' },
          { id: 'asks-residence', label: 'Uses a comprehensible current-residence question.' },
        ],
        supportLadder: [
          'Restate the task in simple Arabic.',
          'Point to the board.',
          "Give only 'I live…' or 'Where do…' as a starter.",
          'Model one example, then ask for a new place on the retry.',
        ],
      },
    },
    {
      id: 'from-versus-live-in',
      title: 'From and live in are not always the same',
      goal: 'The learner understands the practical difference between origin and current residence and can choose the right pattern.',
      teaching: {
        explainInArabic: [
          "اشرح ببساطة إن I'm from… = أصلي/جاي منين، و I live in… = عايش فين دلوقتي.",
          'استخدم مثال شخص من بلد وعايش في مدينة/بلد مختلفة عشان الفرق يبقى واضح.',
          'لو نفس المكان ينفع جدًا؛ المهم الطالب يفهم إن السؤالين معناهم مختلف.',
        ],
        englishTargets: [
          "I'm from Alexandria.",
          'I live in Cairo.',
          'Where are you from?',
          'Where do you live?',
        ],
        constraints: [
          'Meaning first; do not explain preposition systems broadly.',
          'Do not introduce moved to, born in, nationality, or travel history.',
        ],
      },
      board: {
        type: 'compare',
        title: 'Origin ↔ now',
        left: { title: "I'm from…", body: 'origin' },
        right: { title: 'I live in…', body: 'where I live now' },
      },
      interaction: {
        kind: 'elicitation',
        setup: 'Give two very short situations and ask the learner which English frame fits, then have them make one personal or invented pair.',
        learnerTask: 'Choose from or live in for the meaning, then make one example with both ideas.',
        teacherMoves: [
          'Give one origin meaning and ask for the matching frame.',
          'Give one current-residence meaning and ask for the matching frame.',
          'Ask the learner for one pair such as I’m from X. I live in Y.',
          'If they reverse the meanings, contrast only their two sentences and retry.',
        ],
        acceptedResponseKinds: answerKinds,
        successCriteria: [
          { id: 'distinguishes-origin', label: 'Selects or uses from for origin meaning.' },
          { id: 'distinguishes-residence', label: 'Selects or uses live in for current residence meaning.' },
          { id: 'produces-pair', label: 'Produces a comprehensible origin/residence pair, real or invented.' },
        ],
        supportLadder: [
          'Explain the meaning contrast once more in Arabic.',
          'Point to origin vs now on the board.',
          "Give the starters 'I'm from…' and 'I live in…'.",
          'Model one different pair, then ask the learner for a fresh pair.',
        ],
      },
    },
    {
      id: 'guided-location-profile',
      title: 'Build a simple location profile',
      goal: 'The learner can exchange origin and residence information as part of one supported first-contact conversation.',
      teaching: {
        explainInArabic: [
          'قل للطالب إنكم هتتعرفوا على بعض وهنجمع معلومتين بس: جاي منين وعايش فين.',
          'البورد تذكير بالمعنى، مش نص لازم يمشي عليه كلمة بكلمة.',
        ],
        englishTargets: [
          'Where are you from?',
          "I'm from ___.",
          'Where do you live?',
          'I live in ___.',
        ],
        constraints: [
          'Do not add job, age, spelling, address, or family questions.',
          'Let the exchange feel like one conversation, not four isolated drills.',
          'Allow real or invented locations.',
        ],
      },
      board: {
        type: 'steps',
        title: 'Two things to learn',
        items: [
          { title: 'Origin', body: 'Where are you from? → I’m from…' },
          { title: 'Residence', body: 'Where do you live? → I live in…' },
        ],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Run a short first-contact exchange where both people discover origin and current residence.',
        learnerTask: 'Have a short conversation with me and find out where I am from and where I live; tell me the same about you.',
        teacherMoves: [
          'Let the learner ask one of the two questions first.',
          'Answer naturally and create an opening for the other question.',
          'Ask the learner the corresponding questions naturally.',
          'React briefly to the places without introducing new place vocabulary.',
          'Repair only a target chunk or meaning confusion, then continue.',
        ],
        acceptedResponseKinds: interactiveKinds,
        successCriteria: [
          { id: 'guided-asks-origin', label: 'Asks about origin in the conversation.' },
          { id: 'guided-gives-origin', label: 'Gives origin clearly.' },
          { id: 'guided-asks-residence', label: 'Asks about current residence.' },
          { id: 'guided-gives-residence', label: 'Gives current residence clearly.' },
        ],
        supportLadder: [
          'Give an Arabic functional cue for the missing meaning.',
          'Point to the relevant row on the board.',
          'Give only the start of the missing English chunk.',
          'Model that one chunk once, then resume the conversation with a different place.',
        ],
      },
    },
    {
      id: 'fresh-new-person-location',
      title: 'Fresh origin and residence challenge',
      goal: 'The learner can exchange origin and residence with a new person using reduced support and no complete model.',
      teaching: {
        explainInArabic: [
          'اعمل setup فقط: قابلت شخص جديد في حدث بسيط. اتعرف عليه واعرف هو منين وعايش فين، وقوله نفس المعلومات عنك.',
          'ما تراجعش الجمل قبل البداية؛ الهدف استخدام مستقل نسبيًا.',
        ],
        englishTargets: [
          'Where are you from?',
          "I'm from ___.",
          'Where do you live?',
          'I live in ___.',
        ],
        constraints: [
          'No board and no complete model before the first attempt.',
          'Use fresh teacher locations not copied from the teaching examples.',
          'Do not force real personal location disclosure; invented places are acceptable.',
          'Do not turn the final scene into a checklist read aloud to the learner.',
        ],
      },
      interaction: {
        kind: 'fresh_transfer',
        setup: 'Roleplay a new person at a simple community or course event. Let the learner exchange origin and residence naturally.',
        learnerTask: 'Meet me as a new person and find out where I am from and where I live; share the same two things about yourself.',
        teacherMoves: [
          'Give only the scenario and wait for the learner to begin or ask a relevant question.',
          'Answer with fresh simple locations.',
          'Keep the interaction short and believable.',
          'Create one natural opportunity for any missing required function.',
          'Complete only when all required functions have appeared with enough independence.',
        ],
        acceptedResponseKinds: interactiveKinds,
        successCriteria: [
          { id: 'fresh-origin-question', label: 'Uses an origin question with reduced support.' },
          { id: 'fresh-origin-answer', label: 'Gives origin clearly.' },
          { id: 'fresh-residence-question', label: 'Uses a current-residence question with reduced support.' },
          { id: 'fresh-residence-answer', label: 'Gives current residence clearly.' },
          { id: 'fresh-meaning-control', label: 'Keeps origin and current residence meanings distinct enough for the exchange to work.' },
        ],
        supportLadder: [
          'Give a short Arabic cue for the missing communicative function.',
          'Give the first word or two of the missing English chunk.',
          'Offer a partial frame.',
          'Model once, then reopen that function with a fresh location.',
        ],
      },
    },
  ],
};
