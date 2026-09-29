import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MicrophonePcmStream } from '../audio/MicrophonePcmStream';
import { PcmPlaybackQueue } from '../audio/PcmPlaybackQueue';
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
  saveSpeakingTranscript,
} from '../speaking/api';
import { speakingAssets } from '../speaking/assets';
import { speakingScenarioById, type SpeakingDifficulty } from '../speaking/catalog';
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

export function SpeakingLiveScreen() {
  const { scenarioId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const scenario = speakingScenarioById(scenarioId);
  const profile = readLearnerProfile();
  const character = getCharacterDefinition('otti');
  const difficultyParam = params.get('difficulty');
  const difficulty: SpeakingDifficulty = difficultyParam === 'easier' || difficultyParam === 'challenge'
    ? difficultyParam
    : 'recommended';

  const transport = useRef<GeminiLiveTransport | null>(null);
  const microphone = useRef<MicrophonePcmStream | null>(null);
  const playback = useRef<PcmPlaybackQueue | null>(null);
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
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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

  async function stopTransport() {
    transport.current?.endAudioStream();
    transport.current?.close();
    transport.current = null;
    await microphone.current?.stop();
    microphone.current = null;
    await playback.current?.close();
    playback.current = null;
    manualInterrupt.current = false;
    setMicOpen(false);
    setMicLevel(0);
  }

  async function startLive() {
    if (transport.current || status === 'connecting' || status === 'reconnecting') return;
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

    try {
      const publishedCharacter = await loadPublishedCharacter(character);
      const characterConfig = publishedCharacter.content;
      const teacherName = characterConfig.displayName?.trim() || character.name;
      const queue = new PcmPlaybackQueue({
        onMouthPose: () => undefined,
        onSpeechStart: () => {
          flushLearnerDraft();
          setLearnerMicEnabled(false);
          setStatus('speaking');
        },
        onSpeechEnd: () => {
          flushTeacherDraft();
          setLearnerMicEnabled(true);
          setStatus((current) => current === 'idle' || current === 'error' ? current : 'listening');
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
        onInterrupted: () => {
          manualInterrupt.current = false;
          flushTeacherDraft();
          queue.interrupt();
          setLearnerMicEnabled(true);
          setStatus('listening');
        },
        onTurnComplete: () => {
          manualInterrupt.current = false;
          flushTeacherDraft();
          queue.markTurnComplete();
        },
        onError: (message) => setError(message),
      }, []);
      transport.current = live;

      const mic = new MicrophonePcmStream();
      mic.setEnabled(false);
      microphone.current = mic;

      const learnerContext = profile
        ? `The learner's first name is ${profile.firstName || 'not provided'}. Their main reason for English is to ${goalPrompt(profile.goals[0] ?? 'everyday')}. Their self-description is: ${comfortLabel(profile.comfort)} Use this only to pace support naturally.`
        : 'No learner profile is available. Keep the interaction accessible and supportive.';
      const productiveBoundary = scenario.usesAr.length
        ? `The course says this scenario should recycle these already-taught abilities: ${scenario.usesAr.join('; ')}. Treat these as productive expectations. You may use a small amount of incidental comprehensible English, but never require unfamiliar specialist language to succeed.`
        : 'Keep productive expectations simple and appropriate to the scenario.';
      const prompt = [
        `You are ${teacherName}, acting as ${scenario.aiRoleAr} in a real-life English roleplay.`,
        scenario.partnerBriefEn,
        `Learner role: ${scenario.learnerRoleAr}. Practical goal: ${scenario.goalAr}.`,
        productiveBoundary,
        difficultyPrompt[difficulty],
        learnerContext,
        'Conversation comes first. Stay in role and react to meaning. Do not explain the exercise, quiz the learner, or turn every turn into a question.',
        'Contribute information, answer naturally, use follow-ups when useful, and let the learner initiate or repair when the situation creates a reason to do so.',
        'Do not correct every mistake. Prefer a natural recast. Give explicit help only if meaning breaks down, the learner asks, or a repeated error blocks the task.',
        'Speak English by default. If the learner explicitly asks for Arabic help, give one brief Egyptian-Arabic clarification and return to English.',
        'Never assign a CEFR level, numeric score, mastery claim, pronunciation score, accent judgment, or unsupported assessment during the conversation.',
        'Keep each spoken turn concise so the learner gets most of the speaking time.',
      ].join('\n');

      await queue.unlock();
      await live.connect(prompt, { voiceName: characterConfig.voiceName ?? undefined });
      const cloudSession = await createSpeakingSession({
        scenarioId: scenario.id,
        difficulty,
        characterSlug: character.id,
        scenarioSnapshot: {
          titleAr: scenario.titleAr,
          learnerRoleAr: scenario.learnerRoleAr,
          aiRoleAr: scenario.aiRoleAr,
          goalAr: scenario.goalAr,
          usesAr: scenario.usesAr,
          curriculumRefs: scenario.courseLessonIds ?? [],
          interactionFocus: scenario.interactionFocus,
        },
      });
      cloudSessionId.current = cloudSession.id;
      startedAtMs.current = Date.now();
      setElapsedSeconds(0);
      await mic.start((chunk) => live.sendAudio(chunk), setMicLevel);
      live.sendText('Begin the roleplay now with one short, natural opening move that fits your role. Do not explain the scenario.');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'تعذر بدء المحادثة.';
      setError(message);
      setStatus('error');
      await stopTransport();
    }
  }

  useEffect(() => {
    const startTimer = window.setTimeout(() => void startLive(), 0);
    const clock = window.setInterval(() => setElapsedSeconds(durationSeconds()), 1000);
    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(clock);
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
      transport.current?.close();
      void microphone.current?.stop();
      void playback.current?.close();
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
    setLearnerMicEnabled(true);
    setStatus('listening');
  }

  function toggleMic() {
    if (status === 'speaking') {
      interruptTeacher();
      return;
    }
    if (status !== 'listening') return;
    setLearnerMicEnabled(!micOpen);
  }

  function submitText(event: FormEvent) {
    event.preventDefault();
    const value = typedText.trim();
    const live = transport.current;
    if (!value || !live?.connected || status !== 'listening') return;
    flushLearnerDraft();
    pushTurn('learner', value);
    live.sendText(value);
    setTypedText('');
    setKeyboardOpen(false);
  }

  function askForHelp(kind: 'simplify' | 'arabic' | 'example' | 'say-it') {
    const live = transport.current;
    if (!live?.connected || status !== 'listening') return;
    const instructions = {
      simplify: 'Rephrase only your last point in simpler English, then stay in role and continue.',
      arabic: 'Briefly explain only your last point in Egyptian Arabic, then return to English and continue the roleplay.',
      example: 'Give one very short English example the learner could use in this situation, then give them the turn.',
      'say-it': 'The learner needs production help. Ask in Egyptian Arabic what they want to say if the intent is unclear; otherwise give one short natural English phrase they can use, then resume the roleplay.',
    } as const;
    live.sendText(instructions[kind]);
    setHelpOpen(false);
  }

  async function finishConversation() {
    if (ending) return;
    const sessionId = cloudSessionId.current;
    if (!sessionId) {
      await stopTransport();
      navigate(`/speak/scenario/${scenario.id}`);
      return;
    }
    setEnding(true);
    flushLearnerDraft();
    flushTeacherDraft();
    const snapshot = turnsRef.current;
    const seconds = durationSeconds();
    await stopTransport();
    try {
      const completed = await completeSpeakingSession(sessionId, snapshot, seconds);
      navigate(`/speak/scenario-recap/${sessionId}`, { replace: true, state: { session: completed } });
    } catch {
      try {
        await saveSpeakingTranscript(sessionId, snapshot, seconds);
      } catch {
        // The most recent autosave may already contain the transcript.
      }
      navigate(`/speak/scenario-recap/${sessionId}`, { replace: true });
    }
  }

  const learnerTurn = status === 'listening' && micOpen;
  const visibleTurns: SpeakingTurn[] = [
    ...turns,
    ...(learnerDraft.trim() ? [{ id: 'draft-learner', speaker: 'learner' as const, text: learnerDraft, atMs: elapsedSeconds * 1000 }] : []),
    ...(teacherDraft.trim() ? [{ id: 'draft-teacher', speaker: 'teacher' as const, text: teacherDraft, atMs: elapsedSeconds * 1000 }] : []),
  ].slice(-2);

  return (
    <section className="sp-live" dir="rtl">
      <header className="sp-live-header">
        <button type="button" className="sp-live-close" onClick={() => void finishConversation()} aria-label="إنهاء" disabled={ending}>
          <ProductIcon name="close" size={27} />
        </button>
        <div className="sp-live-brand"><OttiMark /><strong>Englotti</strong></div>
        <div className="sp-live-progress"><span><i /><i /><i /></span><small>{timeLabel(elapsedSeconds)} ◷</small></div>
        <div className="sp-live-scenario"><span>🛏️</span><strong>{scenario.titleAr}</strong></div>
      </header>

      <div className="sp-live-stage">
        <img className="sp-live-bg" src={scenario.image} alt="" />
        <img className="sp-live-otti" src={scenario.liveCharacterImage ?? speakingAssets.ottiHero} alt="Otti" />
        <div className={`sp-turn-status${learnerTurn ? ' is-active' : ''}`}>
          <ProductIcon name="speak" size={26} />
          <span>
            <strong>{status === 'speaking' ? 'Otti بيتكلم' : status === 'connecting' || status === 'reconnecting' ? 'بنجهز الموقف' : learnerTurn ? 'دورك الآن' : status === 'error' ? 'الاتصال وقف' : 'المايك مقفول'}</strong>
            <small>{status === 'speaking' ? 'اسمع أو قاطعه من زر المايك' : learnerTurn ? 'رد بصوتك' : status === 'error' ? 'جرّب تاني' : 'اضغط المايك لما تكون جاهز'}</small>
          </span>
        </div>
      </div>

      <div className="sp-live-dialogue" aria-live="polite">
        {visibleTurns.map((turn) => turn.speaker === 'teacher' ? (
          <article className="sp-live-bubble is-otti" key={turn.id}>
            <span className="sp-live-avatar"><OttiMark /></span>
            <p dir="ltr">{turn.text}</p>
          </article>
        ) : (
          <article className="sp-live-bubble is-learner" key={turn.id}>
            <span className="sp-live-user"><ProductIcon name="profile" size={23} /></span>
            <p dir="ltr">{turn.text}</p>
          </article>
        ))}
        {error ? (
          <div className="sp-live-error" role="alert">
            <strong>المحادثة ما بدأتش بشكل سليم.</strong>
            <span>{error}</span>
            <button type="button" onClick={() => void startLive()}>جرّب تاني</button>
          </div>
        ) : null}
        {!error && !visibleTurns.length ? <p className="sp-live-help-hint">{status === 'connecting' ? 'بنجهز المحادثة…' : 'ابدأ لما تسمع Otti.'}</p> : null}
        {!error && visibleTurns.length ? <p className="sp-live-help-hint">💡 اضغط على “مش فاهم” لو محتاج مساعدة.</p> : null}
      </div>

      {keyboardOpen ? (
        <form className="sp-live-type" onSubmit={submitText}>
          <input dir="ltr" value={typedText} onChange={(event) => setTypedText(event.target.value)} placeholder="Type what you want to say…" autoFocus />
          <button type="submit">إرسال</button>
        </form>
      ) : null}

      {helpOpen ? (
        <section className="sp-help-sheet" aria-label="مساعدة المحادثة">
          <strong>أساعدك إزاي؟</strong>
          <button type="button" onClick={() => askForHelp('simplify')}>قولها أبسط</button>
          <button type="button" onClick={() => askForHelp('arabic')}>اشرح بالعربي</button>
          <button type="button" onClick={() => askForHelp('example')}>اديني مثال</button>
          <button type="button" onClick={() => askForHelp('say-it')}>أقولها إزاي؟</button>
        </section>
      ) : null}

      <div className="sp-live-controls">
        <button type="button" className="sp-live-control" onClick={() => setKeyboardOpen((value) => !value)} disabled={!transport.current?.connected || status !== 'listening'}>
          <ProductIcon name="keyboard" size={30} /><strong>لوحة المفاتيح</strong>
        </button>
        <button
          type="button"
          className={`sp-live-mic${learnerTurn ? ' is-active' : ''}`}
          onClick={toggleMic}
          aria-label={status === 'speaking' ? 'مقاطعة Otti' : micOpen ? 'إيقاف الميكروفون' : 'تشغيل الميكروفون'}
          disabled={status === 'connecting' || status === 'reconnecting' || status === 'error' || ending}
          style={{ opacity: Math.max(0.82, Math.min(1, 0.86 + micLevel * 0.14)) }}
        >
          <ProductIcon name="speak" size={56} />
        </button>
        <button type="button" className="sp-live-control" onClick={() => setHelpOpen((value) => !value)} disabled={!transport.current?.connected || status !== 'listening'}>
          <span className="sp-question-icon">?</span><strong>مش فاهم</strong>
        </button>
      </div>
    </section>
  );
}
