import { defaultLocale, locales, type SupportedLocale } from './locales';
import type { Message, MessageKey } from './messages';

export function formatNumber(locale: SupportedLocale, value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locales[locale].intlLocale, options).format(value);
}

export function translate(locale: SupportedLocale, key: MessageKey, params: Record<string, string | number> = {}) {
  const catalog: Partial<Record<MessageKey, Message>> = locales[locale].catalog;
  const message: Message = catalog[key] ?? locales[defaultLocale].catalog[key];
  let template: string;
  if (typeof message === 'string') template = message;
  else {
    if (typeof params.count !== 'number') throw new Error(`Missing plural count for ${key}`);
    const rule = new Intl.PluralRules(locales[locale].intlLocale).select(params.count);
    template = message[rule] ?? message.other;
  }
  // Interpolated text stays plain React text, never HTML.
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing ${name} for ${key}`);
    return typeof value === 'number' ? formatNumber(locale, value) : value;
  });
}

/** UI locale does not change course content or the language being taught. */
export function lessonDisplayTitle(locale: SupportedLocale, lesson: { titleAr: string; titleEn: string }) {
  return locale === 'ar'
    ? { text: lesson.titleAr, lang: 'ar', direction: 'rtl' as const }
    : { text: lesson.titleEn, lang: 'en', direction: 'ltr' as const };
}
