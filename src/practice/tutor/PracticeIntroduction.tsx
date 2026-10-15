import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/LocaleProvider';
import type { PracticeMissionContract } from '../types';
import { dialogueTranslation, lessonDialogue } from '../audio/lessonDialogue';
import { fetchLessonAudio } from '../audio/fetchLessonAudio';
import './practiceIntroduction.css';

type Page = 'scene' | 'listen';
// Scenario photography (Pexels / Emre Akyol, free-use license), mirrored into
// our existing Cloudinary media library so the app owns a stable, optimized URL.
const CAFE_SCENE_PHOTO = 'https://res.cloudinary.com/as9o12al/image/upload/f_auto,q_auto,w_960/v1792043829/lesson-b1-wrong-order-cafe.jpg';

function SpeakerPortrait({ staff = false, small = false }: { staff?: boolean; small?: boolean }) {
  return <svg aria-hidden="true" focusable="false"
      className={small ? 'practice-intro-portrait is-small' : 'practice-intro-portrait'}
      viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="23" fill={staff ? '#d8f4ef' : '#e2f0fa'} />
    <path d="M8 45c2-11 9-15 16-15s14 4 16 15" fill={staff ? '#006c68' : '#347c94'}/>
    <path d="M13 21c-1-11 4-17 12-17 9 0 13 8 11 17l-4 6H16Z" fill={staff ? '#322d3a' : '#273943'}/>
    <ellipse cx="24" cy="23" rx="10" ry="12" fill="#dfab8d"/>
    <path d="M14 20c1-10 8-15 16-11 3 2 4 5 4 8-8 1-14-1-19-5Z" fill={staff ? '#322d3a' : '#273943'}/>
    <circle cx="20" cy="23" r="1.15" fill="#2b2832"/>
    <circle cx="28" cy="23" r="1.15" fill="#2b2832"/>
    <path d="M21 29q3 3 6 0" stroke="#9a4d4b" strokeWidth="1.7" fill="none" strokeLinecap="round"/>
    {staff ? <path d="M15 34L24 39 33 34" stroke="#fff" strokeWidth="2.2" fill="none"/> : null}
  </svg>;
}
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
  const role = ar ? (mission.slug === 'b1-resolve-wrong-order' ? 'الزبون' : mission.learnerRoleAr) : 'The customer';
  const partner = ar ? mission.aiRoleAr : 'Staff member';
  const shortGoal = ar ? (mission.slug === 'b1-resolve-wrong-order' ? 'اشرح المشكلة واتفق على حل' : mission.titleAr) : mission.titleEn;

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
      setAudioError(false);
    } catch (reason) {
      // Browsers may reject play after a delayed first fetch. The user can tap again.
      setPlaying(false);
      if (reason instanceof Error && reason.name === 'NotAllowedError') return;
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
      <strong dir="auto">{ar ? mission.titleAr : mission.titleEn}</strong>
      <span className="practice-intro-level" dir="ltr">{mission.level}</span>
    </header>

    {page === 'scene' ? <div className="practice-intro-scene">
      <section className="practice-intro-hero">
        <div className={`practice-intro-illustration${mission.worldId === 'food-shopping' ? ' is-photo' : ''}`} aria-hidden="true">
          <span className="practice-intro-illustration-icon">{sceneEmoji[mission.worldId] || '💬'}</span>
          {mission.worldId === 'food-shopping'
            ? <><img className="practice-intro-scene-photo" src={CAFE_SCENE_PHOTO} alt="" decoding="async" />
                <span className="practice-intro-warning-mark">⚠</span></>
            : <span className="practice-intro-illustration-chat">···</span>}
        </div>
        <h1>{ar && mission.slug === 'b1-resolve-wrong-order' ? 'هناك مشكلة في طلبك' : (ar ? mission.titleAr : mission.titleEn)}</h1>
        <p>{ar ? mission.briefing?.situationAr || mission.settingAr :
          mission.briefing?.situationEn || mission.titleEn}</p>
        <div className="practice-intro-details">
          <div><small>{ar ? 'دورك' : 'Your role'}</small><b>{role}</b></div>
          <div><small>{ar ? 'الطرف الآخر' : 'Partner'}</small><b>{partner}</b></div>
          <div><small>{ar ? 'الهدف' : 'Goal'}</small><b>{shortGoal}</b></div>
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
          <div><SpeakerPortrait staff />
            <div><b>{ar ? 'الموظف' : 'Staff member'}</b><small>{partner}</small></div></div>
          <span className="practice-intro-cast-separator" aria-hidden="true"/>
          <div><SpeakerPortrait />
            <div><b>{ar ? 'إنت' : 'You'}</b><small>{role}</small></div></div>
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
            <input dir="ltr" aria-label={ar ? 'الانتقال في التسجيل' : 'Seek recording'} type="range"
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
            <SpeakerPortrait staff={turn.speaker !== 'Learner'} small />
            <b>{turn.speaker === 'Learner' ? (ar ? 'إنت' : 'You') : (ar ? 'الموظف' : 'Partner')}</b>
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
