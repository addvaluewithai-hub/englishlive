import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MicrophonePcmStream } from '../audio/MicrophonePcmStream';
import { PcmPlaybackQueue } from '../audio/PcmPlaybackQueue';
import { CharacterHost, type CharacterHostHandle } from '../character/CharacterHost';
import { CharacterPerformanceController } from '../character/CharacterPerformanceController';
import { getCharacterDefinition } from '../character/registry';
import { ConversationBoard } from '../components/ConversationBoard';
import { ProductIcon } from '../components/ProductIcon';
import { getRequiredSceneLesson } from '../lessonScenes/catalog';
import { SceneLessonRuntime } from '../lessonScenes/SceneLessonRuntime';
import type { SceneLessonState } from '../lessonScenes/types';
import { GeminiLiveTransport } from '../live/GeminiLiveTransport';
import type { LiveClientTool } from '../live/tools';
import type { LiveStatus } from '../live/types';
import { boardRevealTotal } from '../presentation/boardReveal';
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

type CompactLogRole = 'AI' | 'YOU' | 'TOOL';
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
  const state = readRecord(response?.state);
  const currentScene = readRecord(state?.currentScene);
  const currentSceneId = compactText(currentScene?.id, 80);
  const error = compactText(response?.error, 180);

  if (name === 'get_scene_state') return `get_scene_state → current=${currentSceneId || 'unknown'}`;

  if (name === 'reveal_board_next') {
    const sceneId = compactText(args.sceneId, 80) || 'unknown';
    const reveal = readRecord(currentScene?.boardReveal);
    const visible = typeof reveal?.visibleCount === 'number' ? reveal.visibleCount : '?';
    const total = typeof reveal?.totalCount === 'number' ? reveal.totalCount : '?';
    return error
      ? `reveal_board_next scene=${sceneId} → REJECTED: ${error}`
      : `reveal_board_next scene=${sceneId} → ${visible}/${total}`;
  }

  if (name === 'complete_scene') {
    const sceneId = compactText(args.sceneId, 80) || 'unknown';
    const source = compactText(args.evidenceSource, 40);
    const criteria = Array.isArray(args.metCriteria)
      ? args.metCriteria.filter((item): item is string => typeof item === 'string').join(', ')
      : '';
    const summary = compactText(args.evidenceSummary, 180);
    const outcome = error
      ? `REJECTED: ${error}`
      : state?.readyToFinish
        ? 'ACCEPTED → all scenes met'
        : `ACCEPTED → next=${currentSceneId || 'unknown'}`;
    return `complete_scene scene=${sceneId} source=${source || 'unknown'} criteria=[${criteria}]${summary ? ` summary="${summary}"` : ''} → ${outcome}`;
  }

  if (name === 'finish_scene_lesson') {
    return error ? `finish_scene_lesson → REJECTED: ${error}` : 'finish_scene_lesson → ACCEPTED';
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
  const lesson = getRequiredSceneLesson(lessonId);
  const profile = readLearnerProfile();
  const character = getCharacterDefinition(params.get('character') ?? profile?.characterId);

  const host = useRef<CharacterHostHandle | null>(null);
  const transport = useRef<GeminiLiveTransport | null>(null);
  const microphone = useRef<MicrophonePcmStream | null>(null);
  const playback = useRef<PcmPlaybackQueue | null>(null);
  const performer = useRef<CharacterPerformanceController | null>(null);
  const runtime = useRef<SceneLessonRuntime | null>(null);
  const compactLog = useRef<CompactLogEntry[]>([]);
  const welcomePlayed = useRef(false);
  const manualInterrupt = useRef(false);
  const holdMicForTeacherContinuation = useRef(false);

  const [status, setStatus] = useState<LiveStatus>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [micOpen, setMicOpen] = useState(false);
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [lessonState, setLessonState] = useState<SceneLessonState | null>(null);
  const [performanceLabel, setPerformanceLabel] = useState('audio-driven locally');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [chatMessage, setChatMessage] = useState('');
  const [welcomeComplete, setWelcomeComplete] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setLearnerMicEnabled(enabled: boolean) {
    microphone.current?.setEnabled(enabled);
    setMicOpen(enabled);
    if (!enabled) setMicLevel(0);
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
    return sceneRuntime.tools.map((tool) => ({
      declaration: tool.declaration,
      handle: async (args) => {
        try {
          const result = await tool.handle(args);
          appendToolLog(tool.declaration.name, args, result);
          return result;
        } catch (reason) {
          const result = { error: reason instanceof Error ? reason.message : 'tool failed' };
          appendToolLog(tool.declaration.name, args, result);
          throw reason;
        }
      },
    }));
  }

  async function copyCompactLog() {
    const body = compactLog.current.map((entry) => `${entry.role}: ${entry.text}`).join('\n\n');
    const text = [
      'EnglishLive compact scene log',
      `Lesson: ${lesson.source.sourceLessonId} — ${lesson.title}`,
      `Teacher: ${character.name}`,
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
    live.sendText(`[LEARNER TEXT CHAT] ${value}\nThis typed text is help/context only and is NOT spoken evidence. If it answers the speaking task, acknowledge it briefly and ask the learner to say it aloud before completing the scene.`);
    setChatMessage('');
    setToolsOpen(false);
  }

  function sendQuickAction(actionId: QuickActionId) {
    const action = quickActions.find((item) => item.id === actionId);
    const live = transport.current;
    if (!action || !welcomeComplete || !live?.connected || !micOpen || status !== 'listening') return;
    appendQuickActionLog(action.label);
    setInputTranscript((current) => appendTranscript(current, `[quick] ${action.label}`));
    live.sendText(`[LEARNER QUICK ACTION: ${action.token}] ${action.instruction}\nThis quick action is NOT lesson evidence. Do not call complete_scene because of this action.`);
    setToolsOpen(false);
  }

  function interruptTeacher() {
    const live = transport.current;
    if (status !== 'speaking' || !live?.connected) return;
    manualInterrupt.current = true;
    appendQuickActionLog('مقاطعة');
    playback.current?.interrupt();
    performer.current?.interrupt();
    setPerformanceLabel('audio-driven locally');
    setLearnerMicEnabled(true);
    setStatus('listening');
  }

  async function closeLive() {
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
    setMicLevel(0);
    setMicOpen(false);
    setStatus('idle');
  }

  async function leaveLesson() {
    setToolsOpen(false);
    await closeLive();
    navigate(`/learn/unit/${lesson.unitId}`);
  }

  useEffect(() => {
    return () => {
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
    if (status !== 'idle' && status !== 'error') return;
    setError(null);
    setCopyStatus('idle');
    setChatMessage('');
    setInputTranscript('');
    setOutputTranscript('');
    setPerformanceLabel('audio-driven locally');
    setWelcomeComplete(false);
    setMicOpen(false);
    setToolsOpen(false);
    welcomePlayed.current = false;
    manualInterrupt.current = false;
    holdMicForTeacherContinuation.current = false;
    compactLog.current = [];

    const sceneRuntime = new SceneLessonRuntime(lesson, { onStateChange: setLessonState });
    runtime.current = sceneRuntime;
    setLessonState(sceneRuntime.snapshot);

    const characterPerformance = new CharacterPerformanceController(() => host.current);
    performer.current = characterPerformance;

    const queue = new PcmPlaybackQueue({
      onMouthPose: (pose) => characterPerformance.setMouth(pose),
      onSpeechStart: () => {
        holdMicForTeacherContinuation.current = false;
        setLearnerMicEnabled(false);
        setStatus('speaking');
        characterPerformance.speechStart();
      },
      onSpeechEnd: () => {
        const shouldHold = holdMicForTeacherContinuation.current;
        setLearnerMicEnabled(!shouldHold);
        setStatus((current) => current === 'idle' || current === 'error' ? current : 'listening');
        characterPerformance.speechEnd();
      },
      onTurnComplete: () => {
        sceneRuntime.markPartnerTurnComplete();
        if (!welcomePlayed.current) {
          welcomePlayed.current = true;
          holdMicForTeacherContinuation.current = true;
          sceneRuntime.markLessonOpeningComplete();
          setWelcomeComplete(true);
          live.sendText('The spoken welcome is now finished. Call get_scene_state now, then begin only the current authored scene. If it has a board, reveal the first board chunk with reveal_board_next immediately before explaining that chunk. Teach slowly, one small idea at a time. Do not repeat the lesson overview.');
        }
      },
    });
    playback.current = queue;

    const live = new GeminiLiveTransport(
      {
        onStatus: setStatus,
        onInputTranscript: (text) => {
          sceneRuntime.recordAutomaticTranscript(text);
          appendDialogueLog('YOU', text);
          setInputTranscript((current) => appendTranscript(current, text));
        },
        onOutputTranscript: (text) => {
          if (manualInterrupt.current) return;
          appendDialogueLog('AI', text);
          queue.pushTranscript(text);
          setOutputTranscript((current) => appendTranscript(current, text));
        },
        onAudio: (data, mimeType) => {
          if (manualInterrupt.current) return;
          setLearnerMicEnabled(false);
          void queue.enqueue(data, pcmSampleRate(mimeType));
        },
        onPerformanceCue: (cue) => {
          characterPerformance.applyCue(cue);
          setPerformanceLabel(`${cue.emotion} · ${cue.gesture}`);
        },
        onPerformanceCancelled: () => {
          characterPerformance.cancelCue();
          setPerformanceLabel('audio-driven locally');
        },
        onInterrupted: () => {
          manualInterrupt.current = false;
          queue.interrupt();
          characterPerformance.interrupt();
          setLearnerMicEnabled(true);
          setStatus('listening');
          setPerformanceLabel('audio-driven locally');
        },
        onTurnComplete: () => {
          manualInterrupt.current = false;
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
      ? `The learner's private profile says their first name is ${profile.firstName || 'not provided'}, their main reason for English is to ${goalPrompt(profile.goals[0] ?? 'everyday')}, and their speaking comfort is ${comfortLabel(profile.comfort)}. Use this only to pace support. Never use profile facts to satisfy lesson evidence or answer for the learner.`
      : 'No learner profile is available. Keep support very concrete and calibrate only from the live interaction.';

    const characterPrompt = `You are ${character.name}, ${character.persona.style}. You are teaching one adult A1 English learner live. Be warm, patient and concise without sounding childish. Address the learner in singular Egyptian Arabic (for example أهلاً بيك), not plural language and not formal يا فندم. Speak at a calm teacher pace: short Arabic sentences, clear pauses, and unhurried target English. In THIS lesson, explanations should be mostly simple Egyptian Arabic while target phrases, models and roleplay remain in English. Use Arabic to make one small idea clear, then get the learner speaking English quickly. Never call yourself another teacher name even if an authored example contains one; when referring to yourself, always use ${character.name}. The learner microphone is intentionally closed while you are audibly teaching. They can explicitly interrupt you with the app control; otherwise finish the current concise teaching turn and then give them space.`;

    try {
      await queue.unlock();
      await live.connect(`${characterPrompt}\n\n${learnerContext}\n\n${sceneRuntime.systemPrompt}`);
      await mic.start(
        (chunk) => live.sendAudio(chunk),
        (level) => {
          setMicLevel(level);
          sceneRuntime.recordLearnerAudioLevel(level);
        },
      );
      live.sendText('Start the authored lesson now by calling get_scene_state. Because openingRequired is true, deliver ONLY the short human teacher welcome described there. Do not begin Scene 1 in the same turn. Speak calmly and stop after the welcome.');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not start the scene lesson.';
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
    ? lesson.scenes.find((scene) => scene.id === lessonState.currentSceneId) ?? lesson.scenes[0]
    : lesson.scenes[0];
  const sceneIndex = Math.max(0, lesson.scenes.findIndex((scene) => scene.id === currentScene.id));
  const completedScenes = lessonState
    ? lesson.scenes.filter((scene) => lessonState.scenes[scene.id]?.status === 'met').length
    : 0;
  const lessonComplete = Boolean(lessonState?.completedAt);
  const currentSceneState = lessonState?.scenes[currentScene.id];
  const boardRevealCount = currentSceneState?.boardRevealCount ?? 0;
  const boardTotal = boardRevealTotal(currentScene.board);
  const board = welcomeComplete && boardRevealCount > 0 ? currentScene.board ?? null : null;
  const quickActionsEnabled = welcomeComplete && learnerTurn && Boolean(transport.current?.connected);

  return (
    <section className="premium-scene-lesson" dir="rtl" style={{ '--character-accent': character.accent } as CSSProperties}>
      <header className="premium-lesson-topbar">
        <button type="button" className="premium-top-icon" onClick={() => void leaveLesson()} aria-label="الخروج من الدرس">
          <ProductIcon name="close" size={24} />
        </button>
        <div className="premium-lesson-title">
          <small>A1 · الوحدة 1 · الدرس {lesson.order}</small>
          <strong>{lesson.title}</strong>
        </div>
        <button type="button" className="premium-top-icon" onClick={() => setToolsOpen(true)} aria-label="أدوات الدرس">
          <ProductIcon name="more" size={25} />
        </button>
      </header>

      <div className="premium-lesson-progress" aria-label={`${completedScenes} of ${lesson.scenes.length} lesson scenes completed`}>
        {lesson.scenes.map((scene, index) => (
          <span
            key={scene.id}
            className={`${lessonState?.scenes[scene.id]?.status === 'met' ? 'is-complete' : ''}${index === sceneIndex && !lessonComplete ? ' is-current' : ''}`}
          />
        ))}
      </div>

      <main className={`premium-lesson-stage${board ? ' has-board' : ''}`}>
        <div className="premium-scene-caption">
          <small>{welcomeComplete ? `الخطوة ${sceneIndex + 1} من ${lesson.scenes.length}` : 'بداية الدرس'}</small>
          <strong>{welcomeComplete ? currentScene.title : `مع ${character.name}`}</strong>
        </div>

        <CharacterHost ref={host} character={character} className="premium-lesson-character" />

        {board ? (
          <div className="premium-board-layer" aria-live="polite">
            <ConversationBoard board={board} visibleCount={boardRevealCount} revealMode="focus" />
          </div>
        ) : null}

        {error ? <div className="premium-live-error" role="alert">{error}</div> : null}
      </main>

      <footer className="premium-lesson-footer">
        <div className="premium-live-status" aria-live="polite">
          <span className={`premium-status-dot status-${status}`} />
          <div>
            <strong>{lessonComplete ? 'الدرس خلص' : learnerTurn ? 'دورك تتكلم' : statusCopy[status]}</strong>
            <small>{learnerTurn ? 'المايك مفتوح تلقائيًا' : teacherSpeaking ? 'لو محتاج توقفه اضغط مقاطعة' : character.name}</small>
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
          ) : liveLesson ? (
            <button type="button" className={`premium-main-control is-mic${learnerTurn ? ' is-open' : ''}`} disabled>
              <ProductIcon name="speak" size={29} />
              <span>{learnerTurn ? 'دورك' : 'استنى'}</span>
            </button>
          ) : (
            <button type="button" className="premium-main-control is-start" onClick={() => void startLive()} disabled={connecting}>
              <ProductIcon name="play" size={26} />
              <span>{connecting ? 'لحظة…' : error ? 'حاول تاني' : 'ابدأ'}</span>
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
              <span>Scene: {sceneIndex + 1}/{lesson.scenes.length}</span>
              <span>Interaction: {welcomeComplete ? currentScene.interaction.kind : 'teacher welcome'}</span>
              <span>Board: {welcomeComplete ? `${boardRevealCount}/${boardTotal} · focus` : 'not started'}</span>
              <span>Mic: {micOpen ? 'open' : 'closed'}</span>
              <span>Performance: {performanceLabel}</span>
            </details>
          </section>
        </div>
      ) : null}
    </section>
  );
}
