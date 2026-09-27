import { getSql, jsonHeaders, jsonResponse, type NeonEnv } from '../../_shared/neon';

interface PagesContext {
  request: Request;
  env: NeonEnv;
}

interface CharacterRow {
  id: string;
  slug: string;
  renderer_key: string;
  revision_id: string;
  revision_number: number;
  content: unknown;
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: jsonHeaders });

export const onRequestGet = async ({ env }: PagesContext) => {
  try {
    const sql = getSql(env);
    const rows = await sql`
      select
        c.id::text as id,
        c.slug,
        c.renderer_key,
        cr.id::text as revision_id,
        cr.revision_number,
        cr.content
      from characters c
      join character_revisions cr on cr.id = c.published_revision_id
      where c.status = 'active'
        and cr.status = 'published'
      order by c.created_at, c.slug
    ` as unknown as CharacterRow[];

    return jsonResponse({
      source: 'neon',
      characters: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        rendererKey: row.renderer_key,
        revisionId: row.revision_id,
        revisionNumber: Number(row.revision_number),
        content: row.content,
      })),
    }, 200, 'public, max-age=15, stale-while-revalidate=120');
  } catch (reason) {
    console.error('[content/characters]', reason);
    return jsonResponse({ error: 'Unable to load published characters.' }, 500);
  }
};
