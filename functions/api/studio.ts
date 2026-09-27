import { getSql, jsonHeaders, jsonResponse } from '../_shared/neon';
import { authorizeStudioRequest, type StudioEnv } from '../_shared/studioAuth';

type StudioEntityType = 'lesson' | 'character' | 'policy';
type StudioAction = 'create-draft' | 'save-draft' | 'publish';

interface PagesContext {
  request: Request;
  env: StudioEnv;
}

interface RevisionRow {
  id: string;
  revision_number: number;
  status: string;
  schema_version: number;
  content: unknown;
  change_note: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

function revision(row: RevisionRow | undefined) {
  if (!row) return null;
  return {
    id: row.id,
    revisionNumber: Number(row.revision_number),
    status: row.status,
    schemaVersion: Number(row.schema_version),
    content: row.content,
    changeNote: row.change_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateContent(entityType: StudioEntityType, value: unknown) {
  if (!isRecord(value)) return 'Revision content must be a JSON object.';
  if (entityType === 'lesson') {
    if (typeof value.id !== 'string' || !value.id.trim()) return 'Lesson content must include id.';
    if (!Array.isArray(value.scenes) || value.scenes.length === 0) return 'Lesson content must include at least one scene.';
  }
  if (entityType === 'character') {
    if (typeof value.displayName !== 'string' || !value.displayName.trim()) return 'Character content must include displayName.';
    if (typeof value.personaPrompt !== 'string') return 'Character content must include personaPrompt.';
  }
  if (entityType === 'policy') {
    if (typeof value.prompt !== 'string' || !value.prompt.trim()) return 'Teaching policy content must include prompt.';
  }
  return null;
}

async function loadOverview(sql: ReturnType<typeof getSql>) {
  const lessonRows = await sql`
    select
      l.id::text as id,
      l.slug,
      l.code,
      l.order_index,
      cu.slug as unit_slug,
      cu.code as unit_code,
      cu.title as unit_title,
      cl.code as level_code,
      pr.id::text as published_id,
      pr.revision_number as published_revision_number,
      pr.status as published_status,
      pr.schema_version as published_schema_version,
      pr.content as published_content,
      pr.change_note as published_change_note,
      pr.created_at as published_created_at,
      pr.updated_at as published_updated_at,
      pr.published_at as published_published_at,
      dr.id::text as draft_id,
      dr.revision_number as draft_revision_number,
      dr.status as draft_status,
      dr.schema_version as draft_schema_version,
      dr.content as draft_content,
      dr.change_note as draft_change_note,
      dr.created_at as draft_created_at,
      dr.updated_at as draft_updated_at,
      dr.published_at as draft_published_at
    from lessons l
    join course_units cu on cu.id = l.unit_id
    join course_levels cl on cl.id = cu.level_id
    join courses c on c.id = cl.course_id
    left join lesson_revisions pr on pr.id = l.published_revision_id
    left join lateral (
      select * from lesson_revisions candidate
      where candidate.lesson_id = l.id and candidate.status = 'draft'
      order by candidate.revision_number desc
      limit 1
    ) dr on true
    where c.status = 'active' and cl.status = 'active' and cu.status = 'active' and l.status = 'active'
    order by cl.order_index, cu.order_index, l.order_index
  ` as unknown as Array<Record<string, unknown>>;

  const characterRows = await sql`
    select
      c.id::text as id,
      c.slug,
      c.renderer_key,
      pr.id::text as published_id,
      pr.revision_number as published_revision_number,
      pr.status as published_status,
      pr.schema_version as published_schema_version,
      pr.content as published_content,
      pr.change_note as published_change_note,
      pr.created_at as published_created_at,
      pr.updated_at as published_updated_at,
      pr.published_at as published_published_at,
      dr.id::text as draft_id,
      dr.revision_number as draft_revision_number,
      dr.status as draft_status,
      dr.schema_version as draft_schema_version,
      dr.content as draft_content,
      dr.change_note as draft_change_note,
      dr.created_at as draft_created_at,
      dr.updated_at as draft_updated_at,
      dr.published_at as draft_published_at
    from characters c
    left join character_revisions pr on pr.id = c.published_revision_id
    left join lateral (
      select * from character_revisions candidate
      where candidate.character_id = c.id and candidate.status = 'draft'
      order by candidate.revision_number desc
      limit 1
    ) dr on true
    where c.status = 'active'
    order by c.slug
  ` as unknown as Array<Record<string, unknown>>;

  const policyRows = await sql`
    select
      p.id::text as id,
      p.key,
      pr.id::text as published_id,
      pr.revision_number as published_revision_number,
      pr.status as published_status,
      pr.schema_version as published_schema_version,
      pr.content as published_content,
      pr.change_note as published_change_note,
      pr.created_at as published_created_at,
      pr.updated_at as published_updated_at,
      pr.published_at as published_published_at,
      dr.id::text as draft_id,
      dr.revision_number as draft_revision_number,
      dr.status as draft_status,
      dr.schema_version as draft_schema_version,
      dr.content as draft_content,
      dr.change_note as draft_change_note,
      dr.created_at as draft_created_at,
      dr.updated_at as draft_updated_at,
      dr.published_at as draft_published_at
    from teaching_policies p
    left join teaching_policy_revisions pr on pr.id = p.published_revision_id
    left join lateral (
      select * from teaching_policy_revisions candidate
      where candidate.teaching_policy_id = p.id and candidate.status = 'draft'
      order by candidate.revision_number desc
      limit 1
    ) dr on true
    order by p.key
  ` as unknown as Array<Record<string, unknown>>;

  const rowRevision = (row: Record<string, unknown>, prefix: 'published' | 'draft') => {
    const id = row[`${prefix}_id`];
    if (typeof id !== 'string') return null;
    return revision({
      id,
      revision_number: Number(row[`${prefix}_revision_number`]),
      status: String(row[`${prefix}_status`]),
      schema_version: Number(row[`${prefix}_schema_version`]),
      content: row[`${prefix}_content`],
      change_note: typeof row[`${prefix}_change_note`] === 'string' ? String(row[`${prefix}_change_note`]) : null,
      created_at: String(row[`${prefix}_created_at`]),
      updated_at: String(row[`${prefix}_updated_at`]),
      published_at: row[`${prefix}_published_at`] ? String(row[`${prefix}_published_at`]) : null,
    });
  };

  return {
    lessons: lessonRows.map((row) => ({
      type: 'lesson' as const,
      id: String(row.id),
      slug: String(row.slug),
      code: String(row.code),
      order: Number(row.order_index),
      levelCode: String(row.level_code),
      unitSlug: String(row.unit_slug),
      unitCode: String(row.unit_code),
      unitTitle: String(row.unit_title),
      published: rowRevision(row, 'published'),
      draft: rowRevision(row, 'draft'),
    })),
    characters: characterRows.map((row) => ({
      type: 'character' as const,
      id: String(row.id),
      slug: String(row.slug),
      rendererKey: String(row.renderer_key),
      published: rowRevision(row, 'published'),
      draft: rowRevision(row, 'draft'),
    })),
    policies: policyRows.map((row) => ({
      type: 'policy' as const,
      id: String(row.id),
      key: String(row.key),
      published: rowRevision(row, 'published'),
      draft: rowRevision(row, 'draft'),
    })),
  };
}

async function createDraft(sql: ReturnType<typeof getSql>, entityType: StudioEntityType, entityId: string, author: string) {
  if (entityType === 'lesson') {
    const existing = await sql`select * from lesson_revisions where lesson_id = ${entityId}::uuid and status = 'draft' order by revision_number desc limit 1` as unknown as RevisionRow[];
    if (existing[0]) return revision(existing[0]);
    const source = await sql`select pr.content, pr.schema_version, pr.revision_number from lessons l left join lesson_revisions pr on pr.id = l.published_revision_id where l.id = ${entityId}::uuid limit 1` as unknown as Array<Record<string, unknown>>;
    if (!source[0]?.content) throw new Error('Lesson has no published revision to draft from.');
    const next = await sql`select coalesce(max(revision_number), 0) + 1 as value from lesson_revisions where lesson_id = ${entityId}::uuid` as unknown as Array<{ value: number }>;
    const rows = await sql`
      insert into lesson_revisions (lesson_id, revision_number, status, schema_version, content, created_by, change_note)
      values (${entityId}::uuid, ${Number(next[0]?.value ?? 1)}, 'draft', ${Number(source[0].schema_version ?? 1)}, ${source[0].content}, ${author}, ${`Draft from published revision ${Number(source[0].revision_number ?? 0)}`})
      returning *
    ` as unknown as RevisionRow[];
    return revision(rows[0]);
  }

  if (entityType === 'character') {
    const existing = await sql`select * from character_revisions where character_id = ${entityId}::uuid and status = 'draft' order by revision_number desc limit 1` as unknown as RevisionRow[];
    if (existing[0]) return revision(existing[0]);
    const source = await sql`select pr.content, pr.schema_version, pr.revision_number from characters c left join character_revisions pr on pr.id = c.published_revision_id where c.id = ${entityId}::uuid limit 1` as unknown as Array<Record<string, unknown>>;
    if (!source[0]?.content) throw new Error('Character has no published revision to draft from.');
    const next = await sql`select coalesce(max(revision_number), 0) + 1 as value from character_revisions where character_id = ${entityId}::uuid` as unknown as Array<{ value: number }>;
    const rows = await sql`
      insert into character_revisions (character_id, revision_number, status, schema_version, content, created_by, change_note)
      values (${entityId}::uuid, ${Number(next[0]?.value ?? 1)}, 'draft', ${Number(source[0].schema_version ?? 1)}, ${source[0].content}, ${author}, ${`Draft from published revision ${Number(source[0].revision_number ?? 0)}`})
      returning *
    ` as unknown as RevisionRow[];
    return revision(rows[0]);
  }

  const existing = await sql`select * from teaching_policy_revisions where teaching_policy_id = ${entityId}::uuid and status = 'draft' order by revision_number desc limit 1` as unknown as RevisionRow[];
  if (existing[0]) return revision(existing[0]);
  const source = await sql`select pr.content, pr.schema_version, pr.revision_number from teaching_policies p left join teaching_policy_revisions pr on pr.id = p.published_revision_id where p.id = ${entityId}::uuid limit 1` as unknown as Array<Record<string, unknown>>;
  if (!source[0]?.content) throw new Error('Teaching policy has no published revision to draft from.');
  const next = await sql`select coalesce(max(revision_number), 0) + 1 as value from teaching_policy_revisions where teaching_policy_id = ${entityId}::uuid` as unknown as Array<{ value: number }>;
  const rows = await sql`
    insert into teaching_policy_revisions (teaching_policy_id, revision_number, status, schema_version, content, created_by, change_note)
    values (${entityId}::uuid, ${Number(next[0]?.value ?? 1)}, 'draft', ${Number(source[0].schema_version ?? 1)}, ${source[0].content}, ${author}, ${`Draft from published revision ${Number(source[0].revision_number ?? 0)}`})
    returning *
  ` as unknown as RevisionRow[];
  return revision(rows[0]);
}

async function saveDraft(sql: ReturnType<typeof getSql>, entityType: StudioEntityType, entityId: string, revisionId: string, content: Record<string, unknown>, changeNote: string | null) {
  if (entityType === 'lesson') {
    const rows = await sql`update lesson_revisions set content = ${content}, change_note = ${changeNote}, updated_at = now() where id = ${revisionId}::uuid and lesson_id = ${entityId}::uuid and status = 'draft' returning *` as unknown as RevisionRow[];
    return revision(rows[0]);
  }
  if (entityType === 'character') {
    const rows = await sql`update character_revisions set content = ${content}, change_note = ${changeNote}, updated_at = now() where id = ${revisionId}::uuid and character_id = ${entityId}::uuid and status = 'draft' returning *` as unknown as RevisionRow[];
    return revision(rows[0]);
  }
  const rows = await sql`update teaching_policy_revisions set content = ${content}, change_note = ${changeNote}, updated_at = now() where id = ${revisionId}::uuid and teaching_policy_id = ${entityId}::uuid and status = 'draft' returning *` as unknown as RevisionRow[];
  return revision(rows[0]);
}

async function publishDraft(sql: ReturnType<typeof getSql>, entityType: StudioEntityType, entityId: string, revisionId: string, author: string) {
  if (entityType === 'lesson') {
    const [revisions, parents] = await sql.transaction([
      sql`update lesson_revisions set status = 'published', published_by = ${author}, published_at = now(), updated_at = now() where id = ${revisionId}::uuid and lesson_id = ${entityId}::uuid and status = 'draft' returning *`,
      sql`update lessons set published_revision_id = ${revisionId}::uuid, updated_at = now() where id = ${entityId}::uuid returning id`,
    ]) as unknown as [RevisionRow[], Array<{ id: string }>];
    if (!revisions[0] || !parents[0]) return null;
    return revision(revisions[0]);
  }
  if (entityType === 'character') {
    const [revisions, parents] = await sql.transaction([
      sql`update character_revisions set status = 'published', published_by = ${author}, published_at = now(), updated_at = now() where id = ${revisionId}::uuid and character_id = ${entityId}::uuid and status = 'draft' returning *`,
      sql`update characters set published_revision_id = ${revisionId}::uuid, updated_at = now() where id = ${entityId}::uuid returning id`,
    ]) as unknown as [RevisionRow[], Array<{ id: string }>];
    if (!revisions[0] || !parents[0]) return null;
    return revision(revisions[0]);
  }
  const [revisions, parents] = await sql.transaction([
    sql`update teaching_policy_revisions set status = 'published', published_by = ${author}, published_at = now(), updated_at = now() where id = ${revisionId}::uuid and teaching_policy_id = ${entityId}::uuid and status = 'draft' returning *`,
    sql`update teaching_policies set published_revision_id = ${revisionId}::uuid, updated_at = now() where id = ${entityId}::uuid returning id`,
  ]) as unknown as [RevisionRow[], Array<{ id: string }>];
  if (!revisions[0] || !parents[0]) return null;
  return revision(revisions[0]);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: jsonHeaders });

export const onRequestGet = async ({ request, env }: PagesContext) => {
  try {
    const access = await authorizeStudioRequest(request, env);
    if (!access.ok) return jsonResponse({ error: access.error }, access.status);
    const sql = getSql(env);
    const overview = await loadOverview(sql);
    return jsonResponse({
      admin: { userId: access.auth.userId, email: access.auth.email, name: access.auth.name },
      ...overview,
    });
  } catch (reason) {
    console.error('[studio:get]', reason);
    return jsonResponse({ error: 'Unable to load Englotti Studio.' }, 500);
  }
};

export const onRequestPost = async ({ request, env }: PagesContext) => {
  try {
    const access = await authorizeStudioRequest(request, env);
    if (!access.ok) return jsonResponse({ error: access.error }, access.status);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const entityType = body?.entityType;
    const entityId = typeof body?.entityId === 'string' ? body.entityId : '';
    const action = body?.action;
    const revisionId = typeof body?.revisionId === 'string' ? body.revisionId : '';
    const changeNote = typeof body?.changeNote === 'string' ? body.changeNote.trim().slice(0, 500) || null : null;

    if (!['lesson', 'character', 'policy'].includes(String(entityType)) || !entityId || !['create-draft', 'save-draft', 'publish'].includes(String(action))) {
      return jsonResponse({ error: 'Invalid Studio request.' }, 400);
    }

    const type = entityType as StudioEntityType;
    const studioAction = action as StudioAction;
    const sql = getSql(env);
    const author = access.auth.email || access.auth.userId;

    if (studioAction === 'create-draft') {
      const created = await createDraft(sql, type, entityId, author);
      if (!created) return jsonResponse({ error: 'Unable to create draft.' }, 400);
      return jsonResponse({ revision: created });
    }

    if (!revisionId) return jsonResponse({ error: 'revisionId is required.' }, 400);

    if (studioAction === 'save-draft') {
      const content = body?.content;
      const validationError = validateContent(type, content);
      if (validationError) return jsonResponse({ error: validationError }, 400);
      const saved = await saveDraft(sql, type, entityId, revisionId, content as Record<string, unknown>, changeNote);
      if (!saved) return jsonResponse({ error: 'Draft was not found or is no longer editable.' }, 409);
      return jsonResponse({ revision: saved });
    }

    const published = await publishDraft(sql, type, entityId, revisionId, author);
    if (!published) return jsonResponse({ error: 'Draft was not found or is no longer publishable.' }, 409);
    return jsonResponse({ revision: published });
  } catch (reason) {
    console.error('[studio:post]', reason);
    return jsonResponse({ error: reason instanceof Error ? reason.message : 'Studio action failed.' }, 500);
  }
};
