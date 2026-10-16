import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CharacterHost } from '../character/CharacterHost';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { LESSON_QA_REGISTRY, getLessonQaRegistration } from './lessonQaRegistry';
import { getQaLessonVisual } from './lessonQaVisuals';
import { TeacherLabBoardLayer } from '../lessonScenes/TeacherLabBoardLayer';
import { LessonAudioPanel } from '../lessonScenes/LessonAudioPanel';
import '../ui/theme/tokens.css';
import '../styles.css';
import '../session-stage.css';
import '../m9-shell.css';
import '../m9-5-course.css';
import '../scene-pilot.css';
import '../product-v2.css';
import '../product-v2-onboarding.css';
import '../product-v2-secondary.css';
import '../product-v2-scene.css';
import '../product-v2-turn-taking.css';
import '../product-v2-completion.css';
import '../product-v3-premium.css';
import '../product-v4-visual-qa.css';
import '../product-v5-final-polish.css';
import '../product-v6-session-polish.css';
import '../product-v7-final-qa.css';
import '../free-speak-v2.css';
import '../free-speak-v2-fixes.css';
import '../studio.css';
import '../studio-curriculum.css';
import '../otti.css';
import '../lesson-stage-v2.css';
import '../lesson-stage-v2-tuning.css';
import '../product-v8-pixel-perfect.css';
import '../product-v8-fixes.css';
import '../product-v9-levels-polish.css';
import '../speaking-v1.css';
import '../speaking-v1-polish.css';
import '../speaking-live-shared.css';
import '../speaking-roadmap.css';
import '../scene-adaptive.css';
import '../guided-speaking.css';
import '../speaking-learn-live-tuning.css';
import '../practice.css';
import '../practice-mission.css';
import '../practice-hint-dynamic.css';
import '../lessonScenes/teacherBoardPilot.css';

type FixtureMode = 'teaching' | 'question' | 'correct-feedback' | 'wrong-feedback'
  | 'speaking-listening' | 'speaking-otti' | 'complete' | 'audio-loading' | 'audio-playing';
const args = new URLSearchParams(location.search);
const lessonId = args.get('lesson') ?? Object.keys(LESSON_QA_REGISTRY)[0];
const {lesson, beats, visualKey, finalSpeakingSceneId} = getLessonQaRegistration(lessonId);
const LessonVisual = getQaLessonVisual(visualKey);
const sceneId = args.get('scene') || lesson.scenes[0].id;
const selectedScene = lesson.scenes.find(x=>x.id===sceneId);
if (!selectedScene) throw new Error('Unknown QA scene: '+sceneId);
const beatId = args.get('beat') || beats[sceneId]?.[0]?.id || '';
if (!beats[sceneId]?.some(x=>x.id===beatId)) throw new Error('Unknown QA beat: '+beatId);
const mode = (args.get('state') || (selectedScene.activity?'teaching':'speaking-listening')) as FixtureMode;
const validModes:FixtureMode[] = ['teaching','audio-loading','audio-playing','question','correct-feedback','wrong-feedback','speaking-listening','speaking-otti','complete'];
if(!validModes.includes(mode)) throw new Error('Invalid QA state: '+mode);
if (Boolean(selectedScene.activity) !== ['teaching','audio-playing','question','correct-feedback','wrong-feedback'].includes(mode)
    && mode!=='complete') throw new Error('Scene/QA mode mismatch: '+sceneId+' / '+mode);

function QaClassroom(){
  const [state,setState] = useState<FixtureMode>(mode);
  const [choice,setChoice] = useState<string|undefined>(
    state==='correct-feedback' ? selectedScene?.activity?.correctOptionId :
    state==='wrong-feedback' ? selectedScene?.activity?.options.find(x=>x.id!==selectedScene.activity?.correctOptionId)?.id : undefined);
  const character = getCharacterDefinition('otti');
  const sceneIndex = lesson.scenes.findIndex(x=>x.id===sceneId);
  const startWindow = Math.min(Math.max(0, sceneIndex - 2), Math.max(0, lesson.scenes.length - 5));
  const visibleScenes = lesson.scenes.slice(startWindow, startWindow + 5);
  const isSpeaking = sceneId === finalSpeakingSceneId;
  const answered = state==='correct-feedback' || state==='wrong-feedback';
  const showBoard = !isSpeaking && state!=='complete';
  const speaking = state==='speaking-otti';
  const audio = getLessonQaRegistration(lessonId).audio;
  const audioClip=beats[sceneId]?.find(b=>b.audioClipId)?.audioClipId;
  const audioState={status:(state==='audio-loading'?'loading':state==='audio-playing'?'playing':'idle') as 'idle'|'loading'|'playing',
    clipId:audioClip||null,speaker:state==='audio-playing'?'maya':null,
    turnId:state==='audio-playing'?'greeting':null,positionMs:state==='audio-playing'?1250:null};
  const status = isSpeaking ? (speaking?'speaking':'listening') : (state==='teaching'?'speaking':state==='question'?'listening':'speaking');
  const onChoose = (_scene:string,id:string)=>{
    if (state!=='question'||!selectedScene?.activity) return {accepted:false,correct:false};
    const correct=id===selectedScene.activity.correctOptionId;
    setChoice(id);
    const nextState=correct?'correct-feedback':'wrong-feedback';
    setState(nextState);
    const p=new URLSearchParams(location.search);p.set('state',nextState);
    history.replaceState({},'',location.pathname+'?'+p.toString());
    return {accepted:true,correct};
  };
  return <section className="premium-scene-lesson is-teacher-qa" dir="rtl" data-qa-ready="true"
    data-lesson-id={lesson.id} data-scene-id={sceneId} data-beat-id={beatId}
    data-qa-expected-options={selectedScene?.activity?.options.length ?? 0}
    data-lesson-state={state} style={{'--character-accent':character.accent} as React.CSSProperties}>
      <header className="premium-lesson-topbar">
        <button type="button" className="premium-top-icon" aria-label="الخروج من الدرس"><ProductIcon name="close" size={24}/></button>
        <div className="premium-lesson-title"><small>{lesson.levelId.toUpperCase()} · درس تفاعلي · ${sceneIndex+1} / ${lesson.scenes.length}</small><strong>{lesson.title}</strong></div>
        <button type="button" className="premium-top-icon" aria-label="أدوات الدرس"><ProductIcon name="more" size={25}/></button>
      </header>
      <div className="adaptive-checkpoint-bar" aria-label="مراحل الدرس">
        {visibleScenes.map((scene,i)=>{
          const actualIndex = i + startWindow;
          return <span key={scene.id} className={actualIndex<sceneIndex?'is-complete':actualIndex===sceneIndex?'is-current':''}>
            <i/>{scene.id===finalSpeakingSceneId?'Speaking':scene.title.length>17?scene.title.slice(0,15)+'…':scene.title}
          </span>;
        })}
      </div>
      <div className="premium-lesson-progress">
        {lesson.scenes.map((s,i)=><span key={s.id} className={i<sceneIndex?'is-complete':i===sceneIndex?'is-current':''}/>)}
      </div>
      <main className={'premium-lesson-stage is-teacher-lab'+(showBoard?' has-board':'')}>
        <div className="premium-scene-caption"><small>{isSpeaking?'Speaking · محادثة حقيقية':state==='question'?'اختار الإجابة من البورد':answered?'Otti بيشرح الإجابة':'Otti بيشرح'}</small><strong>{selectedScene?.title}</strong></div>
        <CharacterHost character={character} className="premium-lesson-character"/>
        {showBoard&&selectedScene?.activity? <TeacherLabBoardLayer
          sceneId={sceneId} beatId={beatId} activity={selectedScene.activity}
          answered={answered} choiceId={choice}
          questionReady={state==='question'} onChoose={onChoose} Visual={LessonVisual}
          extra={audio&&audioClip ? <LessonAudioPanel audio={audio} sceneClipId={audioClip}
            state={audioState} heardFull={state!=='teaching'} disabled={state==='audio-playing'||state==='audio-loading'}
            onPlay={()=>{}}/>:undefined}
        />:null}
      </main>
      <footer className="premium-lesson-footer">
        <div className="premium-live-status"><span className={'premium-status-dot status-'+status}/>
          <div><strong>{state==='complete'?'الدرس خلص':isSpeaking?(speaking?'Otti بيتكلم':'دورك تتكلم'):state==='question'?'اختار إجابتك من البورد':'Otti بيشرح'}</strong>
          <small>{isSpeaking?'المحادثة بالصوت مع Otti':'Otti هيشرح اختيارك بصوته'}</small></div>
        </div>
        <div className="premium-control-row">
          <button type="button" className="premium-secondary-control" aria-label="المساعدة والكتابة"><ProductIcon name="chat" size={22}/><span>مساعدة</span></button>
          {isSpeaking ? <button type="button" className={'premium-main-control '+(speaking?'is-interrupt':'is-mic is-open')}>
            <ProductIcon name="speak" size={28}/><span>دورك</span></button>
            : <div className="premium-main-control is-quiz-status">
              <ProductIcon name="check" size={27}/><span>{answered?'اسمع':state==='question'?'اختار':'استنى'}</span></div>}
          <div className="premium-mic-meter" aria-label="Microphone level 0 percent"><span style={{height:'0%'}}/></div>
        </div>
      </footer>
    </section>;
}
if(!import.meta.env.DEV && import.meta.env.VITE_ENABLE_LESSON_QA!=='1') {
  throw new Error('Teacher lab fixture is development-only.');
}
const root=document.getElementById('root');
if(!root)throw Error('Missing QA root');
createRoot(root).render(<QaClassroom/>);
