import type { SceneLessonDefinition } from '../lessonScenes/types';
import type { TeachingBeat } from '../lessonScenes/b1/teacherLabScript';
import { B1_L02_TEACHER_BOARD_PILOT } from '../lessonScenes/b1/teacherBoardPilot';
import { B1_TEACHER_LAB_SCRIPT } from '../lessonScenes/b1/teacherLabScript';

/**
 * Registry for deterministic classroom QA, NOT published lesson enrollment.
 * Each new authored lesson registers its real data and final speaking scene.
 * The browser fixture and Chromium screenshot runner read this same registry;
 * no per-lesson scene/beat array may be handwritten in the runner.
 */
export interface LessonQaRegistration {
  lesson: SceneLessonDefinition;
  beats: Readonly<Record<string, readonly TeachingBeat[]>>;
  finalSpeakingSceneId: string;
  visualKey: string;
}
export const LESSON_QA_REGISTRY: Readonly<Record<string, LessonQaRegistration>> = {
  [B1_L02_TEACHER_BOARD_PILOT.id]: {
    lesson: B1_L02_TEACHER_BOARD_PILOT,
    beats: B1_TEACHER_LAB_SCRIPT,
    finalSpeakingSceneId: 'fresh-transfer',
    visualKey: 'b1-relationship-journey',
  },
};

export function getLessonQaRegistration(lessonId: string): LessonQaRegistration {
  const record = LESSON_QA_REGISTRY[lessonId];
  if (!record) throw new Error('No authored QA registration for lesson: ' + lessonId);
  assertQaRegistration(record);
  return record;
}

export function assertQaRegistration(record: LessonQaRegistration): void {
  const { lesson, beats, finalSpeakingSceneId, visualKey } = record;
  if (!visualKey) throw new Error(lesson.id + ': missing bespoke lesson visual registration');
  if (!lesson.scenes.length) throw new Error(lesson.id + ': empty lesson');
  const ids = lesson.scenes.map(scene => scene.id);
  if (new Set(ids).size !== ids.length) throw new Error(lesson.id + ': duplicate scene ID');
  if (ids.at(-1) !== finalSpeakingSceneId) throw new Error(lesson.id + ': final speaking must be last');
  if (lesson.scenes.at(-1)?.activity) throw new Error(lesson.id + ': final speaking must not be multiple choice');
  for (const scene of lesson.scenes) {
    const authored = beats[scene.id];
    if (!authored?.length) throw new Error(lesson.id + '/' + scene.id + ': no authored beats');
    const beatIds = authored.map(beat => beat.id);
    if (new Set(beatIds).size !== beatIds.length) throw new Error(scene.id + ': duplicate beat');
    for (const beat of authored) if (!beat.line?.trim()) throw new Error(scene.id + '/' + beat.id + ': empty narration');
    if (scene.activity) {
      const choices=scene.activity.options;
      if (choices.length < 2 || !choices.some(x=>x.id===scene.activity?.correctOptionId))
        throw new Error(scene.id + ': invalid deterministic MC answer key');
    }
  }
  if (Object.keys(beats).some(id=>!ids.includes(id))) throw new Error(lesson.id + ': orphan script scene');
}
