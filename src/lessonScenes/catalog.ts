import { A1_U1_L01_SCENE_LESSON } from './a1/u1l1';
import { A1_U1_L02_SCENE_LESSON } from './a1/u1l2';
import { A1_U1_L03_SCENE_LESSON } from './a1/u1l3';
import type { SceneLessonDefinition } from './types';

export const SCENE_LESSON_PILOT = A1_U1_L01_SCENE_LESSON;

export const SCENE_LESSON_PILOTS: readonly SceneLessonDefinition[] = [
  A1_U1_L01_SCENE_LESSON,
  A1_U1_L02_SCENE_LESSON,
  A1_U1_L03_SCENE_LESSON,
];

export const SCENE_LESSON_PILOT_IDS = SCENE_LESSON_PILOTS.map((lesson) => lesson.id);

export function getSceneLesson(lessonId: string | null | undefined): SceneLessonDefinition | undefined {
  if (!lessonId) return undefined;
  return SCENE_LESSON_PILOTS.find((lesson) => lesson.id === lessonId);
}

export function getRequiredSceneLesson(lessonId: string | null | undefined): SceneLessonDefinition {
  return getSceneLesson(lessonId) ?? SCENE_LESSON_PILOT;
}
