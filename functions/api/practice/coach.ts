import { authenticateRequest, type AuthEnv } from '../../_shared/auth';
import { jsonHeaders, jsonResponse } from '../../_shared/neon';
import { analyzePractice, parseCoachInput, type PracticeCoachEnv } from '../../_shared/practiceCoach';

interface Context { request: Request; env: AuthEnv & PracticeCoachEnv }
export async function onRequestOptions() { return new Response(null, { status: 204, headers: jsonHeaders }); }
export async function onRequestPost({ request, env }: Context) {
  if (Number(request.headers.get('content-length') || 0) > 100_000) return jsonResponse({ error: 'Request too large.' }, 413);
  let user;
  try { user = await authenticateRequest(request, env); } catch { return jsonResponse({ error: 'Authentication unavailable.' }, 503); }
  if (!user) return jsonResponse({ error: 'AUTH_REQUIRED' }, 401);
  let input;
  try {
    const body = await request.text();
    if (body.length > 100_000) return jsonResponse({ error: 'Request too large.' }, 413);
    input = parseCoachInput(JSON.parse(body));
  } catch { return jsonResponse({ error: 'Invalid Practice review request.' }, 400); }
  try { return jsonResponse({ result: await analyzePractice(env, input) }); }
  catch { return jsonResponse({ error: 'الملاحظات مش متاحة دلوقتي. تقدر تكمل كلامك عادي.' }, 503); }
}
