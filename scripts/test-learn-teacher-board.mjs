import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

// Load the real runtime with forbidden browser/cloud progress adapters replaced.
const source = await readFile(new URL('../src/lessonScenes/SceneLessonRuntime.ts', import.meta.url), 'utf8');
const verificationUrl = new URL('../src/lessonScenes/verification.ts', import.meta.url).href;
const isolated = source
  .replace("import { recordRuntimeSceneCompletion } from '../cloud/sessionBridge';",
    "const recordRuntimeSceneCompletion = () => { throw new Error('Preview called cloud progress'); };")
  .replace("import { markProductLessonCompleted, markProductLessonStarted } from '../productV2/progress';",
    "const markProductLessonStarted = () => { throw new Error('Preview started official lesson'); }; const markProductLessonCompleted = () => { throw new Error('Preview completed official lesson'); };")
  .replace("import { sceneVerificationContract } from './verification';",
    'import { sceneVerificationContract } from ' + JSON.stringify(verificationUrl) + ';');
const code = (await transform(isolated, { loader: 'ts', format: 'esm', target: 'es2022' })).code;
const { SceneLessonRuntime } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
import { B1_L02_TEACHER_BOARD_PILOT as lesson } from '../src/lessonScenes/b1/teacherBoardPilot.ts';
import { B1_TEACHER_LAB_SCRIPT, B1_TEACHER_LAB_QUIZ_FEEDBACK } from '../src/lessonScenes/b1/teacherLabScript.ts';
import { ScriptedNarrationDirector } from '../src/lessonScenes/ScriptedNarrationDirector.ts';

const quizAudit = {
  evidenceType: 'receptive_comprehension',
  supportUsed: 'none',
  freshIndependentRetry: false,
  learnerTurnsObserved: 0,
  summary: 'Board choice assessed; Otti explained why.',
};
const spokenAudit = {
  evidenceType: 'multi_turn_interaction',
  supportUsed: 'none',
  freshIndependentRetry: false,
  learnerTurnsObserved: 3,
  summary: 'Learner engaged in a sustained relevant conversation.',
};

function create() {
  const changes = [];
  const runtime = new SceneLessonRuntime(lesson, {
    preview: true,
    onStateChange: (state) => changes.push(state),
  });
  runtime.markLessonOpeningComplete();
  const complete = runtime.tools.find((tool) => tool.declaration.name === 'complete_scene');
  assert.ok(complete);
  return { runtime, complete, changes };
}

function answerQuiz(runtime, complete, correct) {
  const scene = runtime.currentScene;
  assert.ok(scene.activity);
  runtime.markScriptedNarrationComplete(scene.id);
  const option = scene.activity.options.find((x) => (x.id === scene.activity.correctOptionId) === correct);
  assert.ok(option);
  const choice = runtime.submitBoardChoice(scene.id, option.id);
  assert.deepEqual(choice, { accepted: true, correct });
  assert.equal(runtime.snapshot.scenes[scene.id].activityAnswered, true);
  assert.equal(runtime.snapshot.scenes[scene.id].activityPassed, correct);
  assert.match(complete.handle(quizAudit).error, /quiz has not been answered and explained/);
  assert.equal(runtime.markQuizFeedbackPlayed(scene.id), true);
  const result = complete.handle(quizAudit);
  assert.equal(result.completedSceneId, scene.id);
  assert.equal(result.lessonComplete, false);
  const evidence = runtime.snapshot.scenes[scene.id].evidence.at(-1);
  assert.equal(evidence.evidenceType, 'receptive_comprehension');
  assert.equal(evidence.learnerTurnsObserved, 0);
  assert.equal(evidence.summary.includes('incorrectly'), !correct);
  return result;
}

test('lab has 4 MC teaching scenes followed by a required speaking scene', () => {
  assert.notEqual(lesson.id, 'b1-u1-l02-keep-conversation-going');
  assert.equal(lesson.scenes.length, 5);
  assert.ok(lesson.scenes.slice(0,-1).every((scene) => scene.activity));
  assert.equal(lesson.scenes.at(-1).id, 'fresh-transfer');
  assert.equal(lesson.scenes.at(-1).activity, undefined);
  for (const scene of lesson.scenes) {
    const beats = B1_TEACHER_LAB_SCRIPT[scene.id];
    assert.ok(beats?.length, 'missing authored lines: ' + scene.id);
    assert.equal(new Set(beats.map((beat) => beat.id)).size, beats.length);
    assert.ok(beats.every((beat) => beat.line.length > 30));
    if (scene.activity) {
      assert.ok(B1_TEACHER_LAB_QUIZ_FEEDBACK[scene.id]?.correct);
      assert.ok(B1_TEACHER_LAB_QUIZ_FEEDBACK[scene.id]?.wrong);
      assert.ok(scene.activity.options.some((o) => o.id === scene.activity.correctOptionId));
      assert.equal(new Set(scene.activity.options.map((o) => o.id)).size, scene.activity.options.length);
    }
  }
});

test('quiz requires finished authored narration and an attempt before Otti can advance', () => {
  const { runtime, complete } = create();
  const id = runtime.currentScene.id;
  assert.match(complete.handle(quizAudit).error, /authored narration/);
  assert.equal(runtime.submitBoardChoice(id, 'continue').accepted, false);
  runtime.markScriptedNarrationComplete(id);
  assert.match(complete.handle(quizAudit).error, /quiz has not been answered and explained/);
  const showBoard = runtime.tools.find((tool) => tool.declaration.name === 'show_board');
  assert.match(showBoard.handle({ mode: 'note', title: 'Override', items: ['x'] }).error, /authored narrator/);
});

test('wrong choice is truthfully recorded and moves forward after spoken explanation, without speaking proof', () => {
  const { runtime, complete } = create();
  const result = answerQuiz(runtime, complete, false);
  assert.equal(runtime.snapshot.scenes['warm-up'].activityChoiceId !== undefined, true);
  assert.equal(runtime.currentScene.id, 'get-to-know');
  assert.equal(result.completedSceneId, 'warm-up');
  assert.equal(runtime.submitBoardChoice('warm-up', 'continue').accepted, false);
});

test('correct choice is recorded and does not require microphone input during teaching', () => {
  const { runtime, complete } = create();
  answerQuiz(runtime, complete, true);
  answerQuiz(runtime, complete, true);
  assert.equal(runtime.snapshot.scenes['get-to-know'].activityPassed, true);
  assert.equal(runtime.currentScene.id, 'keep-in-touch');
});

test('all quizzes complete in sequence but the final speaking cannot complete without microphone activity', () => {
  const { runtime, complete } = create();
  for (const scene of lesson.scenes.slice(0,-1)) {
    assert.equal(runtime.currentScene.id, scene.id);
    answerQuiz(runtime, complete, scene.id !== 'keep-in-touch');
  }
  assert.equal(runtime.currentScene.id, 'fresh-transfer');
  assert.match(complete.handle(spokenAudit).error, /authored narration/);
  runtime.markScriptedNarrationComplete('fresh-transfer');
  assert.match(complete.handle(spokenAudit).error, /voice activity/);
  runtime.recordLearnerAudioLevel(0.5);
  const result = complete.handle(spokenAudit);
  assert.equal(result.completedSceneId, 'fresh-transfer');
  assert.equal(result.lessonComplete, true);
  assert.ok(runtime.snapshot.completedAt);
});

test('no stale/double answers or feedback acknowledgement on another scene', () => {
  const { runtime, complete } = create();
  runtime.markScriptedNarrationComplete('warm-up');
  assert.equal(runtime.submitBoardChoice('fresh-transfer', 'continue').accepted, false);
  assert.equal(runtime.submitBoardChoice('warm-up', 'not-valid').accepted, false);
  assert.equal(runtime.submitBoardChoice('warm-up', 'continue').accepted, true);
  assert.equal(runtime.submitBoardChoice('warm-up', 'stop').accepted, false);
  assert.equal(runtime.markQuizFeedbackPlayed('get-to-know'), false);
  assert.equal(runtime.markQuizFeedbackPlayed('warm-up'), true);
  complete.handle(quizAudit);
  assert.equal(runtime.submitBoardChoice('warm-up', 'continue').accepted, false);
});

test('narration director only progresses on completed audio and replays interrupted line', () => {
  const narrator = new ScriptedNarrationDirector();
  const beats = B1_TEACHER_LAB_SCRIPT['get-to-know'];
  assert.equal(narrator.start('get-to-know', beats).id, beats[0].id);
  assert.equal(narrator.pause().id, beats[0].id);
  assert.deepEqual(narrator.audioFinished(), { next: null, finishedSceneId: null });
  assert.equal(narrator.resume().id, beats[0].id);
  assert.equal(narrator.audioFinished().next.id, beats[1].id);
  assert.equal(narrator.audioFinished().next.id, beats[2].id);
  assert.deepEqual(narrator.audioFinished(), { next: null, finishedSceneId: 'get-to-know' });
});
