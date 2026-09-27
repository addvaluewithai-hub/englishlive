import { useEffect, useState } from 'react';
import { apiUrl } from '../config/api';
import {
  A1_LEVEL_PRODUCT,
  A1_UNIT_1_PRODUCT,
  type ProductLevelDefinition,
  type ProductUnitDefinition,
} from '../productV2/course';
import { cachePublishedCatalog, readCachedPublishedCatalog } from './cache';
import type { PublishedCatalogResponse } from './types';

export interface ProductCatalog {
  source: 'neon' | 'local-fallback';
  courseSlug: string;
  courseTitle: string;
  levels: ProductLevelDefinition[];
}

let memoryCatalog: ProductCatalog | null = null;
let inFlight: Promise<ProductCatalog> | null = null;

function localFallbackCatalog(): ProductCatalog {
  return {
    source: 'local-fallback',
    courseSlug: 'englotti-english',
    courseTitle: 'Englotti English',
    levels: [A1_LEVEL_PRODUCT],
  };
}

function presentationForLevel(code: string, title: string) {
  if (code.toLowerCase() === 'a1') {
    return {
      arabicTitle: A1_LEVEL_PRODUCT.arabicTitle,
      description: A1_LEVEL_PRODUCT.description,
    };
  }
  return {
    arabicTitle: title,
    description: 'مسار تعلم منشور في Englotti.',
  };
}

function presentationForUnit(id: string, title: string) {
  if (id === A1_UNIT_1_PRODUCT.id) {
    return {
      arabicTitle: A1_UNIT_1_PRODUCT.arabicTitle,
      description: A1_UNIT_1_PRODUCT.description,
    };
  }
  return {
    arabicTitle: title,
    description: 'وحدة منشورة وجاهزة للتعلم في Englotti.',
  };
}

function isPublishedCatalog(value: unknown): value is PublishedCatalogResponse {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (record.source !== 'neon' || !record.course || typeof record.course !== 'object' || !Array.isArray(record.levels)) return false;
  const course = record.course as Record<string, unknown>;
  return typeof course.slug === 'string' && typeof course.title === 'string';
}

function toProductCatalog(payload: PublishedCatalogResponse): ProductCatalog {
  const levels: ProductLevelDefinition[] = payload.levels
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((level) => {
      const levelPresentation = presentationForLevel(level.code, level.title);
      const connectedUnits: ProductUnitDefinition[] = level.units
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((unit) => {
          const unitPresentation = presentationForUnit(unit.id, unit.title);
          return {
            id: unit.id,
            levelId: level.id,
            order: unit.order,
            title: unit.title,
            arabicTitle: unitPresentation.arabicTitle,
            description: unitPresentation.description,
            lessons: unit.lessons
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((lesson) => lesson.content),
          };
        })
        .filter((unit) => unit.lessons.length > 0);

      return {
        id: level.id,
        title: level.title,
        arabicTitle: levelPresentation.arabicTitle,
        description: levelPresentation.description,
        unitCount: connectedUnits.length,
        lessonSlotCount: connectedUnits.reduce((sum, unit) => sum + unit.lessons.length, 0),
        connectedUnits,
        outline: connectedUnits.map((unit) => ({
          id: unit.id,
          order: unit.order,
          title: unit.title,
          arabicTitle: unit.arabicTitle,
          lessonCount: unit.lessons.length,
          connected: true,
        })),
      };
    })
    .filter((level) => level.connectedUnits.length > 0);

  if (!levels.length) throw new Error('Published catalog is empty.');
  return {
    source: 'neon',
    courseSlug: payload.course.slug,
    courseTitle: payload.course.title,
    levels,
  };
}

function catalogFromSessionCache() {
  const cached = readCachedPublishedCatalog();
  if (!cached) return null;
  try {
    return toProductCatalog(cached);
  } catch {
    return null;
  }
}

export async function loadProductCatalog(): Promise<ProductCatalog> {
  if (import.meta.env.VITE_VISUAL_QA === '1') {
    memoryCatalog = localFallbackCatalog();
    return memoryCatalog;
  }
  if (memoryCatalog?.source === 'neon') return memoryCatalog;
  const cached = catalogFromSessionCache();
  if (cached) {
    memoryCatalog = cached;
    return cached;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const response = await fetch(apiUrl('/api/content/catalog'), {
        headers: { accept: 'application/json' },
      });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok || !isPublishedCatalog(payload)) throw new Error(`Catalog API returned ${response.status}.`);
      cachePublishedCatalog(payload);
      memoryCatalog = toProductCatalog(payload);
      return memoryCatalog;
    } catch (reason) {
      console.warn('[Englotti catalog] using local fallback', reason instanceof Error ? reason.message : String(reason));
      memoryCatalog = localFallbackCatalog();
      return memoryCatalog;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function useProductCatalog() {
  const [catalog, setCatalog] = useState<ProductCatalog>(() => memoryCatalog ?? catalogFromSessionCache() ?? localFallbackCatalog());
  useEffect(() => {
    let cancelled = false;
    loadProductCatalog().then((next) => {
      if (!cancelled) setCatalog(next);
    });
    return () => { cancelled = true; };
  }, []);
  return catalog;
}

export async function firstPublishedLesson() {
  const catalog = await loadProductCatalog();
  return catalog.levels[0]?.connectedUnits[0]?.lessons[0] ?? A1_UNIT_1_PRODUCT.lessons[0];
}
