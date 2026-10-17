/** A quiz handoff is owned by the client on the real PCM turn-complete event.
 * Never ask Gemini to call complete_scene to progress an already-graded MC.
 * The runtime still requires narrationComplete, an answered activity, and
 * genuinely finished feedback (markQuizFeedbackPlayed) before advancing.
 */
export type PreviewQuizAdvanceResult={
  error?:string;
  completedSceneId?:string;
  lessonComplete?:boolean;
  nextScene?:{id?:string};
};
export interface AudibleQuizRuntime {
  markQuizFeedbackPlayed(sceneId:string):boolean;
  completeGradedPreviewQuizAfterAudio(sceneId:string):PreviewQuizAdvanceResult;
}
export function handoffAnsweredQuizAfterAudiblePcm(
  runtime:AudibleQuizRuntime,
  sceneId:string,
):PreviewQuizAdvanceResult {
  if(!runtime.markQuizFeedbackPlayed(sceneId))
    return {error:'The app did not verify audible feedback for this question.'};
  return runtime.completeGradedPreviewQuizAfterAudio(sceneId);
}
