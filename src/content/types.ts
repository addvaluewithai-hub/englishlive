import type { SceneLessonDefinition } from '../lessonScenes/types';

export interface CharacterAuthoringContent {
  displayName?: string;
  personaPrompt?: string;
  teachingStylePrompt?: string;
  voiceName?: string | null;
}

export interface TeachingPolicyContent {
  prompt: string;
  openingPrompt?: string;
  decisionNudgePrompt?: string;
}

export interface TeachingBundleResponse {
  source: 'neon';
  lesson: {
    id: string;
    revisionId: string;
    revisionNumber: number;
    content: SceneLessonDefinition;
  };
  character: {
    id: string;
    slug: string;
    revisionId: string;
    revisionNumber: number;
    rendererKey: string;
    content: CharacterAuthoringContent;
  };
  teachingPolicy: {
    id: string;
    key: string;
    revisionId: string;
    revisionNumber: number;
    content: TeachingPolicyContent;
  };
}

export interface LoadedTeachingBundle {
  source: 'neon' | 'local-fallback';
  lesson: SceneLessonDefinition;
  lessonRevisionId: string | null;
  character: CharacterAuthoringContent;
  characterRevisionId: string | null;
  teachingPolicy: TeachingPolicyContent;
  teachingPolicyRevisionId: string | null;
}
