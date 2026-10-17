import type { LessonAudioPackage } from './a1/listeningAudioPilot';
import type { LessonAudioState } from '../audio/LessonAudioController';

export function LessonAudioPanel({
  audio, sceneClipId, state, heardFull, disabled, onPlay,
}:{
  audio:LessonAudioPackage;
  sceneClipId:string;
  state:LessonAudioState;
  heardFull:boolean;
  disabled:boolean;
  onPlay:(clipId:string)=>void;
}){
  const current=audio.clips.find(x=>x.id===sceneClipId);
  if(!current)return null;
  const playing=state.status==='playing';
  const loading=state.status==='loading';
  const busy=loading||playing;
  const speaker=state.speaker==='maya'?'Maya':state.speaker==='leo'?'Leo':state.speaker==='recording'?'Recorded message':null;
  const spokenLine=heardFull && playing && sceneClipId!=='phone-message' ? audio.turns.find(turn=>turn.id===state.turnId)?.english : null; // Do not reveal recorded phone digits before the learner answers.
  return <div className="a1-audio-panel" role="group" aria-label="Lesson recording playback">
    <div className="a1-audio-panel-copy">
      <strong>{loading?'⏳ جاري تحميل التسجيل':playing?('🔊 '+(speaker??'Listening')+' is speaking'):'🎧 '+current.explanation}</strong>
      <small>{spokenLine
        ? <span className="a1-audio-phrase" lang="en" dir="ltr">{spokenLine}</span>
        : audio.approved?'تمت مراجعة التسجيل':'بانتظار تسجيل Gemini TTS المعتمد'}</small>
    </div>
    <button type="button" disabled={disabled||busy||!audio.approved} onClick={()=>onPlay(sceneClipId)}
      title={heardFull?'Replay authored clip':'Play authored clip'} aria-label={'Play '+current.explanation}>
      {playing?'♪':loading?'…':heardFull?'↻':'▶'} <span>{playing?'شغال':loading?'جاري التحميل':heardFull?'إعادة':'استمع'}</span>
    </button>
  </div>;
}
