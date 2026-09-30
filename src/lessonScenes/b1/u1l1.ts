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
      id: 'from-script-to-real-entry',
      title: 'A real conversation does not wait for the textbook question',
      goal: 'The learner can recognise that B1 entry means responding to an unpredictable but familiar opening and adding a next move.',
      teaching: {
        explainInArabic: [
          'اشرح إن في A2 ممكن الحوار يبدأ بشكل متوقع: Hi, how are you? لكن في B1 الطرف التاني ممكن يدخل عليك بجملة عن الشغل أو الهوايات أو خبر بسيط، وإنت محتاج ترد وتعمل move تاني يخلي الكلام يبدأ فعلًا.',
          'أكد إن المطلوب مش جملة طويلة؛ رد مناسب + خطوة تانية كفاية في البداية.',
        ],
        englishTargets: [
          'Oh, really? What happened?',
          'That sounds interesting. How did you start?',
          'Too bad. Are you okay now?',
        ],
        constraints: [
          'The example lines illustrate the interaction shape; do not make the learner memorise these exact sentences.',
          'Use only familiar concrete topics.',
          'Do not teach a broad discourse-marker inventory.',
        ],
      },
      board: {
        type: 'compare',
        title: 'From response to conversation',
        left: { title: 'Only react', body: 'Oh, really?' },
        right: { title: 'React + next move', body: 'Oh, really? What happened?' },
      },
      interaction: {
        kind: 'elicitation',
        setup: 'Give two different familiar openings, one positive and one negative. Ask the learner what kind of response would keep each conversation alive.',
        learnerTask: 'For each opening, react and add one simple next move.',
        supportLadder: [
          'قل بالعربي: الأول اتفاعل مع المعنى، وبعدها افتح الباب للطرف التاني يكمل.',
          'Give only the function labels: reaction + next move.',
          'Model one reaction only, then use a different opening and ask the learner to create the next move.',
        ],
      },
    },
    {
      id: 'three-conversation-phrases',
      title: 'Use three compact phrases that do real work',
      goal: 'The learner can understand and use hear of, get on with, and too bad in fitting familiar contexts.',
      teaching: {
        explainInArabic: [
          'قدّم Have you heard of…? كطريقة تفتح موضوع عن شخص أو نشاط أو مكان معروف أو جديد بالنسبة للطرف التاني.',
          'قدّم get on with بمعنى تكون علاقتك كويسة مع شخص، وToo bad كرد قصير على خبر سلبي بسيط.',
          'خلّي التركيز على الاستخدام داخل conversation، مش على ترجمة كل كلمة حرفيًا.',
        ],
        englishTargets: [
          'Have you heard of that photography club?',
          'I get on with my new teammate.',
          'I missed the game. — Too bad.',
        ],
        constraints: [
          'Do not expand get on with into a phrasal-verb grammar lesson.',
          'Do not treat too bad as appropriate for serious bad news.',
          'Use hear of for awareness/familiarity, not as a full lesson on hear/hear about/listen.',
        ],
      },
      board: {
        type: 'examples',
        title: 'Three useful moves',
        items: [
          { title: 'Have you heard of …?', body: 'open/check a topic' },
          { title: 'I get on with …', body: 'talk about a relationship' },
          { title: 'Too bad.', body: 'react to a small negative update' },
        ],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give three short familiar situations in mixed order and ask the learner to use a fitting target phrase naturally.',
        learnerTask: 'Use a fitting phrase to open, add, or react in each mini-situation.',
        supportLadder: [
          'Name the communicative job only: open a topic / talk about a relationship / react to bad news.',
          'Show the three target phrases without completing the sentence for the learner.',
          'Model one item, then retry the same communicative job with a new situation.',
        ],
      },
    },
    {
      id: 'listen-through-new-topic-language',
      title: 'Keep listening when a few words are new',
      goal: 'The learner can extract a key fact from a short familiar phone-style exchange, recognise the lesson’s contextual vocabulary, and notice when a basic rhetorical question is not a real request for information.',
      teaching: {
        explainInArabic: [
          'وضح إن الكلمات competitor, entertainment, photography, rugby, talented موجودة هنا كـcontext language: المهم تعرفها لما تظهر في كلام مألوف وما توقفش المحادثة بسببها.',
          'درّب المتعلم ياخد الـkey fact من voice/phone-style line حتى لو كلمة مش مألوفة، بدل ما يحاول يعمل dictation لكل حاجة.',
          'قدّم rhetorical question بسيط زي Who doesn’t like a day off? ووضح إن المتكلم مش مستني اسم شخص؛ هو بيأكد فكرة أو بيعمل reaction.',
        ],
        englishTargets: [
          'She is a talented photographer.',
          'Rugby is popular entertainment there.',
          'He is our main competitor.',
          'I started photography last year.',
          'Who doesn’t like a day off?',
        ],
        constraints: [
          'The five vocabulary items are receptive/contextual here; do not require all five in learner output.',
          'The phone-style task is factual listening support, not a separate telephone-skills lesson.',
          'Rhetorical-question recognition is receptive; do not require learners to produce rhetorical questions.',
          'Pronunciation work is recognition-focused and only supports comprehension.',
        ],
      },
      board: {
        type: 'examples',
        title: 'Listen for the message',
        items: [
          { title: 'people', body: 'competitor · talented' },
          { title: 'leisure', body: 'entertainment · photography · rugby' },
          { title: 'question shape', body: 'sometimes a reaction, not a real information question' },
        ],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Deliver two short phone-style familiar snippets containing some contextual vocabulary. Ask for one key fact from each. In one snippet include a simple rhetorical question and ask whether it expects factual information or mainly expresses a viewpoint/reaction.',
        learnerTask: 'Listen for the key fact. If you hear the final question, tell me whether it is really asking for information or mainly making a point.',
        supportLadder: [
          'Repeat the complete snippet once at the same B1-clear speed.',
          'Give two key-fact/category choices without showing a transcript.',
          'Explain the rhetorical-question meaning after the attempt, then use a fresh snippet for the next check.',
        ],
      },
    },
    {
      id: 'guided-reconnection',
      title: 'Respond, react, and establish the topic',
      goal: 'The learner can handle a short supported reconnection where the opening is familiar but not scripted.',
      teaching: {
        explainInArabic: [
          'قول إن التحدي دلوقتي إنك مش عارف أول جملة هتكون إيه. اسمع، اتفاعل، وبعدها اعمل move يثبت موضوع للكلام.',
          'لو target phrase مناسب استخدمه، لكن ما تحشرش phrase في مكان مش طبيعي.',
        ],
        englishTargets: [
          'spontaneous reaction',
          'one next move',
          'Have you heard of …? / get on with … / too bad when context fits',
        ],
        constraints: [
          'Do not give a complete dialogue before the attempt.',
          'Allow a short natural response; length is not the target.',
          'Functional success matters more than forcing every target phrase into one exchange.',
        ],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Roleplay a familiar classmate or colleague after a short gap. Open with an unannounced familiar update about a person, hobby, or simple work/leisure event. Let the learner respond and create the next move.',
        learnerTask: 'Respond naturally and help us get onto a real topic. Keep the exchange going for a few turns.',
        teacherMoves: [
          'Contribute one simple detail so the learner has something real to react to.',
          'If a target phrase fits naturally, create an opportunity for it rather than asking the learner to recite it.',
        ],
        supportLadder: [
          'Give an Arabic functional cue such as: اتفاعل وبعدين اسأل أو ضيف معلومة مرتبطة.',
          'Name one possible function only: reaction / topic question / relationship comment.',
          'If exact wording must be supplied, treat it as supported practice and use a new opening before judging transfer.',
        ],
      },
    },
    {
      id: 'fresh-reconnection-transfer',
      title: 'Fresh reconnection without a script',
      goal: 'The learner can independently enter a changed familiar conversation, react to the opening, and create the next move without a model dialogue.',
      teaching: {
        explainInArabic: [
          'اعمل setup فقط: هتقابل شخص تعرفه في سياق مألوف، لكن مش هتعرف هو هيبدأ بإيه. المطلوب تسمع أول move، ترد بشكل مناسب، وتعمل move تاني يفتح موضوع.',
        ],
        englishTargets: [
          'appropriate spontaneous response',
          'topic establishment',
          'simple feeling/reaction handling',
        ],
        constraints: [
          'Use a new person and a new familiar topic from guided practice.',
          'Do not show a complete model, suggested next question, or answer-bearing board before the first response.',
          'The learner must create the next move; choosing from supplied full responses is not mastery evidence.',
          'If answer-revealing support is needed, restart with a fresh opening before judging mastery.',
        ],
      },
      interaction: {
        kind: 'fresh_transfer',
        setup: 'Start as a familiar person with an unpredictable but ordinary line about family, hobby, work, or leisure. The learner must respond and create the next conversational move.',
        learnerTask: 'Enter the conversation naturally and help establish the topic.',
        teacherMoves: [
          'Keep the opening familiar but not identical to any earlier model.',
          'After the learner creates the next move, respond naturally for one or two turns so the interaction is genuinely conversational.',
        ],
        supportLadder: [
          'Give only a non-answer-bearing Arabic cue: رد على المعنى وبعدها اعمل خطوة تكمل الكلام.',
          'Name the missing function without giving English words.',
          'If an English model is required, switch to a new opening and count the prior attempt as practice only.',
        ],
      },
    },
  ],
};
