import { getSql, jsonHeaders, jsonResponse, type NeonEnv } from '../../_shared/neon';

interface PagesContext {
  request: Request;
  env: NeonEnv;
}

export const onRequestOptions = async () => new Response(null, {
  status: 204,
  headers: jsonHeaders,
});

export const onRequestGet = async ({ request, env }: PagesContext) => {
  const url = new URL(request.url);
  const characterId = url.searchParams.get('characterId')?.trim();
  if (!characterId) return jsonResponse({ error: 'characterId is required.' }, 400);

  try {
    const sql = getSql(env);
    const rows = await sql`
      select
        c.id::text as character_id,
        c.slug,
        c.renderer_key,
        cr.id::text as revision_id,
        cr.revision_number,
        cr.content
      from characters c
      join character_revisions cr on cr.id = c.published_revision_id
      where c.slug = ${characterId}
        and c.status = 'active'
        and cr.status = 'published'
      limit 1
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) return jsonResponse({ error: `Published character not found: ${characterId}` }, 404);

    return jsonResponse({
      source: 'neon',
      character: {
        id: row.character_id,
        slug: row.slug,
        rendererKey: row.renderer_key,
        revisionId: row.revision_id,
        revisionNumber: Number(row.revision_number),
        content: row.content,
      },
    }, 200, 'no-store');
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : 'Content database request failed.';
    const unconfigured = message.includes('DATABASE_URL');
    console.error('[content/character]', message);
    return jsonResponse(
      { error: unconfigured ? 'Content database is not configured.' : 'Content database request failed.' },
      unconfigured ? 503 : 500,
    );
  }
};
