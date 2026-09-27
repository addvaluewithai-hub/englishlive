import { authenticateRequest } from '../../_shared/auth';
import { getSql, jsonHeaders, jsonResponse, type NeonEnv } from '../../_shared/neon';

interface PagesContext {
  request: Request;
  env: NeonEnv;
}

const validGoals = new Set(['work', 'interviews', 'travel', 'everyday', 'study']);
const validComfort = new Set(['freeze', 'manage', 'natural', 'challenge']);

export const onRequestOptions = async () => new Response(null, { status: 204, headers: jsonHeaders });

export const onRequestGet = async ({ request, env }: PagesContext) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized.' }, 401);
    const sql = getSql(env);
    const rows = await sql`
      select
        lp.first_name,
        lp.native_language,
        lp.interface_locale,
        lp.goals,
        lp.comfort_level,
        c.slug as character_id,
        lp.created_at,
        lp.updated_at
      from learner_profiles lp
      left join characters c on c.id = lp.selected_character_id
      where lp.user_id = ${auth.userId}
      limit 1
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) return jsonResponse({ profile: null });
    return jsonResponse({
      profile: {
        version: 1,
        firstName: typeof row.first_name === 'string' ? row.first_name : '',
        goals: Array.isArray(row.goals) ? row.goals : [],
        comfort: row.comfort_level,
        characterId: row.character_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (reason) {
    console.error('[me/profile:get]', reason);
    return jsonResponse({ error: 'Unable to load learner profile.' }, 500);
  }
};

export const onRequestPut = async ({ request, env }: PagesContext) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized.' }, 401);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const firstName = typeof body?.firstName === 'string' ? body.firstName.trim().slice(0, 40) : '';
    const goals = Array.isArray(body?.goals)
      ? body.goals.filter((goal): goal is string => typeof goal === 'string' && validGoals.has(goal)).slice(0, 2)
      : [];
    const comfort = typeof body?.comfort === 'string' && validComfort.has(body.comfort) ? body.comfort : null;
    const characterId = typeof body?.characterId === 'string' ? body.characterId.trim() : '';
    if (!goals.length || !comfort || !characterId) {
      return jsonResponse({ error: 'goals, comfort and characterId are required.' }, 400);
    }

    const sql = getSql(env);
    const characters = await sql`
      select id::text as id
      from characters
      where slug = ${characterId} and status = 'active'
      limit 1
    `;
    const character = characters[0] as Record<string, unknown> | undefined;
    if (!character?.id) return jsonResponse({ error: 'Selected character was not found.' }, 400);

    const rows = await sql`
      insert into learner_profiles (
        user_id, first_name, native_language, interface_locale, goals, comfort_level, selected_character_id
      ) values (
        ${auth.userId}, ${firstName}, 'ar', 'ar-EG', ${goals}, ${comfort}, ${String(character.id)}::uuid
      )
      on conflict (user_id) do update set
        first_name = excluded.first_name,
        goals = excluded.goals,
        comfort_level = excluded.comfort_level,
        selected_character_id = excluded.selected_character_id,
        updated_at = now()
      returning created_at, updated_at
    `;
    const row = rows[0] as Record<string, unknown>;
    return jsonResponse({
      profile: {
        version: 1,
        firstName,
        goals,
        comfort,
        characterId,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (reason) {
    console.error('[me/profile:put]', reason);
    return jsonResponse({ error: 'Unable to save learner profile.' }, 500);
  }
};
