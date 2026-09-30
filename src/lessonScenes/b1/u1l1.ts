import type { SceneLessonDefinition } from '../types';

export const B1_U1_L01_SCENE_LESSON: SceneLessonDefinition = {
  id: 'b1-u1-l01-reconnect-without-script',
  levelId: 'b1',
  unitId: 'b1-u1-independent-conversation',
  unitTitle: 'From Routine Exchange to Independent Conversation',
  order: 1,
  title: 'Reconnect Without a Script',
  subtitle: 'Enter a familiar conversation from an unexpected opening, react naturally, and establish a topic without a memorised dialogue.',
  performance: 'From a fresh familiar opening, respond appropriately and create the next conversational move so a real topic begins without a full model dialogue.',
  coreLanguage: [
    'Have you heard of …?',
    'I get on with …',
    'Too bad.',
    'A2 social opening and wellbeing language is retrieval only, not new B1 content.',
    'Receptive context vocabulary: competitor, entertainment, photography, rugby, talented.',
    'Receptive support: extract key facts from a short familiar phone-style exchange and recognise a basic rhetorical question.',
    'Sound perception and word recognition support intelligibility and listening; no accent target.',
  ],
  boundaries: [
    'This is not a greetings lesson. Do not reteach A2 hello/how-are-you routines as new language.',
    'The primary outcome is entering an unprepared familiar conversation and creating the next move.',
    'Teach get on with, hear of, and too bad as usable formulaic resources inside conversation, not as an isolated phrase list.',
    'competitor, entertainment, photography, rugby, and talented are receptive/contextual here: learners should understand them in familiar talk but do not need to produce all five.',
    'Phone-style factual listening and rhetorical-question recognition remain receptive support; do not convert them into productive speaking requirements.',
    'Keep topics familiar and concrete: family, hobbies, work, people, leisure, simple news.',
    'Do not require advanced small talk, idiomatic humour, abstract opinion, or long storytelling.',
    'The final transfer must change person/topic and must not provide an answer-bearing model before the learner responds.',
  ],
  source: {
    repository: 'addvaluewithai-hub/english-course',
    branch: '801114fdd860e8b9c1e7b137a0af1c3b3cc0e9cb',
    path: 'curriculum/levels/b1/design-review/07-lesson-briefs/lesson-briefs.md#u1-l01--reconnect-without-a-script',
    sourceLessonId: 'U1-L01',
  },
  scenes: [
    {
      id: 'cold-entry-diagnostic',
      title: 'Enter a conversation that starts unexpectedly',
      goal: 'The learner can react to a familiar unexpected opening and create a relevant next move.',
      teaching: {
        explainInArabic: [
          'من غير شرح طويل، قول إنك هتبدأ كلام عادي بجملة مش متوقعة، والمطلوب رد مناسب وبعده خطوة تخلي الكلام يكمل.',
        ],
        englishTargets: ['spontaneous reaction', 'one relevant next move'],
        constraints: [
          'Treat this as a light diagnostic before explicit phrase teaching.',
          'Do not give a model before the first attempt.',
          'Use two changed openings before completing unless the first exchange already gives unusually strong multi-turn evidence.',
        ],
      },
      board: {
        type: 'compare',
        title: 'Keep it alive',
        left: { title: 'React', body: 'show you understood the update' },
        right: { title: 'Next move', body: 'ask or add something connected' },
      },
      interaction: {
        kind: 'elicitation',
        setup: 'Give one ordinary positive update, then later a different ordinary negative or neutral update. The learner should react and create the next move rather than wait for a textbook question.',
        learnerTask: 'React naturally and make one connected next move.',
        supportLadder: [
          'قل بالعربي: اتفاعل مع المعنى، وبعدها اسأل أو ضيف حاجة مرتبطة.',
          'Name only the two functions: reaction + next move.',
          'Model one reaction only, then change the opening and let the learner create the next move.',
        ],
      },
    },
    {
      id: 'hear-of-teach-use',
      title: 'Open or check a topic with hear of',
      goal: 'The learner can understand and independently use Have you heard of…? to check familiarity with a person, place, activity, or topic.',
      teaching: {
        explainInArabic: [
          'قدّم Have you heard of…? كطريقة نسأل بيها هل الشخص يعرف أو سمع عن شخص أو مكان أو نشاط.',
          'خلي أول مثال صغير، وبعده غيّر الموضوع وخلي المتعلم يبني السؤال بنفسه.',
        ],
        englishTargets: ['Have you heard of that photography club?'],
        constraints: [
          'Do not turn this into hear vs hear about vs listen.',
          'An immediate repetition after your model is practice only.',
          'Before completing, create a fresh topic where the learner has to recover the phrase with reduced support.',
        ],
      },
      board: {
        type: 'examples',
        title: 'Check familiarity',
        items: [{ title: 'Have you heard of …?', body: 'person · place · activity · topic' }],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Use two different familiar contexts. Support the first if needed; make the second meaningfully different and less cued.',
        learnerTask: 'Ask naturally whether I know the new person, place, activity, or topic.',
        supportLadder: [
          'Give the communicative job in Arabic only.',
          'Show Have you heard of…? without completing the object.',
          'Model one full example, then switch topic before the independent retry.',
        ],
      },
    },
    {
      id: 'get-on-with-teach-use',
      title: 'Describe an easy relationship with get on with',
      goal: 'The learner can understand and independently use get on with to say they have a good/easy relationship with someone.',
      teaching: {
        explainInArabic: [
          'قدّم get on with كـchunk معناها إن العلاقة بينك وبين الشخص كويسة أو التعامل سهل.',
          'ما تحولهاش لدرس phrasal verbs؛ المعنى والاستخدام داخل موقف اجتماعي هما الهدف.',
        ],
        englishTargets: ['I get on with my new teammate.'],
        constraints: [
          'Do not broaden into a phrasal-verb grammar lesson.',
          'Use at least two different relationship contexts before deciding mastery when practical.',
          'If you supply the sentence, change the person/context before judging independent use.',
        ],
      },
      board: {
        type: 'examples',
        title: 'A good working relationship',
        items: [{ title: 'I get on with …', body: 'we have a good/easy relationship' }],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Ask first about one familiar relationship, then change to another person such as a teammate, neighbour, classmate, or colleague.',
        learnerTask: 'Say naturally that the relationship is good/easy using get on with.',
        supportLadder: [
          'Explain the relationship meaning in Arabic.',
          'Give only get on with.',
          'Model one example, then change the person for the retry.',
        ],
      },
    },
    {
      id: 'too-bad-teach-use',
      title: 'React to a small negative update with Too bad',
      goal: 'The learner can understand when Too bad fits and use it naturally for a minor negative update, without using it for serious bad news.',
      teaching: {
        explainInArabic: [
          'قدّم Too bad كرد قصير على خبر سلبي بسيط زي missed a game أو closed café.',
          'وضح بسرعة إنها مش مناسبة تلقائيًا للأخبار الخطيرة.',
        ],
        englishTargets: ['I missed the game. — Too bad.'],
        constraints: [
          'Contrast one minor negative update with one clearly serious situation so meaning boundaries are understood.',
          'Do not require a long sympathy lesson.',
          'Use a fresh minor update for independent production after any model.',
        ],
      },
      board: {
        type: 'compare',
        title: 'When does it fit?',
        left: { title: 'Minor setback', body: 'Too bad.' },
        right: { title: 'Serious news', body: 'use real sympathy, not this shortcut' },
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give one small negative update where Too bad fits and one serious update where the learner should recognise that it does not fit. Then use a fresh small setback for production.',
        learnerTask: 'React appropriately to each update.',
        supportLadder: [
          'Ask in Arabic whether the news is a small setback or serious.',
          'Show Too bad only for the minor case.',
          'Model one minor example, then change the event and retry.',
        ],
      },
    },
    {
      id: 'phrase-surprise-retrieval',
      title: 'Bring back the conversation phrases without warning',
      goal: 'The learner can retrieve earlier phrase language after a gap when a new conversational need naturally calls for it.',
      teaching: {
        explainInArabic: [
          'ما تعلنش إن ده revision. ادخل في كلام طبيعي بسياق جديد وخلي احتياج من اللي اتعلمناه يظهر.',
        ],
        englishTargets: ['Have you heard of …?', 'I get on with …', 'Too bad.'],
        constraints: [
          'Do not name the target phrase before the learner attempts.',
          'Create two changed mini-contexts that call for two different earlier phrases.',
          'If retrieval fails, repair briefly and test that same function again with a fresh context before completing.',
        ],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Naturally create two mini-situations selected from topic familiarity, relationship quality, and a minor setback. Do not tell the learner which phrase to use.',
        learnerTask: 'Respond naturally to what is happening.',
        supportLadder: [
          'Give the communicative meaning only.',
          'Name the missing function, not the English phrase.',
          'Reveal the phrase only if needed, then use a different context for a fresh retry.',
        ],
      },
    },
    {
      id: 'react-to-feeling',
      title: 'Respond to a person’s feeling, then keep the topic moving',
      goal: 'The learner can respond appropriately to a simple feeling such as surprise, happiness, interest, or indifference and create a relevant next move.',
      teaching: {
        explainInArabic: [
          'ركز على إن reaction لازم يناسب المعنى، وبعدها move صغير يكمل الكلام.',
          'مش المطلوب emotion vocabulary كبيرة؛ المطلوب interaction مناسبة.',
        ],
        englishTargets: ['That sounds great. What happened?', 'Oh, really? How come?', 'I see. What did you do next?'],
        constraints: [
          'Use at least two different feelings or stances.',
          'Do not insist on the exact example wording.',
          'Judge the interaction across the reaction and next move, not one isolated phrase.',
        ],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Give two different familiar personal updates carrying different feelings/stances. Respond naturally after the learner’s move so each becomes a tiny real exchange.',
        learnerTask: 'React to how I feel and help the conversation continue.',
        supportLadder: [
          'Ask in Arabic: إحساسي/موقفي هنا عامل إزاي؟',
          'Give only reaction + next move as function labels.',
          'Model one reaction, then change the feeling before retrying.',
        ],
      },
    },
    {
      id: 'word-talented-receptive',
      title: 'Recognise talented in a fresh spoken context',
      goal: 'The learner can understand talented as describing someone with strong natural or developed ability when heard in familiar talk.',
      teaching: {
        explainInArabic: ['قدّم talented بسرعة من خلال شخص شاطر جدًا في نشاط مألوف، وبعدها اختبر المعنى في مثال صوتي جديد.'],
        englishTargets: ['She is a talented designer.'],
        constraints: ['This is receptive vocabulary. Do not require the learner to produce talented as proof.', 'Use a fresh context for the meaning check.'],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Say a new sentence about a talented person and ask what it tells us about that person.',
        learnerTask: 'Tell me the key meaning about the person.',
        supportLadder: ['Give two meaning choices in Arabic.', 'Repeat the complete sentence once.', 'Explain the word briefly, then use a new sentence for the retry.'],
      },
    },
    {
      id: 'word-photography-receptive',
      title: 'Recognise photography as the activity',
      goal: 'The learner can recognise photography as the activity/art of taking photos when it appears in familiar spoken talk.',
      teaching: {
        explainInArabic: ['اربط photography بالنشاط نفسه مش بصورة واحدة، وبعدها استخدمها في جملة جديدة.'],
        englishTargets: ['I started photography last year.'],
        constraints: ['Receptive check only; production is optional.', 'Do not open a hobby vocabulary list.'],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give a short spoken update containing photography and ask what activity the speaker started or enjoys.',
        learnerTask: 'Identify the activity from the spoken update.',
        supportLadder: ['Repeat the whole update.', 'Contrast photography with a photo.', 'Explain briefly, then use a fresh update.'],
      },
    },
    {
      id: 'word-competitor-receptive',
      title: 'Recognise competitor in a familiar situation',
      goal: 'The learner can understand competitor as the person/team/business competing against another in a familiar context.',
      teaching: {
        explainInArabic: ['قدّم competitor من خلال مسابقة أو فريقين، وبعدها غيّر السياق واختبر مين المنافس.'],
        englishTargets: ['They are our main competitor.'],
        constraints: ['Keep the example concrete.', 'Do not require dictionary-style definition or production.'],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Say a short competition or business-club context and ask who the competitor is.',
        learnerTask: 'Identify who is competing against whom.',
        supportLadder: ['Give two people/teams as choices.', 'Repeat the relevant sentence.', 'Explain competitor briefly, then use a changed context.'],
      },
    },
    {
      id: 'word-rugby-receptive',
      title: 'Recognise rugby as a sport in context',
      goal: 'The learner can recognise rugby as a sport when it appears in a familiar leisure conversation without needing detailed sport knowledge.',
      teaching: {
        explainInArabic: ['عرّف rugby باختصار كرياضة جماعية، والهدف إن الكلمة ما توقفش فهم المحادثة.'],
        englishTargets: ['My cousin started playing rugby.'],
        constraints: ['Do not teach rules of rugby.', 'Receptive recognition is enough.'],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give a short leisure update containing rugby and ask what type of activity is being discussed.',
        learnerTask: 'Identify that the speaker is talking about a sport/activity.',
        supportLadder: ['Say in Arabic that it is a type of sport.', 'Repeat the sentence.', 'Give the meaning, then use a fresh short update.'],
      },
    },
    {
      id: 'word-entertainment-receptive',
      title: 'Recognise entertainment in familiar talk',
      goal: 'The learner can understand entertainment as activities or content people enjoy for fun when heard in a simple context.',
      teaching: {
        explainInArabic: ['قدّم entertainment بمعنى حاجات أو أنشطة للمتعة، وبعدها اختبرها داخل سياق جديد.'],
        englishTargets: ['The event includes music and other entertainment.'],
        constraints: ['Receptive meaning only.', 'Do not build a large entertainment vocabulary set.'],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give a short event or leisure description containing entertainment and ask what role that part of the event has.',
        learnerTask: 'Explain the basic meaning from context.',
        supportLadder: ['Offer fun/activity vs work/task as choices.', 'Repeat the sentence once.', 'Explain briefly, then use a new event example.'],
      },
    },
    {
      id: 'phone-key-fact',
      title: 'Pull the key fact from a short phone-style exchange',
      goal: 'The learner can extract key factual information from a short familiar phone-style exchange without needing every word.',
      teaching: {
        explainInArabic: ['وضح إن المطلوب key fact مش dictation، وإن كلمة جديدة واحدة ما توقفش السماع كله.'],
        englishTargets: ['short familiar phone-style exchange', 'one key factual detail'],
        constraints: [
          'Use two short snippets with different facts.',
          'No visible transcript before the attempt.',
          'Reuse some lesson receptive vocabulary naturally without requiring production.',
        ],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Deliver two different short phone-style snippets. After each, ask for the central factual information such as who, what activity, or what happened.',
        learnerTask: 'Tell me the key fact from each short exchange.',
        supportLadder: ['Repeat the whole snippet at the same clear B1 speed.', 'Give two fact choices.', 'Reveal one missed fact, then use a fresh snippet for the next check.'],
      },
    },
    {
      id: 'rhetorical-question-receptive',
      title: 'Notice when a question is really making a point',
      goal: 'The learner can recognise a basic rhetorical question in conversation and tell that it mainly expresses a viewpoint/reaction rather than requesting factual information.',
      teaching: {
        explainInArabic: ['قدّم مثال بسيط زي Who doesn’t like a day off? ووضح إن شكلها سؤال لكن غالبًا مش مستنية اسم شخص.'],
        englishTargets: ['Who doesn’t like a day off?'],
        constraints: ['Recognition only; do not require the learner to produce rhetorical questions.', 'Use a fresh second example before completing.'],
      },
      board: {
        type: 'compare',
        title: 'Question shape, different job',
        left: { title: 'Real question', body: 'expects information' },
        right: { title: 'Rhetorical question', body: 'mainly makes a point' },
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give one real information question and two simple rhetorical questions in natural mini-contexts. Ask what each speaker is really doing.',
        learnerTask: 'Tell me whether the speaker wants information or is mainly making a point.',
        supportLadder: ['Ask in Arabic: مستني إجابة معلومات فعلًا؟', 'Offer the two categories.', 'Explain one example, then use a fresh one.'],
      },
    },
    {
      id: 'sound-perception-check',
      title: 'Keep recognising key words inside natural speech',
      goal: 'The learner can recognise familiar lesson words/chunks in clear connected B1 speech without requiring accent imitation.',
      teaching: {
        explainInArabic: ['قول إن الهدف إن الودن تفضل ماسكة الكلمة جوه جملة طبيعية، مش إننا نقلد accent.'],
        englishTargets: ['talented photographer', 'main competitor', 'Have you heard of…?'],
        constraints: [
          'This is perception/intelligibility support, not pronunciation scoring.',
          'Do not claim precise pronunciation quality.',
          'Use short connected phrases, then ask for the word/chunk or meaning heard.',
        ],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Say three short connected phrases at clear natural B1 speed, including earlier lesson language. Ask the learner to identify the key word/chunk or meaning.',
        learnerTask: 'Tell me the important word or meaning you heard.',
        supportLadder: ['Repeat the whole phrase more slowly once.', 'Contrast two candidate words/chunks.', 'Isolate once, then return to a fresh full phrase.'],
      },
    },
    {
      id: 'guided-reconnection',
      title: 'Hold a real reconnection for several turns',
      goal: 'The learner can enter an unprepared familiar conversation, react appropriately, establish a topic, and keep it alive for several turns.',
      teaching: {
        explainInArabic: ['قول إننا هنعمل كلام حقيقي شوية: مش عارف البداية، واسمع كل turn وابنِ عليه.'],
        englishTargets: ['spontaneous reaction', 'topic establishment', 'relevant next move', 'earlier phrases when genuinely useful'],
        constraints: [
          'Do not prompt the learner with the next full question.',
          'Keep the exchange going for several turns before judging the interactive ability.',
          'Create at least one natural opportunity for earlier phrase retrieval without naming the phrase.',
        ],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Roleplay a familiar classmate or colleague after a short gap. Open with an ordinary update and contribute changing details over several turns.',
        learnerTask: 'Join the conversation naturally and keep the topic moving.',
        teacherMoves: [
          'Give a concrete detail the learner can pick up.',
          'Later introduce a relationship, topic-familiarity, or small-setback detail that can reactivate earlier phrase language.',
          'Let the learner carry initiative for several turns.',
        ],
        supportLadder: ['Give one Arabic functional cue only.', 'Name the missing function, not the phrase.', 'If you model English, change the detail before judging the retry.'],
      },
    },
    {
      id: 'late-surprise-retrieval',
      title: 'Retrieve old language after more distance',
      goal: 'The learner can recover earlier lesson language or receptive meaning after several intervening scenes and use that knowledge in a changed situation.',
      teaching: {
        explainInArabic: ['من غير ما تقول مراجعة، افتح موقفين صغار مختلفين يرجعوا حاجة من أول الدرس وحاجة من جزء السماع.'],
        englishTargets: ['one earlier productive phrase', 'one earlier receptive word/skill'],
        constraints: [
          'Do not announce the target.',
          'Choose a productive phrase that has not appeared recently plus one receptive item or listening behavior.',
          'Repair any weak retrieval and use a fresh variation before completing.',
        ],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Create one conversational situation requiring an earlier phrase and one short spoken snippet containing an earlier receptive item.',
        learnerTask: 'Respond naturally, then tell me the key meaning/fact you heard.',
        supportLadder: ['Give only the communicative function or meaning category.', 'Offer a light cue.', 'Reveal the answer only if needed, then create a fresh retry.'],
      },
    },
    {
      id: 'fresh-reconnection-transfer',
      title: 'Fresh reconnection without a script',
      goal: 'The learner can independently enter and sustain a changed familiar conversation, respond to meaning, create next moves, and draw on lesson language without a model dialogue.',
      teaching: {
        explainInArabic: ['اعمل setup بس: شخص مألوف، موضوع جديد، ومحادثة حقيقية. ما تقولش للمتعلم إيه phrase يستخدمها.'],
        englishTargets: ['appropriate spontaneous response', 'topic establishment', 'relevant follow-up', 'natural retrieval of lesson language', 'understanding familiar contextual vocabulary'],
        constraints: [
          'Use a new person/topic not used in guided practice.',
          'No answer-bearing model or suggested next question before the first response.',
          'Sustain the exchange for multiple turns; one good sentence is not enough evidence for the final interaction.',
          'Naturally create opportunities for more than one earlier lesson target, but do not force every phrase into the same conversation.',
          'If support reveals an answer, change the situation before treating the repaired behavior as independent evidence.',
        ],
      },
      interaction: {
        kind: 'fresh_transfer',
        setup: 'Start as a familiar person with an unpredictable ordinary update. Over several turns, introduce new details about a person, hobby, small setback, or familiar activity so earlier learning can reappear naturally.',
        learnerTask: 'Have the conversation with me naturally: respond, build on what I say, and keep the topic alive.',
        teacherMoves: [
          'Let the learner establish the topic instead of supplying the next question.',
          'Introduce at least one changed detail that can invite delayed phrase retrieval.',
          'Include one contextual word or listening detail and verify meaning only if it is not clear from the learner’s response.',
          'Before finishing, if any final-scene evidence still feels weak, create one more natural turn rather than announcing a test.',
        ],
        supportLadder: ['Give only a non-answer-bearing Arabic functional cue.', 'Name the missing function or meaning category.', 'If English wording must be supplied, change the situation and get a fresh independent attempt.'],
      },
    },
  ],
};
