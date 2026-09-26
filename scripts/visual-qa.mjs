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

const scenarios = [
  { name: 'landing', path: '/', profile: false },
  { name: 'onboarding', path: '/onboarding', profile: false },
  { name: 'home', path: '/home' },
  { name: 'learn-levels', path: '/learn' },
  { name: 'level-a1', path: '/learn/level/a1' },
  { name: 'unit-1', path: '/learn/unit/a1-u1-first-contact' },
  { name: 'lesson-live-idle', path: '/scene-lesson/a1-u1-l02-how-old-are-you?character=reem' },
  { name: 'lesson-complete', path: '/lesson-complete/a1-u1-l01-hello-im?character=reem' },
  { name: 'free-speak', path: '/speak' },
  { name: 'progress', path: '/progress' },
  { name: 'teachers', path: '/characters' },
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
      await page.screenshot({
        path: path.join(outputDir, `${viewport.name}--${scenario.name}.png`),
        fullPage: scenario.name !== 'lesson-live-idle',
      });

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
