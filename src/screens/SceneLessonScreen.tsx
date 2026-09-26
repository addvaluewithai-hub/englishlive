import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MicrophonePcmStream } from '../audio/MicrophonePcmStream';
import { PcmPlaybackQueue } from '../audio/PcmPlaybackQueue';
import { CharacterHost, type CharacterHostHandle } from '../character/CharacterHost';
import { CharacterPerformanceController } from '../character/CharacterPerformanceController';
import { getCharacterDefinition } from '../character/registry';
import { ConversationBoard } from '../components/ConversationBoard';
import { getRequiredSceneLesson } from '../lessonScenes/catalog';
import { SceneLessonRuntime } from '../lessonScenes/SceneLessonRuntime';
import type { SceneLessonState } from '../lessonScenes/types';
import { GeminiLiveTransport } from '../live/GeminiLiveTransport';
import type { LiveClientTool } from '../live/tools';
import type { LiveStatus } from '../live/types';
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
  idle: 'Ready',
  connecting: 'Getting ready',
  listening: 'Listening',
  speaking: 'Teaching',
  reconnecting: 'Reconnecting',
  error: 'Try again',
};

type CompactLogRole = 'AI' | 'YOU' | 'YOU [text]' | 'TOOL';

interface CompactLogEntry {
  role: CompactLogRole;
  text: string;
}

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

  if (name === 'get_scene_state') {
    const openingRequired = state?.openingRequired === true ? ' opening=required' : '';
    return `get_scene_state → current=${currentSceneId || 'unknown'}${openingRequired}`;
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
  const openingPending = useRef(true);

  const [status, setStatus] = useState<LiveStatus>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [lessonState, setLessonState] = useState<SceneLessonState | null>(null);
  const [performanceLabel, setPerformanceLabel] = useState('audio-driven locally');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [openingComplete, setOpeningComplete] = useState(false);
  const [chatText, setChatText] = useState('');
  const [error, setError] = useState<string | null>(null);

  function appendDialogueLog(role: 'AI' | 'YOU', text: string) {
    const value = text.trim();
    if (!value) return;
    const entries = compactLog.current;
    const last = entries.at(-1);
    if (last?.role === role) {
      last.text = appendTranscript(last.text, value).slice(-2400);
    } else {
      entries.push({ role, text: value.slice(-2400) });
    }
    if (entries.length > 160) entries.splice(0, entries.length - 160);
  }

  function appendTypedLog(text: string) {
    compactLog.current.push({ role: 'YOU [text]', text: text.slice(-2400) });
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

  function sendTypedChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = chatText.trim();
    const live = transport.current;
    if (!value || !live?.connected) return;

    appendTypedLog(value);
    setInputTranscript((current) => appendTranscript(current, `[typed] ${value}`));
    live.sendText(
      `[LEARNER TEXT CHAT]\n${value}\n[END LEARNER TEXT CHAT]\nThis was typed, not spoken. Respond naturally, but do not count it as speaking evidence.`,
    );
    setChatText('');
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
    setMicLevel(0);
    setChatText('');
    setStatus('idle');
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
    setInputTranscript('');
    setOutputTranscript('');
    setPerformanceLabel('audio-driven locally');
    setChatText('');
    setOpeningComplete(false);
    openingPending.current = true;
    compactLog.current = [];

    const sceneRuntime = new SceneLessonRuntime(lesson, {
      onStateChange: setLessonState,
    });
    runtime.current = sceneRuntime;
    setLessonState(sceneRuntime.snapshot);

    const characterPerformance = new CharacterPerformanceController(() => host.current);
    performer.current = characterPerformance;

    const queue = new PcmPlaybackQueue({
      onMouthPose: (pose) => characterPerformance.setMouth(pose),
      onSpeechStart: () => {
        setStatus('speaking');
        characterPerformance.speechStart();
      },
      onSpeechEnd: () => {
        setStatus((current) => current === 'idle' || current === 'error' ? current : 'listening');
        characterPerformance.speechEnd();
      },
      onTurnComplete: () => {
        sceneRuntime.markPartnerTurnComplete();
        if (!openingPending.current) return;
        openingPending.current = false;
        sceneRuntime.markLessonOpeningComplete();
        setOpeningComplete(true);
        transport.current?.sendText(
          'The short teacher welcome was audibly completed. Call get_scene_state again. Now begin teaching ONLY currentScene and follow its authored teaching, board, interaction and success criteria.',
        );
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
          appendDialogueLog('AI', text);
          queue.pushTranscript(text);
          setOutputTranscript((current) => appendTranscript(current, text));
        },
        onAudio: (data, mimeType) => void queue.enqueue(data, pcmSampleRate(mimeType)),
        onPerformanceCue: (cue) => {
          characterPerformance.applyCue(cue);
          setPerformanceLabel(`${cue.emotion} · ${cue.gesture}`);
        },
        onPerformanceCancelled: () => {
          characterPerformance.cancelCue();
          setPerformanceLabel('audio-driven locally');
        },
        onInterrupted: () => {
          queue.interrupt();
          characterPerformance.interrupt();
          setPerformanceLabel('audio-driven locally');
        },
        onTurnComplete: () => queue.markTurnComplete(),
        onError: setError,
      },
      tracedTools(sceneRuntime),
    );
    transport.current = live;

    const mic = new MicrophonePcmStream();
    microphone.current = mic;

    const learnerContext = profile
      ? `The learner's private profile says their first name is ${profile.firstName || 'not provided'}, their main reason for English is to ${goalPrompt(profile.goals[0] ?? 'everyday')}, and their speaking comfort is ${comfortLabel(profile.comfort)}. Use this only to pace support. Never use profile facts to satisfy lesson evidence or answer for the learner. Do not use the stored first name in the lesson opening.`
      : 'No learner profile is available. Keep support very concrete and calibrate only from the live interaction.';

    const characterPrompt = `You are ${character.name}, ${character.persona.style}. You are teaching an adult A1 English learner live. Be warm, patient and concise without sounding childish. In THIS lesson, explanations should be mostly simple Egyptian Arabic while target phrases, models and roleplay remain in English. Use Arabic to make the idea clear, then get the learner speaking English quickly. Allow interruption and react naturally.`;

    try {
      await queue.unlock();
      await live.connect(
        `${characterPrompt}\n\n${learnerContext}\n\n${sceneRuntime.systemPrompt}`,
      );
      await mic.start(
        (chunk) => live.sendAudio(chunk),
        (level) => {
          setMicLevel(level);
          sceneRuntime.recordLearnerAudioLevel(level);
        },
      );
      live.sendText('Start the authored lesson now. Call get_scene_state before speaking. Because openingRequired is true, give ONLY the short human lesson welcome first and stop. Do not teach Scene 1 until the application tells you the welcome finished audibly.');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not start the scene lesson.';
      setError(message);
      setStatus('error');
      live.close();
      await mic.stop();
      await queue.close();
      characterPerformance.close();
    }
  }

  const connecting = status === 'connecting' || status === 'reconnecting';
  const liveLesson = status === 'listening' || status === 'speaking';
  const currentScene = lessonState
    ? lesson.scenes.find((scene) => scene.id === lessonState.currentSceneId) ?? lesson.scenes[0]
    : lesson.scenes[0];
  const sceneIndex = Math.max(0, lesson.scenes.findIndex((scene) => scene.id === currentScene.id));
  const completedScenes = lessonState
    ? lesson.scenes.filter((scene) => lessonState.scenes[scene.id]?.status === 'met').length
    : 0;
  const lessonComplete = Boolean(lessonState?.completedAt);
  const board = openingComplete ? currentScene.board ?? null : null;
  const sidebarTitle = openingComplete ? currentScene.title : lesson.title;
  const sidebarDescription = openingComplete
    ? currentScene.interaction.learnerTask
    : `${character.name} will welcome you, explain what today’s lesson is about, then start the first small teaching scene.`;

  return (
    <section className="session-screen lesson-session-screen">
      <div className="session-stage" style={{ '--character-accent': character.accent } as CSSProperties}>
        <div className="session-stage-meta lesson-stage-meta">
          <span>A1 · Unit 1 · Lesson {lesson.order} · Scene pilot</span>
          <strong>{lesson.title}</strong>
        </div>

        <div className={`session-stage-body stage-mode-${board ? 'board' : 'hero'}`}>
          {board ? (
            <div className="session-board-surface" aria-live="polite">
              <ConversationBoard board={board} />
            </div>
          ) : null}
          <CharacterHost ref={host} character={character} className="session-character-host" />
        </div>

        <div className="lesson-beat-strip" aria-label={`${completedScenes} of ${lesson.scenes.length} lesson scenes completed`}>
          {lesson.scenes.map((scene, index) => (
            <span
              key={scene.id}
              className={`${lessonState?.scenes[scene.id]?.status === 'met' ? 'is-complete' : ''}${openingComplete && index === sceneIndex && !lessonComplete ? ' is-current' : ''}`}
            />
          ))}
        </div>

        <div className="session-stage-footer">
          <div className="session-partner">
            <strong>{character.name}</strong>
            <span className={`live-status status-${status}`} aria-live="polite">{lessonComplete ? 'Lesson complete' : statusCopy[status]}</span>
          </div>
          <div className="session-control-dock">
            <div className="mic-meter" aria-label={`Microphone level ${Math.round(micLevel * 100)} percent`}>
              <span style={{ width: `${Math.max(liveLesson ? 3 : 0, micLevel * 100)}%` }} />
            </div>
            {lessonComplete ? (
              <button
                type="button"
                className="button primary"
                onClick={() => void closeLive().then(() => navigate('/learn'))}
              >
                Finish lesson
              </button>
            ) : (
              <button
                type="button"
                className={liveLesson ? 'button stop-conversation' : 'button primary'}
                onClick={liveLesson ? () => void closeLive().then(() => navigate('/learn')) : () => void startLive()}
                disabled={connecting}
              >
                {connecting ? 'Getting ready…' : liveLesson ? 'End lesson' : error ? 'Try again' : 'Start lesson'}
              </button>
            )}
          </div>
        </div>
      </div>

      <aside className="conversation-sidebar lesson-sidebar">
        <div className="conversation-sidebar-heading">
          <p className="eyebrow">{openingComplete ? `Scene ${sceneIndex + 1} of ${lesson.scenes.length}` : 'Welcome'}</p>
          <h2>{sidebarTitle}</h2>
          <p>{sidebarDescription}</p>
        </div>

        {openingComplete ? (
          <div className="lesson-language-focus">
            <small>Target English</small>
            {currentScene.teaching.englishTargets.slice(0, 5).map((target) => <span key={target}>{target}</span>)}
          </div>
        ) : null}

        {error ? <div className="live-error" role="alert">{error}</div> : null}

        <div className="scene-session-actions">
          <button type="button" className="button quiet" onClick={() => void copyCompactLog()}>
            {copyStatus === 'copied' ? 'Copied log' : 'Copy log'}
          </button>
          {copyStatus === 'error' ? <small>Could not copy. Try again in a secure browser context.</small> : null}
        </div>

        <div className="transcript-stack" aria-live="polite">
          <article className="transcript-card user-transcript">
            <small>You</small>
            <p>{inputTranscript || 'Your voice or typed message will appear here once the lesson starts.'}</p>
          </article>
          <article className="transcript-card partner-transcript">
            <small>{character.name}</small>
            <p>{outputTranscript || `${character.name} will welcome you before the teaching starts.`}</p>
          </article>
        </div>

        <form className="lesson-chat-composer" onSubmit={sendTypedChat}>
          <input
            type="text"
            value={chatText}
            onChange={(event) => setChatText(event.target.value)}
            placeholder="Type a question or message…"
            aria-label={`Type a message to ${character.name}`}
            disabled={!liveLesson || lessonComplete}
          />
          <button
            type="submit"
            className="button quiet"
            disabled={!liveLesson || lessonComplete || !chatText.trim()}
          >
            Send
          </button>
          <small>Typing is for questions and support. Speaking is still required to complete speaking practice.</small>
        </form>

        <details className="session-tech-details">
          <summary>Scene details</summary>
          <span>Lesson: {lesson.source.sourceLessonId}</span>
          <span>Scene progress: {completedScenes}/{lesson.scenes.length}</span>
          <span>Interaction: {openingComplete ? currentScene.interaction.kind : 'lesson opening'}</span>
          <span>Performance: {performanceLabel}</span>
          <span>Curriculum source: english-course · {lesson.source.branch}</span>
          <span>Copy log contains dialogue + scene tool calls only.</span>
        </details>
      </aside>
    </section>
  );
}
