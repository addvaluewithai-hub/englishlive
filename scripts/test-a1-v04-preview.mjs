import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  A1_U1_L01_V04_LESSON as lesson, A1_V04_BEATS as beats,
  A1_V04_FEEDBACK as feedback, A1_U1_L01_V04_AUDIO as audio,
} from '../src/lessonScenes/a1/v04Preview.ts';
import { getAuthoredClip, validateLessonAudio } from '../src/lessonScenes/a1/listeningAudioPilot.ts';
import { LESSON_QA_REGISTRY, buildLessonQaCases, assertQaRegistration } from '../src/qa/lessonQaRegistry.ts';
import { getQaLessonVisual } from '../src/qa/lessonQaVisuals.ts';

test('isolated v04 is registered; the old pilot remains unmodified',()=>{
  assert.equal(lesson.id,'a1-u1-l01-v04-review');
  assert.equal(lesson.scenes.length,7);
  assert.equal(lesson.scenes.at(-1).interaction.kind,'fresh_transfer');
  assert.equal(lesson.scenes.at(-1).activity,undefined);
  assert.ok(LESSON_QA_REGISTRY['a1-u1-l01-listening-lab']);
  const registry=LESSON_QA_REGISTRY[lesson.id];
  assertQaRegistration(registry);
  assert.ok(getQaLessonVisual('a1-v04-review'));
});
test('v04 natural listening contains eight reviewed source turns and honest missing WAV status',()=>{
  validateLessonAudio(audio);
  assert.equal(audio.turns.length,8);
  assert.equal(audio.clips.length,5);
  assert.equal(audio.approved,false);
  assert.equal(audio.audioUrl,null);
  assert.equal(audio.factoryJobId,'NOT-COMMISSIONED-v04-editorial-review');
  assert.equal(getAuthoredClip(audio,'full-conversation').length,8);
  assert.equal(getAuthoredClip(audio,'greetings-names').length,3);
  assert.equal(getAuthoredClip(audio,'wellbeing').length,3);
  const well=getAuthoredClip(audio,'wellbeing').map(t=>t.english.toLowerCase()).join(' ');
  assert.ok(well.includes('pretty good')&&well.includes('really good'));
  assert.equal(getAuthoredClip(audio,'how-are-you-question').length,1);
  assert.throws(()=>getAuthoredClip(audio,'arbitrary'),/Unknown/);
});
test('all twenty-two teacher beats and bespoke SVG QA states are captured from actual source',()=>{
  const cases=buildLessonQaCases(LESSON_QA_REGISTRY[lesson.id]);
  assert.equal(Object.values(beats).flat().length,22);
  assert.equal(cases.filter(c=>c.state==='teaching'||c.state==='speaking-listening').length,22);
  assert.equal(cases.filter(c=>c.state==='audio-loading').length,4);
  assert.equal(cases.filter(c=>c.state==='audio-playing').length,4);
  assert.equal(cases.filter(c=>c.state==='question').length,6);
  assert.equal(cases.filter(c=>c.state==='correct-feedback').length,6);
  assert.equal(cases.filter(c=>c.state==='wrong-feedback').length,6);
  assert.equal(cases.at(-1).state,'complete');
});
test('gist preview has no premature topic clue or source-audio fake pass',()=>{
  const pre=beats['s01-first-listen'];
  const priorText=pre[0].line + ' ' + JSON.stringify(pre[0].board) + ' ' + JSON.stringify(pre[1].board);
  assert.doesNotMatch(priorText,/(first meeting|first class|كلاس إنجليزي|classmates|بتتعرفوا|بيتقابلوا)/i);
  assert.equal(pre[1].audioClipId,'full-conversation');
  assert.equal(audio.audioUrl,null);
  assert.equal(audio.approved,false);
  const q=lesson.scenes[0].activity;
  assert.equal(q?.correctOptionId,'new-classmates');
  assert.equal(q.options.indexOf(q.options.find(o=>o.id==='new-classmates')),2);
  assert.match(q?.options.find(o=>o.id==='new-classmates').text||'',/بيتعرفوا/);
});
test('six MCs have balanced answer positions and exact teacher correction for each wrong answer',()=>{
  const qs=lesson.scenes.filter(s=>s.activity);
  assert.equal(qs.length,6);
  assert.deepEqual(qs.map(s=>s.activity.options.findIndex(o=>o.id===s.activity.correctOptionId)),[2,0,1,2,0,1]);
  for(const scene of qs){
    assert.ok(feedback[scene.id]?.correct);
    assert.ok(feedback[scene.id]?.wrong);
    const wrong=scene.activity.options.filter(o=>o.id!==scene.activity.correctOptionId);
    if(feedback[scene.id]?.wrongByOption)for(const o of wrong)assert.ok(feedback[scene.id].wrongByOption[o.id]);
  }
  assert.equal(lesson.scenes.at(-1).activity,undefined);
  assert.match(beats['s07-new-speaking'][0].line,/Sam/);
});
