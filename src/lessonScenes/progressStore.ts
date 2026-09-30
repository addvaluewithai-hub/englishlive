import type { SceneLessonState } from './types';

export type LessonSpeakingPace = 'relaxed' | 'normal' | 'quick';

export interface StoredSceneLessonCheckpoint {
  version: 1;
  lessonId: string;
  state: SceneLessonState;
  knownItemIds: string[];
  pace: LessonSpeakingPace;
  updatedAt: string;
}

const STORAGE_PREFIX = 'englotti.scene-lesson-checkpoint.v1:';

function storageKey(lessonId: string) {
  return `${STORAGE_PREFIX}${lessonId}`;
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function readSceneLessonCheckpoint(lessonId: string): StoredSceneLessonCheckpoint | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(lessonId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSceneLessonCheckpoint>;
    if (parsed.version !== 1 || parsed.lessonId !== lessonId || !parsed.state || parsed.state.lessonId !== lessonId) return null;
    const pace: LessonSpeakingPace = parsed.pace === 'normal' || parsed.pace === 'quick' ? parsed.pace : 'relaxed';
    return {
      version: 1,
      lessonId,
      state: parsed.state,
      knownItemIds: Array.isArray(parsed.knownItemIds)
        ? parsed.knownItemIds.filter((item): item is string => typeof item === 'string')
        : [],
      pace,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeSceneLessonCheckpoint(input: Omit<StoredSceneLessonCheckpoint, 'version' | 'updatedAt'>) {
  if (!canUseStorage()) return;
  const checkpoint: StoredSceneLessonCheckpoint = {
    ...input,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(storageKey(input.lessonId), JSON.stringify(checkpoint));
  } catch {
    // Local persistence is a resilience layer; the lesson should keep running if storage is unavailable.
  }
}

export function clearSceneLessonCheckpoint(lessonId: string) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(storageKey(lessonId));
  } catch {
    // Ignore storage failures.
  }
}
