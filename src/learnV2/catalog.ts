export type LearnV2PrepRole = 'use' | 'hear';

export interface LearnV2PrepItem {
  id: string;
  english: string;
  meaningAr: string;
  exampleEn: string;
  noteAr?: string;
  role: LearnV2PrepRole;
}

export interface LearnV2MoveStep {
  labelEn: string;
  explanationAr: string;
}

export interface LearnV2ListeningTurn {
  speaker: string;
  text: string;
  style?: string;
}

export interface LearnV2ListeningQuestion {
  id: string;
  promptAr: string;
  options: string[];
  answerIndex: number;
  feedbackAr: string;
}

export interface LearnV2ListeningClip {
  id: string;
  titleAr: string;
  subtitleAr: string;
  speakers: Array<{ speaker: string; voice: string }>;
  turns: LearnV2ListeningTurn[];
  questions: LearnV2ListeningQuestion[];
}

export interface LearnV2Lesson {
  id: string;
  level: 'A1' | 'B1';
  unit: number;
  lesson: number;
  code: string;
  titleEn: string;
  titleAr: string;
  estimatedMinutes: number;
  goalAr: string;
  goalExample: string[];
  prepIntroAr: string;
  prepItems: LearnV2PrepItem[];
  move: {
    eyebrowAr: string;
    titleAr: string;
    introAr: string;
    steps: LearnV2MoveStep[];
    example: Array<{ speaker: string; text: string }>;
    noteAr: string;
    languageNote?: Array<{ form: string; explanationAr: string }>;
  };
  listeningIntroAr: string;
  listeningClips: LearnV2ListeningClip[];
  missionScenarioId: string;
  missionTitleAr: string;
  missionSetupAr: string;
  missionUsefulLanguage: string[];
  sourceNoteAr: string;
}

export const LEARN_V2_LESSONS: LearnV2Lesson[] = [
  {
    id: 'a1-u1-l01',
    level: 'A1',
    unit: 1,
    lesson: 1,
    code: 'A1 • U1-L01',
    titleEn: "Hello. I'm …",
    titleAr: 'أول تعارف بسيط',
    estimatedMinutes: 9,
    goalAr: 'بعد الدرس ده هتقدر تسلّم على شخص، تقول اسمك، تسأل عن اسمه، وتتعامل مع How are you? بشكل طبيعي.',
    goalExample: [
      'Hi! I’m Maya.',
      'Hello! I’m Adam. Nice to meet you.',
    ],
    prepIntroAr: 'مش محتاج تحفظ حوار كامل. جهّز القطع الصغيرة دي الأول، وبعدها هتسمعها وتستخدمها بنفسك.',
    prepItems: [
      { id: 'hi', english: 'Hi / Hello', meaningAr: 'أهلاً / مرحبًا', exampleEn: 'Hi! I’m Adam.', role: 'use' },
      { id: 'good-morning', english: 'Good morning', meaningAr: 'صباح الخير', exampleEn: 'Good morning!', role: 'use' },
      { id: 'im', english: 'I’m …', meaningAr: 'أنا …', exampleEn: 'I’m Salma.', noteAr: 'I’m هي الشكل الطبيعي المختصر لـ I am في الكلام.', role: 'use' },
      { id: 'my-name', english: 'My name is …', meaningAr: 'اسمي …', exampleEn: 'My name is Omar.', role: 'use' },
      { id: 'whats-your-name', english: 'What’s your name?', meaningAr: 'اسمك إيه؟', exampleEn: 'Hi. What’s your name?', role: 'use' },
      { id: 'how-are-you', english: 'How are you?', meaningAr: 'عامل إيه؟ / أخبارك إيه؟', exampleEn: 'Hi, Sara. How are you?', role: 'use' },
      { id: 'wellbeing', english: 'I’m good / fine / okay, thanks.', meaningAr: 'أنا كويس، شكرًا.', exampleEn: 'I’m good, thanks.', role: 'use' },
      { id: 'thanks', english: 'Thank you / Thanks', meaningAr: 'شكرًا', exampleEn: 'Fine, thanks.', role: 'use' },
    ],
    move: {
      eyebrowAr: 'الفكرة الصغيرة',
      titleAr: 'التعارف مش محتاج سكريبت طويل',
      introAr: 'أربع حركات بسيطة كفاية عشان تبدأ. الترتيب مش قانون؛ هو بس خريطة تساعدك في أول مرة.',
      steps: [
        { labelEn: 'Greet', explanationAr: 'ابدأ بتحية قصيرة.' },
        { labelEn: 'Say your name', explanationAr: 'قول اسمك بجملة بسيطة.' },
        { labelEn: 'Ask', explanationAr: 'اسأل الطرف التاني عن اسمه.' },
        { labelEn: 'Respond', explanationAr: 'اتعامل مع How are you? برد قصير طبيعي.' },
      ],
      example: [
        { speaker: 'A', text: 'Hi! I’m Yasser.' },
        { speaker: 'B', text: 'Hello! I’m Maya.' },
        { speaker: 'A', text: 'How are you?' },
        { speaker: 'B', text: 'I’m good, thanks.' },
      ],
      noteAr: 'ده مثال، مش script مطلوب تحفظه. في المحادثة الحقيقية ممكن الترتيب يتغير.',
      languageNote: [
        { form: 'I’m = I am', explanationAr: 'في الكلام الطبيعي الاختصار شائع جدًا.' },
        { form: 'What’s = What is', explanationAr: 'هتسمع الشكل المختصر أكتر في المحادثة.' },
      ],
    },
    listeningIntroAr: 'اسمع تعارف قصير بين شخصين. أول مرة اسمع للمعنى فقط؛ وبعدها جاوب سؤالين بسيطين.',
    listeningClips: [
      {
        id: 'a1-u1-l01-first-meeting',
        titleAr: 'أول يوم في مكان جديد',
        subtitleAr: 'Maya و Adam بيتقابلوا لأول مرة.',
        speakers: [
          { speaker: 'Maya', voice: 'Kore' },
          { speaker: 'Adam', voice: 'Puck' },
        ],
        turns: [
          { speaker: 'Maya', text: 'Hi! Good morning.', style: 'friendly, slightly nervous, clear and unhurried' },
          { speaker: 'Adam', text: 'Morning! I’m Adam. What’s your name?', style: 'warm, relaxed and friendly' },
          { speaker: 'Maya', text: 'I’m Maya.', style: 'friendly, slightly nervous' },
          { speaker: 'Adam', text: 'Hi, Maya. How are you?', style: 'warm and interested' },
          { speaker: 'Maya', text: 'I’m good, thanks. A little nervous, actually.', style: 'honest, slightly nervous' },
          { speaker: 'Adam', text: 'Me too. First day!', style: 'light, reassuring and friendly' },
        ],
        questions: [
          {
            id: 'adam-name',
            promptAr: 'اسم الشخص التاني إيه؟',
            options: ['Adam', 'Maya', 'Omar'],
            answerIndex: 0,
            feedbackAr: 'صح — هو قال: “I’m Adam.”',
          },
          {
            id: 'maya-feeling',
            promptAr: 'Maya حاسة بإيه؟',
            options: ['Angry', 'A little nervous', 'Very tired'],
            answerIndex: 1,
            feedbackAr: 'صح — قالت إنها كويسة، بس nervous شوية.',
          },
        ],
      },
    ],
    missionScenarioId: 'learn-v2-a1-u1-l01',
    missionTitleAr: 'قابل شخص لأول مرة',
    missionSetupAr: 'إنت في English meetup صغير. Otti شخص أول مرة تقابله. مفيش إجابة نموذجية قدامك — خليك بسيط واستخدم اللي يناسبك.',
    missionUsefulLanguage: ['Hi / Hello', 'I’m …', 'What’s your name?', 'How are you?', 'I’m good, thanks.'],
    sourceNoteAr: 'مصمم من A1 U1-L01: greet, exchange names, basic wellbeing and politeness. باقي source records دعم للمهمة، مش mini-lessons منفصلة.',
  },
  {
    id: 'b1-u1-l01',
    level: 'B1',
    unit: 1,
    lesson: 1,
    code: 'B1 • U1-L01',
    titleEn: 'Reconnect without a script',
    titleAr: 'ارجع للكلام من غير سكريبت',
    estimatedMinutes: 13,
    goalAr: 'بعد الدرس ده هتقدر تدخل محادثة مألوفة من opening مش متوقع، تمسك تفصيلة من كلام الشخص، وتخلق الخطوة اللي بعدها بدل ما تستنى سؤال محفوظ.',
    goalExample: [
      'I started something new last month.',
      'Really? What made you try it?',
    ],
    prepIntroAr: 'في B1 مش كل كلمة جديدة لازم تنتجها. هنفصل بين language مفيد تستخدمه، وكلمات يكفي إنك تفهمها لما تسمعها.',
    prepItems: [
      {
        id: 'hear-of',
        english: 'Have you heard of … ?',
        meaningAr: 'سمعت عن …؟',
        exampleEn: 'Have you heard of that new restaurant?',
        noteAr: 'مفيد لفتح موضوع أو التأكد إن الشخص يعرف الحاجة اللي بتتكلم عنها.',
        role: 'use',
      },
      {
        id: 'get-on-with',
        english: 'get on with somebody',
        meaningAr: 'تكون علاقتك كويسة بحد / تتفاهم معاه',
        exampleEn: 'I get on really well with my new manager.',
        role: 'use',
      },
      {
        id: 'too-bad',
        english: 'Too bad.',
        meaningAr: 'خسارة / يا للأسف',
        exampleEn: '“I can’t come on Friday.” — “Too bad. Maybe next week.”',
        noteAr: 'النبرة مهمة: هنا reaction متعاطف، مش حكم إن الحاجة “سيئة جدًا”.',
        role: 'use',
      },
      { id: 'competitor', english: 'competitor', meaningAr: 'منافس', exampleEn: 'One competitor was very strong.', role: 'hear' },
      { id: 'entertainment', english: 'entertainment', meaningAr: 'ترفيه', exampleEn: 'There was live entertainment after the event.', role: 'hear' },
      { id: 'photography', english: 'photography', meaningAr: 'التصوير', exampleEn: 'She started a photography course.', role: 'hear' },
      { id: 'rugby', english: 'rugby', meaningAr: 'الرجبي', exampleEn: 'He joined a local rugby club.', role: 'hear' },
      { id: 'talented', english: 'talented', meaningAr: 'موهوب', exampleEn: 'She’s a talented photographer.', role: 'hear' },
    ],
    move: {
      eyebrowAr: 'Communication move',
      titleAr: 'خد خطوتك الجاية من آخر حاجة اتقالت',
      introAr: 'بدل ما تحفظ سؤال جاهز، اسمع آخر turn كويس وخلي ردك يطلع منه.',
      steps: [
        { labelEn: 'React', explanationAr: 'ورّي إنك سمعت المعنى فعلًا.' },
        { labelEn: 'Pick', explanationAr: 'امسك تفصيلة واحدة تستاهل تكمل فيها.' },
        { labelEn: 'Continue', explanationAr: 'اسأل، علّق أو أضف حاجة تخلي الحوار يتحرك.' },
      ],
      example: [
        { speaker: 'A', text: 'I started a photography course last month.' },
        { speaker: 'B', text: 'Really? What made you try it?' },
      ],
      noteAr: 'المهم مش تحفظ “What made you…?”. المهم إن السؤال أو التعليق يطلع من التفصيلة اللي الشخص قالها.',
    },
    listeningIntroAr: 'هتسمع clipين قصار من catch-up طبيعي. ركّز على إزاي كل شخص بيبني على كلام التاني، مش على حفظ كل كلمة.',
    listeningClips: [
      {
        id: 'b1-u1-l01-catchup-one',
        titleAr: 'خبر جديد عن النادي',
        subtitleAr: 'Nora و Omar بيتكلموا بعد فترة.',
        speakers: [
          { speaker: 'Nora', voice: 'Aoede' },
          { speaker: 'Omar', voice: 'Charon' },
        ],
        turns: [
          { speaker: 'Nora', text: 'Hey, Omar. It’s been ages. Have you heard of the new sports center near my office?', style: 'casual, upbeat and friendly' },
          { speaker: 'Omar', text: 'Yeah, the one with the rugby club?', style: 'relaxed and interested' },
          { speaker: 'Nora', text: 'That’s it. My brother joined last month. He gets on really well with the team.', style: 'conversational and warm' },
          { speaker: 'Omar', text: 'Nice. Is he any good?', style: 'genuinely curious' },
          { speaker: 'Nora', text: 'Actually, he’s pretty talented. His first match is Saturday.', style: 'proud and upbeat' },
          { speaker: 'Omar', text: 'Ah, I can’t make it. I’m working.', style: 'slightly disappointed' },
          { speaker: 'Nora', text: 'Too bad. Maybe next time.', style: 'sympathetic and light' },
        ],
        questions: [
          {
            id: 'brother-update',
            promptAr: 'إيه الخبر الجديد عن أخو Nora؟',
            options: ['بدأ شغل جديد', 'انضم لنادي rugby', 'بدأ كورس photography'],
            answerIndex: 1,
            feedbackAr: 'صح — انضم للنادي الشهر اللي فات وبدأ ينسجم مع الفريق.',
          },
          {
            id: 'too-bad-function',
            promptAr: 'Nora قالت “Too bad” ليه؟',
            options: ['عشان Omar مش هيقدر يحضر', 'عشان أخوها لعب وحش', 'عشان النادي قفل'],
            answerIndex: 0,
            feedbackAr: 'بالظبط — دي reaction متعاطفة على خبر إن Omar مش هيقدر ييجي.',
          },
        ],
      },
      {
        id: 'b1-u1-l01-catchup-two',
        titleAr: 'مسابقة التصوير',
        subtitleAr: 'الحوار بيتحرك لموضوع تاني بشكل طبيعي.',
        speakers: [
          { speaker: 'Omar', voice: 'Charon' },
          { speaker: 'Nora', voice: 'Aoede' },
        ],
        turns: [
          { speaker: 'Omar', text: 'What about you? Still doing photography?', style: 'casual and interested' },
          { speaker: 'Nora', text: 'Yeah. I entered a small competition last week.', style: 'relaxed' },
          { speaker: 'Omar', text: 'How did it go?', style: 'genuinely curious' },
          { speaker: 'Nora', text: 'I came second. One competitor was amazing.', style: 'pleased but modest' },
          { speaker: 'Omar', text: 'Second is great. Who wouldn’t be happy with that?', style: 'warm, lightly emphatic and encouraging' },
          { speaker: 'Nora', text: 'True. The event was fun too. There was live entertainment after the results.', style: 'cheerful and relaxed' },
        ],
        questions: [
          {
            id: 'competition-result',
            promptAr: 'Nora عملت إيه في المسابقة؟',
            options: ['جت الأولى', 'جت الثانية', 'ماكملتش المسابقة'],
            answerIndex: 1,
            feedbackAr: 'صح — قالت: “I came second.”',
          },
          {
            id: 'rhetorical-question',
            promptAr: 'لما Omar قال “Who wouldn’t be happy with that?” هل هو مستني اسم شخص فعلًا؟',
            options: ['أيوه، مستني اسم', 'لأ، قصده إن معظم الناس هتكون مبسوطة'],
            answerIndex: 1,
            feedbackAr: 'بالظبط — ده rhetorical question؛ المعنى أهم من إجابة حرفية على السؤال.',
          },
        ],
      },
    ],
    missionScenarioId: 'learn-v2-b1-u1-l01',
    missionTitleAr: 'Catch up من غير سكريبت',
    missionSetupAr: 'هتقابل شخص تعرفه بعد فترة. هو هيبدأ بحاجة مألوفة لكن غير متوقعة. هدفك مش تقول كلمات بعينها؛ هدفك تدخل في الكلام وتخلق next move طبيعي.',
    missionUsefulLanguage: ['Have you heard of … ?', 'get on with somebody', 'Too bad.', 'Really?', 'What made you … ?'],
    sourceNoteAr: 'مصمم من B1 U1-L01. الكلمات competitor / entertainment / photography / rugby / talented استقبالها وفهمها أهم من إجبار الطالب على إنتاجها.',
  },
];

const LESSONS_BY_ID = new Map(LEARN_V2_LESSONS.map((lesson) => [lesson.id, lesson]));
const CLIPS_BY_ID = new Map(LEARN_V2_LESSONS.flatMap((lesson) => lesson.listeningClips.map((clip) => [clip.id, clip] as const)));

export function learnV2LessonById(id?: string) {
  return id ? LESSONS_BY_ID.get(id) : undefined;
}

export function learnV2ListeningClipById(id?: string) {
  return id ? CLIPS_BY_ID.get(id) : undefined;
}
