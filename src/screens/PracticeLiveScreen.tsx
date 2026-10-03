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
import { useI18n } from '../i18n/LocaleProvider';
import { GeminiLiveTransport } from '../live/GeminiLiveTransport';
import type { LiveStatus } from '../live/types';
import { PracticeHintCard } from '../practice/PracticeHintCard';
import { practiceMissionContractBySlug } from '../practice/missions/catalog';
import { usePracticeMissionRuntime } from '../practice/runtime';
import { speakingAssets } from '../speaking/assets';
import { LiveConversationHeader, LiveConversationStatus } from '../ui/product/LiveConversationChrome';

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

function missionBackground(worldId: string) {
  switch (worldId) {
    case 'people-social':
      return speakingAssets.meetingPeople;
    case 'food-shopping':
      return speakingAssets.foodOut;
    case 'travel-transport':
      return speakingAssets.ottiTravel;
    case 'work-study':
      return speakingAssets.ottiProgress;
    case 'home-services':
      return speakingAssets.ottiReceptionist;
    case 'plans-leisure':
    case 'everyday':
    default:
      return speakingAssets.ottiHero;
  }
}

export function PracticeLiveScreen() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
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
        `Mission level is ${mission.level}. Keep wording, turn length, interaction complexity and support inside the authored level bounds. Give the learner enough silence to think.`,
        'Conversation comes first. Stay in the authored role. Do not narrate the lesson, mention beats, hints, tools, scoring or progress.',
        'A UI PRACTICE HINT REQUEST is a private control event, never learner speech and never evidence that the learner attempted an answer.',
        'When that event arrives, do not talk. Call provide_practice_hint_bundle exactly once, echo its request_id exactly, and put the Arabic intent, contextual note if useful, useful English chunks and a complete example response in that one tool call. Then end silently.',
        'The generated full response is only help for that exact conversational moment. Never treat a different correct sentence as wrong because it differs from the example.',
        'When there is a genuine current-target error, correct it briefly, give the natural form, and let the learner try again before moving on.',
        'Do not overpraise. React like the normal friendly real-world partner described by the authored mission and keep turns appropriate to its level.',
      ].join('\n\n');

      await queue.unlock();
      await live.connect(prompt, { voiceName: characterConfig.voiceName ?? undefined });
      startedAtMs.current = Date.now();
      setElapsedSeconds(0);
      await mic.start((chunk) => live.sendAudio(chunk), setMicLevel);
      live.sendText(mission.openingMoveEn);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : t('practice.startError');
      setError(message);
      setStatus('error');
      await stopTransport();
    }
  }

  useEffect(() => {
    if (!mission) return;
    if (visualQa) {
      runtime.reset();
      const visualOpening = mission.canonicalDialogue.find((turn) => turn.speaker === 'ai_role')?.text ?? 'Ready.';
      setTeacherText(visualOpening);
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
    const requestId = runtime.beginHintRequest();
    if (!requestId) return;

    clearHintTimeout();
    live.sendText([
      'UI PRACTICE HINT REQUEST — private control event, NOT learner speech, NOT an answer attempt.',
      `request_id: ${requestId}`,
      `Current authored beat: ${beat.id}.`,
      `Current learner intent: ${beat.learnerIntentEn}`,
      'Use the ENTIRE conversation context up to this moment, including any detour, clarification, unavailable option or correction that just happened.',
      'Call provide_practice_hint_bundle exactly once and echo the request_id exactly. Fill ALL layers in that single tool call: contextual Egyptian-Arabic intent, optional context/recovery note, useful English chunks, and one complete natural learner response that works right now.',
      'Keep the support appropriate to this mission level and scenario truth. The full response is an example, not a required sentence.',
      'Do not speak, do not advance the beat, do not answer on the learner behalf outside the tool call, and after the tool result end the turn silently.',
    ].join('\n'));
    hintTimeoutRef.current = window.setTimeout(() => {
      runtime.failHintRequest(t('practice.hintTimeout'));
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
      <section className="practice-mission-missing">
        <h1>{t('practice.missingTitle')}</h1>
        <button type="button" onClick={() => navigate('/practice')}>{t('practice.back')}</button>
      </section>
    );
  }

  const connecting = status === 'connecting' || status === 'reconnecting';
  const teacherSpeaking = status === 'speaking';
  const learnerTurn = status === 'listening' && micOpen;
  const statusText = {
    idle: { title: t('practice.status.idle.title'), body: t('practice.status.idle.body') },
    connecting: { title: t('practice.status.connecting.title'), body: t('practice.status.connecting.body') },
    listening: { title: t('practice.status.listening.title'), body: t('practice.status.listening.body') },
    speaking: { title: t('practice.status.speaking.title'), body: t('practice.status.speaking.body') },
    reconnecting: { title: t('practice.status.reconnecting.title'), body: t('practice.status.reconnecting.body') },
    error: { title: t('practice.status.error.title'), body: t('practice.status.error.body') },
  }[status];
  const stageBackground = missionBackground(mission.worldId);

  return (
    <section className="fs-live sp-scenario-live practice-live">
      <LiveConversationHeader
        title={(
          <>
            <bdi dir="ltr">{mission.level}</bdi>
            {' • '}
            <span lang="ar" dir="rtl">{mission.titleAr}</span>
          </>
        )}
        meta={<>◷ <bdi dir="ltr">{timeLabel(elapsedSeconds)}</bdi></>}
        onClose={() => void finishMission(false)}
        closeLabel={t('practice.leave')}
        disabled={ending}
        brandText={t('practice.headerTitle')}
        className="sp-scenario-live-header"
        metaClassName="fs-live-mode sp-scenario-timer"
      />

      <div
        className="fs-live-stage sp-scenario-stage practice-live-stage"
        style={{ backgroundImage: `linear-gradient(180deg, rgba(255,247,243,.08), rgba(255,250,247,.74) 72%, #fffdfc 100%), url(${stageBackground})` }}
      >
        {teacherText ? (
          <article className="sp-otti-transcript" aria-live="polite">
            <small><bdi dir="ltr">Otti</bdi> • <span lang="ar" dir="rtl">{mission.aiRoleAr}</span></small>
            <p dir="auto">{teacherText}</p>
          </article>
        ) : null}

        <div className="fs-live-character sp-scenario-character">
          <CharacterHost ref={host} character={character} className="fs-live-character-host" />
        </div>

        <LiveConversationStatus
          status={status}
          title={statusText.title}
          body={statusText.body}
          learnerTurn={learnerTurn}
        />

        {learnerDraft ? (
          <p className="practice-live-heard">
            <span>{t('practice.heardPrefix')}</span>{' '}
            <span dir="auto">{learnerDraft}</span>
          </p>
        ) : null}
      </div>

      <div className="fs-live-controls practice-live-controls">
        <PracticeHintCard runtime={runtime} learnerTurn={learnerTurn} onRequestHint={requestContextualHint} />

        {keyboardOpen ? (
          <form className="fs-type-row" onSubmit={submitText}>
            <input
              lang="en"
              dir="ltr"
              value={typedText}
              onChange={(event) => setTypedText(event.target.value)}
              placeholder={t('live.typePlaceholder')}
              autoFocus
            />
            <button type="submit" disabled={!typedText.trim() || !learnerTurn}>{t('live.send')}</button>
          </form>
        ) : null}

        <div className="fs-control-row practice-live-control-row">
          <span className="practice-live-side-label">{t('practice.smartHintSideLabel')}</span>

          <button
            type="button"
            className={`fs-mic-control${learnerTurn ? ' is-live' : ''}${teacherSpeaking ? ' is-interrupt' : ''}`}
            onClick={handleMicAction}
            disabled={connecting || ending || (status === 'listening' && !teacherSpeaking)}
            aria-label={teacherSpeaking ? t('live.interruptLabel') : learnerTurn ? t('live.yourTurnLabel') : t('practice.startLabel')}
          >
            {teacherSpeaking ? (
              <><span className="fs-interrupt-bars" aria-hidden="true"><i /><i /></span><small>{t('live.interrupt')}</small></>
            ) : (
              <><ProductIcon name="speak" size={54} /><small>{learnerTurn ? t('live.yourTurn') : status === 'error' ? t('live.tryAgain') : t('live.wait')}</small></>
            )}
          </button>

          <button
            type="button"
            className="fs-keyboard-control"
            onClick={() => setKeyboardOpen((value) => !value)}
            disabled={!learnerTurn}
            aria-label={t('live.typeInstead')}
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
            <strong>{t('practice.ending')}</strong>
            <span><i /><i /><i /></span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
