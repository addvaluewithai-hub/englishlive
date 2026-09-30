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

function objectValue(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

export function sanitizeSpeakingDifficulty(value: unknown) {
  return typeof value === 'string' && validDifficulties.has(value)
    ? value as 'easier' | 'recommended' | 'challenge'
    : 'recommended';
}

export function sanitizeSpeakingScenarioSnapshot(value: unknown): SpeakingScenarioSnapshot {
  const row = objectValue(value);
  const curriculumLevel = stringValue(row.curriculumLevel, 24);
  const lessonCode = stringValue(row.lessonCode, 40);
  const targetLanguageEn = stringArray(row.targetLanguageEn, 32, 180);
  const correctionFocusEn = stringArray(row.correctionFocusEn, 16, 180);
  const boundariesEn = stringArray(row.boundariesEn, 16, 260);
  return {
    titleAr: stringValue(row.titleAr, 120),
    learnerRoleAr: stringValue(row.learnerRoleAr, 100),
    aiRoleAr: stringValue(row.aiRoleAr, 100),
    goalAr: stringValue(row.goalAr, 240),
    usesAr: stringArray(row.usesAr, 12, 100),
    curriculumRefs: stringArray(row.curriculumRefs, 24, 100),
    interactionFocus: stringArray(row.interactionFocus, 18, 64),
    ...(curriculumLevel ? { curriculumLevel } : {}),
    ...(lessonCode ? { lessonCode } : {}),
    ...(targetLanguageEn.length ? { targetLanguageEn } : {}),
    ...(correctionFocusEn.length ? { correctionFocusEn } : {}),
    ...(boundariesEn.length ? { boundariesEn } : {}),
  };
}

export function sanitizeSpeakingTranscript(value: unknown): SpeakingTurn[] {
  const source = typeof value === 'string'
    ? (() => { try { return JSON.parse(value) as unknown; } catch { return []; } })()
    : value;
  if (!Array.isArray(source)) return [];
  const result: SpeakingTurn[] = [];
  for (const item of source.slice(0, 240)) {
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
  const numeric = typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value)
    : Number(value ?? 0);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(Math.round(numeric), 60 * 60 * 4)) : 0;
}

export function mapSpeakingSessionRow(row: Record<string, unknown>): SpeakingCloudSession {
  const snapshot = sanitizeSpeakingScenarioSnapshot(row.resolved_profile);
  const metadata = objectValue(row.metadata);
  const analysisStatus = row.analysis_status === 'complete'
    ? 'complete'
    : row.analysis_status === 'failed'
      ? 'error'
      : 'pending';
  return {
    id: String(row.id ?? ''),
    scenarioId: stringValue(metadata.scenarioId, 160, stringValue(row.application_id, 160)),
    difficulty: sanitizeSpeakingDifficulty(row.requested_difficulty),
    characterSlug: stringValue(row.character_slug, 120),
    characterName: stringValue(row.character_name, 120, 'Otti'),
    startedAt: String(row.started_at ?? ''),
    endedAt: row.ended_at ? String(row.ended_at) : null,
    durationSeconds: clampSpeakingDuration(row.duration_seconds),
    status: row.status === 'completed' || row.status === 'abandoned' || row.status === 'error' ? row.status : 'active',
    scenarioSnapshot: snapshot,
    transcript: sanitizeSpeakingTranscript(row.transcript),
    analysis: row.analysis && typeof row.analysis === 'object' ? row.analysis as SpeakingCloudSession['analysis'] : null,
    analysisStatus,
    analysisModel: stringValue(metadata.analysisModel, 120) || null,
  };
}
