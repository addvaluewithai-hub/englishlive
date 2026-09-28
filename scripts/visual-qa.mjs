import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.VISUAL_QA_BASE_URL ?? 'http://127.0.0.1:4173';
const outputDir = process.env.VISUAL_QA_OUTPUT ?? 'artifacts/visual-qa';

const characterIds = [
  'otti',
  'fustuq',
  'hakim',
  'reem',
  'marwan',
  'amal',
  'ember',
  'louz',
  'sugar',
  'bondoq',
  'lumi',
  'naseem',
];

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

const freeSpeakRecapFixture = {
  id: '00000000-0000-4000-8000-000000000001',
  modeId: 'just-chat',
  characterSlug: 'otti',
  characterName: 'Otti',
  startedAt: '2026-09-28T08:00:00.000Z',
  endedAt: '2026-09-28T08:08:00.000Z',
  durationSeconds: 480,
  status: 'completed',
  analysisStatus: 'complete',
  analysisModel: 'gemini-3.5-flash-lite',
  transcript: [
    { id: 't1', speaker: 'teacher', text: 'How is your day going?', atMs: 1000 },
    { id: 't2', speaker: 'learner', text: 'I am doing good. I worked a lot today.', atMs: 5500 },
    { id: 't3', speaker: 'learner', text: 'I go yesterday to a project meeting.', atMs: 11500 },
  ],
  analysis: {
    schemaVersion: 1,
    headlineAr: 'أحسنت!',
    conversationTopicAr: 'مشروعك والشغل',
    summaryAr: 'اتكلمت عن يومك وشغلك والمشروع اللي بتشتغل عليه.',
    strengths: ['جاوبت بسرعة وحافظت على المحادثة', 'استخدمت جمل كاملة عشان توصل فكرتك'],
    corrections: [
      { original: 'I go yesterday', improved: 'I went yesterday', noteAr: 'مع yesterday استخدم الماضي went.' },
      { original: 'He don’t like it', improved: 'He doesn’t like it', noteAr: 'مع he نستخدم doesn’t.' },
    ],
    vocabulary: [
      { word: 'project', meaningAr: 'مشروع', source: 'learner' },
      { word: 'deadline', meaningAr: 'موعد نهائي', source: 'teacher' },
      { word: 'meeting', meaningAr: 'اجتماع', source: 'learner' },
      { word: 'confident', meaningAr: 'واثق', source: 'teacher' },
    ],
    nextFocusAr: 'جرّب تستخدم الماضي البسيط لما تحكي عن حاجة حصلت وانتهت.',
  },
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
  await page.waitForFunction(
    (expected) => document.querySelectorAll('.v2-teacher-card .character-portrait svg').length === expected,
    characterIds.length,
  );
};

const validateTeacherRoster = async (page) => {
  await page.waitForFunction(
    (expected) => {
      const cards = document.querySelectorAll('.v2-character-card');
      const portraits = document.querySelectorAll('.v2-character-card .character-portrait svg');
      return cards.length === expected && portraits.length === expected;
    },
    characterIds.length,
  );
};

const validateLiveCharacter = async (page, expectedId) => {
  const host = page.locator('.character-host[data-renderer]');
  await host.waitFor({ state: 'visible' });
  await host.locator('svg').waitFor({ state: 'visible' });
  const label = await host.getAttribute('aria-label');
  if (!label) throw new Error(`Character ${expectedId} mounted without an accessible label.`);
};

const characterSessionScenarios = characterIds.map((characterId) => ({
  name: `character-session-${characterId}`,
  path: `/scene-lesson/a1-u1-l02-how-old-are-you?character=${characterId}`,
  prepare: async (page) => validateLiveCharacter(page, characterId),
}));

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
  ...characterSessionScenarios,
  {
    name: 'lesson-live-help',
    path: '/scene-lesson/a1-u1-l02-how-old-are-you?character=otti',
    prepare: async (page) => page.locator('button[aria-label="أدوات الدرس"]').click(),
  },
  { name: 'lesson-complete', path: '/lesson-complete/a1-u1-l01-hello-im?character=otti', full: true },
  { name: 'free-speak', path: '/speak', full: true },
  { name: 'free-speak-session', path: '/speak/just-chat?character=otti' },
  {
    name: 'free-speak-recap',
    path: '/speak/recap/visual-qa',
    full: true,
    historyState: { session: freeSpeakRecapFixture, relationshipProposal: null },
  },
  { name: 'progress', path: '/progress', full: true },
  { name: 'teachers', path: '/characters', prepare: validateTeacherRoster, full: true },
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

      await page.addInitScript(({ shouldSeedProfile, profileValue, progressValue, historyState }) => {
        localStorage.clear();
        sessionStorage.clear();
        if (shouldSeedProfile) {
          localStorage.setItem('englishlive.learner-profile.v1', JSON.stringify(profileValue));
          localStorage.setItem('englishlive.product-course.v1', JSON.stringify(progressValue));
        }
        if (historyState) {
          window.history.replaceState({ usr: historyState, key: 'visual-qa', idx: 0 }, '', window.location.href);
        }
      }, {
        shouldSeedProfile: scenario.profile !== false,
        profileValue: profile,
        progressValue: progress,
        historyState: scenario.historyState ?? null,
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
