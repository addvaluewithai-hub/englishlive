import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
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
test('v04 recording is real reviewed-preview WAV from single fixed Gemini job with eight time-bounded turns',()=>{
  validateLessonAudio(audio);
  assert.equal(audio.turns.length,8);
  assert.equal(audio.clips.length,5);
  assert.equal(audio.approved,true);
  assert.equal(audio.audioUrl,'https://res.cloudinary.com/as9o12al/video/upload/v1792248912/gemini-tts/englotti-a1-u1-l01-v04-preview-20261017-01.wav');
  assert.equal(audio.factoryJobId,'englotti-a1-u1-l01-v04-preview-20261017-01');
  assert.match(audio.transcriptUrl,/\.transcript\.json$/);
  assert.match(audio.vttUrl,/\.transcript\.vtt$/);
  const boundaries=[0,3390,6080,8920,13190,16680,19200,22070,23280];
  assert.deepEqual(audio.turns.map(t=>t.startMs),boundaries.slice(0,-1));
  assert.deepEqual(audio.turns.map(t=>t.endMs),boundaries.slice(1));
  for (const c of audio.clips) {
    const first=audio.turns.findIndex(t=>t.id===c.turnIds[0]);
    const last=audio.turns.findIndex(t=>t.id===c.turnIds.at(-1));
    assert.equal(c.startMs,audio.turns[first].startMs);
    assert.equal(c.endMs,audio.turns[last].endMs);
    assert.ok(c.endMs>c.startMs);
  }
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
test('gist preview has no premature topic clue even though verified source WAV is now present',()=>{
  const pre=beats['s01-first-listen'];
  const priorText=pre[0].line + ' ' + JSON.stringify(pre[0].board) + ' ' + JSON.stringify(pre[1].board);
  assert.doesNotMatch(priorText,/(first meeting|first class|كلاس إنجليزي|classmates|بتتعرفوا|بيتقابلوا)/i);
  assert.equal(pre[1].audioClipId,'full-conversation');
  assert.match(audio.audioUrl,/\.wav$/);
  assert.equal(audio.approved,true);
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

test('completed single paid TTS job is exact immutable v04 eight-turn script with two original voices', async()=>{
  const req=JSON.parse(await readFile(new URL('../production/a1-u1-l01/gemini-tts-request-v04-preview.json',import.meta.url),'utf8'));
  assert.deepEqual(req.turns.map(t=>t.text),audio.turns.map(t=>t.english),'Never dispatch stale pilot02 script');
  assert.deepEqual(req.turns.map(t=>t.speaker),audio.turns.map(t=>t.speaker==='maya'?'Maya':'Leo'));
  assert.deepEqual(req.speakers,{Maya:'Aoede',Leo:'Achird'});
  assert.equal(req.model,'gemini-3.8-flash-tts');
  assert.equal(req.routing,'explicit');
  assert.equal(req.allow_model_fallback,false);
  assert.equal(req.transcript.write_vtt,true);
  assert.equal(req.transcript.diarization,true);
  assert.equal(req.metadata.jobId,audio.factoryJobId);
  assert.equal(audio.approved,true);
  assert.ok(audio.audioUrl?.startsWith('https://res.cloudinary.com/as9o12al/'));
});

test('verified audio transcript coverage matches exact source and overlap-safe clip bounds',async()=>{
  const audit=JSON.parse(await readFile(new URL('../production/a1-u1-l01/gemini-tts-v04-delivery-audit.json',import.meta.url),'utf8'));
  assert.equal(audit.status,'completed');
  assert.equal(audit.factoryRunId,39042763821);
  assert.equal(audit.jobId,audio.factoryJobId);
  assert.equal(audit.audioFormat,'wav');
  assert.equal(audit.sampleRate,24000);
  assert.equal(audit.audioDurationMs,23280);
  assert.equal(audit.recognizedWordCount,54);
  assert.deepEqual(audit.speakers,['spk:0','spk:1']);
  assert.equal(audit.independentHumanAudioAudition,false);
  assert.equal(audit.curriculumApproved,false);
  assert.deepEqual(audit.turnBoundsMs,audio.turns.map(t=>[t.startMs,t.endMs]));
  assert.equal(audit.waveformSilenceBoundaryCheck,true);
});
