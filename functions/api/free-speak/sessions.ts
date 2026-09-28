import { authenticateRequest } from '../../_shared/auth';
import { mapFreeSpeakSessionRow, validFreeSpeakModes } from '../../_shared/freeSpeak';
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
    const modeId = typeof body?.modeId === 'string' ? body.modeId.trim() : '';
    const characterSlug = typeof body?.characterSlug === 'string' ? body.characterSlug.trim() : '';
    if (!validFreeSpeakModes.has(modeId) || !characterSlug) {
      return jsonResponse({ error: 'A valid modeId and characterSlug are required.' }, 400);
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

    const rows = await sql`
      insert into free_speak_sessions (
        user_id,
        mode_id,
        character_id,
        character_revision_id,
        status,
        analysis_status
      ) values (
        ${auth.userId},
        ${modeId},
        ${String(character.id)}::uuid,
        ${String(character.revision_id)}::uuid,
        'active',
        'pending'
      )
      returning
        id::text as id,
        mode_id,
        status,
        started_at,
        ended_at,
        duration_seconds,
        transcript,
        analysis,
        analysis_status,
        analysis_model
    `;
    const row = rows[0] as Record<string, unknown>;
    return jsonResponse({
      session: mapFreeSpeakSessionRow({
        ...row,
        character_slug: character.slug,
        character_name: character.display_name,
      }),
    }, 201);
  } catch (reason) {
    console.error('[free-speak/sessions:post]', reason);
    return jsonResponse({ error: 'Unable to start Free Speak session.' }, 500);
  }
};

export const onRequestGet = async ({ request, env }: PagesContext) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized.' }, 401);
    const sql = getSql(env);
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
      where fs.user_id = ${auth.userId}
        and fs.status = 'completed'
      order by fs.ended_at desc nulls last, fs.started_at desc
      limit 1
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    return jsonResponse({ session: row ? mapFreeSpeakSessionRow(row) : null });
  } catch (reason) {
    console.error('[free-speak/sessions:get]', reason);
    return jsonResponse({ error: 'Unable to load latest Free Speak session.' }, 500);
  }
};
