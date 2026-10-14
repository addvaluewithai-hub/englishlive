import { useState, type ReactNode } from 'react';
import { ProductIcon } from '../../components/ProductIcon';
import { useI18n } from '../../i18n/LocaleProvider';
import type { TutorCopy } from './tutorCopy';
import type { deriveTutorView } from './tutorView';
import type { usePracticeTutor } from './usePracticeTutor';

type Tutor = ReturnType<typeof usePracticeTutor>;

/** The same bottom dock as the speaking screen: type, microphone, and one phase action. */
export function TutorDock({ tutor, view, copy, action, children }: {
  tutor: Tutor;
  view: ReturnType<typeof deriveTutorView>;
  copy: TutorCopy;
  action: ReactNode;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const [keyboard, setKeyboard] = useState(false);
  const [typed, setTyped] = useState('');
  const { state, session } = tutor;

  function micAction() {
    const current = session.current;
    if (view.mic.action === 'cancel') void tutor.stop();
    else if (view.mic.action === 'resume' && state.paused) current?.togglePause();
    else if (view.mic.action === 'interrupt') current?.interrupt();
    else if (view.mic.action === 'done') current?.doneSpeaking();
    else if (view.mic.action === 'start' || view.mic.action === 'resume') void tutor.start();
  }

  return <div className="fs-live-controls tutor-dock">
    {children}
    {keyboard && view.learnerTurn ? <form className="fs-type-row" onSubmit={(event) => {
      event.preventDefault();
      if (!typed.trim()) return;
      session.current?.send(typed.trim());
      setTyped('');
    }}>
      <input dir="auto" value={typed} onChange={(event) => setTyped(event.target.value)}
        placeholder={t('live.typePlaceholder')} aria-label={t('live.typeInstead')} autoFocus />
      <button type="submit" disabled={!typed.trim()}>{t('live.send')}</button>
    </form> : null}
    <div className="fs-control-row tutor-control-row">
      <button type="button" className="fs-keyboard-control" onClick={() => setKeyboard((value) => !value)}
        disabled={!view.learnerTurn} aria-label={t('live.typeInstead')} aria-expanded={keyboard}>
        <ProductIcon name="keyboard" size={28} />
      </button>
      <button type="button" aria-label={view.mic.label} onClick={micAction} disabled={view.mic.action === 'none'}
        className={`fs-mic-control${view.learnerTurn ? ' is-live' : ''}${view.speaking ? ' is-interrupt' : ''}`}>
        {view.speaking
          ? <span className="fs-interrupt-bars" aria-hidden="true"><i /><i /></span>
          : <ProductIcon name="speak" size={46} />}
        <small>{view.mic.label}</small>
      </button>
      <div className="tutor-dock-action">{action}</div>
    </div>
    <div className="fs-mic-meter" aria-hidden="true">
      <span style={{ width: `${Math.max(view.learnerTurn ? 3 : 0, state.level * 100)}%` }} />
    </div>
    <div className="tutor-dock-links">
      {view.active && !tutor.ending ? <button type="button" onClick={() => session.current?.togglePause()} disabled={view.connecting}>
        {state.paused ? copy.resume : copy.pause}
      </button> : null}
    </div>
    {state.error ? <p className="fs-live-error" role="alert">{copy.status.error[1]}</p> : null}
  </div>;
}
