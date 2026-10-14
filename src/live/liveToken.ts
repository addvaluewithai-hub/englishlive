import { apiUrl } from '../config/api';
import type { LiveTokenResponse } from './types';

/** Ask the trusted server for a single-use ephemeral Live token. Never exposes the API key. */
export async function fetchLiveToken(): Promise<LiveTokenResponse> {
  const response = await fetch(apiUrl('/api/gemini-token'), {
    method: 'POST',
    headers: { accept: 'application/json' },
  });
  const payload = (await response.json().catch(() => null)) as
    | { token?: string; model?: string; error?: string }
    | null;
  if (!response.ok || !payload?.token || !payload.model) {
    throw new Error(payload?.error || `Could not start voice session (${response.status}).`);
  }
  return { token: payload.token, model: payload.model };
}
