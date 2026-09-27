import { authenticateRequest, type AuthEnv } from './auth';
import type { NeonEnv } from './neon';

export interface StudioEnv extends NeonEnv, AuthEnv {
  STUDIO_ADMIN_EMAILS?: string;
  STUDIO_ADMIN_USER_IDS?: string;
}

function splitAllowlist(value: string | undefined) {
  return new Set(
    (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export async function authorizeStudioRequest(request: Request, env: StudioEnv) {
  const auth = await authenticateRequest(request, env);
  if (!auth) return { ok: false as const, status: 401, error: 'Unauthorized.' };

  const allowedEmails = splitAllowlist(env.STUDIO_ADMIN_EMAILS);
  const allowedUserIds = splitAllowlist(env.STUDIO_ADMIN_USER_IDS);
  const email = auth.email?.trim().toLowerCase() ?? '';
  const normalizedEmails = new Set(Array.from(allowedEmails, (value) => value.toLowerCase()));

  if (!normalizedEmails.size && !allowedUserIds.size) {
    return { ok: false as const, status: 403, error: 'Englotti Studio admin access is not configured.' };
  }

  if ((email && normalizedEmails.has(email)) || allowedUserIds.has(auth.userId)) {
    return { ok: true as const, auth };
  }

  return { ok: false as const, status: 403, error: 'This account is not allowed to use Englotti Studio.' };
}
