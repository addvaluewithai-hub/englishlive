import { A1_U1_L01_SCENE_LESSON } from './a1/u1l1';
import type { SceneLessonDefinition } from './types';

export const SCENE_LESSON_PILOT = A1_U1_L01_SCENE_LESSON;

const SCENE_LESSONS: readonly SceneLessonDefinition[] = [SCENE_LESSON_PILOT];

export function getSceneLesson(lessonId: string | null | undefined): SceneLessonDefinition | undefined {
  if (!lessonId) return undefined;
  return SCENE_LESSONS.find((lesson) => lesson.id === lessonId);
}

export function getRequiredSceneLesson(lessonId: string | null | undefined): SceneLessonDefinition {
  return getSceneLesson(lessonId) ?? SCENE_LESSON_PILOT;
}
