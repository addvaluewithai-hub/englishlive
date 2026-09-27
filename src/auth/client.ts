import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

const DEFAULT_NEON_AUTH_URL = 'https://ep-lucky-sound-b4k7l37j.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth';

export const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL?.trim() || DEFAULT_NEON_AUTH_URL;

export const authClient = createAuthClient(NEON_AUTH_URL, {
  adapter: BetterAuthReactAdapter(),
});

export type EnglottiAuthSession = NonNullable<ReturnType<typeof authClient.useSession>['data']>;

export async function getAuthJwt() {
  const token = await authClient.getJWTToken?.();
  return typeof token === 'string' && token.length > 0 ? token : null;
}
