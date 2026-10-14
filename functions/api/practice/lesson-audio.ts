import { authenticateRequest, type AuthEnv } from '../../_shared/auth';
import { jsonHeaders, jsonResponse } from '../../_shared/neon';
import { buildLessonAudioRequest, extractLessonWav } from '../../_shared/lessonAudio';
import { practiceMissionContractBySlug } from '../../../src/practice/missions/catalog';
import { LESSON_TTS_MODEL } from '../../../src/practice/audio/lessonDialogue';

interface Context { request: Request; env: AuthEnv & { GEMINI_API_KEY?: string } }
type EdgeCaches = CacheStorage & { default?: Cache };

const audioHeaders = {
  ...jsonHeaders, 'content-type': 'audio/wav',
  'cache-control': 'private, max-age=3600',
};

export const onRequestOptions = () => new Response(null, { status: 204, headers: jsonHeaders });

/** Authenticated, mission-scoped audio. Only reviewed, public lesson script goes to Gemini. */
export async function onRequestPost({ request, env }: Context) {
  if (Number(request.headers.get('content-length') || 0) > 1000) {
    return jsonResponse({ error: 'Invalid audio request.' }, 413);
  }
  let auth;
  try { auth = await authenticateRequest(request, env); }
  catch { return jsonResponse({ error: 'Authentication unavailable.' }, 503); }
  if (!auth) return jsonResponse({ error: 'AUTH_REQUIRED' }, 401);
  const raw = await request.text().catch(() => '');
  if (raw.length > 1000) return jsonResponse({ error: 'Request too large.' }, 413);
  let input: { missionSlug?: unknown } | null = null;
  try { input = JSON.parse(raw) as { missionSlug?: unknown }; } catch { /* invalid */ }
  const slug = typeof input?.missionSlug === 'string' ? input.missionSlug : '';
  const mission = practiceMissionContractBySlug(slug);
  const ttsRequest = buildLessonAudioRequest(slug);
  if (!mission || !ttsRequest) return jsonResponse({ error: 'Unknown lesson.' }, 400);

  // Auth comes before the cache lookup. Audio is indexed only by curated
  // mission content, not by user or raw learner dialogue.
  const cacheKey = new Request(new URL('/__practice-audio/' +
    encodeURIComponent(slug) + '/' + mission.revision + '/' + LESSON_TTS_MODEL + '.wav', request.url).toString());
  const cache = typeof caches !== 'undefined' ? (caches as EdgeCaches).default : undefined;
  const hit = await cache?.match(cacheKey).catch(() => null);
  if (hit) return new Response(hit.body, { headers: { ...audioHeaders, 'x-lesson-audio-cache': 'HIT' } });

  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) return jsonResponse({ error: 'Audio service unavailable.' }, 503);
  try {
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      signal: AbortSignal.timeout(90_000),
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(ttsRequest),
    });
    if (!upstream.ok) {
      console.warn('[lesson-audio] Gemini status', upstream.status);
      return jsonResponse({ error: 'Example audio could not be generated. Try again.' }, 502);
    }
    const audio = extractLessonWav(await upstream.json());
    // Cloudflare edge caching is best effort and region-local. Later we can
    // replace it with pre-generated R2/static assets for guaranteed instant starts.
    if (cache) {
      await cache.put(cacheKey, new Response(audio.slice(), {
        headers: { 'content-type': 'audio/wav', 'cache-control': 'public, max-age=2592000' },
      })).catch(() => undefined);
    }
    return new Response(audio, { headers: { ...audioHeaders, 'x-lesson-audio-cache': 'MISS' } });
  } catch (error) {
    console.warn('[lesson-audio]', error instanceof Error ? error.message : 'failed');
    return jsonResponse({ error: 'Example audio is unavailable right now.' }, 502);
  }
}
