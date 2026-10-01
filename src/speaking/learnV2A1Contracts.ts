import type { SpeakingLessonContract, SpeakingLessonCheck } from './lessonContracts';

interface ContractInput {
  scenarioId: string;
  sourceLessonId: string;
  load: SpeakingLessonContract['sourceLoad'];
  ground: string[];
  checks: SpeakingLessonCheck[];
  duration: number;
  missionLine: string;
  extraRules?: string[];
}

function makeContract(input: ContractInput): SpeakingLessonContract {
  return {
    scenarioId: input.scenarioId,
    sourceLessonIds: [input.sourceLessonId],
    sourceLoad: input.load,
    languageGroundEn: input.ground,
    checks: input.checks,
    maxDurationSeconds: input.duration,
    coachPromptEn: [
      input.missionLine,
      'Keep the exchange human, short and task-led. Do not explain the lesson, announce checks, or turn the mission into a quiz unless the task itself is a listening/identification game.',
      'After each genuine learner turn, silently consider only the evidence checks below and record only what the learner actually demonstrated.',
      'Use independent only when the learner owns the wording or task move without receiving the exact answer immediately beforehand. If you supplied the exact wording and they mainly copied it, record supported and create a fresh natural opportunity later when appropriate.',
      'A learner may pause or hesitate. Give them space; never complete an unfinished fragment for them.',
      'If they ask for help, support them warmly. Assisted production is useful practice even when it does not count as independent productive evidence.',
      ...(input.extraRules ?? []),
      'When all required evidence is complete, close the task naturally with one short line and no new requirement. Never mention checks, mastery or scores.',
    ].join('\n'),
  };
}

export const LEARN_V2_A1_CONTRACTS: SpeakingLessonContract[] = [
  makeContract({
    scenarioId: 'learn-v2-a1-u1-l01',
    sourceLessonId: 'U1-L01',
    load: { abilities: 8, phrases: 5, grammar: 8, words: 13, pronunciation: 2 },
    duration: 360,
    ground: [
      'simple greeting/opening: Hi, Hello, Good morning',
      "self-introduction: I'm … / My name is …",
      "ask the other person's name: What's your name?",
      'basic wellbeing exchange: How are you? + short understandable response + Thanks/Thank you',
      'minimum first-/second-person be support only; do not turn the mission into a grammar lesson',
    ],
    checks: [
      { id: 'greeting', labelAr: 'تحية', requiredIndependent: 1, descriptionEn: 'The learner independently gives a simple appropriate greeting/opening in English. Do not count wording copied immediately after an exact model.' },
      { id: 'self_name', labelAr: 'قول اسمك', requiredIndependent: 1, descriptionEn: "The learner independently gives their name in a usable short utterance such as I'm … or My name is …." },
      { id: 'ask_name', labelAr: 'اسأل عن الاسم', requiredIndependent: 1, descriptionEn: 'The learner independently asks the partner name with an understandable question. Equivalent simple wording is acceptable.' },
      { id: 'wellbeing', labelAr: 'How are you?', requiredIndependent: 1, descriptionEn: 'The learner independently handles one basic wellbeing move, either asking How are you? naturally or giving an understandable short wellbeing response when asked.' },
      { id: 'complete_turn', labelAr: 'رد كامل', requiredIndependent: 2, descriptionEn: 'Across two distinct learner turns, the learner owns a short but complete conversational turn rather than only repeating a supplied model or giving ASR fragments.' },
    ],
    missionLine: 'MISSION: run one tiny, friendly first-meeting conversation using only Learn A1 U1-L01 ground.',
  }),
  makeContract({
    scenarioId: 'learn-v2-a1-u1-l02',
    sourceLessonId: 'U1-L02',
    load: { abilities: 4, phrases: 1, grammar: 2, words: 21, pronunciation: 1 },
    duration: 300,
    ground: ['How old are you?', "I'm + age", '… years old', 'basic functional age numbers; teen/ty listening contrast where useful'],
    checks: [
      { id: 'age_statement', labelAr: 'قول العمر', requiredIndependent: 1, descriptionEn: "The learner independently gives a usable age utterance such as I'm nineteen / I'm nineteen years old. A bare number after an exact prompt is supported meaning evidence, not the productive target." },
      { id: 'age_question', labelAr: 'اسأل عن العمر', requiredIndependent: 1, descriptionEn: 'The learner independently asks the partner age with an understandable A1 question.' },
      { id: 'age_number_clear', labelAr: 'رقم مفهوم', requiredIndependent: 1, descriptionEn: 'The learner produces or successfully clarifies one age number so the intended number is unambiguous in context. Do not require a broad number test.' },
    ],
    missionLine: 'MISSION: run a tiny classmate exchange focused only on age and basic functional age numbers.',
    extraRules: ['Do not ask for real age if the learner prefers invented information. Do not expand into dates, prices or large numbers.'],
  }),
  makeContract({
    scenarioId: 'learn-v2-a1-u1-l03',
    sourceLessonId: 'U1-L03',
    load: { abilities: 8, phrases: 1, grammar: 4, words: 20, pronunciation: 2 },
    duration: 360,
    ground: ["Where are you from? / I'm from … / I come from …", 'Where do you live? / I live in …', 'origin and current residence are separate meanings'],
    checks: [
      { id: 'origin_statement', labelAr: 'قول إنت منين', requiredIndependent: 1, descriptionEn: "The learner independently states origin in a short usable clause such as I'm from Egypt / I come from Jordan." },
      { id: 'residence_statement', labelAr: 'قول عايش فين', requiredIndependent: 1, descriptionEn: 'The learner independently states current residence in a short clause such as I live in Cairo.' },
      { id: 'ask_origin', labelAr: 'اسأل عن الأصل', requiredIndependent: 1, descriptionEn: 'The learner independently asks where the partner is from.' },
      { id: 'ask_residence', labelAr: 'اسأل عن السكن', requiredIndependent: 1, descriptionEn: 'The learner independently asks where the partner lives.' },
    ],
    missionLine: 'MISSION: run one international-meetup exchange focused on origin versus current residence.',
    extraRules: ['Country/city vocabulary is context, not a memorisation checklist. Real or invented places are equally valid.'],
  }),
  makeContract({
    scenarioId: 'learn-v2-a1-u1-l04',
    sourceLessonId: 'U1-L04',
    load: { abilities: 5, phrases: 2, grammar: 0, words: 23, pronunciation: 0 },
    duration: 360,
    ground: ['What do you do?', "I'm a …", 'I work as …', 'I work for …', 'I study …', 'broad job vocabulary is mostly contextual recognition; do not require a long list'],
    checks: [
      { id: 'role_statement', labelAr: 'قول شغلك/دراستك', requiredIndependent: 1, descriptionEn: 'The learner independently gives one clear job or study fact using any suitable simple frame.' },
      { id: 'ask_role', labelAr: 'اسأل الطرف التاني', requiredIndependent: 1, descriptionEn: 'The learner independently asks the partner about job/study with an understandable question such as What do you do?' },
      { id: 'role_followup', labelAr: 'اتعامل مع المعلومة', requiredIndependent: 1, descriptionEn: 'The learner gives one relevant short response or follow-up showing they understood the partner job/study fact. Do not require a particular phrase.' },
    ],
    missionLine: 'MISSION: run one short networking-style exchange about job or study facts.',
    extraRules: ['One clear fact is enough. Do not turn the mission into a job-vocabulary recall test or a do-support grammar lesson.'],
  }),
  makeContract({
    scenarioId: 'learn-v2-a1-u1-l05',
    sourceLessonId: 'U1-L05',
    load: { abilities: 7, phrases: 5, grammar: 1, words: 22, pronunciation: 1 },
    duration: 420,
    ground: ['phone/email/address contact language', 'How do you spell that?', 'Can you say that again?', 'Can you write it down?', 'spelling and number clarity for repair'],
    checks: [
      { id: 'contact_detail', labelAr: 'contact detail', requiredIndependent: 1, descriptionEn: 'The learner independently gives one usable fictional contact detail or asks for one. Never require real sensitive contact information.' },
      { id: 'repair_request', labelAr: 'اطلب توضيح', requiredIndependent: 1, descriptionEn: 'When a meaningful contact detail is not safely clear, the learner independently requests spelling, repetition or written form instead of guessing.' },
      { id: 'repair_resolution', labelAr: 'أكد المعلومة', requiredIndependent: 1, descriptionEn: 'After the repair, the learner shows the important detail was resolved, for example by correctly confirming or using the clarified spelling/number.' },
    ],
    missionLine: 'MISSION: run a fictional contact-detail exchange with one genuine repair opportunity.',
    extraRules: ['Never pressure the learner for real phone, email or address. The repair move is the main skill; do not auto-spell the difficult detail before the learner asks.'],
  }),
  makeContract({
    scenarioId: 'learn-v2-a1-u1-l06',
    sourceLessonId: 'U1-L06',
    load: { abilities: 4, phrases: 12, grammar: 2, words: 22, pronunciation: 0 },
    duration: 420,
    ground: ['introduce another person', 'simple good-news and bad-news reactions', 'welcome/polite social response', 'simple leave-taking such as See you', 'phrase density is organised as social routines, not isolated targets'],
    checks: [
      { id: 'person_introduction', labelAr: 'قدّم شخص', requiredIndependent: 1, descriptionEn: 'The learner independently introduces an imaginary or familiar person with a short usable social introduction. If the mission flow does not create a natural learner-side introduction until late, create one simple opportunity.' },
      { id: 'positive_reaction', labelAr: 'رد على خبر كويس', requiredIndependent: 1, descriptionEn: 'The learner gives a short reaction that fits a simple positive update. Exact wording is flexible.' },
      { id: 'negative_reaction', labelAr: 'رد على خبر وحش', requiredIndependent: 1, descriptionEn: 'The learner gives a short sympathetic reaction that fits a simple negative update, such as Oh no / I’m sorry or a clear equivalent.' },
      { id: 'social_close', labelAr: 'اقفل اللقاء', requiredIndependent: 1, descriptionEn: 'The learner independently participates in a simple natural closing/leave-taking.' },
    ],
    missionLine: 'MISSION: run one short social encounter focused on introducing, reacting to simple news and closing.',
    extraRules: ['Do not require all 12 source phrases. Judge whether the reaction fits the meaning, not whether a specific canned phrase appears.'],
  }),
  makeContract({
    scenarioId: 'learn-v2-a1-u1-l07',
    sourceLessonId: 'U1-L07',
    load: { abilities: 1, phrases: 1, grammar: 0, words: 0, pronunciation: 0 },
    duration: 480,
    ground: ['ZERO NEW REQUIRED CONTENT', 'retrieve Unit 1 profile questions, basic answers, contact details and repair', 'obtain missing information rather than reading a fixed script'],
    checks: [
      { id: 'profile_question', labelAr: 'اسأل عن الناقص', requiredIndependent: 3, descriptionEn: 'Across three distinct learner turns, the learner independently asks three useful and non-duplicate questions to obtain missing profile information. Do not count a question supplied verbatim as a model immediately before it.' },
      { id: 'profile_repair', labelAr: 'اعمل repair', requiredIndependent: 1, descriptionEn: 'The learner independently repairs one genuinely unclear important detail using repetition, spelling or another basic clarification move.' },
      { id: 'profile_use', labelAr: 'استخدم اللي فهمته', requiredIndependent: 1, descriptionEn: 'The learner accurately uses or summarizes at least two profile facts they obtained in the exchange, without being shown a full summary model first.' },
    ],
    missionLine: 'MISSION: run the zero-new Unit 1 personal-profile transfer: obtain missing information, repair one gap, then use the information.',
    extraRules: ['ZERO NEW REQUIRED SYSTEM OR CONTENT. Contextual vocabulary may be supplied but cannot become a hidden success condition. Do not volunteer the full profile before the learner asks.'],
  }),
  makeContract({
    scenarioId: 'learn-v2-a1-u2-l01',
    sourceLessonId: 'U2-L01',
    load: { abilities: 5, phrases: 6, grammar: 3, words: 24, pronunciation: 2 },
    duration: 420,
    ground: ['core family relationships', "I've got …", 'my/your/his/her possessive reference', 'best friend / family member / live with', 'broad family vocabulary stays contextual'],
    checks: [
      { id: 'family_fact', labelAr: 'معلومة عن شخص قريب', requiredIndependent: 2, descriptionEn: 'Across two learner turns, the learner independently gives two understandable facts about family or a familiar person. Invented profiles are valid.' },
      { id: 'family_frame', labelAr: 'have got / live with', requiredIndependent: 1, descriptionEn: 'The learner independently uses a simple family frame such as I’ve got … or I live with … in a meaningful utterance.' },
      { id: 'ask_family', labelAr: 'اسأل الطرف التاني', requiredIndependent: 1, descriptionEn: 'The learner independently asks one understandable question about the partner family or familiar people.' },
    ],
    missionLine: 'MISSION: run one friendly family/familiar-person exchange using a small active lexical core.',
    extraRules: ['Do not introduce get married/grow up as targets. Do not demand real family information; invented profiles are valid.'],
  }),
  makeContract({
    scenarioId: 'learn-v2-a1-u2-l02',
    sourceLessonId: 'U2-L02',
    load: { abilities: 5, phrases: 3, grammar: 4, words: 24, pronunciation: 0 },
    duration: 360,
    ground: ['PRIMARY RECEPTIVE TARGET: identify a familiar person from a short description', 'age/family/job/appearance clues', 'look like and basic descriptive adjectives support recognition', 'productive description must not replace receptive evidence'],
    checks: [
      { id: 'identify_person', labelAr: 'حدد الشخص', requiredIndependent: 2, descriptionEn: 'Across two separate description rounds, the learner independently identifies the correct person from the authored three-person roster based on the spoken clues. A name supplied after the teacher revealed the answer is supported, not independent.' },
    ],
    missionLine: 'MISSION: run two short receptive identify-the-person rounds using the exact authored roster from the lesson.',
    extraRules: ['C08 REMAINS RECEPTIVE. Do not require the learner to produce the appearance vocabulary. If they ask for repetition, repeat/simplify the clues without revealing the name.'],
  }),
  makeContract({
    scenarioId: 'learn-v2-a1-u2-l03',
    sourceLessonId: 'U2-L03',
    load: { abilities: 0, phrases: 1, grammar: 2, words: 24, pronunciation: 0 },
    duration: 420,
    ground: ['third-person profile questions using already-known profile content', 'he/she reference as needed', 'simple and / but / or cohesion', 'genuine mystery-person information gap'],
    checks: [
      { id: 'third_person_question', labelAr: 'اسأل عن الشخص', requiredIndependent: 3, descriptionEn: 'Across three distinct learner turns, the learner independently asks three different understandable profile questions about the hidden person.' },
      { id: 'connected_summary', labelAr: 'اربط معلومتين', requiredIndependent: 1, descriptionEn: 'After obtaining information, the learner independently gives one short summary connecting at least two accurate facts, normally with and or but (or another equally clear A1 connection). Do not require all connectors.' },
    ],
    missionLine: 'MISSION: run one mystery-person information gap, then ask for a short connected two-fact summary.',
    extraRules: ['Do not reveal the hidden profile before the learner asks. Do not turn the 24 source words into a vocabulary test or open a broad third-person grammar lesson.'],
  }),
];
