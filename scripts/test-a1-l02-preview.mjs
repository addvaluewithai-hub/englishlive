import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { A1_L02_LESSON as lesson, A1_L02_BEATS as beats, A1_L02_FEEDBACK as feedback, A1_L02_AUDIO as audio } from '../src/lessonScenes/a1/l02AgePreview.ts';
import { A1_L02_FRAMES, A1L02LearningVisual } from '../src/lessonScenes/a1/A1L02LearningVisual.tsx';
import { LESSON_QA_REGISTRY, assertQaRegistration, buildLessonQaCases } from '../src/qa/lessonQaRegistry.ts';
import { validateLessonAudio, getAuthoredClip } from '../src/lessonScenes/a1/listeningAudioPilot.ts';
import { getQaLessonVisual } from '../src/qa/lessonQaVisuals.ts';

test('L02 is an isolated seven-scene teaching preview; older L01 previews are retained',()=>{
  assert.equal(lesson.id,'a1-u1-l02-age-review');
  assert.equal(lesson.scenes.length,7);
  assert.equal(lesson.scenes.at(-1).id,'fresh-speaking');
  assert.equal(lesson.scenes.at(-1).activity,undefined);
  assert.ok(LESSON_QA_REGISTRY['a1-u1-l01-v04-review']);
  assertQaRegistration(LESSON_QA_REGISTRY[lesson.id]);
  assert.ok(getQaLessonVisual('a1-l02-age-board'));
});
test('all 20 meaning-first authored boards render accessible bespoke SVG, no stock portraits',()=>{
  const expected=Object.entries(beats).flatMap(([scene,values])=>values.map(b=>scene+'/'+b.id));
  assert.equal(expected.length,20);
  assert.deepEqual([...expected].sort(),Object.keys(A1_L02_FRAMES).sort());
  const modes=new Set();
  for(const key of expected){
    const frame=A1_L02_FRAMES[key];
    assert.ok(frame.alt&&frame.title&&frame.items.length&&frame.footer);
    modes.add(frame.mode);
    const [sceneId,beatId]=key.split('/');
    const svg=renderToStaticMarkup(createElement(A1L02LearningVisual,{sceneId,beatId}));
    assert.match(svg,/data-l02-learning-board=/);
    assert.match(svg,/role="img"/);
    assert.doesNotMatch(svg,/portrait|head-shape|shirt|person drawing/i);
  }
  assert.ok(modes.has('number')&&modes.has('contrast')&&modes.has('cards')&&modes.has('transfer')&&modes.has('listen')&&modes.has('question'));
  assert.ok(A1_L02_FRAMES['age-meaning/answer-age'].items.includes('years old'));
  assert.deepEqual(A1_L02_FRAMES['number-patterns/teen-ty'].items,['thirTEEN','THIRty']);
});
test('real distinct factory WAVs and word-aligned turn/clip bounds are not fabricated',()=>{
  validateLessonAudio(audio);
  assert.equal(audio.approved,true);
  assert.equal(audio.turns.length,9);
  assert.equal(audio.clips.length,3);
  assert.deepEqual(audio.turns.slice(0,8).map(x=>x.startMs),[0,2670,4930,7560,10600,11680,14270,17580]);
  assert.deepEqual(audio.turns.slice(0,8).map(x=>x.endMs),[2670,4930,7560,10600,11680,14270,17580,19120]);
  assert.equal(audio.turns[8].speaker,'recording');
  assert.deepEqual([audio.turns[8].startMs,audio.turns[8].endMs],[0,10280]);
  assert.equal(getAuthoredClip(audio,'full-conversation').length,8);
  assert.equal(getAuthoredClip(audio,'age-exchange').length,3);
  assert.equal(getAuthoredClip(audio,'phone-message').length,1);
  const phone=audio.clips.find(x=>x.id==='phone-message');
  assert.notEqual(phone.audioUrl,audio.audioUrl,'Separate real recorded voicemail asset, not a slice of conversation');
  assert.match(phone.audioUrl,/u1-l02-phone-v01-20261017\.wav$/);
  assert.match(audio.audioUrl,/u1-l02-dialogue-v01-20261017\.wav$/);
  assert.match(phone.transcriptUrl,/\.transcript\.json$/);
  assert.match(phone.vttUrl,/\.transcript\.vtt$/);
  assert.equal(phone.startMs,0);
  assert.equal(phone.endMs,10280);
});
test('six activities have correct keys and spoken feedback; wrong choices never auto-pass',()=>{
  const scenes=lesson.scenes.filter(s=>s.activity);
  assert.equal(scenes.length,6);
  assert.deepEqual(scenes.map(s=>s.activity.options.findIndex(x=>x.id===s.activity.correctOptionId)),[1,0,2,0,2,1]);
  for(const s of scenes){
    assert.equal(s.activity.options.length,3);
    assert.ok(feedback[s.id].correct&&feedback[s.id].wrong);
    assert.ok(s.activity.successAr&&s.activity.retryAr);
  }
  assert.equal(lesson.scenes.find(s=>s.id==='voicemail').activity.correctOptionId,'68');
  assert.equal(lesson.scenes.find(s=>s.id==='age-meaning').activity.correctOptionId,'19');
  assert.equal(lesson.scenes.at(-1).interaction.kind,'fresh_transfer');
  assert.match(lesson.scenes.at(-1).interaction.setup,/24/);
});
test('no answer leak in actual first-listen or independent phone recording',async()=>{
  for(const k of ['listen-first/listen-neutral','listen-first/listen-question','voicemail/voicemail-context','voicemail/voicemail-question']){
    const f=A1_L02_FRAMES[k];
    const x=[f.title,f.items.join(' '),f.gloss??'',f.footer].join(' ');
    assert.doesNotMatch(x,/(class card|50268368|nineteen|the age|بكتبوا|ستة تمانية)/i);
  }
  assert.equal(beats['listen-first'][0].audioClipId,'full-conversation');
  assert.equal(beats.voicemail[0].audioClipId,'phone-message');
  assert.ok(!beats.voicemail[0].line.includes('50268368'));
  assert.ok(!beats.voicemail[0].line.includes('six, eight'));
  const src=await readFile(new URL('../src/lessonScenes/LessonAudioPanel.tsx',import.meta.url),'utf8');
  assert.match(src,/sceneClipId!=='phone-message'/,'Phone transcript must remain hidden before learner answer');
});
test('QA registry captures all beats, audio states, six correct and six wrong outcomes',()=>{
  const cases=buildLessonQaCases(LESSON_QA_REGISTRY[lesson.id]);
  assert.equal(cases.filter(c=>c.state==='teaching'||c.state==='speaking-listening').length,20);
  assert.equal(cases.filter(c=>c.state==='audio-loading').length,3);
  assert.equal(cases.filter(c=>c.state==='audio-playing').length,3);
  assert.equal(cases.filter(c=>c.state==='question').length,6);
  assert.equal(cases.filter(c=>c.state==='correct-feedback').length,6);
  assert.equal(cases.filter(c=>c.state==='wrong-feedback').length,6);
  assert.equal(cases.at(-1).state,'complete');
});
test('real factory output corresponds to the exact reviewed source, not L01 source',async()=>{
 const a=JSON.parse(await readFile(new URL('../production/a1-u1-l02/delivery-audit.json',import.meta.url),'utf8'));
 assert.equal(a.factoryRunId,39050780673);
 assert.equal(a.curriculumOwner13RulingsApproved,false);
 assert.equal(a.conversation.wordsExpected,41);
 assert.equal(a.conversation.wordsRecognized,41);
 assert.equal(a.conversation.wavDurationMs,19120);
 assert.equal(a.phone.wavDurationMs,10280);
 assert.equal(a.phone.lastDigits,'68');
 assert.ok(a.phone.transcriptRecognizedLastDigits);
 assert.equal(a.humanAuditionVerified,false);
});
