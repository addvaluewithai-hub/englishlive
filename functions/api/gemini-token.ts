import { DEFAULT_LIVE_MODEL } from '../../src/live/models';

interface TokenEnv {
  GEMINI_API_KEY?: string;
}

interface PagesContext {
  request: Request;
  env: TokenEnv;
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
    return new Response(JSON.stringify({ error: 'Origin not allowed.' }), { status: 403, headers: responseHeaders });
  }
  const apiKey = context.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' }), { status: 503, headers: responseHeaders });
  }

  const now = Date.now();
  const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      uses: 1,
      expireTime: new Date(now + 30 * 60_000).toISOString(),
      newSessionExpireTime: new Date(now + 60_000).toISOString(),
      liveConnectConstraints: {
        model: `models/${DEFAULT_LIVE_MODEL}`,
        config: {
          responseModalities: ['AUDIO'],
          sessionResumption: {},
        },
      },
    }),
  });

  const payload = (await upstream.json().catch(() => null)) as { name?: string; error?: { message?: string } } | null;
  if (!upstream.ok || !payload?.name) {
    return new Response(
      JSON.stringify({ error: payload?.error?.message || `Gemini token request failed (${upstream.status}).` }),
      { status: 502, headers: responseHeaders },
    );
  }

  return new Response(JSON.stringify({ token: payload.name, model: DEFAULT_LIVE_MODEL }), {
    status: 200,
    headers: responseHeaders,
  });
}
