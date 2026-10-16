import type { SceneLessonDefinition } from '../lessonScenes/types';
import type { TeachingBeat } from '../lessonScenes/b1/teacherLabScript';
import { B1_L02_TEACHER_BOARD_PILOT } from '../lessonScenes/b1/teacherBoardPilot';
import { B1_TEACHER_LAB_SCRIPT } from '../lessonScenes/b1/teacherLabScript';
import { A1_U1_L01_LISTENING_PILOT } from '../lessonScenes/a1/listeningTeacherPilot';
import { A1_LISTENING_BEATS } from '../lessonScenes/a1/listeningTeacherScript';
import { A1_U1_L01_AUDIO, validateLessonAudio } from '../lessonScenes/a1/listeningAudioPilot';

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
  audio?: typeof A1_U1_L01_AUDIO;
}
export const LESSON_QA_REGISTRY: Readonly<Record<string, LessonQaRegistration>> = {
  [A1_U1_L01_LISTENING_PILOT.id]: {
    lesson:A1_U1_L01_LISTENING_PILOT,
    beats:A1_LISTENING_BEATS,
    finalSpeakingSceneId:'fresh-meeting',
    visualKey:'a1-first-meeting',
    audio:A1_U1_L01_AUDIO,
  },
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
  if(record.audio) validateLessonAudio(record.audio);
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
    for (const beat of authored) {
      if (!beat.line?.trim()) throw new Error(scene.id + '/' + beat.id + ': empty narration');
      if (beat.audioClipId) {
        if (!record.audio) throw new Error('Listening beat without registered audio manifest: '+beat.id);
        if (!record.audio.clips.some(c=>c.id===beat.audioClipId)) throw new Error('Missing clip ID: '+beat.audioClipId);
      }
    }
    if (scene.id !== finalSpeakingSceneId && !scene.activity) {
      throw new Error(scene.id + ': this classroom QA version requires an authored MC checkpoint for each teaching scene; split or extend the renderer explicitly');
    }
    if (scene.activity) {
      const choices=scene.activity.options;
      if (choices.length < 2 || !choices.some(x=>x.id===scene.activity?.correctOptionId))
        throw new Error(scene.id + ': invalid deterministic MC answer key');
    }
  }
  if (Object.keys(beats).some(id=>!ids.includes(id))) throw new Error(lesson.id + ': orphan script scene');
}

export type QaFrameState = 'teaching' | 'audio-loading' | 'audio-playing' | 'question' | 'correct-feedback' | 'wrong-feedback'
  | 'speaking-listening' | 'speaking-otti' | 'complete';
export interface QaFrameCase { scene: string; beat: string; state: QaFrameState; }

/** No handwritten scenario lists in Playwright. This exhausts the actual authored data. */
export function buildLessonQaCases(record: LessonQaRegistration): QaFrameCase[] {
  assertQaRegistration(record);
  const cases:QaFrameCase[]=[];
  for(const scene of record.lesson.scenes) {
    const ids=record.beats[scene.id].map(beat=>beat.id);
    for (const beat of ids) {
      cases.push({scene:scene.id,beat,state:scene.id===record.finalSpeakingSceneId
        ? 'speaking-listening' : 'teaching'});
      if(record.beats[scene.id].find(b=>b.id===beat)?.audioClipId) {
        cases.push({scene:scene.id,beat,state:'audio-loading'});
        cases.push({scene:scene.id,beat,state:'audio-playing'});
      }
    }
    if(scene.activity) {
      const beat=ids.at(-1)!;
      for(const state of ['question','correct-feedback','wrong-feedback'] as const)
        cases.push({scene:scene.id,beat,state});
    }
  }
  const finalBeat=record.beats[record.finalSpeakingSceneId].at(-1)!.id;
  cases.push({scene:record.finalSpeakingSceneId,beat:finalBeat,state:'speaking-otti'});
  cases.push({scene:record.finalSpeakingSceneId,beat:finalBeat,state:'complete'});
  if(new Set(cases.map(x=>[x.scene,x.beat,x.state].join('|'))).size!==cases.length)
    throw new Error(record.lesson.id+': repeated case in QA fixture');
  return cases;
}
