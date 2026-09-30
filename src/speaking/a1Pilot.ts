import { speakingAssets } from './assets';
import type { SpeakingScenario } from './catalog';

export const A1_SPEAKING_PILOT_LESSONS: SpeakingScenario[] = [
  {
    id: 'a1-s1-l01',
    worldId: 'curriculum',
    groupId: 'a1-unit-1',
    titleAr: 'اتعرف على شخص جديد',
    descriptionAr: 'محادثة حقيقية تجمع أول 3 دروس Learn: تحية واسم، عمر، بلد ومكان السكن.',
    learnerRoleAr: 'نفسك أو شخصية خيالية',
    aiRoleAr: 'شخص بتقابله لأول مرة',
    goalAr: 'استخدم لغة أول 3 دروس Learn بنفسك داخل تعارف طبيعي، واسأل الطرف التاني كمان. الدرس يخلص لما الاستخدام المطلوب يظهر فعلًا.',
    durationMinutes: 7,
    readiness: 'ready',
    readinessReasonAr: 'كل اللغة المطلوبة اتقدمت قبل كده في Learn U1-L01 إلى U1-L03؛ هنا بنحوّلها لاستخدام فعلي.',
    usesAr: ['تحية + اسم', 'الحال', 'العمر', 'البلد + مكان السكن', 'اسأل سؤالين بنفسك', 'ردود قصيرة كاملة'],
    image: speakingAssets.meetingPeople,
    liveCharacterImage: speakingAssets.ottiHero,
    modeId: 'just-chat',
    applicationType: 'practice',
    interactionFocus: ['initiate', 'respond', 'follow-up', 'maintain'],
    partnerBriefEn: 'You are meeting the learner for the first time at a simple friendly English meetup. Have a two-sided first-contact conversation. Exchange names, basic wellbeing, age if appropriate, origin and residence. Share your own simple fictional details so the learner has real reasons to ask you questions too. The conversation can breathe naturally, but keep it inside familiar A1 first-contact language and do not drift into deep hobbies, football, work, news or other side topics before the lesson evidence is complete.',
    courseSourceAr: 'A1 Learn • U1-L01 + U1-L02 + U1-L03',
    courseLessonIds: ['A1-U1-L01', 'A1-U1-L02', 'A1-U1-L03'],
    curriculum: {
      level: 'A1',
      unit: 1,
      unitTitleAr: 'استخدم اللي اتعلمته',
      lessonCode: 'S1-L01',
      position: 1,
      totalInUnit: 1,
      sourceLessonIds: ['U1-L01', 'U1-L02', 'U1-L03'],
    },
    skillFocusAr: 'First-contact retrieval • L1–L3',
    practiceStepsAr: ['ابدأوا تعارف طبيعي', 'Otti يلف الحوار ناحية الحاجات الناقصة من غير ما يقولك', 'لما الـchecks تكتمل المحادثة تقفل طبيعي'],
    targetLanguageEn: [
      'Hello / Hi / Good morning',
      "I'm … / My name is … / What's your name?",
      'How are you? + short wellbeing answers + Thank you / Thanks',
      "How old are you? + I'm … / … years old",
      "Where are you from? + I'm from … / come from …",
      'Where do you live? + I live in …',
      'basic age numbers and familiar country/city/place words from Learn U1-L01–U1-L03',
    ],
    boundariesEn: [
      'This is retrieval/application of Learn U1-L01, U1-L02 and U1-L03, not reteaching those lessons.',
      'The learner may use real or fictional personal information.',
      'Do not drift into extended hobbies, work, football, opinions or other later material while required first-contact evidence is still missing.',
      'If an utterance is implausible or likely ASR noise, clarify instead of pretending it makes sense.',
    ],
    correctionFocusEn: [
      "usable self-introduction with I'm / My name is",
      "usable age statement with be / years old rather than only a bare number",
      "usable origin clause with I'm from / come from",
      'usable residence clause with I live in',
      'two learner-initiated personal questions',
      'short complete turns rather than isolated words when a tiny clause is reasonably expected',
    ],
    openingMoveEn: 'Start like a friendly person meeting the learner for the first time. Use one short greeting and introduce yourself with a simple fictional first name, then give the learner the turn. Do not provide model answers for the learner.',
  },
];

export function a1SpeakingPilotLessonById(id?: string) {
  return A1_SPEAKING_PILOT_LESSONS.find((lesson) => lesson.id === id);
}

export function nextA1SpeakingPilotLesson(id?: string) {
  const index = A1_SPEAKING_PILOT_LESSONS.findIndex((lesson) => lesson.id === id);
  return index >= 0 ? A1_SPEAKING_PILOT_LESSONS[index + 1] : undefined;
}
