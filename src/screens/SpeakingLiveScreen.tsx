import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { speakingScenarioById } from '../speaking/catalog';

export function SpeakingLiveScreen() {
  const { scenarioId } = useParams();
  const scenario = speakingScenarioById(scenarioId);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [learnerText, setLearnerText] = useState('Can I leave my luggage here?');
  const [isLearnerTurn, setLearnerTurn] = useState(true);

  function submitText(event: FormEvent) {
    event.preventDefault();
    const value = typedText.trim();
    if (!value) return;
    setLearnerText(value);
    setTypedText('');
    setKeyboardOpen(false);
    setLearnerTurn(false);
    window.setTimeout(() => setLearnerTurn(true), 1100);
  }

  return (
    <section className="sp-live" dir="rtl">
      <header className="sp-live-header">
        <Link to={`/speak/scenario/${scenario.id}`} className="sp-live-close" aria-label="إنهاء"><ProductIcon name="close" size={27} /></Link>
        <div className="sp-live-brand"><span>🐙</span><strong>Englotti</strong></div>
        <div className="sp-live-progress"><span><i /><i /><i /></span><small>00:28 ◷</small></div>
        <div className="sp-live-scenario"><span>🛏️</span><strong>{scenario.titleAr}</strong></div>
      </header>

      <div className="sp-live-stage">
        <img className="sp-live-bg" src={scenario.image} alt="" />
        <img className="sp-live-otti" src="/speaking-assets/otti-hero.webp" alt="Otti" />
        <div className={`sp-turn-status${isLearnerTurn ? ' is-active' : ''}`}>
          <ProductIcon name="speak" size={26} />
          <span><strong>{isLearnerTurn ? 'دورك الآن' : 'Otti بيتكلم'}</strong><small>{isLearnerTurn ? 'رد بصوتك' : 'اسمع وبعدها رد'}</small></span>
        </div>
      </div>

      <div className="sp-live-dialogue">
        <article className="sp-live-bubble is-otti">
          <span className="sp-live-avatar"><img src="/speaking-assets/otti-hero.webp" alt="" /></span>
          <button type="button" aria-label="اسمع الجملة">🔊</button>
          <p dir="ltr">I’m sorry, but your room isn’t ready yet.</p>
        </article>
        <article className="sp-live-bubble is-learner">
          <span className="sp-live-user"><ProductIcon name="profile" size={23} /></span>
          <p dir="ltr">{learnerText}</p>
        </article>
        <p className="sp-live-help-hint">💡 اضغط على “مش فاهم” للحصول على مساعدة.</p>
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
          <button type="button">قولها أبسط</button>
          <button type="button">اشرح بالعربي</button>
          <button type="button">اديني مثال</button>
          <button type="button">أقولها إزاي؟</button>
        </section>
      ) : null}

      <div className="sp-live-controls">
        <button type="button" className="sp-live-control" onClick={() => setKeyboardOpen((value) => !value)}>
          <ProductIcon name="keyboard" size={30} /><strong>لوحة المفاتيح</strong>
        </button>
        <button type="button" className={`sp-live-mic${isLearnerTurn ? ' is-active' : ''}`} onClick={() => setLearnerTurn((value) => !value)} aria-label="الميكروفون">
          <ProductIcon name="speak" size={56} />
        </button>
        <button type="button" className="sp-live-control" onClick={() => setHelpOpen((value) => !value)}>
          <span className="sp-question-icon">?</span><strong>مش فاهم</strong>
        </button>
      </div>
    </section>
  );
}
