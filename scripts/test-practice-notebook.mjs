import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSilentIssueCollector } from '../src/practice/silentIssues.ts';
import { practiceMissionContractBySlug } from '../src/practice/missions/catalog.ts';
import { briefingNarration, reviewNarration } from '../src/practice/ottiNarration.ts';
import { onRequestPost } from '../functions/api/gemini-token.ts';

const mission = practiceMissionContractBySlug('a2-order-with-preferences');
const issue = (n = 0) => ({ original_en: `He go ${n}`, better_en: `He goes ${n}`,
  explanation_ar: 'نضيف s', explanation_en: 'Third-person singular takes s.', confidence: 'high' });

test('notebook retains all distinct issues beyond former limits, groups only identical correction pairs', () => {
  const collector = createSilentIssueCollector(mission);
  for (let n = 0; n < 30; n++) assert.deepEqual(collector.tool.handle(issue(n)), { saved: true });
  assert.deepEqual(collector.tool.handle(issue()), { saved: false });
  assert.deepEqual(collector.tool.handle({ ...issue(), better_en: 'He went 0' }), { saved: true });
  assert.equal(collector.getIssues().length, 31);
  const review = reviewNarration(mission, 'en', collector.getIssues());
  assert.match(review.text, /He go 29/);
  assert.match(review.text, /He went 0/);
  assert.deepEqual(collector.getDiagnostics(), { calls: 32, saved: 31, rejected: 1, reasons: { repeat: 1 } });
});

test('no calls and rejected calls are distinguishable without retaining raw rejected speech', () => {
  const collector = createSilentIssueCollector(mission);
  assert.equal(collector.getDiagnostics().calls, 0);
  collector.tool.handle({ ...issue(), confidence: 'low' });
  collector.tool.handle({ ...issue(), explanation_ar: '' });
  const diagnostics = collector.getDiagnostics();
  assert.deepEqual(diagnostics.reasons, { confidence: 1, missing_fields: 1 });
  assert.doesNotMatch(JSON.stringify(diagnostics), /He go/);
  diagnostics.reasons.confidence = 999;
  assert.equal(collector.getDiagnostics().reasons.confidence, 1);
});

test('introduction permits questions without assessing samples, review stays interactive and evidence-bound', () => {
  for (const locale of ['ar', 'en']) {
    const intro = briefingNarration(mission, locale);
    assert.match(intro.instruction, /Listen and answer/);
    assert.match(intro.instruction, /must not be evaluated/);
    assert.match(intro.instruction, /Do not demand a scripted approval/);
    const review = reviewNarration(mission, locale, []);
    assert.match(review.instruction, /interactive review conversation/);
    assert.match(review.instruction, /follow-up questions/);
    assert.match(review.instruction, /never add rehearsal mistakes/);
    assert.doesNotMatch(review.instruction, /no interactive questions/);
    assert.match(review.text, /NO CONFIDENT LANGUAGE ISSUES/);
  }
});

test('issued REST token locks audio/model while allowing browser tool declarations', async (t) => {
  let sent;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    sent = { url, body: JSON.parse(options.body) };
    return Response.json({ name: 'auth_tokens/fake' });
  });
  const response = await onRequestPost({ request: new Request('https://app.test/api/gemini-token', {
    method: 'POST', headers: { origin: 'https://app.test' },
  }), env: { GEMINI_API_KEY: 'test-only' } });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).model, 'gemini-3.8-live');
  assert.match(sent.url, /v1beta\/auth_tokens$/);
  assert.equal(sent.body.fieldMask, 'model,generationConfig.responseModalities');
  assert.equal(sent.body.bidiGenerateContentSetup.model, 'models/gemini-3.8-live');
  assert.equal(sent.body.bidiGenerateContentSetup.tools, undefined);
});
