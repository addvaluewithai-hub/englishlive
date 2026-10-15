import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  LESSON_QA_REGISTRY, getLessonQaRegistration,
  assertQaRegistration, buildLessonQaCases,
} from '../src/qa/lessonQaRegistry.ts';

test('registered B1 pilot generates every beat/MC branch and final Speaking automatically', () => {
  const qa=getLessonQaRegistration('b1-u1-l02-teacher-board-lab');
  const cases=buildLessonQaCases(qa);
  assert.equal(cases.length, 26);
  assert.equal(qa.lesson.scenes.length, 5);
  for(const scene of qa.lesson.scenes) {
    for(const beat of qa.beats[scene.id]) {
      assert.ok(cases.some(c=>c.scene===scene.id&&c.beat===beat.id));
    }
    if (scene.activity) {
      const last=qa.beats[scene.id].at(-1).id;
      for(const state of ['question','correct-feedback','wrong-feedback'])
        assert.ok(cases.some(c=>c.scene===scene.id&&c.beat===last&&c.state===state));
    }
  }
  assert.equal(cases.at(-1).state, 'complete');
});

test('a different synthetic lesson uses the same generator with new scene/beat IDs',()=>{
  const original=Object.values(LESSON_QA_REGISTRY)[0];
  const fake={
    lesson:{
      ...original.lesson,
      id:'a1-example-not-published',
      scenes:[
        {...original.lesson.scenes[0],id:'first-contact'},
        {...original.lesson.scenes.at(-1),id:'fresh-introduction'},
      ],
    },
    beats:{
      'first-contact':[{id:'hello',line:'Today we will greet someone and exchange names.',board:null}],
      'fresh-introduction':[{id:'roleplay',line:'Try a new context with a new person.',board:null}],
    },
    finalSpeakingSceneId:'fresh-introduction',
    visualKey:'a1-unique-illustration',
  };
  assertQaRegistration(fake);
  assert.deepEqual(buildLessonQaCases(fake).map(x=>x.state),
    ['teaching','question','correct-feedback','wrong-feedback',
     'speaking-listening','speaking-otti','complete']);
});

test('missing authoring or final speaking is rejected rather than skipped',()=>{
  const original=getLessonQaRegistration('b1-u1-l02-teacher-board-lab');
  assert.throws(()=>assertQaRegistration({...original,beats:{}}),/no authored beats/);
  assert.throws(()=>assertQaRegistration({...original,finalSpeakingSceneId:'warm-up'}),/final speaking must be last/);
  assert.throws(()=>getLessonQaRegistration('not-registered'),/No authored QA registration/);
});
