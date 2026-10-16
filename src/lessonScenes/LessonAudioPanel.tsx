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
  const speaker=state.speaker==='maya'?'Maya':state.speaker==='leo'?'Leo':null;
  return <div className="a1-audio-panel" role="group" aria-label="Lesson recording playback">
    <div className="a1-audio-panel-copy">
      <strong>{playing?('🔊 '+speaker+' is speaking'):'🎧 '+current.explanation}</strong>
      <small>{audio.approved?'تمت مراجعة التسجيل':'بانتظار تسجيل Gemini TTS المعتمد'}</small>
    </div>
    <button type="button" disabled={disabled||playing||!audio.approved} onClick={()=>onPlay(sceneClipId)}
      title={heardFull?'Replay authored clip':'Play authored clip'} aria-label={'Play '+current.explanation}>
      {playing?'♪':heardFull?'↻':'▶'} <span>{playing?'شغال':heardFull?'إعادة':'استمع'}</span>
    </button>
  </div>;
}
