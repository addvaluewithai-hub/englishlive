import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { A1_U1_L01_AUDIO, getAuthoredClip, validateLessonAudio } from '../src/lessonScenes/a1/listeningAudioPilot.ts';
import { A1_LISTENING_BEATS, A1_LISTENING_FEEDBACK } from '../src/lessonScenes/a1/listeningTeacherScript.ts';
import { A1_U1_L01_LISTENING_PILOT as lesson } from '../src/lessonScenes/a1/listeningTeacherPilot.ts';
import { LessonAudioController, lessonAudioTool } from '../src/audio/LessonAudioController.ts';
import { LESSON_QA_REGISTRY, buildLessonQaCases } from '../src/qa/lessonQaRegistry.ts';

test('A1 canonical goal follows Stage-07 scope; MCs do not replace final speech',()=>{
  assert.equal(lesson.source.sourceLessonId,'U1-L01');
  assert.equal(lesson.scenes.at(-1).interaction.kind,'fresh_transfer');
  assert.equal(lesson.scenes.at(-1).activity,undefined);
  assert.ok(lesson.scenes.slice(0,-1).every(x=>x.activity));
  for(const scene of lesson.scenes.slice(0,-1)){
    assert.ok(A1_LISTENING_FEEDBACK[scene.id]?.correct);
    assert.ok(A1_LISTENING_FEEDBACK[scene.id]?.wrong);
  }
  assert.equal(A1_LISTENING_BEATS['fresh-meeting'].at(-1).board,null);
});
test('authored audio is immutable ID-based and has full, name and wellbeing clip coverage',()=>{
  validateLessonAudio(A1_U1_L01_AUDIO);
  assert.equal(getAuthoredClip(A1_U1_L01_AUDIO,'full-conversation').length,6);
  assert.deepEqual(getAuthoredClip(A1_U1_L01_AUDIO,'name-exchange').map(x=>x.speaker),['maya','leo']);
  assert.deepEqual(getAuthoredClip(A1_U1_L01_AUDIO,'wellbeing-exchange').map(x=>x.speaker),['maya','leo']);
  assert.throws(()=>getAuthoredClip(A1_U1_L01_AUDIO,'random-url'),/Unknown authored/);
  assert.throws(()=>validateLessonAudio({...A1_U1_L01_AUDIO,approved:true,audioUrl:'https://example.com/audio.wav',
    transcriptUrl:'https://example.com/transcript.json',vttUrl:'https://example.com/transcript.vtt'}),
    /reviewed source turn bounds/);
});
test('frame QA covers every A1 authored audio playback beat plus all 3 MC branches and final speech',()=>{
  const reg=LESSON_QA_REGISTRY[lesson.id];
  const cases=buildLessonQaCases(reg);
  assert.equal(cases.filter(x=>x.state==='audio-playing').length,3);
  assert.equal(cases.filter(x=>x.state==='wrong-feedback').length,3);
  assert.equal(cases.filter(x=>x.state==='question').length,3);
  assert.ok(cases.some(x=>x.state==='speaking-listening'));
  assert.ok(cases.some(x=>x.state==='complete'));
});
test('TTS factory request matches immutable A1 script with two curated voices and timed transcript',async()=>{
  const request=JSON.parse(await readFile(new URL('../production/a1-u1-l01/gemini-tts-request.json',import.meta.url)));
  assert.deepEqual(request.turns.map(x=>x.text),A1_U1_L01_AUDIO.turns.map(x=>x.english));
  assert.deepEqual(request.turns.map(x=>x.speaker),['Maya','Leo','Maya','Leo','Maya','Leo']);
  assert.deepEqual(request.speakers,{Maya:'Aoede',Leo:'Achird'});
  assert.equal(request.format,'wav');
  assert.equal(request.sample_rate,24000);
  assert.equal(request.routing,'quality');
  assert.equal(request.transcript.diarization,true);
  assert.equal(request.transcript.write_vtt,true);
  assert.deepEqual(request.transcript.language_codes,['en-US']);
});

test('factory clip player rejects unapproved recording: no browser-synth pretend success',async()=>{
  const ctrl=new LessonAudioController(A1_U1_L01_AUDIO);
  const tool=lessonAudioTool(A1_U1_L01_AUDIO,ctrl,async()=>true);
  assert.ok(tool.declaration.parameters.properties.clipId.enum.includes('name-exchange'));
  assert.match((await tool.handle({clipId:'made-up'})).error,/Unknown .*clip/i);
  const result=await tool.handle({clipId:'name-exchange'});
  assert.match(result.error,/unavailable/);
  assert.equal(ctrl.snapshot.status,'idle');
  ctrl.close();
});

test('approved recording seek finishes only after the audited segment boundary',async()=>{
  const completed=[];
  class MockAudio {
    static instances=[];
    constructor(url){this.url=url;this.currentTime=0;this.duration=12;this.events=new Map();MockAudio.instances.push(this);}
    addEventListener(name,cb){this.events.set(name,cb);}
    removeEventListener(name){this.events.delete(name);}
    removeAttribute(){}
    load(){queueMicrotask(()=>this.events.get('loadedmetadata')?.());}
    async play(){this.played=true;}
    pause(){this.paused=true;}
    tick(sec){this.currentTime=sec;this.events.get('timeupdate')?.();}
  }
  const previous=globalThis.Audio;
  globalThis.Audio=MockAudio;
  const turnTimes=[{startMs:0,endMs:2000},{startMs:2000,endMs:3900},
    {startMs:3900,endMs:5900},{startMs:5900,endMs:7900},
    {startMs:7900,endMs:9900},{startMs:9900,endMs:12000}];
  const withTimes={
    ...A1_U1_L01_AUDIO,approved:true,
    audioUrl:'https://example.com/recorded.wav',
    transcriptUrl:'https://example.com/words.json',
    vttUrl:'https://example.com/words.vtt',
    turns:A1_U1_L01_AUDIO.turns.map((t,i)=>({...t,...turnTimes[i]})),
    clips:A1_U1_L01_AUDIO.clips.map(clip=>({...clip,
      startMs:turnTimes[A1_U1_L01_AUDIO.turns.findIndex(t=>t.id===clip.turnIds[0])].startMs,
      endMs:turnTimes[A1_U1_L01_AUDIO.turns.findIndex(t=>t.id===clip.turnIds.at(-1))].endMs
    }))
  };
  validateLessonAudio(withTimes);
  try {
    const controller=new LessonAudioController(withTimes,s=>completed.push(s));
    let finished=false;
    const pending=controller.play('name-exchange').then(r=>{finished=true;return r});
    await Promise.resolve();await Promise.resolve();
    const player=MockAudio.instances.at(-1);
    assert.equal(player.currentTime,0);
    player.tick(2.3);
    assert.equal(finished,false);
    assert.equal(controller.snapshot.speaker,'leo');
    player.tick(3.9);
    const result=await pending;
    assert.equal(result.status,'played');
    assert.equal(result.source,'gemini-tts-factory');
    assert.equal(controller.snapshot.status,'idle');
    controller.close();
  } finally {
    if(previous===undefined)delete globalThis.Audio;
    else globalThis.Audio=previous;
  }
});
