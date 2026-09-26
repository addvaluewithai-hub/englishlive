import type { SceneLessonDefinition } from '../types';

export const A1_U1_L02_SCENE_LESSON: SceneLessonDefinition = {
  id: 'a1-u1-l02-how-old-are-you',
  levelId: 'a1',
  unitId: 'a1-u1-first-contact',
  unitTitle: 'First Contact: Me and You',
  order: 2,
  title: 'How old are you?',
  subtitle: 'Ask about age and give a simple age answer with a tiny useful number pattern.',
  performance: 'Ask and answer a simple age question and understand a small age-sized number pattern.',
  coreLanguage: ['20 — twenty', '21 — twenty-one', 'How old are you?', "I'm 21.", "I'm 21 years old."],
  boundaries: [
    'This is an age lesson first. Numbers are support, not a standalone 1–100 syllabus.',
    'Do not assume the learner already knows English numbers; teach only the tiny amount needed today.',
    'Do not introduce 30/40/47, prices, dates, phone strings, or a general tens system.',
    'The learner may always use an invented age.',
  ],
  source: {
    repository: 'addvaluewithai-hub/english-course',
    branch: 'curriculum/level-source-of-truth-v1',
    path: 'curriculum/levels/a1/design-review/07-lesson-briefs/lesson-briefs.md',
    sourceLessonId: 'U1-L02',
  },
  scenes: [
    {
      id: 'twenty',
      title: 'Meet one useful number',
      goal: 'The learner understands and can say twenty as 20.',
      teaching: {
        explainInArabic: ['أكد إن الدرس عن السن، وإننا هناخد رقم صغير نحتاجه فقط: 20 = twenty. انطقه بوضوح وببطء.'],
        englishTargets: ['20 — twenty'],
        constraints: ['Do not count from 1 to 20.', 'Keep this tiny and practical.'],
      },
      board: { type: 'note', title: '20', body: 'twenty' },
      interaction: {
        kind: 'micro_practice',
        setup: 'Say twenty once, then ask the learner to repeat or identify it.',
        learnerTask: 'Say twenty.',
        supportLadder: ['Repeat it more slowly.', 'Point to 20 on the board.', 'Model once more, then retry.'],
      },
    },
    {
      id: 'twenty-one',
      title: 'Build twenty-one',
      goal: 'The learner understands the small pattern twenty + one = twenty-one and can say it.',
      teaching: {
        explainInArabic: ['اشرح ببساطة إن 21 بنقول twenty-one: twenty وبعدها one. ما تفتحش نظام أرقام كامل.'],
        englishTargets: ['21 — twenty-one'],
        constraints: ['One nearby example is allowed only if needed for understanding.', 'Do not introduce a new tens family.'],
      },
      board: { type: 'note', title: '21', body: 'twenty-one' },
      interaction: {
        kind: 'micro_practice',
        setup: 'Ask the learner to say twenty-one, then check one tiny listening example if useful.',
        learnerTask: 'Say twenty-one.',
        supportLadder: ['Say twenty … one with a small pause.', 'Point to the board.', 'Model once, then retry.'],
      },
    },
    {
      id: 'ask-age',
      title: 'Ask about age',
      goal: 'The learner can use How old are you? as one complete useful chunk.',
      teaching: {
        explainInArabic: ['قول إن دلوقتي دخلنا هدف الدرس الأساسي: لما نسأل عن السن نقول How old are you? كجملة واحدة، من غير شرح grammar منفصل.'],
        englishTargets: ['How old are you?'],
        constraints: ['Mention briefly that age can be personal and this is only a language exercise.', 'Do not introduce birth dates.'],
      },
      board: { type: 'note', title: 'How old are you?' },
      interaction: {
        kind: 'elicitation',
        setup: 'Ask the learner to ask your age.',
        learnerTask: 'Ask me my age.',
        teacherMoves: ['When they ask successfully, answer with a simple invented age from the tiny taught range.'],
        supportLadder: ['قل بالعربي: اسألني سني كام.', "Give only 'How old…'", 'Model once, then retry.'],
      },
    },
    {
      id: 'answer-age',
      title: 'Give an age',
      goal: 'The learner can answer with I’m + number using a real or invented age.',
      teaching: {
        explainInArabic: ["علّم الإجابة القصيرة الأول: I'm 21. وبعدها اعرض I'm 21 years old. كبديل أطول اختياري."],
        englishTargets: ["I'm 21.", "I'm 21 years old."],
        constraints: ['Never require the learner to disclose their real age.', 'If they choose another number, help only with that one number.'],
      },
      board: { type: 'examples', title: 'Answer', items: [{ title: "I'm 21." }, { title: "I'm 21 years old." }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Ask How old are you? and explicitly allow an invented age.',
        learnerTask: 'Answer with a real or invented age.',
        supportLadder: ["Give only 'I'm…'", 'Offer 20 or 21 as an easy choice.', 'Model one invented answer, then retry.'],
      },
    },
    {
      id: 'age-exchange',
      title: 'Have a short age exchange',
      goal: 'The learner can ask and answer about age in one short two-way exchange.',
      teaching: {
        explainInArabic: ['قول إنكم هتعملوا محادثة صغيرة جدًا: هو يسأل عن السن، يسمع الإجابة، وبعدها يجاوب نفس السؤال.'],
        englishTargets: ['How old are you?', "I'm ___."],
        constraints: ['Use invented ages freely.', 'Keep numbers close to what was taught unless the learner clearly knows more.'],
      },
      board: { type: 'compare', title: 'Ask ↔ answer', left: { title: 'How old are you?' }, right: { title: "I'm ___." } },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Run one short two-way age exchange.',
        learnerTask: 'Ask my age, then answer when I ask yours.',
        supportLadder: ['Give a short Arabic cue for the missing side.', 'Point to ask or answer on the board.', 'Give a partial English frame, then continue.'],
      },
    },
    {
      id: 'fresh-age',
      title: 'Try the age exchange with less help',
      goal: 'The learner can handle a fresh short age exchange with reduced support.',
      teaching: {
        explainInArabic: ['اعمل setup فقط: إنتوا بتملوا بروفايل بسيط في language exchange. استخدم سن حقيقي أو متخيل براحتك.'],
        englishTargets: ['How old are you?', "I'm ___."],
        constraints: ['No complete model before the first attempt.', 'Do not surprise the learner with a large untaught number family.'],
      },
      interaction: {
        kind: 'fresh_transfer',
        setup: 'Roleplay another participant completing only the age part of a simple profile.',
        learnerTask: 'Complete a short age exchange with me.',
        supportLadder: ['Give only an Arabic functional cue.', 'Give the first one or two English words.', 'Model once, then restart that moment with a nearby number.'],
      },
    },
  ],
};
