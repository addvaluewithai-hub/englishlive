import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MicrophonePcmStream } from '../audio/MicrophonePcmStream';
import { PcmPlaybackQueue } from '../audio/PcmPlaybackQueue';
import { CharacterHost, type CharacterHostHandle } from '../character/CharacterHost';
import { CharacterPerformanceController } from '../character/CharacterPerformanceController';
import { OttiMark } from '../character/otti/OttiMark';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { loadPublishedCharacter } from '../content/client';
import {
  completeFreeSpeakSession,
  createFreeSpeakSession,
  fetchFreeSpeakSession,
  saveFreeSpeakTranscript,
} from '../freeSpeak/api';
import { getFreeSpeakMode } from '../freeSpeak/modes';
import type { FreeSpeakSpeaker, FreeSpeakTurn } from '../freeSpeak/types';
import { GeminiLiveTransport } from '../live/GeminiLiveTransport';
import type { LiveStatus } from '../live/types';
import { buildRelationshipPrompt } from '../memory/context';
import { RelationshipMemoryCollector } from '../memory/RelationshipMemoryCollector';
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

function turnId(speaker: FreeSpeakSpeaker) {
  if (typeof crypto.randomUUID === 'function') return `${speaker}-${crypto.randomUUID()}`;
  return `${speaker}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const statusCopy: Record<LiveStatus, { title: string; body: string }> = {
  idle: { title: 'جاهز؟', body: 'ابدأ لما تكون مستعد' },
  connecting: { title: 'بنجهز المحادثة', body: 'ثواني وهنبدأ' },
  listening: { title: 'دورك الآن', body: 'المايك مفتوح — اتكلم براحتك' },
  speaking: { title: 'المدرس بيتكلم', body: 'لو عايز تقاطعه اضغط الزرار' },
  reconnecting: { title: 'بنرجّع الاتصال', body: 'المحادثة محفوظة' },
  error: { title: 'حصلت مشكلة بسيطة', body: 'جرّب تبدأ تاني' },
};

const modeUiCopy: Record<string, { title: string; body: string }> = {
  'just-chat': { title: 'دردشة عادية', body: 'محادثة مفتوحة عن أي موضوع مألوف.' },
  work: { title: 'محادثة عمل', body: 'كلام طبيعي عن الشغل والاجتماعات والخطط والقرارات.' },
  travel: { title: 'السفر والمواقف اليومية', body: 'مواقف تلقائية في السفر والخدمات والأماكن الجديدة.' },
  interview: { title: 'تدريب مقابلة', body: 'مقابلة واقعية وداعمة، من غير درجات أو تقييم مستوى.' },
};

export function FreeSpeakSessionScreen() {
  const { modeId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const profile = readLearnerProfile();
  const character = getCharacterDefinition(params.get('character') ?? profile?.characterId);
  const mode = getFreeSpeakMode(modeId);
  const modeCopy = modeUiCopy[mode.id] ?? { title: mode.title, body: mode.description };
  const resumeSessionId = params.get('resume');

  const host = useRef<CharacterHostHandle | null>(null);
  const transport = useRef<GeminiLiveTransport | null>(null);
  const microphone = useRef<MicrophonePcmStream | null>(null);
  const playback = useRef<PcmPlaybackQueue | null>(null);
  const performer = useRef<CharacterPerformanceController | null>(null);
  const cloudSessionId = useRef<string | null>(null);
  const startedAtMs = useRef<number | null>(null);
  const turnsRef = useRef<FreeSpeakTurn[]>([]);
  const learnerDraftRef = useRef('');
  const teacherDraftRef = useRef('');
  const saveTimer = useRef<number | null>(null);
  const exchangeRef = useRef<HTMLDivElement | null>(null);
  const manualInterrupt = useRef(false);

  const [status, setStatus] = useState<LiveStatus>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [micOpen, setMicOpen] = useState(false);
  const [turns, setTurns] = useState<FreeSpeakTurn[]>([]);
  const [learnerDraft, setLearnerDraft] = useState('');
  const [teacherDraft, setTeacherDraft] = useState('');
  const [teacherDisplayName, setTeacherDisplayName] = useState(character.name);
  const [relationshipProposal, setRelationshipProposal] = useState<RelationshipMemoryProposal | null>(null);
  const [startedOnce, setStartedOnce] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [typedText, setTypedText] = useState('');
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
      const snapshot = turnsRef.current;
      void saveFreeSpeakTranscript(sessionId, snapshot, durationSeconds()).catch(() => undefined);
    }, 650);
  }

  function pushTurn(speaker: FreeSpeakSpeaker, text: string) {
    const value = text.trim();
    if (!value) return;
    const previous = turnsRef.current.at(-1);
    if (previous?.speaker === speaker && previous.text === value) return;
    const turn: FreeSpeakTurn = {
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
    setTeacherDisplayName(character.name);
  }, [character.id, character.name]);

  useEffect(() => {
    const container = exchangeRef.current;
    if (!container) return;
    const frame = window.requestAnimationFrame(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      container.scrollTo({ top: container.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [turns, learnerDraft, teacherDraft]);

  useEffect(() => {
    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
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
    setMicLevel(0);
    setMicOpen(false);
  }

  async function startLive() {
    if (status !== 'idle' && status !== 'error') return;
    setStatus('connecting');
    setError(null);
    setRelationshipProposal(null);
    setMicOpen(false);
    turnsRef.current = [];
    setTurns([]);
    learnerDraftRef.current = '';
    teacherDraftRef.current = '';
    setLearnerDraft('');
    setTeacherDraft('');
    manualInterrupt.current = false;

    const publishedCharacter = await loadPublishedCharacter(character);
    const characterConfig = publishedCharacter.content;
    const teacherName = characterConfig.displayName?.trim() || character.name;
    setTeacherDisplayName(teacherName);

    const memoryCollector = new RelationshipMemoryCollector(setRelationshipProposal);
    const characterPerformance = new CharacterPerformanceController(() => host.current);
    performer.current = characterPerformance;

    let live: GeminiLiveTransport;
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

    live = new GeminiLiveTransport(
      {
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
          characterPerformance.interrupt();
          setLearnerMicEnabled(true);
          setStatus('listening');
        },
        onTurnComplete: () => {
          manualInterrupt.current = false;
          flushTeacherDraft();
          queue.markTurnComplete();
        },
        onError: setError,
      },
      [memoryCollector.tool],
    );
    transport.current = live;

    const mic = new MicrophonePcmStream();
    mic.setEnabled(false);
    microphone.current = mic;

    const learnerContext = profile
      ? `The learner's first name is ${profile.firstName || 'not provided'}. Their main reason for English is to ${goalPrompt(profile.goals[0] ?? 'everyday')}. Their self-description is: ${comfortLabel(profile.comfort)} Use this only to pace the conversation naturally.`
      : 'No learner profile is available. Keep the conversation on familiar, accessible topics.';
    const relationshipContext = buildRelationshipPrompt(undefined, character.id);
    let resumeContext = '';
    if (resumeSessionId) {
      try {
        const previous = await fetchFreeSpeakSession(resumeSessionId);
        if (previous.analysis) {
          resumeContext = `Previous Free Speak context: the last conversation topic was "${previous.analysis.conversationTopicAr}". Summary: ${previous.analysis.summaryAr}. Continue that thread only if it feels natural; do not pretend the learner said anything beyond this summary.`;
        }
      } catch {
        resumeContext = '';
      }
    }

    const freeSpeakPrompt = `FREE SPEAK MODE\nThis is intentionally outside the structured course. Do not call lesson or mission assessment tools, do not claim course progress, and do not give a numeric proficiency score. ${mode.prompt} Conversation comes first. Do not interrupt the learner to correct ordinary mistakes. Prefer natural recasts when useful. Correct explicitly only when meaning breaks down, the learner asks, or a repeated error is blocking the conversation. Never claim precise pronunciation, accent or intonation quality. Keep your turns concise enough to give the learner plenty of speaking time.`;
    const persona = characterConfig.personaPrompt?.trim() || character.persona.style;
    const teachingStyle = characterConfig.teachingStylePrompt?.trim();
    const characterPrompt = [
      `You are ${teacherName}, ${persona}. Be a natural adult English conversation partner.`,
      'Speak English by default; if the learner explicitly asks for a brief Arabic clarification, clarify briefly in Egyptian Arabic and return to English.',
      'Respond to meaning rather than sounding like an assistant.',
      `Never call yourself another character name; when referring to yourself, always use ${teacherName}.`,
      'The learner microphone is intentionally closed while you are audibly speaking. The learner can explicitly interrupt you with the app button; otherwise finish one concise conversational turn, stop, and give them space to answer.',
      teachingStyle,
    ].filter(Boolean).join(' ');

    try {
      await queue.unlock();
      await live.connect(`${characterPrompt}\n\n${learnerContext}\n\n${relationshipContext}\n\n${resumeContext}\n\n${memoryCollector.systemPrompt}\n\n${freeSpeakPrompt}`, {
        voiceName: characterConfig.voiceName ?? undefined,
      });
      const cloudSession = await createFreeSpeakSession({ modeId: mode.id, characterSlug: character.id });
      cloudSessionId.current = cloudSession.id;
      startedAtMs.current = Date.now();
      await mic.start((chunk) => live.sendAudio(chunk), setMicLevel);
      setStartedOnce(true);
      live.sendText(`Start ${mode.title} naturally. Greet the learner briefly and make one genuine conversational move. Do not explain the mode or give instructions.`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not start Free Speak.';
      setError(message);
      setStatus('error');
      await stopTransport();
    }
  }

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

  function sendTypedText() {
    const value = typedText.trim();
    if (!value || !transport.current?.connected || status !== 'listening' || !micOpen) return;
    flushLearnerDraft();
    pushTurn('learner', value);
    transport.current.sendText(value);
    setTypedText('');
    setKeyboardOpen(false);
  }

  function askForClarification() {
    if (!transport.current?.connected || status !== 'listening' || !micOpen) return;
    transport.current.sendText('I did not understand your last turn. Briefly clarify only that last point in Egyptian Arabic, then return to English and continue naturally.');
  }

  async function finishConversation() {
    if (ending) return;
    if (!startedOnce || !cloudSessionId.current) {
      navigate('/speak');
      return;
    }
    setEnding(true);
    flushLearnerDraft();
    flushTeacherDraft();
    const sessionId = cloudSessionId.current;
    const snapshot = turnsRef.current;
    const seconds = durationSeconds();
    await stopTransport();
    try {
      const completed = await completeFreeSpeakSession(sessionId, snapshot, seconds);
      navigate(`/speak/recap/${sessionId}`, {
        replace: true,
        state: { session: completed, relationshipProposal },
      });
    } catch {
      try {
        await saveFreeSpeakTranscript(sessionId, snapshot, seconds);
      } catch {
        // The transcript remains stored in memory for this navigation and the cloud autosave may already contain it.
      }
      navigate(`/speak/recap/${sessionId}`, {
        replace: true,
        state: { relationshipProposal },
      });
    }
  }

  const connecting = status === 'connecting' || status === 'reconnecting';
  const liveConversation = status === 'listening' || status === 'speaking';
  const teacherSpeaking = status === 'speaking';
  const learnerTurn = status === 'listening' && micOpen;
  const statusText = statusCopy[status];
  const visibleTurns: FreeSpeakTurn[] = [
    ...turns,
    ...(learnerDraft.trim() ? [{ id: 'draft-learner', speaker: 'learner' as const, text: learnerDraft, atMs: durationSeconds() * 1_000 }] : []),
    ...(teacherDraft.trim() ? [{ id: 'draft-teacher', speaker: 'teacher' as const, text: teacherDraft, atMs: durationSeconds() * 1_000 }] : []),
  ].slice(-8);

  return (
    <section className="fs-live" dir="rtl">
      <header className="fs-live-header">
        <button type="button" className="fs-live-close" onClick={() => void finishConversation()} aria-label="إنهاء المحادثة">
          <ProductIcon name="close" size={28} />
        </button>
        <div className="fs-live-brand" aria-label="Englotti">
          <OttiMark />
          <strong>Englotti</strong>
        </div>
        <strong className="fs-live-title">المحادثة الحرة</strong>
        <span className="fs-live-mode"><ProductIcon name="speak" size={20} /> {modeCopy.title}</span>
      </header>

      <div className="fs-live-stage">
        <div className="fs-live-character">
          <CharacterHost ref={host} character={character} className="fs-live-character-host" />
        </div>

        <div className={`fs-live-status status-${status}${learnerTurn ? ' is-open' : ''}`} aria-live="polite">
          <span className="fs-live-wave" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>{statusText.title}</strong><small>{statusText.body}</small></span>
        </div>

        <button type="button" className="fs-history-button" onClick={() => setHistoryOpen(true)} aria-label="سجل المحادثة">
          <span aria-hidden="true">↶</span>
        </button>

        <div ref={exchangeRef} className="fs-exchange" aria-live="polite">
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
              <p>{startedOnce ? 'المحادثة هتظهر هنا رسالة وراء رسالة.' : modeCopy.body}</p>
            </article>
          )}
        </div>
      </div>

      <div className="fs-live-controls">
        {keyboardOpen ? (
          <form className="fs-type-row" onSubmit={(event) => { event.preventDefault(); sendTypedText(); }}>
            <input
              value={typedText}
              onChange={(event) => setTypedText(event.target.value)}
              placeholder="اكتب اللي عايز تقوله بالإنجليزي…"
              autoFocus
            />
            <button type="submit" disabled={!typedText.trim() || !learnerTurn}>إرسال</button>
          </form>
        ) : null}

        <div className="fs-control-row">
          <button
            type="button"
            className="fs-help-control"
            onClick={askForClarification}
            disabled={!learnerTurn}
          >
            <span>؟</span>
            <strong>مش فاهم</strong>
          </button>

          <button
            type="button"
            className={`fs-mic-control${learnerTurn ? ' is-live' : ''}${teacherSpeaking ? ' is-interrupt' : ''}`}
            onClick={() => {
              if (teacherSpeaking) interruptTeacher();
              else if (status === 'idle' || status === 'error') void startLive();
            }}
            disabled={connecting || ending || (liveConversation && !teacherSpeaking)}
            aria-label={teacherSpeaking ? 'قاطع المدرس واتكلم' : learnerTurn ? 'دورك تتكلم' : 'ابدأ المحادثة'}
          >
            {teacherSpeaking ? (
              <><span className="fs-interrupt-bars" aria-hidden="true"><i /><i /></span><small>مقاطعة</small></>
            ) : (
              <><ProductIcon name="speak" size={54} /><small>{learnerTurn ? 'دورك' : !startedOnce && !connecting ? 'ابدأ' : 'استنى'}</small></>
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

      {historyOpen ? (
        <div className="fs-history-backdrop" role="presentation" onClick={() => setHistoryOpen(false)}>
          <aside className="fs-history-sheet" role="dialog" aria-modal="true" aria-label="سجل المحادثة" onClick={(event) => event.stopPropagation()}>
            <header><strong>سجل المحادثة</strong><button type="button" onClick={() => setHistoryOpen(false)}><ProductIcon name="close" size={22} /></button></header>
            <div className="fs-history-list">
              {turns.length ? turns.map((turn) => (
                <article key={turn.id} className={turn.speaker === 'learner' ? 'is-learner' : 'is-teacher'}>
                  <small>{turn.speaker === 'learner' ? 'أنت' : teacherDisplayName}</small>
                  <p dir="auto">{turn.text}</p>
                </article>
              )) : <p className="fs-history-empty">لسه ما بدأناش كلام.</p>}
            </div>
          </aside>
        </div>
      ) : null}

      {ending ? (
        <div className="fs-ending-overlay" aria-live="polite">
          <div><OttiMark /><strong>بنجهّز ملخص المحادثة…</strong><span><i /><i /><i /></span></div>
        </div>
      ) : null}
    </section>
  );
}
