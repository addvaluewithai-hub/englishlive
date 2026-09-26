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
  subtitle: 'Understand and use basic age and number language in a simple personal-information exchange.',
  performance: 'Give and understand age and basic functional numbers in a short personal-information exchange.',
  coreLanguage: [
    'basic number patterns',
    'How old are you?',
    "I'm 30.",
    "I'm 30 years old.",
    'teen / tens number contrasts when useful',
  ],
  boundaries: [
    'Teach number patterns through useful age-sized numbers; do not turn the lesson into a long number-recitation drill.',
    'Large-number phrases do not belong in age practice.',
    'The learner may use a real or invented age; never pressure them to disclose personal information.',
    'Prioritize intelligibility of numbers over accent imitation.',
  ],
  source: {
    repository: 'addvaluewithai-hub/english-course',
    branch: 'curriculum/level-source-of-truth-v1',
    path: 'curriculum/levels/a1/design-review/07-lesson-briefs/lesson-briefs.md',
    sourceLessonId: 'U1-L02',
  },
  scenes: [
    {
      id: 'build-useful-numbers',
      title: 'Build useful age numbers',
      goal: 'The learner can understand and say a few common age-sized numbers by using simple number patterns rather than memorizing a huge list.',
      teaching: {
        explainInArabic: [
          'اشرح إننا مش هنحفظ قائمة أرقام طويلة؛ هنستخدم patterns بسيطة عشان نبني الأرقام اللي بنحتاجها في السن.',
          'راجع بسرعة 1–20 حسب احتياج الطالب، وبعدها وضّح إن 20/30/40… هي أساس أرقام زي 21 و32 و47.',
          'لو ظهر لخبطة، وضّح فرق السمع والنطق بين أمثلة teen و tens زي thirteen / thirty من غير درس pronunciation طويل.',
        ],
        englishTargets: [
          '13 / 30',
          '14 / 40',
          '20 / 21',
          '30 / 32',
          '40 / 47',
        ],
        constraints: [
          'Use only a small sample of numbers needed to reveal the pattern.',
          'Do not require the learner to count from 1 to 100.',
          'Do not introduce hundreds, thousands, prices, dates, or phone-number strings.',
        ],
      },
      board: {
        type: 'steps',
        title: 'Build the number',
        items: [
          { title: '20', body: 'twenty' },
          { title: '21', body: 'twenty-one' },
          { title: '30', body: 'thirty' },
          { title: '32', body: 'thirty-two' },
        ],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Use two or three short listen-and-say checks with age-sized numbers. Keep it conversational and stop once the pattern is clear.',
        learnerTask: 'Listen to a few numbers and say a few numbers back using the pattern on the board.',
        teacherMoves: [
          'Say one age-sized number and ask the learner to identify it.',
          'Ask the learner to say one nearby number built from the same tens pattern.',
          'Use a teen/tens contrast only if the learner confuses it.',
          'Do not keep drilling once the learner has shown usable control.',
        ],
        acceptedResponseKinds: answerKinds,
        successCriteria: [
          { id: 'understands-number', label: 'Correctly understands at least one spoken age-sized number without needing a complete written model.' },
          { id: 'produces-number', label: 'Produces at least one age-sized number intelligibly using the taught number pattern.' },
        ],
        supportLadder: [
          'Repeat the number more slowly once.',
          'Point to the relevant tens pattern on the board.',
          'Break the number into tens + ones in Arabic, then ask for the English number.',
          'Model one nearby example, then ask for a different number using the same pattern.',
        ],
      },
    },
    {
      id: 'ask-age',
      title: 'Ask someone their age',
      goal: 'The learner can use How old are you? as the target age question.',
      teaching: {
        explainInArabic: [
          'اشرح إن السؤال الأساسي عن السن هنا هو How old are you?',
          'خليه chunk كامل للاستخدام؛ ما تحولش old أو are لشرح grammar منفصل.',
          'ذكّر إن السؤال شخصي في بعض المواقف، فإحنا بنتعلم الصيغة داخل تمرين/بروفايل بسيط.',
        ],
        englishTargets: [
          'How old are you?',
        ],
        constraints: [
          'The learner must ask the question; hearing the teacher ask it is not evidence.',
          'Do not introduce birth dates or When were you born?',
        ],
      },
      board: {
        type: 'note',
        title: 'Ask about age',
        body: 'How old are you?',
      },
      interaction: {
        kind: 'elicitation',
        setup: 'Tell the learner in Arabic that they are completing a simple class profile and need to ask your age.',
        learnerTask: 'Ask me my age.',
        teacherMoves: [
          'Set the profile context briefly.',
          'Wait for the learner to ask the question.',
          'Answer with a simple invented age.',
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
      title: 'Give an age clearly',
      goal: 'The learner can answer an age question with an intelligible number and a simple natural age pattern.',
      teaching: {
        explainInArabic: [
          "اشرح إن الإجابة الطبيعية ممكن تكون I'm 32. أو I'm 32 years old.",
          'وضّح إن years old اختيار مفيد لكنه مش لازم في كل مرة طالما المعنى واضح.',
          'اسمح للطالب يستخدم سن حقيقي أو رقم متخيل؛ الهدف اللغة مش البيانات الشخصية.',
        ],
        englishTargets: [
          "I'm 32.",
          "I'm 32 years old.",
        ],
        constraints: [
          'Do not force the learner to reveal their real age.',
          'Do not correct every pronunciation detail if the number is intelligible.',
        ],
      },
      board: {
        type: 'compare',
        title: 'Two natural answers',
        left: { title: "I'm 32." },
        right: { title: "I'm 32 years old." },
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Ask How old are you? and explicitly allow a real or invented age.',
        learnerTask: 'Answer with a real or invented age.',
        teacherMoves: [
          'Ask the age question once and wait.',
          'React to the answer naturally.',
          'If the number is unclear, ask only for the number again rather than restarting the whole scene.',
          'If the learner gives only a bare number, accept meaning first, then invite one full-pattern retry.',
        ],
        acceptedResponseKinds: answerKinds,
        successCriteria: [
          { id: 'gives-age-number', label: 'Produces an intelligible age-sized number.' },
          { id: 'uses-age-pattern', label: "Uses a usable age-answer frame such as I'm + number or I'm + number + years old." },
        ],
        supportLadder: [
          'Repeat the question slowly.',
          "Point to the two 'I'm…' frames on the board.",
          "Give the starter 'I'm…' and let the learner supply the number.",
          'Model one invented-age answer, then ask again for a different real or invented age.',
        ],
      },
    },
    {
      id: 'guided-age-exchange',
      title: 'Exchange age information',
      goal: 'The learner can both ask for and understand/give age information inside one short supported exchange.',
      teaching: {
        explainInArabic: [
          'قل للطالب إنكم هتملوا بروفايل بسيط لبعض: كل واحد يسأل التاني عن السن ويجاوب.',
          'وضح إن المطلوب محادثة قصيرة، مش حفظ سؤال وإجابة منفصلين.',
        ],
        englishTargets: [
          'How old are you?',
          "I'm ___ .",
          "I'm ___ years old.",
        ],
        constraints: [
          'Use invented ages freely so the task does not require personal disclosure.',
          'Do not expand into names, countries, jobs, dates, or contact details.',
        ],
      },
      board: {
        type: 'steps',
        title: 'Age exchange',
        items: [
          { title: '1 · Ask', body: 'How old are you?' },
          { title: '2 · Listen', body: 'Catch the number' },
          { title: '3 · Answer', body: "I'm ___ (years old)." },
        ],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Run a short two-way profile exchange using invented ages if needed.',
        learnerTask: 'Ask my age, understand my answer, then answer the same question yourself.',
        teacherMoves: [
          'Invite the learner to ask your age first.',
          'Answer with an age-sized number that was not just used in the previous example.',
          'Check comprehension naturally, for example by asking the learner to repeat the number only if needed.',
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
          'Point to the relevant step on the board.',
          'Give only a partial English frame.',
          'Model that one function, then resume with a different number.',
        ],
      },
    },
    {
      id: 'fresh-age-profile',
      title: 'Fresh age and number challenge',
      goal: 'The learner can use the age question and age-sized numbers in a new profile context without a complete model.',
      teaching: {
        explainInArabic: [
          'اعمل setup قصير: أنتم في language exchange وبتكملوا بروفايل بسيط. استخدم سن حقيقي أو متخيل براحتك.',
          'لا تراجع السؤال والإجابة قبل البداية؛ خليه يستخدم اللي اتعلمه.',
        ],
        englishTargets: [
          'How old are you?',
          "I'm ___ .",
          'age-sized numbers',
        ],
        constraints: [
          'No board and no complete model before the first attempt.',
          'Use a new age number in the teacher response.',
          'Do not require real personal age disclosure.',
          'If one function is missing, create one natural opportunity before giving direct support.',
        ],
      },
      interaction: {
        kind: 'fresh_transfer',
        setup: 'Roleplay another participant in a simple language-exchange profile activity. Let the learner handle the age exchange with reduced support.',
        learnerTask: 'Complete the age part of a new profile exchange with me.',
        teacherMoves: [
          'Give only the scenario and wait for the learner to take the first useful step.',
          'Use a fresh invented age in your own answer.',
          'Keep the exchange natural and short.',
          'Create a conversational opening for any missing required function.',
          'Complete the scene only after all required functions appear with enough independence.',
        ],
        acceptedResponseKinds: interactiveKinds,
        successCriteria: [
          { id: 'fresh-asks-age', label: 'Uses the age question with reduced support.' },
          { id: 'fresh-understands-number', label: 'Shows understanding of a fresh spoken age-sized number.' },
          { id: 'fresh-gives-age', label: 'Gives an intelligible real or invented age using a usable age frame.' },
        ],
        supportLadder: [
          'Give only an Arabic functional cue.',
          'Give the first one or two English words of the missing chunk.',
          'Offer a partial frame.',
          'Model once, then restart that part with a different number so the retry is fresh.',
        ],
      },
    },
  ],
};
