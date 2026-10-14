import { authenticateRequest, type AuthEnv } from '../../_shared/auth';
import { jsonHeaders, jsonResponse } from '../../_shared/neon';
import { buildLessonAudioRequest, extractLessonWav } from '../../_shared/lessonAudio';
import { practiceMissionContractBySlug } from '../../../src/practice/missions/catalog';
import { LESSON_TTS_MODEL } from '../../../src/practice/audio/lessonDialogue';

interface Context { request: Request; env: AuthEnv & { GEMINI_API_KEY?: string } }
type EdgeCaches = CacheStorage & { default?: Cache };

export const onRequestOptions = () => new Response(null, { status: 204, headers: jsonHeaders });

export async function onRequestPost({ request, env }: Context) {
  if (Number(request.headers.get('content-length') || 0) > 1000) {
    return jsonResponse({ error: 'Invalid lesson audio request.' }, 413);
  }
  let auth;
  try { auth = await authenticateRequest(request, env); }
  catch { return jsonResponse({ error: 'Authentication unavailable.' }, 503); }
  if (!auth) return jsonResponse({ error: 'AUTH_REQUIRED' }, 401);
  const body = await request.json().catch(() => null) as { missionSlug?: unknown } | null;
  const slug = typeof body?.missionSlug === 'string' ? body.missionSlug : '';
  const mission = practiceMissionContractBySlug(slug);
  const ttsRequest = buildLessonAudioRequest(slug);
  if (!mission || !ttsRequest) return jsonResponse({ error: 'Unknown lesson.' }, 400);

  // Only authored mission lines are synthesized. Never cache user input or Live audio.
  const cacheKey = new Request(new URL('/api/practice/lesson-audio/' +
    encodeURIComponent(slug) + '/' + mission.revision + '/' + LESSON_TTS_MODEL, request.url).toString());
  const cache = (typeof caches !== 'undefined' ? (caches as EdgeCaches).default : undefined);
  const cached = await cache?.match(cacheKey);
  if (cached) return new Response(cached.body, { status: 200, headers: {
    ...jsonHeaders, 'content-type': 'audio/wav', 'x-lesson-audio-cache': 'HIT',
    'cache-control': 'private, max-age=3600',
  } });

  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) return jsonResponse({ error: 'Lesson audio unavailable.' }, 503);
  try {
    const result = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      signal: AbortSignal.timeout(90_000),
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(ttsRequest),
    });
    if (!result.ok) {
      console.warn('[lesson-audio] Gemini TTS rejected request', result.status);
      return jsonResponse({ error: 'Lesson audio unavailable.' }, 502);
    }
    const wav = extractLessonWav(await result.json());
    const response = new Response(wav, { status: 200, headers: {
      ...jsonHeaders, 'content-type': 'audio/wav', 'cache-control': 'private, max-age=3600',
      'x-lesson-audio-cache': 'MISS',
    } });
    // Cache by authored lesson revision; persistent assets can replace this endpoint later.
    if (cache) {
      const forCache = new Response(wav, { headers: {
        'content-type': 'audio/wav', 'cache-control': 'public, max-age=2592000',
      } });
      await cache.put(cacheKey, forCache).catch(() => undefined);
    }
    return response;
  } catch (error) {
    console.warn('[lesson-audio] unavailable', error instanceof Error ? error.message : 'unknown');
    return jsonResponse({ error: 'Lesson audio unavailable.' }, 502);
  }
}
