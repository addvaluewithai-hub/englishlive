import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { A1_U1_L01_AUDIO } from '../src/lessonScenes/a1/listeningAudioPilot.ts';
import { A1_U1_L01_LISTENING_PILOT as lesson } from '../src/lessonScenes/a1/listeningTeacherPilot.ts';
import { A1_LISTENING_BEATS, A1_LISTENING_FEEDBACK } from '../src/lessonScenes/a1/listeningTeacherScript.ts';
import { waitForTeacherAudioDrain } from '../src/audio/lessonAudioGate.ts';

const source=JSON.parse(await readFile(new URL('../production/a1-u1-l01/content-coverage.snapshot.json',import.meta.url),'utf8'));
const items=source.items;
const sceneIds=new Set(lesson.scenes.map(scene=>scene.id));
const allAuthoredSpeech=Object.values(A1_LISTENING_BEATS).flat().map(beat=>beat.line).join(' ').toLowerCase();
const recordedScript=A1_U1_L01_AUDIO.turns.map(turn=>turn.english).join(' ').toLowerCase();

test('A1 source coverage is precisely 36 original IDs, including no invented labels or duplicate attestations',()=>{
  assert.equal(source.sourceLessonId,'U1-L01');
  assert.equal(source.sourceItemCount,36);
  assert.equal(items.length,36);
  assert.equal(new Set(items.map(x=>x.sourceId)).size,36);
  assert.deepEqual(Object.fromEntries(['ability','phrase','grammar','word','pronunciation']
    .map(cat=>[cat,items.filter(x=>x.category===cat).length])),
    {ability:8,phrase:5,grammar:8,word:13,pronunciation:2});
  assert.ok(items.every(x=>['teach','bounded','contextual','escalate'].includes(x.disposition)));
  assert.ok(items.every(x=>['reviewed','needs-review'].includes(x.review)));
});

test('every active source ID maps to real authored scene + beat, not an invented or renamed slide',()=>{
  for(const item of items){
    if(item.disposition==='escalate'){
      assert.equal(item.review,'needs-review');
      continue;
    }
    assert.ok(item.evidence?.length,item.label+' missing authored evidence');
    for(const evidence of item.evidence){
      assert.ok(sceneIds.has(evidence.sceneId),item.label+' unknown scene '+evidence.sceneId);
      assert.ok(A1_LISTENING_BEATS[evidence.sceneId]?.some(b=>b.id===evidence.beatId),
        item.label+' unknown beat '+evidence.beatId);
      assert.ok(['listening','guided-explanation','productive-speaking'].includes(evidence.kind),
        item.label+' invalid evidence kind');
      if(evidence.kind==='productive-speaking') assert.equal(evidence.sceneId,'fresh-meeting');
    }
  }
});

test('all five locked productive phrases are present in narrated explanation, source audio and planned Speaking',()=>{
  const names=['Good morning','How are you?','pretty good','really good','Thank you'];
  const list=items.filter(x=>x.category==='phrase');
  assert.deepEqual(list.map(x=>x.label).sort(),names.slice().sort());
  assert.ok(list.every(x=>x.semanticRole==='formulaic_productive_required'));
  // A phrase can be addressed to a named person ("How are you, Leo?")
  // rather than matching only the dictionary's question-mark punctuation.
  const lexical=(value)=>value.toLowerCase().replace(/[?!,.؟]/g,'').replace(/\s+/g,' ').trim();
  for(const phrase of list){
    const text=lexical(phrase.label);
    assert.ok(lexical(allAuthoredSpeech).includes(text),phrase.label+' omitted from teacher narration');
    assert.ok(lexical(recordedScript).includes(text),phrase.label+' omitted from actual TTS source');
    assert.ok(phrase.evidence.some(e=>e.kind==='productive-speaking'),phrase.label+' has no Speaking plan');
  }
  assert.match(A1_LISTENING_BEATS['fresh-meeting'][0].line,/Pretty good/);
  assert.match(A1_LISTENING_BEATS['fresh-meeting'][0].line,/Really good/);
});

test('MC checks do not falsely certify any phrase production',()=>{
  assert.equal(lesson.scenes.at(-1).interaction.kind,'fresh_transfer');
  assert.equal(lesson.scenes.at(-1).activity,undefined);
  assert.ok(lesson.scenes.slice(0,-1).every(s=>s.activity));
  assert.equal(Object.values(A1_LISTENING_FEEDBACK).length,3);
  const flagged=items.filter(x=>x.disposition==='escalate');
  assert.ok(flagged.length>0,'Do not silently wave through source-scope conflicts');
  assert.ok(flagged.some(x=>x.label==='photograph'));
  assert.ok(flagged.some(x=>x.label==="FORM: NEGATIVE DECLARATIVE WITH 'BE'"));
  assert.notEqual(source.qualityGates.ownerAcceptance,'accepted');
});

test('synchronous teacher PCM guard waits for silence before playback',async()=>{
  let active=true;
  let calls=0;
  const result=await waitForTeacherAudioDrain(
    ()=>active,
    async()=>{calls++;if(calls===3)active=false;},
    7);
  assert.equal(result,true);
  assert.equal(calls,3);
  assert.equal(await waitForTeacherAudioDrain(()=>true,async()=>{},2),false);
  assert.equal(await waitForTeacherAudioDrain(()=>false,async()=>{},3),true);
});
