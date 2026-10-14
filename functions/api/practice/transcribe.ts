import { authenticateRequest, type AuthEnv } from '../../_shared/auth';
import { jsonHeaders, jsonResponse } from '../../_shared/neon';
import { MAX_REQUEST_CHARS, parsePracticeWav, transcribePracticeAudio } from '../../_shared/practiceTranscribe';

interface Context { request: Request; env: AuthEnv & { GEMINI_API_KEY?: string } }
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

export async function onRequestPost({ request, env }: Context) {
  if (Number(request.headers.get('content-length') || 0) > MAX_REQUEST_CHARS)
    return jsonResponse({ error: 'Audio too large.' }, 413);
  let user;
  try { user = await authenticateRequest(request, env); }
  catch { return jsonResponse({ error: 'Authentication unavailable.' }, 503); }
  if (!user) return jsonResponse({ error: 'AUTH_REQUIRED' }, 401);
  let audioBase64: string;
  try {
    const body = await request.text();
    if (body.length > MAX_REQUEST_CHARS) return jsonResponse({ error: 'Audio too large.' }, 413);
    audioBase64 = parsePracticeWav((JSON.parse(body) as { audioBase64?: unknown }).audioBase64);
  } catch { return jsonResponse({ error: 'Invalid Practice audio.' }, 400); }
  try { return jsonResponse({ transcript: await transcribePracticeAudio(env, audioBase64) }); }
  catch { return jsonResponse({ error: 'Transcription temporarily unavailable.' }, 503); }
}
