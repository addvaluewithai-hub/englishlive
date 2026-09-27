import { apiUrl } from '../config/api';
import type { CharacterDefinition } from '../character/types';
import type { SceneLessonDefinition } from '../lessonScenes/types';
import { DEFAULT_TEACHING_POLICY } from './defaultTeachingPolicy';
import type {
  CharacterAuthoringContent,
  LoadedTeachingBundle,
  TeachingBundleResponse,
  TeachingPolicyContent,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isSceneLessonDefinition(value: unknown): value is SceneLessonDefinition {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string' || typeof value.title !== 'string') return false;
  if (!Array.isArray(value.scenes) || value.scenes.length === 0) return false;
  return value.scenes.every((scene) => {
    if (!isRecord(scene)) return false;
    return typeof scene.id === 'string'
      && typeof scene.title === 'string'
      && typeof scene.goal === 'string'
      && isRecord(scene.teaching)
      && isRecord(scene.interaction);
  });
}

function isCharacterContent(value: unknown): value is CharacterAuthoringContent {
  if (!isRecord(value)) return false;
  return value.displayName === undefined || typeof value.displayName === 'string';
}

function isTeachingPolicy(value: unknown): value is TeachingPolicyContent {
  return isRecord(value) && typeof value.prompt === 'string';
}

function parseTeachingBundle(value: unknown): TeachingBundleResponse | null {
  if (!isRecord(value) || value.source !== 'neon') return null;
  const lesson = value.lesson;
  const character = value.character;
  const teachingPolicy = value.teachingPolicy;
  if (!isRecord(lesson) || !isRecord(character) || !isRecord(teachingPolicy)) return null;
  if (!isSceneLessonDefinition(lesson.content)) return null;
  if (!isCharacterContent(character.content)) return null;
  if (!isTeachingPolicy(teachingPolicy.content)) return null;
  if (
    typeof lesson.id !== 'string'
    || typeof lesson.revisionId !== 'string'
    || typeof lesson.revisionNumber !== 'number'
    || typeof character.id !== 'string'
    || typeof character.slug !== 'string'
    || typeof character.revisionId !== 'string'
    || typeof character.revisionNumber !== 'number'
    || typeof character.rendererKey !== 'string'
    || typeof teachingPolicy.id !== 'string'
    || typeof teachingPolicy.key !== 'string'
    || typeof teachingPolicy.revisionId !== 'string'
    || typeof teachingPolicy.revisionNumber !== 'number'
  ) return null;
  return value as unknown as TeachingBundleResponse;
}

function fallbackCharacter(character: CharacterDefinition): CharacterAuthoringContent {
  return {
    displayName: character.name,
    personaPrompt: character.persona.style,
    voiceName: null,
  };
}

function fallbackBundle(
  lesson: SceneLessonDefinition,
  character: CharacterDefinition,
): LoadedTeachingBundle {
  return {
    source: 'local-fallback',
    lesson,
    lessonRevisionId: null,
    character: fallbackCharacter(character),
    characterRevisionId: null,
    teachingPolicy: DEFAULT_TEACHING_POLICY,
    teachingPolicyRevisionId: null,
  };
}

async function fetchJsonWithTimeout(path: string, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(apiUrl(path), {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    return { response, payload: await response.json().catch(() => null) as unknown };
  } finally {
    window.clearTimeout(timer);
  }
}

export async function loadPublishedCharacter(character: CharacterDefinition): Promise<{
  source: 'neon' | 'local-fallback';
  content: CharacterAuthoringContent;
  revisionId: string | null;
}> {
  const fallback = {
    source: 'local-fallback' as const,
    content: fallbackCharacter(character),
    revisionId: null,
  };
  try {
    const query = new URLSearchParams({ characterId: character.id });
    const { response, payload } = await fetchJsonWithTimeout(`/api/content/character?${query.toString()}`);
    if (!response.ok || !isRecord(payload) || payload.source !== 'neon' || !isRecord(payload.character)) {
      console.warn(`[Englotti content] character API returned ${response.status}; using local fallback.`);
      return fallback;
    }
    const row = payload.character;
    if (row.slug !== character.id || typeof row.revisionId !== 'string' || !isCharacterContent(row.content)) {
      console.warn('[Englotti content] invalid character payload; using local fallback.');
      return fallback;
    }
    return {
      source: 'neon',
      content: row.content,
      revisionId: row.revisionId,
    };
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : String(reason);
    console.warn(`[Englotti content] could not load published character (${message}); using local fallback.`);
    return fallback;
  }
}

export async function loadTeachingBundle(
  lesson: SceneLessonDefinition,
  character: CharacterDefinition,
): Promise<LoadedTeachingBundle> {
  const fallback = fallbackBundle(lesson, character);
  try {
    const query = new URLSearchParams({ lessonId: lesson.id, characterId: character.id });
    const { response, payload } = await fetchJsonWithTimeout(`/api/content/bundle?${query.toString()}`);
    if (!response.ok) {
      console.warn(`[Englotti content] bundle API returned ${response.status}; using local fallback.`);
      return fallback;
    }
    const parsed = parseTeachingBundle(payload);
    if (!parsed) {
      console.warn('[Englotti content] invalid bundle payload; using local fallback.');
      return fallback;
    }
    if (parsed.lesson.content.id !== lesson.id || parsed.character.slug !== character.id) {
      console.warn('[Englotti content] bundle identity mismatch; using local fallback.');
      return fallback;
    }
    return {
      source: 'neon',
      lesson: parsed.lesson.content,
      lessonRevisionId: parsed.lesson.revisionId,
      character: parsed.character.content,
      characterRevisionId: parsed.character.revisionId,
      teachingPolicy: parsed.teachingPolicy.content,
      teachingPolicyRevisionId: parsed.teachingPolicy.revisionId,
    };
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : String(reason);
    console.warn(`[Englotti content] could not load published bundle (${message}); using local fallback.`);
    return fallback;
  }
}
