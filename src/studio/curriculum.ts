import { getAuthJwt } from '../auth/client';
import { apiUrl } from '../config/api';

export interface StudioCurriculumLesson {
  id: string;
  slug: string;
  code: string;
  title: string;
  order: number;
  status: 'active' | 'archived';
  publishedRevisionNumber: number | null;
  draftRevisionNumber: number | null;
}

export interface StudioCurriculumUnit {
  id: string;
  slug: string;
  code: string;
  title: string;
  order: number;
  status: 'active' | 'archived';
  lessons: StudioCurriculumLesson[];
}

export interface StudioCurriculumLevel {
  id: string;
  code: string;
  title: string;
  order: number;
  status: 'active' | 'archived';
  units: StudioCurriculumUnit[];
}

export interface StudioCurriculumHierarchy {
  course: { id: string; slug: string; title: string };
  levels: StudioCurriculumLevel[];
}

async function curriculumRequest(init: RequestInit = {}) {
  const token = await getAuthJwt();
  if (!token) throw new Error('AUTH_REQUIRED');
  const response = await fetch(apiUrl('/api/studio/curriculum'), {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
      authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : `Curriculum request failed (${response.status}).`);
  return payload ?? {};
}

export async function loadStudioCurriculum() {
  return await curriculumRequest() as unknown as StudioCurriculumHierarchy;
}

export async function createStudioLevel(input: { code: string; title: string }) {
  return curriculumRequest({ method: 'POST', body: JSON.stringify({ action: 'create-level', ...input }) });
}

export async function createStudioUnit(input: { levelId: string; slug: string; code: string; title: string }) {
  return curriculumRequest({ method: 'POST', body: JSON.stringify({ action: 'create-unit', ...input }) });
}

export async function createStudioLesson(input: { unitId: string; slug: string; code: string; title: string }) {
  return curriculumRequest({ method: 'POST', body: JSON.stringify({ action: 'create-lesson', ...input }) });
}

export async function setStudioCurriculumArchived(entityType: 'level' | 'unit' | 'lesson', entityId: string, archived: boolean) {
  return curriculumRequest({
    method: 'POST',
    body: JSON.stringify({ action: archived ? 'archive' : 'restore', entityType, entityId }),
  });
}
