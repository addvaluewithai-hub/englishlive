import { speakingAssets } from './assets';
import type { SpeakingScenario } from './catalog';

export const B1_SPEAKING_PREVIEW_LESSONS: SpeakingScenario[] = [
  {
    id: 'b1-s1-l01',
    worldId: 'curriculum',
    groupId: 'b1-unit-1',
    titleAr: 'اتكلم مع حد تعرفه بعد فترة',
    descriptionAr: 'محادثة B1 تجمع أول 4 دروس Learn: دخول من غير سكريبت، متابعة الحوار، تحديثات وردود فعل، وتوضيح أو إصلاح المعنى.',
    learnerRoleAr: 'نفسك أو شخصية خيالية',
    aiRoleAr: 'شخص تعرفه وبتقابله بعد فترة',
    goalAr: 'ادخل في الكلام من غير نموذج جاهز، احكي update صغير، تابع الطرف التاني، واسأل وتصلّح أي سوء فهم من غير ما الحوار يقع.',
    durationMinutes: 9,
    readiness: 'challenge',
    readinessReasonAr: 'ده Preview لمستوى B1 ومبني على Learn U1-L01 إلى U1-L04، فالمطلوب هنا استقلال أكتر في إدارة المحادثة مش مجرد جمل أطول.',
    usesAr: ['دخول من غير سكريبت', 'update + feeling + detail', 'follow-up طبيعي', 'رد فعل على خبر', 'clarify / confirm', 'paraphrase عند نقص كلمة', 'قفل الحوار طبيعي'],
    image: speakingAssets.meetingPeople,
    liveCharacterImage: speakingAssets.ottiHero,
    modeId: 'just-chat',
    applicationType: 'practice',
    interactionFocus: ['initiate', 'respond', 'follow-up', 'maintain', 'develop', 'clarify', 'repair', 'close'],
    partnerBriefEn: 'You are a familiar acquaintance the learner has not seen for a while. Start with an unpredictable but familiar opening, not a textbook greeting script. Have a two-sided catch-up. Share one piece of good or bad personal news, ask about the learner, and let topics develop naturally. At one point create one mild misunderstanding that the learner can repair or confirm. Later create one natural lexical-gap opportunity where the learner can explain an object/activity/idea without the exact word. Do not tell the learner these are checks. Keep the conversation on familiar personal/social topics and give the learner room to initiate, follow up, react, clarify and close.',
    courseSourceAr: 'B1 Learn • U1-L01 + U1-L02 + U1-L03 + U1-L04',
    courseLessonIds: ['B1-U1-L01', 'B1-U1-L02', 'B1-U1-L03', 'B1-U1-L04'],
    curriculum: {
      level: 'B1',
      unit: 1,
      unitTitleAr: 'From routine exchange to independent conversation',
      lessonCode: 'B1-S1-L01',
      position: 1,
      totalInUnit: 1,
      sourceLessonIds: ['U1-L01', 'U1-L02', 'U1-L03', 'U1-L04'],
    },
    skillFocusAr: 'Independent conversation • Learn U1-L01–L04',
    practiceStepsAr: ['Otti يبدأ من opening غير متوقع', 'الحوار يتحرك طبيعي مع updates وfollow-ups', 'يحصل repair + lexical gap مرة واحدة', 'لما الـevidence يكتمل يحصل closing طبيعي'],
    targetLanguageEn: [
      'B1 social opening/response and topic establishment without a complete dialogue model',
      'conversation continuation: acknowledgement + relevant follow-up + turn management',
      'personal update + feeling/reaction + brief reason or detail expansion',
      'reacting appropriately to good/bad news using familiar fixed expressions',
      'clarification and confirmation: ask what someone means, repeat back a detail, correct a misunderstanding',
      'simple circumlocution/paraphrase for a missing word, including source phrase “a kind of …” where natural',
      'source phrases available where context genuinely fits: get on with, hear of, too bad, get to know, in touch, you see, break up, have … in common, respect for …',
      'integrated grammar support only where useful: emphasis with do, let me, negative tags/checking, events in progress, verb + pronoun + particle',
    ],
    boundariesEn: [
      'This is application/retrieval of Learn B1 U1-L01 through U1-L04, not reteaching those lessons.',
      'Do not require every source phrase, word or grammar row as a separate success condition; many are contextual or integrated support.',
      'Success is interactional independence: entering, sustaining, reacting, following up, repairing and working around a lexical gap.',
      'Keep topics familiar and concrete. Do not turn the lesson into an abstract debate or advanced storytelling task.',
      'If the learner needs an exact model, record supported evidence only and create a fresh opportunity later for independent evidence.',
    ],
    correctionFocusEn: [
      'whether the learner can keep the conversation moving rather than waiting for the partner to drive every turn',
      'whether reactions connect to what the partner actually said',
      'whether follow-up questions are relevant rather than pre-scripted',
      'whether a clarification/confirmation genuinely repairs meaning',
      'whether paraphrase/circumlocution communicates the missing concept even if the exact word is unavailable',
      'intelligibility, chunking and stance; do not chase accent perfection',
    ],
    openingMoveEn: 'Open with one natural unexpected catch-up line such as “Hey, wow — I haven’t seen you in ages!” or an equivalent familiar opener. Do not immediately ask a textbook profile question. Give the learner room to react and establish the first topic.',
  },
];

export function b1SpeakingPreviewLessonById(id?: string) {
  return B1_SPEAKING_PREVIEW_LESSONS.find((lesson) => lesson.id === id);
}
