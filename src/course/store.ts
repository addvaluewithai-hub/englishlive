import type {
  CourseLessonDefinition,
  CourseLessonProgressSnapshot,
  CourseLessonRunObservation,
  CourseLessonRunSummary,
  CourseLessonState,
  CourseProgressState,
} from './types';

const STORAGE_KEY = 'englishlive.course.v1';

export function emptyCourseProgress(): CourseProgressState {
  return {
    version: 1,
    lessonProgress: {},
    lessonStats: {},
    recentRuns: [],
    updatedAt: new Date().toISOString(),
  };
}

export function readCourseProgress(): CourseProgressState {
  if (typeof window === 'undefined') return emptyCourseProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCourseProgress();
    const parsed = JSON.parse(raw) as Partial<CourseProgressState>;
    if (parsed.version !== 1) return emptyCourseProgress();
    return {
      version: 1,
      lessonProgress: parsed.lessonProgress && typeof parsed.lessonProgress === 'object' ? parsed.lessonProgress : {},
      lessonStats: parsed.lessonStats && typeof parsed.lessonStats === 'object' ? parsed.lessonStats : {},
      recentRuns: Array.isArray(parsed.recentRuns) ? parsed.recentRuns.slice(-12) : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return emptyCourseProgress();
  }
}

export function saveCourseProgress(progress: CourseProgressState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }));
}

export function snapshotLessonProgress(
  lesson: CourseLessonDefinition,
  state: CourseLessonState,
): CourseLessonProgressSnapshot {
  return {
    lessonId: lesson.id,
    currentBeatId: state.currentBeatId,
    beatStatuses: Object.fromEntries(
      lesson.beats.map((beat) => [beat.id, state.beats[beat.id]?.status ?? 'pending']),
    ),
    ...(state.completedAt ? { completedAt: state.completedAt } : {}),
    updatedAt: state.updatedAt,
  };
}

export function persistLessonProgress(
  lesson: CourseLessonDefinition,
  state: CourseLessonState,
  options: { preserveCompletedFloor?: boolean } = {},
) {
  const progress = readCourseProgress();
  const previous = progress.lessonProgress[lesson.id];
  if (!(options.preserveCompletedFloor && previous?.completedAt && !state.completedAt)) {
    progress.lessonProgress[lesson.id] = snapshotLessonProgress(lesson, state);
    saveCourseProgress(progress);
  }
  return progress;
}

export function recordLessonRun(input: {
  runId: string;
  lesson: CourseLessonDefinition;
  state: CourseLessonState;
  characterId: string;
  startedAt: string;
  endedAt?: string;
}): CourseProgressState {
  const progress = readCourseProgress();
  if (progress.recentRuns.some((run) => run.runId === input.runId)) return progress;

  const endedAt = input.endedAt ?? new Date().toISOString();
  const observations: CourseLessonRunObservation[] = input.lesson.beats.flatMap((beat) => {
    if (beat.completion !== 'evidence') return [];
    const beatState = input.state.beats[beat.id];
    if (!beatState) return [];
    const attempted = beatState.evidence.length > 0 || beatState.status === 'met';
    if (!attempted) return [];
    return [{
      beatId: beat.id,
      title: beat.title,
      ...(beat.capability ? { capability: beat.capability } : {}),
      outcome: beatState.status === 'met' ? 'met' as const : 'attempted' as const,
    }];
  });

  const summary: CourseLessonRunSummary = {
    runId: input.runId,
    lessonId: input.lesson.id,
    lessonTitle: input.lesson.title,
    unitId: input.lesson.unitId,
    characterId: input.characterId,
    startedAt: input.startedAt,
    endedAt,
    completed: Boolean(input.state.completedAt),
    observations,
  };

  const previousStats = progress.lessonStats[input.lesson.id];
  progress.lessonStats[input.lesson.id] = {
    lessonId: input.lesson.id,
    attemptedRuns: (previousStats?.attemptedRuns ?? 0) + 1,
    completedRuns: (previousStats?.completedRuns ?? 0) + (input.state.completedAt ? 1 : 0),
    lastPractisedAt: endedAt,
  };

  const previousProgress = progress.lessonProgress[input.lesson.id];
  if (!previousProgress?.completedAt || input.state.completedAt) {
    progress.lessonProgress[input.lesson.id] = snapshotLessonProgress(input.lesson, input.state);
  }

  progress.recentRuns = [...progress.recentRuns, summary].slice(-12);
  saveCourseProgress(progress);
  return progress;
}

export function getNextCourseLessonId(lessonIds: readonly string[], progress = readCourseProgress()) {
  return lessonIds.find((lessonId) => !progress.lessonProgress[lessonId]?.completedAt) ?? null;
}

export function resetLessonProgress(lessonId: string) {
  const progress = readCourseProgress();
  delete progress.lessonProgress[lessonId];
  saveCourseProgress(progress);
}
