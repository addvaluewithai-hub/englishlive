import { getAuthJwt } from '../auth/client';
import { apiUrl } from '../config/api';
import type { StudioEntityType, StudioOverview, StudioRevision } from './types';

async function authorizedStudioRequest(path: string, init: RequestInit = {}) {
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
    const message = typeof payload?.error === 'string' ? payload.error : `Studio request failed (${response.status}).`;
    throw new Error(message);
  }
  return payload ?? {};
}

function studioRequest(init: RequestInit = {}) {
  return authorizedStudioRequest('/api/studio', init);
}

export async function loadStudioOverview(): Promise<StudioOverview> {
  return await studioRequest() as unknown as StudioOverview;
}

export async function createStudioDraft(entityType: StudioEntityType, entityId: string) {
  const payload = await studioRequest({
    method: 'POST',
    body: JSON.stringify({ action: 'create-draft', entityType, entityId }),
  });
  return payload.revision as StudioRevision;
}

export async function saveStudioDraft(input: {
  entityType: StudioEntityType;
  entityId: string;
  revisionId: string;
  content: Record<string, unknown>;
  changeNote?: string;
}) {
  const payload = await studioRequest({
    method: 'POST',
    body: JSON.stringify({ action: 'save-draft', ...input }),
  });
  return payload.revision as StudioRevision;
}

export async function publishStudioDraft(input: {
  entityType: StudioEntityType;
  entityId: string;
  revisionId: string;
}) {
  const payload = await studioRequest({
    method: 'POST',
    body: JSON.stringify({ action: 'publish', ...input }),
  });
  return payload.revision as StudioRevision;
}

export async function duplicateStudioEntity(input:
  | { entityType: 'character'; sourceEntityId: string; slug: string; displayName: string }
  | { entityType: 'lesson'; sourceEntityId: string; slug: string; code: string; title: string }
) {
  const payload = await authorizedStudioRequest('/api/studio/duplicate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const entityId = typeof payload.entityId === 'string' ? payload.entityId : '';
  if (!entityId) throw new Error('Studio created the item but did not return its id.');
  return { entityId };
}
