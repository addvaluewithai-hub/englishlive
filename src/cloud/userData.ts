import { getAuthJwt } from '../auth/client';
import { apiUrl } from '../config/api';
import type { LearnerProfile } from '../product/profile';
import type { ProductCourseProgress } from '../productV2/progress';

async function authorizedJson(path: string, init: RequestInit = {}) {
  const token = await getAuthJwt();
  if (!token) throw new Error('AUTH_REQUIRED');
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
      authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    const message = typeof payload?.error === 'string' ? payload.error : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return payload;
}

export async function fetchCloudProfile(): Promise<LearnerProfile | null> {
  const payload = await authorizedJson('/api/me/profile');
  const profile = payload?.profile;
  if (!profile || typeof profile !== 'object') return null;
  return profile as LearnerProfile;
}

export async function saveCloudProfile(profile: LearnerProfile): Promise<LearnerProfile> {
  const payload = await authorizedJson('/api/me/profile', {
    method: 'PUT',
    body: JSON.stringify({
      firstName: profile.firstName,
      goals: profile.goals,
      comfort: profile.comfort,
      characterId: profile.characterId,
    }),
  });
  return payload?.profile as LearnerProfile;
}

export async function fetchCloudProgress(): Promise<ProductCourseProgress> {
  const payload = await authorizedJson('/api/me/progress');
  return {
    version: 1,
    lessons: payload?.lessons && typeof payload.lessons === 'object'
      ? payload.lessons as ProductCourseProgress['lessons']
      : {},
    updatedAt: new Date().toISOString(),
  };
}

export async function startCloudLessonSession(input: {
  lessonRevisionId: string;
  characterRevisionId: string;
  teachingPolicyRevisionId: string;
  clientContext?: Record<string, unknown>;
}) {
  const payload = await authorizedJson('/api/me/session', {
    method: 'POST',
    body: JSON.stringify({ event: 'start', ...input }),
  });
  if (typeof payload?.sessionId !== 'string') throw new Error('Session API did not return a session id.');
  return payload.sessionId;
}

export async function recordCloudSceneResult(input: {
  sessionId: string;
  sceneId: string;
  sceneIndex: number;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  await authorizedJson('/api/me/session', {
    method: 'POST',
    body: JSON.stringify({ event: 'scene', ...input }),
  });
}

export async function completeCloudLessonSession(sessionId: string, summary: Record<string, unknown> = {}) {
  await authorizedJson('/api/me/session', {
    method: 'POST',
    body: JSON.stringify({ event: 'complete', sessionId, summary }),
  });
}

export async function abandonCloudLessonSession(sessionId: string) {
  await authorizedJson('/api/me/session', {
    method: 'POST',
    body: JSON.stringify({ event: 'abandon', sessionId }),
  });
}
