import { useState } from 'react';
import { ProductIcon } from '../../components/ProductIcon';
import { useI18n } from '../../i18n/LocaleProvider';
import type { usePracticeTutor } from './usePracticeTutor';

type Tutor = ReturnType<typeof usePracticeTutor>;
export function TutorControls({ tutor }: { tutor: Tutor }) {
  const { locale, t } = useI18n();
  const ar = locale === 'ar';
  const [keyboard, setKeyboard] = useState(false);
  const [typed, setTyped] = useState('');
  const { state, session, ending } = tutor;
  const connecting = state.status === 'connecting' || state.status === 'reconnecting';
  const active = state.status !== 'idle' && state.status !== 'error';
  const listening = state.micOpen && !state.paused && !state.waiting && !ending;
  const speaking = state.status === 'speaking';
  return <>
    <div className="practice-conversation-actions">
      <button type="button" onClick={() => session.current?.togglePause()} disabled={!active || connecting || ending}>
        {state.paused ? (ar ? 'نكمل' : 'Resume') : (ar ? 'وقفة للمراجعة' : 'Pause to review')}
      </button>
      <button type="button" onClick={() => session.current?.doneSpeaking()} disabled={!listening}>
        {ar ? 'خلصت كلامي' : 'Done speaking'}
      </button>
      <button type="button" onClick={() => void tutor.stop()} disabled={!active || ending}>
        {ar ? 'إيقاف الصوت' : 'Stop session'}
      </button>
    </div>
    {keyboard ? <form className="fs-type-row" onSubmit={(event) => {
      event.preventDefault();
      if (!listening || !typed.trim()) return;
      session.current?.send(typed.trim()); setTyped(''); setKeyboard(false);
    }}>
      <input placeholder={t('live.typePlaceholder')} aria-label={t('live.typeInstead')} dir="auto" value={typed} onChange={(event) => setTyped(event.target.value)} />
      <button type="submit" disabled={!listening || !typed.trim()}>{t('live.send')}</button>
    </form> : null}
    <div className="fs-control-row practice-live-control-row">
      <button type="button" className="fs-keyboard-control" disabled={!listening}
        onClick={() => setKeyboard((value) => !value)} aria-label={t('live.typeInstead')}>
        <ProductIcon name="keyboard" size={31} />
      </button>
      <button type="button" className={`fs-mic-control${listening ? ' is-live' : ''}${speaking ? ' is-interrupt' : ''}`}
        disabled={ending || (active && !speaking)}
        aria-label={speaking ? t('live.interruptLabel') : ar ? 'اتكلم مع Otti' : 'Talk with Otti'}
        onClick={() => speaking ? session.current?.interrupt() : void tutor.start()}>
        <ProductIcon name="speak" size={54} />
        <small>{speaking ? t('live.interrupt') : !active ? (ar ? 'اتكلم مع Otti' : 'Talk with Otti') :
          listening ? t('live.yourTurn') : t('live.wait')}</small>
      </button>
      <button type="button" className="practice-live-secondary-control" disabled aria-label={t('practice.moreComingSoon')}>
        <ProductIcon name="more" size={29} />
      </button>
    </div>
    <div className="fs-mic-meter" aria-hidden="true"><span style={{ width: `${state.level * 100}%` }} /></div>
    {state.error ? <p className="fs-live-error" role="alert">{state.error}</p> : null}
  </>;
}
