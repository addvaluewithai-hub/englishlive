import {
  completeCloudLessonSession,
  recordCloudSceneResult,
  startCloudLessonSession,
} from './userData';

interface ActiveCloudLessonSession {
  sessionId: string;
  lessonId: string;
}

const activeSessions = new Map<string, ActiveCloudLessonSession>();

export async function beginCloudLessonSession(input: {
  lessonId: string;
  lessonRevisionId: string | null;
  characterRevisionId: string | null;
  teachingPolicyRevisionId: string | null;
}) {
  if (!input.lessonRevisionId || !input.characterRevisionId || !input.teachingPolicyRevisionId) return null;
  try {
    const sessionId = await startCloudLessonSession({
      lessonRevisionId: input.lessonRevisionId,
      characterRevisionId: input.characterRevisionId,
      teachingPolicyRevisionId: input.teachingPolicyRevisionId,
      clientContext: {
        source: 'web',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : undefined,
      },
    });
    activeSessions.set(input.lessonId, { sessionId, lessonId: input.lessonId });
    return sessionId;
  } catch (reason) {
    console.warn('[Englotti cloud] could not start learner session', reason instanceof Error ? reason.message : String(reason));
    return null;
  }
}

export function recordRuntimeSceneCompletion(input: {
  lessonId: string;
  sceneId: string;
  sceneIndex: number;
  summary: string;
  lessonComplete: boolean;
}) {
  const active = activeSessions.get(input.lessonId);
  if (!active) return;
  void recordCloudSceneResult({
    sessionId: active.sessionId,
    sceneId: input.sceneId,
    sceneIndex: input.sceneIndex,
    summary: input.summary,
  }).catch((reason) => {
    console.warn('[Englotti cloud] could not save scene result', reason instanceof Error ? reason.message : String(reason));
  });

  if (input.lessonComplete) {
    activeSessions.delete(input.lessonId);
    void completeCloudLessonSession(active.sessionId, {
      lessonId: input.lessonId,
      finalSceneId: input.sceneId,
    }).catch((reason) => {
      console.warn('[Englotti cloud] could not complete learner session', reason instanceof Error ? reason.message : String(reason));
    });
  }
}
