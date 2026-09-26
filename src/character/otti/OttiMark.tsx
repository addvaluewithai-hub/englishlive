export function OttiMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`otti-mark ${className}`.trim()}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13 34C13 19 21 9 32 9s19 10 19 25c0 6-2 11-5 14 5 2 7 6 5 9-3 4-9 2-12-1-2 5-5 7-8 7s-6-2-8-7c-3 3-9 5-12 1-2-3 0-7 5-9-2-4-3-8-3-14Z" fill="#FF3F68"/>
      <ellipse cx="25" cy="31" rx="7.2" ry="9.6" fill="#FFFDFB"/>
      <ellipse cx="39" cy="31" rx="7.2" ry="9.6" fill="#FFFDFB"/>
      <ellipse cx="26" cy="32" rx="3.4" ry="5.5" fill="#2F2732"/>
      <ellipse cx="38" cy="32" rx="3.4" ry="5.5" fill="#2F2732"/>
      <circle cx="25" cy="29" r="1.2" fill="white"/>
      <circle cx="37" cy="29" r="1.2" fill="white"/>
      <path d="M26 42c2 4 10 4 12 0" stroke="#8F174C" strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M17 26c2-6 6-10 11-12" stroke="#FF86AA" strokeWidth="2.5" strokeLinecap="round" opacity=".9"/>
    </svg>
  );
}
