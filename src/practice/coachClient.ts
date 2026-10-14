import { getAuthJwt } from '../auth/client';
import { apiUrl } from '../config/api';
import type { CoachInput, CoachResult } from './conversationTypes';

export async function requestPracticeCoach(input: CoachInput, signal?: AbortSignal): Promise<CoachResult> {
  const token = await getAuthJwt();
  if (!token) throw new Error('AUTH_REQUIRED');
  const response = await fetch(apiUrl('/api/practice/coach'), {
    method: 'POST',
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(25_000)]) : AbortSignal.timeout(25_000),
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  const payload = await response.json() as { result?: CoachResult; error?: string };
  if (!response.ok || !payload.result) throw new Error(payload.error || 'Practice feedback is unavailable.');
  return payload.result;
}
