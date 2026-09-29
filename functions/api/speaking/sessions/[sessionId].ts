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
      ss.application_id,
      ss.requested_difficulty,
      ss.status,
      ss.started_at,
      ss.ended_at,
      ss.duration_seconds,
      ss.resolved_profile,
      ss.transcript,
      ss.analysis,
      ss.analysis_status,
      ss.metadata,
      c.slug as character_slug,
      coalesce(cr.content->>'displayName', c.slug) as character_name
    from speaking_sessions ss
    left join characters c on c.id = ss.character_id
    left join character_revisions cr on cr.id = ss.character_revision_id
    where ss.id = ${sessionId}::uuid
      and ss.user_id = ${userId}
    limit 1
  `;
  return rows[0] as Record<string, unknown> | undefined;
}

function observationResult(outcome: string) {
  if (outcome === 'demonstrated') return 'independent';
  if (outcome === 'emerging') return 'supported';
  return 'not_observed';
}

async function persistEvidence(
  sql: ReturnType<typeof getSql>,
  userId: string,
  sessionId: string,
  evidence: Array<{ skillId: string; outcome: string; evidenceAr: string; learnerExcerpt: string | null }>,
) {
  for (const item of evidence) {
    const capabilities = await sql`
      select id
      from interaction_capabilities
      where slug = ${item.skillId}
        and status = 'active'
      limit 1
    `;
    const capability = capabilities[0] as Record<string, unknown> | undefined;
    if (!capability?.id) continue;

    const metadataJson = JSON.stringify({
      learnerExcerpt: item.learnerExcerpt,
      analyzerOutcome: item.outcome,
      source: 'scenario_transcript_analysis',
    });
    await sql`
      insert into speaking_capability_observations (
        user_id,
        speaking_session_id,
        capability_id,
        opportunity,
        result,
        summary,
        metadata
      ) values (
        ${userId},
        ${sessionId}::uuid,
        ${String(capability.id)},
        true,
        ${observationResult(item.outcome)},
        ${item.evidenceAr},
        ${metadataJson}::jsonb
      )
      on conflict (speaking_session_id, capability_id) do update set
        opportunity = excluded.opportunity,
        result = excluded.result,
        summary = excluded.summary,
        metadata = excluded.metadata,
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
      set analysis_status = 'failed', updated_at = now()
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
    const summaryJson = JSON.stringify({
      headlineAr: result.recap.headlineAr,
      summaryAr: result.recap.summaryAr,
      nextFocusAr: result.recap.nextFocusAr,
    });
    const analysisMetadataJson = JSON.stringify({ analysisModel: result.model });
    await sql`
      update speaking_sessions
      set
        analysis = ${analysisJson}::jsonb,
        summary = ${summaryJson}::jsonb,
        analysis_status = 'complete',
        metadata = metadata || ${analysisMetadataJson}::jsonb,
        updated_at = now()
      where id = ${sessionId}::uuid and user_id = ${userId}
    `;
    await persistEvidence(sql, userId, sessionId, result.recap.evidence);
  } catch (reason) {
    console.error('[speaking/session:analysis]', reason);
    await sql`
      update speaking_sessions
      set analysis_status = 'failed', updated_at = now()
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
