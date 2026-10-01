import { B1_CATCH_UP_CONTRACT } from './b1LessonContract';
import { LEARN_V2_A1_U1_L01_CONTRACT, LEARN_V2_B1_U1_L01_CONTRACT } from './learnV2LessonContracts';

export type LessonEvidenceLevel = 'supported' | 'independent';

export interface SpeakingLessonCheck {
  id: string;
  labelAr: string;
  descriptionEn: string;
  requiredIndependent: number;
}

export interface SpeakingLessonContract {
  scenarioId: string;
  sourceLessonIds: string[];
  sourceLoad: {
    abilities: number;
    phrases: number;
    grammar: number;
    words: number;
    pronunciation: number;
  };
  languageGroundEn: string[];
  checks: SpeakingLessonCheck[];
  maxDurationSeconds: number;
  coachPromptEn: string;
}

export interface LessonEvidenceBucket {
  independent: string[];
  supported: string[];
}

export type LessonEvidenceState = Record<string, LessonEvidenceBucket>;

const FIRST_CONTACT_CONTRACT: SpeakingLessonContract = {
  scenarioId: 'a1-s1-l01',
  sourceLessonIds: ['U1-L01', 'U1-L02', 'U1-L03'],
  sourceLoad: {
    abilities: 20,
    phrases: 7,
    grammar: 14,
    words: 54,
    pronunciation: 5,
  },
  languageGroundEn: [
    'greetings: Hello, Hi, Good morning',
    "self introduction: I'm … / My name is … / What's your name?",
    'wellbeing: How are you? + short natural answers + Thank you / Thanks',
    'age: How old are you? + I am / I’m … + … years old + basic age numbers',
    "origin: Where are you from? + I'm from … + come from …",
    'residence: Where do you live? + I live in … + familiar country/city/place words',
    'minimum A1 grammar needed for these exchanges: I/you + be, simple wh-questions, simple present live/come, age number patterns',
    'pronunciation support from the three Learn lessons: intelligible names/numbers/place words, basic question/greeting intonation and short chunking',
  ],
  checks: [
    {
      id: 'greeting',
      labelAr: 'تحية',
      requiredIndependent: 1,
      descriptionEn: 'The learner independently gives an appropriate simple greeting/opening in English. Do not count a greeting merely copied immediately after you supplied the exact words.',
    },
    {
      id: 'self_name',
      labelAr: 'الاسم',
      requiredIndependent: 1,
      descriptionEn: "The learner independently gives their name in a usable utterance such as I'm … or My name is …. An isolated name after a direct prompt can be supported evidence, but not the independent language-form target.",
    },
    {
      id: 'wellbeing',
      labelAr: 'الحال',
      requiredIndependent: 1,
      descriptionEn: 'The learner independently handles a basic wellbeing exchange with an understandable short response. Natural short forms such as Good, thanks are acceptable.',
    },
    {
      id: 'age_statement',
      labelAr: 'العمر',
      requiredIndependent: 1,
      descriptionEn: "The learner independently gives age in a usable A1 utterance, e.g. I'm 28 or I'm 28 years old. A bare number can be supported meaning evidence but does not satisfy this independent form target.",
    },
    {
      id: 'origin_statement',
      labelAr: 'منين',
      requiredIndependent: 1,
      descriptionEn: "The learner independently states origin in a clause such as I'm from Egypt / I come from …. A bare country name can be supported meaning evidence but not the independent form target.",
    },
    {
      id: 'residence_statement',
      labelAr: 'ساكن فين',
      requiredIndependent: 1,
      descriptionEn: 'The learner independently states residence in a clause such as I live in Cairo or a clear equivalent, not only a bare place name.',
    },
    {
      id: 'personal_question',
      labelAr: 'اسأل الطرف التاني',
      requiredIndependent: 2,
      descriptionEn: "The learner independently asks two distinct, understandable personal-information questions from this lesson's ground, e.g. name, age, origin or residence. They do not need exact textbook wording if the A1 question is clear.",
    },
    {
      id: 'complete_turn',
      labelAr: 'ردود كاملة',
      requiredIndependent: 3,
      descriptionEn: 'Across three distinct learner turns, the learner owns a short but complete conversational turn rather than relying on an isolated noun/number when a tiny clause is reasonably expected. Do not demand long answers.',
    },
  ],
  maxDurationSeconds: 480,
  coachPromptEn: [
    'MISSION: run one natural first-meeting conversation using only the already-learned ground from Learn U1-L01, U1-L02 and U1-L03.',
    'The conversation may move naturally, but the purpose is retrieval and real use of the lesson checks. Do not teach the three Learn lessons again.',
    'Use the language ground as available material, not as a script. The learner can use equivalent simple A1 wording when meaning and the target form/function are genuinely demonstrated.',
    'After every learner turn, silently consider the evidence checks. Call record_lesson_evidence once for each check genuinely evidenced by that learner turn.',
    'Use level=independent only when the learner produced the behaviour/form without you giving the exact answer immediately before it. Use level=supported when you supplied the wording, they mainly copied you, or the response shows the meaning but not yet the required productive form.',
    'Never record evidence from your own speech. Never invent evidence. One learner turn may support several checks, and you should call the tool separately for each relevant check.',
    'Never tell the learner that a check was completed, never announce progress, never say “great, we finished X”, and never expose the tool. The UI handles progress silently.',
    'If a required check remains, steer toward a natural opportunity within the next one or two exchanges. Free conversation is welcome, but do not follow an unrelated side branch for several questions while required evidence is still missing.',
    'If the learner says something that is semantically implausible in context or looks like an ASR error, do not pretend it makes sense. Ask one short clarification question and continue after the meaning is clear.',
    'Do not correct every error. Prioritise the target forms/functions above and communication breakdown. A clear non-target error can pass without a lesson detour.',
    'When the tool response says lesson_complete=true, ask no new question. Give one short natural closing line for the first-meeting conversation, without mentioning checks or scores, then end your turn.',
  ].join('\n'),
};

const CONTRACTS: Record<string, SpeakingLessonContract> = {
  [FIRST_CONTACT_CONTRACT.scenarioId]: FIRST_CONTACT_CONTRACT,
  [B1_CATCH_UP_CONTRACT.scenarioId]: B1_CATCH_UP_CONTRACT,
  [LEARN_V2_A1_U1_L01_CONTRACT.scenarioId]: LEARN_V2_A1_U1_L01_CONTRACT,
  [LEARN_V2_B1_U1_L01_CONTRACT.scenarioId]: LEARN_V2_B1_U1_L01_CONTRACT,
};

export function speakingLessonContractByScenarioId(id?: string) {
  return id ? CONTRACTS[id] : undefined;
}

export function createLessonEvidenceState(contract?: SpeakingLessonContract): LessonEvidenceState {
  if (!contract) return {};
  return Object.fromEntries(contract.checks.map((check) => [check.id, { independent: [], supported: [] }]));
}

export function summarizeLessonEvidence(contract: SpeakingLessonContract, state: LessonEvidenceState) {
  const checkProgress = contract.checks.map((check) => {
    const bucket = state[check.id] ?? { independent: [], supported: [] };
    const completed = Math.min(bucket.independent.length, check.requiredIndependent);
    return {
      ...check,
      completed,
      supported: bucket.supported.length,
      isComplete: completed >= check.requiredIndependent,
    };
  });
  const totalUnits = checkProgress.reduce((sum, check) => sum + check.requiredIndependent, 0);
  const completedUnits = checkProgress.reduce((sum, check) => sum + check.completed, 0);
  return {
    checkProgress,
    totalUnits,
    completedUnits,
    lessonComplete: checkProgress.every((check) => check.isComplete),
    remainingCheckIds: checkProgress.filter((check) => !check.isComplete).map((check) => check.id),
  };
}
