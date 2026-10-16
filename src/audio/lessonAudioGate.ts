/** Only play lesson media once the entire live PCM teacher voice has drained.
 * Separate from Gemini Live tool-blocking semantics: they can return before audible drain.
 */
export async function waitForTeacherAudioDrain(
  teacherIsPlaying:()=>boolean,
  sleep:(milliseconds:number)=>Promise<void>,
  maxPolls=70,
):Promise<boolean>{
  for(let attempts=0;attempts<maxPolls;attempts++){
    if(!teacherIsPlaying())return true;
    await sleep(100);
  }
  return !teacherIsPlaying();
}
