// Real rendering QA: same TeacherLabBoardLayer + CharacterHost + production CSS.
// No Gemini, microphone, credentials, or official progress.
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';

import { LESSON_QA_REGISTRY, getLessonQaRegistration } from '../src/qa/lessonQaRegistry.ts';

// Runner reads the SAME authoritative lesson/beat definitions as the preview.
// npm run qa:learn:frames -- [lesson-id]; default the first registered lesson.
const lessonId=process.argv[2] || Object.keys(LESSON_QA_REGISTRY)[0];
const {lesson, beats, finalSpeakingSceneId}=getLessonQaRegistration(lessonId);
const cases=lesson.scenes.map(scene=>({
  scene:scene.id,
  beats:beats[scene.id].map(beat=>beat.id),
  quiz:Boolean(scene.activity),
}));
const viewports={
  compact:{width:320,height:640},
  phone:{width:400,height:860},
  desktop:{width:1280,height:900},
};
const output='test-results/learn-frames/'+lessonId.replace(/[^a-z0-9_-]/gi,'_');
const basePath='/qa.html';
const screenshotStates=[];
for(const entry of cases){
  for(const beat of entry.beats)
    screenshotStates.push({scene:entry.scene,beat,state:entry.scene===finalSpeakingSceneId?'speaking-listening':'teaching'});
  if(entry.quiz){
    for(const state of ['question','correct-feedback','wrong-feedback'])
      screenshotStates.push({scene:entry.scene,beat:entry.beats.at(-1),state});
  }
}
const finalBeat=beats[finalSpeakingSceneId].at(-1).id;
screenshotStates.push({scene:finalSpeakingSceneId,beat:finalBeat,state:'speaking-otti'});
screenshotStates.push({scene:finalSpeakingSceneId,beat:finalBeat,state:'complete'});
const firstQuiz=lesson.scenes.find(scene=>scene.activity);
if(!firstQuiz)throw Error(lessonId+': QA contract needs a deterministic MC checkpoint');
const firstQuizBeat=beats[firstQuiz.id].at(-1).id;
const lastQuiz=lesson.scenes.filter(scene=>scene.activity).at(-1);
const lastQuizBeat=lastQuiz ? beats[lastQuiz.id].at(-1).id : '';
const server=await createServer({server:{host:'127.0.0.1',port:0},logLevel:'error'});
await server.listen();
const base=server.resolvedUrls.local[0];
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[],tiles=new Map();
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try{
  for(const [viewport,dims] of Object.entries(viewports)){
    const context=await browser.newContext({viewport:dims,reducedMotion:'reduce'});
    const page=await context.newPage();
    const exceptions=[];
    page.on('pageerror',e=>exceptions.push('JS: '+e.message));
    page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))exceptions.push('HTTP '+r.status()+' '+r.url())});
    for(const entry of screenshotStates){
      exceptions.length=0;
      const params=new URLSearchParams({...entry,lesson:lessonId});
      await page.goto(new URL(basePath+'?'+params.toString(),base).href,{waitUntil:'networkidle'});
      await page.locator('[data-qa-ready=true]').waitFor({timeout:15000});
      await page.evaluate(()=>document.fonts.ready);
      const computed=await page.evaluate(()=>{
        const a=sel=>document.querySelector(sel);
        const host=a('[data-qa-ready]');
        const stage=a('.premium-lesson-stage');
        const board=a('[data-lesson-board]');
        const panel=a('.teacher-pilot-card');
        const quiz=a('.teacher-pilot-task');
        const mascot=a('.premium-lesson-character');
        const visual=[...document.querySelectorAll('.teacher-lab-visual')].find(el=>getComputedStyle(el).display!=='none');
        const buttons=[...(quiz?.querySelectorAll('button')||[])];
        const frame=node=>{if(!node)return null;const x=node.getBoundingClientRect();return {x:Math.round(x.x),y:Math.round(x.y),w:Math.round(x.width),h:Math.round(x.height),bottom:Math.round(x.bottom)}};
        const stageRect=stage?.getBoundingClientRect();
        const boardRect=board?.getBoundingClientRect();
        const critical=[...document.querySelectorAll('.teacher-pilot-task button,.teacher-pilot-task>strong,.teacher-pilot-task p,.teacher-pilot-eyebrow')];
        const overflow=critical.filter(node=>{
          const r=node.getBoundingClientRect();
          return boardRect&&(r.top<boardRect.top-2||r.bottom>boardRect.bottom+2||r.left<boardRect.left-2||r.right>boardRect.right+2);
        }).map(n=>n.textContent?.slice(0,35));
        return {
          lesson:host?.getAttribute('data-lesson-id'),
          state:host?.getAttribute('data-lesson-state'),
          scene:host?.getAttribute('data-scene-id'),
          beat:host?.getAttribute('data-beat-id'),
          stage:frame(stage),board:frame(board),panel:frame(panel),quiz:frame(quiz),visual:frame(visual),mascot:frame(mascot),
          buttonRects:buttons.map(frame),
          optionCount:buttons.length,
          expectedOptionCount:Number(host?.getAttribute('data-qa-expected-options')||0),
          offstage:overflow,
          sideways:document.documentElement.scrollWidth>innerWidth+1,
          boardScrollable:Boolean(board&&board.scrollHeight>board.clientHeight+2),
          panelScrollable:Boolean(panel&&panel.scrollHeight>panel.clientHeight+2),
          mascotOverlapsQuiz: Boolean(mascot&&(()=>{const x=mascot.getBoundingClientRect();return [...(quiz?.querySelectorAll('button,p')||[])].some(n=>{const y=n.getBoundingClientRect();return y.width&&y.height&&x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top})})()),
          bodyHeight:document.documentElement.scrollHeight,
        };
      });
      const warnings=[];
      if(computed.state!==entry.state||computed.scene!==entry.scene||computed.beat!==entry.beat)warnings.push('wrong fixture state');
      if(computed.lesson!==lessonId)warnings.push('wrong lesson');
      if(computed.sideways)warnings.push('horizontal overflow');
      if(computed.boardScrollable||computed.panelScrollable)warnings.push('clipped/scrolling board');
      if(computed.offstage.length)warnings.push('quiz items outside board: '+computed.offstage.join('; '));
      if(['question','correct-feedback','wrong-feedback'].includes(entry.state)
        &&computed.optionCount!==computed.expectedOptionCount)warnings.push('quiz options differ from canonical activity');
      if(computed.mascotOverlapsQuiz)warnings.push('Otti overlaps question area');
      if(computed.buttonRects.some(x=>x&&x.h<40))warnings.push('small option touch targets');
      if(computed.stage?.h<100)warnings.push('lesson stage collapsed');
      warnings.push(...exceptions);
      const id=entry.scene+'--'+entry.beat+'--'+entry.state;
      const path=output+'/'+id+'--'+viewport+'.png';
      await page.screenshot({path,fullPage:true});
      rows.push({...entry,id,viewport,computed,warnings,path});
      const key=entry.scene+'--'+viewport;
      tiles.set(key,[...(tiles.get(key)||[]),{id,path,warnings}]);
      // Return compact real screenshots for human image inspection from CI logs.
      if((viewport==='phone'&&[
        firstQuiz.id+'--'+firstQuizBeat+'--question',
        lastQuiz?.id+'--'+lastQuizBeat+'--wrong-feedback',
        finalSpeakingSceneId+'--'+finalBeat+'--speaking-listening',
      ].includes(id))||(viewport==='compact'&&[
        firstQuiz.id+'--'+firstQuizBeat+'--wrong-feedback',
        lastQuiz?.id+'--'+lastQuizBeat+'--question',
      ].includes(id))){
        const jpeg=await page.screenshot({type:'jpeg',quality:48});
        console.log('FRAME_IMAGE|'+id+'|'+jpeg.toString('base64'));
      }
    }
    // Real click flow on the same component as Live, no mocked answer markup.
    if(viewport==='phone'){
      const wrongIndex=firstQuiz.activity.options.findIndex(option=>option.id!==firstQuiz.activity.correctOptionId);
      const params=new URLSearchParams({lesson:lessonId,scene:firstQuiz.id,beat:firstQuizBeat,state:'question'});
      await page.goto(new URL(basePath+'?'+params,base).href);
      await page.locator('[data-qa-ready=true]').waitFor();
      await page.locator('.teacher-pilot-options button').nth(wrongIndex).click();
      assert.equal(await page.locator('[data-qa-ready]').getAttribute('data-lesson-state'),'wrong-feedback');
      assert.equal(await page.locator('.teacher-pilot-options button.is-right').count(),1);
      assert.equal(await page.locator('.teacher-pilot-options button.is-wrong').count(),1);
    }
    await context.close();
  }
  for(const [key,values] of tiles){
    const html=await Promise.all(values.map(async v=>'<figure><img src="data:image/png;base64,'+(await readFile(v.path)).toString('base64')+'"/><figcaption>'+esc(v.id)+(v.warnings.length?'<em>'+esc(v.warnings.join('; '))+'</em>':'')+'</figcaption></figure>'));
    const page=await browser.newPage({viewport:{width:1250,height:900}});
    await page.setContent('<!doctype html><meta charset=utf-8><style>body{background:#ecf2ef;font:14px system-ui;padding:10px}h2{font-size:22px}main{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}figure{background:white;margin:0;padding:7px;border-radius:10px;min-width:0}img{width:100%;display:block}figcaption{overflow-wrap:anywhere}em{display:block;color:#b43;font-style:normal}</style><h2>'+esc(key)+'</h2><main>'+html.join('')+'</main>');
    await page.screenshot({path:output+'/'+key+'--CONTACT.png',fullPage:true});
    await page.close();
  }
  await writeFile(output+'/REPORT.json',JSON.stringify(rows,null,2)+'\n');
  await writeFile(output+'/REPORT.md',['# Classroom frame audit','',...rows.map(r=>'- '+r.viewport+' / '+r.id+' : '+(r.warnings.join(' | ')||'no structural warning')),''].join('\n'));
  const failures=rows.filter(r=>r.warnings.length);
  console.log('FRAME_QA_SUMMARY '+JSON.stringify({lessonId,scenes:lesson.scenes.length,snapshots:rows.length,contactSheets:tiles.size,warningCount:failures.length,firstWarnings:failures.slice(0,18).map(r=>({id:r.id,viewport:r.viewport,warnings:r.warnings,stage:r.computed.stage,board:r.computed.board,quiz:r.computed.quiz}))}));
  if(failures.length)process.exitCode=1;
}finally{await browser.close();await server.close();}
