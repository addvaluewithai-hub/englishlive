import assert from 'node:assert/strict';
import { test } from 'node:test';
import { locales, resolveLocale, resolveRegisteredLocale } from '../src/i18n/locales.ts';
import { formatNumber, lessonDisplayTitle, translate } from '../src/i18n/format.ts';
import { experienceProfiles, resolveExperienceProfile } from '../src/ui/theme/profiles.ts';
import { normalizedProgress } from '../src/ui/primitives/progress.ts';
import { readPresentationPreference, savePresentationPreference } from '../src/app/presentationPreferences.ts';

test('every published catalog is complete and every message formats without unresolved placeholders', () => {
  const keys = Object.keys(locales.en.catalog).sort();
  for (const [locale, definition] of Object.entries(locales)) {
    assert.deepEqual(Object.keys(definition.catalog).sort(), keys);
    for (const key of keys) {
      for (const count of [0, 1, 2, 3, 11, 100]) {
        const text = translate(locale, key, {
          name: 'Alex',
          number: 2,
          count,
          total: 7,
          completed: 3,
          current: 2,
          level: 'A1',
        });
        assert.ok(text.length > 0);
        assert.doesNotMatch(text, /\{\w+\}/);
      }
    }
  }
});

test('Arabic plural rules and locale-aware numbers work alongside English', () => {
  assert.equal(translate('ar', 'home.completed', { count: 0 }), 'لسه مفيش دروس مكتملة');
  assert.equal(translate('ar', 'home.completed', { count: 1 }), 'درس واحد مكتمل');
  assert.equal(translate('ar', 'home.completed', { count: 2 }), 'درسان مكتملان');
  assert.match(translate('ar', 'home.completed', { count: 3 }), /دروس/);
  assert.match(translate('ar', 'home.completed', { count: 11 }), /درسًا/);
  assert.equal(translate('en', 'home.completed', { count: 1 }), '1 lesson completed');
  assert.equal(translate('en', 'home.completed', { count: 2 }), '2 lessons completed');
  assert.equal(formatNumber('en', 1234.5), '1,234.5');
  assert.equal(formatNumber('ar', 2), '٢');
  assert.equal(translate('en', 'learn.progressCount', { completed: 3, total: 10 }), '3 of 10 available lessons completed');
  assert.equal(translate('ar', 'progress.title', { level: 'A1' }), 'خطواتك في A1');
  assert.throws(() => translate('en', 'home.greeting'), /Missing name/);
  assert.throws(() => translate('ar', 'home.completed'), /Missing plural count/);
});

test('BCP 47 variants resolve safely and unknown or corrupt preferences retain Arabic', () => {
  assert.equal(resolveLocale('ar-EG'), 'ar');
  assert.equal(resolveLocale('EN-us'), 'en');
  for (const value of [null, {}, '', 'invalid__locale', 'fr-FR', '__proto__']) assert.equal(resolveLocale(value), 'ar');
});

test('interface titles use authored content and preserve the learning-language boundary', () => {
  const lesson = { titleAr: 'التعارف', titleEn: 'Introductions' };
  assert.deepEqual(lessonDisplayTitle('ar', lesson), { text: 'التعارف', lang: 'ar', direction: 'rtl' });
  assert.deepEqual(lessonDisplayTitle('en', lesson), { text: 'Introductions', lang: 'en', direction: 'ltr' });
  assert.deepEqual(lesson, { titleAr: 'التعارف', titleEn: 'Introductions' });
});

test('a ten-language registry supports canonical region/script tags without changing screens', () => {
  // Test metadata only. This is not the product's launch-language list.
  const codes = ['ar', 'en', 'fr', 'es', 'pt-BR', 'zh-Hans', 'he', 'ja', 'de', 'tr'];
  assert.equal(resolveRegisteredLocale('pt-br', codes, 'ar'), 'pt-BR');
  assert.equal(resolveRegisteredLocale('zh-Hans-CN', codes, 'ar'), 'zh-Hans');
  assert.equal(resolveRegisteredLocale('en-US-u-nu-latn', codes, 'ar'), 'en');
  assert.equal(resolveRegisteredLocale('he-IL', codes, 'ar'), 'he');
  assert.equal(resolveRegisteredLocale('unknown', codes, 'ar'), 'ar');
});

test('theme profiles share the complete token contract and never require age', () => {
  assert.deepEqual(Object.keys(experienceProfiles.adult.tokens).sort(), Object.keys(experienceProfiles.teen.tokens).sort());
  assert.notEqual(experienceProfiles.adult.tokens['--color-primary'], experienceProfiles.teen.tokens['--color-primary']);
  assert.notEqual(experienceProfiles.adult.mascotFamily, experienceProfiles.teen.mascotFamily);
  assert.equal(resolveExperienceProfile('teen'), 'teen');
  assert.equal(resolveExperienceProfile(12), 'adult');
});

test('progress stays accessible for empty, overflowing, and malformed totals', () => {
  assert.deepEqual(normalizedProgress(3, 7), { value: 3, max: 7 });
  assert.deepEqual(normalizedProgress(10, 7), { value: 7, max: 7 });
  assert.deepEqual(normalizedProgress(-1, 7), { value: 0, max: 7 });
  assert.deepEqual(normalizedProgress(NaN, 0), { value: 0, max: 1 });
});

test('versioned preferences survive reload and tolerate unavailable storage', () => {
  const values = new Map();
  globalThis.window = { localStorage: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } };
  savePresentationPreference('locale', 'en');
  assert.equal(readPresentationPreference('locale'), 'en');
  values.set('locale', '{broken');
  assert.equal(readPresentationPreference('locale'), undefined);
  values.set('locale', JSON.stringify({ version: 2, value: 'en' }));
  assert.equal(readPresentationPreference('locale'), undefined);
  globalThis.window = { get localStorage() { throw new Error('Storage disabled'); } };
  assert.equal(readPresentationPreference('locale'), undefined);
  assert.doesNotThrow(() => savePresentationPreference('locale', 'en'));
  delete globalThis.window;
  assert.equal(readPresentationPreference('locale'), undefined);
});
