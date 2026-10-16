import assert from 'node:assert/strict';
import { test } from 'node:test';
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
  assert.throws(()=>validateLessonAudio({...A1_U1_L01_AUDIO,assetUrl:'https://example.com/audio.mp3'}),/reviewed audio timecodes/);
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
test('teacher tool refuses unapproved clip IDs and waits for clip finish',async()=>{
  const voices=[{lang:'en-US',name:'Voice A'},{lang:'en-US',name:'Voice B'}];
  const spoken=[];
  class FakeUtterance {
    constructor(text){this.text=text;this.onend=null;this.onerror=null;}
  }
  const synth={getVoices:()=>voices,cancel:()=>{},speak(u){spoken.push({text:u.text,voice:u.voice?.name});queueMicrotask(()=>u.onend?.())}};
  globalThis.window={speechSynthesis:synth,setTimeout,clearTimeout};
  globalThis.SpeechSynthesisUtterance=FakeUtterance;
  const listener=[];
  const ctrl=new LessonAudioController(A1_U1_L01_AUDIO,x=>listener.push(x));
  const tool=lessonAudioTool(A1_U1_L01_AUDIO,ctrl,async()=>true);
  assert.ok(tool.declaration.parameters.properties.clipId.enum.includes('name-exchange'));
  assert.match((await tool.handle({clipId:'made-up'})).error,/Unknown clip/);
  const result=await tool.handle({clipId:'name-exchange'});
  assert.equal(result.status,'played');
  assert.deepEqual(spoken.map(x=>x.voice),['Voice A','Voice B']);
  assert.equal(listener.at(-1).status,'idle');
  ctrl.close();
  delete globalThis.window;
  delete globalThis.SpeechSynthesisUtterance;
});
