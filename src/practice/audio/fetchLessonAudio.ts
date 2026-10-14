import { getAuthJwt } from '../../auth/client';
import { apiUrl } from '../../config/api';

/** Fetch a complete generated WAV. No credentials or learner speech are sent to TTS. */
export async function fetchLessonAudio(missionSlug: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const jwt = await getAuthJwt();
  if (!jwt) throw new Error('Sign in to play the example.');
  const response = await fetch(apiUrl('/api/practice/lesson-audio'), {
    method: 'POST', signal,
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + jwt },
    body: JSON.stringify({ missionSlug }),
  });
  if (!response.ok) throw new Error('Example audio could not be loaded.');
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < 44 || buffer.byteLength > 11_000_000) throw new Error('Invalid example recording.');
  return buffer;
}
