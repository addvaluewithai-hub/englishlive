import { Capacitor } from '@capacitor/core';

export type RuntimePlatform = 'web' | 'ios' | 'android';

export function runtimePlatform(): RuntimePlatform {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios' || platform === 'android') return platform;
  return 'web';
}

export function isNativeRuntime(): boolean {
  return Capacitor.isNativePlatform();
}
