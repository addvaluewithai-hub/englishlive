import { learnV2ListeningClipById } from '../../src/learnV2/catalog';

interface ListeningEnv {
  GEMINI_API_KEY?: string;
}

interface PagesContext {
  request: Request;
  env: ListeningEnv;
}

interface InteractionAudioPart {
  type?: string;
  data?: string;
  mime_type?: string;
  mimeType?: string;
}

interface InteractionStep {
  content?: InteractionAudioPart[];
}

interface InteractionResponse {
  steps?: InteractionStep[];
  error?: { message?: string };
}

function base64Bytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

export async function onRequestGet(context: PagesContext) {
  const requestUrl = new URL(context.request.url);
  const clipId = requestUrl.searchParams.get('clip')?.trim();
  const clip = learnV2ListeningClipById(clipId);
  if (!clip) return jsonError('Unknown listening clip.', 404);

  const apiKey = context.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return jsonError('GEMINI_API_KEY is not configured.', 503);

  try {
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      signal: AbortSignal.timeout(35_000),
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'gemini-3.8-flash-tts',
        input: [{
          type: 'user_input',
          content: clip.turns.map((turn) => ({
            type: 'text',
            text: turn.text,
            annotations: [{
              type: 'speech_metadata',
              speaker: turn.speaker,
              ...(turn.style ? { style: turn.style } : {}),
            }],
          })),
        }],
        response_format: {
          type: 'audio',
          mime_type: 'audio/wav',
          sample_rate: 24_000,
        },
        generation_config: {
          speech_config: {
            mode: 'conversational',
            speakers: clip.speakers,
          },
        },
      }),
    });

    const payload = await upstream.json().catch(() => null) as InteractionResponse | null;
    if (!upstream.ok || !payload) {
      const message = payload?.error?.message || `Gemini TTS failed (${upstream.status}).`;
      console.warn('Learn V2 listening generation failed', { clipId, upstreamStatus: upstream.status });
      return jsonError(message, 502);
    }

    const audioPart = payload.steps
      ?.flatMap((step) => step.content ?? [])
      .filter((part) => part.type === 'audio' && part.data)
      .at(-1);
    if (!audioPart?.data) return jsonError('Gemini TTS returned no audio.', 502);

    const audio = base64Bytes(audioPart.data);
    return new Response(audio, {
      status: 200,
      headers: {
        'content-type': audioPart.mime_type || audioPart.mimeType || 'audio/wav',
        'content-length': String(audio.byteLength),
        'cache-control': 'public, max-age=86400, s-maxage=604800, immutable',
        'x-content-type-options': 'nosniff',
        'content-disposition': `inline; filename="${clip.id}.wav"`,
      },
    });
  } catch (reason) {
    console.warn('Learn V2 listening generation did not respond', { clipId, reason: reason instanceof Error ? reason.message : String(reason) });
    return jsonError('Listening audio is temporarily unavailable.', 502);
  }
}
