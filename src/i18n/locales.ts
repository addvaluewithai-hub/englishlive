import { ar } from './catalogs/ar';
import { en } from './catalogs/en';
import type { Message, MessageKey } from './messages';

export interface LocaleDefinition {
  nativeName: string;
  direction: 'ltr' | 'rtl';
  intlLocale: string;
  catalog: Record<MessageKey, Message>;
}

// Add a catalog and its metadata here to enable another interface language.
// The product's ten launch languages have not yet been specified.
export const locales = {
  ar: { nativeName: 'العربية', direction: 'rtl', intlLocale: 'ar-EG', catalog: ar },
  en: { nativeName: 'English', direction: 'ltr', intlLocale: 'en', catalog: en },
} satisfies Record<string, LocaleDefinition>;

export type SupportedLocale = keyof typeof locales;
export const defaultLocale: SupportedLocale = 'ar';

export function resolveLocale(value: unknown): SupportedLocale {
  if (typeof value !== 'string') return defaultLocale;
  try {
    const canonical = Intl.getCanonicalLocales(value)[0]?.toLowerCase();
    if (canonical && Object.hasOwn(locales, canonical)) return canonical as SupportedLocale;
    const language = canonical?.split('-')[0];
    if (language && Object.hasOwn(locales, language)) return language as SupportedLocale;
  } catch { /* Invalid or unsupported preferences use the product default. */ }
  return defaultLocale;
}
