import { authenticateRequest } from '../../_shared/auth';
import {
  mapSpeakingSessionRow,
  sanitizeSpeakingDifficulty,
  sanitizeSpeakingScenarioSnapshot,
} from '../../_shared/speaking';
import { getSql, jsonHeaders, jsonResponse, type NeonEnv } from '../../_shared/neon';

interface PagesContext {
  request: Request;
  env: NeonEnv;
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: jsonHeaders });

export const onRequestPost = async ({ request, env }: PagesContext) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized.' }, 401);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const scenarioId = typeof body?.scenarioId === 'string' ? body.scenarioId.trim().slice(0, 160) : '';
    const difficulty = sanitizeSpeakingDifficulty(body?.difficulty);
    const characterSlug = typeof body?.characterSlug === 'string' ? body.characterSlug.trim().slice(0, 120) : '';
    const snapshot = sanitizeSpeakingScenarioSnapshot(body?.scenarioSnapshot);
    if (!scenarioId || !characterSlug || !snapshot.titleAr || !snapshot.goalAr) {
      return jsonResponse({ error: 'scenarioId, characterSlug and a valid scenario snapshot are required.' }, 400);
    }

    const sql = getSql(env);
    const characters = await sql`
      select
        c.id::text as id,
        c.slug,
        c.published_revision_id::text as revision_id,
        coalesce(cr.content->>'displayName', c.slug) as display_name
      from characters c
      join character_revisions cr on cr.id = c.published_revision_id
      where c.slug = ${characterSlug}
        and c.status = 'active'
        and cr.status = 'published'
      limit 1
    `;
    const character = characters[0] as Record<string, unknown> | undefined;
    if (!character?.id || !character.revision_id) {
      return jsonResponse({ error: 'Published character was not found.' }, 400);
    }

    const snapshotJson = JSON.stringify(snapshot);
    const rows = await sql`
      insert into speaking_sessions (
        user_id,
        scenario_id,
        difficulty,
        character_id,
        character_revision_id,
        scenario_snapshot,
        status,
        analysis_status
      ) values (
        ${auth.userId},
        ${scenarioId},
        ${difficulty},
        ${String(character.id)}::uuid,
        ${String(character.revision_id)}::uuid,
        ${snapshotJson}::jsonb,
        'active',
        'pending'
      )
      returning
        id::text as id,
        scenario_id,
        difficulty,
        status,
        started_at,
        ended_at,
        duration_seconds,
        scenario_snapshot,
        transcript,
        analysis,
        analysis_status,
        analysis_model
    `;
    const row = rows[0] as Record<string, unknown>;
    return jsonResponse({
      session: mapSpeakingSessionRow({
        ...row,
        character_slug: character.slug,
        character_name: character.display_name,
      }),
    }, 201);
  } catch (reason) {
    console.error('[speaking/sessions:post]', reason);
    return jsonResponse({ error: 'Unable to start speaking session.' }, 500);
  }
};
