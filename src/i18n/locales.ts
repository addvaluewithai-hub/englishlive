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

export function resolveRegisteredLocale<T extends string>(value: unknown, codes: readonly T[], fallback: T): T {
  if (typeof value !== 'string') return fallback;
  try {
    let candidate = Intl.getCanonicalLocales(value)[0]?.toLowerCase();
    while (candidate) {
      const registered = codes.find((code) => code.toLowerCase() === candidate);
      if (registered) return registered;
      // Keep a registered script/region before falling back to a base language.
      const separator = candidate.lastIndexOf('-');
      candidate = separator < 0 ? '' : candidate.slice(0, separator);
    }
  } catch { /* Invalid or unsupported preferences use the product default. */ }
  return fallback;
}

export function resolveLocale(value: unknown): SupportedLocale {
  return resolveRegisteredLocale(value, Object.keys(locales) as SupportedLocale[], defaultLocale);
}
