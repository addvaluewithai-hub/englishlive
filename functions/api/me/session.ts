import { authenticateRequest } from '../../_shared/auth';
import { getSql, jsonHeaders, jsonResponse, type NeonEnv } from '../../_shared/neon';

interface PagesContext {
  request: Request;
  env: NeonEnv;
}

function shortText(value: unknown, max = 360) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function uuidText(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: jsonHeaders });

export const onRequestPost = async ({ request, env }: PagesContext) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized.' }, 401);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const event = typeof body?.event === 'string' ? body.event : '';
    const sql = getSql(env);

    if (event === 'start') {
      const lessonRevisionId = uuidText(body?.lessonRevisionId);
      const characterRevisionId = uuidText(body?.characterRevisionId);
      const teachingPolicyRevisionId = uuidText(body?.teachingPolicyRevisionId);
      if (!lessonRevisionId || !characterRevisionId || !teachingPolicyRevisionId) {
        return jsonResponse({ error: 'Published revision ids are required.' }, 400);
      }
      const clientContext = body?.clientContext && typeof body.clientContext === 'object'
        ? body.clientContext
        : {};

      const rows = await sql`
        with pinned as (
          select
            lr.lesson_id,
            cr.character_id,
            lr.id as lesson_revision_id,
            cr.id as character_revision_id,
            tpr.id as teaching_policy_revision_id
          from lesson_revisions lr
          cross join character_revisions cr
          cross join teaching_policy_revisions tpr
          where lr.id = ${lessonRevisionId}::uuid
            and cr.id = ${characterRevisionId}::uuid
            and tpr.id = ${teachingPolicyRevisionId}::uuid
            and lr.status = 'published'
            and cr.status = 'published'
            and tpr.status = 'published'
        ), created as (
          insert into lesson_sessions (
            user_id, lesson_id, lesson_revision_id, character_id, character_revision_id,
            teaching_policy_revision_id, status, client_context
          )
          select
            ${auth.userId}, lesson_id, lesson_revision_id, character_id, character_revision_id,
            teaching_policy_revision_id, 'active', ${JSON.stringify(clientContext)}::jsonb
          from pinned
          returning id, lesson_id, started_at
        ), progress as (
          insert into lesson_progress (
            user_id, lesson_id, status, attempt_count, first_started_at, last_started_at, last_session_id, updated_at
          )
          select ${auth.userId}, lesson_id, 'in_progress', 1, now(), now(), id, now()
          from created
          on conflict (user_id, lesson_id) do update set
            status = case when lesson_progress.status = 'completed' then 'completed' else 'in_progress' end,
            attempt_count = lesson_progress.attempt_count + 1,
            first_started_at = coalesce(lesson_progress.first_started_at, now()),
            last_started_at = now(),
            last_session_id = excluded.last_session_id,
            updated_at = now()
          returning lesson_id
        )
        select id::text as session_id, lesson_id::text as lesson_id, started_at
        from created
      `;
      const row = rows[0] as Record<string, unknown> | undefined;
      if (!row) return jsonResponse({ error: 'Published lesson bundle was not found.' }, 400);
      return jsonResponse({ sessionId: row.session_id, startedAt: row.started_at }, 201);
    }

    if (event === 'scene') {
      const sessionId = uuidText(body?.sessionId);
      const sceneId = shortText(body?.sceneId, 120);
      const summary = shortText(body?.summary, 360);
      const sceneIndex = Number(body?.sceneIndex);
      const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : {};
      if (!sessionId || !sceneId || !summary || !Number.isInteger(sceneIndex) || sceneIndex < 0) {
        return jsonResponse({ error: 'sessionId, sceneId, sceneIndex and summary are required.' }, 400);
      }
      const rows = await sql`
        insert into scene_results (session_id, scene_id, scene_index, summary, metadata)
        select ls.id, ${sceneId}, ${sceneIndex}, ${summary}, ${JSON.stringify(metadata)}::jsonb
        from lesson_sessions ls
        where ls.id = ${sessionId}::uuid and ls.user_id = ${auth.userId}
        on conflict (session_id, scene_id) do update set
          scene_index = excluded.scene_index,
          summary = excluded.summary,
          metadata = excluded.metadata,
          completed_at = now()
        returning id::text as id, completed_at
      `;
      if (!rows[0]) return jsonResponse({ error: 'Session not found.' }, 404);
      return jsonResponse({ ok: true, sceneResultId: (rows[0] as Record<string, unknown>).id });
    }

    if (event === 'complete') {
      const sessionId = uuidText(body?.sessionId);
      if (!sessionId) return jsonResponse({ error: 'sessionId is required.' }, 400);
      const summary = body?.summary && typeof body.summary === 'object' ? body.summary : {};
      const rows = await sql`
        with finished as (
          update lesson_sessions
          set status = 'completed', ended_at = now(), completed_at = now(), summary = ${JSON.stringify(summary)}::jsonb
          where id = ${sessionId}::uuid and user_id = ${auth.userId}
          returning id, lesson_id, completed_at
        ), progress as (
          update lesson_progress lp
          set status = 'completed', completed_at = coalesce(lp.completed_at, finished.completed_at),
              last_session_id = finished.id, updated_at = now()
          from finished
          where lp.user_id = ${auth.userId} and lp.lesson_id = finished.lesson_id
          returning lp.lesson_id
        )
        select id::text as session_id, completed_at from finished
      `;
      if (!rows[0]) return jsonResponse({ error: 'Session not found.' }, 404);
      return jsonResponse({ ok: true, completedAt: (rows[0] as Record<string, unknown>).completed_at });
    }

    if (event === 'abandon') {
      const sessionId = uuidText(body?.sessionId);
      if (!sessionId) return jsonResponse({ error: 'sessionId is required.' }, 400);
      const rows = await sql`
        update lesson_sessions
        set status = 'abandoned', ended_at = now()
        where id = ${sessionId}::uuid and user_id = ${auth.userId} and status = 'active'
        returning id::text as id
      `;
      return jsonResponse({ ok: Boolean(rows[0]) });
    }

    return jsonResponse({ error: 'Unknown session event.' }, 400);
  } catch (reason) {
    console.error('[me/session]', reason);
    return jsonResponse({ error: 'Unable to update learner session.' }, 500);
  }
};
