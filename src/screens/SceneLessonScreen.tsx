import { useEffect, useRef, useState, type CSSProperties } from 'react';
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

  const [status, setStatus] = useState<LiveStatus>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [lessonState, setLessonState] = useState<SceneLessonState | null>(null);
  const [performanceLabel, setPerformanceLabel] = useState('audio-driven locally');
  const [error, setError] = useState<string | null>(null);

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
    setInputTranscript('');
    setOutputTranscript('');
    setPerformanceLabel('audio-driven locally');

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
      onTurnComplete: () => sceneRuntime.markPartnerTurnComplete(),
    });
    playback.current = queue;

    const live = new GeminiLiveTransport(
      {
        onStatus: setStatus,
        onInputTranscript: (text) => {
          sceneRuntime.recordAutomaticTranscript(text);
          setInputTranscript((current) => appendTranscript(current, text));
        },
        onOutputTranscript: (text) => {
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
      [...sceneRuntime.tools],
    );
    transport.current = live;

    const mic = new MicrophonePcmStream();
    microphone.current = mic;

    const learnerContext = profile
      ? `The learner's private profile says their first name is ${profile.firstName || 'not provided'}, their main reason for English is to ${goalPrompt(profile.goals[0] ?? 'everyday')}, and their speaking comfort is ${comfortLabel(profile.comfort)}. Use this only to pace support. IMPORTANT: this lesson teaches first-contact identity language, so do NOT say the learner's name for them or use it to satisfy any scene evidence.`
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
      live.sendText('Start the authored scene lesson now. Call get_scene_state before speaking. Follow only currentScene, teach mostly in concise Egyptian Arabic, and never advance without a successful complete_scene tool call.');
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
  const board = currentScene.board ?? null;

  return (
    <section className="session-screen lesson-session-screen">
      <div className="session-stage" style={{ '--character-accent': character.accent } as CSSProperties}>
        <div className="session-stage-meta lesson-stage-meta">
          <span>A1 · Unit 1 · Lesson 1 · Scene pilot</span>
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
              className={`${lessonState?.scenes[scene.id]?.status === 'met' ? 'is-complete' : ''}${index === sceneIndex && !lessonComplete ? ' is-current' : ''}`}
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
          <p className="eyebrow">Scene {sceneIndex + 1} of {lesson.scenes.length}</p>
          <h2>{currentScene.title}</h2>
          <p>{currentScene.goal}</p>
        </div>

        <div className="lesson-language-focus">
          <small>Target English</small>
          {currentScene.teaching.englishTargets.slice(0, 5).map((target) => <span key={target}>{target}</span>)}
        </div>

        {error ? <div className="live-error" role="alert">{error}</div> : null}

        <div className="transcript-stack" aria-live="polite">
          <article className="transcript-card user-transcript">
            <small>You</small>
            <p>{inputTranscript || 'Your spoken English will appear here once the lesson starts.'}</p>
          </article>
          <article className="transcript-card partner-transcript">
            <small>{character.name}</small>
            <p>{outputTranscript || `${character.name} will explain briefly, then get you speaking.`}</p>
          </article>
        </div>

        <details className="session-tech-details">
          <summary>Scene details</summary>
          <span>Lesson: {lesson.source.sourceLessonId}</span>
          <span>Scene progress: {completedScenes}/{lesson.scenes.length}</span>
          <span>Interaction: {currentScene.interaction.kind}</span>
          <span>Performance: {performanceLabel}</span>
          <span>Curriculum source: english-course · {lesson.source.branch}</span>
        </details>
      </aside>
    </section>
  );
}
