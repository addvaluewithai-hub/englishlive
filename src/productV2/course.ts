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

export const A1_UNIT_1_PRODUCT: ProductUnitDefinition = {
  id: 'a1-u1-first-contact',
  levelId: 'a1',
  order: 1,
  title: 'First Contact: Me and You',
  arabicTitle: 'التحيات والتعارف',
  description: 'اتعلم تبدأ أول محادثة بالإنجليزية: تسلّم، تعرّف بنفسك، وتسأل الشخص اللي قدامك أسئلة بسيطة.',
  lessons: SCENE_LESSON_PILOTS,
};

export const PRODUCT_UNITS = [A1_UNIT_1_PRODUCT] as const;

export function getProductUnit(unitId: string | null | undefined) {
  return PRODUCT_UNITS.find((unit) => unit.id === unitId) ?? A1_UNIT_1_PRODUCT;
}

export function lessonProductTitle(lesson: SceneLessonDefinition) {
  const titles: Record<string, string> = {
    'U1-L01': 'Greetings and introductions',
    'U1-L02': 'Talking about age',
    'U1-L03': 'Where are you from?',
  };
  return titles[lesson.source.sourceLessonId] ?? lesson.title;
}

export function lessonArabicTitle(lesson: SceneLessonDefinition) {
  const titles: Record<string, string> = {
    'U1-L01': 'التحية والتعريف بنفسك',
    'U1-L02': 'السؤال عن السن والأرقام',
    'U1-L03': 'البلد ومكان السكن',
  };
  return titles[lesson.source.sourceLessonId] ?? lesson.subtitle;
}

export function lessonCompletionWins(lesson: SceneLessonDefinition): readonly string[] {
  const wins: Record<string, readonly string[]> = {
    'U1-L01': [
      'إلقاء التحية على شخص جديد',
      'التعريف بنفسك وذكر اسمك',
      'السؤال عن الاسم والتعامل مع How are you?',
    ],
    'U1-L02': [
      'فهم واستخدام أرقام مناسبة للسن',
      'السؤال عن السن بطريقة بسيطة',
      'قول سنك أو سن افتراضي في محادثة قصيرة',
    ],
    'U1-L03': [
      'السؤال عن بلد الشخص',
      'قول أنت منين باستخدام I’m from…',
      'قول مكان سكنك باستخدام I live in…',
    ],
  };
  return wins[lesson.source.sourceLessonId] ?? [lesson.performance];
}
