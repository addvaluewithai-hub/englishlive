import { B1_UNIT_1 } from './b1/unit1';
import type {
  CourseDefinition,
  CourseLessonDefinition,
  CourseLevelDefinition,
  CourseUnitDefinition,
} from './types';

export const ENGLISH_LIVE_COURSE: CourseDefinition = {
  id: 'englishlive-speaking-course',
  title: 'EnglishLive Speaking Course',
  levels: [
    {
      id: 'b1',
      title: 'B1 — Connected familiar independence',
      promise: 'Speak independently in familiar life, travel, work and personal-interest situations using connected language.',
      units: [B1_UNIT_1],
    },
  ],
};

export const B1_LEVEL = ENGLISH_LIVE_COURSE.levels[0] as CourseLevelDefinition;

export function listCourseUnits(levelId: 'b1' | 'b2' = 'b1'): readonly CourseUnitDefinition[] {
  return ENGLISH_LIVE_COURSE.levels.find((level) => level.id === levelId)?.units ?? [];
}

export function listCourseLessons(levelId: 'b1' | 'b2' = 'b1'): CourseLessonDefinition[] {
  return listCourseUnits(levelId).flatMap((unit) => [...unit.lessons]);
}

export function getCourseUnit(unitId: string | null | undefined): CourseUnitDefinition | undefined {
  return ENGLISH_LIVE_COURSE.levels.flatMap((level) => level.units).find((unit) => unit.id === unitId);
}

export function getCourseLesson(lessonId: string | null | undefined): CourseLessonDefinition | undefined {
  if (!lessonId) return undefined;
  return ENGLISH_LIVE_COURSE.levels
    .flatMap((level) => level.units)
    .flatMap((unit) => unit.lessons)
    .find((lesson) => lesson.id === lessonId);
}

export function getRequiredCourseLesson(lessonId: string | null | undefined): CourseLessonDefinition {
  return getCourseLesson(lessonId) ?? B1_UNIT_1.lessons[0];
}

export function getNextLesson(lessonId: string): CourseLessonDefinition | undefined {
  const lessons = listCourseLessons('b1');
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  return index >= 0 ? lessons[index + 1] : undefined;
}
