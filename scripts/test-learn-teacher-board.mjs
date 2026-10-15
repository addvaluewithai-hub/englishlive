import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SceneLessonRuntime } from '../src/lessonScenes/SceneLessonRuntime.ts';
import { B1_L02_TEACHER_BOARD_PILOT as lesson } from '../src/lessonScenes/b1/teacherBoardPilot.ts';

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

  // Even a plausible spoken attempt cannot skip the application-owned check.
  runtime.recordLearnerAudioLevel(0.5);
  assert.match(complete.handle(validAudit).error, /board comprehension check/);
  assert.equal(runtime.submitBoardChoice(current.id, 'old').correct, false);
  assert.match(complete.handle(validAudit).error, /board comprehension check/);
  assert.equal(runtime.snapshot.scenes[current.id].activityPassed, undefined);

  assert.deepEqual(runtime.submitBoardChoice(current.id, 'new'), { accepted: true, correct: true });
  assert.equal(runtime.snapshot.scenes[current.id].activityPassed, true);
  assert.equal(complete.handle(validAudit).completedSceneId, current.id);
  assert.equal(runtime.currentScene.id, 'keep-in-touch');
});

test('a tap is not spoken evidence; stale or unknown choices are rejected', () => {
  const { runtime, complete, changes } = create();
  runtime.recordLearnerAudioLevel(0.5);
  complete.handle(validAudit);
  const id = runtime.currentScene.id;
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
