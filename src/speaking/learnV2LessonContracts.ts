import type { SpeakingLessonContract } from './lessonContracts';

export const LEARN_V2_A1_U1_L01_CONTRACT: SpeakingLessonContract = {
  scenarioId: 'learn-v2-a1-u1-l01',
  sourceLessonIds: ['U1-L01'],
  sourceLoad: {
    abilities: 8,
    phrases: 5,
    grammar: 8,
    words: 13,
    pronunciation: 2,
  },
  languageGroundEn: [
    'simple greeting/opening: Hi, Hello, Good morning',
    "self-introduction: I'm … / My name is …",
    "ask the other person name: What's your name?",
    'basic wellbeing exchange: How are you? + short understandable response + Thanks/Thank you',
    'minimum first-/second-person be support only; do not turn the mission into a grammar lesson',
  ],
  checks: [
    {
      id: 'greeting',
      labelAr: 'تحية',
      requiredIndependent: 1,
      descriptionEn: 'The learner independently gives a simple appropriate greeting/opening in English. Do not count wording copied immediately after an exact model.',
    },
    {
      id: 'self_name',
      labelAr: 'قول اسمك',
      requiredIndependent: 1,
      descriptionEn: "The learner independently gives their name in a usable short utterance such as I'm … or My name is … .",
    },
    {
      id: 'ask_name',
      labelAr: 'اسأل عن الاسم',
      requiredIndependent: 1,
      descriptionEn: 'The learner independently asks the partner name with an understandable question. Equivalent simple wording is acceptable.',
    },
    {
      id: 'wellbeing',
      labelAr: 'How are you?',
      requiredIndependent: 1,
      descriptionEn: 'The learner independently handles one basic wellbeing move, either asking How are you? naturally or giving an understandable short wellbeing response when asked.',
    },
    {
      id: 'complete_turn',
      labelAr: 'رد كامل',
      requiredIndependent: 2,
      descriptionEn: 'Across two distinct learner turns, the learner owns a short but complete conversational turn rather than only repeating a supplied model or giving ASR fragments.',
    },
  ],
  maxDurationSeconds: 360,
  coachPromptEn: [
    'MISSION: run one tiny, friendly first-meeting conversation using only Learn A1 U1-L01 ground.',
    'Keep the exchange human and short. Do not explain the lesson, announce checks, or turn it into an interview.',
    'After each genuine learner turn, silently consider the evidence checks and record only what the learner actually demonstrated.',
    'Use independent only when the learner owns the wording/move without receiving the exact answer immediately beforehand. If you gave the exact phrase and they copied it, record supported and create one fresh natural chance later.',
    'A learner may pause or hesitate. Give them space rather than rushing to fill their turn.',
    'If they ask for help, support them warmly. Assisted production is useful practice even when it does not count as independent evidence.',
    'When all required evidence is complete, end the first-meeting exchange with one short natural closing line and no new question.',
  ].join('\n'),
};

export const LEARN_V2_B1_U1_L01_CONTRACT: SpeakingLessonContract = {
  scenarioId: 'learn-v2-b1-u1-l01',
  sourceLessonIds: ['U1-L01'],
  sourceLoad: {
    abilities: 4,
    phrases: 3,
    grammar: 0,
    words: 5,
    pronunciation: 1,
  },
  languageGroundEn: [
    'enter an unprepared familiar conversation from an unpredictable but familiar opening',
    'react to the actual meaning of the partner turn and establish/advance a topic',
    'pick one detail from what was said and create a relevant next move through a question, comment or related detail',
    'productive phrase resources where genuinely natural: Have you heard of … ?, get on with somebody, Too bad',
    'receptive support only: competitor, entertainment, photography, rugby, talented',
    'pronunciation priority is intelligibility and processing, not accent imitation',
  ],
  checks: [
    {
      id: 'enter_unprepared',
      labelAr: 'ادخل في الكلام',
      requiredIndependent: 1,
      descriptionEn: 'The learner independently responds to an unpredictable but familiar opening and helps establish a topic without being given a complete model response.',
    },
    {
      id: 'meaningful_reaction',
      labelAr: 'رد فعل حقيقي',
      requiredIndependent: 1,
      descriptionEn: 'The learner gives a reaction that connects to the actual content or feeling of the partner turn. Generic yes/okay that ignores the message does not count.',
    },
    {
      id: 'relevant_next_move',
      labelAr: 'Next move',
      requiredIndependent: 2,
      descriptionEn: 'Across two distinct learner turns, the learner picks up a detail from the partner and creates a relevant next move: a follow-up question, connected comment, related detail or topic development. Do not count a question supplied verbatim by the partner.',
    },
    {
      id: 'maintain_exchange',
      labelAr: 'خلي الكلام مكمل',
      requiredIndependent: 2,
      descriptionEn: 'Across two distinct learner turns after the opening, the learner actively helps maintain the exchange rather than only answering minimal interview-style questions.',
    },
  ],
  maxDurationSeconds: 480,
  coachPromptEn: [
    'MISSION: run one natural B1 familiar catch-up focused only on U1-L01: entering without a script and creating the next move.',
    'Conversation quality matters more than collecting vocabulary. The three phrases are useful resources, not a mandatory checklist. The five lesson words are receptive support and must never be forced into learner production.',
    'Start with an unpredictable but familiar update and give the learner room to react. Do not explain React/Pick/Continue during the mission.',
    'After every genuine learner turn, silently consider the evidence checks and record only observable learner behaviour. Never invent multi-turn evidence from one turn.',
    'If you provide exact wording or a complete model, copied use is supported practice. Later create a fresh natural opportunity before treating the same behaviour as independent.',
    'Let pauses breathe. Do not fill an unfinished learner fragment, and do not perform the learner next move for them.',
    'Keep your own turns concise but contribute real conversational material; this should feel like catching up with someone, not answering a test.',
    'When all required evidence is complete, close naturally after the learner has had a satisfying exchange. Do not mention checks, mastery or scores.',
  ].join('\n'),
};
