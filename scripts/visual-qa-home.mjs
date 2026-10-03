import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { availableLearnLessons, learnRoadmapLevelById } from '../src/learnV2/roadmap.ts';

const baseUrl = process.env.VISUAL_QA_BASE_URL ?? 'http://127.0.0.1:4173';
const outputDir = process.env.VISUAL_QA_OUTPUT ?? 'artifacts/visual-qa';
const lessons = availableLearnLessons(learnRoadmapLevelById('a1'));
const profile = { version: 1, firstName: 'Alex أليكس', goals: ['everyday'], comfort: 'freeze', characterId: 'otti', createdAt: '2026-10-03T00:00:00Z' };
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.VISUAL_QA_CHROMIUM ? { executablePath: process.env.VISUAL_QA_CHROMIUM } : {}),
  args: ['--no-sandbox'],
});
let scenarios = 0;
try {
  for (const locale of ['ar', 'en']) {
    for (const experience of ['adult', 'teen']) {
      for (const width of [320, 390, 768, 1024, 1440]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        // Seed once per context: reload must test persisted user changes.
        await context.addInitScript(({ profile, locale, experience }) => {
          if (sessionStorage.getItem('ui-qa-seeded')) return;
          sessionStorage.setItem('ui-qa-seeded', '1');
          localStorage.setItem('englishlive.learner-profile.v1', JSON.stringify(profile));
          localStorage.setItem('englotti:learn-completed-v1', JSON.stringify(['a1-u1-l01']));
          localStorage.setItem('englotti.ui.locale.v1', JSON.stringify({ version: 1, value: locale }));
          localStorage.setItem('englotti.ui.experience.v1', JSON.stringify({ version: 1, value: experience }));
        }, { profile, locale, experience });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(`${baseUrl}/home`);
        await page.locator('[data-englotti-ui]').waitFor();
        const boundary = page.locator('[data-englotti-ui]');
        assert.equal(await boundary.getAttribute('dir'), locale === 'ar' ? 'rtl' : 'ltr');
        assert.equal(await boundary.getAttribute('lang'), locale);
        assert.equal(await boundary.getAttribute('data-experience'), experience);
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.locator('a[href="/learn/lesson/a1-u1-l02"]').count(), 1);
        assert.equal(await page.locator('progress').getAttribute('value'), '1');
        assert.equal(await page.locator('progress').getAttribute('max'), '7');
        assert.equal(await page.locator('nav a[aria-current="page"]').getAttribute('href'), '/home');
        assert.equal(await page.locator('vite-error-overlay').count(), 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${locale}/${experience}/${width}: horizontal overflow`);
        assert.equal(await boundary.evaluate((node) => Number.parseFloat(getComputedStyle(node).getPropertyValue('--motion-normal'))), 0);
        assert.deepEqual(errors, []);
        if (width === 390 || width === 1440) await page.screenshot({ path: path.join(outputDir, `home-${locale}-${experience}-${width}.png`), fullPage: true });

        if (width === 390 && experience === 'adult') {
          await page.keyboard.press('Tab');
          assert.equal(await page.locator(':focus').getAttribute('href'), '#englotti-main');
          await page.keyboard.press('Enter');
          assert.equal(await page.locator(':focus').getAttribute('id'), 'englotti-main');
          const nextLocale = locale === 'ar' ? 'en' : 'ar';
          await page.locator('select').selectOption(nextLocale);
          assert.equal(await boundary.getAttribute('lang'), nextLocale);
          await page.reload();
          assert.equal(await boundary.getAttribute('lang'), nextLocale);
          await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, '200% text overflow');
          await page.evaluate(() => { document.documentElement.style.fontSize = ''; });

          for (const target of ['/learn', '/practice', '/account', '/progress']) {
            await page.locator(`a[href="${target}"]`).first().click();
            assert.equal(new URL(page.url()).pathname, target);
            assert.equal(await page.locator('[data-englotti-ui]').count(), 0, 'Legacy pages must not inherit the new theme boundary');
            await page.goto(`${baseUrl}/home`);
            await boundary.waitFor();
          }
          // First lesson, complete roadmap, and missing profile.
          await page.evaluate(() => { localStorage.removeItem('englotti:learn-completed-v1'); });
          await page.reload();
          assert.equal(await page.locator('a[href="/learn/lesson/a1-u1-l01"]').count(), 1);
          await page.locator('a[href="/learn/lesson/a1-u1-l01"]').click();
          assert.equal(new URL(page.url()).pathname, '/learn/lesson/a1-u1-l01');
          await page.goto(`${baseUrl}/home`);
          await page.evaluate((ids) => { localStorage.setItem('englotti:learn-completed-v1', JSON.stringify(ids)); }, lessons.map((lesson) => lesson.id));
          await page.reload();
          assert.equal(await page.locator(`a[href="/learn/lesson/${lessons.at(-1).id}"]`).count(), 1);
          assert.equal(await page.locator('progress').getAttribute('value'), '3');
          assert.equal(await page.locator('progress').getAttribute('max'), '3');
          await page.evaluate(() => { localStorage.removeItem('englishlive.learner-profile.v1'); });
          await page.reload();
          assert.equal(await page.locator('a[href="/onboarding"]').count(), 1);
          assert.equal(await page.locator('progress').count(), 0);
          assert.deepEqual(errors, []);
        }
        scenarios += 1;
        await context.close();
      }
    }
  }
  console.log(`Home UI passed ${scenarios} viewport/locale/theme scenarios, plus navigation, persistence, progress, keyboard, and text resizing checks.`);
  // Optional inspection fallback when Actions artifact storage is unavailable.
  // These screenshots contain only the synthetic QA learner above.
  if (process.env.VISUAL_QA_INLINE_SCREENSHOTS === '1') {
    for (const name of ['home-ar-adult-390.png', 'home-en-adult-1440.png']) {
      console.log(`HOME_SCREENSHOT ${name} ${(await readFile(path.join(outputDir, name))).toString('base64')}`);
    }
  }
} finally { await browser.close(); }
