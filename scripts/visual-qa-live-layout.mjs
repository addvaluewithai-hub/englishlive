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
const practiceCopy = {
  ar: {
    brand: 'تدريب',
    close: 'إنهاء التدريب',
    status: 'دورك',
    hintTitle: 'محتاج Hint؟',
    hintBody: 'هتتعمل على سياق المحادثة الحالية',
    hintSide: 'Hint ذكية',
    mic: 'دورك',
    keyboard: 'اكتب بدل الكلام',
    placeholder: 'اكتب اللي عايز تقوله…',
    send: 'إرسال',
  },
  en: {
    brand: 'Practice',
    close: 'End practice',
    status: 'Your turn',
    hintTitle: 'Need a hint?',
    hintBody: 'It will use the current conversation context',
    hintSide: 'Smart hint',
    mic: 'Your turn',
    keyboard: 'Type instead of speaking',
    placeholder: 'Type what you want to say…',
    send: 'Send',
  },
};
const guidedCopy = {
  ar: {
    header: 'تدريب موجّه',
    round: 'الجولة 1',
    close: 'إنهاء التدريب',
    status: 'دورك الآن',
    yourTurn: 'دورك',
    help: 'اقرأها بصوتك — وغيّر اللي بين [ ]',
    mic: 'اتكلم',
  },
  en: {
    header: 'Guided practice',
    round: 'Round 1',
    close: 'End guided practice',
    status: 'Your turn',
    yourTurn: 'YOUR TURN',
    help: 'Read it aloud — change what is inside [ ]',
    mic: 'Speak',
  },
};
const independentCopy = {
  ar: {
    header: 'تدريب مستقل',
    close: 'إنهاء المحادثة',
    status: 'دورك الآن',
    hintLabel: 'تلميح معنى الجولة الثانية',
    hintHelp: 'المعنى المطلوب — قولها بالإنجليزي بطريقتك',
    helpArabic: 'اشرح بالعربي',
    mic: 'دورك',
    keyboard: 'اكتب بدل الكلام',
    copyLog: 'نسخ لوج المحادثة',
    placeholder: 'اكتب اللي عايز تقوله…',
    send: 'إرسال',
  },
  en: {
    header: 'Independent practice',
    close: 'End conversation',
    status: 'Your turn',
    hintLabel: 'Round 2 meaning hint',
    hintHelp: 'Meaning to express — say it in English in your own way',
    helpArabic: 'Explain in Arabic',
    mic: 'Your turn',
    keyboard: 'Type instead of speaking',
    copyLog: 'Copy conversation log',
    placeholder: 'Type what you want to say…',
    send: 'Send',
  },
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
            assert.equal(await page.locator('.fs-live-brand strong').innerText(), expected.brand);
            assert.equal(await page.locator('.fs-live-close').getAttribute('aria-label'), expected.close);
            assert.equal(await page.locator('.fs-live-status strong').innerText(), expected.status);
            assert.equal(await page.locator('.fs-live-title span[lang="ar"]').getAttribute('dir'), 'rtl');
            assert.ok((await page.locator('.fs-live-title span[lang="ar"]').innerText()).length > 0);
            assert.equal(await page.locator('.sp-otti-transcript small span[lang="ar"]').getAttribute('dir'), 'rtl');
            assert.equal(await page.locator('.practice-hint-toggle strong').innerText(), expected.hintTitle);
            assert.equal(await page.locator('.practice-hint-toggle small').innerText(), expected.hintBody);
            assert.equal(await page.locator('.practice-live-side-label').innerText(), expected.hintSide);
            assert.equal(await page.locator('.fs-mic-control small').innerText(), expected.mic);
            assert.equal(await page.locator('.fs-keyboard-control').getAttribute('aria-label'), expected.keyboard);
            await page.locator('.fs-keyboard-control').click();
            assert.equal(await page.locator('.fs-type-row input').getAttribute('lang'), 'en');
            assert.equal(await page.locator('.fs-type-row input').getAttribute('dir'), 'ltr');
            assert.equal(await page.locator('.fs-type-row input').getAttribute('placeholder'), expected.placeholder);
            assert.equal(await page.locator('.fs-type-row button').innerText(), expected.send);
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
