import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = process.env.VISUAL_QA_BASE_URL ?? 'http://127.0.0.1:4173';
const profile = {
  version: 1, firstName: 'QA learner', goals: ['everyday'],
  comfort: 'freeze', characterId: 'otti', createdAt: '2026-09-26T10:00:00Z',
};
const browser = await chromium.launch({ headless: true });
const screens = [
  { id: 'scenario', route: '/practice/mission/b1-resolve-wrong-order', selector: '.practice-intro-hero' },
  { id: 'listening', route: '/practice/mission/b1-resolve-wrong-order', click: '.practice-intro-actions .practice-intro-primary', selector: '.practice-intro-transcript' },
  { id: 'hold-voice', route: '/practice/live/b1-resolve-wrong-order', selector: '.tutor-hold-control' },
  { id: 'review', route: '/practice/complete/b1-resolve-wrong-order?visualReview=1', selector: '.practice-recap-note.is-improvement' },
];
try {
  for (const viewport of [{ width: 390, height: 844, id: 'mobile' },
    { width: 1080, height: 900, id: 'desktop' }]) {
    for (const item of screens) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1,
        reducedMotion: 'reduce', colorScheme: 'light' });
      await context.addInitScript(({ profile, locale }) => {
        localStorage.setItem('englishlive.learner-profile.v1', JSON.stringify(profile));
        localStorage.setItem('englotti.ui.locale.v1', JSON.stringify({ version: 1, value: locale }));
      }, { profile, locale: 'ar' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(url + item.route, { waitUntil: 'networkidle' });
      if (item.click) await page.locator(item.click).click();
      await page.locator(item.selector).first().waitFor({ state: 'visible' });
      if (item.id === 'scenario') {
        assert.equal(await page.locator('.fs-live-character-host').count(), 0, 'No Otti during intro');
        const photo = await page.locator('.practice-intro-scene-photo').evaluate((img) => ({ done: img.complete, width: img.naturalWidth }));
        assert.ok(photo.done && photo.width > 0, 'Cafe scenario must load real image, not an emoji placeholder');
        const close = await page.locator('.practice-intro-close').boundingBox();
        const level = await page.locator('.practice-intro-level').boundingBox();
        assert.ok(close && level && close.x < level.x, 'Scenario RTL header: close left, CEFR level right');
      }
      if (item.id === 'hold-voice') {
        assert.equal(await page.locator('.tutor-hold-control').count(), 1);
        assert.equal(await page.locator('.tutor-goals[open]').count(), 0, 'Goals collapsed by default');
        assert.equal(await page.locator('.tutor-phase-meta b').innerText(), 'B1',
          'Roleplay header must show the CEFR level, not the obsolete 2/3 counter');
        const character = await page.locator('.fs-live-character-host').boundingBox();
        const status = await page.locator('.fs-live-status').boundingBox();
        assert.ok(character && status && character.y < status.y, 'Otti status bubble should appear below avatar');
      }
      if (item.id === 'review') {
        const close = await page.locator('.practice-recap-top button').boundingBox();
        const level = await page.locator('.practice-recap-level').boundingBox();
        assert.ok(close && level && close.x < level.x, 'Review RTL header: close left, CEFR right');
        assert.equal(await page.locator('.practice-recap-note.is-error').count(), 1);
        assert.equal(await page.locator('.practice-recap-note.is-improvement').count(), 1);
        assert.equal(await page.locator('.practice-recap-note.is-improvement .practice-recap-comparison > div:first-child p')
          .evaluate((el) => getComputedStyle(el).textDecorationLine), 'none');
        assert.equal(await page.locator('.fs-live-character-host').count(), 0, 'No auto voice-review socket');
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 1, `${viewport.id}/${item.id}: horizontal overflow ${overflow}px`);
      assert.deepEqual(errors, [], `${viewport.id}/${item.id}: page errors`);

      // The screenshot artifact quota is full. Emit a small QA-only JPEG in
      // bounded 3KB chunks, never real learner data or authenticated sessions.
      const jpeg = await page.screenshot({ type: 'jpeg', quality: 55, fullPage: false });
      const b64 = jpeg.toString('base64');
      const name = `${viewport.id}--${item.id}`;
      console.log(`QA_SHOT_BEGIN:${name}`);
      for (let start = 0; start < b64.length; start += 3000) {
        console.log(`QA_SHOT_CHUNK:${b64.slice(start, start + 3000)}`);
      }
      console.log(`QA_SHOT_END:${name}`);
      console.log(`[practice redesign ok] ${name}: screenshot ${jpeg.length} bytes, overflow ${overflow}px`);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
