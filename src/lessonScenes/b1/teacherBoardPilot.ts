import type { SceneLessonDefinition } from '../types';

// Standalone opt-in teaching experiment. No changes to the released B1 curriculum.
export const B1_L02_TEACHER_BOARD_PILOT: SceneLessonDefinition = {
  id: 'b1-u1-l02-teacher-board-lab',
  levelId: 'b1',
  unitId: 'b1-u1-independent-conversation',
  unitTitle: 'From Routine Exchange to Independent Conversation',
  order: 2,
  title: 'Keep the Conversation Going · Teacher Lab',
  subtitle: 'A guided photo-club story, interactive board checks, and a fresh spoken transfer.',
  performance: 'Understand and use get to know and keep in touch in changed social situations, then follow up naturally without a supplied script.',
  coreLanguage: ['get to know somebody', 'keep in touch with somebody', 'react and ask one relevant follow-up'],
  boundaries: [
    'This is an opt-in partial B1 U1-L02 experiment, not the full official lesson or B1 mastery.',
    'Keep one continuing story about Lina and a photography club for teaching.',
    'For the last scene use a different work or course setting; hide the board and do not model a full answer.',
    'The application checks board selections; a correct tap is comprehension practice, not spoken evidence.',
    'Wait for the correct board result and a real learner spoken attempt before calling complete_scene.',
    'Speak concise Egyptian Arabic to explain meanings; use English for example sentences and roleplay.',
    'Never demand an immediate echo as proof of independent speaking.',
  ],
  source: {
    repository: 'addvaluewithai-hub/english-course',
    branch: '801114fdd860e8b9c1e7b137a0af1c3b3cc0e9cb',
    path: 'curriculum/levels/b1/design-review/07-lesson-briefs/lesson-briefs.md#u1-l02--keep-a-familiar-conversation-going',
    sourceLessonId: 'U1-L02 / teacher-lab',
  },
  scenes: [
    {
      id: 'warm-up',
      title: 'Learn to react and ask a natural follow-up',
      goal: 'After seeing one authored example, respond to a familiar update and ask one relevant next question in the learner’s own words.',
      teaching: {
        explainInArabic: ['ابدأ بالسكريبت المكتوب: اشرح React ثم Pick ثم Continue مع مثال واضح قبل ما الطالب يجرب.', 'ما تحوّلش المقدمة إلى اختبار ارتجالي قبل الشرح.'],
        englishTargets: ['Really?', 'That sounds interesting.', 'What do you do there?'],
        constraints: ['The application reads three authored lines with a changing board before inviting a response.', 'Do not introduce either relationship phrase in this scene.'],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'After the authored three-step explanation, let the learner react to a photography-club update and create one relevant follow-up.',
        learnerTask: 'React to the news and ask about one detail.',
        supportLadder: ['فكّر في تفصيلة واحدة تسأل عنها.', 'Give only the function: reaction + follow-up.', 'If a full question must be modelled, change the detail and retry.'],
      },
    },
    {
      id: 'get-to-know',
      title: 'Meeting people: get to know',
      goal: 'Recognise get to know as becoming familiar with someone gradually, then use it independently in a changed spoken situation.',
      teaching: {
        explainInArabic: ['احكي إن Lina اتعرفت على ناس في النادي بالتدريج. وضح get to know مش معناها تواصل قديم؛ معناها المعرفة بتتكون.', 'اقرأ الجملة I am getting to know Lina. بعدين اطلب من الطالب يختار الجملة المناسبة على البورد.', 'بعد الإجابة الصحيحة اطلب كلام بصوت الطالب في موقف جديد عن زميل أو جار، مش تكرار جملة Lina.'],
        englishTargets: ['get to know', 'I am getting to know Lina at the club.'],
        constraints: ['Do not reveal the correct board option before the attempt.', 'Board success alone never completes the scene.'],
      },
      board: {
        type: 'examples',
        title: 'A relationship begins',
        items: [{ title: 'get to know', body: 'become familiar with someone over time' }],
      },
      activity: {
        promptAr: 'لسه بدأت تقابل Lina في النادي وبتتعرف عليها بالتدريج. أنهي جملة توصف ده؟',
        options: [
          { id: 'new', text: "I'm getting to know Lina at the club." },
          { id: 'old', text: 'We still keep in touch after the club.' },
        ],
        correctOptionId: 'new',
        successAr: 'بالضبط! get to know يعني العلاقة والمعرفة بتبدأ وتتطور.',
        retryAr: 'ركّز: العلاقة هنا لسه بتبدأ، مش ناس كانوا يعرفوا بعض وبيفضلوا على تواصل.',
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Have the learner use get to know naturally with a new coworker or neighbour only after the board check passes.',
        learnerTask: 'Say that you are getting to know someone in a changed setting.',
        supportLadder: ['معناها بتتعرف عليه تدريجيًا.', 'Show the chunk get to know.', 'Model one other person then change the person again for a fresh attempt.'],
      },
    },
    {
      id: 'keep-in-touch',
      title: 'Staying connected: keep in touch',
      goal: 'Recognise keep in touch as continuing contact after people separate, then use it in a fresh spoken example.',
      teaching: {
        explainInArabic: ['بعد شهور Lina سافرت، لكن لسه في رسايل بينهم. هنا بقى keep in touch لأن الاتصال مستمر رغم البعد.', 'انطق We still keep in touch، ثم خليه يجاوب على البورد، وبعدها يختار شخص مختلف ويوصف تواصلهم بصوته.'],
        englishTargets: ['keep in touch with', 'We still keep in touch.'],
        constraints: ['Do not reveal the correct board option first.', 'Do not treat clicking as proof of spoken production.'],
      },
      board: {
        type: 'examples',
        title: 'The contact continues',
        items: [{ title: 'keep in touch', body: 'continue talking or messaging after being apart' }],
      },
      activity: {
        promptAr: 'Lina سافرت، لكن لسه بتتكلموا كل أسبوع. أنهي جملة أنسب؟',
        options: [
          { id: 'new', text: "I'm getting to know Lina for the first time." },
          { id: 'contact', text: 'We still keep in touch.' },
        ],
        correctOptionId: 'contact',
        successAr: 'صح! keep in touch معناها نفضل على تواصل، حتى لو بعيد عن بعض.',
        retryAr: 'دي علاقة موجودة بالفعل؛ المطلوب استمرار التواصل مش التعارف لأول مرة.',
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'After the board check, ask about staying in contact with a former classmate or family friend, then switch person for an independent retry as needed.',
        learnerTask: 'Say in English that you still keep in touch with someone from the past.',
        supportLadder: ['تواصل مستمر بعد ما تبعدوا.', 'Give only keep in touch.', 'Model one full sentence then switch person for the fresh retry.'],
      },
    },
    {
      id: 'compare-and-use',
      title: 'Choose the right relationship move',
      goal: 'Distinguish starting a relationship from maintaining one in two changed spoken contexts.',
      teaching: {
        explainInArabic: ['على البورد المقارنة بين العبارتين. اعمل موقف أول فيه حد جديد، وموقف تاني فيه صديق قديم. ما تقرأش الإجابات قبل المحاولة.', 'بعد اختيار التعبير المناسب، خليه يشرح موقف حقيقي أو متخيل بجملة من عنده.'],
        englishTargets: ['get to know = new relationship', 'keep in touch = continuing contact'],
      },
      board: {
        type: 'compare',
        title: 'Two different moments',
        left: { title: 'get to know', body: 'when a relationship is developing' },
        right: { title: 'keep in touch', body: 'when contact continues' },
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give two changed persons/context updates. Ask the learner for a full original sentence in each, selecting the appropriate expression by meaning.',
        learnerTask: 'Use each expression in a different meaningful sentence.',
        supportLadder: ['سؤال: جديد في حياتك ولا شخص قديم ولسه بتتكلموا؟', 'Point to the relevant side of the board.', 'Model only one meaning then test in a new context.'],
      },
    },
    {
      id: 'fresh-transfer',
      title: 'Fresh conversation without the board',
      goal: 'Sustain a new familiar conversation for several learner turns, naturally using the relationship ideas and a relevant follow-up without a script.',
      teaching: {
        explainInArabic: ['غير السياق تمامًا: زميل في الشغل اتنقل لفريق جديد، أو حد رجع بعد كورس. سيب الطالب يقود الموضوع.', 'ما تعلنش استخدام العبارات ولا تعرض البورد. استمع للمعنى وشجّع follow-up طبيعي.'],
        englishTargets: ['react', 'relevant follow-up', 'relationship/contact language when appropriate'],
        constraints: ['No board, no completed dialogue and no target phrase named before the first attempt.', 'Seek multiple real learner turns.', 'Do not require the exact phrase where another natural expression works.'],
      },
      interaction: {
        kind: 'fresh_transfer',
        setup: 'You are a colleague sharing a fresh, unrelated update: your team changed recently and you are meeting new coworkers while still messaging old ones. Give one new detail per turn.',
        learnerTask: 'Keep the conversation moving with natural reactions, questions, and relevant relationship language.',
        teacherMoves: ['Offer a changed detail after each learner follow-up.', 'Leave room for spontaneous questions.', 'Only finish after several actual learner turns.'],
        supportLadder: ['اتفاعل مع آخر تفصيلة واسأل عن واحدة جديدة.', 'Give the social function but not a full English sentence.', 'If modelling is needed, change scenario and gather a fresh independent attempt.'],
      },
    },
  ],
};
