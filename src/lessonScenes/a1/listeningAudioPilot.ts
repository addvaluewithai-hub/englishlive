/**
 * A1 U1-L01 listening-first authoring package. Speaker lines and clip IDs are
 * reviewed in lesson content, never fabricated by Gemini.
 *
 * IMPORTANT: Browser speech synthesis is a DEMO FALLBACK, not a mastered or
 * production-quality prerecorded audio asset. Once real recorded audio is
 * approved, fill assetUrl and precise start/end in this manifest.
 */
export interface LessonAudioTurn {
  id: string;
  speaker: 'maya' | 'leo';
  english: string;
  /** Absolute reviewed timecodes in the approved master asset, if recorded. */
  startMs?: number;
  endMs?: number;
}
export interface LessonAudioClip {
  id: string;
  turnIds: readonly string[];
  explanation: string;
}
export interface LessonAudioPackage {
  lessonId: string;
  assetUrl: string | null;
  language: 'en-US';
  turns: readonly LessonAudioTurn[];
  clips: readonly LessonAudioClip[];
}
export const A1_U1_L01_AUDIO: LessonAudioPackage = {
  lessonId:'a1-u1-l01-listening-lab',
  assetUrl: null,
  language:'en-US',
  turns:[
    {id:'greeting',speaker:'maya',english:"Hello. I'm Maya. What's your name?"},
    {id:'reply-name',speaker:'leo',english:"Hi, Maya. My name is Leo."},
    {id:'how-are-you',speaker:'maya',english:"How are you, Leo?"},
    {id:'fine-thanks',speaker:'leo',english:"I'm fine, thanks. And you?"},
    {id:'okay-bye',speaker:'maya',english:"I'm okay, thank you. Bye!"},
    {id:'bye',speaker:'leo',english:"Bye, Maya!"}
  ],
  clips:[
    {id:'full-conversation',turnIds:['greeting','reply-name','how-are-you','fine-thanks','okay-bye','bye'],explanation:'The entire short first meeting'},
    {id:'name-exchange',turnIds:['greeting','reply-name'],explanation:'Greetings and exchanging names'},
    {id:'wellbeing-exchange',turnIds:['how-are-you','fine-thanks'],explanation:'How are you? and a polite answer'},
    {id:'leave-taking',turnIds:['okay-bye','bye'],explanation:'Two simple goodbyes'},
  ]
};
export function getAuthoredClip(packageData:LessonAudioPackage, clipId:string): readonly LessonAudioTurn[] {
  const clip=packageData.clips.find(x=>x.id===clipId);
  if(!clip) throw Error('Unknown authored lesson clip: '+clipId);
  const turns=clip.turnIds.map(id=>packageData.turns.find(x=>x.id===id));
  if(turns.some(x=>!x))throw Error('Missing authored turn in clip: '+clipId);
  return turns as LessonAudioTurn[];
}
export function validateLessonAudio(packageData:LessonAudioPackage) {
  if(!packageData.clips.some(x=>x.id==='full-conversation'))throw Error('Missing full listening clip');
  const turnIds=packageData.turns.map(x=>x.id);
  if(turnIds.length!==new Set(turnIds).size)throw Error('Duplicate turn IDs');
  const clipIds=packageData.clips.map(x=>x.id);
  if(clipIds.length!==new Set(clipIds).size)throw Error('Duplicate clip IDs');
  if(packageData.assetUrl){
    if(!/^(https:\/\/|\/audio\/)/.test(packageData.assetUrl))throw Error('Audio asset URL must be HTTPS or same-origin /audio/');
    for(const turn of packageData.turns){
      if(turn.startMs===undefined||turn.endMs===undefined||turn.endMs<=turn.startMs)
        throw Error('Missing reviewed audio timecodes for '+turn.id);
    }
  }
  for(const clip of packageData.clips){
    if(!clip.turnIds.length)throw Error('Empty clip: '+clip.id);
    getAuthoredClip(packageData,clip.id);
  }
}
