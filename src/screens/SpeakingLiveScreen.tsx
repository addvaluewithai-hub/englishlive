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
import { GeminiLiveTransport } from '../live/GeminiLiveTransport';
import type { LiveStatus } from '../live/types';
import { comfortLabel, goalPrompt, readLearnerProfile } from '../product/profile';
import {
  completeSpeakingSession,
  createSpeakingSession,
  finalizeSpeakingSessionWithoutAnalysis,
  saveSpeakingTranscript,
} from '../speaking/api';
import { speakingScenarioById, type SpeakingDifficulty } from '../speaking/catalog';
import { buildSpeakingDebugLog, copyTextWithFallback } from '../speaking/debugLog';
import { LessonEvidenceProgress, useLessonEvidenceRuntime } from '../speaking/lessonEvidenceRuntime';
import { Round2IntentHint } from '../speaking/Round2IntentHint';
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

function timeLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remaining = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remaining}`;
}

const difficultyPrompt: Record<SpeakingDifficulty, string> = {
  easier: 'Be extra supportive. Speak a little slower, keep sentences short, ask one thing at a time, and readily rephrase when the learner hesitates. Do not remove the real-world goal.',
  recommended: 'Use natural accessible English, normal short turns, and one useful follow-up at a time. Give enough support to keep the conversation moving without scripting the learner.',
  challenge: 'Use natural pace and less scaffolding. Add at most one plausible complication or constraint that requires clarification or negotiation. Keep the language itself accessible and do not demand untaught specialist vocabulary.',
};

const statusCopy: Record<LiveStatus, { title: string; body: string }> = {
  idle: { title: 'جاهز؟', body: 'المحادثة هتبدأ حالاً' },
  connecting: { title: 'بنجهز الموقف', body: 'ثواني وهنبدأ' },
  listening: { title: 'دورك الآن', body: 'المايك مفتوح — رد بصوتك' },
  speaking: { title: 'Otti بيتكلم', body: 'اسمع أو قاطعه من زر المايك' },
  reconnecting: { title: 'بنرجّع الاتصال', body: 'المحادثة محفوظة' },
  error: { title: 'حصلت مشكلة بسيطة', body: 'جرّب تبدأ تاني' },
};

export function SpeakingLiveScreen() {
  const { scenarioId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const scenario = speakingScenarioById(scenarioId);
  const isCurriculumLesson = Boolean(scenario.curriculum);
  const lessonEvidence = useLessonEvidenceRuntime(scenario.id);
  const profile = readLearnerProfile();
  const character = getCharacterDefinition('otti');
  const visualQa = import.meta.env.VITE_VISUAL_QA === '1';
  const difficultyParam = params.get('difficulty');
  const round = params.get('round');
  const difficulty: SpeakingDifficulty = isCurriculumLesson
    ? 'recommended'
    : difficultyParam === 'easier' || difficultyParam === 'challenge'
      ? difficultyParam
      : 'recommended';

  const host = useRef<CharacterHostHandle | null>(null);
  const transport = useRef<GeminiLiveTransport | null>(null);
  const microphone = useRef<MicrophonePcmStream | null>(null);
  const playback = useRef<PcmPlaybackQueue | null>(null);
  const performer = useRef<CharacterPerformanceController | null>(null);
  const cloudSessionId = useRef<string | null>(null);
  const startedAtMs = useRef<number | null>(null);
  const turnsRef = useRef<SpeakingTurn[]>([]);
  const learnerDraftRef = useRef('');
  const teacherDraftRef = useRef('');
  const saveTimer = useRef<number | null>(null);
  const manualInterrupt = useRef(false);

  const [status, setStatus] = useState<LiveStatus>('idle');
  const [micOpen, setMicOpen] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [turns, setTurns] = useState<SpeakingTurn[]>([]);
  const [learnerDraft, setLearnerDraft] = useState('');
  const [teacherDraft, setTeacherDraft] = useState('');
  const [teacherDisplayName, setTeacherDisplayName] = useState(character.name);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [ending, setEnding] = useState(false);
  const [logCopied, setLogCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function durationSeconds() {
    return startedAtMs.current ? Math.max(0, Math.round((Date.now() - startedAtMs.current) / 1_000)) : 0;
  }

  function setLearnerMicEnabled(enabled: boolean) {
    microphone.current?.setEnabled(enabled);
    setMicOpen(enabled);
    if (!enabled) setMicLevel(0);
  }

  function queueCloudSave() {
    const sessionId = cloudSessionId.current;
    if (!sessionId) return;
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void saveSpeakingTranscript(sessionId, turnsRef.current, durationSeconds()).catch(() => undefined);
    }, 650);
  }

  function pushTurn(speaker: SpeakingTurnSpeaker, text: string) {
    const value = text.trim();
    if (!value) return;
    const previous = turnsRef.current.at(-1);
    if (previous?.speaker === speaker && previous.text === value) return;
    const turn: SpeakingTurn = {
      id: turnId(speaker),
      speaker,
      text: value,
      atMs: startedAtMs.current ? Math.max(0, Date.now() - startedAtMs.current) : 0,
    };
    turnsRef.current = [...turnsRef.current, turn];
    setTurns(turnsRef.current);
    queueCloudSave();
  }

  function flushLearnerDraft() {
    const value = learnerDraftRef.current.trim();
    if (!value) return;
    learnerDraftRef.current = '';
    setLearnerDraft('');
    pushTurn('learner', value);
  }

  function flushTeacherDraft() {
    const value = teacherDraftRef.current.trim();
    if (!value) return;
    teacherDraftRef.current = '';
    setTeacherDraft('');
    pushTurn('teacher', value);
  }

  useEffect(() => {
    if (status === 'connecting' || status === 'reconnecting') performer.current?.thinking();
    else if (status === 'listening') performer.current?.listening();
    else if (status === 'idle' || status === 'error') host.current?.setMode('idle');
  }, [status, character.id]);

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
    manualInterrupt.current = false;
    setMicOpen(false);
    setMicLevel(0);
  }

  async function startLive() {
    if (visualQa || transport.current || status === 'connecting' || status === 'reconnecting') return;
    setStatus('connecting');
    setError(null);
    setMicOpen(false);
    turnsRef.current = [];
    setTurns([]);
    learnerDraftRef.current = '';
    teacherDraftRef.current = '';
    setLearnerDraft('');
    setTeacherDraft('');
    manualInterrupt.current = false;
    lessonEvidence.reset();

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
          lessonEvidence.noteTeacherOutput();
          setLearnerMicEnabled(false);
          queue.pushTranscript(text);
          const next = appendTranscript(teacherDraftRef.current, text);
          teacherDraftRef.current = next;
          setTeacherDraft(next);
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
          flushTeacherDraft();
          queue.interrupt();
          characterPerformance.interrupt();
          setLearnerMicEnabled(true);
          setStatus('listening');
        },
        onTurnComplete: () => {
          manualInterrupt.current = false;
          flushTeacherDraft();
          queue.markTurnComplete();
          if (lessonEvidence.consumeAutoFinishAfterTurn()) {
            window.setTimeout(() => void finishConversation(), 300);
          }
        },
        onError: (message) => setError(message),
      }, lessonEvidence.tools);
      transport.current = live;

      const mic = new MicrophonePcmStream();
      mic.setEnabled(false);
      microphone.current = mic;

      const learnerContext = profile
        ? `The learner's first name is ${profile.firstName || 'not provided'}. Their main reason for English is to ${goalPrompt(profile.goals[0] ?? 'everyday')}. Their self-description is: ${comfortLabel(profile.comfort)} Use this only to pace support naturally.`
        : 'No learner profile is available. Keep the interaction accessible and supportive.';
      const productiveBoundary = scenario.learnMission && scenario.targetLanguageEn?.length
        ? `This Learn mission's language ground is: ${scenario.targetLanguageEn.join('; ')}. Respect any receptive/support labels literally: receptive items are there for comprehension and context, not required learner production. Do not turn the language ground into a checklist.`
        : scenario.targetLanguageEn?.length
          ? `This lesson's productive target language is bounded to: ${scenario.targetLanguageEn.join('; ')}. Create natural opportunities for these resources, but never feed the learner a complete answer before they try.`
          : scenario.usesAr.length
            ? `The course says this scenario should recycle these already-taught abilities: ${scenario.usesAr.join('; ')}. Treat these as productive expectations. You may use a small amount of incidental comprehensible English, but never require unfamiliar specialist language to succeed.`
            : 'Keep productive expectations simple and appropriate to the scenario.';
      const curriculumContract = scenario.curriculum
        ? [
            scenario.learnMission
              ? `This is the live application mission inside Learn ${scenario.curriculum.lessonCode}. The teaching/preparation happened before this conversation; do not reteach it unless the learner asks for help.`
              : `This is Speaking ${scenario.curriculum.level} curriculum lesson ${scenario.curriculum.lessonCode}, not free chat and not a difficulty variant.`,
            `Stay inside this oral outcome: ${scenario.goalAr}`,
            scenario.boundariesEn?.length ? `Hard lesson boundaries: ${scenario.boundariesEn.join(' | ')}` : '',
            scenario.correctionFocusEn?.length ? `Correction priorities: ${scenario.correctionFocusEn.join('; ')}.` : '',
            'Correct or briefly recast errors that affect meaning or the current lesson target. If a non-target error is clear enough and communication succeeds, keep the exchange moving instead of opening a new grammar lesson.',
            scenario.curriculum.level === 'A1'
              ? 'Use short, clear A1 turns and one idea at a time. Adapt support through repetition, rephrasing, wait time or a small hint; never raise the productive language target above this lesson.'
              : 'Use natural, concise B1 turns. Give the learner real conversational material and enough wait time to formulate a response; support only when useful rather than simplifying the interaction into A1-style prompts.',
            'Give the learner multiple natural chances to produce the target independently. Do not turn the lesson into explanation, drilling, or a fixed script.',
          ].filter(Boolean).join('\n')
        : difficultyPrompt[difficulty];
      const prompt = [
        `You are ${teacherName}, acting as ${scenario.aiRoleAr} in a real-life English roleplay.`,
        scenario.partnerBriefEn,
        `Learner role: ${scenario.learnerRoleAr}. Practical goal: ${scenario.goalAr}.`,
        productiveBoundary,
        curriculumContract,
        lessonEvidence.promptEn,
        learnerContext,
        'Conversation comes first. Stay in role and react to meaning. Do not explain the exercise, quiz the learner, or turn every turn into a question.',
        'Contribute information, answer naturally, use follow-ups when useful, and let the learner initiate or repair when the situation creates a reason to do so.',
        'Do not correct every mistake. Prefer a natural recast. Give explicit help only if meaning breaks down, the learner asks, or a repeated target error blocks the task.',
        'Speak English by default. If the learner explicitly asks for Arabic help, give one brief Egyptian-Arabic clarification and return to English.',
        'Never assign a CEFR level, numeric score, mastery claim, pronunciation score, accent judgment, or unsupported assessment during the conversation.',
        'Keep each spoken turn concise so the learner gets most of the speaking time.',
      ].filter(Boolean).join('\n');

      await queue.unlock();
      await live.connect(prompt, { voiceName: characterConfig.voiceName ?? undefined });
      const cloudSession = await createSpeakingSession({
        scenarioId: scenario.id,
        difficulty,
        sessionKind: isCurriculumLesson ? 'guided_practice' : 'world_scenario',
        characterSlug: character.id,
        scenarioSnapshot: {
          titleAr: scenario.titleAr,
          learnerRoleAr: scenario.learnerRoleAr,
          aiRoleAr: scenario.aiRoleAr,
          goalAr: scenario.goalAr,
          usesAr: scenario.usesAr,
          curriculumRefs: scenario.courseLessonIds ?? [],
          interactionFocus: scenario.interactionFocus,
          curriculumLevel: scenario.curriculum?.level,
          lessonCode: scenario.curriculum?.lessonCode,
          targetLanguageEn: scenario.targetLanguageEn,
          correctionFocusEn: scenario.correctionFocusEn,
          boundariesEn: scenario.boundariesEn,
        },
      });
      cloudSessionId.current = cloudSession.id;
      startedAtMs.current = Date.now();
      setElapsedSeconds(0);
      await mic.start((chunk) => live.sendAudio(chunk), setMicLevel);
      live.sendText(scenario.openingMoveEn ?? 'Begin the roleplay now with one short, natural opening move that fits your role. Do not explain the scenario.');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'تعذر بدء المحادثة.';
      setError(message);
      setStatus('error');
      await stopTransport();
    }
  }

  useEffect(() => {
    if (visualQa) {
      const fixtureTurns: SpeakingTurn[] = [
        { id: 'qa-teacher', speaker: 'teacher', text: 'I’m sorry, but your room isn’t ready yet. How can I help?', atMs: 8_000 },
        { id: 'qa-learner', speaker: 'learner', text: 'Can I leave my luggage here?', atMs: 24_000 },
      ];
      turnsRef.current = fixtureTurns;
      setTurns(fixtureTurns);
      setElapsedSeconds(28);
      setStatus('listening');
      setMicOpen(true);
      return;
    }

    const startTimer = window.setTimeout(() => void startLive(), 0);
    const clock = window.setInterval(() => setElapsedSeconds(durationSeconds()), 1000);
    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(clock);
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
      transport.current?.close();
      void microphone.current?.stop();
      void playback.current?.close();
      performer.current?.close();
    };
    // The route creates one live runtime. Scenario changes create a new route instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function interruptTeacher() {
    const live = transport.current;
    if (status !== 'speaking' || !live?.connected) return;
    manualInterrupt.current = true;
    flushTeacherDraft();
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

  function submitText(event: FormEvent) {
    event.preventDefault();
    const value = typedText.trim();
    const live = transport.current;
    if (visualQa) {
      if (!value) return;
      pushTurn('learner', value);
      setTypedText('');
      setKeyboardOpen(false);
      return;
    }
    if (!value || !live?.connected || status !== 'listening' || !micOpen) return;
    flushLearnerDraft();
    pushTurn('learner', value);
    live.sendText(value);
    setTypedText('');
    setKeyboardOpen(false);
  }

  function explainLastTurnInArabic() {
    if (visualQa) return;
    const live = transport.current;
    if (!live?.connected || status !== 'listening' || !micOpen) return;
    live.sendText([
      'UI HELP EVENT — this is NOT a learner answer and must NOT be judged as a Round 2 attempt.',
      'Do not call judge_round2_attempt or record_lesson_evidence because of this UI event.',
      'Explain only your immediately previous spoken English turn in clear Egyptian Arabic.',
      'Start with the overall meaning, then briefly break down any important word, phrase or structure so the learner genuinely understands it.',
      'Do not advance the scenario, do not answer on the learner’s behalf, and do not reveal the English answer expected from the learner.',
      'Then stop and give the learner the turn again.',
    ].join(' '));
  }

  async function copyDebugLog() {
    const text = buildSpeakingDebugLog({
      title: scenario.titleAr,
      lessonCode: scenario.curriculum?.lessonCode,
      roundLabel: round === 'independent' ? 'Round 2 — Arabic intent / independent English' : 'Live conversation',
      teacherName: teacherDisplayName,
      status,
      turns: turnsRef.current,
      learnerDraft: learnerDraftRef.current,
      teacherDraft: teacherDraftRef.current,
    });
    try {
      await copyTextWithFallback(text);
      setLogCopied(true);
      window.setTimeout(() => setLogCopied(false), 1400);
    } catch {
      setError('تعذر نسخ اللوج.');
    }
  }

  async function finishConversation() {
    if (ending) return;
    const sessionId = cloudSessionId.current;
    if (!sessionId) {
      await stopTransport();
      navigate(scenario.returnPath || `/speak/scenario/${scenario.id}`);
      return;
    }

    setEnding(true);
    flushLearnerDraft();
    flushTeacherDraft();
    const snapshot = turnsRef.current;
    const seconds = durationSeconds();
    await stopTransport();

    if (scenario.learnMission) {
      try {
        await finalizeSpeakingSessionWithoutAnalysis(sessionId, snapshot, seconds);
      } catch {
        try {
          await saveSpeakingTranscript(sessionId, snapshot, seconds);
        } catch {
          // Best effort only; live learning should not be blocked by storage cleanup.
        }
      }
      navigate(scenario.returnPath || '/learn', { replace: true });
      return;
    }

    const returnQuery = scenario.returnPath ? `?returnTo=${encodeURIComponent(scenario.returnPath)}` : '';
    try {
      const completed = await completeSpeakingSession(sessionId, snapshot, seconds);
      navigate(`/speak/scenario-recap/${sessionId}${returnQuery}`, { replace: true, state: { session: completed } });
    } catch {
      try {
        await saveSpeakingTranscript(sessionId, snapshot, seconds);
      } catch {
        // The most recent autosave may already contain the transcript.
      }
      navigate(`/speak/scenario-recap/${sessionId}${returnQuery}`, { replace: true });
    }
  }

  const connecting = status === 'connecting' || status === 'reconnecting';
  const teacherSpeaking = status === 'speaking';
  const learnerTurn = status === 'listening' && micOpen;
  const statusText = statusCopy[status];
  const latestTeacherText = teacherDraft.trim()
    || [...turns].reverse().find((turn) => turn.speaker === 'teacher')?.text
    || '';

  return (
    <section className={`fs-live sp-scenario-live${scenario.learnMission ? ' sp-learn-mission-live' : ''}`} dir="rtl">
      <header className="fs-live-header sp-scenario-live-header">
        <button type="button" className="fs-live-close" onClick={() => void finishConversation()} aria-label="إنهاء المحادثة" disabled={ending}>
          <ProductIcon name="close" size={28} />
        </button>
        <div className="fs-live-brand" aria-label="Englotti">
          <OttiMark />
          <strong>Englotti</strong>
        </div>
        <strong className="fs-live-title">{scenario.curriculum ? `${scenario.curriculum.lessonCode} • ${scenario.titleAr}` : scenario.titleAr}</strong>
        <span className="fs-live-mode sp-scenario-timer">◷ {timeLabel(elapsedSeconds)}</span>
      </header>

      <div
        className="fs-live-stage sp-scenario-stage"
        style={{ backgroundImage: `linear-gradient(180deg, rgba(255,247,243,.08), rgba(255,250,247,.68) 72%, #fffdfc 100%), url(${scenario.image})` }}
      >
        {latestTeacherText ? (
          <article className="sp-otti-transcript" aria-live="polite">
            <small><bdi dir="ltr">{teacherDisplayName}</bdi></small>
            <p dir="auto">{latestTeacherText}</p>
          </article>
        ) : null}

        <div className="fs-live-character sp-scenario-character">
          <CharacterHost ref={host} character={character} className="fs-live-character-host" />
        </div>

        <div className={`fs-live-status status-${status}${learnerTurn ? ' is-open' : ''}`} aria-live="polite">
          <span className="fs-live-wave" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>{statusText.title}</strong><small>{statusText.body}</small></span>
        </div>

        {scenario.hideEvidenceProgress ? null : <LessonEvidenceProgress runtime={lessonEvidence} />}

        <button type="button" className="sp-copy-log-button" onClick={() => void copyDebugLog()} aria-label="نسخ لوج المحادثة">
          <span aria-hidden="true">⧉</span>
          <strong>{logCopied ? 'Copied' : 'Copy log'}</strong>
        </button>
      </div>

      <div className="fs-live-controls">
        <Round2IntentHint scenarioId={scenario.id} round={round} learnerTurn={learnerTurn} turns={turns} />

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

        <div className="fs-control-row">
          <button
            type="button"
            className="fs-help-control sp-arabic-explain-button"
            onClick={explainLastTurnInArabic}
            disabled={!learnerTurn}
          >
            <span>ع</span>
            <strong>اشرح بالعربي</strong>
          </button>

          <button
            type="button"
            className={`fs-mic-control${learnerTurn ? ' is-live' : ''}${teacherSpeaking ? ' is-interrupt' : ''}`}
            onClick={handleMicAction}
            disabled={connecting || ending || (status === 'listening' && !teacherSpeaking)}
            aria-label={teacherSpeaking ? 'قاطع Otti واتكلم' : learnerTurn ? 'دورك تتكلم' : 'ابدأ المحادثة'}
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
            <strong>{scenario.learnMission ? 'تمام — بنرجع للدرس…' : 'بنجهّز ملخص المحادثة…'}</strong>
            <span><i /><i /><i /></span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
