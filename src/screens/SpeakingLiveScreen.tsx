import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { findSpeakingScenario, speakingAssets } from '../speaking/catalog';

export function SpeakingLiveScreen() {
  const { scenarioId } = useParams();
  const scenario = scenarioId ? findSpeakingScenario(scenarioId) : null;
  const [isListening, setIsListening] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [draft, setDraft] = useState('');
  if (!scenario) return <Navigate replace to="/speak" />;

  const isHotel = scenario.id !== 'first-meeting';
  const prompt = isHotel ? "I’m sorry, but your room isn’t ready yet." : 'Hi! Nice to meet you. What’s your name?';
  const reply = isHotel ? 'Can I leave my luggage here?' : "Hi! I'm Omar. Nice to meet you too.";

  return (
    <section className="spk3-live" dir="rtl">
      <div
        className="spk3-live-bg"
        aria-hidden="true"
        style={{ backgroundImage: `linear-gradient(rgba(255,205,163,.3),rgba(255,239,225,.28)), url("${speakingAssets.hotelReception}")` }}
      />
      <header className="spk3-live-header">
        <Link to={`/speak/scenario/${scenario.id}`} className="spk3-live-close" aria-label="إغلاق"><ProductIcon name="close" size={24} /></Link>
        <strong>{scenario.title}</strong>
        <div className="spk3-live-progress"><span><b /><b /></span><small>◷ 00:28</small></div>
      </header>

      <div className="spk3-live-character">
        <img src={isHotel ? speakingAssets.ottiReceptionist : speakingAssets.ottiHero} alt="Otti" />
        <div className={`spk3-turn-pill${isListening ? ' is-listening' : ''}`}>
          <ProductIcon name="speak" size={24} />
          <span><strong>{isListening ? 'بسمعك' : 'دورك الآن'}</strong><small>{isListening ? 'اتكلم براحتك' : 'رد بصوتك'}</small></span>
        </div>
      </div>

      <div className="spk3-live-dialogue">
        <div className="spk3-ai-bubble">
          <span className="spk3-avatar"><img src={speakingAssets.ottiHero} alt="" /></span>
          <button type="button" aria-label="اسمع الجملة">🔊</button>
          <p dir="ltr">{prompt}</p>
        </div>
        <div className="spk3-user-bubble" dir="ltr">{reply}</div>
        {showHelp ? (
          <div className="spk3-help-panel">
            <strong>المعنى ببساطة</strong>
            <span>{isHotel ? 'آسف، لكن غرفتك لسه مش جاهزة.' : 'مرحبًا! سعيد بمقابلتك. ما اسمك؟'}</span>
          </div>
        ) : (
          <div className="spk3-help-hint">💡 اضغط على «مش فاهم» لو محتاج مساعدة</div>
        )}
      </div>

      {showKeyboard ? (
        <div className="spk3-keyboard-panel">
          <input dir="ltr" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type your reply…" autoFocus />
          <button type="button" onClick={() => setShowKeyboard(false)}>إرسال</button>
        </div>
      ) : null}

      <div className="spk3-live-controls">
        <button type="button" onClick={() => setShowKeyboard((value) => !value)}><ProductIcon name="keyboard" size={31} /><span>لوحة المفاتيح</span></button>
        <button className={`spk3-mic-button${isListening ? ' is-live' : ''}`} type="button" onClick={() => setIsListening((value) => !value)}><ProductIcon name="speak" size={42} /></button>
        <button type="button" onClick={() => setShowHelp((value) => !value)}><span className="spk3-help-icon">?</span><span>مش فاهم</span></button>
      </div>
    </section>
  );
}
