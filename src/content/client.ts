import { apiUrl } from '../config/api';
import type { CharacterDefinition } from '../character/types';
import { beginCloudLessonSession } from '../cloud/sessionBridge';
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

function isOptionalString(value: unknown) {
  return value === undefined || value === null || typeof value === 'string';
}

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isSceneLessonDefinition(value: unknown): value is SceneLessonDefinition {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== 'string'
    || typeof value.levelId !== 'string'
    || typeof value.unitId !== 'string'
    || typeof value.unitTitle !== 'string'
    || typeof value.order !== 'number'
    || typeof value.title !== 'string'
    || typeof value.subtitle !== 'string'
    || typeof value.performance !== 'string'
    || !isStringArray(value.coreLanguage)
    || !isStringArray(value.boundaries)
    || !isRecord(value.source)
    || typeof value.source.sourceLessonId !== 'string'
  ) return false;
  if (!Array.isArray(value.scenes) || value.scenes.length === 0) return false;
  return value.scenes.every((scene) => {
    if (!isRecord(scene) || !isRecord(scene.teaching) || !isRecord(scene.interaction)) return false;
    return typeof scene.id === 'string'
      && typeof scene.title === 'string'
      && typeof scene.goal === 'string'
      && isStringArray(scene.teaching.explainInArabic)
      && isStringArray(scene.teaching.englishTargets)
      && (scene.teaching.constraints === undefined || isStringArray(scene.teaching.constraints))
      && typeof scene.interaction.kind === 'string'
      && typeof scene.interaction.setup === 'string'
      && typeof scene.interaction.learnerTask === 'string'
      && isStringArray(scene.interaction.supportLadder)
      && (scene.interaction.teacherMoves === undefined || isStringArray(scene.interaction.teacherMoves));
  });
}

function isCharacterContent(value: unknown): value is CharacterAuthoringContent {
  if (!isRecord(value)) return false;
  return isOptionalString(value.displayName)
    && isOptionalString(value.personaPrompt)
    && isOptionalString(value.teachingStylePrompt)
    && isOptionalString(value.voiceName);
}

function isTeachingPolicy(value: unknown): value is TeachingPolicyContent {
  if (!isRecord(value) || typeof value.prompt !== 'string') return false;
  return isOptionalString(value.openingPrompt) && isOptionalString(value.decisionNudgePrompt);
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

function normalizeCharacterContent(
  content: CharacterAuthoringContent,
  character: CharacterDefinition,
): CharacterAuthoringContent {
  if (character.id !== 'otti') return content;
  const basePersona = content.personaPrompt?.trim() || character.persona.style;
  const baseTeachingStyle = content.teachingStylePrompt?.trim();
  return {
    ...content,
    voiceName: 'Charon',
    personaPrompt: `adult male English teacher; warm, patient, grounded, concise, and never childish; ${basePersona}`,
    teachingStylePrompt: [
      baseTeachingStyle,
      'Otti is male. When Arabic grammar makes gender audible, use masculine self-reference consistently.',
    ].filter(Boolean).join(' '),
  };
}

function fallbackCharacter(character: CharacterDefinition): CharacterAuthoringContent {
  return normalizeCharacterContent({
    displayName: character.name,
    personaPrompt: character.persona.style,
    voiceName: null,
  }, character);
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
      content: normalizeCharacterContent(row.content, character),
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
    const loaded: LoadedTeachingBundle = {
      source: 'neon',
      lesson: parsed.lesson.content,
      lessonRevisionId: parsed.lesson.revisionId,
      character: normalizeCharacterContent(parsed.character.content, character),
      characterRevisionId: parsed.character.revisionId,
      teachingPolicy: parsed.teachingPolicy.content,
      teachingPolicyRevisionId: parsed.teachingPolicy.revisionId,
    };
    await beginCloudLessonSession({
      lessonId: loaded.lesson.id,
      lessonRevisionId: loaded.lessonRevisionId,
      characterRevisionId: loaded.characterRevisionId,
      teachingPolicyRevisionId: loaded.teachingPolicyRevisionId,
    });
    return loaded;
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : String(reason);
    console.warn(`[Englotti content] could not load published bundle (${message}); using local fallback.`);
    return fallback;
  }
}
