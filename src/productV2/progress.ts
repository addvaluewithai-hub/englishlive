import type { ProductUnitDefinition } from './course';

const STORAGE_KEY = 'englishlive.product-course.v1';
const COMPLETION_HANDOFF_KEY = 'englishlive.product-course.pending-completion';

// Temporary pilot bypass for the active B1 lesson experiment. Keep progression
// rules unchanged everywhere else; this only lets testers enter L02 directly
// even if local completion state for L01 is stale or missing.
const PILOT_ALWAYS_UNLOCKED_LESSONS = new Set([
  'b1-u1-l02-keep-conversation-going',
]);

const PILOT_UNLOCK_MARKER_AT = '2000-01-01T00:00:00.000Z';

export interface ProductLessonProgress {
  lessonId: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  attemptCount?: number;
}

export interface ProductCourseProgress {
  version: 1;
  lessons: Record<string, ProductLessonProgress>;
  updatedAt: string;
}

function exposePilotUnlockedLessons(progress: ProductCourseProgress): ProductCourseProgress {
  const lessons = { ...progress.lessons };
  for (const lessonId of PILOT_ALWAYS_UNLOCKED_LESSONS) {
    const previous = lessons[lessonId];
    if (previous?.startedAt || previous?.completedAt) continue;
    lessons[lessonId] = {
      ...previous,
      lessonId,
      startedAt: PILOT_UNLOCK_MARKER_AT,
      status: 'in_progress',
      updatedAt: previous?.updatedAt ?? PILOT_UNLOCK_MARKER_AT,
    };
  }
  return { ...progress, lessons };
}

export function emptyProductCourseProgress(): ProductCourseProgress {
  return { version: 1, lessons: {}, updatedAt: new Date().toISOString() };
}

export function readProductCourseProgress(): ProductCourseProgress {
  if (typeof window === 'undefined') return exposePilotUnlockedLessons(emptyProductCourseProgress());
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return exposePilotUnlockedLessons(emptyProductCourseProgress());
    const parsed = JSON.parse(raw) as Partial<ProductCourseProgress>;
    if (parsed.version !== 1 || !parsed.lessons || typeof parsed.lessons !== 'object') {
      return exposePilotUnlockedLessons(emptyProductCourseProgress());
    }
    return exposePilotUnlockedLessons({
      version: 1,
      lessons: parsed.lessons,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    });
  } catch {
    return exposePilotUnlockedLessons(emptyProductCourseProgress());
  }
}

function save(progress: ProductCourseProgress) {
  if (typeof window === 'undefined') return;
  progress.updatedAt = new Date().toISOString();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function replaceProductCourseProgressCache(progress: ProductCourseProgress | null) {
  if (typeof window === 'undefined') return;
  if (!progress) {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(COMPLETION_HANDOFF_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }));
}

export function markProductLessonStarted(lessonId: string) {
  const progress = readProductCourseProgress();
  const previous = progress.lessons[lessonId];
  progress.lessons[lessonId] = {
    lessonId,
    startedAt: previous?.startedAt ?? new Date().toISOString(),
    ...(previous?.completedAt ? { completedAt: previous.completedAt } : {}),
    status: previous?.completedAt ? 'completed' : 'in_progress',
    attemptCount: previous?.attemptCount,
    updatedAt: new Date().toISOString(),
  };
  save(progress);
  return progress;
}

export function markProductLessonCompleted(lessonId: string) {
  const progress = readProductCourseProgress();
  const previous = progress.lessons[lessonId];
  progress.lessons[lessonId] = {
    lessonId,
    startedAt: previous?.startedAt ?? new Date().toISOString(),
    completedAt: previous?.completedAt ?? new Date().toISOString(),
    status: 'completed',
    attemptCount: previous?.attemptCount,
    updatedAt: new Date().toISOString(),
  };
  save(progress);
  if (typeof window !== 'undefined') window.sessionStorage.setItem(COMPLETION_HANDOFF_KEY, lessonId);
  return progress;
}

export function takePendingProductLessonCompletion() {
  if (typeof window === 'undefined') return null;
  const lessonId = window.sessionStorage.getItem(COMPLETION_HANDOFF_KEY);
  if (lessonId) window.sessionStorage.removeItem(COMPLETION_HANDOFF_KEY);
  return lessonId;
}

export function productUnitProgress(unit: ProductUnitDefinition, progress = readProductCourseProgress()) {
  const completedCount = unit.lessons.filter((lesson) => progress.lessons[lesson.id]?.completedAt).length;
  const nextLesson = unit.lessons.find((lesson) => !progress.lessons[lesson.id]?.completedAt) ?? unit.lessons.at(-1)!;
  return {
    completedCount,
    totalCount: unit.lessons.length,
    nextLesson,
    unitComplete: completedCount === unit.lessons.length,
  };
}

export function isProductLessonUnlocked(unit: ProductUnitDefinition, lessonId: string, progress = readProductCourseProgress()) {
  if (PILOT_ALWAYS_UNLOCKED_LESSONS.has(lessonId)) return true;
  const index = unit.lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index <= 0) return true;
  if (progress.lessons[lessonId]?.completedAt || progress.lessons[lessonId]?.startedAt) return true;
  return Boolean(progress.lessons[unit.lessons[index - 1].id]?.completedAt);
}
