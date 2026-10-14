import { useEffect, useState } from 'react';

const QUERY = '(min-width: 900px)';

/** Desktop places the phase companion (lesson card / notes) beside Otti instead of under him. */
export function useWideLayout() {
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(QUERY).matches === true);
  useEffect(() => {
    const media = window.matchMedia?.(QUERY);
    if (!media) return;
    const sync = () => setWide(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  return wide;
}
