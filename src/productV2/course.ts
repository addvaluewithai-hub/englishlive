import { SCENE_LESSON_PILOTS } from '../lessonScenes/catalog';
import type { SceneLessonDefinition } from '../lessonScenes/types';

export interface ProductUnitDefinition {
  id: string;
  levelId: 'a1';
  order: number;
  title: string;
  arabicTitle: string;
  description: string;
  lessons: readonly SceneLessonDefinition[];
}

export interface ProductUnitOutline {
  id: string;
  order: number;
  title: string;
  arabicTitle: string;
  lessonCount: number;
  connected: boolean;
}

export interface ProductLevelDefinition {
  id: 'a1';
  title: string;
  arabicTitle: string;
  description: string;
  unitCount: number;
  lessonSlotCount: number;
  connectedUnits: readonly ProductUnitDefinition[];
  outline: readonly ProductUnitOutline[];
}

export interface PlannedLessonSlot {
  sourceLessonId: string;
  order: number;
  title: string;
  arabicTitle: string;
  connectedLessonId?: string;
}

export const A1_UNIT_1_PRODUCT: ProductUnitDefinition = {
  id: 'a1-u1-first-contact',
  levelId: 'a1',
  order: 1,
  title: 'First Contact: Me and You',
  arabicTitle: 'التحيات والتعارف',
  description: 'ابدأ أول محادثة بسيطة: سلّم، عرّف بنفسك، واسأل عن معلومات شخصية أساسية بهدوء ووضوح.',
  lessons: SCENE_LESSON_PILOTS,
};

export const A1_UNIT_1_LESSON_SLOTS: readonly PlannedLessonSlot[] = [
  { sourceLessonId: 'U1-L01', order: 1, title: 'Greetings and introductions', arabicTitle: 'التحية والتعريف بنفسك', connectedLessonId: SCENE_LESSON_PILOTS[0]?.id },
  { sourceLessonId: 'U1-L02', order: 2, title: 'Talking about age', arabicTitle: 'السؤال عن السن والأرقام', connectedLessonId: SCENE_LESSON_PILOTS[1]?.id },
  { sourceLessonId: 'U1-L03', order: 3, title: 'Where are you from?', arabicTitle: 'البلد ومكان السكن', connectedLessonId: SCENE_LESSON_PILOTS[2]?.id },
  { sourceLessonId: 'U1-L04', order: 4, title: 'What do you do?', arabicTitle: 'العمل والدراسة' },
  { sourceLessonId: 'U1-L05', order: 5, title: 'Can you spell that?', arabicTitle: 'بيانات التواصل والتهجئة' },
  { sourceLessonId: 'U1-L06', order: 6, title: 'This is my friend …', arabicTitle: 'تقديم شخص آخر' },
  { sourceLessonId: 'U1-L07', order: 7, title: 'Personal profile transfer', arabicTitle: 'تحدي الملف الشخصي' },
];

export const A1_UNIT_OUTLINE: readonly ProductUnitOutline[] = [
  { id: A1_UNIT_1_PRODUCT.id, order: 1, title: 'First Contact: Me and You', arabicTitle: 'التعارف والبيانات الشخصية', lessonCount: 7, connected: true },
  { id: 'a1-u2-people-around-me', order: 2, title: 'People Around Me', arabicTitle: 'الناس من حولي', lessonCount: 6, connected: false },
  { id: 'a1-u3-home-things-location', order: 3, title: 'Home, Things, and Where They Are', arabicTitle: 'البيت والأشياء والمكان', lessonCount: 6, connected: false },
  { id: 'a1-u4-day-time-now', order: 4, title: 'My Day, My Time, What’s Happening', arabicTitle: 'يومي ووقتي وما يحدث الآن', lessonCount: 7, connected: false },
  { id: 'a1-u5-needs-food-shopping', order: 5, title: 'Needs, Food, Shopping, and Simple Service', arabicTitle: 'الاحتياجات والطعام والتسوق', lessonCount: 7, connected: false },
  { id: 'a1-u6-town-travel', order: 6, title: 'Around Town and Travelling', arabicTitle: 'في المدينة والسفر', lessonCount: 7, connected: false },
  { id: 'a1-u7-simple-past', order: 7, title: 'Simple Past: Life and Everyday Events', arabicTitle: 'الماضي البسيط وأحداث الحياة', lessonCount: 5, connected: false },
  { id: 'a1-u8-opinions-plans', order: 8, title: 'Opinions, Suggestions, Plans, and Arrangements', arabicTitle: 'الآراء والاقتراحات والخطط', lessonCount: 6, connected: false },
  { id: 'a1-u9-practical-texts', order: 9, title: 'Read, Follow, and Write: Practical Texts', arabicTitle: 'القراءة والكتابة العملية', lessonCount: 6, connected: false },
  { id: 'a1-u10-exit', order: 10, title: 'A1 Integration and Exit Evidence', arabicTitle: 'تطبيق ومراجعة مستوى A1', lessonCount: 5, connected: false },
];

export const A1_LEVEL_PRODUCT: ProductLevelDefinition = {
  id: 'a1',
  title: 'A1',
  arabicTitle: 'المبتدئ',
  description: 'أساسيات التواصل في المواقف اليومية: التعارف، الناس، البيت، الوقت، التسوق، السفر والمواقف العملية.',
  unitCount: 10,
  lessonSlotCount: 62,
  connectedUnits: [A1_UNIT_1_PRODUCT],
  outline: A1_UNIT_OUTLINE,
};

export const PRODUCT_LEVELS = [A1_LEVEL_PRODUCT] as const;
export const PRODUCT_UNITS = [A1_UNIT_1_PRODUCT] as const;

export function getProductLevel(levelId: string | null | undefined) {
  return PRODUCT_LEVELS.find((level) => level.id === levelId) ?? A1_LEVEL_PRODUCT;
}

export function getProductUnit(unitId: string | null | undefined) {
  return PRODUCT_UNITS.find((unit) => unit.id === unitId) ?? A1_UNIT_1_PRODUCT;
}

export function lessonProductTitle(lesson: SceneLessonDefinition) {
  const slot = A1_UNIT_1_LESSON_SLOTS.find((item) => item.sourceLessonId === lesson.source.sourceLessonId);
  return slot?.title ?? lesson.title;
}

export function lessonArabicTitle(lesson: SceneLessonDefinition) {
  const slot = A1_UNIT_1_LESSON_SLOTS.find((item) => item.sourceLessonId === lesson.source.sourceLessonId);
  return slot?.arabicTitle ?? lesson.subtitle;
}

export function lessonCompletionWins(lesson: SceneLessonDefinition): readonly string[] {
  const wins: Record<string, readonly string[]> = {
    'U1-L01': [
      'إلقاء التحية على شخص جديد',
      'التعريف بنفسك وذكر اسمك',
      'السؤال عن الاسم والتعامل مع How are you?',
    ],
    'U1-L02': [
      'فهم واستخدام أرقام بسيطة تخدم الحديث عن السن',
      'السؤال عن السن بطريقة بسيطة',
      'قول سن حقيقي أو افتراضي في محادثة قصيرة',
    ],
    'U1-L03': [
      'السؤال عن بلد الشخص',
      'قول أنت منين باستخدام I’m from…',
      'قول مكان سكنك باستخدام I live in…',
    ],
  };
  return wins[lesson.source.sourceLessonId] ?? [lesson.performance];
}
