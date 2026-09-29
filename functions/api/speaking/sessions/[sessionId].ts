import { authenticateRequest } from '../../../_shared/auth';
import { getSql, jsonHeaders, jsonResponse, type NeonEnv } from '../../../_shared/neon';
import {
  clampSpeakingDuration,
  mapSpeakingSessionRow,
  sanitizeSpeakingTranscript,
} from '../../../_shared/speaking';
import { analyzeSpeakingTranscript, type SpeakingAnalysisEnv } from '../../../_shared/speakingAnalysis';

interface SpeakingEnv extends NeonEnv, SpeakingAnalysisEnv {}

interface PagesContext {
  request: Request;
  env: SpeakingEnv;
  params: { sessionId?: string | string[] };
}

function sessionIdFrom(params: PagesContext['params']) {
  const value = params.sessionId;
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

async function loadOwnedSession(sql: ReturnType<typeof getSql>, userId: string, sessionId: string) {
  const rows = await sql`
    select
      ss.id::text as id,
      ss.scenario_id,
      ss.difficulty,
      ss.status,
      ss.started_at,
      ss.ended_at,
      ss.duration_seconds,
      ss.scenario_snapshot,
      ss.transcript,
      ss.analysis,
      ss.analysis_status,
      ss.analysis_model,
      c.slug as character_slug,
      coalesce(cr.content->>'displayName', c.slug) as character_name
    from speaking_sessions ss
    join characters c on c.id = ss.character_id
    join character_revisions cr on cr.id = ss.character_revision_id
    where ss.id = ${sessionId}::uuid
      and ss.user_id = ${userId}
    limit 1
  `;
  return rows[0] as Record<string, unknown> | undefined;
}

async function persistEvidence(
  sql: ReturnType<typeof getSql>,
  userId: string,
  sessionId: string,
  evidence: Array<{ skillId: string; outcome: string; evidenceAr: string; learnerExcerpt: string | null }>,
) {
  for (const item of evidence) {
    const evidenceJson = JSON.stringify({ evidenceAr: item.evidenceAr, learnerExcerpt: item.learnerExcerpt });
    await sql`
      insert into speaking_session_evidence (session_id, user_id, skill_id, outcome, evidence)
      values (${sessionId}::uuid, ${userId}, ${item.skillId}, ${item.outcome}, ${evidenceJson}::jsonb)
      on conflict (session_id, skill_id) do update set
        outcome = excluded.outcome,
        evidence = excluded.evidence,
        created_at = now()
    `;
  }
}

async function runAnalysis(
  sql: ReturnType<typeof getSql>,
  env: SpeakingEnv,
  userId: string,
  sessionId: string,
) {
  const row = await loadOwnedSession(sql, userId, sessionId);
  if (!row) return null;
  const session = mapSpeakingSessionRow(row);
  if (!session.transcript.length) {
    await sql`
      update speaking_sessions
      set analysis_status = 'error', updated_at = now()
      where id = ${sessionId}::uuid and user_id = ${userId}
    `;
    const updated = await loadOwnedSession(sql, userId, sessionId);
    return {
      session: updated ? mapSpeakingSessionRow(updated) : session,
      error: 'Conversation transcript is empty.',
    };
  }

  try {
    const result = await analyzeSpeakingTranscript(env, {
      scenarioId: session.scenarioId,
      scenarioTitleAr: session.scenarioSnapshot.titleAr,
      goalAr: session.scenarioSnapshot.goalAr,
      difficulty: session.difficulty,
      characterName: session.characterName,
      interactionFocus: session.scenarioSnapshot.interactionFocus,
      durationSeconds: session.durationSeconds,
      transcript: session.transcript,
    });
    const analysisJson = JSON.stringify(result.recap);
    await sql`
      update speaking_sessions
      set
        analysis = ${analysisJson}::jsonb,
        analysis_status = 'complete',
        analysis_model = ${result.model},
        updated_at = now()
      where id = ${sessionId}::uuid and user_id = ${userId}
    `;
    await persistEvidence(sql, userId, sessionId, result.recap.evidence);
  } catch (reason) {
    console.error('[speaking/session:analysis]', reason);
    await sql`
      update speaking_sessions
      set analysis_status = 'error', updated_at = now()
      where id = ${sessionId}::uuid and user_id = ${userId}
    `;
    const updated = await loadOwnedSession(sql, userId, sessionId);
    return {
      session: updated ? mapSpeakingSessionRow(updated) : session,
      error: reason instanceof Error ? reason.message : 'Gemini analysis failed.',
    };
  }

  const updated = await loadOwnedSession(sql, userId, sessionId);
  return updated ? { session: mapSpeakingSessionRow(updated), error: null } : null;
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: jsonHeaders });

export const onRequestGet = async ({ request, env, params }: PagesContext) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized.' }, 401);
    const sessionId = sessionIdFrom(params);
    if (!sessionId) return jsonResponse({ error: 'sessionId is required.' }, 400);
    const row = await loadOwnedSession(getSql(env), auth.userId, sessionId);
    if (!row) return jsonResponse({ error: 'Speaking session was not found.' }, 404);
    return jsonResponse({ session: mapSpeakingSessionRow(row) });
  } catch (reason) {
    console.error('[speaking/session:get]', reason);
    return jsonResponse({ error: 'Unable to load speaking session.' }, 500);
  }
};

export const onRequestPatch = async ({ request, env, params }: PagesContext) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized.' }, 401);
    const sessionId = sessionIdFrom(params);
    if (!sessionId) return jsonResponse({ error: 'sessionId is required.' }, 400);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const transcript = sanitizeSpeakingTranscript(body?.transcript);
    const durationSeconds = clampSpeakingDuration(body?.durationSeconds);
    const transcriptJson = JSON.stringify(transcript);
    const sql = getSql(env);
    const rows = await sql`
      update speaking_sessions
      set
        transcript = ${transcriptJson}::jsonb,
        duration_seconds = greatest(duration_seconds, ${durationSeconds}),
        updated_at = now()
      where id = ${sessionId}::uuid
        and user_id = ${auth.userId}
        and status = 'active'
      returning id::text as id
    `;
    if (!rows.length) return jsonResponse({ error: 'Active speaking session was not found.' }, 404);
    const row = await loadOwnedSession(sql, auth.userId, sessionId);
    return jsonResponse({ session: mapSpeakingSessionRow(row as Record<string, unknown>) });
  } catch (reason) {
    console.error('[speaking/session:patch]', reason);
    return jsonResponse({ error: 'Unable to save speaking transcript.' }, 500);
  }
};

export const onRequestPut = async ({ request, env, params }: PagesContext) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized.' }, 401);
    const sessionId = sessionIdFrom(params);
    if (!sessionId) return jsonResponse({ error: 'sessionId is required.' }, 400);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const transcript = sanitizeSpeakingTranscript(body?.transcript);
    const durationSeconds = clampSpeakingDuration(body?.durationSeconds);
    const transcriptJson = JSON.stringify(transcript);
    const sql = getSql(env);
    const rows = await sql`
      update speaking_sessions
      set
        transcript = ${transcriptJson}::jsonb,
        duration_seconds = ${durationSeconds},
        status = 'completed',
        ended_at = coalesce(ended_at, now()),
        analysis_status = 'pending',
        updated_at = now()
      where id = ${sessionId}::uuid
        and user_id = ${auth.userId}
      returning id::text as id
    `;
    if (!rows.length) return jsonResponse({ error: 'Speaking session was not found.' }, 404);
    const analysis = await runAnalysis(sql, env, auth.userId, sessionId);
    if (!analysis) return jsonResponse({ error: 'Speaking session was not found.' }, 404);
    if (analysis.error) return jsonResponse({ error: analysis.error, session: analysis.session }, 502);
    return jsonResponse({ session: analysis.session });
  } catch (reason) {
    console.error('[speaking/session:put]', reason);
    return jsonResponse({ error: 'Unable to complete speaking session.' }, 500);
  }
};

export const onRequestPost = async ({ request, env, params }: PagesContext) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized.' }, 401);
    const sessionId = sessionIdFrom(params);
    if (!sessionId) return jsonResponse({ error: 'sessionId is required.' }, 400);
    const sql = getSql(env);
    const rows = await sql`
      update speaking_sessions
      set
        status = case when status = 'active' then 'completed' else status end,
        ended_at = case when status = 'active' then coalesce(ended_at, now()) else ended_at end,
        analysis_status = 'pending',
        updated_at = now()
      where id = ${sessionId}::uuid
        and user_id = ${auth.userId}
      returning id::text as id
    `;
    if (!rows.length) return jsonResponse({ error: 'Speaking session was not found.' }, 404);
    const analysis = await runAnalysis(sql, env, auth.userId, sessionId);
    if (!analysis) return jsonResponse({ error: 'Speaking session was not found.' }, 404);
    if (analysis.error) return jsonResponse({ error: analysis.error, session: analysis.session }, 502);
    return jsonResponse({ session: analysis.session });
  } catch (reason) {
    console.error('[speaking/session:post]', reason);
    return jsonResponse({ error: 'Unable to analyze speaking session.' }, 500);
  }
};
