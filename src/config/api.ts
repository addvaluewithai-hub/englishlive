import { Capacitor } from '@capacitor/core';

const configuredOrigin = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');

export function apiOrigin(): string {
  if (configuredOrigin) return configuredOrigin;
  if (!Capacitor.isNativePlatform()) return '';
  throw new Error('VITE_API_BASE_URL must be set for native EnglishLive builds.');
}

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiOrigin()}${cleanPath}`;
}
