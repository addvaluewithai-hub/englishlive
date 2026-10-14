import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSilentIssueCollector, FINAL_REVIEW_TOOL, PROGRESS_TOOL } from '../src/practice/silentIssues.ts';
import { parseIssue, parseImprovement } from '../src/practice/notebook/issueEvidence.ts';
import { practiceMissionContractBySlug } from '../src/practice/missions/catalog.ts';
import { briefingNarration, reviewNarration } from '../src/practice/ottiNarration.ts';
import { onRequestPost } from '../functions/api/gemini-token.ts';

const mission = practiceMissionContractBySlug('a2-order-with-preferences');
const issue = (n = 0) => ({ original_en: `He go ${n}`, better_en: `He goes ${n}`,
  explanation_ar: 'نضيف s', explanation_en: 'Third-person singular takes s.' });
const final = (issues, status = 'issues') => ({ status, issues });

test('roleplay offers exactly the per-turn notebook and the dedicated final review, both silent', () => {
  const collector = createSilentIssueCollector(mission);
  assert.deepEqual(collector.tools.map((tool) => tool.declaration.name), [PROGRESS_TOOL, FINAL_REVIEW_TOOL]);
  for (const tool of collector.tools) assert.equal(tool.declaration.behavior, 'NON_BLOCKING');
  assert.deepEqual(collector.progressTool.declaration.parameters.required, ['goal_ids'], 'issues are optional per turn');
  assert.deepEqual(collector.finalReviewTool.declaration.parameters.required, ['status', 'issues']);
});

test('a real error is kept even without explanations; quotes are never invented or normalized', () => {
  const beats = new Set(['order_drink']);
  const parsed = parseIssue({ original_en: 'I want large coffee', better_en: 'I want a large coffee' }, beats);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.issue.originalEn, 'I want large coffee');
  assert.equal(parsed.issue.feedbackAr, '');
  assert.deepEqual(parseIssue({ original_en: 'Large, please.', better_en: 'large please' }, beats), { ok: false, reason: 'unchanged' });
  assert.deepEqual(parseIssue({ original_en: 'x', better_en: 'y', confidence: 'low' }, beats), { ok: false, reason: 'not_confident' });
  assert.deepEqual(parseIssue({ better_en: 'y' }, beats), { ok: false, reason: 'missing_fields' });
  assert.deepEqual(parseIssue('He go', beats), { ok: false, reason: 'not_object' });
});

test('no cap: every distinct correction is retained; only identical pairs are grouped', () => {
  const collector = createSilentIssueCollector(mission);
  for (let n = 0; n < 30; n++) collector.progressTool.handle({ goal_ids: [], issues: [issue(n)] });
  collector.progressTool.handle({ goal_ids: [], issues: [issue(0), { ...issue(0), better_en: 'He went 0' }] });
  assert.equal(collector.getIssues().length, 31);
  const review = reviewNarration(mission, 'en', collector.getIssues());
  assert.match(review.text, /He go 29/);
  assert.match(review.text, /He went 0/);
  const diagnostics = collector.getDiagnostics();
  assert.deepEqual({ ...diagnostics, reasons: { ...diagnostics.reasons } }, {
    turnNotes: 31, finalReviewCalls: 0, finalStatus: null, saved: 31, fromTurns: 31, fromFinal: 0, rejected: 1, reasons: { repeat: 1 },
  });
});

test('final review saves errors the per-turn notes missed and repeats are grouped, not double counted', () => {
  const collector = createSilentIssueCollector(mission);
  collector.progressTool.handle({ goal_ids: ['order_drink'], issues: [issue(1)] });
  collector.beginFinalReview();
  assert.equal(collector.isFinalized(), false);
  collector.finalReviewTool.handle(final([issue(1), issue(2), issue(3)]));
  assert.equal(collector.isFinalized(), true);
  assert.deepEqual(collector.getIssues().map((item) => item.originalEn), ['He go 1', 'He go 2', 'He go 3']);
  const { fromTurns, fromFinal, finalStatus } = collector.getDiagnostics();
  assert.deepEqual({ fromTurns, fromFinal, finalStatus }, { fromTurns: 1, fromFinal: 2, finalStatus: 'issues' });
});

test('an early final-review call cannot acknowledge finishing; honest empty statuses are recorded', () => {
  const collector = createSilentIssueCollector(mission);
  collector.finalReviewTool.handle(final([issue(4)]));
  assert.equal(collector.isFinalized(), false, 'only a call after PRIVATE_FINISH_NOTES finalizes');
  assert.equal(collector.getIssues().length, 1, 'but its evidence is kept');
  collector.beginFinalReview();
  collector.finalReviewTool.handle(final([], 'uncertain'));
  assert.equal(collector.isFinalized(), true);
  assert.equal(collector.getDiagnostics().finalStatus, 'uncertain');
});

test('rejections are counted by reason without retaining the rejected words', () => {
  const collector = createSilentIssueCollector(mission);
  collector.progressTool.handle({ goal_ids: [], issues: [{ ...issue(), confidence: 'low' }, { original_en: 'He go' }, 'bad'] });
  const diagnostics = collector.getDiagnostics();
  assert.deepEqual(diagnostics.reasons, { not_confident: 1, missing_fields: 1, not_object: 1 });
  assert.doesNotMatch(JSON.stringify(diagnostics), /He go/);
  diagnostics.reasons.not_confident = 999;
  assert.equal(collector.getDiagnostics().reasons.not_confident, 1);
});

test('goals and language notes travel in one call; goals never gate or repeat', () => {
  const ids = [];
  const collector = createSilentIssueCollector(mission, (next) => ids.push(next));
  const result = collector.progressTool.handle({ goal_ids: ['choose_size', 'order_drink', 'nope'], issues: [issue(5)] });
  assert.deepEqual(result, { saved: true, issues: 1, goals: 2 });
  assert.deepEqual(collector.progressTool.handle({ goal_ids: ['order_drink'] }), { saved: false, issues: 0, goals: 0 });
  assert.deepEqual(collector.getObservedGoalIds(), ['choose_size', 'order_drink']);
  assert.equal(ids.length, 1);
  collector.clear();
  assert.deepEqual([collector.getIssues().length, collector.getObservedGoalIds().length, collector.getDiagnostics().turnNotes], [0, 0, 0]);
});

test('introduction teaches without assessing samples; review is interactive, grounded and honest when incomplete', () => {
  for (const locale of ['ar', 'en']) {
    const intro = briefingNarration(mission, locale);
    assert.match(intro.instruction, /say what we will learn today/);
    assert.match(intro.instruction, /must not be evaluated/);
    assert.match(intro.instruction, /Do not demand a scripted approval/);
    const review = reviewNarration(mission, locale, []);
    assert.match(review.instruction, /real conversation/);
    assert.match(review.instruction, /follow-up question/);
    assert.match(review.instruction, /never add rehearsal mistakes/);
    assert.match(review.text, /NO CONFIDENT LANGUAGE ISSUES/);
    assert.doesNotMatch(review.text, /may be incomplete/);
    assert.match(reviewNarration(mission, locale, [], true).text, /may be incomplete/);
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

test('optional polite improvements remain separate from proven grammar errors', () => {
  const collector = createSilentIssueCollector(mission);
  const correct = { original_en: 'I want a refund.', better_en: 'Could I get a refund, please?',
    note_type: 'improvement', explanation_ar: 'الجملة صحيحة، لكن التانية ألطف.',
    explanation_en: 'Both are valid; the second is more polite.' };
  collector.progressTool.handle({ goal_ids: [], issues: [correct, issue(1)],
    improvements: [correct, { original_en: 'That is too big.', better_en: 'That is quite large.',
      explanation_en: 'A softer expression of the same meaning.' }] });
  assert.equal(collector.getIssues().length, 1);
  assert.equal(collector.getImprovements().length, 2);
  assert.equal(collector.getIssues()[0].originalEn, 'He go 1');
  assert.equal(collector.getImprovements()[0].originalEn, 'I want a refund.');
  const reviewed = reviewNarration(mission, 'en', [
    ...collector.getIssues(), ...collector.getImprovements().map((note) => ({ ...note, noteType: 'improvement' })),
  ]);
  assert.match(reviewed.text, /OPTIONAL STYLE \(ORIGINAL IS CORRECT\)/);
  assert.match(reviewed.text, /ACTUAL ERROR/);
  assert.equal(parseIssue(correct, new Set()).ok, false);
  assert.equal(parseImprovement(correct, new Set()).ok, true);
});

test('no missing explanation can discard a real learner mistake', () => {
  const collector = createSilentIssueCollector(mission);
  collector.progressTool.handle({ goal_ids: [], issues: [{ original_en: 'He go', better_en: 'He goes' }] });
  assert.equal(collector.getIssues().length, 1);
  assert.equal(collector.getIssues()[0].feedbackEn, '');
  assert.equal(collector.getDiagnostics().saved, 1);
  assert.equal(collector.getImprovements().length, 0);
});
