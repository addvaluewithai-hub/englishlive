export type SpeakingReadiness = 'ready' | 'challenge' | 'later';
export type SpeakingDifficulty = 'easier' | 'recommended' | 'challenge';

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
  modeId: 'travel' | 'work' | 'just-chat' | 'interview';
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

const speakingAsset = '/speaking-assets/otti-hero.webp';

const travelScenarios: SpeakingScenario[] = [
  {
    id: 'hotel-check-in', worldId: 'travel', groupId: 'hotel', titleAr: 'تسجيل الدخول',
    descriptionAr: 'اتكلم مع موظف الاستقبال واحجز غرفتك وسجّل الدخول.',
    learnerRoleAr: 'نزيل', aiRoleAr: 'موظف الاستقبال',
    goalAr: 'سجّل دخولك واسأل عن أهم تفاصيل الإقامة.', durationMinutes: 5,
    readiness: 'ready', readinessReasonAr: 'اللغة الأساسية اتغطت في دروسك.',
    usesAr: ['التعريف بنفسك', 'تأكيد الحجز', 'السؤال عن التفاصيل'],
    image: speakingAsset, modeId: 'travel',
  },
  {
    id: 'hotel-services', worldId: 'travel', groupId: 'hotel', titleAr: 'السؤال عن الخدمات',
    descriptionAr: 'اسأل عن الواي فاي والإفطار وخدمات الفندق.',
    learnerRoleAr: 'نزيل', aiRoleAr: 'موظف الاستقبال',
    goalAr: 'اعرف الخدمات اللي محتاجها واسأل عنها بوضوح.', durationMinutes: 5,
    readiness: 'ready', readinessReasonAr: 'مناسب للي أخدته في مواقف السؤال والطلب.',
    usesAr: ['السؤال عن خدمة', 'الوقت والمكان'],
    image: speakingAsset, modeId: 'travel',
  },
  {
    id: 'hotel-room-problem', worldId: 'travel', groupId: 'hotel', titleAr: 'مشكلة في الفندق',
    descriptionAr: 'عبّر عن مشكلة في الغرفة واطلب المساعدة لحد ما توصلوا لحل.',
    learnerRoleAr: 'نزيل', aiRoleAr: 'موظف الاستقبال',
    goalAr: 'اشرح المشكلة ووصل إلى حل.', durationMinutes: 6,
    readiness: 'challenge', readinessReasonAr: 'الموقف بيجمع أكتر من قدرة وبيحتاج متابعة.',
    usesAr: ['طلب المساعدة', 'شرح مشكلة', 'السؤال عن الحل'],
    image: speakingAsset, modeId: 'travel',
  },
  {
    id: 'change-booking', worldId: 'travel', groupId: 'hotel', titleAr: 'تغيير الحجز',
    descriptionAr: 'اطلب تغيير موعد الحجز أو تعديل التفاصيل.',
    learnerRoleAr: 'نزيل', aiRoleAr: 'موظف الحجوزات',
    goalAr: 'اطلب التغيير وافهم البدائل المتاحة.', durationMinutes: 6,
    readiness: 'later', readinessReasonAr: 'يعتمد على لغة لسه جاية في مسارك.',
    usesAr: ['طلب تغيير', 'فهم البدائل'],
    image: speakingAsset, modeId: 'travel',
  },
  {
    id: 'late-checkout', worldId: 'travel', groupId: 'hotel', titleAr: 'تسجيل خروج متأخر',
    descriptionAr: 'اطلب وقت إضافي قبل مغادرة الفندق.',
    learnerRoleAr: 'نزيل', aiRoleAr: 'موظف الاستقبال',
    goalAr: 'اطلب تسجيل خروج متأخر وافهم الشروط.', durationMinutes: 5,
    readiness: 'ready', readinessReasonAr: 'طلب بسيط ومباشر ومناسب لمستواك الحالي.',
    usesAr: ['طلب بسيط', 'الوقت'],
    image: speakingAsset, modeId: 'travel',
  },
  {
    id: 'booking-missing', worldId: 'travel', groupId: 'hotel', titleAr: 'الحجز غير موجود',
    descriptionAr: 'اتكلم عن حجز مش ظاهر واطلب حل مناسب.',
    learnerRoleAr: 'نزيل', aiRoleAr: 'موظف الاستقبال',
    goalAr: 'وضّح بيانات الحجز واتعامل مع المشكلة.', durationMinutes: 7,
    readiness: 'challenge', readinessReasonAr: 'فيه complication ومتابعة أكتر من المعتاد.',
    usesAr: ['توضيح البيانات', 'التعامل مع مشكلة', 'متابعة الحل'],
    image: speakingAsset, modeId: 'travel',
  },
];

export const SPEAKING_WORLDS: SpeakingWorld[] = [
  { id: 'everyday', titleAr: 'الحياة اليومية', subtitleAr: 'مواقف يومية بسيطة تخليك تستخدم اللي اتعلمته بسرعة.', icon: 'home', groups: [] },
  {
    id: 'travel', titleAr: 'السفر', subtitleAr: 'مكتبة مواقف تقدر تتدرب عليها وتتحدث بثقة في المطار والفندق والأماكن السياحية.', icon: 'travel',
    heroImage: speakingAsset,
    groups: [
      { id: 'airport', titleAr: 'المطار', subtitleAr: '5 مواقف', scenarios: [] },
      { id: 'hotel', titleAr: 'الفندق', subtitleAr: '6 مواقف', image: speakingAsset, scenarios: travelScenarios },
      { id: 'food', titleAr: 'الأكل بره', subtitleAr: '4 مواقف', scenarios: [] },
      { id: 'problems', titleAr: 'مشاكل ومفاجآت', subtitleAr: '3 مواقف', scenarios: [] },
    ],
  },
  { id: 'work', titleAr: 'العمل', subtitleAr: 'اجتماعات، طلبات، خطط ومواقف الشغل اليومية.', icon: 'work', groups: [] },
  { id: 'people', titleAr: 'الناس', subtitleAr: 'اتعرف على ناس وتبادل معلومات وخلي الحوار مستمر.', icon: 'people', groups: [] },
  { id: 'opinions', titleAr: 'الآراء', subtitleAr: 'عبّر عن رأيك واتفق واختلف بطريقة طبيعية.', icon: 'opinions', groups: [] },
  { id: 'stories', titleAr: 'القصص', subtitleAr: 'احكي مواقف وتجارب وخلي كلامك مترابط.', icon: 'stories', groups: [] },
];

export const FEATURED_SPEAKING_SCENARIO: SpeakingScenario = {
  id: 'meet-someone-new', worldId: 'people', groupId: 'first-contact', titleAr: 'اتعرف على شخص جديد',
  descriptionAr: 'تدرّب على التحيات والتعريف بنفسك والكلام اللي أخدته في آخر دروسك.',
  learnerRoleAr: 'نفسك', aiRoleAr: 'شخص بتقابله لأول مرة',
  goalAr: 'ابدأ تعارف بسيط وخلي الحوار يكمل بشكل طبيعي.', durationMinutes: 6,
  readiness: 'ready', readinessReasonAr: 'من آخر دروسك ومناسب لمستواك.',
  usesAr: ['التحيات', 'التعريف بنفسك', 'سؤال متابعة'],
  image: speakingAsset, modeId: 'just-chat',
};

export function speakingWorldById(worldId?: string) {
  return SPEAKING_WORLDS.find((world) => world.id === worldId) ?? SPEAKING_WORLDS[1];
}

export function speakingScenarioById(scenarioId?: string) {
  if (scenarioId === FEATURED_SPEAKING_SCENARIO.id) return FEATURED_SPEAKING_SCENARIO;
  for (const world of SPEAKING_WORLDS) {
    for (const group of world.groups) {
      const scenario = group.scenarios.find((item) => item.id === scenarioId);
      if (scenario) return scenario;
    }
  }
  return travelScenarios[2];
}
