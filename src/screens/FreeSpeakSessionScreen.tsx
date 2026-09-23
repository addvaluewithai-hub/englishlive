import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { MicrophonePcmStream } from '../audio/MicrophonePcmStream';
import { PcmPlaybackQueue } from '../audio/PcmPlaybackQueue';
import { CharacterHost, type CharacterHostHandle } from '../character/CharacterHost';
import { CharacterPerformanceController } from '../character/CharacterPerformanceController';
import { getCharacterDefinition } from '../character/registry';
import { getFreeSpeakMode } from '../freeSpeak/modes';
import { GeminiLiveTransport } from '../live/GeminiLiveTransport';
import type { LiveStatus } from '../live/types';
import { buildRelationshipPrompt } from '../memory/context';
import { RelationshipMemoryCollector } from '../memory/RelationshipMemoryCollector';
import { keepRelationshipMemory, readEnglishLiveMemory } from '../memory/store';
import type { RelationshipMemoryProposal } from '../memory/types';
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
  speaking: 'Speaking',
  reconnecting: 'Reconnecting',
  error: 'Try again',
};

export function FreeSpeakSessionScreen() {
  const { modeId } = useParams();
  const [params] = useSearchParams();
  const profile = readLearnerProfile();
  const character = getCharacterDefinition(params.get('character') ?? profile?.characterId);
  const mode = getFreeSpeakMode(modeId);

  const host = useRef<CharacterHostHandle | null>(null);
  const transport = useRef<GeminiLiveTransport | null>(null);
  const microphone = useRef<MicrophonePcmStream | null>(null);
  const playback = useRef<PcmPlaybackQueue | null>(null);
  const performer = useRef<CharacterPerformanceController | null>(null);
  const relationshipCollector = useRef<RelationshipMemoryCollector | null>(null);

  const [status, setStatus] = useState<LiveStatus>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [relationshipProposal, setRelationshipProposal] = useState<RelationshipMemoryProposal | null>(null);
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
    setRelationshipProposal(null);
    setPerformanceLabel('audio-driven locally');

    const memoryCollector = new RelationshipMemoryCollector(setRelationshipProposal);
    relationshipCollector.current = memoryCollector;
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
      onTurnComplete: () => undefined,
    });
    playback.current = queue;

    const live = new GeminiLiveTransport(
      {
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
      },
      [memoryCollector.tool],
    );
    transport.current = live;

    const mic = new MicrophonePcmStream();
    microphone.current = mic;
    const learnerContext = profile
      ? `The learner's first name is ${profile.firstName || 'not provided'}. Their main reason for English is to ${goalPrompt(profile.goals[0] ?? 'everyday')}. Their self-description is: ${comfortLabel(profile.comfort)} Use this only to pace the conversation naturally.`
      : 'No learner profile is available. Keep the conversation on familiar, accessible topics.';
    const relationshipContext = buildRelationshipPrompt(readEnglishLiveMemory(), character.id);
    const freeSpeakPrompt = `FREE SPEAK MODE\nThis is intentionally outside the structured course. Do not call lesson or mission assessment tools, do not claim course progress, and do not give a numeric proficiency score. ${mode.prompt} Correct selectively only when it helps the conversation or the learner asks. Keep your turns concise enough to give the learner plenty of speaking time.`;
    const characterPrompt = `You are ${character.name}, ${character.persona.style}. Be a natural adult English conversation partner. Speak English by default; if the learner explicitly asks for a brief Arabic clarification, clarify briefly and return to English. Allow interruption and respond to meaning rather than sounding like an assistant.`;

    try {
      await queue.unlock();
      await live.connect(`${characterPrompt}\n\n${learnerContext}\n\n${relationshipContext}\n\n${memoryCollector.systemPrompt}\n\n${freeSpeakPrompt}`);
      await mic.start((chunk) => live.sendAudio(chunk), setMicLevel);
      setStartedOnce(true);
      live.sendText(`Start ${mode.title} naturally. Greet the learner briefly and open with one genuine conversational move. Do not explain the mode.`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not start Free Speak.';
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
    setStatus('idle');
  }

  function keepProposal() {
    if (!relationshipProposal) return;
    keepRelationshipMemory(relationshipProposal, `free-speak:${mode.id}`, character.id);
    relationshipCollector.current?.clear();
    setRelationshipProposal(null);
  }

  const connecting = status === 'connecting' || status === 'reconnecting';
  const liveConversation = status === 'listening' || status === 'speaking';

  return (
    <section className="session-screen free-speak-session">
      <div className="session-stage" style={{ '--character-accent': character.accent } as CSSProperties}>
        <div className="session-stage-meta">
          <span>Free Speak · no course progress</span>
          <strong>{mode.title}</strong>
        </div>
        <div className="session-stage-body">
          <CharacterHost ref={host} character={character} className="session-character-host" />
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
              {connecting ? 'Getting ready…' : liveConversation ? 'End conversation' : error ? 'Try again' : 'Start Free Speak'}
            </button>
          </div>
        </div>
      </div>

      <aside className="conversation-sidebar">
        <div className="conversation-sidebar-heading">
          <p className="eyebrow">Free Speak</p>
          <h2>{mode.title}</h2>
          <p>{mode.description}</p>
        </div>
        {error ? <div className="live-error" role="alert">{error}</div> : null}
        <div className="transcript-stack" aria-live="polite">
          <article className="transcript-card user-transcript"><small>You</small><p>{inputTranscript || 'Your words will appear here once you start speaking.'}</p></article>
          <article className="transcript-card partner-transcript"><small>{character.name}</small><p>{outputTranscript || `${character.name} is ready when you are.`}</p></article>
        </div>

        {startedOnce && status === 'idle' ? (
          <div className="session-next-step">
            <strong>Free Speak ended.</strong>
            <p>Your structured course progress did not change.</p>
            {relationshipProposal ? (
              <div className="memory-consent-card">
                <strong>Remember this with {character.name} for next time?</strong>
                <p>{relationshipProposal.text}</p>
                <div className="actions">
                  <button type="button" className="button primary" onClick={keepProposal}>Keep</button>
                  <button type="button" className="button quiet" onClick={() => setRelationshipProposal(null)}>Not now</button>
                </div>
              </div>
            ) : null}
            <div className="actions"><Link className="button quiet" to="/speak">Another Free Speak</Link><Link className="text-link" to="/learn">Back to Learn →</Link></div>
          </div>
        ) : null}

        <details className="session-tech-details">
          <summary>Session details</summary>
          <span>Mode: {mode.id}</span>
          <span>Course writes: disabled</span>
          <span>Performance: {performanceLabel}</span>
        </details>
      </aside>
    </section>
  );
}
