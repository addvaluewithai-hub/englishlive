export type SpeakingReadiness = 'ready' | 'challenge' | 'later';
export type SpeakingDifficulty = 'easier' | 'recommended' | 'challenge';

export type SpeakingScenario = {
  id: string;
  title: string;
  description: string;
  readiness: SpeakingReadiness;
  duration: string;
  image?: string;
  learnerRole?: string;
  aiRole?: string;
  goal?: string;
  uses?: string[];
};

export type SpeakingGroup = {
  id: string;
  title: string;
  count: number;
  image?: string;
  scenarios: SpeakingScenario[];
};

export type SpeakingWorld = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  heroAsset?: string;
  groups: SpeakingGroup[];
};

// These are crops from the approved speaking asset sheet. They are kept as
// independent transparent assets so the UI can compose them responsively.
export const speakingAssets = {
  ottiHero: 'https://res.cloudinary.com/as9o12al/image/upload/v1790680899/otti-hero.webp',
  meetingPeople: 'https://res.cloudinary.com/as9o12al/image/upload/v1790681428/meeting-people.webp',
  ottiTravel: 'https://res.cloudinary.com/as9o12al/image/upload/v1790681036/otti-travel.webp',
  hotelReception: 'https://res.cloudinary.com/as9o12al/image/upload/v1790681782/hotel-reception.webp',
  ottiReceptionist: 'https://res.cloudinary.com/as9o12al/image/upload/v1790681822/otti-receptionist.webp',
  ottiProgress: 'https://res.cloudinary.com/as9o12al/image/upload/v1790681857/otti-progress.webp',
} as const;

export const speakingWorlds = [
  { id: 'everyday', title: 'الحياة اليومية', icon: '🏠' },
  { id: 'travel', title: 'السفر', icon: '✈️' },
  { id: 'work', title: 'العمل', icon: '💼' },
  { id: 'people', title: 'الناس', icon: '👥' },
  { id: 'opinions', title: 'الآراء', icon: '💬' },
  { id: 'stories', title: 'القصص', icon: '📖' },
] as const;

const hotelScenarios: SpeakingScenario[] = [
  {
    id: 'hotel-check-in',
    title: 'تسجيل الدخول',
    description: 'تحدث مع موظف الاستقبال لحجز الغرفة وتسجيل الدخول.',
    readiness: 'ready',
    duration: '5 - 7 دقائق',
    image: speakingAssets.hotelReception,
    learnerRole: 'نزيل',
    aiRole: 'موظف الاستقبال',
    goal: 'أكد بيانات الحجز وسجّل دخولك للفندق.',
    uses: ['تأكيد الحجز', 'ذكر الاسم', 'طلب معلومات بسيطة'],
  },
  {
    id: 'hotel-services',
    title: 'السؤال عن الخدمات',
    description: 'اسأل عن الواي فاي والإفطار وخدمات الفندق.',
    readiness: 'ready',
    duration: '4 - 6 دقائق',
    learnerRole: 'نزيل',
    aiRole: 'موظف الاستقبال',
    goal: 'اسأل عن خدمتين في الفندق وافهم الإجابة.',
    uses: ['السؤال عن الخدمات', 'الوقت والمكان', 'سؤال متابعة'],
  },
  {
    id: 'hotel-problem',
    title: 'مشكلة في الغرفة',
    description: 'عبّر عن مشكلة في الغرفة واطلب المساعدة.',
    readiness: 'challenge',
    duration: 'حوالي 6 دقائق',
    image: speakingAssets.hotelReception,
    learnerRole: 'نزيل',
    aiRole: 'موظف الاستقبال',
    goal: 'اشرح المشكلة ووصل إلى حل.',
    uses: ['طلب المساعدة', 'شرح مشكلة', 'السؤال عن الحل'],
  },
  {
    id: 'change-booking',
    title: 'تغيير الحجز',
    description: 'اطلب تغيير موعد الحجز أو تعديل التفاصيل.',
    readiness: 'later',
    duration: '6 - 8 دقائق',
    learnerRole: 'نزيل',
    aiRole: 'موظف الاستقبال',
    goal: 'اطلب تعديل الحجز واتفق على التفاصيل الجديدة.',
    uses: ['طلب تغيير', 'تأكيد التفاصيل', 'التفاوض البسيط'],
  },
  {
    id: 'late-checkout',
    title: 'تسجيل خروج متأخر',
    description: 'اطلب تسجيل خروج متأخر من الفندق.',
    readiness: 'ready',
    duration: '4 - 6 دقائق',
    learnerRole: 'نزيل',
    aiRole: 'موظف الاستقبال',
    goal: 'اطلب خروجًا متأخرًا واعرف إذا كان متاحًا.',
    uses: ['طلب مهذب', 'السؤال عن الوقت', 'تأكيد الاتفاق'],
  },
  {
    id: 'missing-booking',
    title: 'الحجز غير موجود',
    description: 'اتعامل مع مشكلة عدم وجود الحجز واطلب حلًا.',
    readiness: 'challenge',
    duration: '6 - 8 دقائق',
    learnerRole: 'نزيل',
    aiRole: 'موظف الاستقبال',
    goal: 'اشرح إن الحجز غير ظاهر وساعد الموظف يلاقي حل.',
    uses: ['شرح مشكلة', 'إعطاء معلومات', 'طلب حل'],
  },
];

export const travelWorld: SpeakingWorld = {
  id: 'travel',
  title: 'السفر',
  subtitle: 'مكتبة مواقف تقدر تتدرب عليها وتستخدم فيها اللي اتعلمته.',
  icon: '✈️',
  heroAsset: speakingAssets.ottiTravel,
  groups: [
    { id: 'airport', title: 'المطار', count: 5, scenarios: [] },
    { id: 'hotel', title: 'الفندق', count: 6, scenarios: hotelScenarios },
    { id: 'eating-out', title: 'الأكل بره', count: 4, scenarios: [] },
    { id: 'surprises', title: 'مشاكل ومفاجآت', count: 3, scenarios: [] },
  ],
};

export const firstMeetingScenario: SpeakingScenario = {
  id: 'first-meeting',
  title: 'اتعرف على شخص جديد',
  description: 'تدرّب على التحيات والتعريف بنفسك من آخر دروسك.',
  readiness: 'ready',
  duration: '5 - 8 دقائق',
  image: speakingAssets.meetingPeople,
  learnerRole: 'نفسك',
  aiRole: 'شخص بتقابله لأول مرة',
  goal: 'ابدأ التعارف، عرّف بنفسك واسأل سؤالين بسيطين.',
  uses: ['التحيات', 'التعريف بنفسك', 'أسئلة شخصية بسيطة'],
};

export function findSpeakingScenario(id: string) {
  if (id === firstMeetingScenario.id) return firstMeetingScenario;
  return travelWorld.groups.flatMap((group) => group.scenarios).find((scenario) => scenario.id === id) ?? null;
}
