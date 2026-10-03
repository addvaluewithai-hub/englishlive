const STORAGE_KEY = 'englotti:learn-completed-v1';
const LEGACY_STORAGE_KEY = 'englotti:speaking-a1-pilot-completed-v3';

function normalizeLessonId(value: string) {
  return value.startsWith('learn-v2-') ? value.slice('learn-v2-'.length) : value;
}

function readStored(key: string) {
  if (typeof window === 'undefined') return [] as string[];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string').map(normalizeLessonId)
      : [];
  } catch {
    return [];
  }
}

export function readLearnLessonProgress() {
  const completed = new Set([...readStored(STORAGE_KEY), ...readStored(LEGACY_STORAGE_KEY)]);
  return [...completed];
}

export function markLearnLessonComplete(lessonOrScenarioId: string, evidenceVerified = false) {
  if (typeof window === 'undefined' || !evidenceVerified) return;
  const lessonId = normalizeLessonId(lessonOrScenarioId);
  if (!/^[abc][12]-u\d+-l\d+$/i.test(lessonId)) return;
  const completed = new Set(readLearnLessonProgress());
  completed.add(lessonId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
}

export function resetLearnLessonProgress() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

// Compatibility aliases while older modules are being retired.
export const readA1SpeakingPilotProgress = readLearnLessonProgress;
export const markA1SpeakingPilotLessonComplete = markLearnLessonComplete;
export const resetA1SpeakingPilotProgress = resetLearnLessonProgress;
