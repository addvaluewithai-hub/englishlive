import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.VISUAL_QA_BASE_URL ?? 'http://127.0.0.1:4173';
const outputDir = process.env.VISUAL_QA_OUTPUT ?? 'artifacts/visual-qa';

const profile = {
  version: 1,
  firstName: 'ياسر',
  goals: ['everyday'],
  comfort: 'freeze',
  characterId: 'reem',
  createdAt: '2026-09-26T10:00:00.000Z',
};

const progress = {
  version: 1,
  lessons: {
    'a1-u1-l01-hello-im': {
      lessonId: 'a1-u1-l01-hello-im',
      startedAt: '2026-09-26T10:05:00.000Z',
      completedAt: '2026-09-26T10:15:00.000Z',
      updatedAt: '2026-09-26T10:15:00.000Z',
    },
    'a1-u1-l02-how-old-are-you': {
      lessonId: 'a1-u1-l02-how-old-are-you',
      startedAt: '2026-09-26T10:20:00.000Z',
      updatedAt: '2026-09-26T10:20:00.000Z',
    },
  },
  updatedAt: '2026-09-26T10:20:00.000Z',
};

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 1000 },
];

const onboardingToGoals = async (page) => {
  await page.locator('.v2-onboarding-actions .v2-primary-button').click();
};

const onboardingToComfort = async (page) => {
  await onboardingToGoals(page);
  await page.locator('.v2-goal-card').first().click();
  await page.locator('.v2-onboarding-actions .v2-primary-button').click();
};

const onboardingToTeacher = async (page) => {
  await onboardingToComfort(page);
  await page.locator('.v2-comfort-card').first().click();
  await page.locator('.v2-onboarding-actions .v2-primary-button').click();
};

const scenarios = [
  { name: 'landing', path: '/', profile: false, full: true },
  { name: 'onboarding-name', path: '/onboarding', profile: false },
  { name: 'onboarding-goals', path: '/onboarding', profile: false, prepare: onboardingToGoals },
  { name: 'onboarding-comfort', path: '/onboarding', profile: false, prepare: onboardingToComfort },
  { name: 'onboarding-teacher', path: '/onboarding', profile: false, prepare: onboardingToTeacher, full: true },
  { name: 'home', path: '/home' },
  { name: 'learn-levels', path: '/learn', full: true },
  { name: 'level-a1', path: '/learn/level/a1', full: true },
  { name: 'unit-1', path: '/learn/unit/a1-u1-first-contact', full: true },
  { name: 'lesson-live-idle', path: '/scene-lesson/a1-u1-l02-how-old-are-you?character=reem' },
  {
    name: 'lesson-live-help',
    path: '/scene-lesson/a1-u1-l02-how-old-are-you?character=reem',
    prepare: async (page) => page.locator('button[aria-label="أدوات الدرس"]').click(),
  },
  { name: 'lesson-complete', path: '/lesson-complete/a1-u1-l01-hello-im?character=reem', full: true },
  { name: 'free-speak', path: '/speak', full: true },
  { name: 'progress', path: '/progress', full: true },
  { name: 'teachers', path: '/characters', full: true },
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of viewports) {
    for (const scenario of scenarios) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        colorScheme: 'light',
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();

      await page.addInitScript(({ shouldSeedProfile, profileValue, progressValue }) => {
        localStorage.clear();
        sessionStorage.clear();
        if (shouldSeedProfile) {
          localStorage.setItem('englishlive.learner-profile.v1', JSON.stringify(profileValue));
          localStorage.setItem('englishlive.product-course.v1', JSON.stringify(progressValue));
        }
      }, {
        shouldSeedProfile: scenario.profile !== false,
        profileValue: profile,
        progressValue: progress,
      });

      const errors = [];
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
      });

      await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: 'networkidle' });
      await page.locator('body').waitFor({ state: 'visible' });
      if (scenario.prepare) {
        await scenario.prepare(page);
        await page.waitForTimeout(120);
      }

      await page.screenshot({
        path: path.join(outputDir, `${viewport.name}--${scenario.name}.png`),
        fullPage: false,
      });

      if (scenario.full) {
        await page.screenshot({
          path: path.join(outputDir, `${viewport.name}--${scenario.name}--full.png`),
          fullPage: true,
        });
      }

      if (errors.length) {
        console.error(`[${viewport.name}/${scenario.name}] ${errors.join(' | ')}`);
        process.exitCode = 1;
      } else {
        console.log(`[ok] ${viewport.name}/${scenario.name}`);
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}
