export type StudioEntityType = 'lesson' | 'character' | 'policy';

export interface StudioRevision {
  id: string;
  revisionNumber: number;
  status: string;
  schemaVersion: number;
  content: Record<string, unknown>;
  changeNote: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface StudioLesson {
  type: 'lesson';
  id: string;
  slug: string;
  code: string;
  order: number;
  levelCode: string;
  unitSlug: string;
  unitCode: string;
  unitTitle: string;
  published: StudioRevision | null;
  draft: StudioRevision | null;
}

export interface StudioCharacter {
  type: 'character';
  id: string;
  slug: string;
  rendererKey: string;
  published: StudioRevision | null;
  draft: StudioRevision | null;
}

export interface StudioPolicy {
  type: 'policy';
  id: string;
  key: string;
  published: StudioRevision | null;
  draft: StudioRevision | null;
}

export type StudioEntity = StudioLesson | StudioCharacter | StudioPolicy;

export interface StudioOverview {
  admin: { userId: string; email: string | null; name: string | null };
  lessons: StudioLesson[];
  characters: StudioCharacter[];
  policies: StudioPolicy[];
}
