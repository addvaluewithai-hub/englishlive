import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

// Load the actual runtime source with browser persistence adapters replaced by
// fail-fast stubs. Preview must never call either adapter.
const runtimeSource = await readFile(new URL('../src/lessonScenes/SceneLessonRuntime.ts', import.meta.url), 'utf8');
const verificationUrl = new URL('../src/lessonScenes/verification.ts', import.meta.url).href;
const isolatedSource = runtimeSource
  .replace(
    "import { recordRuntimeSceneCompletion } from '../cloud/sessionBridge';",
    "const recordRuntimeSceneCompletion = () => { throw new Error('Preview called cloud progress'); };",
  )
  .replace(
    "import { markProductLessonCompleted, markProductLessonStarted } from '../productV2/progress';",
    "const markProductLessonStarted = () => { throw new Error('Preview marked lesson started'); }; const markProductLessonCompleted = () => { throw new Error('Preview marked lesson completed'); };",
  )
  .replace(
    "import { sceneVerificationContract } from './verification';",
    'import { sceneVerificationContract } from ' + JSON.stringify(verificationUrl) + ';',
  );
const code = (await transform(isolatedSource, { loader: 'ts', format: 'esm', target: 'es2022' })).code;
const { SceneLessonRuntime } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
import { B1_L02_TEACHER_BOARD_PILOT as lesson } from '../src/lessonScenes/b1/teacherBoardPilot.ts';
import { B1_TEACHER_LAB_SCRIPT, B1_TEACHER_LAB_AFTER_CHOICE } from '../src/lessonScenes/b1/teacherLabScript.ts';
import { ScriptedNarrationDirector } from '../src/lessonScenes/ScriptedNarrationDirector.ts';

const validAudit = {
  evidenceType: 'independent_production',
  supportUsed: 'none',
  freshIndependentRetry: false,
  learnerTurnsObserved: 2,
  summary: 'Learner used the target in a changed spoken situation.',
};

function create() {
  const changes = [];
  const runtime = new SceneLessonRuntime(lesson, {
    preview: true,
    onStateChange: (state) => changes.push(state),
  });
  runtime.markLessonOpeningComplete();
  runtime.markScriptedNarrationComplete(runtime.currentScene.id);
  const complete = runtime.tools.find((tool) => tool.declaration.name === 'complete_scene');
  assert.ok(complete);
  return { runtime, complete, changes };
}

test('the lab is separate from official B1 and carries only authored stage content', () => {
  assert.notEqual(lesson.id, 'b1-u1-l02-keep-conversation-going');
  assert.equal(lesson.scenes.length, 5);
  assert.ok(lesson.scenes[1].activity);
  assert.ok(lesson.scenes[2].activity);
  assert.equal(lesson.scenes.at(-1).board, undefined);
  for (const scene of lesson.scenes) {
    if (!scene.activity) continue;
    assert.ok(scene.activity.options.some((option) => option.id === scene.activity.correctOptionId));
    assert.equal(new Set(scene.activity.options.map((option) => option.id)).size, scene.activity.options.length);
  }
});

test('a correct board choice alone cannot complete a scene without real microphone evidence', () => {
  const { runtime, complete } = create();
  runtime.recordLearnerAudioLevel(0.5);
  assert.equal(complete.handle(validAudit).completedSceneId, 'warm-up');
  const current = runtime.currentScene;
  assert.equal(current.id, 'get-to-know');
  runtime.markScriptedNarrationComplete(current.id);

  // Even a plausible spoken attempt cannot skip the application-owned check.
  runtime.recordLearnerAudioLevel(0.5);
  assert.match(complete.handle(validAudit).error, /board comprehension check/);
  assert.equal(runtime.submitBoardChoice(current.id, 'old').correct, false);
  const boardTool = runtime.tools.find((tool) => tool.declaration.name === 'show_board');
  assert.match(boardTool.handle({ mode: 'note', title: 'Override', items: ['Should not appear'] }).error, /authored narrator/);
  assert.match(complete.handle(validAudit).error, /board comprehension check/);
  assert.equal(runtime.snapshot.scenes[current.id].activityPassed, false);

  assert.deepEqual(runtime.submitBoardChoice(current.id, 'new'), { accepted: true, correct: true });
  assert.equal(runtime.snapshot.scenes[current.id].activityPassed, true);
  assert.match(complete.handle(validAudit).error, /voice activity/);
  runtime.recordLearnerAudioLevel(0.5);
  assert.equal(complete.handle(validAudit).completedSceneId, current.id);
  assert.equal(runtime.currentScene.id, 'keep-in-touch');
});

test('a tap is not spoken evidence; stale or unknown choices are rejected', () => {
  const { runtime, complete, changes } = create();
  runtime.recordLearnerAudioLevel(0.5);
  complete.handle(validAudit);
  const id = runtime.currentScene.id;
  runtime.markScriptedNarrationComplete(id);
  assert.equal(runtime.submitBoardChoice(id, 'nonsense').accepted, false);
  assert.equal(runtime.submitBoardChoice('keep-in-touch', 'contact').accepted, false);
  assert.equal(runtime.submitBoardChoice(id, 'new').correct, true);
  assert.match(complete.handle(validAudit).error, /voice activity/);
  assert.ok(changes.some((state) => state.scenes[id].activityPassed));
  runtime.recordLearnerAudioLevel(0.5);
  complete.handle(validAudit);
  assert.equal(runtime.submitBoardChoice(id, 'new').accepted, false);
});

test('preview cannot be confused with production scene completion', () => {
  const { runtime, complete } = create();
  for (const scene of lesson.scenes) {
    assert.equal(runtime.currentScene.id, scene.id);
    runtime.markScriptedNarrationComplete(scene.id);
    if (scene.activity) {
      runtime.submitBoardChoice(scene.id, scene.activity.correctOptionId);
    }
    runtime.recordLearnerAudioLevel(0.5);
    const result = complete.handle(validAudit);
    assert.equal(result.completedSceneId, scene.id);
  }
  assert.ok(runtime.snapshot.completedAt);
  assert.equal(runtime.snapshot.lessonId, lesson.id);
});

test('every lab scene has written narration, board cues and an answer pause', () => {
  for (const scene of lesson.scenes) {
    const beats = B1_TEACHER_LAB_SCRIPT[scene.id];
    assert.ok(beats?.length, 'no written lines for ' + scene.id);
    assert.equal(new Set(beats.map((beat) => beat.id)).size, beats.length);
    assert.ok(beats.every((beat) => beat.line.trim().length > 30));
    if (scene.activity) {
      assert.ok(B1_TEACHER_LAB_AFTER_CHOICE[scene.id]);
      assert.ok(beats.at(-1).board);
    }
  }
});

test('director switches lines only on audible end, never on pause or a tool-only turn', () => {
  const narration = new ScriptedNarrationDirector();
  const scene = lesson.scenes[0];
  const beats = B1_TEACHER_LAB_SCRIPT[scene.id];
  assert.equal(narration.start(scene.id, beats).id, beats[0].id);
  assert.equal(narration.currentBeat.id, beats[0].id);
  assert.equal(narration.pause().id, beats[0].id);
  assert.deepEqual(narration.audioFinished(), { next: null, finishedSceneId: null });
  assert.equal(narration.resume().id, beats[0].id);
  assert.equal(narration.audioFinished().next.id, beats[1].id);
  assert.equal(narration.audioFinished().next.id, beats[2].id);
  assert.deepEqual(narration.audioFinished(), { next: null, finishedSceneId: scene.id });
  assert.equal(narration.isReading, false);
});

test('spoken activity cannot complete the opening until the full written narration is done', () => {
  const { runtime, complete } = create();
  // fresh runtime's create() marks opening narrated; trigger on next scene to test gate.
  runtime.recordLearnerAudioLevel(0.5);
  complete.handle(validAudit);
  assert.equal(runtime.currentScene.id, 'get-to-know');
  runtime.recordLearnerAudioLevel(0.5);
  assert.match(complete.handle(validAudit).error, /authored narration/);
  runtime.showScriptedBoard('get-to-know', B1_TEACHER_LAB_SCRIPT['get-to-know'][0].board);
  runtime.markScriptedNarrationComplete('get-to-know');
  assert.match(complete.handle(validAudit).error, /board comprehension check/);
});
