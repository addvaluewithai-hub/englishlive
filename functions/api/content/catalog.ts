import { getSql, jsonHeaders, jsonResponse, type NeonEnv } from '../../_shared/neon';

interface PagesContext {
  request: Request;
  env: NeonEnv;
}

interface CatalogRow {
  course_slug: string;
  course_title: string;
  level_id: string;
  level_code: string;
  level_title: string;
  level_order: number;
  unit_slug: string;
  unit_code: string;
  unit_title: string;
  unit_order: number;
  lesson_slug: string;
  lesson_code: string;
  lesson_order: number;
  revision_id: string;
  revision_number: number;
  content: unknown;
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: jsonHeaders });

export const onRequestGet = async ({ request, env }: PagesContext) => {
  try {
    const url = new URL(request.url);
    const courseSlug = url.searchParams.get('course')?.trim() || 'englotti-english';
    const sql = getSql(env);
    const rows = await sql`
      select
        c.slug as course_slug,
        c.title as course_title,
        lower(cl.code) as level_id,
        cl.code as level_code,
        cl.title as level_title,
        cl.order_index as level_order,
        cu.slug as unit_slug,
        cu.code as unit_code,
        cu.title as unit_title,
        cu.order_index as unit_order,
        l.slug as lesson_slug,
        l.code as lesson_code,
        l.order_index as lesson_order,
        lr.id::text as revision_id,
        lr.revision_number,
        lr.content
      from courses c
      join course_levels cl on cl.course_id = c.id
      join course_units cu on cu.level_id = cl.id
      join lessons l on l.unit_id = cu.id
      join lesson_revisions lr on lr.id = l.published_revision_id
      where c.slug = ${courseSlug}
        and c.status = 'active'
        and cl.status = 'active'
        and cu.status = 'active'
        and l.status = 'active'
        and lr.status = 'published'
      order by cl.order_index, cu.order_index, l.order_index
    ` as unknown as CatalogRow[];

    if (!rows.length) return jsonResponse({ error: 'Published course catalog was not found.' }, 404);

    const first = rows[0];
    const levels: Array<{
      id: string;
      code: string;
      title: string;
      order: number;
      units: Array<{
        id: string;
        code: string;
        title: string;
        order: number;
        lessons: Array<{
          id: string;
          code: string;
          order: number;
          revisionId: string;
          revisionNumber: number;
          content: unknown;
        }>;
      }>;
    }> = [];

    for (const row of rows) {
      let level = levels.find((item) => item.id === row.level_id);
      if (!level) {
        level = {
          id: row.level_id,
          code: row.level_code,
          title: row.level_title,
          order: Number(row.level_order),
          units: [],
        };
        levels.push(level);
      }
      let unit = level.units.find((item) => item.id === row.unit_slug);
      if (!unit) {
        unit = {
          id: row.unit_slug,
          code: row.unit_code,
          title: row.unit_title,
          order: Number(row.unit_order),
          lessons: [],
        };
        level.units.push(unit);
      }
      unit.lessons.push({
        id: row.lesson_slug,
        code: row.lesson_code,
        order: Number(row.lesson_order),
        revisionId: row.revision_id,
        revisionNumber: Number(row.revision_number),
        content: row.content,
      });
    }

    return jsonResponse({
      source: 'neon',
      course: { slug: first.course_slug, title: first.course_title },
      levels,
    }, 200, 'no-store');
  } catch (reason) {
    console.error('[content/catalog]', reason);
    return jsonResponse({ error: 'Unable to load published course catalog.' }, 500);
  }
};
