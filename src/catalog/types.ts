import type { SceneLessonDefinition } from '../lessonScenes/types';

export interface PublishedCatalogLesson {
  id: string;
  code: string;
  order: number;
  revisionId: string;
  revisionNumber: number;
  content: SceneLessonDefinition;
}

export interface PublishedCatalogUnit {
  id: string;
  code: string;
  title: string;
  order: number;
  lessons: PublishedCatalogLesson[];
}

export interface PublishedCatalogLevel {
  id: string;
  code: string;
  title: string;
  order: number;
  units: PublishedCatalogUnit[];
}

export interface PublishedCatalogResponse {
  source: 'neon';
  course: {
    slug: string;
    title: string;
  };
  levels: PublishedCatalogLevel[];
}
