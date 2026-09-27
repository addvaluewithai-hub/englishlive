import { useEffect, useState } from 'react';
import { apiUrl } from '../config/api';
import { characterRegistry } from './registry';
import type { CharacterDefinition } from './types';

interface PublishedCharacterRow {
  id: string;
  slug: string;
  rendererKey: string;
  revisionId: string;
  revisionNumber: number;
  content: unknown;
}

interface PublishedCharacterPayload {
  source: 'neon';
  characters: PublishedCharacterRow[];
}

export interface PublishedCharacterCatalog {
  source: 'neon' | 'local-fallback';
  characters: CharacterDefinition[];
}

let memoryCatalog: PublishedCharacterCatalog | null = null;
let inFlight: Promise<PublishedCharacterCatalog> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function localRendererKey(character: CharacterDefinition) {
  const renderer = character.renderer;
  if (renderer.kind === 'otti-svg') return 'octo';
  if (renderer.kind === 'svg-human') return `human:${renderer.preset}`;
  if (renderer.kind === 'svg-mascot') return `mascot:${renderer.preset}`;
  return `recipe:${renderer.species}`;
}

function visualTemplate(slug: string, rendererKey: string) {
  return characterRegistry.find((item) => item.id === slug)
    ?? characterRegistry.find((item) => localRendererKey(item) === rendererKey)
    ?? characterRegistry[0];
}

function localFallback(): PublishedCharacterCatalog {
  return { source: 'local-fallback', characters: [...characterRegistry] };
}

function materialize(row: PublishedCharacterRow): CharacterDefinition {
  const visual = visualTemplate(row.slug, row.rendererKey);
  const content = isRecord(row.content) ? row.content : {};
  const displayName = typeof content.displayName === 'string' && content.displayName.trim()
    ? content.displayName.trim()
    : visual.name;
  const tagline = typeof content.tagline === 'string' ? content.tagline : visual.tagline;
  const description = typeof content.description === 'string' ? content.description : visual.description;
  const accent = typeof content.accent === 'string' && content.accent.trim() ? content.accent : visual.accent;
  const personaPrompt = typeof content.personaPrompt === 'string' && content.personaPrompt.trim()
    ? content.personaPrompt
    : visual.persona.style;

  return {
    id: row.slug,
    name: displayName,
    tagline,
    description,
    accent,
    renderer: visual.renderer,
    persona: { style: personaPrompt },
  };
}

function isPayload(value: unknown): value is PublishedCharacterPayload {
  if (!isRecord(value) || value.source !== 'neon' || !Array.isArray(value.characters)) return false;
  return value.characters.every((item) => {
    if (!isRecord(item)) return false;
    return typeof item.slug === 'string'
      && typeof item.rendererKey === 'string'
      && typeof item.revisionId === 'string'
      && typeof item.revisionNumber === 'number';
  });
}

export function invalidatePublishedCharacters() {
  memoryCatalog = null;
  inFlight = null;
}

export async function loadPublishedCharacters(): Promise<PublishedCharacterCatalog> {
  if (import.meta.env.VITE_VISUAL_QA === '1') {
    memoryCatalog = localFallback();
    return memoryCatalog;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const response = await fetch(apiUrl('/api/content/characters'), {
        headers: { accept: 'application/json' },
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok || !isPayload(payload)) throw new Error(`Characters API returned ${response.status}.`);
      const characters = payload.characters.map(materialize);
      if (!characters.length) throw new Error('No published characters were returned.');
      memoryCatalog = { source: 'neon', characters };
      return memoryCatalog;
    } catch (reason) {
      console.warn('[Englotti characters] using local fallback', reason instanceof Error ? reason.message : String(reason));
      memoryCatalog = localFallback();
      return memoryCatalog;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function usePublishedCharacters() {
  const [catalog, setCatalog] = useState<PublishedCharacterCatalog>(() => memoryCatalog ?? localFallback());
  useEffect(() => {
    let cancelled = false;
    loadPublishedCharacters().then((next) => {
      if (!cancelled) setCatalog(next);
    });
    return () => { cancelled = true; };
  }, []);
  return catalog;
}

export function publishedCharacterById(characters: readonly CharacterDefinition[], id: string | null | undefined) {
  return characters.find((character) => character.id === id) ?? characters[0] ?? characterRegistry[0];
}
