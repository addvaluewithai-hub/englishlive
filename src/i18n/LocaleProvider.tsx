import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { readPresentationPreference, savePresentationPreference } from '../app/presentationPreferences';
import { formatNumber, translate } from './format';
import { locales, resolveLocale, type SupportedLocale } from './locales';
import type { Translator } from './messages';

export const localeStorageKey = 'englotti.ui.locale.v1';
interface LocaleContextValue {
  locale: SupportedLocale;
  direction: 'ltr' | 'rtl';
  setLocale: (locale: SupportedLocale) => void;
  t: Translator;
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
}
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setCurrentLocale] = useState(() => resolveLocale(readPresentationPreference(localeStorageKey)));
  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    direction: locales[locale].direction,
    setLocale: (next) => {
      const supported = resolveLocale(next);
      setCurrentLocale(supported);
      savePresentationPreference(localeStorageKey, supported);
    },
    t: ((key, params) => translate(locale, key, params)) as Translator,
    number: (amount, options) => formatNumber(locale, amount, options),
  }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useI18n requires LocaleProvider');
  return value;
}
