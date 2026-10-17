import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MicrophonePcmStream } from '../audio/MicrophonePcmStream';
import { PcmPlaybackQueue } from '../audio/PcmPlaybackQueue';
import { waitForTeacherAudioDrain } from '../audio/lessonAudioGate';
import { LessonAudioController, lessonAudioTool, type LessonAudioState } from '../audio/LessonAudioController';
import { CharacterHost, type CharacterHostHandle } from '../character/CharacterHost';
import { CharacterPerformanceController } from '../character/CharacterPerformanceController';
import { getCharacterDefinition } from '../character/registry';
import { ConversationBoard } from '../components/ConversationBoard';
import { ProductIcon } from '../components/ProductIcon';
import { loadTeachingBundle } from '../content/client';
import {
  adaptLessonForKnownItems,
  checkpointGroupsForLesson,
  claimedKnownContext,
  knownItemsForLesson,
  type KnownLessonItemKind,
} from '../lessonScenes/adaptive';
import {
  clearSceneLessonCheckpoint,
  readSceneLessonCheckpoint,
  writeSceneLessonCheckpoint,
  type LessonSpeakingPace,
  type StoredSceneLessonCheckpoint,
} from '../lessonScenes/progressStore';
import { getRequiredSceneLesson } from '../lessonScenes/catalog';
import { B1_L02_TEACHER_BOARD_PILOT } from '../lessonScenes/b1/teacherBoardPilot';
import { A1_U1_L01_LISTENING_PILOT } from '../lessonScenes/a1/listeningTeacherPilot';
import { A1_LISTENING_BEATS, A1_LISTENING_FEEDBACK } from '../lessonScenes/a1/listeningTeacherScript';
import { A1_U1_L01_AUDIO } from '../lessonScenes/a1/listeningAudioPilot';
import { A1FirstMeetingVisual } from '../lessonScenes/a1/A1FirstMeetingVisual';
import { A1V04ReviewVisual, A1V04ReadingNote } from '../lessonScenes/a1/A1V04ReviewVisual';
import { A1L02LearningVisual } from '../lessonScenes/a1/A1L02LearningVisual';
import { A1_L02_LESSON, A1_L02_BEATS, A1_L02_FEEDBACK, A1_L02_AUDIO } from '../lessonScenes/a1/l02AgePreview';
import { A1_U1_L01_V04_LESSON, A1_V04_BEATS, A1_V04_FEEDBACK, A1_U1_L01_V04_AUDIO } from '../lessonScenes/a1/v04Preview';
import { LessonAudioPanel } from '../lessonScenes/LessonAudioPanel';
import { TeacherLabBoardLayer } from '../lessonScenes/TeacherLabBoardLayer';
import { ScriptedNarrationDirector } from '../lessonScenes/ScriptedNarrationDirector';
import { B1_TEACHER_LAB_SCRIPT, B1_TEACHER_LAB_QUIZ_FEEDBACK, type TeachingBeat } from '../lessonScenes/b1/teacherLabScript';
import '../lessonScenes/teacherBoardPilot.css';
import { SceneLessonRuntime } from '../lessonScenes/SceneLessonRuntime';
import type { SceneLessonState } from '../lessonScenes/types';
import { GeminiLiveTransport } from '../live/GeminiLiveTransport';
import type { LiveClientTool } from '../live/tools';
import type { LiveStatus } from '../live/types';
import type { SupportBoard } from '../presentation/types';
import { comfortLabel, goalPrompt, readLearnerProfile } from '../product/profile';

function pcmSampleRate(mimeType: string) {
  const match = mimeType.match(/rate=(\d+)/i);
  return match ? Number(match[1]) : 24_000;
}

function appendTranscript(previous: string, incoming: string) {
  const value = incoming.trim();
  if (!value) return previous;
  if (!previous) return value;
  if (value.startsWith(previous)) return value;
  if (previous.endsWith(value)) return previous;
  return `${previous} ${value}`.trim();
}

const statusCopy: Record<LiveStatus, string> = {
  idle: 'جاهز',
  connecting: 'بنجهز الدرس',
  listening: 'دورك',
  speaking: 'المدرس بيتكلم',
  reconnecting: 'بنعيد الاتصال',
  error: 'حاول تاني',
};

const paceCopy: Record<LessonSpeakingPace, { label: string; prompt: string }> = {
  relaxed: {
    label: 'هادي',
    prompt: 'Use a relaxed teaching pace. Speak noticeably slower than ordinary conversation, with short clauses and small natural pauses. Never rush examples or questions.',
  },
  normal: {
    label: 'طبيعي',
    prompt: 'Use a clear normal teaching pace. Keep clauses short and leave natural space between ideas and questions.',
  },
  quick: {
    label: 'سريع',
    prompt: 'Use a brisk but still clear teaching pace. Keep teacher turns concise and never sacrifice intelligibility or learner thinking time.',
  },
};

const knownKindCopy: Record<KnownLessonItemKind, string> = {
  word: 'كلمات',
  phrase: 'تعبيرات',
  pattern: 'Patterns',
};

type CompactLogRole = 'AI' | 'YOU' | 'TOOL' | 'SCRIPT';
type QuickActionId = 'dont-understand' | 'repeat' | 'another-example';

interface CompactLogEntry {
  role: CompactLogRole;
  text: string;
}

const quickActions: ReadonlyArray<{
  id: QuickActionId;
  label: string;
  token: string;
  instruction: string;
}> = [
  {
    id: 'dont-understand',
    label: 'مش فاهم',
    token: 'DONT_UNDERSTAND',
    instruction: 'Explain the current point again in simpler Egyptian Arabic, slowly. Stay in the same scene and do not add a new target.',
  },
  {
    id: 'repeat',
    label: 'عيد تاني',
    token: 'REPEAT',
    instruction: 'Repeat the last teaching point more slowly and clearly. Stay in the same scene and do not advance.',
  },
  {
    id: 'another-example',
    label: 'مثال تاني',
    token: 'ANOTHER_EXAMPLE',
    instruction: 'Give one short new example using only the current scene language. Do not add curriculum and do not advance.',
  },
];

function compactText(value: unknown, limit = 180) {
  if (typeof value !== 'string') return '';
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > limit ? `${compact.slice(0, limit)}…` : compact;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function formatToolLog(name: string, args: Record<string, unknown>, result: unknown) {
  const response = readRecord(result);
  const error = compactText(response?.error, 180);

  if (name === 'complete_scene') {
    const summary = compactText(args.summary, 180);
    const nextScene = readRecord(response?.nextScene);
    const nextId = compactText(nextScene?.id, 80);
    const outcome = error
      ? `REJECTED: ${error}`
      : response?.lessonComplete === true
        ? 'ACCEPTED → lesson complete'
        : `ACCEPTED → next=${nextId || 'next scene'}`;
    return `complete_scene${summary ? ` summary="${summary}"` : ''} → ${outcome}`;
  }

  if (name === 'show_board') {
    const mode = compactText(args.mode, 30);
    const title = compactText(args.title, 80);
    const items = Array.isArray(args.items)
      ? args.items.filter((item): item is string => typeof item === 'string').map((item) => compactText(item, 80)).join(' | ')
      : '';
    return error
      ? `show_board → REJECTED: ${error}`
      : `show_board mode=${mode || 'unknown'} title="${title}"${items ? ` items=[${items}]` : ''} → shown`;
  }

  return `${name} → ${error ? `ERROR: ${error}` : 'ok'}`;
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

export function SceneLessonScreen() {
  const { lessonId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const v04Review = lessonId === 'a1-u1-l01-v04-review';
  const l02Review = lessonId === 'a1-u1-l02-age-review';
  const listeningLab = (lessonId === 'a1-u1-l01-hello-im' && params.get('listeningLab') === '1')
    || lessonId === 'a1-u1-l01-listening-lab' || v04Review || l02Review;
  const teacherLab = listeningLab || (lessonId === 'b1-u1-l02-keep-conversation-going' && params.get('teacherLab') === '1');
  const localLesson = l02Review ? A1_L02_LESSON : v04Review ? A1_U1_L01_V04_LESSON
    : listeningLab ? A1_U1_L01_LISTENING_PILOT
    : teacherLab ? B1_L02_TEACHER_BOARD_PILOT : getRequiredSceneLesson(lessonId);
  const teachingBeats = l02Review ? A1_L02_BEATS : v04Review ? A1_V04_BEATS : listeningLab ? A1_LISTENING_BEATS : B1_TEACHER_LAB_SCRIPT;
  const quizFeedback = l02Review ? A1_L02_FEEDBACK : v04Review ? A1_V04_FEEDBACK : listeningLab ? A1_LISTENING_FEEDBACK : B1_TEACHER_LAB_QUIZ_FEEDBACK;
  const activeAudio = l02Review ? A1_L02_AUDIO : v04Review ? A1_U1_L01_V04_AUDIO : A1_U1_L01_AUDIO;
  const profile = readLearnerProfile();
  const character = getCharacterDefinition(params.get('character') ?? profile?.characterId);
  const knownItems = knownItemsForLesson(localLesson.id);
  const initialCheckpoint = useRef<StoredSceneLessonCheckpoint | null>(teacherLab ? null : readSceneLessonCheckpoint(localLesson.id));

  const host = useRef<CharacterHostHandle | null>(null);
  const transport = useRef<GeminiLiveTransport | null>(null);
  const microphone = useRef<MicrophonePcmStream | null>(null);
  const playback = useRef<PcmPlaybackQueue | null>(null);
  const lessonAudio = useRef<LessonAudioController | null>(null);
  const [lessonAudioState,setLessonAudioState] = useState<LessonAudioState>({
    status:'idle',clipId:null,speaker:null,turnId:null,positionMs:null
  });
  const [heardClips,setHeardClips] = useState<Readonly<Record<string,boolean>>>({});
  const performer = useRef<CharacterPerformanceController | null>(null);
  const runtime = useRef<SceneLessonRuntime | null>(null);
  const compactLog = useRef<CompactLogEntry[]>([]);
  const scripted = useRef(new ScriptedNarrationDirector());
  const pendingScriptBoard = useRef<{ sceneId: string; beatId: string; board: SupportBoard | null } | null>(null);
  const pendingQuizFeedback = useRef<{ sceneId: string; correct: boolean } | null>(null);
  const quizFeedbackTimeout = useRef<number | null>(null);
  const [quizFeedbackRetryVisible,setQuizFeedbackRetryVisible] = useState(false);
  const [visibleBeatId, setVisibleBeatId] = useState('');
  const scriptNextTimer = useRef<number | null>(null);
  const scriptWatchdog = useRef<number | null>(null);
  const [scriptPaused, setScriptPaused] = useState(false);
  const welcomePlayed = useRef(false);
  const manualInterrupt = useRef(false);
  const holdMicForTeacherContinuation = useRef(false);
  const lastTeacherText = useRef('');
  const learnerSceneAfterSpeech = useRef<string | null>(null);
  const decisionNudgeTimer = useRef<number | null>(null);

  const [activeLesson, setActiveLesson] = useState(localLesson);
  const [contentSource, setContentSource] = useState<'neon' | 'local-fallback'>('local-fallback');
  const [status, setStatus] = useState<LiveStatus>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [micOpen, setMicOpen] = useState(false);
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [lessonState, setLessonState] = useState<SceneLessonState | null>(initialCheckpoint.current?.state ?? null);
  const [activeBoard, setActiveBoard] = useState<SupportBoard | null>(null);
  const [performanceLabel, setPerformanceLabel] = useState('audio-driven locally');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [chatMessage, setChatMessage] = useState('');
  const [welcomeComplete, setWelcomeComplete] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCheckpoint, setSavedCheckpoint] = useState<StoredSceneLessonCheckpoint | null>(initialCheckpoint.current);
  const [knownItemIds, setKnownItemIds] = useState<string[]>(initialCheckpoint.current?.knownItemIds ?? []);
  const [pace, setPace] = useState<LessonSpeakingPace>(initialCheckpoint.current?.pace ?? 'relaxed');
  const [preflightReady, setPreflightReady] = useState(knownItems.length === 0 && !initialCheckpoint.current);

  function clearQuizFeedbackTimeout() {
    if (quizFeedbackTimeout.current !== null) window.clearTimeout(quizFeedbackTimeout.current);
    quizFeedbackTimeout.current = null;
  }

  function scheduleQuizFeedbackRetry(sceneId:string) {
    clearQuizFeedbackTimeout();
    quizFeedbackTimeout.current=window.setTimeout(()=>{
      if(pendingQuizFeedback.current?.sceneId !== sceneId ||
        runtime.current?.currentScene.id !== sceneId)return;
      setQuizFeedbackRetryVisible(true);
      setError('شرح الإجابة الصوتي ما اكتملش. اضغط «إعادة شرح الإجابة» عشان تسمعه ونكمل بدون تخطي الصوت.');
    },25_000);
  }

  function clearScriptTimers() {
    clearQuizFeedbackTimeout();
    setQuizFeedbackRetryVisible(false);
    if (scriptNextTimer.current !== null) window.clearTimeout(scriptNextTimer.current);
    if (scriptWatchdog.current !== null) window.clearTimeout(scriptWatchdog.current);
    scriptNextTimer.current = null;
    scriptWatchdog.current = null;
  }

  function readAuthoredBeat(sceneId: string, beat: TeachingBeat) {
    const live = transport.current;
    if (!live?.connected || runtime.current?.currentScene.id !== sceneId) return;
    pendingScriptBoard.current = { sceneId, beatId: beat.id, board: beat.board };
    holdMicForTeacherContinuation.current = true;
    setLearnerMicEnabled(false);
    compactLog.current.push({ role: 'SCRIPT', text: `[${sceneId}/${beat.id}] ${beat.line}` });
    if (compactLog.current.length > 160) compactLog.current.splice(0, compactLog.current.length - 160);
    live.sendText(`READ:\n${beat.line}`);
    if (scriptWatchdog.current !== null) window.clearTimeout(scriptWatchdog.current);
    scriptWatchdog.current = window.setTimeout(() => {
      if (!scripted.current.isReading || scripted.current.currentSceneId !== sceneId) return;
      scripted.current.pause();
      pendingScriptBoard.current = null;
      setScriptPaused(true);
      setError('ما سمعناش نهاية السطر. تقدر تضغط «كمّل الشرح» عشان نعيده من غير ما نتخطّاه.');
    }, 30_000);
  }

  function startScriptScene(sceneId: string) {
    const beats = teachingBeats[sceneId];
    if (!beats || !transport.current?.connected || runtime.current?.currentScene.id !== sceneId) return;
    // A model's completion tool can arrive before its last audio has drained.
    // Never overlap the next authored line with an audible previous turn.
    if (scripted.current.isReading || playback.current?.isPlaying) {
      scriptNextTimer.current = window.setTimeout(() => startScriptScene(sceneId), 250);
      return;
    }
    clearScriptTimers();
    setScriptPaused(false);
    setVisibleBeatId('');
    pendingQuizFeedback.current = null;
    const first = scripted.current.start(sceneId, beats);
    readAuthoredBeat(sceneId, first);
  }

  function resumeScript() {
    if (!teacherLab || !transport.current?.connected || scripted.current.isReading) return;
    try {
      const line = scripted.current.resume();
      const sceneId = scripted.current.currentSceneId;
      if (!sceneId) return;
      setScriptPaused(false);
      setError(null);
      readAuthoredBeat(sceneId, line);
    } catch { /* There is no interrupted narration to resume. */ }
  }

  async function playAuthoredAudio(clipId:string) {
    const audio=lessonAudio.current;
    if(!listeningLab||!audio)return false;
    // Gemini's turn-complete event can precede final PCM draining.
    if(!await waitForTeacherAudioDrain(
      ()=>Boolean(playback.current?.isPlaying),
      ms=>new Promise<void>(done=>window.setTimeout(done,ms)),
    )){
      setError('لسه صوت Otti شغال. مش هنشغّل التسجيل فوق صوته؛ جرّب تاني.');
      return false;
    }
    holdMicForTeacherContinuation.current = true;
    setLearnerMicEnabled(false);
    setStatus('speaking');
    const result=await audio.play(clipId);
    compactLog.current.push({role:'TOOL',text:`[lesson audio] ${clipId} → ${result.status} (${result.source})`});
    if(result.status==='played'){
      setHeardClips(v=>({...v,[clipId]:true}));
      return true;
    }
    setError(result.status==='unavailable'
      ? 'تسجيل Gemini TTS لسه مش موجود أو مش معتمد. الدرس مش هيتخطّى الـListening قبل ما الصوت الحقيقي يشتغل.'
      : 'التسجيل اتوقف. تقدر تعيده قبل ما نكمل.');
    return false;
  }

  function replayAuthoredAudio(clipId:string) {
    if(!listeningLab || scripted.current.isReading || playback.current?.isPlaying
      || lessonAudioState.status!=='idle')return;
    void playAuthoredAudio(clipId).then(()=>{
      holdMicForTeacherContinuation.current=false;
      if(runtime.current?.currentScene.activity){
        setStatus('listening');
      } else {
        setLearnerMicEnabled(true);
        setStatus('listening');
      }
    });
  }

  function clearDecisionNudge() {
    if (decisionNudgeTimer.current !== null) window.clearTimeout(decisionNudgeTimer.current);
    decisionNudgeTimer.current = null;
  }

  function setLearnerMicEnabled(enabled: boolean) {
    const currentAudioStatus = lessonAudio.current?.snapshot.status;
    const audioBusy = listeningLab && currentAudioStatus !== undefined && currentAudioStatus !== 'idle';
    const actuallyEnabled=enabled && !audioBusy;
    microphone.current?.setEnabled(actuallyEnabled);
    setMicOpen(actuallyEnabled);
    if (!actuallyEnabled) setMicLevel(0);
  }

  function appendDialogueLog(role: 'AI' | 'YOU', text: string, typed = false) {
    const value = text.trim();
    if (!value) return;
    const label = typed ? `[text] ${value}` : value;
    const entries = compactLog.current;
    const last = entries.at(-1);
    if (last?.role === role && !typed) last.text = appendTranscript(last.text, label).slice(-2400);
    else entries.push({ role, text: label.slice(-2400) });
    if (entries.length > 160) entries.splice(0, entries.length - 160);
  }

  function appendQuickActionLog(label: string) {
    compactLog.current.push({ role: 'YOU', text: `[quick] ${label}` });
    if (compactLog.current.length > 160) compactLog.current.splice(0, compactLog.current.length - 160);
  }

  function appendToolLog(name: string, args: Record<string, unknown>, result: unknown) {
    compactLog.current.push({ role: 'TOOL', text: formatToolLog(name, args, result) });
    if (compactLog.current.length > 160) compactLog.current.splice(0, compactLog.current.length - 160);
  }

  function tracedTools(sceneRuntime: SceneLessonRuntime): readonly LiveClientTool[] {
    const registeredTools:LiveClientTool[] = [...sceneRuntime.tools];
    if(listeningLab && lessonAudio.current) {
      registeredTools.push(lessonAudioTool(
        activeAudio,lessonAudio.current,
        async ()=>{
          if(scripted.current.isReading) return false;
          return waitForTeacherAudioDrain(
            ()=>Boolean(playback.current?.isPlaying),
            ms=>new Promise<void>(done=>window.setTimeout(done,ms)),
          );
        }
      ));
    }
    return registeredTools.map((tool) => ({
      declaration: tool.declaration,
      handle: async (args) => {
        try {
          const result = await tool.handle(args);
          appendToolLog(tool.declaration.name, args, result);
          if (tool.declaration.name === 'complete_scene') {
            const response = readRecord(result);
            if (!response?.error) {
              learnerSceneAfterSpeech.current = null;
              clearDecisionNudge();
              if (teacherLab) {
                // NON_BLOCKING + SILENT tool response goes out before the next authored line.
                const next = readRecord(response?.nextScene);
                const sceneId = typeof next?.id === 'string' ? next.id : null;
                if (sceneId) {
                  if (scriptNextTimer.current !== null) window.clearTimeout(scriptNextTimer.current);
                  scriptNextTimer.current = window.setTimeout(() => startScriptScene(sceneId), 400);
                }
              }
            }
          }
          return result;
        } catch (reason) {
          const result = { error: reason instanceof Error ? reason.message : 'tool failed' };
          appendToolLog(tool.declaration.name, args, result);
          throw reason;
        }
      },
    }));
  }

  function persistCheckpoint(state: SceneLessonState) {
    if (teacherLab) return; // Preview must never write course progress or checkpoints.
    if (state.completedAt) {
      clearSceneLessonCheckpoint(localLesson.id);
      setSavedCheckpoint(null);
      return;
    }
    writeSceneLessonCheckpoint({
      lessonId: localLesson.id,
      state,
      knownItemIds: [...knownItemIds],
      pace,
    });
    setSavedCheckpoint({
      version: 1,
      lessonId: localLesson.id,
      state,
      knownItemIds: [...knownItemIds],
      pace,
      updatedAt: new Date().toISOString(),
    });
  }

  function toggleKnownItem(id: string) {
    setKnownItemIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  }

  function resumeCheckpoint() {
    if (!savedCheckpoint) return;
    setKnownItemIds([...savedCheckpoint.knownItemIds]);
    setPace(savedCheckpoint.pace);
    setPreflightReady(true);
  }

  function restartFresh() {
    clearSceneLessonCheckpoint(localLesson.id);
    setSavedCheckpoint(null);
    setLessonState(null);
    setKnownItemIds([]);
    setPace('relaxed');
    setPreflightReady(knownItems.length === 0);
  }

  async function copyCompactLog() {
    const body = compactLog.current.map((entry) => `${entry.role}: ${entry.text}`).join('\n\n');
    const text = [
      'Englotti compact scene log',
      `Lesson: ${activeLesson.source.sourceLessonId} — ${activeLesson.title}`,
      `Teacher: ${character.name}`,
      `Content source: ${contentSource}`,
      '',
      body || '(No conversation captured yet.)',
    ].join('\n');
    try {
      await copyToClipboard(text);
      setCopyStatus('copied');
      window.setTimeout(() => setCopyStatus('idle'), 1800);
    } catch {
      setCopyStatus('error');
    }
  }

  function sendChat(event: FormEvent) {
    event.preventDefault();
    const value = chatMessage.trim();
    const live = transport.current;
    if (!value || !live?.connected || !micOpen || status !== 'listening') return;
    appendDialogueLog('YOU', value, true);
    setInputTranscript((current) => appendTranscript(current, `[typed] ${value}`));
    live.sendText(`[LEARNER TEXT CHAT] ${value}\nTyped text is help/context only, not spoken evidence. If it answers the speaking task, ask the learner to say it aloud before completing the scene.`);
    setChatMessage('');
    setToolsOpen(false);
  }

  function retryQuizFeedback() {
    const pending=pendingQuizFeedback.current;
    const live=transport.current;
    if(!pending || !live?.connected || runtime.current?.currentScene.id!==pending.sceneId
      || scripted.current.isReading || playback.current?.isPlaying)return;
    const line=v04Review && !pending.correct
      ? A1_V04_FEEDBACK[pending.sceneId]?.wrongByOption?.[runtime.current.snapshot.scenes[pending.sceneId]?.activityChoiceId ?? '']
        ?? quizFeedback[pending.sceneId]?.wrong
      : quizFeedback[pending.sceneId]?.[pending.correct ? 'correct':'wrong'];
    if(!line)return;
    setError(null);
    setQuizFeedbackRetryVisible(false);
    holdMicForTeacherContinuation.current=true;
    setLearnerMicEnabled(false);
    live.sendText('READ:\n'+line);
    scheduleQuizFeedbackRetry(pending.sceneId);
  }

  function chooseBoardActivity(sceneId: string, optionId: string) {
    const sceneRuntime = runtime.current;
    const live = transport.current;
    if (!teacherLab || !sceneRuntime || !live?.connected || status !== 'listening' ||
      !sceneRuntime.scriptedNarrationComplete || scripted.current.isReading) {
      return { accepted: false, correct: false, error: 'استنى لحد ما Otti يخلص الشرح.' };
    }
    const answer = sceneRuntime.submitBoardChoice(sceneId, optionId);
    if (answer.accepted) {
      appendQuickActionLog(`[board] ${sceneId} choice=${optionId} ${answer.correct ? 'correct' : 'incorrect'}`);
      learnerSceneAfterSpeech.current = null;
      const authoredFeedback = v04Review && !answer.correct
        ? A1_V04_FEEDBACK[sceneId]?.wrongByOption?.[optionId] ?? quizFeedback[sceneId]?.wrong
        : quizFeedback[sceneId]?.[answer.correct ? 'correct' : 'wrong'];
      if (authoredFeedback) {
        pendingQuizFeedback.current = { sceneId, correct: answer.correct };
        setQuizFeedbackRetryVisible(false);
        setError(null);
        scheduleQuizFeedbackRetry(sceneId);
        compactLog.current.push({ role: 'SCRIPT', text: `[${sceneId}/quiz-${answer.correct ? 'correct' : 'wrong'}] ${authoredFeedback}` });
        holdMicForTeacherContinuation.current = true;
        setLearnerMicEnabled(false);
        live.sendText(`READ:\n${authoredFeedback}`);
      }
    }
    return answer;
  }

  function sendQuickAction(actionId: QuickActionId) {
    const action = quickActions.find((item) => item.id === actionId);
    const live = transport.current;
    if (!action || !welcomeComplete || !live?.connected || !micOpen || status !== 'listening') return;
    appendQuickActionLog(action.label);
    setInputTranscript((current) => appendTranscript(current, `[quick] ${action.label}`));
    live.sendText(`[LEARNER QUICK ACTION: ${action.token}] ${action.instruction}\nThis is help/context, not lesson evidence.`);
    setToolsOpen(false);
  }

  function interruptTeacher() {
    const live = transport.current;
    if (status !== 'speaking' || !live?.connected) return;
    if (teacherLab && scripted.current.isReading) {
      scripted.current.pause();
      clearScriptTimers();
      pendingScriptBoard.current = null;
      setScriptPaused(true);
    }
    manualInterrupt.current = true;
    appendQuickActionLog('مقاطعة');
    playback.current?.interrupt();
    performer.current?.interrupt();
    setPerformanceLabel('audio-driven locally');
    setLearnerMicEnabled(true);
    setStatus('listening');
  }

  async function closeLive() {
    clearScriptTimers();
    lessonAudio.current?.close();
    pendingScriptBoard.current = null;
    pendingQuizFeedback.current = null;
    setScriptPaused(false);
    clearDecisionNudge();
    transport.current?.endAudioStream();
    transport.current?.close();
    transport.current = null;
    await microphone.current?.stop();
    microphone.current = null;
    await playback.current?.close();
    playback.current = null;
    performer.current?.close();
    performer.current = null;
    runtime.current = null;
    manualInterrupt.current = false;
    holdMicForTeacherContinuation.current = false;
    learnerSceneAfterSpeech.current = null;
    setMicLevel(0);
    setMicOpen(false);
    setStatus('idle');
  }

  async function leaveLesson() {
    setToolsOpen(false);
    await closeLive();
    navigate(`/learn/unit/${activeLesson.unitId}`);
  }

  useEffect(() => {
    return () => {
      clearDecisionNudge();
      clearScriptTimers();
      transport.current?.close();
      void microphone.current?.stop();
      void playback.current?.close();
      performer.current?.close();
    };
  }, []);

  useEffect(() => {
    if (status === 'connecting' || status === 'reconnecting') performer.current?.thinking();
    else if (status === 'listening') performer.current?.listening();
    else if (status === 'idle' || status === 'error') host.current?.setMode('idle');
  }, [status, character.id]);

  async function startLive() {
    if (!preflightReady || (status !== 'idle' && status !== 'error')) return;
    setStatus('connecting');
    setError(null);
    setCopyStatus('idle');
    setChatMessage('');
    setInputTranscript('');
    setOutputTranscript('');
    setActiveBoard(null);
    setPerformanceLabel('audio-driven locally');
    setWelcomeComplete(false);
    setMicOpen(false);
    setToolsOpen(false);
    welcomePlayed.current = false;
    manualInterrupt.current = false;
    holdMicForTeacherContinuation.current = false;
    learnerSceneAfterSpeech.current = null;
    lastTeacherText.current = '';
    clearDecisionNudge();
    compactLog.current = [];
    clearScriptTimers();
    lessonAudio.current?.close();
    lessonAudio.current=null;
    setHeardClips({});
    scripted.current = new ScriptedNarrationDirector();
    pendingScriptBoard.current = null;
    pendingQuizFeedback.current = null;
    setVisibleBeatId('');
    setScriptPaused(false);

    const bundle = await loadTeachingBundle(localLesson, character, { preview: teacherLab });
    const sessionLesson = teacherLab ? localLesson : adaptLessonForKnownItems(bundle.lesson, knownItemIds);
    const teacherName = bundle.character.displayName?.trim() || character.name;
    const restoredState = savedCheckpoint?.state && savedCheckpoint.lessonId === localLesson.id
      ? savedCheckpoint.state
      : null;
    setActiveLesson(sessionLesson);
    setContentSource(bundle.source);

    const sceneRuntime = new SceneLessonRuntime(sessionLesson, {
      onStateChange: (state) => {
        setLessonState(state);
        persistCheckpoint(state);
      },
      onBoardChange: setActiveBoard,
      policyPrompt: bundle.teachingPolicy.prompt,
      adaptiveContext: claimedKnownContext(localLesson.id, knownItemIds),
      restoredState,
      preview: teacherLab,
    });
    runtime.current = sceneRuntime;
    setLessonState(sceneRuntime.snapshot);
    persistCheckpoint(sceneRuntime.snapshot);

    const characterPerformance = new CharacterPerformanceController(() => host.current);
    performer.current = characterPerformance;
    if(listeningLab){
      lessonAudio.current = new LessonAudioController(activeAudio,(state)=>{
        setLessonAudioState(state);
        if(state.status!=='idle'){
          setLearnerMicEnabled(false);
          setStatus('speaking');
        } else if(!scripted.current.isReading && !playback.current?.isPlaying){
          setStatus('listening');
          if(!sceneRuntime.currentScene.activity)setLearnerMicEnabled(true);
        }
      });
    }

    let live: GeminiLiveTransport;
    const queue = new PcmPlaybackQueue({
      onMouthPose: (pose) => characterPerformance.setMouth(pose),
      onSpeechStart: () => {
        clearDecisionNudge();
        if (teacherLab && pendingScriptBoard.current) {
          const next = pendingScriptBoard.current;
          pendingScriptBoard.current = null;
          sceneRuntime.showScriptedBoard(next.sceneId, next.board);
          setVisibleBeatId(next.beatId);
        }
        if (!teacherLab || !scripted.current.isReading) holdMicForTeacherContinuation.current = false;
        setLearnerMicEnabled(false);
        setStatus('speaking');
        characterPerformance.speechStart();
      },
      onSpeechEnd: () => {
        const shouldHold = holdMicForTeacherContinuation.current || (teacherLab && scripted.current.isReading);
        // MC questions are touch-only; the mic opens again for the final speaking scene.
        const quizScene = teacherLab && Boolean(sceneRuntime.currentScene.activity);
        setLearnerMicEnabled(!shouldHold && !quizScene);
        setStatus((current) => current === 'idle' || current === 'error' ? current : shouldHold ? 'speaking' : 'listening');
        characterPerformance.speechEnd();
      },
      onTurnComplete: () => {
        sceneRuntime.markPartnerTurnComplete();
        if (teacherLab && scripted.current.isReading) {
          if (scriptWatchdog.current !== null) window.clearTimeout(scriptWatchdog.current);
          scriptWatchdog.current = null;
          const sceneId=sceneRuntime.currentScene.id;
          const beat=scripted.current.currentBeat;
          const advance=()=>{
            if(sceneRuntime.currentScene.id!==sceneId || !scripted.current.isReading)return;
            const step=scripted.current.audioFinished();
            if(step.next) readAuthoredBeat(sceneId,step.next);
            else if(step.finishedSceneId){
              sceneRuntime.markScriptedNarrationComplete(step.finishedSceneId);
              holdMicForTeacherContinuation.current=false;
              setStatus('listening');
              if(!sceneRuntime.currentScene.activity)setLearnerMicEnabled(true);
            }
          };
          if(listeningLab && beat?.audioClipId){
            void playAuthoredAudio(beat.audioClipId).then(ok=>{
              if(ok) advance();
              else {
                scripted.current.pause();
                setScriptPaused(true);
                holdMicForTeacherContinuation.current=false;
                setStatus('listening');
              }
            });
          } else advance();
          return;
        }
        if (teacherLab && pendingQuizFeedback.current) {
          // The actual PCM queue has emitted audible turn-complete. The app
          // commits the deterministic MC and schedules the next authored scene,
          // rather than hoping Gemini autonomously calls complete_scene.
          const result = pendingQuizFeedback.current;
          pendingQuizFeedback.current = null;
          clearQuizFeedbackTimeout();
          setQuizFeedbackRetryVisible(false);
          holdMicForTeacherContinuation.current = false;
          if(sceneRuntime.currentScene.id !== result.sceneId)return;
          if(!sceneRuntime.markQuizFeedbackPlayed(result.sceneId)) {
            setError('تعذّر تسجيل نهاية شرح الإجابة. حاول تعيد فتح الدرس لو المشكلة استمرت.');
            return;
          }
          const done=sceneRuntime.completeGradedPreviewQuizAfterAudio(result.sceneId);
          if(done.error) {
            setError('شرح Otti خلص، بس حصل خطأ في الانتقال: '+done.error);
            return;
          }
          appendToolLog('app_owned_quiz_handoff',{sceneId:result.sceneId},done);
          learnerSceneAfterSpeech.current=null;
          clearDecisionNudge();
          const nextId=done.nextScene?.id;
          if(nextId){
            if(scriptNextTimer.current !== null)window.clearTimeout(scriptNextTimer.current);
            scriptNextTimer.current=window.setTimeout(()=>startScriptScene(nextId),400);
          }
          return;
        }
        if (teacherLab) return;
        if (!welcomePlayed.current) {
          welcomePlayed.current = true;
          holdMicForTeacherContinuation.current = true;
          sceneRuntime.markLessonOpeningComplete();
          setWelcomeComplete(true);
          live.sendText(sceneRuntime.isResuming
            ? 'The short resume greeting is finished. Continue from the CURRENT SCENE already provided. Do not repeat earlier completed scenes. Teach this small target naturally and use complete_scene only when the learner can use it successfully enough.'
            : 'The spoken welcome is finished. Begin the CURRENT SCENE already provided in your system instruction. Its authored board is already visible if it has one. Teach the small target, interact naturally, and use complete_scene only when the learner can use it successfully enough.');
          return;
        }

        const sceneId = sceneRuntime.currentScene.id;
        const teacherText = lastTeacherText.current.trim();
        const looksLikeWaitingForLearner = /[?؟]\s*$/.test(teacherText)
          || /\b(try|say|tell|ask|repeat)\b/i.test(teacherText)
          || /(جرب|قول|اسأل|كرر|جاوب|رد)/.test(teacherText);
        if (learnerSceneAfterSpeech.current === sceneId && !looksLikeWaitingForLearner) {
          clearDecisionNudge();
          decisionNudgeTimer.current = window.setTimeout(() => {
            if (!live.connected || sceneRuntime.currentScene.id !== sceneId) return;
            const nudge = bundle.teachingPolicy.decisionNudgePrompt
              || 'The learner has already spoken in this scene. Decide now: complete the scene if they can use the target, otherwise make one clear next teaching move.';
            live.sendText(`[INTERNAL TEACHING NUDGE] ${nudge} Do not mention this nudge.`);
          }, 3000);
        }
      },
    });
    playback.current = queue;

    live = new GeminiLiveTransport(
      {
        onStatus: setStatus,
        onInputTranscript: (text) => {
          clearDecisionNudge();
          sceneRuntime.recordAutomaticTranscript(text);
          learnerSceneAfterSpeech.current = sceneRuntime.currentScene.id;
          appendDialogueLog('YOU', text);
          setInputTranscript((current) => appendTranscript(current, text));
        },
        onOutputTranscript: (text) => {
          if (manualInterrupt.current) return;
          lastTeacherText.current = appendTranscript(lastTeacherText.current, text).slice(-1200);
          appendDialogueLog('AI', text);
          queue.pushTranscript(text);
          setOutputTranscript((current) => appendTranscript(current, text));
        },
        onAudio: (data, mimeType) => {
          if (manualInterrupt.current) return;
          setLearnerMicEnabled(false);
          void queue.enqueue(data, pcmSampleRate(mimeType));
        },
        onInterrupted: () => {
          lessonAudio.current?.interrupt();
          if (teacherLab && scripted.current.isReading) {
            scripted.current.pause();
            clearScriptTimers();
            pendingScriptBoard.current = null;
            setScriptPaused(true);
          }
          manualInterrupt.current = false;
          queue.interrupt();
          characterPerformance.interrupt();
          setLearnerMicEnabled(!teacherLab || !sceneRuntime.currentScene.activity);
          setStatus('listening');
          setPerformanceLabel('audio-driven locally');
        },
        onTurnComplete: () => {
          manualInterrupt.current = false;
          lastTeacherText.current = '';
          queue.markTurnComplete();
        },
        onError: setError,
      },
      tracedTools(sceneRuntime),
    );
    transport.current = live;

    const mic = new MicrophonePcmStream();
    mic.setEnabled(false);
    microphone.current = mic;

    const learnerContext = profile
      ? `The learner's private profile says their first name is ${profile.firstName || 'not provided'}, their main reason for English is to ${goalPrompt(profile.goals[0] ?? 'everyday')}, and their speaking comfort is ${comfortLabel(profile.comfort)}. Use this only to pace support. Never use profile facts to answer for the learner.`
      : 'No learner profile is available. Keep support very concrete and calibrate only from the live interaction.';

    const persona = bundle.character.personaPrompt?.trim() || character.persona.style;
    const teachingStyle = bundle.character.teachingStylePrompt?.trim();
    const characterPrompt = [
      `You are ${teacherName}, ${persona}, teaching one adult ${sessionLesson.levelId.toUpperCase()} learner in Englotti.`,
      character.id === 'otti' ? 'Otti is male: keep the personality and self-reference consistently masculine when Arabic grammar makes gender audible.' : '',
      'Be warm, patient and concise without sounding childish. Address the learner in singular Egyptian Arabic, not plural language and not formal يا فندم.',
      paceCopy[pace].prompt,
      'Target English should be clear and slightly slower when it is new. Do not machine-gun examples. One idea, one short pause, then the learner gets room to respond.',
      `Never call yourself another teacher name; when referring to yourself, always use ${teacherName}.`,
      'The learner microphone is intentionally closed while you are audibly teaching. They can explicitly interrupt you with the app control; otherwise finish one concise teaching turn and give them space.',
      teachingStyle,
    ].filter(Boolean).join(' ');

    try {
      await queue.unlock();
      await live.connect(`${characterPrompt}\n\n${learnerContext}\n\n${sceneRuntime.systemPrompt}`, {
        voiceName: bundle.character.voiceName ?? undefined,
      });
      await mic.start(
        (chunk) => live.sendAudio(chunk),
        (level) => {
          setMicLevel(level);
          sceneRuntime.recordLearnerAudioLevel(level);
        },
      );
      if (teacherLab) {
        welcomePlayed.current = true;
        sceneRuntime.markLessonOpeningComplete();
        setWelcomeComplete(true);
        startScriptScene(sceneRuntime.currentScene.id);
        return;
      }
      const opening = sceneRuntime.isResuming
        ? 'Resume the interrupted lesson with ONLY the brief resume opening described in your instructions. Do not repeat the original welcome or earlier scenes. Stop after the short reconnection.'
        : bundle.teachingPolicy.openingPrompt
          || 'Start the Englotti lesson with ONLY the short human welcome described in your instructions. Do not begin the first scene in the same turn. Speak calmly and stop after the welcome.';
      live.sendText(opening);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not start the lesson.';
      setError(message);
      setStatus('error');
      live.close();
      await mic.stop();
      await queue.close();
      characterPerformance.close();
      setMicOpen(false);
    }
  }

  const connecting = status === 'connecting' || status === 'reconnecting';
  const liveLesson = status === 'listening' || status === 'speaking';
  const teacherSpeaking = status === 'speaking';
  const learnerTurn = status === 'listening' && micOpen;
  const currentScene = lessonState
    ? activeLesson.scenes.find((scene) => scene.id === lessonState.currentSceneId) ?? activeLesson.scenes[0]
    : activeLesson.scenes[0];
  const sceneIndex = Math.max(0, activeLesson.scenes.findIndex((scene) => scene.id === currentScene.id));
  const completedScenes = lessonState
    ? activeLesson.scenes.filter((scene) => lessonState.scenes[scene.id]?.status === 'met').length
    : 0;
  const savedCompletedScenes = savedCheckpoint
    ? Object.values(savedCheckpoint.state.scenes).filter((scene) => scene.status === 'met').length
    : 0;
  const lessonComplete = Boolean(lessonState?.completedAt);
  const quickActionsEnabled = welcomeComplete && learnerTurn && Boolean(transport.current?.connected);
  const board = welcomeComplete ? activeBoard : null;
  const quizState = lessonState?.scenes[currentScene.id];
  const quizReady = teacherLab && Boolean(currentScene.activity) &&
    Boolean(runtime.current?.scriptedNarrationComplete) && !scripted.current.isReading
    && lessonAudioState.status==='idle';
  const checkpointGroups = checkpointGroupsForLesson(activeLesson);
  const preflightVisible = !preflightReady && !liveLesson && !connecting;

  return (
    <section className="premium-scene-lesson" dir="rtl" style={{ '--character-accent': character.accent } as CSSProperties}>
      <header className="premium-lesson-topbar">
        <button type="button" className="premium-top-icon" onClick={() => void leaveLesson()} aria-label="الخروج من الدرس">
          <ProductIcon name="close" size={24} />
        </button>
        <div className="premium-lesson-title">
          <small>{activeLesson.levelId.toUpperCase()} · الوحدة · الدرس {activeLesson.order}</small>
          <strong>{activeLesson.title}</strong>
        </div>
        <button type="button" className="premium-top-icon" onClick={() => setToolsOpen(true)} aria-label="أدوات الدرس">
          <ProductIcon name="more" size={25} />
        </button>
      </header>

      <div className="adaptive-checkpoint-bar" aria-label="مراحل الدرس">
        {checkpointGroups.map((group) => {
          const complete = lessonState ? group.scenes.every((scene) => lessonState.scenes[scene.id]?.status === 'met') : false;
          const current = group.scenes.some((scene) => scene.id === currentScene?.id) && !lessonComplete;
          return (
            <span key={group.id} className={`${complete ? 'is-complete' : ''}${current ? ' is-current' : ''}`}>
              <i />{group.label}
            </span>
          );
        })}
      </div>

      <div className="premium-lesson-progress" aria-label={`${completedScenes} of ${activeLesson.scenes.length} lesson scenes completed`}>
        {activeLesson.scenes.map((scene, index) => (
          <span
            key={scene.id}
            title={scene.title}
            className={`${lessonState?.scenes[scene.id]?.status === 'met' ? 'is-complete' : ''}${index === sceneIndex && !lessonComplete ? ' is-current' : ''}`}
          />
        ))}
      </div>

      <main className={`premium-lesson-stage${board ? ' has-board' : ''}${preflightVisible ? ' has-preflight' : ''}${teacherLab ? ' is-teacher-lab' : ''}`}>
        <div className="premium-scene-caption">
          <small>{teacherLab ? (currentScene.activity ? (quizState?.activityAnswered ? 'Otti بيشرح الإجابة' : quizReady ? 'اختار الإجابة من البورد' : 'Otti بيشرح') : 'Speaking · محادثة حقيقية') : welcomeComplete ? `الخطوة ${sceneIndex + 1} من ${activeLesson.scenes.length}` : preflightVisible ? 'قبل ما نبدأ' : 'بداية الدرس'}</small>
          <strong>{welcomeComplete ? currentScene.title : `مع ${character.name}`}</strong>
        </div>

        <CharacterHost ref={host} character={character} className="premium-lesson-character" />

        {preflightVisible ? (
          <div className="adaptive-preflight-card">
            {savedCheckpoint ? (
              <>
                <small>فيه تقدم محفوظ</small>
                <h2>نكمل من حيث وقفنا؟</h2>
                <p>خلصت {savedCompletedScenes} خطوة. هنرجع لأول خطوة لسه ما خلصتش، مش لأول الدرس.</p>
                <div className="adaptive-preflight-actions">
                  <button type="button" className="is-primary" onClick={resumeCheckpoint}>كمّل</button>
                  <button type="button" onClick={restartFresh}>ابدأ من جديد</button>
                </div>
              </>
            ) : (
              <>
                <small>اختصر اللي إنت عارفه</small>
                <h2>إيه من دول مرتاح فيه فعلًا؟</h2>
                <p>اختيارك يشيل الشرح الأساسي فقط. Otti ممكن يرجع يختبر الحاجة طبيعيًا بعدين عشان يتأكد إنها ثابتة.</p>

                {(['word', 'phrase', 'pattern'] as const).map((kind) => {
                  const items = knownItems.filter((item) => item.kind === kind);
                  if (!items.length) return null;
                  return (
                    <div className="adaptive-known-group" key={kind}>
                      <strong>{knownKindCopy[kind]}</strong>
                      <div>
                        {items.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            className={knownItemIds.includes(item.id) ? 'is-selected' : ''}
                            onClick={() => toggleKnownItem(item.id)}
                          >
                            <span>{item.label}</span>
                            {item.description ? <small>{item.description}</small> : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className="adaptive-pace-picker">
                  <strong>سرعة Otti</strong>
                  <div>
                    {(Object.keys(paceCopy) as LessonSpeakingPace[]).map((value) => (
                      <button
                        type="button"
                        key={value}
                        className={pace === value ? 'is-selected' : ''}
                        onClick={() => setPace(value)}
                      >
                        {paceCopy[value].label}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="button" className="adaptive-preflight-confirm" onClick={() => setPreflightReady(true)}>
                  جهز الدرس بالخطة دي
                </button>
              </>
            )}
          </div>
        ) : null}

        {board && !preflightVisible ? (
          teacherLab && currentScene.activity ? (
            <TeacherLabBoardLayer
              sceneId={currentScene.id} beatId={visibleBeatId}
              activity={currentScene.activity}
              answered={quizState?.activityAnswered === true}
              choiceId={quizState?.activityChoiceId}
              questionReady={quizReady && status === 'listening' && Boolean(transport.current?.connected)}
              onChoose={chooseBoardActivity}
              Visual={l02Review ? A1L02LearningVisual : v04Review ? A1V04ReviewVisual : listeningLab ? A1FirstMeetingVisual : undefined}
              extra={v04Review && currentScene.id === 's04-reading-note' ? (
                <A1V04ReadingNote
                  text={A1_V04_BEATS['s04-reading-note']?.[0]?.board?.type === 'note'
                    ? (A1_V04_BEATS['s04-reading-note'][0].board.body ?? '') : ''}/>
              ) : listeningLab && (!(v04Review || l02Review) || teachingBeats[currentScene.id]?.some(beat=>beat.audioClipId)) ? (
                <LessonAudioPanel audio={activeAudio}
                  sceneClipId={teachingBeats[currentScene.id]?.find(beat=>beat.audioClipId)?.audioClipId ?? 'full-conversation'}
                  state={lessonAudioState} heardFull={Boolean(heardClips['full-conversation'])}
                  disabled={scripted.current.isReading || teacherSpeaking || !liveLesson}
                  onPlay={replayAuthoredAudio}/>
              ) : undefined}
            />
          ) : (
            <div className="premium-board-layer" aria-live="polite"><ConversationBoard board={board} /></div>
          )
        ) : null}

        {error ? <div className="premium-live-error" role="alert">{error}</div> : null}
        {quizFeedbackRetryVisible && pendingQuizFeedback.current?.sceneId===currentScene.id ? (
          <button type="button" className="teacher-pilot-resume"
            onClick={retryQuizFeedback} disabled={!transport.current?.connected || teacherSpeaking}>
            <ProductIcon name="refresh" size={18} /> إعادة شرح الإجابة
          </button>
        ) : null}
      </main>

      <footer className="premium-lesson-footer">
        {teacherLab && scriptPaused && status === 'listening' ? (
          <button type="button" className="teacher-pilot-resume" onClick={resumeScript}>كمّل الشرح من السطر اللي وقفنا عنده</button>
        ) : null}
        <div className="premium-live-status" aria-live="polite">
          <span className={`premium-status-dot status-${status}`} />
          <div>
            <strong>{lessonComplete ? 'الدرس خلص' : preflightVisible ? 'اختار اللي عارفه الأول' : teacherLab && currentScene.activity && quizReady ? 'اختار إجابتك من البورد' : learnerTurn ? 'دورك تتكلم' : statusCopy[status]}</strong>
            <small>{preflightVisible ? `Otti · ${paceCopy[pace].label}` : teacherLab && currentScene.activity ? 'Otti هيشرح اختيارك بصوته' : learnerTurn ? 'المايك مفتوح تلقائيًا' : teacherSpeaking ? 'لو محتاج توقفه اضغط مقاطعة' : character.name}</small>
          </div>
        </div>

        <div className="premium-control-row">
          <button type="button" className="premium-secondary-control" onClick={() => setToolsOpen(true)} aria-label="المساعدة والكتابة">
            <ProductIcon name="chat" size={22} />
            <span>مساعدة</span>
          </button>

          {lessonComplete ? (
            <button type="button" className="premium-main-control is-finish" onClick={() => void closeLive().then(() => navigate('/learn'))}>
              <ProductIcon name="check" size={27} />
              <span>إنهاء</span>
            </button>
          ) : teacherSpeaking ? (
            <button type="button" className="premium-main-control is-interrupt" onClick={interruptTeacher}>
              <span className="premium-pause-icon" aria-hidden="true" />
              <span>مقاطعة</span>
            </button>
          ) : teacherLab && currentScene.activity && liveLesson ? (
            <div className="premium-main-control is-quiz-status" aria-label="التفاعل بالضغط على اختيار من البورد">
              <ProductIcon name="check" size={27} />
              <span>{quizState?.activityAnswered ? 'اسمع' : quizReady ? 'اختار' : 'استنى'}</span>
            </div>
          ) : liveLesson ? (
            <button type="button" className={`premium-main-control is-mic${learnerTurn ? ' is-open' : ''}`} disabled>
              <ProductIcon name="speak" size={29} />
              <span>{learnerTurn ? 'دورك' : 'استنى'}</span>
            </button>
          ) : (
            <button type="button" className="premium-main-control is-start" onClick={() => void startLive()} disabled={connecting || !preflightReady}>
              <ProductIcon name="play" size={26} />
              <span>{connecting ? 'لحظة…' : !preflightReady ? 'جهز الدرس' : error ? 'حاول تاني' : savedCheckpoint ? 'كمّل' : 'ابدأ'}</span>
            </button>
          )}

          <div className="premium-mic-meter" aria-label={`Microphone level ${Math.round(micLevel * 100)} percent`}>
            <span style={{ height: `${Math.max(learnerTurn ? 8 : 0, micLevel * 100)}%` }} />
          </div>
        </div>
      </footer>

      {toolsOpen ? (
        <div className="premium-tools-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setToolsOpen(false);
        }}>
          <section className="premium-tools-sheet" role="dialog" aria-modal="true" aria-label="مساعدة الدرس">
            <header>
              <div><small>أثناء الدرس</small><h2>محتاج مساعدة؟</h2></div>
              <button type="button" onClick={() => setToolsOpen(false)} aria-label="إغلاق"><ProductIcon name="close" size={22} /></button>
            </header>

            {welcomeComplete ? (
              <div className="premium-quick-actions">
                {quickActions.map((action) => (
                  <button key={action.id} type="button" onClick={() => sendQuickAction(action.id)} disabled={!quickActionsEnabled}>
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}

            {!quickActionsEnabled && liveLesson ? (
              <p className="premium-tools-hint">{teacherSpeaking ? 'لو عايز توقف المدرس، اقفل القائمة واضغط مقاطعة.' : 'استنى لحد ما دورك ييجي.'}</p>
            ) : null}

            <form className="premium-chat-composer" onSubmit={sendChat}>
              <ProductIcon name="keyboard" size={20} />
              <input
                value={chatMessage}
                onChange={(event) => setChatMessage(event.target.value)}
                placeholder="اكتب سؤال أو استفسار…"
                aria-label="اكتب رسالة للمدرس"
                disabled={!learnerTurn || !transport.current?.connected}
              />
              <button type="submit" disabled={!chatMessage.trim() || !learnerTurn || !transport.current?.connected}>إرسال</button>
            </form>

            <details className="premium-transcript-preview">
              <summary>آخر كلام في الجلسة</summary>
              <div><small>أنت</small><p>{inputTranscript || '—'}</p></div>
              <div><small>{character.name}</small><p>{outputTranscript || '—'}</p></div>
            </details>

            <div className="premium-tools-actions">
              <button type="button" onClick={() => void copyCompactLog()}>
                {copyStatus === 'copied' ? 'تم نسخ اللوج' : 'Copy log'}
              </button>
              {copyStatus === 'error' ? <small>تعذر النسخ. جرب تاني.</small> : null}
            </div>

            <details className="premium-tech-details">
              <summary>تفاصيل تقنية</summary>
              <span>Scene: {sceneIndex + 1}/{activeLesson.scenes.length}</span>
              <span>Interaction: {welcomeComplete ? currentScene.interaction.kind : 'teacher welcome'}</span>
              <span>Board: {board ? 'visible' : 'hidden'}</span>
              <span>Tools: complete_scene + show_board</span>
              <span>Mic: {micOpen ? 'open' : 'closed'}</span>
              <span>Content: {contentSource}</span>
              <span>Pace: {pace}</span>
              <span>Known skipped: {knownItemIds.length}</span>
              <span>Performance: {performanceLabel}</span>
            </details>
          </section>
        </div>
      ) : null}
    </section>
  );
}
