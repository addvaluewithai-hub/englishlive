import type { SceneLessonDefinition } from '../types';

const answerKinds = ['answer', 'continuation'] as const;
const interactiveKinds = ['answer', 'question', 'continuation'] as const;

export const A1_U1_L02_SCENE_LESSON: SceneLessonDefinition = {
  id: 'a1-u1-l02-how-old-are-you',
  levelId: 'a1',
  unitId: 'a1-u1-first-contact',
  unitTitle: 'First Contact: Me and You',
  order: 2,
  title: 'How old are you?',
  subtitle: 'Ask about age and give a simple age answer using a small, useful number pattern.',
  performance: 'Ask and answer a simple age question and understand one fresh age-sized number.',
  coreLanguage: [
    'How old are you?',
    "I'm 21.",
    "I'm 21 years old.",
    '20 / twenty',
    '21 / twenty-one',
  ],
  boundaries: [
    'This is an AGE lesson first. Numbers are support for the age exchange, not a standalone 1–100 syllabus.',
    'Do not assume the learner has already learned English numbers. Check gently and teach only the tiny amount needed today.',
    'Keep required number production inside one simple twenties pattern. Other numbers are optional supported exposure, not completion requirements.',
    'Do not teach teen/tens contrasts unless the learner actually needs that repair.',
    'Large-number phrases, prices, dates and phone-number strings do not belong here.',
    'The learner may use a real or invented age; never pressure them to disclose personal information.',
  ],
  source: {
    repository: 'addvaluewithai-hub/english-course',
    branch: 'curriculum/level-source-of-truth-v1',
    path: 'curriculum/levels/a1/design-review/07-lesson-briefs/lesson-briefs.md',
    sourceLessonId: 'U1-L02',
  },
  scenes: [
    {
      id: 'tiny-number-foundation',
      title: 'One tiny number pattern',
      goal: 'The learner understands that twenty is 20 and can build or recognise one nearby number such as twenty-one without being asked to learn a broad number system.',
      teaching: {
        explainInArabic: [
          'ابدأ بتوضيح إن درس النهارده عن السن، وهناخد بس رقمين أو تلاتة عشان نعرف نسأل ونرد؛ مش درس أرقام كامل.',
          'ما تفترضش إن الطالب عارف الأرقام بالإنجليزي. اسأله check خفيف جدًا عن one / two فقط. لو مش عارفهم، علّمهم كدعم سريع من غير ما تحولهم لهدف تقييم.',
          'علّم twenty = 20، وبعدها twenty-one = 21 كفكرة واحدة بسيطة: twenty + one.',
          'لو الفكرة وضحت، اختبر رقم قريب واحد فقط زي twenty-two أو twenty-four. ما تدخلش 30/40 أو teen/tens إلا لو الطالب نفسه احتاج repair.',
        ],
        englishTargets: [
          '20 — twenty',
          '21 — twenty-one',
          'one / two as optional support only',
        ],
        constraints: [
          'Foreground only 20 and 21. One nearby twenties number may be used for fresh understanding or production.',
          'Do not count from 1 to 20 and do not ask the learner to memorise a list.',
          'Do not teach 30, 40, 47 or a general tens system in the authored path.',
          'If the learner does not know one/two, support them briefly before continuing; this is not failure.',
        ],
      },
      board: {
        type: 'steps',
        title: 'رقم صغير نحتاجه للسن',
        items: [
          { title: '20', body: 'twenty' },
          { title: '21', body: 'twenty-one' },
        ],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Keep this under a minute or two. Use one short listen check and one short say check around the twenties pattern.',
        learnerTask: 'Understand one spoken number and say one age-sized number from the tiny pattern.',
        teacherMoves: [
          'After teaching twenty and twenty-one, say one of them and ask the learner which number they heard.',
          'Then ask for twenty-one or one nearby twenties number using light support if needed.',
          'Stop immediately once the learner has shown one understanding example and one intelligible production example.',
        ],
        acceptedResponseKinds: answerKinds,
        successCriteria: [
          { id: 'understands-number', label: 'Correctly understands at least one spoken number from the tiny taught age-number pattern.' },
          { id: 'produces-number', label: 'Produces at least one age-sized number from the tiny taught pattern intelligibly.' },
        ],
        supportLadder: [
          'Repeat the same number more slowly once.',
          'Point to the current board item.',
          'Explain in Arabic that twenty-one is twenty + one.',
          'Model one example, then ask for one different nearby number only if needed.',
        ],
      },
    },
    {
      id: 'ask-age',
      title: 'Ask someone their age',
      goal: 'The learner can use How old are you? as one complete useful chunk.',
      teaching: {
        explainInArabic: [
          'قول بوضوح إن دلوقتي دخلنا في هدف الدرس الأساسي: نسأل عن السن.',
          'علّم How old are you? كجملة كاملة للاستخدام، من غير شرح grammar منفصل لكلمة old أو are.',
          'وضّح باختصار إن السؤال شخصي في مواقف كتير، وإحنا هنا بنستخدمه داخل تدريب بسيط.',
        ],
        englishTargets: ['How old are you?'],
        constraints: [
          'The learner must ask the question; hearing the teacher ask it is not evidence.',
          'Do not introduce birth dates or When were you born?',
        ],
      },
      board: {
        type: 'note',
        title: 'اسأل عن السن',
        body: 'How old are you?',
      },
      interaction: {
        kind: 'elicitation',
        setup: 'Tell the learner in Arabic that they are completing a simple class profile and need to ask your age.',
        learnerTask: 'Ask me my age.',
        teacherMoves: [
          'Set the profile context briefly.',
          'Wait for the learner to ask the question.',
          'Answer with an invented age inside the small number range already practised unless the learner is clearly comfortable with more.',
          'If the question is incomplete, repair only the needed chunk and ask for one retry.',
        ],
        acceptedResponseKinds: ['question'],
        successCriteria: [
          { id: 'asks-age', label: 'Uses a comprehensible age question, with How old are you? as the target production.' },
        ],
        supportLadder: [
          'Say in Arabic: اسألني سني كام.',
          'Point to the board without reading the whole question again.',
          "Give only the starter 'How old…' and pause.",
          'Model the full question once, then create an immediate fresh retry.',
        ],
      },
    },
    {
      id: 'answer-age',
      title: 'Give an age simply',
      goal: 'The learner can answer an age question with one intelligible number using a simple natural frame.',
      teaching: {
        explainInArabic: [
          "علّم إجابة واحدة أساسية الأول: I'm 21.",
          "بعد ما يفهمها، اعرض I'm 21 years old. كبديل أطول اختياري، مش كحاجة لازم يحفظها.",
          'اسمح له يستخدم سن متخيل داخل نفس النمط البسيط؛ الهدف اللغة مش البيانات الشخصية.',
        ],
        englishTargets: ["I'm 21.", "I'm 21 years old."],
        constraints: [
          'Do not force the learner to reveal their real age.',
          'The short frame is enough for completion if the meaning is clear.',
          'If the learner chooses a number outside the tiny taught range, help with that one number only instead of opening a new number lesson.',
        ],
      },
      board: {
        type: 'compare',
        title: 'إجابتين طبيعيين',
        left: { title: "I'm 21." },
        right: { title: "I'm 21 years old." },
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Ask How old are you? and explicitly allow a real or invented age.',
        learnerTask: 'Answer with a real or invented age.',
        teacherMoves: [
          'Ask the age question once and wait.',
          'Accept the short frame naturally.',
          'If their chosen number is unclear, repair only that number and retry once.',
          'Do not demand years old if the short answer is already usable.',
        ],
        acceptedResponseKinds: answerKinds,
        successCriteria: [
          { id: 'gives-age-number', label: 'Produces an intelligible age-sized number.' },
          { id: 'uses-age-pattern', label: "Uses a usable age-answer frame such as I'm + number." },
        ],
        supportLadder: [
          'Repeat the question slowly.',
          "Point to the short 'I'm…' frame first.",
          "Give the starter 'I'm…' and let the learner supply the number.",
          'Model one invented-age answer, then ask again with a different nearby number if a fresh retry is needed.',
        ],
      },
    },
    {
      id: 'guided-age-exchange',
      title: 'Have a short age exchange',
      goal: 'The learner can ask and answer the age question in one short supported exchange and catch one spoken age number.',
      teaching: {
        explainInArabic: [
          'قل للطالب إنكم هتعملوا محادثة صغيرة جدًا: هو يسأل عن السن، يسمع الإجابة، وبعدها يجاوب نفس السؤال.',
          'ما تراجعش نظام الأرقام من الأول؛ استخدم نفس النمط الصغير اللي اتعلمه.',
        ],
        englishTargets: ['How old are you?', "I'm ___ ."],
        constraints: [
          'Use invented ages freely so the task does not require personal disclosure.',
          'Keep teacher age inside the taught small number pattern unless the learner clearly demonstrates broader number knowledge.',
          'Do not expand into names, countries, jobs, dates, or contact details.',
        ],
      },
      board: {
        type: 'steps',
        title: 'محادثة السن',
        items: [
          { title: 'اسأل', body: 'How old are you?' },
          { title: 'اسمع الرقم', body: 'Catch the age' },
          { title: 'جاوب', body: "I'm ___ ." },
        ],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Run one short two-way age exchange.',
        learnerTask: 'Ask my age, understand my answer, then answer the same question yourself.',
        teacherMoves: [
          'Invite the learner to ask your age first.',
          'Answer with a fresh nearby age number from the taught pattern.',
          'Check comprehension only if it is not already clear.',
          'Ask the learner their age and let them answer with a real or invented number.',
        ],
        acceptedResponseKinds: interactiveKinds,
        successCriteria: [
          { id: 'guided-asks-age', label: 'Asks the age question in the exchange.' },
          { id: 'guided-understands-age', label: 'Shows understanding of the teacher’s spoken age number.' },
          { id: 'guided-gives-age', label: 'Gives an intelligible age answer using a usable frame.' },
        ],
        supportLadder: [
          'Give a short Arabic cue for the missing function.',
          'Point to the relevant current board point.',
          'Give only a partial English frame.',
          'Model that one function, then resume with a different nearby number.',
        ],
      },
    },
    {
      id: 'fresh-age-profile',
      title: 'Try it with less help',
      goal: 'The learner can handle a fresh short age exchange without seeing a complete model first.',
      teaching: {
        explainInArabic: [
          'اعمل setup قصير: بتكملوا بروفايل بسيط في language exchange. استخدم سن حقيقي أو متخيل براحتك.',
          'ما تراجعش السؤال والإجابة قبل البداية؛ خليه يجرب الأول.',
        ],
        englishTargets: ['How old are you?', "I'm ___ .", 'one fresh nearby age number'],
        constraints: [
          'No board and no complete model before the first attempt.',
          'Use a fresh nearby age number, not a surprise jump to an untaught number family.',
          'Do not require real personal age disclosure.',
          'If one function is missing, create one natural opportunity before direct support.',
        ],
      },
      interaction: {
        kind: 'fresh_transfer',
        setup: 'Roleplay another participant in a simple language-exchange profile activity.',
        learnerTask: 'Complete the age part of a new profile exchange with me.',
        teacherMoves: [
          'Give only the scenario and wait for the learner to take the first useful step.',
          'Use one fresh nearby invented age in your own answer.',
          'Keep the exchange natural and short.',
          'Create a conversational opening for any missing required function.',
          'Complete only after all three functions appear with enough independence.',
        ],
        acceptedResponseKinds: interactiveKinds,
        successCriteria: [
          { id: 'fresh-asks-age', label: 'Uses the age question with reduced support.' },
          { id: 'fresh-understands-number', label: 'Shows understanding of one fresh nearby spoken age number.' },
          { id: 'fresh-gives-age', label: 'Gives an intelligible real or invented age using a usable age frame.' },
        ],
        supportLadder: [
          'Give only an Arabic functional cue.',
          'Give the first one or two English words of the missing chunk.',
          'Offer a partial frame.',
          'Model once, then restart that part with a different nearby number so the retry is fresh.',
        ],
      },
    },
  ],
};
