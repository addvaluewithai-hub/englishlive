import type { SceneLessonDefinition, SceneLessonScene } from './types';

export type KnownLessonItemKind = 'word' | 'phrase' | 'pattern';

export interface KnownLessonItem {
  id: string;
  kind: KnownLessonItemKind;
  label: string;
  description?: string;
  sceneIds: readonly string[];
}

export interface AdaptiveLessonPlan {
  lessonId: string;
  items: readonly KnownLessonItem[];
}

const ADAPTIVE_PLANS: Record<string, AdaptiveLessonPlan> = {
  'b1-u1-l01-reconnect-without-script': {
    lessonId: 'b1-u1-l01-reconnect-without-script',
    items: [
      { id: 'phrase-hear-of', kind: 'phrase', label: 'Have you heard of…?', sceneIds: ['hear-of-teach-use'] },
      { id: 'phrase-get-on-with', kind: 'phrase', label: 'get on with…', sceneIds: ['get-on-with-teach-use'] },
      { id: 'phrase-too-bad', kind: 'phrase', label: 'Too bad.', sceneIds: ['too-bad-teach-use'] },
      { id: 'word-talented', kind: 'word', label: 'talented', sceneIds: ['word-talented-receptive'] },
      { id: 'word-photography', kind: 'word', label: 'photography', sceneIds: ['word-photography-receptive'] },
      { id: 'word-competitor', kind: 'word', label: 'competitor', sceneIds: ['word-competitor-receptive'] },
      { id: 'word-rugby', kind: 'word', label: 'rugby', sceneIds: ['word-rugby-receptive'] },
      { id: 'word-entertainment', kind: 'word', label: 'entertainment', sceneIds: ['word-entertainment-receptive'] },
    ],
  },
  'b1-u1-l02-keep-conversation-going': {
    lessonId: 'b1-u1-l02-keep-conversation-going',
    items: [
      { id: 'phrase-get-to-know', kind: 'phrase', label: 'get to know', sceneIds: ['get-to-know-teach-use'] },
      { id: 'phrase-in-touch', kind: 'phrase', label: 'in touch', sceneIds: ['in-touch-teach-use'] },
      { id: 'phrase-you-see', kind: 'phrase', label: 'you see', sceneIds: ['you-see-teach-use'] },
      { id: 'word-wonder', kind: 'word', label: 'wonder', sceneIds: ['wonder-teach-use'] },
      { id: 'word-encourage', kind: 'word', label: 'encourage', sceneIds: ['encourage-teach-use'] },
      { id: 'word-reject', kind: 'word', label: 'reject', sceneIds: ['reject-teach-use'] },
      { id: 'word-agreement', kind: 'word', label: 'agreement', sceneIds: ['agreement-teach-use'] },
      { id: 'word-conclude', kind: 'word', label: 'conclude', sceneIds: ['conclude-teach-use'] },
      { id: 'pattern-emphatic-do', kind: 'pattern', label: 'I do like…', description: 'emphasis', sceneIds: ['emphatic-do-support'] },
      { id: 'pattern-let-me', kind: 'pattern', label: 'Let me think…', description: 'hold the turn', sceneIds: ['let-me-support'] },
      { id: 'pattern-negative-tag', kind: 'pattern', label: '…, don’t you?', description: 'check a shared fact', sceneIds: ['negative-tag-support'] },
      { id: 'pattern-speech-act', kind: 'pattern', label: 'I suggest… / I promise…', description: 'state the conversational act', sceneIds: ['speech-act-verb-support'] },
    ],
  },
  'b1-u1-l03-personal-updates-feelings-reactions': {
    lessonId: 'b1-u1-l03-personal-updates-feelings-reactions',
    items: [
      { id: 'phrase-break-up', kind: 'phrase', label: 'break up', sceneIds: ['break-up-teach-use'] },
      { id: 'phrase-have-in-common', kind: 'phrase', label: 'have … in common', sceneIds: ['have-in-common-teach-use'] },
      { id: 'phrase-respect-for', kind: 'phrase', label: 'respect for …', sceneIds: ['respect-for-teach-use'] },
      { id: 'word-engaged', kind: 'word', label: 'engaged', sceneIds: ['word-engaged-teach-use'] },
      { id: 'word-annoyed', kind: 'word', label: 'annoyed', sceneIds: ['word-annoyed-teach-use'] },
      { id: 'word-disappointing', kind: 'word', label: 'disappointing', sceneIds: ['word-disappointing-teach-use'] },
      { id: 'word-confident', kind: 'word', label: 'confident', sceneIds: ['word-confident-teach-use'] },
      { id: 'word-brave', kind: 'word', label: 'brave', sceneIds: ['word-brave-teach-use'] },
      { id: 'word-gentle', kind: 'word', label: 'gentle', sceneIds: ['word-gentle-teach-use'] },
      { id: 'word-honest', kind: 'word', label: 'honest', sceneIds: ['word-honest-teach-use'] },
      { id: 'word-passion', kind: 'word', label: 'passion', sceneIds: ['word-passion-teach-use'] },
      { id: 'word-relaxed', kind: 'word', label: 'relaxed', sceneIds: ['word-relaxed-teach-use'] },
      { id: 'word-worry', kind: 'word', label: 'worry / worried', sceneIds: ['word-worry-teach-use'] },
      { id: 'pattern-events-progress', kind: 'pattern', label: "I'm …-ing", description: 'current update', sceneIds: ['events-in-progress-support'] },
    ],
  },
};

export function adaptivePlanForLesson(lessonId: string): AdaptiveLessonPlan | null {
  return ADAPTIVE_PLANS[lessonId] ?? null;
}

export function knownItemsForLesson(lessonId: string): readonly KnownLessonItem[] {
  return adaptivePlanForLesson(lessonId)?.items ?? [];
}

export function adaptLessonForKnownItems(
  lesson: SceneLessonDefinition,
  knownItemIds: readonly string[],
): SceneLessonDefinition {
  const plan = adaptivePlanForLesson(lesson.id);
  if (!plan || !knownItemIds.length) return lesson;

  const selected = new Set(knownItemIds);
  const skippedSceneIds = new Set(
    plan.items
      .filter((item) => selected.has(item.id))
      .flatMap((item) => [...item.sceneIds]),
  );
  const scenes = lesson.scenes.filter((scene) => !skippedSceneIds.has(scene.id));
  return scenes.length ? { ...lesson, scenes } : lesson;
}

export function claimedKnownContext(lessonId: string, knownItemIds: readonly string[]) {
  const plan = adaptivePlanForLesson(lessonId);
  if (!plan || !knownItemIds.length) return '';
  const selected = plan.items.filter((item) => knownItemIds.includes(item.id));
  if (!selected.length) return '';
  return [
    'ADAPTIVE LESSON PATH',
    `Before the lesson, the learner said they already know these items well: ${selected.map((item) => item.label).join('; ')}.`,
    'Their dedicated teaching scenes were removed from this session to save time.',
    'Do NOT assume permanent mastery from self-report. When later authored retrieval, listening, integration, or final conversation naturally touches one of these items, verify it briefly without announcing a quiz.',
    'If a claimed-known item turns out weak, explain or repair it briefly in the current scene, then create a fresh natural check. Do not reconstruct every skipped teaching scene unless the learner actually needs it.',
  ].join('\n');
}

export interface LessonCheckpointGroup {
  id: string;
  label: string;
  scenes: readonly SceneLessonScene[];
}

const CHECKPOINT_LABELS = ['بداية', 'تعبيرات', 'تطبيق', 'مراجعة', 'محادثة'];

export function checkpointGroupsForLesson(lesson: SceneLessonDefinition): LessonCheckpointGroup[] {
  const count = Math.min(CHECKPOINT_LABELS.length, lesson.scenes.length);
  if (!count) return [];
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((index * lesson.scenes.length) / count);
    const end = Math.floor(((index + 1) * lesson.scenes.length) / count);
    return {
      id: `checkpoint-${index + 1}`,
      label: CHECKPOINT_LABELS[index],
      scenes: lesson.scenes.slice(start, Math.max(start + 1, end)),
    };
  });
}
