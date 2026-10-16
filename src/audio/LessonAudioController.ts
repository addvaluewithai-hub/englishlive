import type { LessonAudioPackage, LessonAudioTurn } from '../lessonScenes/a1/listeningAudioPilot';
import { getAuthoredClip, validateLessonAudio } from '../lessonScenes/a1/listeningAudioPilot';
import type { LiveClientTool } from '../live/tools';

export type AudioClipResult = {
  clipId:string;
  status:'played'|'interrupted'|'unavailable'|'error';
  source:'gemini-tts-factory';
};
export interface LessonAudioState {
  status:'idle'|'loading'|'playing';
  clipId:string|null;
  speaker:string|null;
  turnId:string|null;
  /** Current absolute time in the factory's WAV. */
  positionMs:number|null;
}
const idle:LessonAudioState={status:'idle',clipId:null,speaker:null,turnId:null,positionMs:null};
type Listener=(state:LessonAudioState)=>void;

/**
 * Plays ONLY reviewed timecode slices from a single durable Gemini TTS WAV.
 * No browser TTS, fake voice timings, guessed clip cutting, or client-side Gemini
 * access. Caller must suspend Otti voice and learner mic until this finishes.
 */
export class LessonAudioController {
  private activeAudio:HTMLAudioElement|null=null;
  private finishActive:(status:AudioClipResult['status'])=>void=()=>{};
  private state:LessonAudioState=idle;
  constructor(private readonly authored:LessonAudioPackage,private readonly onState:Listener=()=>{}){
    validateLessonAudio(authored);
  }
  get snapshot(){return this.state;}
  private emit(state:LessonAudioState){this.state=state;this.onState(state);}

  interrupt(){
    const current=this.activeAudio;
    if(current){
      current.pause();
      current.removeAttribute('src');
      current.load();
      this.activeAudio=null;
      this.finishActive('interrupted');
    }
    this.emit(idle);
  }

  async play(clipId:string):Promise<AudioClipResult>{
    const turns=getAuthoredClip(this.authored,clipId);
    this.interrupt();
    const clip=this.authored.clips.find(c=>c.id===clipId)!;
    if(!this.authored.approved||!this.authored.audioUrl||
       clip.startMs===undefined||clip.endMs===undefined){
      return {clipId,status:'unavailable',source:'gemini-tts-factory'};
    }
    // Browsers are allowed to reject autoplay, codec or CORS policy. Report
    // failure instead of pretending the learner heard the clip.
    if(typeof Audio==='undefined')return {clipId,status:'unavailable',source:'gemini-tts-factory'};
    const audio=new Audio(this.authored.audioUrl);
    audio.preload='auto';
    this.activeAudio=audio;
    // Gate the live microphone BEFORE network fetch/metadata/seeking begins.
    // A queued/slow recording must not leave user input open to audio echo.
    this.emit({status:'loading',clipId,speaker:null,turnId:null,positionMs:clip.startMs});
    return new Promise(resolve=>{
      let settled=false;
      let watchdog:ReturnType<typeof setTimeout>|undefined;
      const start=clip.startMs!/1000;
      const end=clip.endMs!/1000;
      const settle=(status:AudioClipResult['status'])=>{
        if(settled)return;
        settled=true;
        if(watchdog!==undefined)clearTimeout(watchdog);
        audio.pause();
        audio.removeEventListener('timeupdate',tick);
        audio.removeEventListener('ended',ended);
        audio.removeEventListener('error',errored);
        audio.removeEventListener('loadedmetadata',loaded);
        this.finishActive=()=>{};
        if(this.activeAudio===audio)this.activeAudio=null;
        this.emit(idle);
        resolve({clipId,status,source:'gemini-tts-factory'});
      };
      this.finishActive=settle;
      const tick=()=>{
        const ms=Math.round(audio.currentTime*1000);
        const turn:LessonAudioTurn|undefined=turns.find(t=>
          t.startMs!==undefined&&t.endMs!==undefined&&ms>=t.startMs&&ms<t.endMs);
        this.emit({status:'playing',clipId,speaker:turn?.speaker??null,turnId:turn?.id??null,positionMs:ms});
        if(audio.currentTime>=end-.025)settle('played');
      };
      const ended=()=>settle(audio.currentTime>=end-.1?'played':'error');
      const errored=()=>settle('error');
      const loaded=()=>{
        if(this.activeAudio!==audio)return;
        if(!Number.isFinite(audio.duration)||end>audio.duration+.1){settle('error');return;}
        audio.currentTime=start;
        void audio.play().catch(()=>settle('unavailable'));
      };
      // A stalled network/decoder must not hold the blocking Gemini tool forever.
      watchdog=setTimeout(()=>settle('error'),Math.max(18000,(end-start)*1000+15000));
      audio.addEventListener('timeupdate',tick);
      audio.addEventListener('ended',ended);
      audio.addEventListener('error',errored);
      audio.addEventListener('loadedmetadata',loaded);
      audio.load();
    });
  }

  close(){this.interrupt();}
}

/**
 * Otti can replay named segments, never arbitrary audio, URLs or time ranges.
 * The tool waits until the app says Otti's live PCM queue is silent; successful
 * output is returned only once the actual WAV has finished audibly playing.
 */
export function lessonAudioTool(
  packageData:LessonAudioPackage,
  controller:LessonAudioController,
  awaitTeacherSilence:()=>Promise<boolean>,
):LiveClientTool {
  return {
    declaration:{
      name:'play_lesson_audio',
      description:'Replay an authored excerpt of the approved lesson recording. Select clipId from the enumerated clips. The tool returns only after actual playback or a failure. Do not speak over it.',
      behavior:'BLOCKING',
      parameters:{
        type:'object',
        properties:{clipId:{type:'string',enum:packageData.clips.map(x=>x.id)}},
        required:['clipId'],
      },
    },
    async handle(args) {
      if(typeof args.clipId!=='string'||!packageData.clips.some(c=>c.id===args.clipId))
        return {error:'Unknown lesson clip ID'};
      if(!(await awaitTeacherSilence()))return {error:'Teacher voice is still playing'};
      const result=await controller.play(args.clipId);
      if(result.status!=='played')return {error:'Audio playback '+result.status,clipId:args.clipId};
      return result;
    }
  };
}
