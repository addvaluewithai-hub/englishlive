const STORAGE_KEY = 'englotti:speaking-a1-pilot-completed-v3';

export function readA1SpeakingPilotProgress() {
  if (typeof window === 'undefined') return [] as string[];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export function markA1SpeakingPilotLessonComplete(lessonId: string, evidenceVerified = false) {
  if (typeof window === 'undefined' || !evidenceVerified) return;
  const completed = new Set(readA1SpeakingPilotProgress());
  completed.add(lessonId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
}

export function resetA1SpeakingPilotProgress() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
