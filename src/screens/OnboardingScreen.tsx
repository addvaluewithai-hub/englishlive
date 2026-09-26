import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { characterRegistry, DEFAULT_CHARACTER_ID } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { A1_UNIT_1_PRODUCT } from '../productV2/course';
import {
  learningGoals,
  readLearnerProfile,
  saveLearnerProfile,
  speakingComfortLevels,
  type LearningGoal,
  type SpeakingComfort,
} from '../product/profile';

const goalCopy: Record<LearningGoal, { title: string; body: string }> = {
  work: { title: 'العمل', body: 'محادثات واجتماعات ومواقف الشغل اليومية' },
  interviews: { title: 'المقابلات', body: 'تجاوب بطبيعية بدل حفظ إجابات جاهزة' },
  travel: { title: 'السفر', body: 'تتواصل بسهولة في رحلاتك والمواقف الجديدة' },
  everyday: { title: 'بناء الثقة', body: 'تتكلم براحة أكتر في المحادثات العادية' },
  study: { title: 'الدراسة', body: 'تشرح أفكارك وتشارك في مواقف الدراسة' },
};

const comfortCopy: Record<SpeakingComfort, { title: string; body: string }> = {
  freeze: { title: 'بتوتر وبقف', body: 'فاهم شوية، لكن الكلام مش بيطلع بسهولة.' },
  manage: { title: 'بعرف أتصرف', body: 'بقدر أتكلم بجمل بسيطة مع شوية وقت.' },
  natural: { title: 'عايز أبقى طبيعي', body: 'عايز الكلام يبقى أسرع وأقل ترجمة في دماغي.' },
  challenge: { title: 'عايز تحدي', body: 'عايز المدرس يزقني شوية لما أكون جاهز.' },
};

export function OnboardingScreen() {
  const navigate = useNavigate();
  const existing = useMemo(() => readLearnerProfile(), []);
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(existing?.firstName ?? '');
  const [goals, setGoals] = useState<LearningGoal[]>(existing?.goals ?? []);
  const [comfort, setComfort] = useState<SpeakingComfort | null>(existing?.comfort ?? null);
  const [characterId, setCharacterId] = useState(existing?.characterId ?? DEFAULT_CHARACTER_ID);

  function toggleGoal(goal: LearningGoal) {
    setGoals((current) => {
      if (current.includes(goal)) return current.filter((value) => value !== goal);
      if (current.length >= 2) return [current[1], goal];
      return [...current, goal];
    });
  }

  function finish() {
    if (!comfort || goals.length === 0) return;
    saveLearnerProfile({
      version: 1,
      firstName: firstName.trim().slice(0, 40),
      goals,
      comfort,
      characterId,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    const firstLesson = A1_UNIT_1_PRODUCT.lessons[0];
    navigate(`/scene-lesson/${firstLesson.id}?character=${characterId}&onboarding=1`);
  }

  const canContinue = step === 0 || (step === 1 && goals.length > 0) || (step === 2 && comfort !== null);
  const selectedCharacter = characterRegistry.find((character) => character.id === characterId) ?? characterRegistry[0];

  return (
    <section className="v2-onboarding" dir="rtl">
      <header className="v2-onboarding-header">
        <div className="v2-onboarding-brand"><span>E</span><strong>English<i>Live</i></strong></div>
        <div className="v2-onboarding-progress" aria-label={`Step ${step + 1} of 4`}>
          {[0, 1, 2, 3].map((value) => <span key={value} className={value <= step ? 'is-active' : ''} />)}
        </div>
      </header>

      <div className="v2-onboarding-card">
        {step === 0 ? (
          <div className="v2-onboarding-step">
            <span className="v2-kicker">خلّينا نتعرف</span>
            <h1>تحب مدرسك يناديك بإيه؟</h1>
            <p>اختياري. الاسم بس بيخلي الدرس والمحادثة أدفى شوية.</p>
            <input
              className="v2-text-input"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="اسمك الأول"
              autoComplete="given-name"
              maxLength={40}
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="v2-onboarding-step">
            <span className="v2-kicker">هدفك الأساسي</span>
            <h1>ما هدفك من الإنجليزية؟</h1>
            <p>اختار هدف أو هدفين. المنهج نفسه منظم، لكن الأمثلة والمحادثات تقدر تقرب من اللي يهمك.</p>
            <div className="v2-goal-grid">
              {learningGoals.map((goal) => {
                const selected = goals.includes(goal);
                return (
                  <button key={goal} type="button" className={`v2-goal-card${selected ? ' is-selected' : ''}`} onClick={() => toggleGoal(goal)} aria-pressed={selected}>
                    <span className="v2-goal-check">{selected ? <ProductIcon name="check" size={22} /> : null}</span>
                    <strong>{goalCopy[goal].title}</strong>
                    <small>{goalCopy[goal].body}</small>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="v2-onboarding-step">
            <span className="v2-kicker">سرعة البداية</span>
            <h1>الكلام بالإنجليزي عامل معاك إيه دلوقتي؟</h1>
            <p>ده مش اختبار مستوى. بنستخدمه بس عشان المدرس يبدأ بسرعة ودعم مناسبين.</p>
            <div className="v2-comfort-list">
              {speakingComfortLevels.map((value) => (
                <button key={value} type="button" className={`v2-comfort-card${comfort === value ? ' is-selected' : ''}`} onClick={() => setComfort(value)} aria-pressed={comfort === value}>
                  <span>{comfort === value ? <ProductIcon name="check" size={20} /> : null}</span>
                  <div><strong>{comfortCopy[value].title}</strong><small>{comfortCopy[value].body}</small></div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="v2-onboarding-step">
            <span className="v2-kicker">آخر خطوة</span>
            <h1>اختر مدرسك</h1>
            <p>اختار الشخصية اللي تحس إنك هترتاح تتعلم وتتكلم معاها. تقدر تغيرها في أي وقت.</p>
            <div className="v2-teacher-grid">
              {characterRegistry.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  className={`v2-teacher-card${characterId === character.id ? ' is-selected' : ''}`}
                  style={{ '--character-accent': character.accent } as CSSProperties}
                  onClick={() => setCharacterId(character.id)}
                  aria-pressed={characterId === character.id}
                >
                  <span className="v2-teacher-check">{characterId === character.id ? <ProductIcon name="check" size={20} /> : null}</span>
                  <CharacterPortrait character={character} />
                  <strong>{character.name}</strong>
                  <small>{character.tagline}</small>
                </button>
              ))}
            </div>
            <div className="v2-onboarding-note">أول درس هيبدأ مع <strong>{selectedCharacter.name}</strong>. الميكروفون مش هيفتح إلا لما تضغط Start lesson.</div>
          </div>
        ) : null}

        <footer className="v2-onboarding-actions">
          {step > 0 ? <button type="button" className="v2-secondary-button" onClick={() => setStep((value) => value - 1)}>رجوع</button> : <span />}
          {step < 3 ? (
            <button type="button" className="v2-primary-button" disabled={!canContinue} onClick={() => canContinue && setStep((value) => value + 1)}>
              متابعة <ProductIcon name="chevron" size={20} />
            </button>
          ) : (
            <button type="button" className="v2-primary-button" onClick={finish}>
              ابدأ أول درس <ProductIcon name="play" size={21} />
            </button>
          )}
        </footer>
      </div>
    </section>
  );
}
