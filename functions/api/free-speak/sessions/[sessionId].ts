import { authenticateRequest } from '../../../_shared/auth';
import { analyzeFreeSpeakTranscript, type FreeSpeakAnalysisEnv } from '../../../_shared/freeSpeakAnalysis';
import { clampDuration, mapFreeSpeakSessionRow, sanitizeTranscript } from '../../../_shared/freeSpeak';
import { getSql, jsonHeaders, jsonResponse, type NeonEnv } from '../../../_shared/neon';

interface FreeSpeakEnv extends NeonEnv, FreeSpeakAnalysisEnv {}

interface PagesContext {
  request: Request;
  env: FreeSpeakEnv;
  params: { sessionId?: string | string[] };
}

function sessionIdFrom(params: PagesContext['params']) {
  const value = params.sessionId;
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

async function loadOwnedSession(sql: ReturnType<typeof getSql>, userId: string, sessionId: string) {
  const rows = await sql`
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
    where fs.id = ${sessionId}::uuid
      and fs.user_id = ${userId}
    limit 1
  `;
  return rows[0] as Record<string, unknown> | undefined;
}

async function runAnalysis(
  sql: ReturnType<typeof getSql>,
  env: FreeSpeakEnv,
  userId: string,
  sessionId: string,
) {
  const row = await loadOwnedSession(sql, userId, sessionId);
  if (!row) return null;
  const session = mapFreeSpeakSessionRow(row);
  if (!session.transcript.length) {
    await sql`
      update free_speak_sessions
      set analysis_status = 'error', updated_at = now()
      where id = ${sessionId}::uuid and user_id = ${userId}
    `;
    const updated = await loadOwnedSession(sql, userId, sessionId);
    return {
      session: updated ? mapFreeSpeakSessionRow(updated) : session,
      error: 'Conversation transcript is empty.',
    };
  }

  try {
    const result = await analyzeFreeSpeakTranscript(env, {
      modeId: session.modeId,
      characterName: session.characterName,
      durationSeconds: session.durationSeconds,
      transcript: session.transcript,
    });
    const analysisJson = JSON.stringify(result.recap);
    await sql`
      update free_speak_sessions
      set
        analysis = ${analysisJson}::jsonb,
        analysis_status = 'complete',
        analysis_model = ${result.model},
        updated_at = now()
      where id = ${sessionId}::uuid and user_id = ${userId}
    `;
  } catch (reason) {
    console.error('[free-speak/session:analysis]', reason);
    await sql`
      update free_speak_sessions
      set analysis_status = 'error', updated_at = now()
      where id = ${sessionId}::uuid and user_id = ${userId}
    `;
    const updated = await loadOwnedSession(sql, userId, sessionId);
    return {
      session: updated ? mapFreeSpeakSessionRow(updated) : session,
      error: reason instanceof Error ? reason.message : 'Gemini analysis failed.',
    };
  }

  const updated = await loadOwnedSession(sql, userId, sessionId);
  return updated ? { session: mapFreeSpeakSessionRow(updated), error: null } : null;
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: jsonHeaders });

export const onRequestGet = async ({ request, env, params }: PagesContext) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized.' }, 401);
    const sessionId = sessionIdFrom(params);
    if (!sessionId) return jsonResponse({ error: 'sessionId is required.' }, 400);
    const sql = getSql(env);
    const row = await loadOwnedSession(sql, auth.userId, sessionId);
    if (!row) return jsonResponse({ error: 'Free Speak session was not found.' }, 404);
    return jsonResponse({ session: mapFreeSpeakSessionRow(row) });
  } catch (reason) {
    console.error('[free-speak/session:get]', reason);
    return jsonResponse({ error: 'Unable to load Free Speak session.' }, 500);
  }
};

export const onRequestPatch = async ({ request, env, params }: PagesContext) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized.' }, 401);
    const sessionId = sessionIdFrom(params);
    if (!sessionId) return jsonResponse({ error: 'sessionId is required.' }, 400);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const transcript = sanitizeTranscript(body?.transcript);
    const durationSeconds = clampDuration(body?.durationSeconds);
    const transcriptJson = JSON.stringify(transcript);
    const sql = getSql(env);
    const rows = await sql`
      update free_speak_sessions
      set
        transcript = ${transcriptJson}::jsonb,
        duration_seconds = greatest(duration_seconds, ${durationSeconds}),
        updated_at = now()
      where id = ${sessionId}::uuid
        and user_id = ${auth.userId}
        and status = 'active'
      returning id::text as id
    `;
    if (!rows.length) return jsonResponse({ error: 'Active Free Speak session was not found.' }, 404);
    const row = await loadOwnedSession(sql, auth.userId, sessionId);
    return jsonResponse({ session: mapFreeSpeakSessionRow(row as Record<string, unknown>) });
  } catch (reason) {
    console.error('[free-speak/session:patch]', reason);
    return jsonResponse({ error: 'Unable to save Free Speak transcript.' }, 500);
  }
};

export const onRequestPut = async ({ request, env, params }: PagesContext) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized.' }, 401);
    const sessionId = sessionIdFrom(params);
    if (!sessionId) return jsonResponse({ error: 'sessionId is required.' }, 400);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const transcript = sanitizeTranscript(body?.transcript);
    const durationSeconds = clampDuration(body?.durationSeconds);
    const transcriptJson = JSON.stringify(transcript);
    const sql = getSql(env);
    const rows = await sql`
      update free_speak_sessions
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
    if (!rows.length) return jsonResponse({ error: 'Free Speak session was not found.' }, 404);

    const analysis = await runAnalysis(sql, env, auth.userId, sessionId);
    if (!analysis) return jsonResponse({ error: 'Free Speak session was not found.' }, 404);
    if (analysis.error) return jsonResponse({ error: analysis.error, session: analysis.session }, 502);
    return jsonResponse({ session: analysis.session });
  } catch (reason) {
    console.error('[free-speak/session:put]', reason);
    return jsonResponse({ error: 'Unable to complete Free Speak session.' }, 500);
  }
};

export const onRequestPost = async ({ request, env, params }: PagesContext) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized.' }, 401);
    const sessionId = sessionIdFrom(params);
    if (!sessionId) return jsonResponse({ error: 'sessionId is required.' }, 400);
    const sql = getSql(env);

    // A final analysis retry must also recover a session whose first completion
    // request reached autosave but timed out before flipping active -> completed.
    const rows = await sql`
      update free_speak_sessions
      set
        status = case when status = 'active' then 'completed' else status end,
        ended_at = case when status = 'active' then coalesce(ended_at, now()) else ended_at end,
        analysis_status = 'pending',
        updated_at = now()
      where id = ${sessionId}::uuid
        and user_id = ${auth.userId}
      returning id::text as id
    `;
    if (!rows.length) return jsonResponse({ error: 'Free Speak session was not found.' }, 404);

    const analysis = await runAnalysis(sql, env, auth.userId, sessionId);
    if (!analysis) return jsonResponse({ error: 'Free Speak session was not found.' }, 404);
    if (analysis.error) return jsonResponse({ error: analysis.error, session: analysis.session }, 502);
    return jsonResponse({ session: analysis.session });
  } catch (reason) {
    console.error('[free-speak/session:post]', reason);
    return jsonResponse({ error: 'Unable to analyze Free Speak session.' }, 500);
  }
};
