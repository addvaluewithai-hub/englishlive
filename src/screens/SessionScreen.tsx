import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { MicrophonePcmStream } from '../audio/MicrophonePcmStream';
import { PcmPlaybackQueue } from '../audio/PcmPlaybackQueue';
import { CharacterHost, type CharacterHostHandle } from '../character/CharacterHost';
import { CharacterPerformanceController } from '../character/CharacterPerformanceController';
import { getCharacterDefinition } from '../character/registry';
import { ConversationBoard } from '../components/ConversationBoard';
import { GeminiLiveTransport } from '../live/GeminiLiveTransport';
import type { LiveStatus } from '../live/types';
import { ConversationPresentation } from '../presentation/ConversationPresentation';
import { StageDirector } from '../presentation/StageDirector';
import { initialStageState, type StageState } from '../presentation/types';
import {
  comfortLabel,
  goalPrompt,
  nextConversationForGoal,
  readLearnerProfile,
} from '../product/profile';
import { ConversationTutorRuntime } from '../tutor/ConversationTutorRuntime';
import { createFoundationDemoMission } from '../tutor/demoMission';
import type { ConversationMissionState } from '../tutor/types';

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
  speaking: 'Speaking',
  reconnecting: 'Reconnecting',
  error: 'Try again',
};

export function SessionScreen() {
  const { missionId = 'foundation-demo' } = useParams();
  const [params] = useSearchParams();
  const character = getCharacterDefinition(params.get('character'));
  const profile = readLearnerProfile();
  const conversationFocus = nextConversationForGoal(profile?.goals[0]);
  const missionDefinition = createFoundationDemoMission(
    conversationFocus.title,
    conversationFocus.description,
  );
  const firstConversation = params.get('onboarding') === '1';

  const host = useRef<CharacterHostHandle | null>(null);
  const transport = useRef<GeminiLiveTransport | null>(null);
  const microphone = useRef<MicrophonePcmStream | null>(null);
  const playback = useRef<PcmPlaybackQueue | null>(null);
  const performer = useRef<CharacterPerformanceController | null>(null);
  const tutor = useRef<ConversationTutorRuntime | null>(null);
  const stageDirector = useRef<StageDirector | null>(null);

  const [status, setStatus] = useState<LiveStatus>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [performanceLabel, setPerformanceLabel] = useState('audio-driven locally');
  const [missionState, setMissionState] = useState<ConversationMissionState | null>(null);
  const [stageState, setStageState] = useState<StageState>(initialStageState);
  const [startedOnce, setStartedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
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
    setError(null);
    setInputTranscript('');
    setOutputTranscript('');
    setPerformanceLabel('audio-driven locally');
    setStageState(initialStageState);

    const tutorRuntime = new ConversationTutorRuntime(missionDefinition, {
      onStateChange: setMissionState,
    });
    tutor.current = tutorRuntime;
    setMissionState(tutorRuntime.snapshot);

    const director = new StageDirector(setStageState);
    stageDirector.current = director;
    setStageState(director.snapshot);
    const presentation = new ConversationPresentation(
      director,
      () => tutorRuntime.currentObjective,
    );

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
        tutorRuntime.markPartnerTurnComplete();
      },
    });
    playback.current = queue;

    const live = new GeminiLiveTransport(
      {
        onStatus: setStatus,
        onInputTranscript: (text) => {
          tutorRuntime.recordAutomaticTranscript(text);
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
          characterPerformance.interrupt();
          setPerformanceLabel('audio-driven locally');
        },
        onTurnComplete: () => queue.markTurnComplete(),
        onError: setError,
      },
      [...tutorRuntime.tools, presentation.tool],
    );
    transport.current = live;

    const mic = new MicrophonePcmStream();
    microphone.current = mic;

    const learnerContext = profile
      ? `The learner's first name is ${profile.firstName || 'not provided'}. Their main reason for speaking practice is to ${goalPrompt(profile.goals[0] ?? 'everyday')}. Their self-description is: ${comfortLabel(profile.comfort)} Treat these as private context for pacing and topic choice; never recite these labels back to them.`
      : 'No learner profile is available yet. Start with an easy everyday topic and calibrate from the conversation itself.';

    const characterPrompt = `You are ${character.name}, ${character.persona.style}. Stay in character as a natural English conversation partner for an adult learner. Speak only English unless the learner explicitly asks for a brief clarification. Keep spoken turns concise enough to invite the learner back in. Do not lecture. Allow interruptions. Correct selectively and naturally.`;

    try {
      await queue.unlock();
      await live.connect(
        `${characterPrompt}\n\n${learnerContext}\n\n${tutorRuntime.systemPrompt}`,
      );
      await mic.start(
        (chunk) => live.sendAudio(chunk),
        (level) => {
          setMicLevel(level);
          tutorRuntime.recordLearnerAudioLevel(level);
        },
      );
      setStartedOnce(true);
      live.sendText(
        `${firstConversation
          ? 'This is the learner’s first EnglishLive conversation. Greet them warmly and use their first name if it was provided.'
          : `The visible conversation focus is: ${conversationFocus.title}.`
        } Before speaking, call get_mission_state. Then follow this opening brief: ${missionDefinition.openingPrompt}`,
      );
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not start the live conversation.';
      setError(message);
      setStatus('error');
      director.reset();
      live.close();
      await mic.stop();
      await queue.close();
      characterPerformance.close();
    }
  }

  async function stopLive() {
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
    setMicLevel(0);
    setPerformanceLabel('audio-driven locally');
    setStatus('idle');
  }

  const connecting = status === 'connecting' || status === 'reconnecting';
  const liveConversation = status === 'listening' || status === 'speaking';
  const metObjectives = missionState
    ? Object.values(missionState.objectives).filter((objective) => objective.status === 'met').length
    : 0;
  const missionComplete = Boolean(missionState?.completedAt);

  return (
    <section className="session-screen">
      <div className="session-stage" style={{ '--character-accent': character.accent } as CSSProperties}>
        <div className="session-stage-meta">
          <span>{firstConversation ? 'First conversation' : 'Today’s conversation'}</span>
          <strong>{conversationFocus.title}</strong>
        </div>

        <div className={`session-stage-body stage-mode-${stageState.mode}`}>
          {stageState.board ? (
            <div className="session-board-surface" aria-live="polite">
              <ConversationBoard board={stageState.board} />
            </div>
          ) : null}
          <CharacterHost
            ref={host}
            character={character}
            className="session-character-host"
          />
        </div>

        <div className="session-stage-footer">
          <div className="session-partner">
            <strong>{character.name}</strong>
            <span className={`live-status status-${status}`} aria-live="polite">{statusCopy[status]}</span>
          </div>

          <div className="session-control-dock">
            <div className="mic-meter" aria-label={`Microphone level ${Math.round(micLevel * 100)} percent`}>
              <span style={{ width: `${Math.max(liveConversation ? 3 : 0, micLevel * 100)}%` }} />
            </div>
            <button
              type="button"
              className={liveConversation ? 'button stop-conversation' : 'button primary'}
              onClick={liveConversation ? () => void stopLive() : () => void startLive()}
              disabled={connecting}
            >
              {connecting ? 'Getting ready…' : liveConversation ? 'End conversation' : error ? 'Try again' : 'Start conversation'}
            </button>
          </div>
        </div>
      </div>

      <aside className="conversation-sidebar">
        <div className="conversation-sidebar-heading">
          <p className="eyebrow">Live conversation</p>
          <h2>Do not prepare the sentence.</h2>
          <p>Say the version you have. You can repair it while you speak.</p>
        </div>

        {error ? <div className="live-error" role="alert">{error}</div> : null}

        <div className="transcript-stack" aria-live="polite">
          <article className="transcript-card user-transcript">
            <small>You</small>
            <p>{inputTranscript || 'Your words will appear here once the conversation starts.'}</p>
          </article>
          <article className="transcript-card partner-transcript">
            <small>{character.name}</small>
            <p>{outputTranscript || `${character.name} is ready when you are.`}</p>
          </article>
        </div>

        {startedOnce && status === 'idle' ? (
          <div className="session-next-step">
            <strong>{missionComplete ? 'Practice complete.' : firstConversation ? 'First conversation done.' : 'Conversation ended.'}</strong>
            <p>{missionComplete ? 'You covered every goal in this practice.' : 'You can come back and continue from another conversation.'}</p>
            <Link className="text-link" to="/home">Back to my plan →</Link>
          </div>
        ) : null}

        <details className="session-tech-details">
          <summary>Session details</summary>
          <span>Route mission: {missionId}</span>
          <span>Runtime: {missionState ? `${metObjectives}/${missionDefinition.objectives.length} objectives evidenced` : 'not started'}</span>
          <span>Stage: {stageState.mode}</span>
          <span>Performance: {performanceLabel}</span>
        </details>
      </aside>
    </section>
  );
}
