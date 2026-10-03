import type { ReactNode } from 'react';
import { OttiMark } from '../../character/otti/OttiMark';
import { ProductIcon } from '../../components/ProductIcon';
import type { LiveStatus } from '../../live/types';

interface LiveConversationHeaderProps {
  title: ReactNode;
  meta?: ReactNode;
  onClose: () => void;
  closeLabel: string;
  disabled?: boolean;
  brandText?: string;
  className?: string;
  metaClassName?: string;
}

export function LiveConversationHeader({
  title,
  meta,
  onClose,
  closeLabel,
  disabled = false,
  brandText = 'Englotti',
  className = '',
  metaClassName = 'fs-live-mode',
}: LiveConversationHeaderProps) {
  return (
    <header className={`fs-live-header${className ? ` ${className}` : ''}`}>
      <button type="button" className="fs-live-close" onClick={onClose} aria-label={closeLabel} disabled={disabled}>
        <ProductIcon name="close" size={28} />
      </button>
      <div className="fs-live-brand" aria-label="Englotti">
        <OttiMark />
        <strong>{brandText}</strong>
      </div>
      <strong className="fs-live-title" dir="auto">{title}</strong>
      {meta ? <span className={metaClassName}>{meta}</span> : <span aria-hidden="true" />}
    </header>
  );
}

interface LiveConversationStatusProps {
  status: LiveStatus;
  title: string;
  body: string;
  learnerTurn?: boolean;
  muted?: boolean;
}

export function LiveConversationStatus({
  status,
  title,
  body,
  learnerTurn = false,
  muted = false,
}: LiveConversationStatusProps) {
  const stateClass = learnerTurn ? ' is-open' : muted ? ' is-muted' : '';
  return (
    <div className={`fs-live-status status-${status}${stateClass}`} aria-live="polite">
      <span className="fs-live-wave" aria-hidden="true"><i /><i /><i /></span>
      <span>
        <strong>{title}</strong>
        <small>{body}</small>
      </span>
    </div>
  );
}
