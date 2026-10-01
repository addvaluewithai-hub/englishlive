import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { speakingScenarioById } from '../speaking/catalog';
import { learnV2GuidedConversationByScenarioId } from '../speaking/learnV2Guided';
import type { SpeakingTurn, SpeakingTurnSpeaker } from '../speaking/types';

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

function turnId(speaker: SpeakingTurnSpeaker) {
  if (typeof crypto.randomUUID === 'function') return `${speaker}-${crypto.randomUUID()}`;
  return `${speaker}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const statusCopy: Record<LiveStatus, { title: string; body: string }> = {
  idle: { title: 'جاهز؟', body: 'هنتمرّن سوا خطوة بخطوة' },
  connecting: { title: 'بنجهز التدريب', body: 'ثواني وOtti هيبدأ' },
  listening: { title: 'دورك الآن', body: 'اقرأ الكارت بصوتك وغيّر اللي بين [ ]' },
  speaking: { title: 'Otti بيتكلم', body: 'اسمع الأول — الكارت هيظهر بعد ما يخلص' },
  reconnecting: { title: 'بنرجّع الاتصال', body: 'ثواني ونكمل' },
  error: { title: 'حصلت مشكلة بسيطة', body: 'جرّب تبدأ التدريب تاني' },
};

export function GuidedSpeakingLiveScreen() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const scenario = speakingScenarioById(scenarioId);
  const guided = learnV2GuidedConversationByScenarioId(scenarioId);
  const character = getCharacterDefinition('otti');

  const host = useRef<CharacterHostHandle | null>(null);
  const transport = useRef<GeminiLiveTransport | null>(null);
  const microphone = useRef<MicrophonePcmStream | null>(null);
  const playback = useRef<PcmPlaybackQueue | null>(null);
  const performer = useRef<CharacterPerformanceController | null>(null);
  const turnsRef = useRef<SpeakingTurn[]>([]);
  const learnerDraftRef = useRef('');
  const teacherDraftRef = useRef('');
  const exchangeRef = useRef<HTMLDivElement | null>(null);
  const guidedLearnerTurnsRef = useRef(0);
  const awaitingClosingRef = useRef(false);
  const finishAfterSpeechRef = useRef(false);

  const [status, setStatus] = useState<LiveStatus>('idle');
  const [micOpen, setMicOpen] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [turns, setTurns] = useState<SpeakingTurn[]>([]);
  const [learnerDraft, setLearnerDraft] = useState('');
  const [teacherDraft, setTeacherDraft] = useState('');
  const [teacherDisplayName, setTeacherDisplayName] = useState(character.name);
  const [completedLearnerTurns, setCompletedLearnerTurns] = useState(0);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setLearnerMicEnabled(enabled: boolean) {
    microphone.current?.setEnabled(enabled);
    setMicOpen(enabled);
    if (!enabled) setMicLevel(0);
  }

  function pushTurn(speaker: SpeakingTurnSpeaker, text: string) {
    const value = text.trim();
    if (!value) return;
    const previous = turnsRef.current.at(-1);
    if (previous?.speaker === speaker && previous.text === value) return;
    const turn: SpeakingTurn = { id: turnId(speaker), speaker, text: value, atMs: Date.now() };
    turnsRef.current = [...turnsRef.current, turn];
    setTurns(turnsRef.current);
  }

  function flushLearnerDraft() {
    const value = learnerDraftRef.current.trim();
    if (!value) return;
    learnerDraftRef.current = '';
    setLearnerDraft('');
    pushTurn('learner', value);
    const nextCount = guidedLearnerTurnsRef.current + 1;
    guidedLearnerTurnsRef.current = nextCount;
    setCompletedLearnerTurns(nextCount);
    if (guided && nextCount >= guided.steps.length) awaitingClosingRef.current = true;
  }

  function flushTeacherDraft() {
    const value = teacherDraftRef.current.trim();
    if (!value) return;
    teacherDraftRef.current = '';
    setTeacherDraft('');
    pushTurn('teacher', value);
  }

  async function stopTransport() {
    transport.current?.endAudioStream();
    transport.current?.close();
    transport.current = null;
    await microphone.current?.stop();
    microphone.current = null;
    await playback.current?.close();
    playback.current = null;
    performer.current?.close();
    performer.current = null;
    setMicOpen(false);
    setMicLevel(0);
  }

  async function finishGuided() {
    if (finished) return;
    await stopTransport();
    setFinished(true);
    setStatus('idle');
  }

  async function leaveGuided() {
    await stopTransport();
    navigate(scenario.returnPath || '/learn');
  }

  async function startLive() {
    if (!guided || transport.current || status === 'connecting' || status === 'reconnecting') return;
    setStatus('connecting');
    setError(null);
    setFinished(false);
    setMicOpen(false);
    turnsRef.current = [];
    setTurns([]);
    learnerDraftRef.current = '';
    teacherDraftRef.current = '';
    setLearnerDraft('');
    setTeacherDraft('');
    guidedLearnerTurnsRef.current = 0;
    setCompletedLearnerTurns(0);
    awaitingClosingRef.current = false;
    finishAfterSpeechRef.current = false;

    try {
      const publishedCharacter = await loadPublishedCharacter(character);
      const characterConfig = publishedCharacter.content;
      const teacherName = characterConfig.displayName?.trim() || character.name;
      setTeacherDisplayName(teacherName);

      const characterPerformance = new CharacterPerformanceController(() => host.current);
      performer.current = characterPerformance;

      const queue = new PcmPlaybackQueue({
        onMouthPose: (pose) => characterPerformance.setMouth(pose),
        onSpeechStart: () => {
          flushLearnerDraft();
          setLearnerMicEnabled(false);
          setStatus('speaking');
          characterPerformance.speechStart();
        },
        onSpeechEnd: () => {
          flushTeacherDraft();
          characterPerformance.speechEnd();
          if (finishAfterSpeechRef.current) {
            finishAfterSpeechRef.current = false;
            window.setTimeout(() => void finishGuided(), 250);
            return;
          }
          setLearnerMicEnabled(true);
          setStatus('listening');
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
          setLearnerMicEnabled(false);
          queue.pushTranscript(text);
          const next = appendTranscript(teacherDraftRef.current, text);
          teacherDraftRef.current = next;
          setTeacherDraft(next);
        },
        onAudio: (data, mimeType) => {
          setLearnerMicEnabled(false);
          void queue.enqueue(data, pcmSampleRate(mimeType));
        },
        onPerformanceCue: (cue) => characterPerformance.applyCue(cue),
        onPerformanceCancelled: () => characterPerformance.cancelCue(),
        onInterrupted: () => {
          queue.interrupt();
          characterPerformance.interrupt();
          setLearnerMicEnabled(true);
          setStatus('listening');
        },
        onTurnComplete: () => {
          flushTeacherDraft();
          queue.markTurnComplete();
          if (awaitingClosingRef.current) {
            awaitingClosingRef.current = false;
            finishAfterSpeechRef.current = true;
          }
        },
        onError: (message) => setError(message),
      });
      transport.current = live;

      const mic = new MicrophonePcmStream();
      mic.setEnabled(false);
      microphone.current = mic;

      const sequence = guided.steps.map((step, index) => [
        `STEP ${index + 1}`,
        `Partner intent: ${step.partnerIntentEn}`,
        `Stay very close to this partner line: “${step.partnerExampleEn}”`,
        `The learner's private on-screen card for this step is: “${step.learnerCardEn}”`,
      ].join('\n')).join('\n\n');

      const prompt = [
        `You are ${teacherName}, acting as ${scenario.aiRoleAr}.`,
        'This is a GUIDED REHEARSAL, not an assessment. The learner sees a private response card after each of your turns and may read it aloud.',
        'Follow the authored sequence below in order. Stay close to each partner line; small natural wording variation is fine, but do not add extra questions, side topics, teaching explanations or new requirements.',
        'After each partner line, STOP and give the learner the turn. Never say the learner card for them and never tell them what is written on their screen.',
        'Accept the learner reading the card, filling the bracketed placeholder with any real OR invented information, or giving a simple equivalent answer. Do not demand personal information.',
        'If the learner hesitates or makes a small mistake but the meaning is clear, keep the rehearsal moving. Only repair a genuine communication breakdown.',
        'Do not score, grade, evaluate, praise performance at length, or try to collect evidence. This round exists only to let the learner feel the conversation once with support.',
        'Speak in short, clear A1 turns at a calm natural pace. Do not fill an unfinished learner fragment.',
        sequence,
        `After the learner completes the final card, say only a short natural closing close to: “${guided.closingMoveEn}” Do not ask another question.`,
      ].join('\n\n');

      await queue.unlock();
      await live.connect(prompt, { voiceName: characterConfig.voiceName ?? undefined });
      await mic.start((chunk) => live.sendAudio(chunk), setMicLevel);
      live.sendText(`Start STEP 1 now. Stay very close to this line: “${guided.steps[0].partnerExampleEn}” Then stop and give the learner the turn.`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'تعذر بدء التدريب.';
      setError(message);
      setStatus('error');
      await stopTransport();
    }
  }

  useEffect(() => {
    if (!guided) return;
    const timer = window.setTimeout(() => void startLive(), 0);
    return () => {
      window.clearTimeout(timer);
      transport.current?.close();
      void microphone.current?.stop();
      void playback.current?.close();
      performer.current?.close();
    };
    // One guided live runtime per route entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const container = exchangeRef.current;
    if (!container) return;
    const frame = window.requestAnimationFrame(() => container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' }));
    return () => window.cancelAnimationFrame(frame);
  }, [turns, learnerDraft, teacherDraft, completedLearnerTurns]);

  if (!guided) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <h1>التدريب الموجّه مش متاح للموقف ده</h1>
        <Link className="v2-primary-button" to={`/speak/live/${scenario.id}?round=independent`}>ابدأ المحادثة</Link>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="guided-finish" dir="rtl">
        <div className="guided-finish-card">
          <OttiMark />
          <span>Round 1 ✓</span>
          <h1>حلو. دلوقتي نخبي الكروت.</h1>
          <p>هتدخل نفس الموقف تاني، بس المرة دي رد بطريقتك. مش لازم تفتكر نفس الجملة حرفيًا. ولو نسيت، زر المساعدة لسه موجود.</p>
          <Link className="guided-finish-primary" to={`/speak/live/${scenario.id}?round=independent`}>
            <ProductIcon name="speak" size={26} />
            <span>جرّب من غير الكارت</span>
            <ProductIcon name="chevron" size={22} />
          </Link>
          <Link className="guided-finish-secondary" to={scenario.returnPath || '/learn'}>ارجع للدرس</Link>
        </div>
      </section>
    );
  }

  const learnerTurn = status === 'listening' && micOpen;
  const currentStep = guided.steps[Math.min(completedLearnerTurns, guided.steps.length - 1)];
  const visibleTurns: SpeakingTurn[] = [
    ...turns,
    ...(learnerDraft.trim() ? [{ id: 'draft-learner', speaker: 'learner' as const, text: learnerDraft, atMs: Date.now() }] : []),
    ...(teacherDraft.trim() ? [{ id: 'draft-teacher', speaker: 'teacher' as const, text: teacherDraft, atMs: Date.now() }] : []),
  ].slice(-6);
  const statusText = statusCopy[status];

  return (
    <section className="fs-live sp-scenario-live guided-live" dir="rtl">
      <header className="fs-live-header sp-scenario-live-header">
        <button type="button" className="fs-live-close" onClick={() => void leaveGuided()} aria-label="إنهاء التدريب">
          <ProductIcon name="close" size={28} />
        </button>
        <div className="fs-live-brand" aria-label="Englotti"><OttiMark /><strong>Englotti</strong></div>
        <strong className="fs-live-title">تدريب موجه • {scenario.curriculum?.lessonCode}</strong>
        <span className="guided-round-pill">Round 1</span>
      </header>

      <div
        className="fs-live-stage sp-scenario-stage"
        style={{ backgroundImage: `linear-gradient(180deg, rgba(255,247,243,.08), rgba(255,250,247,.68) 72%, #fffdfc 100%), url(${scenario.image})` }}
      >
        <div className="fs-live-character sp-scenario-character">
          <CharacterHost ref={host} character={character} className="fs-live-character-host" />
        </div>

        <div className={`fs-live-status status-${status}${learnerTurn ? ' is-open' : ''}`} aria-live="polite">
          <span className="fs-live-wave" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>{statusText.title}</strong><small>{statusText.body}</small></span>
        </div>

        <div className="guided-progress" aria-label={`خطوة ${Math.min(completedLearnerTurns + 1, guided.steps.length)} من ${guided.steps.length}`}>
          {guided.steps.map((_, index) => <i key={index} className={index < completedLearnerTurns ? 'is-done' : index === completedLearnerTurns ? 'is-current' : ''} />)}
        </div>

        <div ref={exchangeRef} className="fs-exchange guided-exchange" aria-live="polite">
          {visibleTurns.length ? visibleTurns.map((turn) => turn.speaker === 'teacher' ? (
            <article key={turn.id} className={`fs-bubble fs-bubble-teacher${turn.id.startsWith('draft-') ? ' is-draft' : ''}`}>
              <span className="fs-bubble-avatar" aria-hidden="true"><OttiMark /></span>
              <small><bdi dir="ltr">{teacherDisplayName}</bdi></small>
              <p dir="auto">{turn.text}</p>
            </article>
          ) : (
            <article key={turn.id} className={`fs-bubble fs-bubble-learner${turn.id.startsWith('draft-') ? ' is-draft' : ''}`}>
              <span className="fs-learner-dot" aria-hidden="true"><ProductIcon name="profile" size={20} /></span>
              <p dir="auto">{turn.text}</p>
            </article>
          )) : (
            <article className="fs-bubble fs-bubble-teacher is-placeholder">
              <span className="fs-bubble-avatar" aria-hidden="true"><OttiMark /></span>
              <p>{status === 'connecting' ? 'بنجهز التدريب…' : 'Otti هيبدأ بجملة قصيرة.'}</p>
            </article>
          )}
        </div>
      </div>

      <div className="fs-live-controls guided-controls">
        {learnerTurn && currentStep ? (
          <section className="guided-response-card" aria-live="polite">
            <div>
              <span>YOUR TURN</span>
              <small>اقرأها بصوتك — وغيّر اللي بين [ ]</small>
            </div>
            <strong dir="ltr">{currentStep.learnerCardEn}</strong>
            {currentStep.noteAr ? <p>{currentStep.noteAr}</p> : null}
          </section>
        ) : null}

        <div className="guided-mic-row">
          <button
            type="button"
            className={`fs-mic-control${learnerTurn ? ' is-live' : ''}`}
            disabled
            aria-label={learnerTurn ? 'المايك مفتوح ودورك تتكلم' : 'استنى دورك'}
          >
            <ProductIcon name="speak" size={48} />
            <small>{learnerTurn ? 'اتكلم' : 'استنى'}</small>
          </button>
        </div>
        <div className="fs-mic-meter" aria-hidden="true"><span style={{ width: `${Math.max(learnerTurn ? 3 : 0, micLevel * 100)}%` }} /></div>
        {error ? (
          <div className="guided-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void startLive()}>جرّب تاني</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
