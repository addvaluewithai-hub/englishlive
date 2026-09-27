import { authenticateRequest } from '../../_shared/auth';
import { getSql, jsonHeaders, jsonResponse, type NeonEnv } from '../../_shared/neon';

interface PagesContext {
  request: Request;
  env: NeonEnv;
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: jsonHeaders });

export const onRequestGet = async ({ request, env }: PagesContext) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized.' }, 401);
    const sql = getSql(env);
    const rows = await sql`
      select
        l.slug as lesson_id,
        lp.status,
        lp.attempt_count,
        lp.first_started_at,
        lp.last_started_at,
        lp.completed_at,
        lp.updated_at
      from lesson_progress lp
      join lessons l on l.id = lp.lesson_id
      where lp.user_id = ${auth.userId}
      order by lp.updated_at asc
    `;

    const lessons: Record<string, unknown> = {};
    for (const value of rows as Array<Record<string, unknown>>) {
      const lessonId = typeof value.lesson_id === 'string' ? value.lesson_id : '';
      if (!lessonId) continue;
      lessons[lessonId] = {
        lessonId,
        status: value.status,
        attemptCount: Number(value.attempt_count ?? 0),
        startedAt: value.first_started_at ?? value.last_started_at ?? undefined,
        completedAt: value.completed_at ?? undefined,
        updatedAt: value.updated_at,
      };
    }

    return jsonResponse({ version: 1, lessons });
  } catch (reason) {
    console.error('[me/progress:get]', reason);
    return jsonResponse({ error: 'Unable to load learner progress.' }, 500);
  }
};
