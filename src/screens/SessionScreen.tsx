import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MicrophonePcmStream } from '../audio/MicrophonePcmStream';
import { PcmPlaybackQueue } from '../audio/PcmPlaybackQueue';
import { CharacterHost, type CharacterHostHandle } from '../character/CharacterHost';
import { getCharacterDefinition } from '../character/registry';
import { GeminiLiveTransport } from '../live/GeminiLiveTransport';
import type { LiveStatus } from '../live/types';

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

export function SessionScreen() {
  const { missionId = 'foundation-demo' } = useParams();
  const [params] = useSearchParams();
  const character = getCharacterDefinition(params.get('character'));
  const host = useRef<CharacterHostHandle | null>(null);
  const transport = useRef<GeminiLiveTransport | null>(null);
  const microphone = useRef<MicrophonePcmStream | null>(null);
  const playback = useRef<PcmPlaybackQueue | null>(null);
  const [status, setStatus] = useState<LiveStatus>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      transport.current?.close();
      void microphone.current?.stop();
      void playback.current?.close();
      host.current?.cancel();
    };
  }, []);

  useEffect(() => {
    if (status === 'speaking') host.current?.setMode('speaking');
    else if (status === 'listening') host.current?.setMode('listening');
    else if (status === 'connecting' || status === 'reconnecting') host.current?.setMode('thinking');
    else host.current?.setMode('idle');
  }, [status, character.id]);

  async function startLive() {
    if (status !== 'idle' && status !== 'error') return;
    setError(null);
    setInputTranscript('');
    setOutputTranscript('');

    const queue = new PcmPlaybackQueue({
      onSpeechStart: () => {
        setStatus('speaking');
        host.current?.setMode('speaking');
      },
      onSpeechEnd: () => {
        host.current?.setMode('listening');
      },
    });
    playback.current = queue;

    const live = new GeminiLiveTransport({
      onStatus: setStatus,
      onInputTranscript: (text) => setInputTranscript((current) => appendTranscript(current, text)),
      onOutputTranscript: (text) => setOutputTranscript((current) => appendTranscript(current, text)),
      onAudio: (data, mimeType) => void queue.enqueue(data, pcmSampleRate(mimeType)),
      onInterrupted: () => {
        queue.interrupt();
        host.current?.cancel();
        host.current?.setMode('listening');
      },
      onTurnComplete: () => queue.markTurnComplete(),
      onError: setError,
    });
    transport.current = live;

    const mic = new MicrophonePcmStream();
    microphone.current = mic;

    try {
      // Unlock playback inside the user's click before token/network awaits.
      await queue.unlock();
      await live.connect(
        `You are ${character.name}, ${character.persona.style}. You are a natural English conversation partner for an adult learner around CEFR B1-B2. Speak only English unless the learner explicitly asks for a brief clarification. Keep replies conversational and usually short enough to invite the learner back in. Do not lecture. Ask natural follow-up questions, allow interruptions, and gently recast important mistakes without correcting every sentence.`,
      );
      await mic.start((chunk) => live.sendAudio(chunk), setMicLevel);
      live.sendText('Open the conversation naturally with one short, friendly greeting and an easy question.');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not start the live conversation.';
      setError(message);
      setStatus('error');
      live.close();
      await mic.stop();
      await queue.close();
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
    setMicLevel(0);
    host.current?.cancel();
    host.current?.setMode('idle');
    setStatus('idle');
  }

  const connecting = status === 'connecting' || status === 'reconnecting';
  const liveConversation = status === 'listening' || status === 'speaking';

  return (
    <section className="screen session-shell live-session">
      <div className="character-hero-stage" style={{ '--character-accent': character.accent } as CSSProperties}>
        <div className="stage-glow" aria-hidden="true" />
        <CharacterHost ref={host} character={character} />
        <div className="character-identity">
          <strong>{character.name}</strong>
          <span className={`live-status status-${status}`}>{status}</span>
        </div>
      </div>

      <aside className="character-lab-card live-control-card">
        <p className="eyebrow">Milestone 3 · Live Voice Core</p>
        <h2>{character.name}</h2>
        <p>{character.tagline}</p>

        <div className="mic-meter" aria-label={`Microphone level ${Math.round(micLevel * 100)} percent`}>
          <span style={{ width: `${Math.max(2, micLevel * 100)}%` }} />
        </div>

        <button
          type="button"
          className={liveConversation ? 'button secondary' : 'button primary'}
          onClick={liveConversation ? () => void stopLive() : () => void startLive()}
          disabled={connecting}
        >
          {connecting ? 'Connecting…' : liveConversation ? 'End conversation' : 'Start live conversation'}
        </button>

        {error ? <div className="live-error" role="alert">{error}</div> : null}

        <div className="transcript-card">
          <small>You</small>
          <p>{inputTranscript || 'Your transcript will appear here.'}</p>
        </div>
        <div className="transcript-card">
          <small>{character.name}</small>
          <p>{outputTranscript || 'The character transcript will appear here.'}</p>
        </div>

        <small className="runtime-note">
          Mission: {missionId}. This milestone proves live audio, interruption, transcription and session resumption. Curriculum control comes later.
        </small>
      </aside>
    </section>
  );
}
