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
    const summaryRows = await sql`
      select
        count(*) filter (where status = 'completed')::int as completed_sessions,
        count(distinct coalesce(metadata->>'scenarioId', application_id))
          filter (where status = 'completed' and coalesce(metadata->>'scenarioId', application_id) is not null)::int as scenarios_practised
      from speaking_sessions
      where user_id = ${auth.userId}
    `;
    const skillRows = await sql`
      select
        ic.slug as skill_id,
        count(*) filter (where sco.result in ('independent', 'supported'))::int as observations,
        count(*) filter (where sco.result = 'independent')::int as demonstrated,
        count(*) filter (where sco.result = 'supported')::int as emerging,
        max(sco.created_at) filter (where sco.result in ('independent', 'supported')) as last_observed_at
      from speaking_capability_observations sco
      join interaction_capabilities ic on ic.id = sco.capability_id
      where sco.user_id = ${auth.userId}
      group by ic.slug
      order by max(sco.created_at) desc
    `;
    const summary = summaryRows[0] as Record<string, unknown> | undefined;
    const skills = skillRows.map((row) => {
      const value = row as Record<string, unknown>;
      return {
        skillId: String(value.skill_id ?? ''),
        observations: Number(value.observations ?? 0),
        demonstrated: Number(value.demonstrated ?? 0),
        emerging: Number(value.emerging ?? 0),
        lastObservedAt: value.last_observed_at ? String(value.last_observed_at) : null,
      };
    });
    return jsonResponse({
      progress: {
        completedSessions: Number(summary?.completed_sessions ?? 0),
        scenariosPractised: Number(summary?.scenarios_practised ?? 0),
        skillsObserved: skills.filter((item) => item.observations > 0).length,
        skills,
      },
    });
  } catch (reason) {
    console.error('[speaking/progress:get]', reason);
    return jsonResponse({ error: 'Unable to load speaking progress.' }, 500);
  }
};
