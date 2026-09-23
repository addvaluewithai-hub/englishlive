const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'access-control-allow-origin': '*',
};

export const onRequestGet = async () =>
  new Response(
    JSON.stringify({
      ok: true,
      service: 'englishlive-api',
      version: '0.1.0',
    }),
    { status: 200, headers },
  );

export const onRequestOptions = async () =>
  new Response(null, {
    status: 204,
    headers: {
      ...headers,
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type, authorization',
    },
  });
