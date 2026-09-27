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
  const lessonId = url.searchParams.get('lessonId')?.trim();
  const characterId = url.searchParams.get('characterId')?.trim();
  if (!lessonId || !characterId) {
    return jsonResponse({ error: 'lessonId and characterId are required.' }, 400);
  }

  try {
    const sql = getSql(env);
    const [lessonRows, characterRows, policyRows] = await Promise.all([
      sql`
        select
          l.id::text as lesson_id,
          lr.id::text as revision_id,
          lr.revision_number,
          lr.content
        from lessons l
        join lesson_revisions lr on lr.id = l.published_revision_id
        where l.slug = ${lessonId}
          and l.status = 'active'
          and lr.status = 'published'
        limit 1
      `,
      sql`
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
      `,
      sql`
        select
          tp.id::text as policy_id,
          tp.key,
          tpr.id::text as revision_id,
          tpr.revision_number,
          tpr.content
        from teaching_policies tp
        join teaching_policy_revisions tpr on tpr.id = tp.published_revision_id
        where tp.key = 'default'
          and tpr.status = 'published'
        limit 1
      `,
    ]);

    const lesson = lessonRows[0] as Record<string, unknown> | undefined;
    const character = characterRows[0] as Record<string, unknown> | undefined;
    const policy = policyRows[0] as Record<string, unknown> | undefined;
    if (!lesson) return jsonResponse({ error: `Published lesson not found: ${lessonId}` }, 404);
    if (!character) return jsonResponse({ error: `Published character not found: ${characterId}` }, 404);
    if (!policy) return jsonResponse({ error: 'Published default teaching policy not found.' }, 503);

    return jsonResponse({
      source: 'neon',
      lesson: {
        id: lesson.lesson_id,
        revisionId: lesson.revision_id,
        revisionNumber: Number(lesson.revision_number),
        content: lesson.content,
      },
      character: {
        id: character.character_id,
        slug: character.slug,
        rendererKey: character.renderer_key,
        revisionId: character.revision_id,
        revisionNumber: Number(character.revision_number),
        content: character.content,
      },
      teachingPolicy: {
        id: policy.policy_id,
        key: policy.key,
        revisionId: policy.revision_id,
        revisionNumber: Number(policy.revision_number),
        content: policy.content,
      },
    }, 200, 'no-store');
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : 'Content database request failed.';
    const unconfigured = message.includes('DATABASE_URL');
    console.error('[content/bundle]', message);
    return jsonResponse(
      { error: unconfigured ? 'Content database is not configured.' : 'Content database request failed.' },
      unconfigured ? 503 : 500,
    );
  }
};
