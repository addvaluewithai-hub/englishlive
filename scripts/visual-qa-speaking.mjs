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
  characterId: 'otti',
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

const scenarios = [
  { name: 'practice-home', path: '/practice', full: true },
  { name: 'practice-a1-people-world', path: '/practice/A1/world/people-social', full: true },
  { name: 'practice-b1-travel-world', path: '/practice/B1/world/travel-transport', full: true },
  { name: 'legacy-speak-alias', path: '/speak', full: true },
  { name: 'speaking-lesson-start', path: '/speak/scenario/a1-s1-l01', full: true },
  { name: 'speaking-lesson-live', path: '/speak/live/a1-s1-l01', full: true },
  { name: 'speaking-b1-start', path: '/speak/scenario/b1-s1-l01', full: true },
  { name: 'speaking-b1-live', path: '/speak/live/b1-s1-l01', full: true },
  { name: 'speaking-world-travel', path: '/speak/world/travel', full: true },
  { name: 'speaking-scenario', path: '/speak/scenario/hotel-room-problem', full: true },
  { name: 'speaking-live', path: '/speak/live/hotel-room-problem?difficulty=recommended', full: true },
  { name: 'speaking-progress', path: '/speak/progress', full: true },
];

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 1000 },
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
      await page.addInitScript(({ profileValue, progressValue }) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('englishlive.learner-profile.v1', JSON.stringify(profileValue));
        localStorage.setItem('englishlive.product-course.v1', JSON.stringify(progressValue));
      }, { profileValue: profile, progressValue: progress });

      const errors = [];
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
      });

      await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: 'networkidle' });
      await page.locator('body').waitFor({ state: 'visible' });
      await page.waitForTimeout(150);

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
