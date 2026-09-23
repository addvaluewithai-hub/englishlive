import { DEFAULT_LIVE_MODEL } from '../../src/live/models';

interface TokenEnv {
  GEMINI_API_KEY?: string;
}

interface PagesContext {
  request: Request;
  env: TokenEnv;
}

interface GoogleFailure {
  error?: {
    message?: string;
    details?: Array<{ reason?: string }>;
  };
}

const nativeOrigins = new Set([
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
]);

function allowedOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  if (nativeOrigins.has(origin)) return origin;
  try {
    if (new URL(origin).host === new URL(request.url).host) return origin;
  } catch {
    return null;
  }
  return null;
}

function headers(request: Request) {
  const origin = allowedOrigin(request);
  return {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...(origin ? { 'access-control-allow-origin': origin, vary: 'origin' } : {}),
  };
}

function classifyFailure(status: number, failure: GoogleFailure) {
  const reasons = failure.error?.details?.map((detail) => detail.reason ?? '') ?? [];
  const message = failure.error?.message ?? '';
  if (reasons.includes('API_KEY_INVALID') || /API key not valid|API key expired/i.test(message)) {
    return 'Gemini API key is invalid or expired.';
  }
  if (status === 401 || status === 403) return 'Gemini API access was denied.';
  if (status === 429) return 'Gemini rate limit reached. Try again shortly.';
  if (status === 400) return 'Gemini rejected the live-token configuration.';
  return `Gemini token service failed (${status}).`;
}

export async function onRequestOptions(context: PagesContext) {
  const origin = allowedOrigin(context.request);
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      ...headers(context.request),
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}

export async function onRequestPost(context: PagesContext) {
  const responseHeaders = headers(context.request);
  if (!allowedOrigin(context.request)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed.' }), {
      status: 403,
      headers: responseHeaders,
    });
  }

  const apiKey = context.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' }), {
      status: 503,
      headers: responseHeaders,
    });
  }

  const now = Date.now();
  try {
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        uses: 1,
        expireTime: new Date(now + 30 * 60_000).toISOString(),
        newSessionExpireTime: new Date(now + 60_000).toISOString(),
        // Raw REST AuthToken schema. Lock only model + audio modality so the
        // browser can still supply the system prompt, tools, transcription,
        // VAD and session-resumption settings in BidiGenerateContentSetup.
        fieldMask: 'model,generationConfig.responseModalities',
        bidiGenerateContentSetup: {
          model: `models/${DEFAULT_LIVE_MODEL}`,
          generationConfig: { responseModalities: ['AUDIO'] },
        },
      }),
    });

    const payload = (await upstream.json().catch(() => null)) as
      | { name?: string; error?: GoogleFailure['error'] }
      | null;
    if (!upstream.ok || !payload?.name) {
      const error = classifyFailure(upstream.status, payload ?? {});
      console.warn('Gemini token issuance failed', { upstreamStatus: upstream.status });
      return new Response(JSON.stringify({ error }), {
        status: 502,
        headers: responseHeaders,
      });
    }

    return new Response(
      JSON.stringify({
        token: payload.name,
        model: DEFAULT_LIVE_MODEL,
        expiresAt: new Date(now + 30 * 60_000).toISOString(),
      }),
      { status: 200, headers: responseHeaders },
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Gemini token service did not respond.' }), {
      status: 502,
      headers: responseHeaders,
    });
  }
}
