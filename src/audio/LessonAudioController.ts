import type { LessonAudioPackage, LessonAudioTurn } from '../lessonScenes/a1/listeningAudioPilot';
import { getAuthoredClip, validateLessonAudio } from '../lessonScenes/a1/listeningAudioPilot';
import type { LiveClientTool } from '../live/tools';

export type AudioClipResult = { clipId:string; status:'played'|'interrupted'|'unavailable'; mode:'asset'|'browser-preview' };
export type LessonAudioState = { status:'idle'|'playing'; clipId:string|null; speaker:string|null; turnId:string|null; mode:'asset'|'browser-preview'|null };
const idle:LessonAudioState={status:'idle',clipId:null,speaker:null,turnId:null,mode:null};
type Listener=(state:LessonAudioState)=>void;

/**
 * One active clip at a time. Real recordings (when approved) take precedence.
 * Browser voices are only an explicitly marked preview fallback.
 * Never feed asset audio into the model's microphone input.
 */
export class LessonAudioController {
  private generation=0;
  private activeAudio:HTMLAudioElement|null=null;
  private currentUtterance:SpeechSynthesisUtterance|null=null;
  private done:(value:AudioClipResult)=>void=()=>{};
  private state:LessonAudioState=idle;
  constructor(private readonly authored:LessonAudioPackage,private readonly onState:Listener=()=>{}) {
    validateLessonAudio(authored);
  }
  get snapshot(){return this.state;}
  private emit(s:LessonAudioState){this.state=s;this.onState(s);}
  interrupt(){
    this.generation++;
    this.activeAudio?.pause();
    this.activeAudio=null;
    if(typeof window!=='undefined'&&'speechSynthesis'in window)window.speechSynthesis.cancel();
    this.currentUtterance=null;
    this.done({clipId:this.state.clipId||'',status:'interrupted',mode:this.state.mode||'browser-preview'});
    this.done=()=>{};
    this.emit(idle);
  }
  async play(clipId:string):Promise<AudioClipResult>{
    const turns=getAuthoredClip(this.authored,clipId);
    this.interrupt();
    const generation=this.generation;
    const mode=this.authored.assetUrl?'asset':'browser-preview';
    return new Promise(resolve=>{
      this.done=resolve;
      void this.run(turns,clipId,generation,mode).then(status=>{
        if(this.generation!==generation)return;
        this.done=()=>{};
        this.emit(idle);
        resolve({clipId,status,mode});
      });
    });
  }
  private async run(turns:readonly LessonAudioTurn[],clipId:string,generation:number,mode:'asset'|'browser-preview'){
    // Future approved recorded assets may be split per line or annotated with
    // exact timecode ranges. Never guess offsets for one long file.
    for(const turn of turns){
      if(generation!==this.generation)return 'interrupted' as const;
      this.emit({status:'playing',clipId,speaker:turn.speaker,turnId:turn.id,mode});
      const result=await this.speakTurn(turn,mode,generation);
      if(result!=='played')return result;
    }
    return 'played' as const;
  }
  private speakTurn(turn:LessonAudioTurn,mode:'asset'|'browser-preview',generation:number):Promise<'played'|'interrupted'|'unavailable'>{
    if(mode==='asset'){
      // Real asset playback needs per-turn indexed URLs or reviewed timestamps;
      // don't play the entire conversation for a requested fragment.
      return Promise.resolve('unavailable');
    }
    if(typeof window==='undefined'||!('speechSynthesis'in window))
      return Promise.resolve('unavailable');
    return new Promise(resolve=>{
      let settled=false;
      const finish=(value:'played'|'interrupted'|'unavailable')=>{
        if(settled)return;settled=true;resolve(value);
      };
      const utterance=new SpeechSynthesisUtterance(turn.english);
      utterance.lang=this.authored.language;
      utterance.rate=.83;
      const voices=window.speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith('en'));
      if(voices.length){
        utterance.voice=voices[turn.speaker==='maya'?0:Math.min(1,voices.length-1)];
      }
      utterance.onend=()=>finish(generation===this.generation?'played':'interrupted');
      utterance.onerror=()=>finish('unavailable');
      this.currentUtterance=utterance;
      window.speechSynthesis.speak(utterance);
    });
  }
  close(){this.interrupt();}
}

/** Registered tool deliberately accepts only authored IDs, never arbitrary URLs/timings. */
export function lessonAudioTool(packageData:LessonAudioPackage,controller:LessonAudioController,awaitTeacherSilence:()=>Promise<boolean>):LiveClientTool{
  return {
    declaration:{
      name:'play_lesson_audio',
      description:'Play a reviewed, pre-authored lesson audio clip to the learner. Only the named clip IDs are allowed. Waits for playback completion; does not send recording to the AI. Use only for requested replay or when the app invites it.',
      behavior:'BLOCKING',
      parameters:{type:'object',properties:{clipId:{type:'string',enum:packageData.clips.map(x=>x.id)}},required:['clipId']},
    },
    async handle(args){
      if(typeof args.clipId!=='string'||!packageData.clips.some(x=>x.id===args.clipId))
        return {error:'Unknown clip ID. Use an authored clip ID.'};
      if(!(await awaitTeacherSilence()))return {error:'Teacher voice is still playing. Retry when silent.'};
      return controller.play(args.clipId);
    }
  };
}
