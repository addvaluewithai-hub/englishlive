import type { SceneLessonDefinition } from '../types';

export const B1_U1_L02_SCENE_LESSON: SceneLessonDefinition = {
  id: 'b1-u1-l02-keep-conversation-going',
  levelId: 'b1',
  unitId: 'b1-u1-independent-conversation',
  unitTitle: 'From Routine Exchange to Independent Conversation',
  order: 2,
  title: 'Keep a Familiar Conversation Going',
  subtitle: 'Listen actively, pick up a useful detail, follow up, and manage several turns without waiting for a script.',
  performance: 'Sustain a fresh familiar conversation for several turns through acknowledgement, relevant follow-up, and simple turn management without being given the next question.',
  coreLanguage: [
    'get to know sb',
    'in touch',
    'you see',
    'bounded formal invitation language such as Would you like to …? / I’d like to invite you to …',
    'context vocabulary: agreement, conclude, encourage, reject, wonder',
    'integrated support only: emphatic do, let me for focus/turn-holding, negative tag questions, speech-act verbs',
    'connected-speech perception and production support; intelligibility over accent imitation',
  ],
  boundaries: [
    'The primary success condition is interactional continuity, not displaying every phrase, word, or grammar row.',
    'Do not turn the lesson into a four-rule grammar chapter. The grammar rows are integrated support for real turns.',
    'Teach get to know, in touch, and you see as usable formulaic resources in context, not as isolated translation items.',
    'agreement, conclude, encourage, reject, and wonder are productive contextual vocabulary, but they should be grouped around meaningful familiar situations rather than taught as a random list.',
    'The learner must generate relevant follow-up; a teacher-supplied next question does not count as independent evidence.',
    'Keep everyday conversation understandable and avoid very idiomatic usage.',
    'The final transfer must change the details/topic and reduce support.',
  ],
  source: {
    repository: 'addvaluewithai-hub/english-course',
    branch: '801114fdd860e8b9c1e7b137a0af1c3b3cc0e9cb',
    path: 'curriculum/levels/b1/design-review/07-lesson-briefs/lesson-briefs.md#u1-l02--keep-a-familiar-conversation-going',
    sourceLessonId: 'U1-L02',
  },
  scenes: [
    {
      id: 'acknowledge-pick-follow-up',
      title: 'Build the next turn from what you just heard',
      goal: 'The learner can use acknowledgement plus one relevant detail to create a natural follow-up instead of changing topic or waiting passively.',
      teaching: {
        explainInArabic: [
          'اشرح إن استمرار الحوار مش معناه تسأل أسئلة محفوظة. اسمع آخر جملة، اعترف بالمعلومة أو اتفاعل معاها، اختار تفصيلة منها، وابنِ عليها move جديد.',
          'ورّي شكل بسيط: acknowledge → pick a detail → follow up. مش لازم كل turn يحتوي الثلاثة بشكل كامل.',
        ],
        englishTargets: [
          'Oh, nice. How did you get into that?',
          'Really? Who did you go with?',
          'I see. Are you still doing it?',
        ],
        constraints: [
          'Examples show the interaction pattern; do not require memorisation.',
          'Follow-ups must connect to what the partner actually said.',
          'Keep the exchange familiar and non-specialist.',
        ],
      },
      board: {
        type: 'steps',
        title: 'Keep the turn alive',
        items: [
          { title: '1. React', body: 'Oh, nice. / Really? / I see.' },
          { title: '2. Pick a detail', body: 'the club · the person · the plan' },
          { title: '3. Follow up', body: 'ask or add something connected' },
        ],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give several one-line familiar updates. After each, ask the learner to respond in a way that naturally invites the conversation to continue.',
        learnerTask: 'React to each update and make one relevant next move.',
        supportLadder: [
          'قل بالعربي: امسك تفصيلة من آخر جملة واسأل عنها أو علّق عليها.',
          'Name the useful detail only, without giving the question.',
          'Give a question starter only, then retry with a fresh update.',
        ],
      },
    },
    {
      id: 'continuation-phrases',
      title: 'Use compact phrases to connect people and ideas',
      goal: 'The learner can use get to know, in touch, and you see naturally when they genuinely help a familiar conversation.',
      teaching: {
        explainInArabic: [
          'قدّم get to know لما بنتكلم عن إننا نتعرف على شخص تدريجيًا، وin touch لما بنتكلم عن استمرار التواصل، وyou see لما بنشرح أو نوضح نقطة للطرف التاني.',
          'أكد إنهم tools للحوار: نستخدمهم لما المعنى محتاجهم، مش لازم نحشرهم في كل محادثة.',
        ],
        englishTargets: [
          'I got to know her at work.',
          'We still keep in touch.',
          'You see, I was new there.',
        ],
        constraints: [
          'Do not teach get to know as a tense lesson; vary tense only when the context requires it.',
          'Do not turn in touch into a broad collocation list.',
          'Use you see as a simple explanation/continuation signal, not as filler in every turn.',
        ],
      },
      board: {
        type: 'examples',
        title: 'Three conversation links',
        items: [
          { title: 'get to know', body: 'a relationship develops' },
          { title: 'in touch', body: 'contact continues' },
          { title: 'you see', body: 'add an explanation' },
        ],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Use three short familiar contexts about meeting people, keeping contact, and explaining a reason. Ask the learner to complete a natural turn with the fitting phrase.',
        learnerTask: 'Use the phrase that fits the meaning, then finish the thought in your own words.',
        supportLadder: [
          'Give the communicative meaning in Arabic.',
          'Show the three phrase choices.',
          'Model one completed example, then switch to a new context before checking again.',
        ],
      },
    },
    {
      id: 'decision-and-contact-vocabulary',
      title: 'Use the lesson vocabulary inside a real situation',
      goal: 'The learner can understand and use agreement, conclude, encourage, reject, and wonder inside familiar talk about a plan, decision, or group activity.',
      teaching: {
        explainInArabic: [
          'اجمع الكلمات في موقف واحد بدل vocab dump: مجموعة بتحاول تقرر نشاط أو خطة. ممكن يحصل agreement، حد يشجع encourage، حد يرفض reject، وإنت ممكن تقول I wonder… قبل اقتراح أو سؤال، وفي الآخر conclude بمعنى نوصل لاستنتاج.',
          'مش لازم المتعلم ينتج الخمس كلمات في نفس turn؛ لكن لازم يشوف ويستخدم كل كلمة في context واضح خلال الـscene.',
        ],
        englishTargets: [
          'We finally reached an agreement.',
          'She encouraged me to join.',
          'They rejected the first idea.',
          'I wonder if Saturday is better.',
          'We concluded that the smaller group worked better.',
        ],
        constraints: [
          'Keep the context familiar and concrete.',
          'Do not require dictionary definitions.',
          'Do not introduce complex verb-complement rules; teach the useful chunks needed for the examples.',
        ],
      },
      board: {
        type: 'steps',
        title: 'A group decision can move like this',
        items: [
          { title: 'wonder', body: 'raise an idea/question' },
          { title: 'encourage / reject', body: 'respond to ideas/actions' },
          { title: 'agreement', body: 'reach a shared decision' },
          { title: 'conclude', body: 'say what you decided/realised' },
        ],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Run a compact group-plan simulation with changing details. Give the learner small opportunities to use each target word naturally across several turns.',
        learnerTask: 'Help the group discuss the plan. Use the target vocabulary when it fits what is happening.',
        teacherMoves: [
          'Create one proposal that can be encouraged and one that can be rejected.',
          'Ask what the learner wonders about before the final decision.',
          'At the end ask the learner to state the agreement or conclusion in one short sentence.',
        ],
        supportLadder: [
          'Point to the meaning stage on the board rather than giving the whole sentence.',
          'Offer the target word only and let the learner build the sentence.',
          'Model one sentence, then create a new plan detail before asking for independent use.',
        ],
      },
    },
    {
      id: 'grammar-that-supports-a-turn',
      title: 'Use grammar as support, not as the topic',
      goal: 'The learner can recognise and selectively use a few support patterns that help hold, emphasise, or check a conversational turn.',
      teaching: {
        explainInArabic: [
          'وضح إن الأربع grammar rows هنا مش أربع قواعد لازم نستعرضها. هما tools صغيرة تخدم الكلام: do للتأكيد، let me لما تاخد لحظة أو تركز نقطة، tag question بسيط للتأكد، وspeech-act verb لما تقول بوضوح إنت بتقترح أو توعد أو توافق.',
          'اشتغل على connected speech: المتعلم يسمع الـchunk كوحدة، ويرجع يستخدمه بشكل مفهوم من غير accent imitation.',
        ],
        englishTargets: [
          'I do like the idea.',
          'Let me think for a second.',
          'You know Sam, don’t you?',
          'I promise I’ll call. / I suggest Saturday.',
        ],
        constraints: [
          'These grammar rows are integrated support, not independent mastery targets for the lesson.',
          'Do not teach the full tag-question system.',
          'Do not teach an exhaustive list of speech-act verbs.',
          'Correct only when the support pattern blocks or distorts the intended interaction.',
        ],
      },
      board: {
        type: 'examples',
        title: 'Small tools for a live turn',
        items: [
          { title: 'emphasise', body: 'I do like…' },
          { title: 'hold/focus', body: 'Let me…' },
          { title: 'check', body: '…, don’t you?' },
          { title: 'state the act', body: 'I promise… / I suggest…' },
        ],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give four tiny conversational needs: emphasise a real preference, buy thinking time, check a shared fact, and make a clear promise/suggestion. Let the learner choose a fitting support pattern.',
        learnerTask: 'Use one short support pattern for each conversational need.',
        supportLadder: [
          'Name the function only: emphasise / hold / check / promise-or-suggest.',
          'Show the relevant chunk starter without completing the meaning.',
          'Model once, then use a new meaning for the retry.',
        ],
      },
    },
    {
      id: 'invite-and-continue',
      title: 'Turn a good conversation into a next step',
      goal: 'The learner can make a bounded polite/formal invitation and continue naturally after the partner responds.',
      teaching: {
        explainInArabic: [
          'قدّم الدعوة الرسمية هنا كقدرة صغيرة داخل الحوار، مش درس invitations كامل. الهدف تعرف تعمل invitation مهذب وبعدين تتعامل مع القبول أو الرفض وتكمل turn طبيعي.',
          'اربطها بـ get to know / in touch لما السياق مناسب: ممكن الدعوة تكون طريقة نتعرف أكتر أو نفضل على تواصل.',
        ],
        englishTargets: [
          'Would you like to join us on Friday?',
          'I’d like to invite you to the event.',
          'It would be nice to keep in touch.',
        ],
        constraints: [
          'Keep the invitation bounded and familiar; no business-protocol lesson.',
          'Accept an equivalent polite invitation if it clearly serves the same function.',
          'The learner should respond to acceptance/rejection rather than ending immediately after the invitation.',
        ],
      },
      board: {
        type: 'examples',
        title: 'Invite → respond → continue',
        items: [
          { title: 'Invite', body: 'Would you like to …?' },
          { title: 'Partner answers', body: 'yes / no / maybe' },
          { title: 'Continue', body: 'add a relevant next move' },
        ],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Create a familiar club/course/social event. The learner makes a polite invitation; answer positively once and negatively once across two mini attempts so they must continue appropriately.',
        learnerTask: 'Invite me politely, then keep the exchange going after my answer.',
        supportLadder: [
          'Give only the invitation function and event detail.',
          'Offer “Would you like to…” as a starter.',
          'Model one full invitation, then change the event and response before retrying.',
        ],
      },
    },
    {
      id: 'fresh-maintained-conversation',
      title: 'Fresh conversation that keeps moving',
      goal: 'The learner can sustain several turns in a changed familiar context through active listening, relevant follow-up, acknowledgement, and simple turn management without a supplied next question.',
      teaching: {
        explainInArabic: [
          'اعمل setup فقط: هنتكلم في موضوع مألوف جديد، والطرف التاني معاه معلومات مختلفة. المطلوب إنك تسمع وتبني على اللي بيتقال، مش تستنى السؤال الجاي.',
          'مش لازم تستخدم كل الكلمات والـgrammar في الاختبار النهائي؛ النجاح الأساسي إن الحوار يفضل ماشي بشكل مستقل ومترابط.',
        ],
        englishTargets: [
          'acknowledgement + relevant follow-up',
          'several connected turns',
          'selective use of lesson phrases/vocabulary when natural',
          'optional polite invitation if the conversation creates a real reason for one',
        ],
        constraints: [
          'Use a changed topic and changed facts from guided practice.',
          'Do not give the learner a list of next questions or a complete dialogue.',
          'The learner must generate at least one genuinely relevant follow-up from partner information.',
          'If the teacher supplies the exact next question, that turn is supported practice and a fresh opportunity is needed.',
          'Avoid idiomatic or specialist language that would turn comprehension difficulty into the test.',
        ],
      },
      interaction: {
        kind: 'fresh_transfer',
        setup: 'Run an information-gap style familiar conversation about a club, course, colleague, hobby, or simple plan. Reveal details gradually so the learner has to listen and choose what to follow up on.',
        learnerTask: 'Keep the conversation going for several turns. React to what I say, ask relevant follow-ups, and add your own connected information.',
        teacherMoves: [
          'Do not ask a new question after every learner turn; sometimes give a statement and leave space for the learner to take initiative.',
          'Include one detail that invites a natural follow-up and one point where a short acknowledgement is enough before the next move.',
        ],
        supportLadder: [
          'Give a non-answer-bearing Arabic cue: امسك تفصيلة من كلامي وابنِ عليها.',
          'Name the detail that could be followed up, but do not provide the question.',
          'If an English follow-up must be modelled, change the detail/topic and create a fresh independent opportunity before completion.',
        ],
      },
    },
  ],
};
