import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { MicrophonePcmStream } from '../audio/MicrophonePcmStream';
import { PcmPlaybackQueue } from '../audio/PcmPlaybackQueue';
import { CharacterHost, type CharacterHostHandle } from '../character/CharacterHost';
import { CharacterPerformanceController } from '../character/CharacterPerformanceController';
import { getCharacterDefinition } from '../character/registry';
import { GeminiLiveTransport } from '../live/GeminiLiveTransport';
import type { LiveStatus } from '../live/types';
import {
  comfortLabel,
  goalPrompt,
  nextConversationForGoal,
  readLearnerProfile,
} from '../product/profile';

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
  const mission = nextConversationForGoal(profile?.goals[0]);
  const firstConversation = params.get('onboarding') === '1';
  const host = useRef<CharacterHostHandle | null>(null);
  const transport = useRef<GeminiLiveTransport | null>(null);
  const microphone = useRef<MicrophonePcmStream | null>(null);
  const playback = useRef<PcmPlaybackQueue | null>(null);
  const performer = useRef<CharacterPerformanceController | null>(null);
  const [status, setStatus] = useState<LiveStatus>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [performanceLabel, setPerformanceLabel] = useState('audio-driven locally');
  const [startedOnce, setStartedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    });
    playback.current = queue;

    const live = new GeminiLiveTransport({
      onStatus: setStatus,
      onInputTranscript: (text) => setInputTranscript((current) => appendTranscript(current, text)),
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
    });
    transport.current = live;

    const mic = new MicrophonePcmStream();
    microphone.current = mic;

    const learnerContext = profile
      ? `The learner's first name is ${profile.firstName || 'not provided'}. Their main reason for speaking practice is to ${goalPrompt(profile.goals[0] ?? 'everyday')}. Their self-description is: ${comfortLabel(profile.comfort)} Treat these as private context for pacing and topic choice; never recite these labels back to them.`
      : 'No learner profile is available yet. Start with an easy everyday topic and calibrate from the conversation itself.';

    try {
      await queue.unlock();
      await live.connect(
        `You are ${character.name}, ${character.persona.style}. You are a natural English conversation partner for an adult learner around CEFR B1-B2. Speak only English unless the learner explicitly asks for a brief clarification. Keep replies conversational and usually short enough to invite the learner back in. Do not lecture. Ask natural follow-up questions, allow interruptions, and gently recast important mistakes without correcting every sentence. ${learnerContext}`,
      );
      await mic.start((chunk) => live.sendAudio(chunk), setMicLevel);
      setStartedOnce(true);
      live.sendText(
        firstConversation
          ? 'This is the learner’s first EnglishLive conversation. Greet them warmly, use their first name if it was provided, and ask one easy question connected to their goal. Do not explain the product or mention assessment.'
          : `Open naturally with one short question that can lead into this conversation focus: ${mission.title}.`,
      );
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not start the live conversation.';
      setError(message);
      setStatus('error');
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
    setMicLevel(0);
    setPerformanceLabel('audio-driven locally');
    setStatus('idle');
  }

  const connecting = status === 'connecting' || status === 'reconnecting';
  const liveConversation = status === 'listening' || status === 'speaking';

  return (
    <section className="session-screen">
      <div className="session-stage" style={{ '--character-accent': character.accent } as CSSProperties}>
        <div className="session-stage-meta">
          <span>{firstConversation ? 'First conversation' : 'Today’s conversation'}</span>
          <strong>{mission.title}</strong>
        </div>

        <CharacterHost ref={host} character={character} />

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
            <strong>{firstConversation ? 'First conversation done.' : 'Conversation ended.'}</strong>
            <p>Keep the momentum. Your next practice starts from the same profile.</p>
            <Link className="text-link" to="/home">Back to my plan →</Link>
          </div>
        ) : null}

        <details className="session-tech-details">
          <summary>Session details</summary>
          <span>Mission: {missionId}</span>
          <span>Performance: {performanceLabel}</span>
        </details>
      </aside>
    </section>
  );
}
