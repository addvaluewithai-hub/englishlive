import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { OttiMark } from '../character/otti/OttiMark';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { analyzeFreeSpeakSession, fetchFreeSpeakSession } from '../freeSpeak/api';
import type { FreeSpeakCloudSession } from '../freeSpeak/types';
import { keepRelationshipMemory } from '../memory/store';
import type { RelationshipMemoryProposal } from '../memory/types';

interface RecapLocationState {
  session?: FreeSpeakCloudSession;
  relationshipProposal?: RelationshipMemoryProposal | null;
}

function durationLabel(seconds: number) {
  if (seconds < 60) return `${Math.max(1, seconds)} ثانية`;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
}

export function FreeSpeakRecapScreen() {
  const { sessionId = '' } = useParams();
  const location = useLocation();
  const state = location.state as RecapLocationState | null;
  const [session, setSession] = useState<FreeSpeakCloudSession | null>(state?.session ?? null);
  const [loading, setLoading] = useState(!state?.session);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(
    state?.session?.analysisStatus === 'error' && !state.session.analysis
      ? 'التحليل اللي فات ماكملش. جرّبه تاني من الزرار تحت.'
      : null,
  );
  const [relationshipProposal, setRelationshipProposal] = useState<RelationshipMemoryProposal | null>(state?.relationshipProposal ?? null);
  const [memorySaved, setMemorySaved] = useState(false);

  useEffect(() => {
    if (!sessionId || state?.session) return;
    let cancelled = false;
    setLoading(true);
    void fetchFreeSpeakSession(sessionId)
      .then((value) => {
        if (cancelled) return;
        setSession(value);
        if (!value.analysis && value.analysisStatus === 'error') {
          setError('التحليل اللي فات ماكملش. جرّبه تاني من الزرار تحت.');
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'تعذر تحميل ملخص المحادثة.');
        }
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
      const analyzed = await analyzeFreeSpeakSession(sessionId);
      setSession(analyzed);
      if (!analyzed.analysis) {
        setError('المحادثة محفوظة، لكن الملخص ماطلعش. جرّب مرة كمان.');
      }
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'التحليل ماكملش.';
      setError(`المحادثة محفوظة. سبب فشل التحليل: ${message}`);
    } finally {
      setRetrying(false);
    }
  }

  function saveRelationshipMemory() {
    if (!relationshipProposal || !session) return;
    keepRelationshipMemory(relationshipProposal, `free-speak:${session.id}`, session.characterSlug);
    setMemorySaved(true);
    setRelationshipProposal(null);
  }

  if (loading) {
    return (
      <section className="fs-recap-loading" dir="rtl">
        <OttiMark />
        <strong>بنجهّز ملخص المحادثة…</strong>
        <span><i /><i /><i /></span>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <h1>مش قادرين نفتح الملخص</h1>
        <p>{error || 'جرّب ترجع للمحادثة وتفتح آخر جلسة.'}</p>
        <Link className="v2-primary-button" to="/speak">الرجوع للمحادثة</Link>
      </section>
    );
  }

  const recap = session.analysis;
  const character = getCharacterDefinition(session.characterSlug);
  const analysisFailed = !recap && session.analysisStatus === 'error';

  return (
    <section className="fs-recap" dir="rtl">
      <header className="fs-recap-hero">
        <div className="fs-recap-art"><CharacterPortrait character={character} pose="celebrate" /></div>
        <div className="fs-recap-copy">
          <h1>{recap?.headlineAr || 'أحسنت!'}</h1>
          <strong>اتكلمت <em>{durationLabel(session.durationSeconds)}</em> اليوم</strong>
          <p>{recap?.summaryAr || 'المحادثة اتحفظت كاملة. جهّز الملخص عشان نطلع أهم الحاجات المفيدة منها.'}</p>
        </div>
      </header>

      {!recap ? (
        <section className={`fs-recap-pending${analysisFailed ? ' is-error' : ''}`}>
          <OttiMark />
          <div>
            <strong>{analysisFailed ? 'المحادثة محفوظة — التحليل محتاج إعادة محاولة.' : 'المحادثة محفوظة بالكامل.'}</strong>
            <p>{analysisFailed ? 'ولا كلمة من المحادثة ضاعت. هنستخدم نفس الـtranscription المحفوظة ونحللها من جديد.' : 'الملخص الذكي لسه ما اكتملش. تقدر تعيد التحليل من غير ما تعيد المحادثة.'}</p>
            {error ? <small role="alert">{error}</small> : null}
          </div>
          <button type="button" onClick={() => void retryAnalysis()} disabled={retrying}>
            {retrying ? 'بنحلل…' : analysisFailed ? 'حلّل المحادثة تاني' : 'جهّز الملخص'}
          </button>
        </section>
      ) : (
        <>
          {recap.strengths.length ? (
            <section className="fs-recap-card fs-strength-card">
              <span className="fs-recap-card-icon">★</span>
              <div>
                <h2>عملت كويس</h2>
                <ul>{recap.strengths.map((item) => <li key={item}><span><ProductIcon name="check" size={17} /></span>{item}</li>)}</ul>
              </div>
            </section>
          ) : null}

          {recap.corrections.length ? (
            <section className="fs-recap-card fs-corrections-card">
              <span className="fs-recap-card-icon">💡</span>
              <div>
                <h2>خلّي بالك من</h2>
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
            <section className="fs-recap-card fs-words-card" id="free-speak-words">
              <span className="fs-recap-card-icon"><ProductIcon name="learn" size={34} /></span>
              <div>
                <h2>كلمات من المحادثة</h2>
                <p>كلمات ظهرت فعلًا في كلام النهاردة:</p>
                <div className="fs-word-chips">
                  {recap.vocabulary.map((item) => (
                    <span key={`${item.word}-${item.source}`} title={item.meaningAr}><bdi dir="ltr">{item.word}</bdi></span>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {recap.nextFocusAr ? (
            <section className="fs-next-focus"><strong>المرة الجاية</strong><span>{recap.nextFocusAr}</span></section>
          ) : null}
        </>
      )}

      {relationshipProposal && !memorySaved ? (
        <section className="fs-memory-consent">
          <div><strong>تحب {session.characterName} يفتكر ده المرة الجاية؟</strong><p>{relationshipProposal.text}</p></div>
          <button type="button" onClick={saveRelationshipMemory}>آه، افتكره</button>
          <button type="button" onClick={() => setRelationshipProposal(null)}>مش دلوقتي</button>
        </section>
      ) : null}

      <div className="fs-recap-actions">
        <Link className="fs-recap-primary" to="/speak"><span>محادثة تانية</span><ProductIcon name="chevron" size={24} /></Link>
        <button
          type="button"
          className="fs-recap-secondary"
          disabled={!recap?.vocabulary.length}
          onClick={() => document.getElementById('free-speak-words')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
        >
          <ProductIcon name="learn" size={24} /><span>راجع الكلمات</span>
        </button>
      </div>
    </section>
  );
}
