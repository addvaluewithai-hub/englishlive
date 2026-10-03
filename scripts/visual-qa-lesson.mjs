import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { learnV2LessonById } from '../src/learnV2/catalog.ts';

const baseUrl = process.env.VISUAL_QA_BASE_URL ?? 'http://127.0.0.1:4173';
const outputDir = process.env.VISUAL_QA_OUTPUT ?? 'artifacts/visual-qa';
const lesson = learnV2LessonById('a1-u1-l02');
assert.ok(lesson, 'QA lesson must exist');
const profile = { version: 1, firstName: 'Alex أليكس', goals: ['everyday'], comfort: 'freeze', characterId: 'otti', createdAt: '2026-10-03T00:00:00Z' };
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
let scenarios = 0;

try {
  for (const locale of ['ar', 'en']) {
    for (const experience of ['adult', 'teen']) {
      for (const width of [320, 390, 768, 1024, 1440]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        await context.addInitScript(({ profile, locale, experience }) => {
          localStorage.setItem('englishlive.learner-profile.v1', JSON.stringify(profile));
          localStorage.setItem('englotti.ui.locale.v1', JSON.stringify({ version: 1, value: locale }));
          localStorage.setItem('englotti.ui.experience.v1', JSON.stringify({ version: 1, value: experience }));
        }, { profile, locale, experience });

        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(`${baseUrl}/learn/lesson/${lesson.id}`);

        const boundary = page.locator('[data-englotti-ui]');
        await boundary.waitFor();
        assert.equal(await boundary.getAttribute('lang'), locale);
        assert.equal(await boundary.getAttribute('dir'), locale === 'ar' ? 'rtl' : 'ltr');
        assert.equal(await boundary.getAttribute('data-experience'), experience);
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.locator('h1').getAttribute('lang'), locale === 'ar' ? 'ar' : 'en');
        assert.equal(await page.locator('[data-lesson-step-target]').count(), 5);
        assert.equal(await page.locator('[data-lesson-step]').getAttribute('data-lesson-step'), 'goal');
        assert.equal(await page.locator('nav a[aria-current="page"]').getAttribute('href'), '/learn');
        assert.equal(await boundary.evaluate((node) => Number.parseFloat(getComputedStyle(node).getPropertyValue('--motion-normal'))), 0);

        await page.locator('[data-lesson-step-target="prepare"]').click();
        assert.equal(await page.locator('[data-lesson-step]').getAttribute('data-lesson-step'), 'prepare');
        const knownToggle = page.locator('[data-known-toggle]').first();
        await knownToggle.click();
        assert.equal(await knownToggle.getAttribute('aria-pressed'), 'true');

        await page.locator('[data-lesson-step-target="listen"]').click();
        assert.equal(await page.locator('[data-lesson-step]').getAttribute('data-lesson-step'), 'listen');
        const transcriptToggle = page.locator('[data-transcript-toggle]').first();
        await transcriptToggle.click();
        assert.equal(await transcriptToggle.getAttribute('aria-expanded'), 'true');
        assert.equal(await page.locator('[data-transcript]').count(), 1);
        const firstQuestionOption = page.locator('[data-question-option]').first();
        if (await firstQuestionOption.count()) {
          await firstQuestionOption.click();
          assert.equal(await page.locator('[data-question-option]').first().isVisible(), true);
        }

        await page.locator('[data-lesson-step-target="mission"]').click();
        assert.equal(await page.locator('[data-lesson-step]').getAttribute('data-lesson-step'), 'mission');
        assert.equal(await page.locator(`a[href="/speak/live/${lesson.missionScenarioId}"]`).count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'lesson horizontal overflow');
        assert.deepEqual(errors, []);

        if ((width === 390 && locale === 'ar' && experience === 'adult') || (width === 1440 && locale === 'en' && experience === 'adult')) {
          await page.screenshot({ path: path.join(outputDir, `lesson-${locale}-${experience}-${width}.png`), fullPage: true });
        }

        scenarios += 1;
        await context.close();
      }
    }
  }
  console.log(`Learn lesson passed ${scenarios} viewport/locale/theme scenarios with step, known-language, transcript, mission-link, reduced-motion, and overflow checks.`);
} finally {
  await browser.close();
}
