import { getAuthJwt } from '../auth/client';
import { apiUrl } from '../config/api';
import type { SpeakingCloudSession, SpeakingProgressSnapshot, SpeakingScenarioSnapshot, SpeakingTurn } from './types';

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
    const error = new Error(message) as Error & { payload?: Record<string, unknown> | null };
    error.payload = payload;
    throw error;
  }
  return payload;
}

function sessionFrom(payload: Record<string, unknown> | null) {
  const session = payload?.session;
  if (!session || typeof session !== 'object') throw new Error('Speaking API did not return a session.');
  return session as SpeakingCloudSession;
}

export async function createSpeakingSession(input: {
  scenarioId: string;
  difficulty: 'easier' | 'recommended' | 'challenge';
  sessionKind?: 'guided_practice' | 'world_scenario';
  characterSlug: string;
  scenarioSnapshot: SpeakingScenarioSnapshot;
}) {
  return sessionFrom(await authorizedJson('/api/speaking/sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  }));
}

export async function saveSpeakingTranscript(sessionId: string, transcript: SpeakingTurn[], durationSeconds: number) {
  return sessionFrom(await authorizedJson(`/api/speaking/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ transcript, durationSeconds }),
  }));
}

export async function finalizeSpeakingSessionWithoutAnalysis(sessionId: string, transcript: SpeakingTurn[], durationSeconds: number) {
  return sessionFrom(await authorizedJson(`/api/speaking/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ transcript, durationSeconds, complete: true }),
  }));
}

export async function completeSpeakingSession(sessionId: string, transcript: SpeakingTurn[], durationSeconds: number) {
  return sessionFrom(await authorizedJson(`/api/speaking/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PUT',
    body: JSON.stringify({ transcript, durationSeconds }),
  }));
}

export async function analyzeSpeakingSession(sessionId: string) {
  return sessionFrom(await authorizedJson(`/api/speaking/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'POST',
  }));
}

export async function fetchSpeakingSession(sessionId: string) {
  return sessionFrom(await authorizedJson(`/api/speaking/sessions/${encodeURIComponent(sessionId)}`));
}

export async function fetchSpeakingProgress() {
  const payload = await authorizedJson('/api/speaking/progress');
  const progress = payload?.progress;
  if (!progress || typeof progress !== 'object') throw new Error('Speaking progress API did not return progress.');
  return progress as SpeakingProgressSnapshot;
}
