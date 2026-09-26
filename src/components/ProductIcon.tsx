type ProductIconName = 'home' | 'learn' | 'speak' | 'profile' | 'chevron' | 'bell' | 'check' | 'lock' | 'play' | 'refresh';

export function ProductIcon({ name, size = 24 }: { name: ProductIconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (name === 'home') return <svg {...common}><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5h5v5"/></svg>;
  if (name === 'learn') return <svg {...common}><path d="M4 5.5c2.8-.9 5.5-.5 8 1.2v12c-2.5-1.7-5.2-2.1-8-1.2z"/><path d="M20 5.5c-2.8-.9-5.5-.5-8 1.2v12c2.5-1.7 5.2-2.1 8-1.2z"/></svg>;
  if (name === 'speak') return <svg {...common}><rect x="8" y="3" width="8" height="13" rx="4"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>;
  if (name === 'profile') return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.8-4 3.2-6 7.5-6s6.7 2 7.5 6"/></svg>;
  if (name === 'chevron') return <svg {...common}><path d="m9 5 7 7-7 7"/></svg>;
  if (name === 'bell') return <svg {...common}><path d="M6.5 9a5.5 5.5 0 0 1 11 0c0 6 2.5 6.5 2.5 6.5h-16S6.5 15 6.5 9"/><path d="M10 19h4"/></svg>;
  if (name === 'check') return <svg {...common}><path d="m5 12 4.2 4.2L19 6.5"/></svg>;
  if (name === 'lock') return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
  if (name === 'refresh') return <svg {...common}><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 8.2A7 7 0 0 1 18.6 7L20 9"/><path d="M17.9 15.8A7 7 0 0 1 5.4 17L4 15"/></svg>;
  return <svg {...common}><path d="m9 6 9 6-9 6z"/></svg>;
}
