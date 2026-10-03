export function readPresentationPreference(key: string): unknown {
  if (typeof window === 'undefined') return undefined;
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? 'null');
    return value?.version === 1 ? value.value : undefined;
  } catch { return undefined; }
}

export function savePresentationPreference(key: string, value: string) {
  try { window.localStorage.setItem(key, JSON.stringify({ version: 1, value })); }
  catch { /* The interface remains usable when storage is unavailable. */ }
}
