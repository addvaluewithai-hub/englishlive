import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { OttiMark } from '../character/otti/OttiMark';
import { ProductIcon } from '../components/ProductIcon';
import { analyzeSpeakingSession, fetchSpeakingSession } from '../speaking/api';
import { speakingAssets } from '../speaking/assets';
import type { SpeakingCloudSession } from '../speaking/types';

interface RecapLocationState {
  session?: SpeakingCloudSession;
}

const skillCopy: Record<string, string> = {
  initiate: 'تبدأ الحوار',
  respond: 'ترد بشكل مناسب',
  followup: 'تسأل سؤال متابعة',
  maintain: 'تكمل الحوار',
  develop: 'تطوّر فكرتك',
  close: 'تنهي الحوار طبيعي',
  clarify: 'تطلب أو تقدم توضيح',
  repair: 'تتعامل مع سوء الفهم',
  explain: 'تشرح اللي تقصده',
  request_negotiate: 'تطلب وتتفاوض',
  solve: 'توصل لحل',
  opinion: 'تعبر عن رأيك',
};

function durationLabel(seconds: number) {
  if (seconds < 60) return `${Math.max(1, seconds)} ثانية`;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
}

export function SpeakingRecapScreen() {
  const { sessionId = '' } = useParams();
  const location = useLocation();
  const state = location.state as RecapLocationState | null;
  const [session, setSession] = useState<SpeakingCloudSession | null>(state?.session ?? null);
  const [loading, setLoading] = useState(!state?.session);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(
    state?.session?.analysisStatus === 'error' && !state.session.analysis
      ? 'المحادثة محفوظة، بس التحليل محتاج إعادة محاولة.'
      : null,
  );

  useEffect(() => {
    if (!sessionId || state?.session) return;
    let cancelled = false;
    setLoading(true);
    void fetchSpeakingSession(sessionId)
      .then((value) => {
        if (cancelled) return;
        setSession(value);
        if (!value.analysis && value.analysisStatus === 'error') {
          setError('المحادثة محفوظة، بس التحليل محتاج إعادة محاولة.');
        }
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'تعذر تحميل ملخص المحادثة.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [sessionId, state?.session]);

  async function retryAnalysis() {
    if (!sessionId || retrying) return;
    setRetrying(true);
    setError(null);
    try {
      const analyzed = await analyzeSpeakingSession(sessionId);
      setSession(analyzed);
      if (!analyzed.analysis) setError('المحادثة محفوظة، لكن التحليل ماكملش. جرّبه مرة كمان.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'التحليل ماكملش.');
    } finally {
      setRetrying(false);
    }
  }

  if (loading) {
    return (
      <section className="fs-recap-loading" dir="rtl">
        <OttiMark />
        <strong>بنجهّز ملخص الموقف…</strong>
        <span><i /><i /><i /></span>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <h1>مش قادرين نفتح الملخص</h1>
        <p>{error || 'ارجع للمحادثة وجرّب تفتح الموقف تاني.'}</p>
        <Link className="v2-primary-button" to="/speak">الرجوع للمحادثة</Link>
      </section>
    );
  }

  const recap = session.analysis;
  const usefulEvidence = recap?.evidence.filter((item) => item.outcome !== 'not_observed') ?? [];

  return (
    <section className="fs-recap sp-scenario-recap" dir="rtl">
      <header className="fs-recap-hero">
        <div className="fs-recap-art"><img src={speakingAssets.ottiProgress} alt="Otti" /></div>
        <div className="fs-recap-copy">
          <span className="sp-eyebrow">{session.scenarioSnapshot.titleAr}</span>
          <h1>{recap?.headlineAr || 'الموقف اتحفظ!'}</h1>
          <strong>اتكلمت <em>{durationLabel(session.durationSeconds)}</em></strong>
          <p>{recap?.summaryAr || 'المحادثة اتحفظت كاملة. جهّز التحليل عشان نطلع أهم حاجة اتدربت عليها.'}</p>
        </div>
      </header>

      {!recap ? (
        <section className={`fs-recap-pending${session.analysisStatus === 'error' ? ' is-error' : ''}`}>
          <OttiMark />
          <div>
            <strong>المحادثة محفوظة بالكامل.</strong>
            <p>التحليل يشتغل على نفس الـtranscript من غير ما تعيد الموقف.</p>
            {error ? <small role="alert">{error}</small> : null}
          </div>
          <button type="button" onClick={() => void retryAnalysis()} disabled={retrying}>
            {retrying ? 'بنحلل…' : 'جهّز الملخص'}
          </button>
        </section>
      ) : (
        <>
          {recap.strengths.length ? (
            <section className="fs-recap-card fs-strength-card">
              <span className="fs-recap-card-icon">★</span>
              <div><h2>عملت كويس</h2><ul>{recap.strengths.map((item) => <li key={item}><span><ProductIcon name="check" size={17} /></span>{item}</li>)}</ul></div>
            </section>
          ) : null}

          {usefulEvidence.length ? (
            <section className="fs-recap-card sp-evidence-card">
              <span className="fs-recap-card-icon">💬</span>
              <div>
                <h2>اللي ظهر في المحادثة</h2>
                <div className="sp-evidence-list">
                  {usefulEvidence.map((item) => (
                    <article key={item.skillId} className={`is-${item.outcome}`}>
                      <strong>{skillCopy[item.skillId] ?? item.skillId}</strong>
                      <span>{item.outcome === 'demonstrated' ? 'ظهر بوضوح' : 'بدأ يظهر'}</span>
                      <p>{item.evidenceAr}</p>
                      {item.learnerExcerpt ? <bdi dir="ltr">“{item.learnerExcerpt}”</bdi> : null}
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {recap.corrections.length ? (
            <section className="fs-recap-card fs-corrections-card">
              <span className="fs-recap-card-icon">💡</span>
              <div>
                <h2>حاجة واحدة تتحسن</h2>
                <div className="fs-correction-list">
                  {recap.corrections.map((item, index) => (
                    <article key={`${item.original}-${index}`}>
                      <span className="is-wrong">× <bdi dir="ltr">{item.original}</bdi></span>
                      <span className="fs-correction-arrow">←</span>
                      <span className="is-right">✓ <bdi dir="ltr">{item.improved}</bdi></span>
                      {item.noteAr ? <small>{item.noteAr}</small> : null}
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {recap.vocabulary.length ? (
            <section className="fs-recap-card fs-words-card" id="speaking-words">
              <span className="fs-recap-card-icon"><ProductIcon name="learn" size={34} /></span>
              <div>
                <h2>كلمات من المحادثة</h2>
                <div className="fs-word-chips">
                  {recap.vocabulary.map((item) => <span key={`${item.word}-${item.source}`} title={item.meaningAr}><bdi dir="ltr">{item.word}</bdi></span>)}
                </div>
              </div>
            </section>
          ) : null}

          {recap.nextFocusAr ? <section className="fs-next-focus"><strong>المرة الجاية</strong><span>{recap.nextFocusAr}</span></section> : null}
        </>
      )}

      <div className="fs-recap-actions">
        <Link className="fs-recap-primary" to={`/speak/scenario/${session.scenarioId}`}><span>جرّب الموقف تاني</span><ProductIcon name="chevron" size={24} /></Link>
        <Link className="fs-recap-secondary" to="/speak/progress"><ProductIcon name="speak" size={24} /><span>شوف تقدم المحادثة</span></Link>
      </div>
    </section>
  );
}
