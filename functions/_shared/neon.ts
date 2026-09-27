import { neon } from '@neondatabase/serverless';

export interface NeonEnv {
  DATABASE_URL?: string;
}

export function getSql(env: NeonEnv) {
  const connectionString = env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error('DATABASE_URL is not configured.');
  return neon(connectionString);
}

export const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization',
};

export function jsonResponse(body: unknown, status = 200, cacheControl = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...jsonHeaders,
      'cache-control': cacheControl,
    },
  });
}
