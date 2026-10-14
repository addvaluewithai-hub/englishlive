import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/LocaleProvider';
import type { PracticeMissionContract } from '../types';
import { dialogueTranslation, lessonDialogue } from '../audio/lessonDialogue';
import { fetchLessonAudio } from '../audio/fetchLessonAudio';
import './practiceIntroduction.css';

type Page = 'scene' | 'listen';
const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0');
};
const sceneEmoji: Record<string, string> = {
  'food-shopping': '☕', 'people-social': '👋', everyday: '💬',
  'travel-transport': '🧳', 'plans-leisure': '🎬',
  'work-study': '💼', 'home-services': '🏡',
};

export function PracticeIntroduction({ mission, onClose, onStart }: {
  mission: PracticeMissionContract;
  onClose: () => void;
  onStart: (relaxed: boolean) => void;
}) {
  const { locale } = useI18n();
  const ar = locale === 'ar';
  const [page, setPage] = useState<Page>('scene');
  const [showTranslation, setShowTranslation] = useState(false);
  const [relaxed, setRelaxed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);
  const promiseRef = useRef<Promise<string> | null>(null);
  const script = lessonDialogue(mission);
  const moves = mission.briefing
    ? (ar ? mission.briefing.requiredMovesAr : mission.briefing.requiredMovesEn)
    : mission.beats.filter((beat) => beat.type === 'required')
      .map((beat) => ar ? beat.overviewAr || beat.learnerIntentEn : beat.learnerIntentEn);
  const role = ar ? mission.learnerRoleAr : 'The learner';
  const partner = ar ? mission.aiRoleAr : 'Your conversation partner';

  function loadAudio() {
    if (urlRef.current) return Promise.resolve(urlRef.current);
    if (promiseRef.current) return promiseRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setAudioError(false);
    const task = fetchLessonAudio(mission.slug, controller.signal).then((blob) => {
      if (controller.signal.aborted) throw new Error('Cancelled');
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      return url;
    }).catch((reason) => {
      if (!controller.signal.aborted) setAudioError(true);
      throw reason;
    }).finally(() => {
      promiseRef.current = null;
      if (!controller.signal.aborted) setLoading(false);
    });
    promiseRef.current = task;
    return task;
  }

  useEffect(() => {
    if (page !== 'listen' || import.meta.env.VITE_VISUAL_QA === '1') return;
    // Prefetch when opening the listen screen. There is no Gemini Live socket.
    void loadAudio().catch(() => undefined);
  }, [page]);

  useEffect(() => () => {
    abortRef.current?.abort();
    audioRef.current?.pause();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  function goScene() {
    audioRef.current?.pause();
    setPlaying(false);
    setPage('scene');
  }

  async function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) { audio.pause(); return; }
    try {
      const url = await loadAudio();
      if (audio.src !== url) audio.src = url;
      audio.playbackRate = speed;
      await audio.play();
    } catch {
      // On browsers that reject delayed autoplay, the play button remains available.
      setPlaying(false);
      if (!abortRef.current?.signal.aborted) setAudioError(true);
    }
  }

  function changeSpeed() {
    const next = speed === 1 ? 0.75 : speed === 0.75 ? 1.25 : 1;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  function startTalking() {
    audioRef.current?.pause();
    setPlaying(false);
    onStart(relaxed);
  }

  return <section className="practice-intro" aria-label={ar ? 'مقدمة الموقف' : 'Scenario introduction'}>
    <header className="practice-intro-header">
      <button className="practice-intro-close" type="button" onClick={page === 'listen' ? goScene : onClose}
        aria-label={page === 'listen' ? (ar ? 'الرجوع للموقف' : 'Back to scenario') : (ar ? 'إغلاق' : 'Close')}>
        {page === 'listen' ? '‹' : '×'}
      </button>
      <strong>{ar ? mission.titleAr : mission.titleEn}</strong>
      <span className="practice-intro-level" dir="ltr">{mission.level}</span>
    </header>

    {page === 'scene' ? <div className="practice-intro-scene">
      <section className="practice-intro-hero">
        <div className="practice-intro-illustration" aria-hidden="true">
          <span className="practice-intro-illustration-icon">{sceneEmoji[mission.worldId] || '💬'}</span>
          <span className="practice-intro-illustration-chat">···</span>
        </div>
        <h1>{ar ? mission.titleAr : mission.titleEn}</h1>
        <p>{ar ? mission.briefing?.situationAr || mission.settingAr :
          mission.briefing?.situationEn || mission.titleEn}</p>
        <div className="practice-intro-details">
          <div><small>{ar ? 'دورك' : 'Your role'}</small><b>{role}</b></div>
          <div><small>{ar ? 'الطرف الآخر' : 'Partner'}</small><b>{partner}</b></div>
          <div><small>{ar ? 'الهدف' : 'Goal'}</small><b>{ar ? mission.goalAr : mission.briefing?.successEn || mission.titleEn}</b></div>
        </div>
      </section>
      <section className="practice-intro-objectives">
        <div className="practice-intro-section-heading"><span aria-hidden="true">◈</span>
          <div><h2>{ar ? 'قبل ما تبدأ' : 'Before you start'}</h2>
            <p>{ar ? 'دي فرص للكلام، مش امتحان ولا ترتيب إجباري.' :
              'These are opportunities, not a test or required sequence.'}</p></div>
        </div>
        <ol>{moves.map((step, index) => <li key={index}>
          <span>{index + 1}</span>{step}</li>)}</ol>
        <label className="practice-intro-relaxed">
          <input type="checkbox" checked={relaxed} onChange={(event) => setRelaxed(event.target.checked)}/>
          {ar ? 'وقت تفكير أطول أثناء الكلام' : 'Allow more thinking time when speaking'}
        </label>
      </section>
    </div> : <div className="practice-intro-listening">
      <section className="practice-intro-player-card">
        <span className="practice-intro-round-icon" aria-hidden="true">♫</span>
        <h1>{ar ? 'اسمع المحادثة' : 'Listen to the conversation'}</h1>
        <p>{ar ? 'مثال تمثيلي بصوتين مختلفين. مش لازم تكرر نفس الكلام.' :
          'A two-person example. You can say things your own way.'}</p>
        <div className="practice-intro-cast">
          <div><span className="practice-intro-avatar" aria-hidden="true">👩‍💼</span>
            <div><b>{ar ? 'الطرف الآخر' : 'Partner'}</b><small>{partner}</small></div></div>
          <span className="practice-intro-cast-separator" aria-hidden="true"/>
          <div><span className="practice-intro-avatar" aria-hidden="true">🧑</span>
            <div><b>{ar ? 'المتعلّم' : 'Learner'}</b><small>{role}</small></div></div>
        </div>
        <audio ref={audioRef} preload="none"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setAt(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)} />
        <div className="practice-intro-player">
          <button type="button" className="practice-intro-play" aria-label={playing
            ? (ar ? 'إيقاف مؤقت' : 'Pause') : (ar ? 'تشغيل المحادثة' : 'Play conversation')}
            onClick={() => void toggleAudio()} disabled={loading && !urlRef.current}>
            {loading ? '…' : playing ? 'Ⅱ' : '▶'}
          </button>
          <div className="practice-intro-seek">
            <input aria-label={ar ? 'الانتقال في التسجيل' : 'Seek recording'} type="range"
              min="0" max={Number.isFinite(duration) && duration > 0 ? duration : 1}
              step="0.1" value={Math.min(at, Number.isFinite(duration) && duration > 0 ? duration : 1)}
              disabled={!duration}
              onChange={(event) => {
                if (audioRef.current) audioRef.current.currentTime = Number(event.target.value);
                setAt(Number(event.target.value));
              }}/>
            <div className="practice-intro-time"><span dir="ltr">{formatTime(at)}</span>
              <span dir="ltr">{duration ? formatTime(duration) : '--:--'}</span></div>
          </div>
          <button type="button" className="practice-intro-speed" onClick={changeSpeed}
            aria-label={ar ? 'سرعة التسجيل' : 'Playback speed'}>{speed}×</button>
        </div>
        {loading ? <p role="status" className="practice-intro-loading">{ar
          ? 'بنجهّز التسجيل… أول مرة ممكن تاخد شوية وقت.'
          : 'Preparing the recording… The first time may take a moment.'}</p> : null}
        {audioError ? <div role="alert" className="practice-intro-audio-error">
          <p>{ar ? 'مش قادرين نشغّل التسجيل دلوقتي. ممكن تعيد المحاولة أو تبدأ الكلام مباشرة.' :
            'Audio is unavailable. Retry, or start speaking directly.'}</p>
          <button type="button" onClick={() => void loadAudio().catch(() => undefined)}>{ar ? 'جرّب تاني' : 'Retry'}</button>
        </div> : null}
      </section>
      <section className="practice-intro-transcript">
        <header><div><h2>{ar ? 'نص المحادثة' : 'Conversation transcript'}</h2>
          <p>{ar ? 'اقرأ المثال وأنت بتسمع.' : 'Follow the example as you listen.'}</p></div>
          <label className="practice-intro-translation-toggle"><input type="checkbox"
            checked={showTranslation} onChange={(event) => setShowTranslation(event.target.checked)} />
            {ar ? 'الترجمة' : 'Arabic translation'}</label>
        </header>
        <ol>{script.map((turn, index) => <li key={index} className={turn.speaker === 'Learner'
          ? 'is-learner' : 'is-partner'}>
          <div className="practice-intro-transcript-label">
            <span className="practice-intro-mini-avatar" aria-hidden="true">{turn.speaker === 'Learner' ? '🧑' : '👩‍💼'}</span>
            <b>{turn.speaker === 'Learner' ? (ar ? 'المتعلّم' : 'Learner') : (ar ? 'الطرف الآخر' : 'Partner')}</b>
          </div>
          <p lang="en" dir="ltr">{turn.text}</p>
          {showTranslation && dialogueTranslation(mission, index)
            ? <small lang="ar" dir="rtl">{dialogueTranslation(mission, index)}</small> : null}
        </li>)}</ol>
      </section>
    </div>}

    <footer className="practice-intro-actions">
      {page === 'scene' ? <button type="button" className="practice-intro-primary"
          onClick={() => setPage('listen')}>♫ {ar ? 'اسمع المحادثة أولًا' : 'Listen to the conversation'}</button> : null}
      <button type="button" className={page === 'listen' ? 'practice-intro-primary' : 'practice-intro-secondary'}
        onClick={startTalking}>🎙 {ar ? 'ابدأ التحدث الآن' : 'Start speaking now'}</button>
    </footer>
  </section>;
}
