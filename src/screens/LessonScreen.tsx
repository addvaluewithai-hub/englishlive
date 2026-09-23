import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MicrophonePcmStream } from '../audio/MicrophonePcmStream';
import { PcmPlaybackQueue } from '../audio/PcmPlaybackQueue';
import { CharacterHost, type CharacterHostHandle } from '../character/CharacterHost';
import { CharacterPerformanceController } from '../character/CharacterPerformanceController';
import { getCharacterDefinition } from '../character/registry';
import { ConversationBoard } from '../components/ConversationBoard';
import { CourseLessonRuntime } from '../course/CourseLessonRuntime';
import { getRequiredCourseLesson } from '../course/catalog';
import { persistLessonProgress, readCourseProgress, recordLessonRun } from '../course/store';
import type { CourseLessonState } from '../course/types';
import { GeminiLiveTransport } from '../live/GeminiLiveTransport';
import type { LiveStatus } from '../live/types';
import { buildRelationshipPrompt } from '../memory/context';
import { RelationshipMemoryCollector } from '../memory/RelationshipMemoryCollector';
import { readEnglishLiveMemory } from '../memory/store';
import type { RelationshipMemoryProposal } from '../memory/types';
import { StageDirector } from '../presentation/StageDirector';
import { initialStageState, type StageState } from '../presentation/types';
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

interface LessonRunMeta {
  runId: string;
  startedAt: string;
}

export function LessonScreen() {
  const { lessonId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const lesson = getRequiredCourseLesson(lessonId);
  const profile = readLearnerProfile();
  const character = getCharacterDefinition(params.get('character') ?? profile?.characterId);

  const host = useRef<CharacterHostHandle | null>(null);
  const transport = useRef<GeminiLiveTransport | null>(null);
  const microphone = useRef<MicrophonePcmStream | null>(null);
  const playback = useRef<PcmPlaybackQueue | null>(null);
  const performer = useRef<CharacterPerformanceController | null>(null);
  const runtime = useRef<CourseLessonRuntime | null>(null);
  const stageDirector = useRef<StageDirector | null>(null);
  const relationshipCollector = useRef<RelationshipMemoryCollector | null>(null);
  const runMeta = useRef<LessonRunMeta | null>(null);
  const runRecorded = useRef(false);
  const replaying = useRef(false);
  const lastBoardBeatId = useRef<string | null>(null);

  const [status, setStatus] = useState<LiveStatus>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [lessonState, setLessonState] = useState<CourseLessonState | null>(null);
  const [stageState, setStageState] = useState<StageState>(initialStageState);
  const [relationshipProposal, setRelationshipProposal] = useState<RelationshipMemoryProposal | null>(null);
  const [performanceLabel, setPerformanceLabel] = useState('audio-driven locally');
  const [error, setError] = useState<string | null>(null);

  function syncAuthoredBoard(state: CourseLessonState, director: StageDirector) {
    if (lastBoardBeatId.current === state.currentBeatId) return;
    lastBoardBeatId.current = state.currentBeatId;
    const beat = lesson.beats.find((item) => item.id === state.currentBeatId);
    if (beat?.board) director.queueBoard(beat.board);
    else director.reset();
  }

  function persistRun() {
    if (runRecorded.current) return runMeta.current;
    const meta = runMeta.current;
    const tutor = runtime.current;
    if (!meta || !tutor) return meta;
    recordLessonRun({
      runId: meta.runId,
      lesson,
      state: tutor.snapshot,
      characterId: character.id,
      startedAt: meta.startedAt,
    });
    runRecorded.current = true;
    return meta;
  }

  useEffect(() => {
    return () => {
      persistRun();
      transport.current?.close();
      void microphone.current?.stop();
      void playback.current?.close();
      performer.current?.close();
      stageDirector.current?.reset();
    };
  }, []);

  useEffect(() => {
    if (status === 'connecting' || status === 'reconnecting') performer.current?.thinking();
    else if (status === 'listening') performer.current?.listening();
    else if (status === 'idle' || status === 'error') host.current?.setMode('idle');
  }, [status, character.id]);

  async function startLive() {
    if (status !== 'idle' && status !== 'error') return;
    persistRun();
    runMeta.current = null;
    runRecorded.current = false;
    relationshipCollector.current = null;
    lastBoardBeatId.current = null;
    setRelationshipProposal(null);
    setError(null);
    setInputTranscript('');
    setOutputTranscript('');
    setPerformanceLabel('audio-driven locally');
    setStageState(initialStageState);

    const saved = readCourseProgress().lessonProgress[lesson.id];
    replaying.current = Boolean(saved?.completedAt);
    const tutor = new CourseLessonRuntime(lesson, {
      initialProgress: replaying.current ? undefined : saved,
      onStateChange: (state) => {
        setLessonState(state);
        persistLessonProgress(lesson, state, { preserveCompletedFloor: replaying.current });
        if (stageDirector.current) syncAuthoredBoard(state, stageDirector.current);
      },
    });
    runtime.current = tutor;
    setLessonState(tutor.snapshot);

    const director = new StageDirector(setStageState);
    stageDirector.current = director;
    setStageState(director.snapshot);
    syncAuthoredBoard(tutor.snapshot, director);

    const memoryCollector = new RelationshipMemoryCollector(setRelationshipProposal);
    relationshipCollector.current = memoryCollector;

    const characterPerformance = new CharacterPerformanceController(() => host.current);
    performer.current = characterPerformance;

    const queue = new PcmPlaybackQueue({
      onMouthPose: (pose) => characterPerformance.setMouth(pose),
      onSpeechStart: () => {
        setStatus('speaking');
        director.speechStarted();
        characterPerformance.speechStart();
      },
      onSpeechEnd: () => {
        setStatus((current) => current === 'idle' || current === 'error' ? current : 'listening');
        characterPerformance.speechEnd();
      },
      onTurnComplete: () => {
        director.turnPlayed();
        const result = tutor.markPartnerTurnComplete();
        if (result.readyToFinish) {
          transport.current?.sendText('The final authored teaching/recap turn finished audibly. Call get_lesson_state, then finish_lesson now. Give only a brief natural closing after the tool succeeds.');
        } else if (result.advanced) {
          transport.current?.sendText('The authored teacher turn finished audibly and the application advanced the lesson. Call get_lesson_state and continue with the new current beat.');
        }
      },
    });
    playback.current = queue;

    const live = new GeminiLiveTransport(
      {
        onStatus: setStatus,
        onInputTranscript: (text) => {
          tutor.recordAutomaticTranscript(text);
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
          director.interrupt();
          lastBoardBeatId.current = null;
          syncAuthoredBoard(tutor.snapshot, director);
          characterPerformance.interrupt();
          setPerformanceLabel('audio-driven locally');
        },
        onTurnComplete: () => queue.markTurnComplete(),
        onError: setError,
      },
      [...tutor.tools, memoryCollector.tool],
    );
    transport.current = live;

    const mic = new MicrophonePcmStream();
    microphone.current = mic;

    const learnerContext = profile
      ? `The learner's first name is ${profile.firstName || 'not provided'}. Their main reason for English is to ${goalPrompt(profile.goals[0] ?? 'everyday')}. Their self-description is: ${comfortLabel(profile.comfort)} Use this privately to pace examples and difficulty; never recite these labels back.`
      : 'No learner profile is available. Keep the lesson examples familiar and calibrate from the live conversation.';
    const relationshipContext = buildRelationshipPrompt(readEnglishLiveMemory(), character.id);
    const characterPrompt = `You are ${character.name}, ${character.persona.style}. You are the learner's live English teacher and conversation partner. Stay warm, human and concise. Speak English by default; if the learner explicitly asks for a brief Arabic clarification, you may clarify briefly and return to English. Allow interruption. React to the learner rather than sounding like a recording.`;

    try {
      await queue.unlock();
      await live.connect(
        `${characterPrompt}\n\n${learnerContext}\n\n${relationshipContext}\n\n${memoryCollector.systemPrompt}\n\n${tutor.systemPrompt}`,
      );
      await mic.start(
        (chunk) => live.sendAudio(chunk),
        (level) => {
          setMicLevel(level);
          tutor.recordLearnerAudioLevel(level);
        },
      );
      runMeta.current = {
        runId: crypto.randomUUID(),
        startedAt: new Date().toISOString(),
      };
      live.sendText('Start the live lesson now. Call get_lesson_state before speaking and follow only the returned current beat.');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not start the live lesson.';
      setError(message);
      setStatus('error');
      director.reset();
      live.close();
      await mic.stop();
      await queue.close();
      characterPerformance.close();
    }
  }

  async function finishAndReview() {
    const meta = persistRun();
    transport.current?.endAudioStream();
    transport.current?.close();
    transport.current = null;
    await microphone.current?.stop();
    microphone.current = null;
    await playback.current?.close();
    playback.current = null;
    performer.current?.close();
    performer.current = null;
    stageDirector.current?.reset();
    stageDirector.current = null;
    runtime.current = null;
    setMicLevel(0);
    setStatus('idle');

    if (meta) {
      navigate(`/lesson-review/${meta.runId}`, {
        state: relationshipProposal ? { relationshipProposal } : undefined,
      });
    }
  }

  const connecting = status === 'connecting' || status === 'reconnecting';
  const liveLesson = status === 'listening' || status === 'speaking';
  const currentBeat = lessonState
    ? lesson.beats.find((beat) => beat.id === lessonState.currentBeatId) ?? lesson.beats[0]
    : lesson.beats[0];
  const beatIndex = Math.max(0, lesson.beats.findIndex((beat) => beat.id === currentBeat?.id));
  const completedBeats = lessonState
    ? lesson.beats.filter((beat) => lessonState.beats[beat.id]?.status === 'met').length
    : 0;
  const lessonComplete = Boolean(lessonState?.completedAt);

  return (
    <section className="session-screen lesson-session-screen">
      <div className="session-stage" style={{ '--character-accent': character.accent } as CSSProperties}>
        <div className="session-stage-meta lesson-stage-meta">
          <span>B1 · Unit 1 · Lesson {lesson.order}</span>
          <strong>{lesson.title}</strong>
        </div>

        <div className={`session-stage-body stage-mode-${stageState.mode}`}>
          {stageState.board ? (
            <div className="session-board-surface" aria-live="polite">
              <ConversationBoard board={stageState.board} />
            </div>
          ) : null}
          <CharacterHost ref={host} character={character} className="session-character-host" />
        </div>

        <div className="lesson-beat-strip" aria-label={`${completedBeats} of ${lesson.beats.length} lesson steps completed`}>
          {lesson.beats.map((beat, index) => (
            <span
              key={beat.id}
              className={`${lessonState?.beats[beat.id]?.status === 'met' ? 'is-complete' : ''}${index === beatIndex && !lessonComplete ? ' is-current' : ''}`}
            />
          ))}
        </div>

        <div className="session-stage-footer">
          <div className="session-partner">
            <strong>{character.name}</strong>
            <span className={`live-status status-${status}`} aria-live="polite">{statusCopy[status]}</span>
          </div>
          <div className="session-control-dock">
            <div className="mic-meter" aria-label={`Microphone level ${Math.round(micLevel * 100)} percent`}>
              <span style={{ width: `${Math.max(liveLesson ? 3 : 0, micLevel * 100)}%` }} />
            </div>
            <button
              type="button"
              className={liveLesson ? 'button stop-conversation' : 'button primary'}
              onClick={liveLesson ? () => void finishAndReview() : () => void startLive()}
              disabled={connecting}
            >
              {connecting ? 'Getting ready…' : liveLesson ? (lessonComplete ? 'Finish & review' : 'Pause & review') : error ? 'Try again' : replaying.current ? 'Practise again' : 'Start lesson'}
            </button>
          </div>
        </div>
      </div>

      <aside className="conversation-sidebar lesson-sidebar">
        <div className="conversation-sidebar-heading">
          <p className="eyebrow">Live lesson · Step {beatIndex + 1} of {lesson.beats.length}</p>
          <h2>{currentBeat?.title ?? lesson.title}</h2>
          <p>{lesson.purpose}</p>
        </div>

        <div className="lesson-language-focus">
          <small>Today’s language</small>
          {lesson.languageFocus.map((focus) => <span key={focus}>{focus}</span>)}
        </div>

        {error ? <div className="live-error" role="alert">{error}</div> : null}

        <div className="transcript-stack" aria-live="polite">
          <article className="transcript-card user-transcript">
            <small>You</small>
            <p>{inputTranscript || 'Your spoken answer will appear here once the lesson starts.'}</p>
          </article>
          <article className="transcript-card partner-transcript">
            <small>{character.name}</small>
            <p>{outputTranscript || `${character.name} is ready to teach this with you live.`}</p>
          </article>
        </div>

        <details className="session-tech-details">
          <summary>Session details</summary>
          <span>Lesson: {lesson.id}</span>
          <span>Progress: {completedBeats}/{lesson.beats.length} beats completed</span>
          <span>Stage: {stageState.mode}</span>
          <span>Performance: {performanceLabel}</span>
        </details>
      </aside>
    </section>
  );
}
