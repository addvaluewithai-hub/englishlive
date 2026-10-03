import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.VISUAL_QA_BASE_URL ?? 'http://127.0.0.1:4173';
const outputDir = process.env.VISUAL_QA_OUTPUT ?? 'artifacts/visual-qa';
const profile = {
  version: 1,
  firstName: 'Alex أليكس',
  goals: ['everyday'],
  comfort: 'freeze',
  characterId: 'otti',
  createdAt: '2026-10-03T00:00:00Z',
};
const routes = [
  { name: 'practice-live-foundation', path: '/practice/live/a1-ask-someone-to-repeat' },
  { name: 'speaking-live-foundation', path: '/speak/live/hotel-room-problem?difficulty=recommended' },
  { name: 'free-speak-live-foundation', path: '/speak/just-chat' },
];
const expectedPrimary = {
  adult: 'rgb(23, 107, 102)',
  teen: 'rgb(89, 69, 161)',
};

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
let scenarios = 0;

try {
  for (const locale of ['ar', 'en']) {
    for (const experience of ['adult', 'teen']) {
      for (const width of [390, 1280]) {
        for (const route of routes) {
          const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
          await context.addInitScript(({ profile, locale, experience }) => {
            localStorage.setItem('englishlive.learner-profile.v1', JSON.stringify(profile));
            localStorage.setItem('englotti.ui.locale.v1', JSON.stringify({ version: 1, value: locale }));
            localStorage.setItem('englotti.ui.experience.v1', JSON.stringify({ version: 1, value: experience }));
          }, { profile, locale, experience });

          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });

          const boundary = page.locator('[data-englotti-live-ui]');
          await boundary.waitFor();
          assert.equal(await boundary.count(), 1);
          assert.equal(await boundary.getAttribute('lang'), locale);
          assert.equal(await boundary.getAttribute('dir'), locale === 'ar' ? 'rtl' : 'ltr');
          assert.equal(await boundary.getAttribute('data-experience'), experience);
          assert.equal(await page.locator('.app-shell').count(), 0, `${route.name}: legacy app shell must be bypassed`);
          assert.equal(await page.locator('#englotti-live-main').count(), 1);
          assert.equal(await page.locator('.fs-live').count(), 1);
          assert.equal(await page.locator('vite-error-overlay').count(), 0);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${route.name}: horizontal overflow`);
          assert.equal(await boundary.evaluate((node) => Number.parseFloat(getComputedStyle(node).getPropertyValue('--motion-normal'))), 0);

          const status = page.locator('.fs-live-status strong');
          if (await status.count()) {
            assert.equal(await status.first().evaluate((node) => getComputedStyle(node).color), expectedPrimary[experience]);
          }
          assert.deepEqual(errors, []);

          if (locale === 'ar' && experience === 'adult' && width === 390) {
            await page.screenshot({ path: path.join(outputDir, `${route.name}-ar-adult-390.png`), fullPage: true });
          }
          if (locale === 'en' && experience === 'teen' && width === 1280) {
            await page.screenshot({ path: path.join(outputDir, `${route.name}-en-teen-1280.png`), fullPage: true });
          }

          if (route.name === 'practice-live-foundation' && locale === 'ar' && experience === 'adult' && width === 390) {
            await page.keyboard.press('Tab');
            assert.equal(await page.locator(':focus').getAttribute('href'), '#englotti-live-main');
            await page.keyboard.press('Enter');
            assert.equal(await page.locator(':focus').getAttribute('id'), 'englotti-live-main');
          }

          scenarios += 1;
          await context.close();
        }
      }
    }
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(({ profile }) => {
    localStorage.setItem('englishlive.learner-profile.v1', JSON.stringify(profile));
  }, { profile });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/practice`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('[data-englotti-live-ui]').count(), 0, 'non-live Practice must stay outside the live foundation boundary');
  await context.close();

  console.log(`Live conversation foundation passed ${scenarios} locale/experience/viewport/route scenarios.`);
} finally {
  await browser.close();
}
