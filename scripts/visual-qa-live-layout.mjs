import { practiceCopy, guidedCopy, independentCopy, freeSpeakCopy } from './visual-live-copy.mjs';
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
  { name: 'guided-live-foundation', path: '/speak/live/learn-v2-a1-u1-l01' },
  { name: 'independent-round2-foundation', path: '/speak/live/learn-v2-a1-u1-l01?round=independent' },
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

          if (route.name === 'practice-live-foundation') {
            const expected = practiceCopy[locale];
            const practice = page.locator('.practice-live');
            await practice.waitFor();
            assert.equal(await practice.getAttribute('dir'), null, 'Practice Live must inherit the live layout direction');
            assert.equal(await practice.evaluate((node) => getComputedStyle(node).direction), locale === 'ar' ? 'rtl' : 'ltr');
            assert.equal(await page.locator('.practice-live .fs-live-brand').evaluate((node) => getComputedStyle(node).display), 'none');
            assert.equal(await page.locator('.fs-live-close').getAttribute('aria-label'), expected.close);
            assert.equal(await page.locator('.fs-live-status strong').innerText(), expected.status);
            assert.equal(await page.locator('.tutor-phase-meta').count(), 1);
            assert.equal(await page.locator('.tutor-stage .sp-otti-transcript').count(), 1);
            assert.equal(await page.locator('.tutor-stage .fs-live-character-host').count(), 1, 'roleplay uses the animated speaking stage');
            assert.equal(await page.locator('.practice-hint-toggle strong').innerText(), expected.hintTitle);
            assert.equal(await page.locator('.practice-hint-toggle small').innerText(), expected.hintBody);
            assert.equal(await page.locator('.tutor-stage').evaluate((node) => getComputedStyle(node).backgroundImage), 'none');
            assert.equal(await page.locator('.fs-keyboard-control').getAttribute('aria-label'), expected.keyboard);
            assert.equal(await page.locator('.tutor-action').count(), 1);

          }

          if (route.name === 'guided-live-foundation') {
            const expected = guidedCopy[locale];
            const guided = page.locator('.guided-live');
            await guided.waitFor();
            assert.equal(await guided.getAttribute('dir'), null, 'guided live must inherit the live layout direction');
            assert.equal(await guided.evaluate((node) => getComputedStyle(node).direction), locale === 'ar' ? 'rtl' : 'ltr');
            assert.equal((await page.locator('.fs-live-title').innerText()).includes(expected.header), true);
            assert.equal(await page.locator('.guided-round-pill').innerText(), expected.round);
            assert.equal(await page.locator('.fs-live-close').getAttribute('aria-label'), expected.close);
            assert.equal(await page.locator('.fs-live-status strong').innerText(), expected.status);
            assert.equal(await page.locator('.guided-response-card > div span').innerText(), expected.yourTurn);
            assert.equal(await page.locator('.guided-response-card > div small').innerText(), expected.help);
            assert.equal(await page.locator('.guided-response-card > strong').getAttribute('lang'), 'en');
            assert.equal(await page.locator('.guided-response-card > strong').getAttribute('dir'), 'ltr');
            assert.equal(await page.locator('.guided-mic-row .fs-mic-control small').innerText(), expected.mic);
            const authoredNote = page.locator('.guided-response-card > p');
            if (await authoredNote.count()) {
              assert.equal(await authoredNote.getAttribute('lang'), 'ar');
              assert.equal(await authoredNote.getAttribute('dir'), 'rtl');
            }
          }

          if (route.name === 'independent-round2-foundation') {
            const expected = independentCopy[locale];
            const live = page.locator('.sp-scenario-live');
            await live.waitFor();
            assert.equal(await live.getAttribute('dir'), null, 'independent live must inherit the live layout direction');
            assert.equal(await live.evaluate((node) => getComputedStyle(node).direction), locale === 'ar' ? 'rtl' : 'ltr');
            assert.equal((await page.locator('.fs-live-title').innerText()).includes(expected.header), true);
            assert.equal(await page.locator('.fs-live-close').getAttribute('aria-label'), expected.close);
            assert.equal(await page.locator('.fs-live-status strong').innerText(), expected.status);
            assert.equal(await page.locator('.round2-intent-card').getAttribute('aria-label'), expected.hintLabel);
            assert.equal(await page.locator('.round2-intent-card small').innerText(), expected.hintHelp);
            assert.equal(await page.locator('.round2-intent-card strong').getAttribute('lang'), 'ar');
            assert.equal(await page.locator('.round2-intent-card strong').getAttribute('dir'), 'rtl');
            assert.ok((await page.locator('.round2-intent-card strong').innerText()).length > 0);
            assert.equal(await page.locator('.sp-arabic-explain-button strong').innerText(), expected.helpArabic);
            assert.equal(await page.locator('.fs-mic-control small').innerText(), expected.mic);
            assert.equal(await page.locator('.fs-keyboard-control').getAttribute('aria-label'), expected.keyboard);
            assert.equal(await page.locator('.sp-copy-log-button').getAttribute('aria-label'), expected.copyLog);
            await page.locator('.fs-keyboard-control').click();
            assert.equal(await page.locator('.fs-type-row input').getAttribute('placeholder'), expected.placeholder);
            assert.equal(await page.locator('.fs-type-row button').innerText(), expected.send);
            await page.locator('.fs-keyboard-control').click();
          }

          if (route.name === 'free-speak-live-foundation') {
            const expected = freeSpeakCopy[locale];
            const live = page.locator('.free-speak-live');
            await live.waitFor();
            assert.equal(await live.getAttribute('dir'), null, 'Free Speak must inherit the live layout direction');
            assert.equal(await live.evaluate((node) => getComputedStyle(node).direction), locale === 'ar' ? 'rtl' : 'ltr');
            assert.equal(await page.locator('.fs-live-title').innerText(), expected.header);
            assert.equal(await page.locator('.fs-live-mode').innerText().then((text) => text.trim()), expected.mode);
            assert.equal(await page.locator('.fs-live-close').getAttribute('aria-label'), expected.close);
            assert.equal(await page.locator('.fs-live-status strong').innerText(), expected.status);
            assert.equal(await page.locator('.fs-help-control strong').innerText(), expected.helpArabic);
            assert.equal(await page.locator('.fs-mic-control small').innerText(), expected.mic);
            assert.equal(await page.locator('.fs-keyboard-control').getAttribute('aria-label'), expected.keyboard);
            assert.equal(await page.locator('.fs-history-button').getAttribute('aria-label'), expected.history);
            assert.equal(await page.locator('.fs-bubble-teacher p').getAttribute('dir'), 'auto');
          }

          assert.deepEqual(errors, []);

          if (locale === 'ar' && experience === 'adult' && width === 390) {
            await page.screenshot({ path: path.join(outputDir, `${route.name}-ar-adult-390.png`), fullPage: true });
          }
          if (locale === 'en' && experience === 'teen' && width === 1280) {
            await page.screenshot({ path: path.join(outputDir, `${route.name}-en-teen-1280.png`), fullPage: true });
          }

          scenarios += 1;
          await context.close();
        }
      }
    }
  }

  for (const locale of ['ar', 'en']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(({ profile, locale }) => {
      localStorage.setItem('englishlive.learner-profile.v1', JSON.stringify(profile));
      localStorage.setItem('englotti.ui.locale.v1', JSON.stringify({ version: 1, value: locale }));
      localStorage.setItem('englotti.ui.experience.v1', JSON.stringify({ version: 1, value: 'adult' }));
    }, { profile, locale });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/practice/live/a1-ask-someone-to-repeat`, { waitUntil: 'networkidle' });
    const expected = practiceCopy[locale];
    const keyboard = page.locator('.practice-live .fs-keyboard-control').first();
    await keyboard.click();
    const input = page.locator('.fs-type-row input');
    assert.equal(await input.getAttribute('dir'), 'auto');
    assert.equal(await input.getAttribute('placeholder'), expected.placeholder);
    assert.equal(await page.locator('.fs-type-row button').innerText(), expected.send);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `Practice composer ${locale}: horizontal overflow`);
    // Runtime pause/resume is covered by the media state-machine tests, not static visual mode.
    await page.goto(`${baseUrl}/practice/mission/b1-resolve-wrong-order`, { waitUntil: 'networkidle' });
    const intro = page.locator('.practice-intro');
    await intro.waitFor();
    assert.equal(await page.locator('.practice-intro .fs-live-character-host').count(), 0, 'intro must not start Live or mount Otti');
    await page.locator('.practice-intro-relaxed input').check();
    await page.locator('.practice-intro-secondary').click();
    assert.equal(new URL(page.url()).search, '?pace=relaxed');
    await page.locator('.practice-live .practice-conversation-goals > summary').first().waitFor();
    assert.equal(await page.locator('.tutor-goal-items > span').count(), 4);
    assert.equal(await page.locator('.tutor-goal-items > .is-observed').count(), 0, 'goals must not be claimed without observed speech');
    await page.locator('.tutor-action').click();
    await page.locator('.tutor-notes-toggle').waitFor();
    assert.equal(await page.locator('.tutor-live').getAttribute('aria-label'), locale === 'ar' ? 'نراجع سوا' : 'Review together');
    assert.equal(await page.locator('.tutor-stage .fs-live-character-host').count(), 1, 'review keeps the same animated stage');
    assert.equal(await page.locator('.tutor-goal-items > .is-observed').count(), 0);
    assert.equal(await page.locator('.tutor-note-list li').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `Practice recap ${locale}: horizontal overflow`);
    await context.close();
  }

  for (const locale of ['ar', 'en']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(({ profile, locale }) => {
      localStorage.setItem('englishlive.learner-profile.v1', JSON.stringify(profile));
      localStorage.setItem('englotti.ui.locale.v1', JSON.stringify({ version: 1, value: locale }));
      localStorage.setItem('englotti.ui.experience.v1', JSON.stringify({ version: 1, value: 'adult' }));
    }, { profile, locale });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/speak/just-chat`, { waitUntil: 'networkidle' });
    const expected = freeSpeakCopy[locale];
    await page.locator('.fs-history-button').click();
    const history = page.locator('.fs-history-sheet');
    assert.equal(await history.getAttribute('aria-label'), expected.history);
    assert.equal(await history.locator('header strong').innerText(), expected.history);
    assert.equal(await history.locator('header button').getAttribute('aria-label'), expected.closeHistory);
    assert.equal(await page.locator('.fs-history-empty').innerText(), expected.historyEmpty);
    await history.locator('header button').click();
    await page.locator('.fs-keyboard-control').click();
    const input = page.locator('.fs-type-row input');
    assert.equal(await input.getAttribute('dir'), 'ltr');
    assert.equal(await input.getAttribute('placeholder'), expected.placeholder);
    assert.equal(await page.locator('.fs-type-row button').innerText(), expected.send);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `Free Speak interactions ${locale}: horizontal overflow`);
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(({ profile }) => {
      localStorage.setItem('englishlive.learner-profile.v1', JSON.stringify(profile));
      localStorage.setItem('englotti.ui.locale.v1', JSON.stringify({ version: 1, value: 'ar' }));
      localStorage.setItem('englotti.ui.experience.v1', JSON.stringify({ version: 1, value: 'adult' }));
    }, { profile });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/practice/live/a1-ask-someone-to-repeat`, { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('href'), '#englotti-live-main');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator(':focus').getAttribute('id'), 'englotti-live-main');
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(({ profile }) => {
    localStorage.setItem('englishlive.learner-profile.v1', JSON.stringify(profile));
  }, { profile });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/practice`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('[data-englotti-live-ui]').count(), 0, 'non-live Practice must stay outside the live foundation boundary');
  await context.close();

  console.log(`Live conversation foundation passed ${scenarios} locale/experience/viewport/route scenarios plus isolated Practice and Free Speak interaction checks.`);
} finally {
  await browser.close();
}

