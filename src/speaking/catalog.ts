import { A1_SPEAKING_PILOT_LESSONS, a1SpeakingPilotLessonById } from './a1Pilot';
import { speakingAssets } from './assets';

export type SpeakingReadiness = 'ready' | 'challenge' | 'later';
export type SpeakingDifficulty = 'easier' | 'recommended' | 'challenge';
export type SpeakingApplicationType = 'embedded' | 'integration' | 'unit_challenge' | 'practice';
export type SpeakingInteractionSkill =
  | 'initiate'
  | 'respond'
  | 'follow-up'
  | 'maintain'
  | 'develop'
  | 'close'
  | 'clarify'
  | 'repair'
  | 'explain'
  | 'request-negotiate'
  | 'solve'
  | 'opinion';

export type SpeakingCurriculumMeta = {
  level: 'A1';
  unit: number;
  unitTitleAr: string;
  lessonCode: string;
  position: number;
  totalInUnit: number;
  sourceLessonIds: string[];
};

export type SpeakingScenario = {
  id: string;
  worldId: string;
  groupId: string;
  titleAr: string;
  descriptionAr: string;
  learnerRoleAr: string;
  aiRoleAr: string;
  goalAr: string;
  durationMinutes: number;
  readiness: SpeakingReadiness;
  readinessReasonAr: string;
  usesAr: string[];
  image: string;
  liveCharacterImage?: string;
  modeId: 'travel' | 'work' | 'just-chat' | 'interview';
  applicationType: SpeakingApplicationType;
  interactionFocus: SpeakingInteractionSkill[];
  partnerBriefEn: string;
  courseSourceAr?: string;
  courseLessonIds?: string[];
  curriculum?: SpeakingCurriculumMeta;
  skillFocusAr?: string;
  practiceStepsAr?: string[];
  targetLanguageEn?: string[];
  boundariesEn?: string[];
  correctionFocusEn?: string[];
  openingMoveEn?: string;
};

export type SpeakingGroup = {
  id: string;
  titleAr: string;
  subtitleAr: string;
  image?: string;
  scenarios: SpeakingScenario[];
};

export type SpeakingWorld = {
  id: string;
  titleAr: string;
  subtitleAr: string;
  icon: 'home' | 'travel' | 'work' | 'people' | 'opinions' | 'stories';
  heroImage?: string;
  groups: SpeakingGroup[];
};

const hotelBase = {
  worldId: 'travel',
  groupId: 'hotel',
  learnerRoleAr: 'نزيل',
  image: speakingAssets.hotelReception,
  liveCharacterImage: speakingAssets.ottiReceptionist,
  modeId: 'travel' as const,
  applicationType: 'practice' as const,
};

const travelScenarios: SpeakingScenario[] = [
  {
    ...hotelBase,
    id: 'hotel-check-in',
    titleAr: 'تسجيل الدخول',
    descriptionAr: 'اتكلم مع موظف الاستقبال وأكد حجزك وسجّل الدخول.',
    aiRoleAr: 'موظف الاستقبال',
    goalAr: 'سجّل دخولك واسأل عن أهم تفاصيل الإقامة.',
    durationMinutes: 5,
    readiness: 'ready',
    readinessReasonAr: 'اللغة الأساسية اتغطت في دروسك.',
    usesAr: ['التعريف بنفسك', 'تأكيد الحجز', 'السؤال عن التفاصيل'],
    interactionFocus: ['initiate', 'respond', 'follow-up', 'close'],
    partnerBriefEn: 'You are a friendly hotel receptionist. Confirm the guest name and booking, then give one or two useful stay details. Let the learner do the practical work instead of feeding them a script.',
  },
  {
    ...hotelBase,
    id: 'hotel-services',
    titleAr: 'السؤال عن الخدمات',
    descriptionAr: 'اسأل عن الواي فاي والإفطار وخدمات الفندق.',
    aiRoleAr: 'موظف الاستقبال',
    goalAr: 'اعرف الخدمات اللي محتاجها واسأل عنها بوضوح.',
    durationMinutes: 5,
    readiness: 'ready',
    readinessReasonAr: 'مناسب للي أخدته في مواقف السؤال والطلب.',
    usesAr: ['السؤال عن خدمة', 'الوقت والمكان'],
    interactionFocus: ['follow-up', 'clarify', 'request-negotiate'],
    partnerBriefEn: 'You are a hotel receptionist answering questions about Wi-Fi, breakfast, opening times and hotel facilities. Give realistic concise answers and occasionally ask what the guest needs.',
  },
  {
    ...hotelBase,
    id: 'hotel-room-problem',
    titleAr: 'مشكلة في الفندق',
    descriptionAr: 'عبّر عن مشكلة في الغرفة واطلب المساعدة لحد ما توصلوا لحل.',
    aiRoleAr: 'موظف الاستقبال',
    goalAr: 'اشرح المشكلة ووصل إلى حل.',
    durationMinutes: 6,
    readiness: 'challenge',
    readinessReasonAr: 'الموقف بيجمع أكتر من قدرة وبيحتاج متابعة.',
    usesAr: ['طلب المساعدة', 'شرح مشكلة', 'السؤال عن الحل'],
    interactionFocus: ['explain', 'clarify', 'repair', 'request-negotiate', 'solve'],
    partnerBriefEn: 'You are a hotel receptionist. Ask how you can help, let the learner explain the room problem, ask one useful clarification and offer a realistic solution. Do not solve everything in the first sentence.',
  },
  {
    ...hotelBase,
    id: 'change-booking',
    titleAr: 'تغيير الحجز',
    descriptionAr: 'اطلب تغيير موعد الحجز أو تعديل التفاصيل.',
    aiRoleAr: 'موظف الحجوزات',
    goalAr: 'اطلب التغيير وافهم البدائل المتاحة.',
    durationMinutes: 6,
    readiness: 'later',
    readinessReasonAr: 'يعتمد على لغة لسه جاية في مسارك.',
    usesAr: ['طلب تغيير', 'فهم البدائل'],
    interactionFocus: ['clarify', 'request-negotiate', 'solve'],
    partnerBriefEn: 'You are a hotel reservations agent. Clarify what the learner wants to change, explain one realistic constraint or alternative, and work toward an agreed option.',
  },
  {
    ...hotelBase,
    id: 'late-checkout',
    titleAr: 'تسجيل خروج متأخر',
    descriptionAr: 'اطلب وقت إضافي قبل مغادرة الفندق.',
    aiRoleAr: 'موظف الاستقبال',
    goalAr: 'اطلب تسجيل خروج متأخر وافهم الشروط.',
    durationMinutes: 5,
    readiness: 'ready',
    readinessReasonAr: 'طلب بسيط ومباشر ومناسب لمستواك الحالي.',
    usesAr: ['طلب بسيط', 'الوقت'],
    interactionFocus: ['request-negotiate', 'clarify', 'close'],
    partnerBriefEn: 'You are a hotel receptionist handling a late-checkout request. State the available time or simple condition, answer follow-up questions and close naturally once the guest decides.',
  },
  {
    ...hotelBase,
    id: 'booking-missing',
    titleAr: 'الحجز غير موجود',
    descriptionAr: 'اتكلم عن حجز مش ظاهر واطلب حل مناسب.',
    aiRoleAr: 'موظف الاستقبال',
    goalAr: 'وضّح بيانات الحجز واتعامل مع المشكلة.',
    durationMinutes: 7,
    readiness: 'challenge',
    readinessReasonAr: 'فيه complication ومتابعة أكتر من المعتاد.',
    usesAr: ['توضيح البيانات', 'التعامل مع مشكلة', 'متابعة الحل'],
    interactionFocus: ['clarify', 'repair', 'follow-up', 'solve'],
    partnerBriefEn: 'You are a hotel receptionist who cannot initially find the reservation. Ask for useful booking details, check them, introduce one small complication and collaborate on a practical resolution.',
  },
];

export const SPEAKING_WORLDS: SpeakingWorld[] = [
  {
    id: 'everyday',
    titleAr: 'الحياة اليومية',
    subtitleAr: 'مواقف يومية بسيطة تخليك تستخدم اللي اتعلمته بسرعة.',
    icon: 'home',
    groups: [],
  },
  {
    id: 'travel',
    titleAr: 'السفر',
    subtitleAr: 'مكتبة مواقف تقدر تتدرب عليها وتتحدث بثقة في المطار والفندق والأماكن السياحية.',
    icon: 'travel',
    heroImage: speakingAssets.ottiTravel,
    groups: [
      { id: 'airport', titleAr: 'المطار', subtitleAr: '5 مواقف', image: speakingAssets.airportBanner, scenarios: [] },
      { id: 'hotel', titleAr: 'الفندق', subtitleAr: '6 مواقف', image: speakingAssets.hotelBuilding, scenarios: travelScenarios },
      { id: 'food', titleAr: 'الأكل بره', subtitleAr: '4 مواقف', image: speakingAssets.foodOut, scenarios: [] },
      { id: 'problems', titleAr: 'مشاكل ومفاجآت', subtitleAr: '3 مواقف', image: speakingAssets.luggageWarning, scenarios: [] },
    ],
  },
  { id: 'work', titleAr: 'العمل', subtitleAr: 'اجتماعات، طلبات، خطط ومواقف الشغل اليومية.', icon: 'work', groups: [] },
  { id: 'people', titleAr: 'الناس', subtitleAr: 'اتعرف على ناس وتبادل معلومات وخلي الحوار مستمر.', icon: 'people', groups: [] },
  { id: 'opinions', titleAr: 'الآراء', subtitleAr: 'عبّر عن رأيك واتفق واختلف بطريقة طبيعية.', icon: 'opinions', groups: [] },
  { id: 'stories', titleAr: 'القصص', subtitleAr: 'احكي مواقف وتجارب وخلي كلامك مترابط.', icon: 'stories', groups: [] },
];

export const FEATURED_SPEAKING_SCENARIO: SpeakingScenario = {
  id: 'meet-someone-new',
  worldId: 'people',
  groupId: 'first-contact',
  titleAr: 'اتعرف على شخص جديد',
  descriptionAr: 'تدرّب على التحيات والتعريف بنفسك والكلام اللي أخدته في آخر دروسك.',
  learnerRoleAr: 'نفسك',
  aiRoleAr: 'شخص بتقابله لأول مرة',
  goalAr: 'ابدأ تعارف بسيط وخلي الحوار يكمل بشكل طبيعي.',
  durationMinutes: 6,
  readiness: 'ready',
  readinessReasonAr: 'من آخر دروسك ومناسب لمستواك.',
  usesAr: ['التحيات', 'التعريف بنفسك', 'سؤال متابعة'],
  image: speakingAssets.meetingPeople,
  liveCharacterImage: speakingAssets.ottiHero,
  modeId: 'just-chat',
  applicationType: 'integration',
  interactionFocus: ['initiate', 'respond', 'follow-up', 'maintain', 'close'],
  partnerBriefEn: 'You are meeting the learner for the first time in a normal social setting. Exchange names and simple personal information, contribute a little about yourself, ask natural follow-ups and let the learner help keep the conversation going.',
  courseSourceAr: 'من آخر دروسك',
  courseLessonIds: ['A1-U1-L01', 'A1-U1-L03', 'A1-U1-L04'],
};

export { A1_SPEAKING_PILOT_LESSONS };

export function speakingWorldById(worldId?: string) {
  return SPEAKING_WORLDS.find((world) => world.id === worldId) ?? SPEAKING_WORLDS[1];
}

export function speakingScenarioById(scenarioId?: string) {
  const curriculumLesson = a1SpeakingPilotLessonById(scenarioId);
  if (curriculumLesson) return curriculumLesson;
  if (scenarioId === FEATURED_SPEAKING_SCENARIO.id) return FEATURED_SPEAKING_SCENARIO;
  for (const world of SPEAKING_WORLDS) {
    for (const group of world.groups) {
      const scenario = group.scenarios.find((item) => item.id === scenarioId);
      if (scenario) return scenario;
    }
  }
  return travelScenarios[2];
}