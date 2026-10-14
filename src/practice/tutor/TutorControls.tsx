import { useState } from 'react';
import { ProductIcon } from '../../components/ProductIcon';
import { useI18n } from '../../i18n/LocaleProvider';
import type { usePracticeTutor } from './usePracticeTutor';

export function TutorControls({ tutor }: { tutor: ReturnType<typeof usePracticeTutor> }) {
  const { locale, t } = useI18n();
  const ar = locale === 'ar';
  const [keyboard, setKeyboard] = useState(false);
  const [typed, setTyped] = useState('');
  const { state, session, ending } = tutor;
  const connecting = state.status === 'connecting' || state.status === 'reconnecting';
  const active = state.status !== 'idle' && state.status !== 'error';
  const listening = state.micOpen && !state.paused && !state.waiting && !ending;
  const speaking = state.status === 'speaking';
  const label = connecting ? (ar ? 'إلغاء الاتصال' : 'Cancel connection') : state.paused ? (ar ? 'نكمل' : 'Resume') :
    speaking ? (ar ? 'عايز أتكلم' : 'Interrupt') : listening ? (ar ? 'خلصت كلامي' : 'Done speaking') :
      state.waiting ? (ar ? 'Otti بيرد…' : 'Otti is replying…') : state.status === 'error' ? (ar ? 'حاول تاني' : 'Reconnect') :
        (ar ? 'ابدأ مع Otti' : 'Start with Otti');
  function micAction() {
    if (connecting) void tutor.stop();
    else if (state.paused) session.current?.togglePause();
    else if (speaking) session.current?.interrupt();
    else if (listening) session.current?.doneSpeaking();
    else void tutor.start();
  }
  return <div className="tutor-controls">
    {keyboard ? <form className="fs-type-row" onSubmit={(event) => {
      event.preventDefault();
      if (!listening || !typed.trim()) return;
      session.current?.send(typed.trim()); setTyped('');
    }}>
      <input placeholder={t('live.typePlaceholder')} aria-label={t('live.typeInstead')} dir="auto" value={typed}
        onChange={(event) => setTyped(event.target.value)} />
      <button type="submit" disabled={!listening || !typed.trim()}>{t('live.send')}</button>
    </form> : null}
    <div className="tutor-control-row">
      <button type="button" className="tutor-secondary fs-keyboard-control" disabled={!listening}
        onClick={() => setKeyboard((value) => !value)} aria-label={t('live.typeInstead')} aria-expanded={keyboard}>
        <ProductIcon name="keyboard" size={24} /><span>{ar ? 'اكتب' : 'Type'}</span>
      </button>
      <button type="button" className={`tutor-mic fs-mic-control${listening ? ' is-live' : ''}`}
        disabled={ending || (state.waiting && !speaking && !connecting && !state.paused)}
        aria-label={label} onClick={micAction}>
        <ProductIcon name="speak" size={30} /><small>{label}</small>
      </button>
      <button type="button" className="tutor-secondary" disabled={!active || connecting || ending}
        onClick={() => session.current?.togglePause()}>
        <span>{state.paused ? (ar ? 'نكمل' : 'Resume') : (ar ? 'وقفة' : 'Pause')}</span>
      </button>
    </div>
    <div className="fs-mic-meter" aria-hidden="true"><span style={{ width: `${state.level * 100}%` }} /></div>
    {state.waiting && !connecting && !ending ? <button className="tutor-text-button" type="button" onClick={() => void tutor.stop()}>
      {ar ? 'إيقاف وإعادة الاتصال' : 'Stop and reconnect'}
    </button> : null}
    {state.error ? <p className="fs-live-error" role="alert">{ar ? 'الاتصال مع Otti وقف. ملاحظاتك محفوظة؛ اضغط حاول تاني.' : state.error}</p> : null}
  </div>;
}
