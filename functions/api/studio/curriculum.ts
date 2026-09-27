import { getSql, jsonHeaders, jsonResponse } from '../../_shared/neon';
import { authorizeStudioRequest, type StudioEnv } from '../../_shared/studioAuth';

interface PagesContext {
  request: Request;
  env: StudioEnv;
}

type CurriculumEntityType = 'level' | 'unit' | 'lesson';
type CurriculumAction = 'create-level' | 'create-unit' | 'create-lesson' | 'archive' | 'restore';

function cleanText(value: unknown, max = 140) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function validSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function validCode(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/.test(value);
}

async function loadHierarchy(sql: ReturnType<typeof getSql>) {
  const courseRows = await sql`
    select id::text as id, slug, title
    from courses
    where status = 'active'
    order by created_at
    limit 1
  ` as unknown as Array<{ id: string; slug: string; title: string }>;
  const course = courseRows[0];
  if (!course) throw new Error('Active course was not found.');

  const levels = await sql`
    select id::text as id, code, title, order_index, status
    from course_levels
    where course_id = ${course.id}::uuid
    order by order_index, code
  ` as unknown as Array<{ id: string; code: string; title: string; order_index: number; status: string }>;

  const units = await sql`
    select cu.id::text as id, cu.level_id::text as level_id, cu.slug, cu.code, cu.title, cu.order_index, cu.status
    from course_units cu
    join course_levels cl on cl.id = cu.level_id
    where cl.course_id = ${course.id}::uuid
    order by cl.order_index, cu.order_index, cu.code
  ` as unknown as Array<{ id: string; level_id: string; slug: string; code: string; title: string; order_index: number; status: string }>;

  const lessons = await sql`
    select
      l.id::text as id,
      l.unit_id::text as unit_id,
      l.slug,
      l.code,
      l.order_index,
      l.status,
      l.published_revision_id::text as published_revision_id,
      pr.revision_number as published_revision_number,
      dr.id::text as draft_revision_id,
      dr.revision_number as draft_revision_number,
      coalesce(pr.content->>'title', dr.content->>'title', l.code) as title
    from lessons l
    join course_units cu on cu.id = l.unit_id
    join course_levels cl on cl.id = cu.level_id
    left join lesson_revisions pr on pr.id = l.published_revision_id
    left join lateral (
      select id, revision_number, content
      from lesson_revisions candidate
      where candidate.lesson_id = l.id and candidate.status = 'draft'
      order by candidate.revision_number desc
      limit 1
    ) dr on true
    where cl.course_id = ${course.id}::uuid
    order by cl.order_index, cu.order_index, l.order_index, l.code
  ` as unknown as Array<{
    id: string;
    unit_id: string;
    slug: string;
    code: string;
    order_index: number;
    status: string;
    published_revision_id: string | null;
    published_revision_number: number | null;
    draft_revision_id: string | null;
    draft_revision_number: number | null;
    title: string;
  }>;

  return {
    course,
    levels: levels.map((level) => ({
      id: level.id,
      code: level.code,
      title: level.title,
      order: Number(level.order_index),
      status: level.status,
      units: units
        .filter((unit) => unit.level_id === level.id)
        .map((unit) => ({
          id: unit.id,
          slug: unit.slug,
          code: unit.code,
          title: unit.title,
          order: Number(unit.order_index),
          status: unit.status,
          lessons: lessons
            .filter((lesson) => lesson.unit_id === unit.id)
            .map((lesson) => ({
              id: lesson.id,
              slug: lesson.slug,
              code: lesson.code,
              title: lesson.title,
              order: Number(lesson.order_index),
              status: lesson.status,
              publishedRevisionNumber: lesson.published_revision_number === null ? null : Number(lesson.published_revision_number),
              draftRevisionNumber: lesson.draft_revision_number === null ? null : Number(lesson.draft_revision_number),
            })),
        })),
    })),
  };
}

async function createLevel(sql: ReturnType<typeof getSql>, body: Record<string, unknown>) {
  const code = cleanText(body.code, 20).toUpperCase();
  const title = cleanText(body.title);
  if (!code || !validCode(code) || !title) throw new Error('LEVEL_INPUT_INVALID');

  const courses = await sql`select id::text as id from courses where status = 'active' order by created_at limit 1` as unknown as Array<{ id: string }>;
  if (!courses[0]) throw new Error('COURSE_NOT_FOUND');
  const next = await sql`select coalesce(max(order_index), 0) + 1 as value from course_levels where course_id = ${courses[0].id}::uuid` as unknown as Array<{ value: number }>;
  const rows = await sql`
    insert into course_levels (course_id, code, title, order_index, status)
    values (${courses[0].id}::uuid, ${code}, ${title}, ${Number(next[0]?.value ?? 1)}, 'active')
    returning id::text as id
  ` as unknown as Array<{ id: string }>;
  return rows[0]?.id;
}

async function createUnit(sql: ReturnType<typeof getSql>, body: Record<string, unknown>) {
  const levelId = cleanText(body.levelId, 64);
  const slug = cleanText(body.slug, 100).toLowerCase();
  const code = cleanText(body.code, 40).toUpperCase();
  const title = cleanText(body.title);
  if (!levelId || !validSlug(slug) || !validCode(code) || !title) throw new Error('UNIT_INPUT_INVALID');

  const levels = await sql`select id::text as id from course_levels where id = ${levelId}::uuid and status = 'active' limit 1` as unknown as Array<{ id: string }>;
  if (!levels[0]) throw new Error('LEVEL_NOT_FOUND');
  const next = await sql`select coalesce(max(order_index), 0) + 1 as value from course_units where level_id = ${levelId}::uuid` as unknown as Array<{ value: number }>;
  const rows = await sql`
    insert into course_units (level_id, slug, code, title, order_index, status)
    values (${levelId}::uuid, ${slug}, ${code}, ${title}, ${Number(next[0]?.value ?? 1)}, 'active')
    returning id::text as id
  ` as unknown as Array<{ id: string }>;
  return rows[0]?.id;
}

async function createLesson(sql: ReturnType<typeof getSql>, body: Record<string, unknown>, author: string) {
  const unitId = cleanText(body.unitId, 64);
  const slug = cleanText(body.slug, 120).toLowerCase();
  const code = cleanText(body.code, 40).toUpperCase();
  const title = cleanText(body.title);
  if (!unitId || !validSlug(slug) || !validCode(code) || !title) throw new Error('LESSON_INPUT_INVALID');

  const units = await sql`
    select cu.id::text as id, cu.slug, cu.title, lower(cl.code) as level_id
    from course_units cu
    join course_levels cl on cl.id = cu.level_id
    where cu.id = ${unitId}::uuid and cu.status = 'active' and cl.status = 'active'
    limit 1
  ` as unknown as Array<{ id: string; slug: string; title: string; level_id: string }>;
  const unit = units[0];
  if (!unit) throw new Error('UNIT_NOT_FOUND');

  const next = await sql`select coalesce(max(order_index), 0) + 1 as value from lessons where unit_id = ${unitId}::uuid` as unknown as Array<{ value: number }>;
  const order = Number(next[0]?.value ?? 1);
  const lessonId = crypto.randomUUID();
  const revisionId = crypto.randomUUID();
  const content = {
    id: slug,
    levelId: unit.level_id,
    unitId: unit.slug,
    unitTitle: unit.title,
    order,
    title,
    subtitle: '',
    performance: 'TODO: describe the practical speaking outcome for this lesson.',
    coreLanguage: [],
    boundaries: [],
    source: {
      repository: 'englotti-studio',
      branch: 'studio',
      path: `studio/${slug}`,
      sourceLessonId: code,
    },
    scenes: [
      {
        id: 'scene-1',
        title: 'Scene 1',
        goal: 'TODO: define one small observable speaking outcome.',
        teaching: {
          explainInArabic: [],
          englishTargets: [],
          constraints: [],
        },
        interaction: {
          kind: 'elicitation',
          setup: 'TODO: describe the teaching setup.',
          learnerTask: 'TODO: describe what the learner should say.',
          teacherMoves: [],
          supportLadder: [],
        },
      },
    ],
  };

  await sql.transaction([
    sql`
      insert into lessons (id, unit_id, slug, code, order_index, status)
      values (${lessonId}::uuid, ${unitId}::uuid, ${slug}, ${code}, ${order}, 'active')
    `,
    sql`
      insert into lesson_revisions (id, lesson_id, revision_number, status, schema_version, content, created_by, change_note)
      values (${revisionId}::uuid, ${lessonId}::uuid, 1, 'draft', 1, ${content}, ${author}, 'New lesson created in Englotti Studio')
    `,
  ]);

  return lessonId;
}

async function setStatus(sql: ReturnType<typeof getSql>, entityType: CurriculumEntityType, entityId: string, status: 'active' | 'archived') {
  if (entityType === 'level') {
    const rows = await sql`update course_levels set status = ${status}, updated_at = now() where id = ${entityId}::uuid returning id`;
    return Boolean(rows[0]);
  }
  if (entityType === 'unit') {
    const rows = await sql`update course_units set status = ${status}, updated_at = now() where id = ${entityId}::uuid returning id`;
    return Boolean(rows[0]);
  }
  const rows = await sql`update lessons set status = ${status}, updated_at = now() where id = ${entityId}::uuid returning id`;
  return Boolean(rows[0]);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: jsonHeaders });

export const onRequestGet = async ({ request, env }: PagesContext) => {
  try {
    const access = await authorizeStudioRequest(request, env);
    if (!access.ok) return jsonResponse({ error: access.error }, access.status);
    const sql = getSql(env);
    return jsonResponse(await loadHierarchy(sql));
  } catch (reason) {
    console.error('[studio:curriculum:get]', reason);
    return jsonResponse({ error: 'Unable to load curriculum hierarchy.' }, 500);
  }
};

export const onRequestPost = async ({ request, env }: PagesContext) => {
  try {
    const access = await authorizeStudioRequest(request, env);
    if (!access.ok) return jsonResponse({ error: access.error }, access.status);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const action = body?.action as CurriculumAction | undefined;
    const sql = getSql(env);
    const author = access.auth.email || access.auth.userId;

    if (action === 'create-level') {
      const id = await createLevel(sql, body ?? {});
      return jsonResponse({ id });
    }
    if (action === 'create-unit') {
      const id = await createUnit(sql, body ?? {});
      return jsonResponse({ id });
    }
    if (action === 'create-lesson') {
      const id = await createLesson(sql, body ?? {}, author);
      return jsonResponse({ id });
    }
    if (action === 'archive' || action === 'restore') {
      const entityType = body?.entityType as CurriculumEntityType | undefined;
      const entityId = cleanText(body?.entityId, 64);
      if (!['level', 'unit', 'lesson'].includes(String(entityType)) || !entityId) return jsonResponse({ error: 'Invalid archive request.' }, 400);
      const updated = await setStatus(sql, entityType!, entityId, action === 'archive' ? 'archived' : 'active');
      if (!updated) return jsonResponse({ error: 'Curriculum item was not found.' }, 404);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: 'Invalid curriculum action.' }, 400);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : 'Curriculum action failed.';
    console.error('[studio:curriculum:post]', message);
    if (message === 'LEVEL_INPUT_INVALID') return jsonResponse({ error: 'Level code and title are required.' }, 400);
    if (message === 'UNIT_INPUT_INVALID') return jsonResponse({ error: 'Unit needs a level, lowercase slug, code and title.' }, 400);
    if (message === 'LESSON_INPUT_INVALID') return jsonResponse({ error: 'Lesson needs a unit, lowercase slug, code and title.' }, 400);
    if (message === 'LEVEL_NOT_FOUND' || message === 'UNIT_NOT_FOUND' || message === 'COURSE_NOT_FOUND') return jsonResponse({ error: 'Parent curriculum item was not found or is archived.' }, 404);
    if (/duplicate key|unique constraint/i.test(message)) return jsonResponse({ error: 'That code, slug or order already exists.' }, 409);
    return jsonResponse({ error: message }, 500);
  }
};
