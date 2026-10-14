import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { PracticeFeedbackCard } from '../practice/PracticeFeedbackCard';
import { PracticeHintCard } from '../practice/PracticeHintCard';
import { practiceMissionContractBySlug } from '../practice/missions/catalog';
import { useConversationPracticeRuntime } from '../practice/conversationRuntime';
import type { ConversationTurn } from '../practice/conversationTypes';
import { buildConversationOpening } from '../practice/conversationPrompt';
import { PracticeTurnAudioBuffer } from '../practice/turnAudioBuffer';
import { transcribePracticeTurn } from '../practice/transcribeClient';
import { LiveConversationHeader, LiveConversationStatus } from '../ui/product/LiveConversationChrome';

type PracticeConversationTurn = ConversationTurn;

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

export function PracticeLiveScreen() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const mission = practiceMissionContractBySlug(missionId);
  const runtime = useConversationPracticeRuntime(missionId);
  const [searchParams] = useSearchParams();
  const silenceDurationMs = searchParams.get('pace') === 'relaxed' ? 2400 : 1200;
  const character = getCharacterDefinition('otti');
  const visualQa = import.meta.env.VITE_VISUAL_QA === '1';

  const host = useRef<CharacterHostHandle | null>(null);
  const transport = useRef<GeminiLiveTransport | null>(null);
  const microphone = useRef<MicrophonePcmStream | null>(null);
  const playback = useRef<PcmPlaybackQueue | null>(null);
  const performer = useRef<CharacterPerformanceController | null>(null);
  const startedAtMs = useRef<number | null>(null);
  const manualInterrupt = useRef(false);
  const sessionGeneration = useRef(0);
  const replyTimeout = useRef<number | null>(null);
  const teacherDraftRef = useRef('');
  const learnerDraftRef = useRef('');
  const lastSpeechAt = useRef<number | null>(null);
  const firstReplyPending = useRef(false);
  const replyTimings = useRef<Array<{ turn: number; delayMs: number }>>([]);
  const pausedRef = useRef(false);
  const repeatAfterPause = useRef(false);
  const replyHasAudio = useRef(false);
  const [paused, setPaused] = useState(false);
  const [waitingForReply, setWaitingForReply] = useState(false);
  const conversationLogRef = useRef<PracticeConversationTurn[]>([]);
  const learnerTurnLoggedRef = useRef(false);
  const turnAudio = useRef(new PracticeTurnAudioBuffer());
  const micLevelRef = useRef(0);
  const transcriptionGeneration = useRef(0);
  const transcriptions = useRef(new Set<Promise<void>>());
  const [speechDetected, setSpeechDetected] = useState(false);
  const [transcribing, setTranscribing] = useState(0);
  const [transcriptionError, setTranscriptionError] = useState(false);
  const copyResetTimerRef = useRef<number | null>(null);

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
  const [conversationCopied, setConversationCopied] = useState(false);

  function durationSeconds() {
    return startedAtMs.current ? Math.max(0, Math.round((Date.now() - startedAtMs.current) / 1_000)) : 0;
  }

  function appendConversationTurn(speaker: PracticeConversationTurn['speaker'], text: string) {
    const value = text.trim();
    if (!value) return;
    const last = conversationLogRef.current.at(-1);
    if (last?.speaker === speaker && last.text === value) return;
    conversationLogRef.current.push({ id: `turn-${conversationLogRef.current.length + 1}`, speaker, text: value });
    runtime.invalidateHint();
    if (speaker === 'learner') {
      firstReplyPending.current = true;
      replyHasAudio.current = false;
      void runtime.reviewTurn([...conversationLogRef.current]);
    }
  }

  /**
   * Close the learner's audio BEFORE Otti responds, preserving turn order.
   * Reserve a blank slot; never send pending/failed audio as fabricated text
   * to the coach. The independently transcribed words fill the slot later.
   */
  function flushCapturedSpeech() {
    const { audioBase64, overflow } = turnAudio.current.takeWavBase64();
    if (overflow) {
      setTranscriptionError(true);
      setSpeechDetected(false);
      return;
    }
    if (!audioBase64) return;
    const turn: PracticeConversationTurn = {
      id: `turn-${conversationLogRef.current.length + 1}`, speaker: 'learner', text: '',
    };
    conversationLogRef.current.push(turn);
    const generation = transcriptionGeneration.current;
    const position = conversationLogRef.current.length;
    learnerTurnLoggedRef.current = true;
    firstReplyPending.current = true;
    replyHasAudio.current = false;
    setSpeechDetected(false);
    setTranscribing((n) => n + 1);
    // Audio is only held by this pending request. No server storage is requested.
    let task: Promise<void>;
    task = transcribePracticeTurn(audioBase64).then((text) => {
      if (generation !== transcriptionGeneration.current) return;
      turn.text = text;
      setLearnerDraft(text);
      setTranscriptionError(false);
      runtime.invalidateHint();
      // Review only the conversation prefix ending at THIS learner turn.
      // Later Otti speech or unresolved future audio cannot bias the coach.
      const prefix = conversationLogRef.current.slice(0, position).filter((item) => item.text.trim());
      void runtime.reviewTurn(prefix);
    }).catch(() => {
      if (generation === transcriptionGeneration.current) setTranscriptionError(true);
    }).finally(() => {
      transcriptions.current.delete(task);
      if (generation === transcriptionGeneration.current) setTranscribing((n) => Math.max(0, n - 1));
    });
    transcriptions.current.add(task);
  }

  function flushTeacherTurn() {
    const value = teacherDraftRef.current.trim();
    if (!value) return;
    appendConversationTurn('otti', value);
  }

  function conversationText() {
    if (!mission) return '';
    const turns = conversationLogRef.current.filter((turn) => turn.text.trim());
    // Live input transcription is disabled; audio is rendered after Flash-Lite returns.
    // Typed messages were already added when submitted.
    const pendingTeacher = teacherDraftRef.current.trim();
    const last = turns.at(-1);
    if (pendingTeacher && !(last?.speaker === 'otti' && last.text === pendingTeacher)) {
      turns.push({ id: 'pending-otti', speaker: 'otti', text: pendingTeacher });
    }
    const trace = runtime.getEvaluationTrace();
    return [
      `Practice: ${mission.level} — ${mission.titleEn}`,
      '',
      ...turns.map((turn) => `${turn.speaker === 'otti' ? 'Otti' : 'Learner'}: ${turn.text}`),
      ...(trace.length ? [
        '',
        '--- Background coach ---',
        ...trace.map((item) => {
          const original = item.originalEn ? ` | said: ${item.originalEn}` : '';
          const correction = item.betterEn ? ` | better: ${item.betterEn}` : '';
          return `[${item.beatId}] language=${item.languageStatus}${original}${correction} | ${item.reasonEn}`;
        }),
      ] : []),
      '',
      `Voice: no tools | pause tolerance: ${silenceDurationMs}ms`,
      ...replyTimings.current.map((sample) => `Reply ${sample.turn}: ${sample.delayMs}ms after last detected learner speech`),
    ].join('\n');
  }

  async function copyConversation() {
    const value = conversationText();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setConversationCopied(true);
      if (copyResetTimerRef.current !== null) window.clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = window.setTimeout(() => {
        setConversationCopied(false);
        copyResetTimerRef.current = null;
      }, 1800);
    } catch {
      setError(locale === 'ar' ? 'معرفتش أنسخ الحوار تلقائيًا. جرّب تاني.' : 'Could not copy the conversation. Try again.');
    }
  }

  function setLearnerMicEnabled(enabled: boolean) {
    microphone.current?.setEnabled(enabled);
    setMicOpen(enabled);
    if (!enabled) setMicLevel(0);
  }


  function clearReplyTimeout() {
    if (replyTimeout.current !== null) window.clearTimeout(replyTimeout.current);
    replyTimeout.current = null;
  }

  function armReplyTimeout() {
    clearReplyTimeout();
    const session = sessionGeneration.current;
    replyTimeout.current = window.setTimeout(() => {
      replyTimeout.current = null;
      if (session !== sessionGeneration.current || pausedRef.current) return;
      // Do not mistake a learner who is still speaking for an unresponsive partner.
      if (microphone.current?.isEnabled && lastSpeechAt.current !== null && performance.now() - lastSpeechAt.current < 25_000) {
        armReplyTimeout();
        return;
      }
      void stopTransport().catch(() => undefined).then(() => {
        if (sessionGeneration.current !== session + 1) return;
        setWaitingForReply(false);
        setStatus('error');
        setError(locale === 'ar' ? 'Otti ما ردّش في الوقت المتوقع. ملاحظاتك لسه موجودة؛ تقدر تنهي وتراجع، أو تبدأ محاولة جديدة.' : 'Otti did not respond in time. Your notes are still here; finish and review, or start a new attempt.');
      });
    }, 25_000);
  }

  async function stopTransport() {
    clearReplyTimeout();
    sessionGeneration.current++;
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
    flushCapturedSpeech();
    flushTeacherTurn();
    const support = runtime.getSupportSummary();
    await stopTransport();
    // A bounded 24s request may still be running after voice stops.
    // Resolve it before building the final transcript for the recap.
    await Promise.allSettled([...transcriptions.current]);
    const corrections = runtime.getCorrectionSummary();
    if (completed) {
      navigate(`/practice/complete/${mission.slug}`, {
        replace: true,
        state: { support, corrections, durationSeconds: durationSeconds(), conversationText: conversationText(), transcript: conversationLogRef.current.filter((turn) => turn.text.trim()), achievedGoalIds: runtime.achievedGoalIds },
      });
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
    learnerTurnLoggedRef.current = false;
    conversationLogRef.current = [];
    transcriptionGeneration.current++;
    turnAudio.current.clear();
    transcriptions.current.clear();
    setSpeechDetected(false);
    setTranscribing(0);
    setTranscriptionError(false);
    setTeacherText('');
    setLearnerDraft('');
    setConversationCopied(false);
    setPaused(false);
    pausedRef.current = false;
    setWaitingForReply(false);
    replyTimings.current = [];
    runtime.reset();
    repeatAfterPause.current = false;
    firstReplyPending.current = false;
    replyHasAudio.current = false;
    lastSpeechAt.current = null;
    const session = ++sessionGeneration.current;

    try {
      const publishedCharacter = await loadPublishedCharacter(character);
      if (session !== sessionGeneration.current) return;
      const characterConfig = publishedCharacter.content;
      const characterPerformance = new CharacterPerformanceController(() => host.current);
      performer.current = characterPerformance;

      const queue = new PcmPlaybackQueue({
        onMouthPose: (pose) => characterPerformance.setMouth(pose),
        onSpeechStart: () => {
          flushCapturedSpeech();
          learnerDraftRef.current = '';
          setLearnerDraft('');
          setLearnerMicEnabled(false);
          setStatus('speaking');
          characterPerformance.speechStart();
        },
        onSpeechEnd: () => {
          setWaitingForReply(false);
          setLearnerMicEnabled(!pausedRef.current);
          setStatus((current) => current === 'idle' || current === 'error' ? current : 'listening');
          characterPerformance.speechEnd();
        },
        onTurnComplete: () => undefined,
      });
      playback.current = queue;

      const live = new GeminiLiveTransport({
        onStatus: setStatus,
        // Practice deliberately disables Live input transcription; this callback
        // is defensive only if the provider sends unexpected text.
        onInputTranscript: () => undefined,
        onOutputTranscript: (text) => {
          if (pausedRef.current) { repeatAfterPause.current = true; return; }
          if (manualInterrupt.current) return;
          flushCapturedSpeech();
          setLearnerMicEnabled(false);
          queue.pushTranscript(text);
          const next = appendTranscript(teacherDraftRef.current, text);
          teacherDraftRef.current = next;
          setTeacherText(next);
        },
        onAudio: (data, mimeType) => {
          if (pausedRef.current) { repeatAfterPause.current = true; return; }
          if (manualInterrupt.current) return;
          flushCapturedSpeech();
          clearReplyTimeout();
          replyHasAudio.current = true;
          setLearnerMicEnabled(false);
          if (firstReplyPending.current && lastSpeechAt.current !== null) {
            replyTimings.current.push({ turn: replyTimings.current.length + 1, delayMs: Math.round(performance.now() - lastSpeechAt.current) });
            firstReplyPending.current = false;
          }
          setWaitingForReply(false);
          void queue.enqueue(data, pcmSampleRate(mimeType));
        },
        onPerformanceCue: (cue) => characterPerformance.applyCue(cue),
        onPerformanceCancelled: () => characterPerformance.cancelCue(),
        onInterrupted: () => {
          flushTeacherTurn();
          teacherDraftRef.current = '';
          manualInterrupt.current = false;
          queue.interrupt();
          characterPerformance.interrupt();
          setLearnerMicEnabled(!pausedRef.current);
          setWaitingForReply(false);
          setStatus('listening');
        },
        onTurnComplete: () => {
          clearReplyTimeout();
          manualInterrupt.current = false;
          queue.markTurnComplete();
          if (!replyHasAudio.current) {
            setWaitingForReply(false);
            setLearnerMicEnabled(!pausedRef.current);
            setStatus('listening');
          }
          replyHasAudio.current = false;
          flushTeacherTurn();
          teacherDraftRef.current = '';
        },
        onError: (message) => setError(message),
      });
      transport.current = live;

      const mic = new MicrophonePcmStream();
      mic.setEnabled(false);
      microphone.current = mic;

      const prompt = runtime.promptEn;

      await queue.unlock();
      if (session !== sessionGeneration.current) { await queue.close(); return; }
      await live.connect(prompt, { voiceName: characterConfig.voiceName ?? undefined, silenceDurationMs, disableInputTranscription: true });
      if (session !== sessionGeneration.current) { live.close(); await queue.close(); return; }
      startedAtMs.current = Date.now();
      setElapsedSeconds(0);
      await mic.start((chunk) => {
        // Feed EXACT same mic PCM into both Otti and the bounded local recorder.
        live.sendAudio(chunk);
        turnAudio.current.push(chunk, micLevelRef.current);
      }, (level) => {
        micLevelRef.current = level;
        setMicLevel(level);
        if (level > 0.045) {
          lastSpeechAt.current = performance.now();
          if (!turnAudio.current.hasSpeech) setSpeechDetected(true);
        }
      });
      if (session !== sessionGeneration.current) { await mic.stop(); return; }
      setWaitingForReply(true);
      armReplyTimeout();
      live.sendText(buildConversationOpening(mission));
    } catch (reason) {
      if (session !== sessionGeneration.current) return;
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
      sessionGeneration.current++;
      transcriptionGeneration.current++;
      turnAudio.current.clear();
      clearReplyTimeout();
      window.clearTimeout(startTimer);
      window.clearInterval(clock);
      if (copyResetTimerRef.current !== null) window.clearTimeout(copyResetTimerRef.current);
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


  function interruptTeacher() {
    const live = transport.current;
    if (status !== 'speaking' || !live?.connected) return;
    flushTeacherTurn();
    teacherDraftRef.current = '';
    manualInterrupt.current = true;
    playback.current?.interrupt();
    performer.current?.interrupt();
    setLearnerMicEnabled(!pausedRef.current);
    setWaitingForReply(false);
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
    if (visualQa || !transport.current?.connected || paused || waitingForReply) return;
    void runtime.requestHint(conversationLogRef.current.filter((turn) => turn.text.trim()));
  }

  function finishSpeaking() {
    if (!transport.current?.connected || pausedRef.current || !turnAudio.current.hasSpeech) return;
    setLearnerMicEnabled(false);
    flushCapturedSpeech();
    transport.current.endAudioStream();
    armReplyTimeout();
    setWaitingForReply(true);
  }

  function togglePause() {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (next) {
      clearReplyTimeout();
      if (status === 'speaking') { repeatAfterPause.current = true; interruptTeacher(); }
      setLearnerMicEnabled(false);
    } else if (repeatAfterPause.current && transport.current?.connected) {
      repeatAfterPause.current = false;
      manualInterrupt.current = false;
      setWaitingForReply(true);
      armReplyTimeout();
      transport.current.sendText('PRIVATE UI RESUME: the learner paused and missed your last reply. Briefly repeat it, then wait. This is a control event, not learner speech.');
    } else if (status === 'listening' && !waitingForReply) setLearnerMicEnabled(true);
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
    // Typed input bypasses the audio transcriber; discard idle mic noise.
    turnAudio.current.clear();
    setSpeechDetected(false);
    appendConversationTurn('learner', value);
    learnerDraftRef.current = value;
    lastSpeechAt.current = performance.now();
    learnerTurnLoggedRef.current = true;
    armReplyTimeout();
    live.sendText(value);
    setWaitingForReply(true);
    setLearnerMicEnabled(false);
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
  const learnerTurn = status === 'listening' && micOpen && !paused && !waitingForReply;
  const statusText = {
    idle: { title: t('practice.status.idle.title'), body: t('practice.status.idle.body') },
    connecting: { title: t('practice.status.connecting.title'), body: t('practice.status.connecting.body') },
    listening: { title: t('practice.status.listening.title'), body: t('practice.status.listening.body') },
    speaking: { title: t('practice.status.speaking.title'), body: t('practice.status.speaking.body') },
    reconnecting: { title: t('practice.status.reconnecting.title'), body: t('practice.status.reconnecting.body') },
    error: { title: t('practice.status.error.title'), body: t('practice.status.error.body') },
  }[status];
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
        onClose={() => void finishMission(true)}
        closeLabel={locale === 'ar' ? 'إنهاء ومراجعة' : 'Finish and review'}
        disabled={ending}
        brandText={t('practice.headerTitle')}
        className="sp-scenario-live-header"
        metaClassName="fs-live-mode sp-scenario-timer"
      />

      {mission.briefing ? (
        <aside className="practice-live-task" aria-label={locale === 'ar' ? 'ملخص المهمة' : 'Mission summary'}>
          <div>
            <small>{locale === 'ar' ? 'هدفك' : 'Your goal'}</small>
            <strong>
              {locale === 'ar'
                ? mission.goalAr
                : mission.briefing.successEn}
            </strong>
          </div>
          {mission.briefing.facts?.map((fact) => (
            <span key={fact.value}>
              <small>{locale === 'ar' ? fact.labelAr : fact.labelEn}</small>
              <bdi dir="ltr">{fact.value}</bdi>
            </span>
          ))}
        </aside>
      ) : null}

      <div className="fs-live-stage sp-scenario-stage practice-live-stage">
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
          title={paused ? (locale === 'ar' ? 'خد وقتك' : 'Take your time') : waitingForReply ? (locale === 'ar' ? 'Otti بيرد عليك' : 'Otti is responding') : statusText.title}
          body={paused ? (locale === 'ar' ? 'راجع ملاحظاتك، واضغط نكمل لما تكون جاهز.' : 'Review your notes, then resume when ready.') : statusText.body}
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
        <div className="practice-conversation-goals" aria-label={locale === 'ar' ? 'فرص الكلام' : 'Speaking opportunities'}>
          {runtime.goals.map((goal) => <span key={goal.id} className={runtime.achievedGoalIds.includes(goal.id) ? 'is-observed' : ''}>
            <span aria-hidden="true">{runtime.achievedGoalIds.includes(goal.id) ? '✓' : '○'}</span>{' '}
            {locale === 'ar' ? goal.overviewAr : goal.learnerIntentEn}
          </span>)}
        </div>
        <div className="practice-conversation-actions">
          <button type="button" onClick={togglePause} disabled={connecting || ending || waitingForReply}>
            {paused ? (locale === 'ar' ? 'نكمل' : 'Resume') : (locale === 'ar' ? 'وقفة للمراجعة' : 'Pause to review')}
          </button>
          <button type="button" onClick={finishSpeaking} disabled={!learnerTurn || !speechDetected}>
            {locale === 'ar' ? 'خلصت كلامي' : 'Done speaking'}
          </button>
          <button type="button" onClick={() => void finishMission(true)} disabled={ending}>
            {locale === 'ar' ? 'إنهاء ومراجعة' : 'Finish and review'}
          </button>
        </div>
        <button type="button" className="practice-copy-log" onClick={() => void copyConversation()}>
          {conversationCopied
            ? (locale === 'ar' ? 'تم النسخ ✓' : 'Copied ✓')
            : (locale === 'ar' ? 'نسخ الحوار' : 'Copy conversation')}
        </button>

        <PracticeFeedbackCard runtime={runtime} />

        <PracticeHintCard runtime={runtime} learnerTurn={learnerTurn && !paused} onRequestHint={requestContextualHint} />

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
          <button
            type="button"
            className="fs-keyboard-control"
            onClick={() => setKeyboardOpen((value) => !value)}
            disabled={!learnerTurn}
            aria-label={t('live.typeInstead')}
          >
            <ProductIcon name="keyboard" size={31} />
          </button>

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
            className="practice-live-secondary-control"
            disabled
            aria-label={t('practice.moreComingSoon')}
            title={t('practice.moreComingSoon')}
          >
            <ProductIcon name="more" size={29} />
          </button>
        </div>

        <div className="fs-mic-meter" aria-hidden="true"><span style={{ width: `${Math.max(learnerTurn ? 3 : 0, micLevel * 100)}%` }} /></div>
        {transcribing > 0 ? <p className="practice-coach-status" role="status">{locale === 'ar' ? 'بنكتب كلامك من التسجيل الصوتي…' : 'Transcribing your voice…'}</p> : null}
        {transcriptionError ? <p className="practice-coach-status" role="alert">{locale === 'ar' ? 'تعذر تفريغ جزء من كلامك. مش هنعمل تصحيح من نص مش موجود.' : 'Some speech could not be transcribed. No correction will be invented.'}</p> : null}
        {runtime.coachError ? <p className="practice-coach-status">{locale === 'ar' ? 'الملاحظات مش متاحة حاليًا. كمل كلامك، ونحاول تاني في المراجعة.' : 'Feedback is unavailable for now. Keep talking; we will retry at review.'}</p> : null}
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

