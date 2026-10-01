export const PRACTICE_LEVELS = [
  { id: 'A1', titleAr: 'مبتدئ', promiseAr: 'مواقف قصيرة وواضحة، شريك متعاون، ومساعدة جاهزة وقت ما تحتاجها.' },
  { id: 'A2', titleAr: 'أساسي', promiseAr: 'مواقف يومية أطول شوية، تفاصيل أكتر، واختيارات بسيطة.' },
  { id: 'B1', titleAr: 'متوسط', promiseAr: 'تتصرف باستقلال أكبر، تشرح، تتابع، وتحل مفاجآت طبيعية.' },
  { id: 'B2', titleAr: 'فوق المتوسط', promiseAr: 'بدائل وتفاوض ومواقف أقل توقعًا مع مساحة أكبر لطريقتك.' },
  { id: 'C1', titleAr: 'متقدم', promiseAr: 'مواقف اجتماعية ومهنية دقيقة، نبرة مناسبة، وشرح أعمق.' },
  { id: 'C2', titleAr: 'إتقان', promiseAr: 'مرونة عالية، معاني ضمنية، تفاوض معقد، وصياغة دقيقة.' },
] as const;

export type PracticeLevelId = (typeof PRACTICE_LEVELS)[number]['id'];

export type PracticeWorldId =
  | 'everyday'
  | 'people-social'
  | 'food-shopping'
  | 'travel-transport'
  | 'work-study'
  | 'home-services'
  | 'plans-leisure';

export type PracticeWorld = {
  id: PracticeWorldId;
  titleAr: string;
  subtitleAr: string;
  emoji: string;
};

export const PRACTICE_WORLDS: PracticeWorld[] = [
  { id: 'everyday', titleAr: 'الحياة اليومية', subtitleAr: 'مواقف صغيرة بتحصل كل يوم.', emoji: '☀️' },
  { id: 'people-social', titleAr: 'الناس والمواقف الاجتماعية', subtitleAr: 'تعارف، دردشة، دعوات وتواصل طبيعي.', emoji: '👋' },
  { id: 'food-shopping', titleAr: 'الأكل والتسوق', subtitleAr: 'اطلب، اختار، اسأل، واتعامل مع مشكلة.', emoji: '☕' },
  { id: 'travel-transport', titleAr: 'السفر والمواصلات', subtitleAr: 'فندق، طريق، تذاكر وتغييرات مفاجئة.', emoji: '✈️' },
  { id: 'work-study', titleAr: 'العمل والدراسة', subtitleAr: 'زملاء، اجتماعات، مقابلات وشرح أفكار.', emoji: '💼' },
  { id: 'home-services', titleAr: 'البيت والخدمات', subtitleAr: 'طلبات، مواعيد، إصلاحات وخدمات يومية.', emoji: '🏠' },
  { id: 'plans-leisure', titleAr: 'الخطط ووقت الفراغ', subtitleAr: 'رتّب خروجة، اقترح، اختار واتفق.', emoji: '🎟️' },
];

export type PracticeMission = {
  id: string;
  level: PracticeLevelId;
  worldId: PracticeWorldId;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  durationMinutes: number;
  status: 'planned' | 'live';
  livePath?: string;
};

// Product-structure seeds only. The authored mission contracts will be added
// one by one from the dedicated speaking-practice source-of-truth repository.
export const PRACTICE_MISSIONS: PracticeMission[] = [
  {
    id: 'a1-meet-someone-new',
    level: 'A1',
    worldId: 'people-social',
    titleAr: 'اتعرف على شخص جديد',
    titleEn: 'Meet someone new',
    descriptionAr: 'ابدأ تعارف بسيط وخلي الكلام يكمل كام دور.',
    durationMinutes: 4,
    status: 'planned',
  },
  {
    id: 'a1-order-a-drink',
    level: 'A1',
    worldId: 'food-shopping',
    titleAr: 'اطلب مشروب',
    titleEn: 'Order a drink',
    descriptionAr: 'اطلب اللي عايزه، اختار تفصيلة، واقفل الطلب طبيعي.',
    durationMinutes: 4,
    status: 'planned',
  },
  {
    id: 'a1-ask-for-directions',
    level: 'A1',
    worldId: 'travel-transport',
    titleAr: 'اسأل عن الطريق',
    titleEn: 'Ask for directions',
    descriptionAr: 'اسأل عن مكان وافهم اتجاهات قصيرة وواضحة.',
    durationMinutes: 5,
    status: 'planned',
  },
  {
    id: 'a1-buy-something',
    level: 'A1',
    worldId: 'food-shopping',
    titleAr: 'اشتري حاجة بسيطة',
    titleEn: 'Buy something simple',
    descriptionAr: 'اسأل عن المنتج والسعر وكمّل عملية شراء قصيرة.',
    durationMinutes: 5,
    status: 'planned',
  },
  {
    id: 'a1-ask-for-help',
    level: 'A1',
    worldId: 'home-services',
    titleAr: 'اطلب مساعدة',
    titleEn: 'Ask for help',
    descriptionAr: 'اشرح احتياج بسيط واطلب مساعدة مباشرة.',
    durationMinutes: 4,
    status: 'planned',
  },
  {
    id: 'a1-make-a-simple-plan',
    level: 'A1',
    worldId: 'plans-leisure',
    titleAr: 'اعمل خطة بسيطة',
    titleEn: 'Make a simple plan',
    descriptionAr: 'اقترح نشاط واتفقوا على وقت ومكان.',
    durationMinutes: 5,
    status: 'planned',
  },
  {
    id: 'b1-change-hotel-booking',
    level: 'B1',
    worldId: 'travel-transport',
    titleAr: 'غيّر حجز فندق',
    titleEn: 'Change a hotel booking',
    descriptionAr: 'اطلب تغيير، افهم قيد أو بديل، ووصل لاتفاق.',
    durationMinutes: 7,
    status: 'planned',
  },
  {
    id: 'b1-fix-wrong-order',
    level: 'B1',
    worldId: 'food-shopping',
    titleAr: 'حل مشكلة في الطلب',
    titleEn: 'Fix a wrong order',
    descriptionAr: 'اشرح المشكلة واتعامل مع أسئلة الموظف لحد ما توصلوا لحل.',
    durationMinutes: 7,
    status: 'planned',
  },
  {
    id: 'b1-give-work-update',
    level: 'B1',
    worldId: 'work-study',
    titleAr: 'ادّي تحديث في الشغل',
    titleEn: 'Give a work update',
    descriptionAr: 'اشرح إيه اللي حصل وإيه الخطوة الجاية ورد على متابعة.',
    durationMinutes: 7,
    status: 'planned',
  },
];

const LEVEL_STORAGE_KEY = 'englotti.practice.level.v1';

export function isPracticeLevelId(value: string | undefined): value is PracticeLevelId {
  return PRACTICE_LEVELS.some((level) => level.id === value);
}

export function readPracticeLevel(): PracticeLevelId {
  if (typeof window === 'undefined') return 'A1';
  const value = window.localStorage.getItem(LEVEL_STORAGE_KEY) ?? undefined;
  return isPracticeLevelId(value) ? value : 'A1';
}

export function savePracticeLevel(level: PracticeLevelId) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LEVEL_STORAGE_KEY, level);
}

export function practiceLevelById(levelId?: string) {
  return PRACTICE_LEVELS.find((level) => level.id === levelId) ?? PRACTICE_LEVELS[0];
}

export function practiceWorldById(worldId?: string) {
  return PRACTICE_WORLDS.find((world) => world.id === worldId) ?? PRACTICE_WORLDS[0];
}

export function practiceMissionsForLevel(level: PracticeLevelId) {
  return PRACTICE_MISSIONS.filter((mission) => mission.level === level);
}

export function practiceMissionsForWorld(level: PracticeLevelId, worldId: PracticeWorldId) {
  return PRACTICE_MISSIONS.filter((mission) => mission.level === level && mission.worldId === worldId);
}
