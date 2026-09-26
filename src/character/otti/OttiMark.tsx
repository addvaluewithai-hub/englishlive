import { useId } from 'react';
import { renderOttiSvg } from './OttiArt';

export function OttiMark({ className = '' }: { className?: string }) {
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const svg = renderOttiSvg({
    portrait: true,
    prefix: `otti-mark-${instanceId}-`,
    className: 'otti-mark-art',
  });

  return (
    <span
      className={`otti-mark ${className}`.trim()}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
