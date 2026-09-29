import { getAuthJwt } from '../auth/client';
import { apiUrl } from '../config/api';
import type { FreeSpeakCloudSession, FreeSpeakTurn } from './types';

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

function sessionFrom(payload: Record<string, unknown> | null) {
  const session = payload?.session;
  if (!session || typeof session !== 'object') throw new Error('Free Speak API did not return a session.');
  return session as FreeSpeakCloudSession;
}

export async function createFreeSpeakSession(input: { modeId: string; characterSlug: string }) {
  return sessionFrom(await authorizedJson('/api/free-speak/sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  }));
}

export async function saveFreeSpeakTranscript(sessionId: string, transcript: FreeSpeakTurn[], durationSeconds: number) {
  return sessionFrom(await authorizedJson(`/api/free-speak/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ transcript, durationSeconds }),
  }));
}

export async function completeFreeSpeakSession(sessionId: string, transcript: FreeSpeakTurn[], durationSeconds: number) {
  return sessionFrom(await authorizedJson(`/api/free-speak/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PUT',
    body: JSON.stringify({ transcript, durationSeconds }),
  }));
}

export async function analyzeFreeSpeakSession(sessionId: string) {
  const session = sessionFrom(await authorizedJson(`/api/free-speak/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'POST',
  }));
  if (!session.analysis && session.analysisStatus === 'error') {
    throw new Error('Recap analysis did not complete.');
  }
  return session;
}

export async function fetchFreeSpeakSession(sessionId: string) {
  return sessionFrom(await authorizedJson(`/api/free-speak/sessions/${encodeURIComponent(sessionId)}`));
}

export async function fetchLatestFreeSpeakSession() {
  const payload = await authorizedJson('/api/free-speak/sessions');
  const session = payload?.session;
  if (!session || typeof session !== 'object') return null;
  return session as FreeSpeakCloudSession;
}
