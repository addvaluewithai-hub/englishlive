import type {
  SpeakingCloudSession,
  SpeakingScenarioSnapshot,
  SpeakingTurn,
  SpeakingTurnSpeaker,
} from '../../src/speaking/types';

const validDifficulties = new Set(['easier', 'recommended', 'challenge']);
const validSpeakers = new Set<SpeakingTurnSpeaker>(['learner', 'teacher']);

function stringValue(value: unknown, max: number, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, max) : fallback;
}

function stringArray(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => stringValue(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function sanitizeSpeakingDifficulty(value: unknown) {
  return typeof value === 'string' && validDifficulties.has(value)
    ? value as 'easier' | 'recommended' | 'challenge'
    : 'recommended';
}

export function sanitizeSpeakingScenarioSnapshot(value: unknown): SpeakingScenarioSnapshot {
  const row = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    titleAr: stringValue(row.titleAr, 120),
    learnerRoleAr: stringValue(row.learnerRoleAr, 100),
    aiRoleAr: stringValue(row.aiRoleAr, 100),
    goalAr: stringValue(row.goalAr, 240),
    usesAr: stringArray(row.usesAr, 12, 100),
    curriculumRefs: stringArray(row.curriculumRefs, 24, 100),
    interactionFocus: stringArray(row.interactionFocus, 18, 64),
  };
}

export function sanitizeSpeakingTranscript(value: unknown): SpeakingTurn[] {
  if (!Array.isArray(value)) return [];
  const result: SpeakingTurn[] = [];
  for (const item of value.slice(0, 240)) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const speaker = validSpeakers.has(row.speaker as SpeakingTurnSpeaker)
      ? row.speaker as SpeakingTurnSpeaker
      : null;
    const text = stringValue(row.text, 1800);
    if (!speaker || !text) continue;
    const atMsRaw = typeof row.atMs === 'number' && Number.isFinite(row.atMs) ? row.atMs : 0;
    result.push({
      id: stringValue(row.id, 120, `${speaker}-${result.length + 1}`),
      speaker,
      text,
      atMs: Math.max(0, Math.min(Math.round(atMsRaw), 1000 * 60 * 60 * 4)),
    });
  }
  return result;
}

export function clampSpeakingDuration(value: unknown) {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;
  return Math.max(0, Math.min(numeric, 60 * 60 * 4));
}

export function mapSpeakingSessionRow(row: Record<string, unknown>): SpeakingCloudSession {
  const snapshot = sanitizeSpeakingScenarioSnapshot(row.scenario_snapshot);
  return {
    id: String(row.id ?? ''),
    scenarioId: stringValue(row.scenario_id, 160),
    difficulty: sanitizeSpeakingDifficulty(row.difficulty),
    characterSlug: stringValue(row.character_slug, 120),
    characterName: stringValue(row.character_name, 120, 'Otti'),
    startedAt: String(row.started_at ?? ''),
    endedAt: row.ended_at ? String(row.ended_at) : null,
    durationSeconds: clampSpeakingDuration(row.duration_seconds),
    status: row.status === 'completed' || row.status === 'abandoned' || row.status === 'error' ? row.status : 'active',
    scenarioSnapshot: snapshot,
    transcript: sanitizeSpeakingTranscript(row.transcript),
    analysis: row.analysis && typeof row.analysis === 'object' ? row.analysis as SpeakingCloudSession['analysis'] : null,
    analysisStatus: row.analysis_status === 'complete' || row.analysis_status === 'error' ? row.analysis_status : 'pending',
    analysisModel: row.analysis_model ? String(row.analysis_model) : null,
  };
}
