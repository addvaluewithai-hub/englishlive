import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MicrophonePcmStream } from '../audio/MicrophonePcmStream';
import { PcmPlaybackQueue } from '../audio/PcmPlaybackQueue';
import { CharacterHost, type CharacterHostHandle } from '../character/CharacterHost';
import { CharacterPerformanceController } from '../character/CharacterPerformanceController';
import { OttiMark } from '../character/otti/OttiMark';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { loadPublishedCharacter } from '../content/client';
import { GeminiLiveTransport } from '../live/GeminiLiveTransport';
import type { LiveStatus } from '../live/types';
import { PracticeHintCard } from '../practice/PracticeHintCard';
import { practiceMissionContractBySlug } from '../practice/missions/catalog';
import { usePracticeMissionRuntime } from '../practice/runtime';
import { speakingAssets } from '../speaking/assets';

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

function timeLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remaining = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remaining}`;
}

const statusCopy: Record<LiveStatus, { title: string; body: string }> = {
  idle: { title: 'جاهز؟', body: 'الموقف هيبدأ حالًا' },
  connecting: { title: 'بنجهز الكافيه', body: 'ثواني ونبدأ' },
  listening: { title: 'دورك', body: 'قولها بطريقتك — والـHint موجود لو احتجته' },
  speaking: { title: 'Otti بيتكلم', body: 'اسمع أو قاطعه لو حابب ترد' },
  reconnecting: { title: 'بنرجّع الاتصال', body: 'ثواني ونكمل' },
  error: { title: 'الاتصال وقف', body: 'جرّب تبدأ تاني' },
};

export function PracticeLiveScreen() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const mission = practiceMissionContractBySlug(missionId);
  const runtime = usePracticeMissionRuntime(missionId);
  const character = getCharacterDefinition('otti');
  const visualQa = import.meta.env.VITE_VISUAL_QA === '1';

  const host = useRef<CharacterHostHandle | null>(null);
  const transport = useRef<GeminiLiveTransport | null>(null);
  const microphone = useRef<MicrophonePcmStream | null>(null);
  const playback = useRef<PcmPlaybackQueue | null>(null);
  const performer = useRef<CharacterPerformanceController | null>(null);
  const startedAtMs = useRef<number | null>(null);
  const manualInterrupt = useRef(false);
  const teacherDraftRef = useRef('');
  const learnerDraftRef = useRef('');
  const hintTimeoutRef = useRef<number | null>(null);

  const [status, setStatus] = useState<LiveStatus>('idle');
  const [micOpen, setMicOpen] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [teacherText, setTeacherText] = useState('');
  const [learnerDraft, setLearnerDraft] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function durationSeconds() {
    return startedAtMs.current ? Math.max(0, Math.round((Date.now() - startedAtMs.current) / 1_000)) : 0;
  }

  function setLearnerMicEnabled(enabled: boolean) {
    microphone.current?.setEnabled(enabled);
    setMicOpen(enabled);
    if (!enabled) setMicLevel(0);
  }

  function clearHintTimeout() {
    if (hintTimeoutRef.current === null) return;
    window.clearTimeout(hintTimeoutRef.current);
    hintTimeoutRef.current = null;
  }

  async function stopTransport() {
    clearHintTimeout();
    transport.current?.endAudioStream();
    transport.current?.close();
    transport.current = null;
    await microphone.current?.stop();
    microphone.current = null;
    await playback.current?.close();
    playback.current = null;
    performer.current?.close();
    performer.current = null;
    manualInterrupt.current = false;
    setMicOpen(false);
    setMicLevel(0);
  }

  async function finishMission(completed: boolean) {
    if (ending || !mission) return;
    setEnding(true);
    const support = runtime.getSupportSummary();
    await stopTransport();
    if (completed) {
      navigate(`/practice/complete/${mission.slug}`, { replace: true, state: { support, durationSeconds: durationSeconds() } });
    } else {
      navigate(`/practice/mission/${mission.slug}`, { replace: true });
    }
  }

  async function startLive() {
    if (!mission || visualQa || transport.current || status === 'connecting' || status === 'reconnecting') return;
    setStatus('connecting');
    setError(null);
    setEnding(false);
    setMicOpen(false);
    teacherDraftRef.current = '';
    learnerDraftRef.current = '';
    setTeacherText('');
    setLearnerDraft('');
    runtime.reset();

    try {
      const publishedCharacter = await loadPublishedCharacter(character);
      const characterConfig = publishedCharacter.content;
      const characterPerformance = new CharacterPerformanceController(() => host.current);
      performer.current = characterPerformance;

      const queue = new PcmPlaybackQueue({
        onMouthPose: (pose) => characterPerformance.setMouth(pose),
        onSpeechStart: () => {
          learnerDraftRef.current = '';
          setLearnerDraft('');
          setLearnerMicEnabled(false);
          setStatus('speaking');
          characterPerformance.speechStart();
        },
        onSpeechEnd: () => {
          setLearnerMicEnabled(true);
          setStatus((current) => current === 'idle' || current === 'error' ? current : 'listening');
          characterPerformance.speechEnd();
        },
        onTurnComplete: () => undefined,
      });
      playback.current = queue;

      const live = new GeminiLiveTransport({
        onStatus: setStatus,
        onInputTranscript: (text) => {
          const next = appendTranscript(learnerDraftRef.current, text);
          learnerDraftRef.current = next;
          setLearnerDraft(next);
        },
        onOutputTranscript: (text) => {
          if (manualInterrupt.current) return;
          runtime.noteTeacherOutput();
          setLearnerMicEnabled(false);
          queue.pushTranscript(text);
          const next = appendTranscript(teacherDraftRef.current, text);
          teacherDraftRef.current = next;
          setTeacherText(next);
        },
        onAudio: (data, mimeType) => {
          if (manualInterrupt.current) return;
          setLearnerMicEnabled(false);
          void queue.enqueue(data, pcmSampleRate(mimeType));
        },
        onPerformanceCue: (cue) => characterPerformance.applyCue(cue),
        onPerformanceCancelled: () => characterPerformance.cancelCue(),
        onInterrupted: () => {
          manualInterrupt.current = false;
          queue.interrupt();
          characterPerformance.interrupt();
          setLearnerMicEnabled(true);
          setStatus('listening');
        },
        onTurnComplete: () => {
          manualInterrupt.current = false;
          queue.markTurnComplete();
          teacherDraftRef.current = '';
          if (runtime.consumeAutoFinishAfterTurn()) {
            window.setTimeout(() => void finishMission(true), 500);
          }
        },
        onError: (message) => setError(message),
      }, runtime.tools);
      transport.current = live;

      const mic = new MicrophonePcmStream();
      mic.setEnabled(false);
      microphone.current = mic;

      const prompt = [
        `You are Otti, acting as ${mission.aiRoleAr} in a small real-life English roleplay.`,
        `Learner role: ${mission.learnerRoleAr}. Practical goal: ${mission.goalAr}`,
        runtime.promptEn,
        'This is A1. Use short, clear English and one idea at a time. Give the learner enough silence to think.',
        'Conversation comes first. Stay in role. Do not narrate the lesson, mention beats, hints, tools, scoring or progress.',
        'A UI PRACTICE HINT REQUEST is a private control event, never learner speech and never evidence that the learner attempted an answer.',
        'When that event arrives, do not talk. Call provide_practice_hint_bundle exactly once and put the Arabic intent, contextual note if useful, useful English chunks and a complete example response in that one tool call. Then end silently.',
        'The generated full response is only help for that exact conversational moment. Never treat a different correct sentence as wrong because it differs from the example.',
        'When there is a genuine current-target error, correct it briefly, give the natural form, and let the learner try again before moving on.',
        'Do not overpraise. React like a normal friendly cashier and keep turns brief.',
      ].join('\n\n');

      await queue.unlock();
      await live.connect(prompt, { voiceName: characterConfig.voiceName ?? undefined });
      startedAtMs.current = Date.now();
      setElapsedSeconds(0);
      await mic.start((chunk) => live.sendAudio(chunk), setMicLevel);
      live.sendText(mission.openingMoveEn);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'تعذر بدء الـMission.';
      setError(message);
      setStatus('error');
      await stopTransport();
    }
  }

  useEffect(() => {
    if (!mission) return;
    if (visualQa) {
      runtime.reset();
      setTeacherText('Hi! What can I get for you?');
      setStatus('listening');
      setMicOpen(true);
      setElapsedSeconds(18);
      return;
    }

    const startTimer = window.setTimeout(() => void startLive(), 0);
    const clock = window.setInterval(() => setElapsedSeconds(durationSeconds()), 1000);
    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(clock);
      clearHintTimeout();
      transport.current?.close();
      void microphone.current?.stop();
      void playback.current?.close();
      performer.current?.close();
    };
    // One route instance owns one authored mission session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === 'connecting' || status === 'reconnecting') performer.current?.thinking();
    else if (status === 'listening') performer.current?.listening();
    else if (status === 'idle' || status === 'error') host.current?.setMode('idle');
  }, [status]);

  useEffect(() => {
    if (!runtime.hintLoading) clearHintTimeout();
  }, [runtime.hintLoading]);

  function interruptTeacher() {
    const live = transport.current;
    if (status !== 'speaking' || !live?.connected) return;
    manualInterrupt.current = true;
    playback.current?.interrupt();
    performer.current?.interrupt();
    setLearnerMicEnabled(true);
    setStatus('listening');
  }

  function handleMicAction() {
    if (visualQa) return;
    if (status === 'speaking') {
      interruptTeacher();
      return;
    }
    if (status === 'idle' || status === 'error') void startLive();
  }

  function requestContextualHint() {
    if (visualQa) return;
    const live = transport.current;
    const beat = runtime.activeBeat;
    if (!live?.connected || status !== 'listening' || !micOpen || !beat || beat.type === 'ending') return;
    if (!runtime.beginHintRequest()) return;

    clearHintTimeout();
    live.sendText([
      'UI PRACTICE HINT REQUEST — private control event, NOT learner speech, NOT an answer attempt.',
      `Current authored beat: ${beat.id}.`,
      `Current learner intent: ${beat.learnerIntentEn}`,
      'Use the ENTIRE conversation context up to this moment, including any detour, clarification, unavailable option or correction that just happened.',
      'Call provide_practice_hint_bundle exactly once. Fill ALL layers in that single tool call: contextual Egyptian-Arabic intent, optional context/recovery note, useful English chunks, and one complete natural learner response that works right now.',
      'Keep the support appropriate to this mission level and scenario truth. The full response is an example, not a required sentence.',
      'Do not speak, do not advance the beat, do not answer on the learner behalf outside the tool call, and after the tool result end the turn silently.',
    ].join('\n'));
    hintTimeoutRef.current = window.setTimeout(() => {
      runtime.failHintRequest('Otti اتأخر في تجهيز الـHint. جرّب تاني.');
      hintTimeoutRef.current = null;
    }, 8_000);
  }

  function submitText(event: FormEvent) {
    event.preventDefault();
    const value = typedText.trim();
    if (!value) return;
    if (visualQa) {
      setTypedText('');
      setKeyboardOpen(false);
      return;
    }
    const live = transport.current;
    if (!live?.connected || status !== 'listening' || !micOpen) return;
    live.sendText(value);
    setTypedText('');
    setKeyboardOpen(false);
  }

  if (!mission) {
    return (
      <section className="practice-mission-missing" dir="rtl">
        <h1>الـMission دي مش موجودة</h1>
        <button type="button" onClick={() => navigate('/practice')}>الرجوع لـPractice</button>
      </section>
    );
  }

  const connecting = status === 'connecting' || status === 'reconnecting';
  const teacherSpeaking = status === 'speaking';
  const learnerTurn = status === 'listening' && micOpen;
  const statusText = statusCopy[status];

  return (
    <section className="fs-live sp-scenario-live practice-live" dir="rtl">
      <header className="fs-live-header sp-scenario-live-header">
        <button type="button" className="fs-live-close" onClick={() => void finishMission(false)} aria-label="إنهاء التدريب" disabled={ending}>
          <ProductIcon name="close" size={28} />
        </button>
        <div className="fs-live-brand" aria-label="Englotti">
          <OttiMark />
          <strong>Practice</strong>
        </div>
        <strong className="fs-live-title">{mission.level} • {mission.titleAr}</strong>
        <span className="fs-live-mode sp-scenario-timer">◷ {timeLabel(elapsedSeconds)}</span>
      </header>

      <div
        className="fs-live-stage sp-scenario-stage practice-live-stage"
        style={{ backgroundImage: `linear-gradient(180deg, rgba(255,247,243,.08), rgba(255,250,247,.74) 72%, #fffdfc 100%), url(${speakingAssets.foodOut})` }}
      >
        {teacherText ? (
          <article className="sp-otti-transcript" aria-live="polite">
            <small><bdi dir="ltr">Otti</bdi> • {mission.aiRoleAr}</small>
            <p dir="auto">{teacherText}</p>
          </article>
        ) : null}

        <div className="fs-live-character sp-scenario-character">
          <CharacterHost ref={host} character={character} className="fs-live-character-host" />
        </div>

        <div className={`fs-live-status status-${status}${learnerTurn ? ' is-open' : ''}`} aria-live="polite">
          <span className="fs-live-wave" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>{statusText.title}</strong><small>{statusText.body}</small></span>
        </div>

        {learnerDraft ? <p className="practice-live-heard" dir="auto">سمعتك: {learnerDraft}</p> : null}
      </div>

      <div className="fs-live-controls practice-live-controls">
        <PracticeHintCard runtime={runtime} learnerTurn={learnerTurn} onRequestHint={requestContextualHint} />

        {keyboardOpen ? (
          <form className="fs-type-row" onSubmit={submitText}>
            <input
              dir="ltr"
              value={typedText}
              onChange={(event) => setTypedText(event.target.value)}
              placeholder="Type what you want to say…"
              autoFocus
            />
            <button type="submit" disabled={!typedText.trim() || !learnerTurn}>إرسال</button>
          </form>
        ) : null}

        <div className="fs-control-row practice-live-control-row">
          <span className="practice-live-side-label">Hint ذكية</span>

          <button
            type="button"
            className={`fs-mic-control${learnerTurn ? ' is-live' : ''}${teacherSpeaking ? ' is-interrupt' : ''}`}
            onClick={handleMicAction}
            disabled={connecting || ending || (status === 'listening' && !teacherSpeaking)}
            aria-label={teacherSpeaking ? 'قاطع Otti واتكلم' : learnerTurn ? 'دورك تتكلم' : 'ابدأ التدريب'}
          >
            {teacherSpeaking ? (
              <><span className="fs-interrupt-bars" aria-hidden="true"><i /><i /></span><small>مقاطعة</small></>
            ) : (
              <><ProductIcon name="speak" size={54} /><small>{learnerTurn ? 'دورك' : status === 'error' ? 'جرّب تاني' : 'استنى'}</small></>
            )}
          </button>

          <button
            type="button"
            className="fs-keyboard-control"
            onClick={() => setKeyboardOpen((value) => !value)}
            disabled={!learnerTurn}
            aria-label="اكتب بدل الكلام"
          >
            <ProductIcon name="keyboard" size={31} />
          </button>
        </div>

        <div className="fs-mic-meter" aria-hidden="true"><span style={{ width: `${Math.max(learnerTurn ? 3 : 0, micLevel * 100)}%` }} /></div>
        {error ? <p className="fs-live-error" role="alert">{error}</p> : null}
      </div>

      {ending ? (
        <div className="fs-ending-overlay" aria-live="polite">
          <div>
            <OttiMark />
            <strong>بنقفل الـMission…</strong>
            <span><i /><i /><i /></span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
