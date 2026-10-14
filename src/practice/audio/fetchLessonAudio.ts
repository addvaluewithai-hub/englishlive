import { getAuthJwt } from '../../auth/client';
import { apiUrl } from '../../config/api';

/** Same mission recording is requested once and reused by the player. */
export async function fetchLessonAudio(missionSlug: string, signal: AbortSignal): Promise<Blob> {
  const jwt = await getAuthJwt();
  if (!jwt) throw new Error('AUTH_REQUIRED');
  const response = await fetch(apiUrl('/api/practice/lesson-audio'), {
    method: 'POST', signal,
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + jwt },
    body: JSON.stringify({ missionSlug }),
  });
  if (!response.ok) throw new Error('Audio unavailable.');
  const blob = await response.blob();
  if (blob.size < 44 || blob.size > 11_000_000 || !blob.type.includes('audio/')) {
    throw new Error('Invalid audio file.');
  }
  return blob;
}
