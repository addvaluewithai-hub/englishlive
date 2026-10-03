import { A1_LEARN_V2_LESSONS } from './a1Lessons';
import type { LearnV2Lesson } from './catalog';

export interface LearnRoadmapUnit {
  id: string;
  levelId: string;
  order: number;
  titleEn: string;
  titleAr: string;
  descriptionAr: string;
  plannedLessonCount: number;
  lessons: LearnV2Lesson[];
}

export interface LearnRoadmapLevel {
  id: 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';
  code: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  titleAr: string;
  descriptionAr: string;
  tone: 'pink' | 'peach' | 'blue' | 'purple' | 'mint' | 'sky';
  plannedLessonCount: number;
  units: LearnRoadmapUnit[];
}

function a1Lessons(unit: number) {
  return A1_LEARN_V2_LESSONS.filter((lesson) => lesson.unit === unit).sort((a, b) => a.lesson - b.lesson);
}

const A1_UNITS: LearnRoadmapUnit[] = [
  {
    id: 'a1-u1-first-contact',
    levelId: 'a1',
    order: 1,
    titleEn: 'First Contact: Me and You',
    titleAr: 'التعارف والبيانات الشخصية',
    descriptionAr: 'ابدأ أول محادثاتك: التحية، الاسم، السن، البلد، السكن، الشغل وبيانات التواصل البسيطة.',
    plannedLessonCount: 7,
    lessons: a1Lessons(1),
  },
  {
    id: 'a1-u2-people-around-me',
    levelId: 'a1',
    order: 2,
    titleEn: 'People Around Me',
    titleAr: 'الناس من حولي',
    descriptionAr: 'اتكلم عن العيلة والناس، افهم أوصاف بسيطة، واسأل عن شخص وتجمع معلومات عنه.',
    plannedLessonCount: 6,
    lessons: a1Lessons(2),
  },
  {
    id: 'a1-u3-home-things-location',
    levelId: 'a1',
    order: 3,
    titleEn: 'Home, Things, and Where They Are',
    titleAr: 'البيت والأشياء والمكان',
    descriptionAr: 'الأشياء اليومية، البيت، والمكان ووصف أين توجد الأشياء.',
    plannedLessonCount: 6,
    lessons: [],
  },
  {
    id: 'a1-u4-day-time-now',
    levelId: 'a1',
    order: 4,
    titleEn: 'My Day, My Time, What’s Happening',
    titleAr: 'يومي ووقتي وما يحدث الآن',
    descriptionAr: 'الروتين والوقت والحديث عما يحدث الآن.',
    plannedLessonCount: 7,
    lessons: [],
  },
  {
    id: 'a1-u5-needs-food-shopping',
    levelId: 'a1',
    order: 5,
    titleEn: 'Needs, Food, Shopping, and Simple Service',
    titleAr: 'الاحتياجات والطعام والتسوق',
    descriptionAr: 'اطلب احتياجات بسيطة وتعامل مع الطعام والتسوق والخدمة اليومية.',
    plannedLessonCount: 7,
    lessons: [],
  },
  {
    id: 'a1-u6-town-travel',
    levelId: 'a1',
    order: 6,
    titleEn: 'Around Town and Travelling',
    titleAr: 'في المدينة والسفر',
    descriptionAr: 'أماكن المدينة والاتجاهات ومواقف السفر البسيطة.',
    plannedLessonCount: 7,
    lessons: [],
  },
  {
    id: 'a1-u7-simple-past',
    levelId: 'a1',
    order: 7,
    titleEn: 'Simple Past: Life and Everyday Events',
    titleAr: 'الماضي البسيط وأحداث الحياة',
    descriptionAr: 'احكي عن أحداث بسيطة حصلت قبل كده وافهم قصصًا قصيرة مألوفة.',
    plannedLessonCount: 5,
    lessons: [],
  },
  {
    id: 'a1-u8-opinions-plans',
    levelId: 'a1',
    order: 8,
    titleEn: 'Opinions, Suggestions, Plans, and Arrangements',
    titleAr: 'الآراء والاقتراحات والخطط',
    descriptionAr: 'عبّر عن رأي بسيط واعمل اقتراحات وخطط وترتيبات يومية.',
    plannedLessonCount: 6,
    lessons: [],
  },
  {
    id: 'a1-u9-practical-texts',
    levelId: 'a1',
    order: 9,
    titleEn: 'Read, Follow, and Write: Practical Texts',
    titleAr: 'القراءة والكتابة العملية',
    descriptionAr: 'افهم واكتب رسائل ونصوص قصيرة تخدم مواقف الحياة اليومية.',
    plannedLessonCount: 6,
    lessons: [],
  },
  {
    id: 'a1-u10-exit',
    levelId: 'a1',
    order: 10,
    titleEn: 'A1 Integration and Exit Evidence',
    titleAr: 'تطبيق ومراجعة مستوى A1',
    descriptionAr: 'اربط اللي اتعلمته في مواقف جديدة قبل الانتقال للمستوى التالي.',
    plannedLessonCount: 5,
    lessons: [],
  },
];

export const LEARN_ROADMAP_LEVELS: LearnRoadmapLevel[] = [
  {
    id: 'a1',
    code: 'A1',
    titleAr: 'المبتدئ',
    descriptionAr: 'أساسيات التواصل في المواقف اليومية: التعارف، الناس، البيت، الوقت، التسوق، السفر والمواقف العملية.',
    tone: 'pink',
    plannedLessonCount: 62,
    units: A1_UNITS,
  },
  {
    id: 'a2', code: 'A2', titleAr: 'ما قبل المتوسط',
    descriptionAr: 'بناء ثقتك في التحدث وفهم المواقف اليومية الأكثر تنوعًا.', tone: 'peach', plannedLessonCount: 0, units: [],
  },
  {
    id: 'b1', code: 'B1', titleAr: 'المتوسط',
    descriptionAr: 'التواصل بثقة في مواقف الحياة والعمل والدراسة.', tone: 'blue', plannedLessonCount: 0, units: [],
  },
  {
    id: 'b2', code: 'B2', titleAr: 'ما فوق المتوسط',
    descriptionAr: 'التعبير عن الأفكار المعقدة ومناقشة مواضيع أوسع بوضوح وسلاسة.', tone: 'purple', plannedLessonCount: 0, units: [],
  },
  {
    id: 'c1', code: 'C1', titleAr: 'المتقدم',
    descriptionAr: 'التواصل بطلاقة ومرونة في المواقف المهنية والأكاديمية والاجتماعية.', tone: 'mint', plannedLessonCount: 0, units: [],
  },
  {
    id: 'c2', code: 'C2', titleAr: 'المتمكن',
    descriptionAr: 'فهم وإتقان اللغة في سياقات واسعة بدقة وطلاقة عالية.', tone: 'sky', plannedLessonCount: 0, units: [],
  },
];

export function learnRoadmapLevelById(levelId?: string) {
  return LEARN_ROADMAP_LEVELS.find((level) => level.id === levelId?.toLowerCase());
}

export function learnRoadmapUnitById(unitId?: string) {
  if (!unitId) return undefined;
  for (const level of LEARN_ROADMAP_LEVELS) {
    const unit = level.units.find((candidate) => candidate.id === unitId);
    if (unit) return { level, unit };
  }
  return undefined;
}

export function availableLearnLessons(level: LearnRoadmapLevel) {
  return level.units.flatMap((unit) => unit.lessons);
}

export function learnUnitForLesson(lesson: LearnV2Lesson) {
  return LEARN_ROADMAP_LEVELS
    .find((level) => level.code === lesson.level)
    ?.units.find((unit) => unit.order === lesson.unit);
}
