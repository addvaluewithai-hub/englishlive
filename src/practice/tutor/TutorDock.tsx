import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { ProductIcon } from '../../components/ProductIcon';
import { useI18n } from '../../i18n/LocaleProvider';
import type { TutorCopy } from './tutorCopy';
import type { deriveTutorView } from './tutorView';
import type { usePracticeTutor } from './usePracticeTutor';

type Tutor = ReturnType<typeof usePracticeTutor>;

/** Pointer/keyboard hold owns the learner turn. No toggle-to-record ambiguity. */
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
  const pointerId = useRef<number | null>(null);
  const keyboardHeld = useRef(false);
  const { state, session } = tutor;

  function finishHold(cancelled = false) {
    pointerId.current = null;
    keyboardHeld.current = false;
    session.current?.endHold(cancelled);
  }

  // Browser tab loses focus, incoming call, screen lock, or component unmount:
  // never leave the microphone open and the manual VAD activity unclosed.
  useEffect(() => {
    const cancel = () => finishHold(true);
    const hidden = () => { if (document.hidden) cancel(); };
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', hidden);
      cancel();
    };
  }, []);

  function pointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!view.canHold || event.button !== 0 || pointerId.current !== null || keyboardHeld.current) return;
    if (!session.current?.beginHold()) return;
    pointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function pointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (pointerId.current !== event.pointerId) return;
    finishHold();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function pointerCancel(event: PointerEvent<HTMLButtonElement>) {
    if (pointerId.current === event.pointerId) finishHold(true);
  }

  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (pointerId.current !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const pad = 38;
    if (event.clientX < rect.left - pad || event.clientX > rect.right + pad ||
        event.clientY < rect.top - pad || event.clientY > rect.bottom + pad) {
      finishHold(true);
    }
  }

  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (!view.canHold || event.repeat || keyboardHeld.current || pointerId.current !== null) return;
    event.preventDefault();
    if (session.current?.beginHold()) keyboardHeld.current = true;
  }

  function keyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (keyboardHeld.current) finishHold();
  }

  function micAction() {
    const current = session.current;
    if (view.mic.action === 'hold') return;
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
      <button type="button" aria-label={view.mic.label}
        aria-pressed={view.mic.action === 'hold' ? state.holding : undefined}
        onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={pointerCancel}
        onPointerMove={pointerMove}
        onLostPointerCapture={() => { if (pointerId.current !== null) finishHold(true); }}
        onKeyDown={keyDown} onKeyUp={keyUp}
        onBlur={() => { if (keyboardHeld.current) finishHold(true); }}
        onContextMenu={(event) => event.preventDefault()}
        onClick={micAction}
        disabled={view.mic.action === 'none' || (view.mic.action === 'hold' && !view.canHold)}
        className={`fs-mic-control tutor-hold-control${state.holding ? ' is-holding' : ''}${view.learnerTurn ? ' is-live' : ''}`}>
        <ProductIcon name="speak" size={46} />
        <small>{view.mic.label}</small>
      </button>
      <div className="tutor-dock-action">{action}</div>
    </div>
    <div className="fs-mic-meter" aria-hidden="true">
      <span style={{ width: `${state.holding ? Math.max(8, state.level * 100) : 0}%` }} />
    </div>
    <div className="tutor-dock-links">
      {view.active && !tutor.ending ? <button type="button" onClick={() => session.current?.togglePause()} disabled={view.connecting}>
        {state.paused ? copy.resume : copy.pause}
      </button> : null}
    </div>
    {state.error ? <p className="fs-live-error" role="alert">{copy.status.error[1]}</p> : null}
  </div>;
}
