/**
 * Reviewed words for the A1 U1-L01 listening source dialogue.
 * Gemini TTS job input: production/a1-u1-l01/gemini-tts-request.json.
 * The factory returns a single 2-speaker WAV + actual rendered-audio word
 * timestamps + VTT on Cloudinary.
 *
 * No estimated clip timestamps: audioUrl and audited clip ranges are filled
 * only after actual synthesis + transcription + human audition.
 */
export interface LessonAudioTurn {
  id:string;
  speaker:'maya'|'leo';
  english:string;
  /** Final reviewed bounds in the single Gemini TTS WAV, after delivery. */
  startMs?:number;
  endMs?:number;
}
export interface LessonAudioClip {
  id:string;
  turnIds:readonly string[];
  explanation:string;
  /** Bounds MUST come from a reviewed factory result, not sample script length. */
  startMs?:number;
  endMs?:number;
}
export interface LessonAudioPackage {
  lessonId:string;
  factoryJobId:string;
  /** Cloudinary links from this job's result.json after successful delivery. */
  audioUrl:string|null;
  transcriptUrl:string|null;
  vttUrl:string|null;
  /** No production clip playback without human/audio-review approval. */
  approved:boolean;
  turns:readonly LessonAudioTurn[];
  clips:readonly LessonAudioClip[];
}
export const A1_U1_L01_AUDIO:LessonAudioPackage = {
  lessonId:'a1-u1-l01-listening-lab',
  factoryJobId:'englotti-a1-u1-l01-dialogue-pilot01',
  audioUrl:null,
  transcriptUrl:null,
  vttUrl:null,
  approved:false,
  turns:[
    {id:'greeting',speaker:'maya',english:"Good morning! I'm Maya. What's your name?"},
    {id:'reply-name',speaker:'leo',english:"Hi, Maya. My name is Leo."},
    {id:'how-are-you',speaker:'maya',english:"How are you, Leo?"},
    {id:'fine-thanks',speaker:'leo',english:"Pretty good, thanks. And you?"},
    {id:'okay-bye',speaker:'maya',english:"Really good, thank you. Bye!"},
    {id:'bye',speaker:'leo',english:"Bye, Maya!"}
  ],
  clips:[
    {id:'full-conversation',turnIds:['greeting','reply-name','how-are-you','fine-thanks','okay-bye','bye'],explanation:'Entire short first meeting'},
    {id:'name-exchange',turnIds:['greeting','reply-name'],explanation:'Greetings and exchanging names'},
    {id:'wellbeing-exchange',turnIds:['how-are-you','fine-thanks'],explanation:'How are you and a polite answer'},
    {id:'leave-taking',turnIds:['okay-bye','bye'],explanation:'Simple farewells'},
  ]
};
export function getAuthoredClip(packageData:LessonAudioPackage,clipId:string):readonly LessonAudioTurn[]{
  const clip=packageData.clips.find(x=>x.id===clipId);
  if(!clip)throw Error('Unknown authored lesson clip: '+clipId);
  const turns=clip.turnIds.map(id=>packageData.turns.find(x=>x.id===id));
  if(turns.some(x=>!x))throw Error('Missing authored turn in clip: '+clipId);
  return turns as LessonAudioTurn[];
}
export function validateLessonAudio(packageData:LessonAudioPackage){
  if(!packageData.clips.some(x=>x.id==='full-conversation'))throw Error('Missing full listening clip');
  const turnIds=packageData.turns.map(x=>x.id);
  if(turnIds.length!==new Set(turnIds).size)throw Error('Duplicate turn IDs');
  const clipIds=packageData.clips.map(x=>x.id);
  if(clipIds.length!==new Set(clipIds).size)throw Error('Duplicate clip IDs');
  for(const clip of packageData.clips){
    if(!clip.turnIds.length)throw Error('Empty clip: '+clip.id);
    getAuthoredClip(packageData,clip.id);
  }
  if(packageData.approved){
    if(!packageData.audioUrl?.startsWith('https://')||
       !packageData.transcriptUrl?.startsWith('https://')||
       !packageData.vttUrl?.startsWith('https://'))throw Error('Approved clip package requires real hosted factory deliverables');
    for(const t of packageData.turns){
      if(!Number.isFinite(t.startMs)||!Number.isFinite(t.endMs)||t.startMs!<0||t.endMs!<=t.startMs!)
        throw Error('Approved package missing reviewed source turn bounds: '+t.id);
    }
    for(const c of packageData.clips){
      if(!Number.isFinite(c.startMs)||!Number.isFinite(c.endMs)||c.startMs!<0||c.endMs!<=c.startMs!)
        throw Error('Approved package missing reviewed clip bounds: '+c.id);
    }
  }
}
