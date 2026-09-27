import type { SceneLessonDefinition } from '../types';

export const A1_U1_L04_SCENE_LESSON: SceneLessonDefinition = {
  id: 'a1-u1-l04-personal-details',
  levelId: 'a1',
  unitId: 'a1-u1-first-contact',
  unitTitle: 'First Connections',
  order: 4,
  title: 'Ask and Answer Personal Questions',
  subtitle: 'Exchange four essential personal details and repair one unclear key detail in a short two-way conversation.',
  performance: 'In a fresh two-way information gap, ask for and answer name, origin, residence, and job, repairing one unclear key detail when needed.',
  coreLanguage: [
    "What's your name?",
    'Where are you from?',
    'Where do you live?',
    "What's your job?",
    'Are you a teacher? / Are you from Jordan?',
    'Is that Mona?',
    'Yes, I am. / No, I\'m not.',
    'Can you spell that?',
    'Please say that again.',
    "Yes, that's right.",
    'teacher / doctor / nurse / driver / manager / cook',
  ],
  boundaries: [
    'Build on U1-L01 to U1-L03: the learner already has basic social opening, listening for personal details, and short self-introduction language; do not reteach those lessons.',
    'Keep the exchange to name, origin, residence, and job plus one repair move; do not turn this into a long or open-ended interview.',
    'Treat Where do you live? and the other high-utility questions as usable frames; do not teach the full do/does or English question system.',
    'Use selected be questions and short answers only for identity, job, and origin checks; do not expand to a full present-be paradigm lesson.',
    'Use only the bounded familiar job set or a personally required job label; do not build a larger job vocabulary list.',
    'Practise spelling only to verify one unclear key item; do not teach the complete alphabet or phonics system.',
    'Accept intelligible question contours and accent variation. Pronunciation work should make the repaired key detail clear, not impose native-like rhythm.',
    'Allow safe fictional information and never require real private contact data.',
    'Fresh mastery gets detail labels/icons only. No full question, answer frame, dialogue model, or answer-bearing help before the first attempt.',
    'If answer-revealing help is needed during fresh mastery, classify that attempt as practice and use the fresh replacement scenario before judging mastery; allow at most two fresh attempts.',
  ],
  source: {
    repository: 'addvaluewithai-hub/english-course',
    branch: 'curriculum/level-source-of-truth-v1',
    path: 'units/a1-v1/unit-01-first-connections/lessons/u1-l04',
    sourceLessonId: 'U1-L04',
  },
  scenes: [
    {
      id: 'question-to-detail',
      title: 'Match each question to the detail it gets',
      goal: 'The learner can identify which of four personal-detail questions retrieves name, origin, residence, or job.',
      teaching: {
        explainInArabic: [
          'وضح إن كل سؤال هنا له وظيفة واحدة واضحة: اسم، أصل، سكن حالي، أو وظيفة. المطلوب اختيار السؤال المناسب للمعلومة الناقصة، مش حفظ مقابلة طويلة.',
          'أكد الفرق بين origin وresidence: Where are you from? للأصل، وWhere do you live? للسكن الحالي.',
        ],
        englishTargets: ["What's your name?", 'Where are you from?', 'Where do you live?', "What's your job?"],
        constraints: ['Keep the four frames as chunks.', 'Do not explain a general wh-question formula or do/does conjugation.'],
      },
      board: {
        type: 'examples',
        title: 'Question → detail',
        items: [
          { title: "What's your name?", body: 'name' },
          { title: 'Where are you from?', body: 'origin' },
          { title: 'Where do you live?', body: 'residence' },
          { title: "What's your job?", body: 'job' },
        ],
      },
      interaction: {
        kind: 'elicitation',
        setup: 'Give the four question frames in mixed order and ask the learner to match each one to its detail field.',
        learnerTask: 'Match each question to name, origin, residence, or job.',
        supportLadder: ['قول بالعربي اسم الخانة فقط.', 'Offer two field choices for one question.', 'Match one example, then use a different question for the retry.'],
      },
    },
    {
      id: 'ask-four-details',
      title: 'Ask for one missing detail at a time',
      goal: 'The learner can select and ask the fitting frame for each of the four required personal details.',
      teaching: {
        explainInArabic: [
          'خلي المتعلم يسأل سؤال واحد في كل مرة، حسب الخانة الناقصة. ما نطلبش منه يقول الأربع أسئلة كقطعة محفوظة.',
          'راجع بسرعة إن سؤال الأصل وسؤال السكن مختلفين في المعنى حتى لو الشخص من نفس المكان اللي عايش فيه.',
        ],
        englishTargets: ["What's your name?", 'Where are you from?', 'Where do you live?', "What's your job?"],
        constraints: ['Use only the four target questions.', 'Accept intelligible question intonation; do not impose one universal rise/fall pattern.'],
      },
      board: {
        type: 'steps',
        title: 'Ask for the missing field',
        items: [{ title: 'name' }, { title: 'origin' }, { title: 'residence' }, { title: 'job' }],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Name one missing field at a time in changing order and have the learner ask the matching question.',
        learnerTask: 'Ask the question that gets the detail I name.',
        supportLadder: ['Repeat the field meaning in Arabic.', 'Point to the matching field on the board.', 'Give the first word of the target question, then retry with a different field.'],
      },
    },
    {
      id: 'be-checks-and-short-answers',
      title: 'Check a detail and answer briefly',
      goal: 'The learner can use a bounded be-question check and a fitting short answer for identity, job, or origin.',
      teaching: {
        explainInArabic: [
          'قدّم Are you ...? للتأكد من معلومة عن الشخص، وIs that ...? للتأكد من الاسم. استخدم إجابة قصيرة واضحة بدل شرح قواعد كامل.',
          "خلي Yes, I am. وNo, I'm not. مرتبطين مباشرة بسؤال Are you ...? فقط في هذا الدرس.",
        ],
        englishTargets: ['Are you a teacher?', 'Are you from Jordan?', 'Is that Mona?', 'Yes, I am.', "No, I'm not.", "Yes, that's right."],
        constraints: ['Do not expand into all be-question persons or tenses.', 'Keep checks tied to identity, job, or origin.'],
      },
      board: {
        type: 'compare',
        title: 'Check → short answer',
        left: { title: 'Are you a nurse?', body: 'Yes, I am. / No, I’m not.' },
        right: { title: 'Is that Mona?', body: 'Yes, that’s right.' },
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Ask two or three bounded checks using fictional details and have the learner answer briefly, then switch roles for one check.',
        learnerTask: 'Answer the check, then ask me one check about a job or origin.',
        supportLadder: ['Give yes/no meaning in Arabic.', 'Offer the two short-answer choices.', 'Model one different fictional check, then ask the learner to make a new one.'],
      },
    },
    {
      id: 'bounded-job-language',
      title: 'Use a small familiar job set',
      goal: 'The learner can understand and use a fitting job label inside the target job question and answer.',
      teaching: {
        explainInArabic: [
          'استخدم مجموعة الوظائف الصغيرة الموجودة في المصدر فقط للتبادل: teacher, doctor, nurse, driver, manager, cook.',
          'لو المتعلم محتاج مسمى وظيفته فعلًا، ممكن نقبله، لكن ما نحولش المشهد لقائمة وظائف جديدة.',
        ],
        englishTargets: ['teacher', 'doctor', 'nurse', 'driver', 'manager', 'cook', "What's your job?", "I'm a nurse."],
        constraints: ['Do not expand the job list for teaching purposes.', 'Do not teach article rules beyond what the learner already met in U1-L03.'],
      },
      board: {
        type: 'examples',
        title: 'Familiar jobs',
        items: [{ title: 'teacher' }, { title: 'doctor' }, { title: 'nurse' }, { title: 'driver' }, { title: 'manager' }, { title: 'cook' }],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give a few fictional people from the bounded job set. The learner asks for or answers the job detail.',
        learnerTask: 'Ask or answer one job question using the supplied fictional detail.',
        supportLadder: ['Point to the job choices.', "Give only the question starter 'What's your…'", 'Model with one job, then retry with a different job.'],
      },
    },
    {
      id: 'repair-unclear-detail',
      title: 'Repair a detail instead of guessing',
      goal: 'The learner can request repetition or spelling when a key name or detail is unclear.',
      teaching: {
        explainInArabic: [
          'وضح إن طلب التكرار أو التهجئة مهارة تواصل طبيعية، مش علامة فشل. لو الاسم مش واضح ما نخمنش.',
          'Can you spell that? مناسب خصوصًا للاسم، وPlease say that again. مناسب لأي تفصيلة ما وصلتش بوضوح.',
        ],
        englishTargets: ['Can you spell that?', 'Please say that again.', "Yes, that's right."],
        constraints: ['Use spelling only to verify one unclear item.', 'Do not teach the full alphabet sequence.', 'Do not require private real data.'],
      },
      board: {
        type: 'examples',
        title: 'Repair, don’t guess',
        items: [
          { title: 'Can you spell that?', body: 'unclear name' },
          { title: 'Please say that again.', body: 'unclear key detail' },
          { title: "Yes, that's right.", body: 'confirm' },
        ],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Make one fictional name deliberately unclear and one job unclear. The learner chooses an appropriate repair rather than guessing.',
        learnerTask: 'Use a repair phrase when the key detail is unclear.',
        supportLadder: ['قول بالعربي: اطلب تهجئة ولا إعادة؟', 'Offer the two repair choices.', 'Model a repair with a different detail, then create a new unclear item for retry.'],
      },
    },
    {
      id: 'make-key-detail-clear',
      title: 'Make the corrected detail easier to hear',
      goal: 'The learner can repeat, slow, or spell one key item and make the corrected detail prominent without shouting.',
      teaching: {
        explainInArabic: [
          'لو الطرف الآخر ما فهمش، أعد الجزء المهم أبطأ أو هجّيه. خلّي الاسم أو الوظيفة المصححة أوضح من باقي الجملة من غير صراخ.',
          'الهدف إن المعلومة توصل، مش تقليد لهجة أمريكية أو rhythm مثالي.',
        ],
        englishTargets: ['M-O-N-A', 'My NAME is MONA.', 'Please say that again.'],
        constraints: ['Use English letter names only as needed for the chosen name.', 'Accept accent variation if the key item becomes intelligible.', 'Do not teach a full spelling-to-sound system.'],
      },
      board: {
        type: 'steps',
        title: 'Three repair choices',
        items: [{ title: 'repeat', body: 'say the key part again' }, { title: 'slow', body: 'slow the key part' }, { title: 'spell', body: 'letter names for the unclear name' }],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Signal that one fictional name or job was unclear. Ask the learner to repair it by repeating, slowing, or spelling the key item.',
        learnerTask: 'Repair the unclear detail so I can understand it.',
        supportLadder: ['Name the repair strategy only: repeat / slow / spell.', 'Ask which exact word needs to be clearer.', 'Model the strategy on a different word, then use a new target for retry.'],
      },
    },
    {
      id: 'guided-two-way-gap',
      title: 'Exchange four details with coaching',
      goal: 'The learner can complete a supported two-way exchange of the four required details and use one repair move.',
      teaching: {
        explainInArabic: [
          'اعمل information gap بشخصية خيالية. المتعلم يسأل عن أربع خانات ويجاوب عن أسئلتك المتغيرة. اعمل سوء سماع واحد يحتاج repair.',
          'كمدرس AI: سؤال واحد في كل مرة، تجاهل التردد البسيط لو المعنى واضح، وصحح مشكلة مهمة واحدة فقط في الدور ثم اطلب retry.',
        ],
        englishTargets: ['name', 'origin', 'residence', 'job', 'one repair'],
        constraints: [
          'This is coached practice and never assigns mastery.',
          'Accept safe fictional information without challenge.',
          'Prefer a neutral clarification signal before supplying a correction.',
          'Correct at most one meaning-critical issue per turn and require one retry after an important correction.',
        ],
      },
      board: {
        type: 'examples',
        title: 'Information gap',
        items: [{ title: 'name' }, { title: 'origin' }, { title: 'residence' }, { title: 'job' }, { title: 'repair one unclear detail' }],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Roleplay a fictional new class partner. Hold four details, ask changed questions back, and make one key detail genuinely unclear so repair is needed.',
        learnerTask: 'Ask me for all four details, answer my changed questions, and repair one unclear detail.',
        teacherMoves: [
          'Ask and answer one question at a time.',
          'When feedback is needed: name the successful action, quote only the important problem, give one natural correction or repair cue, explain briefly in Arabic, then ask for a retry.',
          'End with one changed coached attempt, but do not call it mastery.',
        ],
        supportLadder: ['Name the missing field in Arabic or English.', 'Point to the field label and give a neutral clarification signal.', 'Give one natural correction for the current problem only, require a retry, and keep the result as practice.'],
      },
    },
    {
      id: 'fresh-personal-detail-exchange',
      title: 'Fresh two-way personal-detail exchange',
      goal: 'The learner can independently exchange all four required details and repair one new unclear key detail in a changed situation.',
      teaching: {
        explainInArabic: [
          'اعمل setup فقط: قابلت زميلًا خياليًا جديدًا لمهمة ثنائية وتحتاج الاسم والأصل والسكن والوظيفة. اسأل الأربع معلومات وجاوب عن أسئلته المتغيرة، وأصلح تفصيلة غير واضحة لو احتجت.',
          'لا تعرض أي سؤال كامل أو إجابة نموذجية قبل المحاولة. المسموح فقط أسماء الخانات أو icons غير كاشفة للإجابة.',
        ],
        englishTargets: ['four fitting questions', 'four relevant answers', 'one repair if needed'],
        constraints: [
          'Use a new fictional partner, changed detail order, changed values, and a new repair target from guided practice.',
          'Before the first attempt, show detail labels/icons only; no full question frames, answer frames, dialogue, or answer-bearing model.',
          'Judge the complete exchange, not isolated exercise completion: each question must retrieve the intended detail, all four details must be exchanged both ways, and one unclear key detail must be repaired.',
          'If the learner needs answer-revealing help, mark that attempt as practice and restart with the replacement scenario: welcome a fictional volunteer, exchange four changed details, and repair a new unclear name or job.',
          'Maximum two fresh attempts. A second unsuccessful fresh attempt remains practiced/needs review, not demonstrated mastery.',
        ],
      },
      board: {
        type: 'examples',
        title: 'Four details',
        items: [{ title: 'name' }, { title: 'origin' }, { title: 'residence' }, { title: 'job' }],
      },
      interaction: {
        kind: 'fresh_transfer',
        setup: 'Roleplay a brand-new fictional class partner. Keep the information gap, order, and repair need different from guided practice.',
        learnerTask: 'Ask for name, origin, residence, and job; answer my changed questions; repair one unclear key detail if needed.',
        teacherMoves: [
          'Do not coach the learner toward the next question before the first full attempt.',
          'Use a natural clarification signal for the repair target without revealing the answer.',
          'After the full attempt, evaluate whether the four intended details were exchanged in both directions and the unclear key detail was repaired.',
        ],
        supportLadder: [
          'Give only the non-answer-bearing field label/icon for the missing communicative function.',
          'State in Arabic that a detail is missing or unclear without supplying any English wording.',
          'If a full question, answer frame, or model must be supplied, stop scoring that attempt, treat it as practice, and restart with the fresh volunteer replacement task.',
        ],
      },
    },
  ],
};
