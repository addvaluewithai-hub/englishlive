import type { SceneLessonDefinition } from '../lessonScenes/types';
import type { PublishedCatalogResponse } from './types';

const CATALOG_CACHE_KEY = 'englishlive.published-catalog.v1';

export function cachePublishedCatalog(catalog: PublishedCatalogResponse) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(catalog));
}

export function readCachedPublishedCatalog(): PublishedCatalogResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublishedCatalogResponse;
    return parsed?.source === 'neon' && Array.isArray(parsed.levels) ? parsed : null;
  } catch {
    return null;
  }
}

export function hasCachedPublishedCatalog() {
  return Boolean(readCachedPublishedCatalog());
}

export function readCachedPublishedLesson(lessonId: string | null | undefined): SceneLessonDefinition | undefined {
  if (!lessonId) return undefined;
  const catalog = readCachedPublishedCatalog();
  for (const level of catalog?.levels ?? []) {
    for (const unit of level.units) {
      const lesson = unit.lessons.find((item) => item.id === lessonId);
      if (lesson) return lesson.content;
    }
  }
  return undefined;
}
