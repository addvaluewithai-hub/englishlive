import type { SceneLessonDefinition } from '../types';

const answerKinds = ['answer', 'continuation'] as const;
const interactiveKinds = ['answer', 'question', 'continuation'] as const;

export const A1_U1_L01_SCENE_LESSON: SceneLessonDefinition = {
  id: 'a1-u1-l01-hello-im',
  levelId: 'a1',
  unitId: 'a1-u1-first-contact',
  unitTitle: 'First Contact: Me and You',
  order: 1,
  title: "Hello. I'm …",
  subtitle: 'Greet someone, exchange names and handle a simple “How are you?” exchange.',
  performance: 'Greet, exchange names, and handle basic wellbeing/politeness in a first-contact exchange.',
  coreLanguage: [
    'Hello / Hi',
    'Good morning',
    "I'm …",
    'My name is …',
    "What's your name?",
    'How are you?',
    "I'm good, thanks.",
    "I'm fine, thank you.",
    'Thank you / Thanks',
  ],
  boundaries: [
    'Use only the minimum first-/second-person be needed for this exchange; do not teach a full verb-to-be table.',
    'Do not introduce broader reaction/news language reserved for later lessons.',
    'The final evidence must be fresh first-contact use, not copying a complete model.',
    'Do not require accent imitation; prioritize intelligibility and usable social language.',
  ],
  source: {
    repository: 'addvaluewithai-hub/english-course',
    branch: 'curriculum/level-source-of-truth-v1',
    path: 'curriculum/levels/a1/design-review/07-lesson-briefs/lesson-briefs.md',
    sourceLessonId: 'U1-L01',
  },
  scenes: [
    {
      id: 'greet-and-introduce',
      title: 'Say hello and introduce yourself',
      goal: 'The learner can greet another person and give their own name with one usable first-person pattern.',
      teaching: {
        explainInArabic: [
          'اشرح باختصار إن Hi وHello تحيتان عاديتان، وإن Good morning مناسبة للصباح.',
          "اشرح إن أبسط طريقتين للتعريف بالنفس هما I'm + name و My name is + name.",
          "لو احتجت تشرح الشكل، وضّح فقط إن I'm هي الصورة الطبيعية المختصرة لـ I am، من غير جدول قواعد.",
        ],
        englishTargets: [
          'Hi.',
          'Hello.',
          'Good morning.',
          "I'm Reem.",
          'My name is Reem.',
        ],
        constraints: [
          'Keep the explanation under roughly one minute unless the learner asks for clarification.',
          'Do not use the learner profile to say their name before they produce it themselves.',
          'Do not ask for spelling, country, job, or other later-lesson content.',
        ],
      },
      board: {
        type: 'examples',
        title: 'Meeting someone',
        items: [
          { title: 'Hi / Hello', body: 'Good morning — in the morning' },
          { title: "I'm ___", body: 'I am → I’m' },
          { title: 'My name is ___' },
        ],
      },
      interaction: {
        kind: 'elicitation',
        setup: 'After the micro-explanation, ask the learner to greet you and tell you their name in one short turn.',
        learnerTask: 'Say hello and tell me your name.',
        teacherMoves: [
          'Give one very short model with your own name only.',
          'Ask the learner for their own greeting + name.',
          'React warmly to the meaning before correcting anything small.',
          'If needed, repair only the missing greeting or name pattern and ask for one retry.',
        ],
        acceptedResponseKinds: answerKinds,
        successCriteria: [
          { id: 'uses-greeting', label: 'Uses an appropriate greeting such as Hi, Hello, or Good morning.' },
          { id: 'introduces-self', label: "Gives their own name using I'm + name or My name is + name, or an equally clear full first-contact pattern." },
        ],
        supportLadder: [
          'Repeat the task more simply in Arabic.',
          'Point the learner to the two name frames on the board.',
          "Give only the starter 'I'm…' and let the learner finish it.",
          'Model one full example with the teacher name, then ask the learner to try again with their own name.',
        ],
      },
    },
    {
      id: 'ask-the-name',
      title: "Ask the other person's name",
      goal: "The learner can use What's your name? as a real question to get another person's name.",
      teaching: {
        explainInArabic: [
          "اشرح إن What's your name? هي الطريقة الأساسية هنا لسؤال الشخص عن اسمه.",
          "لو مفيد، وضّح سريعًا إن What's هي What is، لكن ما تحولهاش لشرح grammar منفصل.",
        ],
        englishTargets: [
          "What's your name?",
          "I'm Reem.",
        ],
        constraints: [
          'Do not introduce spelling or surname questions yet.',
          'The learner must ask the question; hearing the teacher ask it is not evidence.',
        ],
      },
      board: {
        type: 'compare',
        title: 'Ask ↔ answer',
        left: { title: "What's your name?" },
        right: { title: "I'm Reem." },
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Tell the learner in Arabic that this time they are the one asking. Then wait.',
        learnerTask: 'Ask me my name.',
        teacherMoves: [
          'Set the task without saying the target question again immediately before the learner speaks if they already heard it in the explanation.',
          'Wait for the learner to ask.',
          'Answer naturally with the teacher name.',
          'If the question is incomplete but understandable, recast it once and ask the learner to try the question again.',
        ],
        acceptedResponseKinds: ['question'],
        successCriteria: [
          { id: 'asks-name', label: "Uses a comprehensible name question, with What's your name? as the target production." },
        ],
        supportLadder: [
          'Say in Arabic: اسألني أنا اسمي إيه.',
          'Point to the question side of the board.',
          "Give the starter 'What's…' and pause.",
          'Model the target question once, then create a new immediate retry.',
        ],
      },
    },
    {
      id: 'wellbeing-and-politeness',
      title: 'Handle “How are you?” politely',
      goal: 'The learner understands a basic wellbeing question and can give a simple polite answer.',
      teaching: {
        explainInArabic: [
          'اشرح إن How are you? سؤال بسيط عن الحال في بداية الكلام.',
          "قدّم إجابتين أو ثلاثة فقط: I'm good, thanks. / I'm fine, thank you. / I'm okay, thanks.",
          "اربط بسرعة بين I am و I'm لو احتاج الطالب، وخلّي How are you? مثال طبيعي على are مع you من غير جدول قواعد.",
        ],
        englishTargets: [
          'How are you?',
          "I'm good, thanks.",
          "I'm fine, thank you.",
          "I'm okay, thanks.",
          'Thanks / Thank you',
        ],
        constraints: [
          'Do not introduce a long feelings vocabulary list.',
          'Accept another simple truthful wellbeing adjective if the learner can make the exchange work.',
          'Keep politeness natural rather than demanding one exact memorized sentence.',
        ],
      },
      board: {
        type: 'examples',
        title: 'How are you?',
        items: [
          { title: "I'm good, thanks." },
          { title: "I'm fine, thank you." },
          { title: "I'm okay, thanks." },
        ],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Ask the learner How are you? naturally and let them answer as themselves.',
        learnerTask: 'Answer “How are you?” with a simple wellbeing answer and polite thanks.',
        teacherMoves: [
          'Ask How are you? once and wait.',
          'Accept a simple natural answer if the meaning is clear.',
          'If thanks/thank you is missing, react naturally and create one quick second try rather than lecturing.',
        ],
        acceptedResponseKinds: answerKinds,
        successCriteria: [
          { id: 'answers-wellbeing', label: 'Gives a comprehensible simple wellbeing answer.' },
          { id: 'uses-politeness', label: 'Uses thanks, thank you, or an equally simple polite response in the exchange.' },
        ],
        supportLadder: [
          'Repeat the question more slowly.',
          'Point to the three answer examples on the board.',
          "Give the starter 'I'm…' and let the learner choose the rest.",
          'Model one answer, then ask the question again for a fresh retry.',
        ],
      },
    },
    {
      id: 'guided-first-meeting',
      title: 'Put the pieces together',
      goal: 'The learner can participate in a short supported first-meeting exchange using the language already taught.',
      teaching: {
        explainInArabic: [
          'قل للطالب إنكم هتعملوا محادثة قصيرة كأنكم بتتقابلوا لأول مرة، ومش هنضيف لغة جديدة.',
          'وضّح إن البورد مجرد تذكير بالخطوات، مش نص لازم يقراه حرفيًا.',
        ],
        englishTargets: [
          'Greeting',
          'Name exchange',
          'How are you?',
          'Simple polite answer',
        ],
        constraints: [
          'Do not introduce new first-contact topics such as country, job, age, spelling, or contact details.',
          'Keep the exchange conversational, not four disconnected test questions.',
          'Do not insist on exact wording when the learner performs the same function clearly.',
        ],
      },
      board: {
        type: 'steps',
        title: 'First meeting',
        items: [
          { title: '1 · Greet' },
          { title: '2 · Exchange names' },
          { title: '3 · How are you?' },
          { title: '4 · Respond politely' },
        ],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Run a short first-meeting conversation. Let the learner carry the functions instead of feeding each full sentence.',
        learnerTask: 'Have a short first-meeting conversation with me using what you just learned.',
        teacherMoves: [
          'Start the social situation naturally with a greeting, unless the learner initiates first.',
          'Leave a real opening for the learner to give their name.',
          'Create a natural opportunity for the learner to ask your name instead of prompting the exact sentence immediately.',
          'Include a wellbeing exchange.',
          'Repair only blockers or the current lesson targets, then continue the conversation.',
        ],
        acceptedResponseKinds: interactiveKinds,
        successCriteria: [
          { id: 'guided-greeting', label: 'Participates in the greeting naturally.' },
          { id: 'guided-own-name', label: 'Gives their own name clearly.' },
          { id: 'guided-asks-name', label: 'Asks for the other person’s name.' },
          { id: 'guided-wellbeing', label: 'Handles the basic wellbeing exchange.' },
          { id: 'guided-politeness', label: 'Uses basic politeness appropriately.' },
        ],
        supportLadder: [
          'Give a functional cue only, such as: دلوقتي اسألني عن اسمي.',
          'Point to the relevant step on the board.',
          'Give only the beginning of the needed phrase.',
          'Model that one phrase, then resume the roleplay from a slightly different turn.',
        ],
      },
    },
    {
      id: 'fresh-first-contact',
      title: 'Fresh first-contact challenge',
      goal: 'The learner can use the lesson language in a new first-contact context with reduced support and no complete model.',
      teaching: {
        explainInArabic: [
          'اعمل setup قصير فقط: تخيل إنك قبل بداية الكورس قابلت زميل جديد لأول مرة. ابدأ الكلام معاه.',
          'لا تراجع الجمل قبل البداية؛ الهدف هنا نشوف هل الطالب يقدر يستخدم اللي اتعلمه في سياق جديد.',
        ],
        englishTargets: [
          'Greeting',
          'Self-introduction',
          "What's your name?",
          'How are you?',
          'Basic politeness',
        ],
        constraints: [
          'No board and no complete model before the first attempt.',
          'Do not recreate the same guided conversation turn-for-turn.',
          'If one function does not appear, create one natural opportunity for it before deciding the evidence is incomplete.',
          'Use support only after a genuine struggle, and reduce it again immediately.',
        ],
      },
      interaction: {
        kind: 'fresh_transfer',
        setup: 'Roleplay a new classmate before class. The learner should initiate. Respond as that new person and keep the exchange short and believable.',
        learnerTask: 'Imagine I am a new classmate. Start the conversation and get through a simple first meeting.',
        teacherMoves: [
          'Give only the scenario setup, then wait for the learner to initiate.',
          'Respond naturally as the new classmate.',
          'Do not ask every target in checklist order; let the exchange breathe.',
          'If a required function is missing, create one conversational opening for it.',
          'When all required functions have appeared with enough independence, complete the scene before speaking again.',
        ],
        acceptedResponseKinds: interactiveKinds,
        successCriteria: [
          { id: 'fresh-greeting', label: 'Initiates or handles an appropriate greeting in the fresh context.' },
          { id: 'fresh-own-name', label: 'Introduces themself clearly.' },
          { id: 'fresh-name-exchange', label: 'Successfully asks for or completes the other person’s name exchange.' },
          { id: 'fresh-wellbeing', label: 'Handles a basic How are you? exchange.' },
          { id: 'fresh-politeness', label: 'Uses basic politeness naturally enough for the first-contact exchange.' },
        ],
        supportLadder: [
          'Give a short Arabic functional cue without English wording.',
          'Offer only the first word of the needed English chunk.',
          'Give one partial frame, then restart that moment of the roleplay.',
          'As a last resort, model one missing phrase and create a different immediate opportunity to produce it.',
        ],
      },
    },
  ],
};
