// Enumerate all registered authored lessons, not a hand-coded B1 screenshot list.
// Every registered lesson must receive its own full screenshot suite in CI.
import { spawnSync } from 'node:child_process';
import { LESSON_QA_REGISTRY } from '../src/qa/lessonQaRegistry.ts';
const ids=Object.keys(LESSON_QA_REGISTRY);
if(!ids.length)throw Error('No registered lessons to capture');
const errors=[];
for(const lessonId of ids){
  console.log('START_LESSON_FRAME_QA '+lessonId);
  const result=spawnSync(process.execPath,
    ['--import','tsx','scripts/capture-learn-frame-sheets.mjs',lessonId],
    {stdio:'inherit',env:process.env});
  if(result.status!==0)errors.push(lessonId+' exit='+result.status);
}
console.log('FRAME_QA_ALL '+JSON.stringify({registered:ids.length,failed:errors}));
if(errors.length)process.exitCode=1;
