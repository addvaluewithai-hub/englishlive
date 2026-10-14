import { getAuthJwt } from '../auth/client';
import { apiUrl } from '../config/api';

/** Sends one bounded in-memory voice turn; server owns the API key. */
export async function transcribePracticeTurn(audioBase64: string): Promise<string> {
  const token = await getAuthJwt();
  if (!token) throw new Error('AUTH_REQUIRED');
  const response = await fetch(apiUrl('/api/practice/transcribe'), {
    method: 'POST',
    signal: AbortSignal.timeout(24_000),
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ audioBase64 }),
  });
  const payload = await response.json() as { transcript?: string; error?: string };
  if (!response.ok || !payload.transcript?.trim()) throw new Error(payload.error || 'Transcription unavailable.');
  return payload.transcript.trim();
}
