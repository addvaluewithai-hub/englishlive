import { getSql, jsonHeaders, jsonResponse } from '../../_shared/neon';
import { authorizeStudioRequest, type StudioEnv } from '../../_shared/studioAuth';

type EntityType = 'lesson' | 'character';

interface PagesContext {
  request: Request;
  env: StudioEnv;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: jsonHeaders });

export const onRequestPost = async ({ request, env }: PagesContext) => {
  try {
    const access = await authorizeStudioRequest(request, env);
    if (!access.ok) return jsonResponse({ error: access.error }, access.status);

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const entityType = body?.entityType as EntityType | undefined;
    const sourceEntityId = typeof body?.sourceEntityId === 'string' ? body.sourceEntityId : '';
    const slug = typeof body?.slug === 'string' ? body.slug.trim().toLowerCase() : '';
    const author = access.auth.email || access.auth.userId;

    if (!['lesson', 'character'].includes(String(entityType)) || !sourceEntityId || !validSlug(slug)) {
      return jsonResponse({ error: 'Invalid create request. Use a lowercase slug with letters, numbers and hyphens.' }, 400);
    }

    const sql = getSql(env);
    const entityId = crypto.randomUUID();
    const revisionId = crypto.randomUUID();

    if (entityType === 'character') {
      const displayName = typeof body?.displayName === 'string' ? body.displayName.trim().slice(0, 80) : '';
      if (!displayName) return jsonResponse({ error: 'Character display name is required.' }, 400);

      const rows = await sql`
        select c.renderer_key, cr.content
        from characters c
        join character_revisions cr on cr.id = c.published_revision_id
        where c.id = ${sourceEntityId}::uuid and c.status = 'active' and cr.status = 'published'
        limit 1
      ` as unknown as Array<{ renderer_key: string; content: unknown }>;
      const source = rows[0];
      if (!source || !isRecord(source.content)) return jsonResponse({ error: 'Published character template was not found.' }, 404);

      const content = { ...source.content, displayName };
      await sql.transaction([
        sql`insert into characters (id, slug, renderer_key, status) values (${entityId}::uuid, ${slug}, ${source.renderer_key}, 'active')`,
        sql`insert into character_revisions (id, character_id, revision_number, status, schema_version, content, created_by, change_note) values (${revisionId}::uuid, ${entityId}::uuid, 1, 'draft', 1, ${content}, ${author}, ${`New character from template ${sourceEntityId}`})`,
      ]);

      return jsonResponse({ entityId, revisionId });
    }

    const code = typeof body?.code === 'string' ? body.code.trim().slice(0, 40) : '';
    const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 140) : '';
    if (!code || !title) return jsonResponse({ error: 'Lesson code and title are required.' }, 400);

    const rows = await sql`
      select
        l.unit_id::text as unit_id,
        cu.slug as unit_slug,
        cu.title as unit_title,
        lower(cl.code) as level_id,
        lr.content,
        coalesce((select max(l2.order_index) + 1 from lessons l2 where l2.unit_id = l.unit_id), 1) as next_order
      from lessons l
      join course_units cu on cu.id = l.unit_id
      join course_levels cl on cl.id = cu.level_id
      join lesson_revisions lr on lr.id = l.published_revision_id
      where l.id = ${sourceEntityId}::uuid and l.status = 'active' and lr.status = 'published'
      limit 1
    ` as unknown as Array<{
      unit_id: string;
      unit_slug: string;
      unit_title: string;
      level_id: string;
      content: unknown;
      next_order: number;
    }>;
    const source = rows[0];
    if (!source || !isRecord(source.content)) return jsonResponse({ error: 'Published lesson template was not found.' }, 404);

    const nextOrder = Number(source.next_order);
    const sourceMeta = isRecord(source.content.source) ? source.content.source : {};
    const content = {
      ...source.content,
      id: slug,
      levelId: source.level_id,
      unitId: source.unit_slug,
      unitTitle: source.unit_title,
      order: nextOrder,
      title,
      source: {
        ...sourceMeta,
        repository: 'englotti-studio',
        branch: 'studio',
        path: `studio/${slug}`,
        sourceLessonId: code,
      },
    };

    await sql.transaction([
      sql`insert into lessons (id, unit_id, slug, code, order_index, status) values (${entityId}::uuid, ${source.unit_id}::uuid, ${slug}, ${code}, ${nextOrder}, 'active')`,
      sql`insert into lesson_revisions (id, lesson_id, revision_number, status, schema_version, content, created_by, change_note) values (${revisionId}::uuid, ${entityId}::uuid, 1, 'draft', 1, ${content}, ${author}, ${`New lesson from template ${sourceEntityId}`})`,
    ]);

    return jsonResponse({ entityId, revisionId });
  } catch (reason) {
    console.error('[studio:duplicate]', reason);
    const message = reason instanceof Error ? reason.message : 'Unable to create Studio item.';
    if (/duplicate key|unique constraint/i.test(message)) return jsonResponse({ error: 'Slug, code or lesson order already exists.' }, 409);
    return jsonResponse({ error: message }, 500);
  }
};
