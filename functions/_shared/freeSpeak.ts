import type {
  FreeSpeakAnalysisStatus,
  FreeSpeakCloudSession,
  FreeSpeakRecap,
  FreeSpeakSessionStatus,
  FreeSpeakTurn,
} from '../../src/freeSpeak/types';

export const validFreeSpeakModes = new Set(['just-chat', 'work', 'travel', 'interview']);

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function nullableString(value: unknown) {
  return typeof value === 'string' && value.length ? value : null;
}

export function sanitizeTranscript(value: unknown): FreeSpeakTurn[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 600).flatMap((candidate, index) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const item = candidate as Record<string, unknown>;
    const speaker = item.speaker === 'learner' || item.speaker === 'teacher' ? item.speaker : null;
    const text = typeof item.text === 'string' ? item.text.trim().slice(0, 8_000) : '';
    if (!speaker || !text) return [];
    const atMs = typeof item.atMs === 'number' && Number.isFinite(item.atMs)
      ? Math.max(0, Math.round(item.atMs))
      : index * 1_000;
    return [{
      id: typeof item.id === 'string' && item.id.trim() ? item.id.trim().slice(0, 80) : `${speaker}-${index}`,
      speaker,
      text,
      atMs,
    } satisfies FreeSpeakTurn];
  });
}

export function clampDuration(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(4 * 60 * 60, Math.max(0, Math.round(value)));
}

export function mapFreeSpeakSessionRow(row: Record<string, unknown>): FreeSpeakCloudSession {
  const transcript = Array.isArray(row.transcript) ? sanitizeTranscript(row.transcript) : [];
  const analysis = row.analysis && typeof row.analysis === 'object' && !Array.isArray(row.analysis)
    ? row.analysis as FreeSpeakRecap
    : null;
  const status = ['active', 'completed', 'abandoned', 'error'].includes(stringValue(row.status))
    ? stringValue(row.status) as FreeSpeakSessionStatus
    : 'active';
  const analysisStatus = ['pending', 'complete', 'error'].includes(stringValue(row.analysis_status))
    ? stringValue(row.analysis_status) as FreeSpeakAnalysisStatus
    : 'pending';

  return {
    id: stringValue(row.id),
    modeId: stringValue(row.mode_id, 'just-chat'),
    characterSlug: stringValue(row.character_slug, 'otti'),
    characterName: stringValue(row.character_name, stringValue(row.character_slug, 'Otti')),
    startedAt: stringValue(row.started_at),
    endedAt: nullableString(row.ended_at),
    durationSeconds: typeof row.duration_seconds === 'number' ? row.duration_seconds : Number(row.duration_seconds ?? 0) || 0,
    status,
    transcript,
    analysis,
    analysisStatus,
    analysisModel: nullableString(row.analysis_model),
  };
}

export const freeSpeakSessionSelect = `
  select
    fs.id::text as id,
    fs.mode_id,
    fs.status,
    fs.started_at,
    fs.ended_at,
    fs.duration_seconds,
    fs.transcript,
    fs.analysis,
    fs.analysis_status,
    fs.analysis_model,
    c.slug as character_slug,
    coalesce(cr.content->>'displayName', c.slug) as character_name
  from free_speak_sessions fs
  join characters c on c.id = fs.character_id
  join character_revisions cr on cr.id = fs.character_revision_id
`;
