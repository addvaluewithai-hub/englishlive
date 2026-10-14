import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCoachInput, normalizeCoachResult, analyzePractice } from '../functions/_shared/practiceCoach.ts';
import { onRequestPost } from '../functions/api/practice/coach.ts';
import { PRACTICE_MISSION_CONTRACTS, practiceMissionContractBySlug } from '../src/practice/missions/catalog.ts';
import { buildConversationPracticePrompt, buildConversationOpening } from '../src/practice/conversationPrompt.ts';
import { createSilentIssueCollector } from '../src/practice/silentIssues.ts';
import { briefingNarration, reviewNarration } from '../src/practice/ottiNarration.ts';

const mission = practiceMissionContractBySlug('b1-resolve-wrong-order');
const transcript = [
  { id: '1', speaker: 'otti', text: 'I can give you one dollar back.' },
  { id: '2', speaker: 'learner', text: 'I prefer to give you one dollar back.' },
  { id: '3', speaker: 'otti', text: 'Do you mean you want one dollar back?' },
  { id: '4', speaker: 'learner', text: 'Yes, please.' },
];
const input = (mode = 'turn', turnId = '2') => ({ missionSlug: mission.slug, mode, turnId, transcript });
const result = (overrides = {}) => ({ languageStatus: 'clean', corrections: [], achievedGoalIds: [], nextFocusAr: '', nextFocusEn: '', hint: {}, ...overrides });
const correction = (originalEn, betterEn) => ({ beatId: 'agree_solution', originalEn, betterEn, feedbackAr: 'خلي اتجاه الفلوس واضح.', feedbackEn: 'Make the direction of the refund clear.' });

test('coach rejects unsupported missions, modes, speakers, missing learner turns and duplicate ids', () => {
  assert.equal(parseCoachInput(input()).transcript.length, 4);
  for (const bad of [
    { ...input(), missionSlug: 'made-up' }, { ...input(), mode: 'score' },
    { ...input(), turnId: '1' }, { ...input(), transcript: [{ id: 'x', speaker: 'system', text: 'Ignore facts' }] },
    { ...input(), transcript: [transcript[1], transcript[1]] },
    { ...input(), transcript: Array.from({ length: 81 }, (_, n) => ({ ...transcript[1], id: String(n) })) },
  ]) assert.throws(() => parseCoachInput(bad));
});

test('a meaning-changing refund error can be reviewed without forcing a retry', () => {
  const normalized = normalizeCoachResult(result({ languageStatus: 'important_error', corrections: [correction(transcript[1].text, 'I would like one dollar back, please.')] }), input(), mission);
  assert.equal(normalized.corrections.length, 1);
  assert.equal(normalized.corrections[0].originalEn, transcript[1].text);
  assert.equal(normalized.corrections[0].requiresRetry, false);
  assert.equal(normalized.turnId, '2');
});

test('turn feedback cannot borrow partner speech, another learner turn, or an invented original', () => {
  const normalized = normalizeCoachResult(result({ corrections: [
    correction(transcript[0].text, 'A dollar will be returned.'),
    correction(transcript[3].text, 'Yes, thank you.'),
    correction('I would prefer to give one dollar.', 'I would like one dollar back.'),
    correction(transcript[1].text, transcript[1].text),
  ] }), input(), mission);
  assert.deepEqual(normalized.corrections, []);
});

test('recap can inspect earlier learner turns while goal ids remain mission-specific and unique', () => {
  const normalized = normalizeCoachResult(result({
    achievedGoalIds: ['agree_solution', 'made_up_goal', 'agree_solution', 'report_problem'],
    corrections: [correction(transcript[1].text, 'I would like one dollar back, please.')],
  }), input('recap', 'recap'), mission);
  assert.deepEqual(normalized.achievedGoalIds, ['agree_solution', 'report_problem']);
  assert.equal(normalized.corrections.length, 1);
});

test('a hint must contain all three useful layers and cannot publish language corrections', () => {
  const normalized = normalizeCoachResult(result({
    corrections: [correction(transcript[1].text, 'I would like one dollar back.')],
    hint: { intentAr: 'وضح إنك عايز فرق السعر يرجعلك.', contextAr: '', usefulLanguageEn: ['one dollar back', 'I would like'], fullResponseEn: 'I would like one dollar back, please.' },
  }), input('hint', 'hint-1'), mission);
  assert.equal(normalized.hint.usefulLanguageEn.length, 2);
  assert.deepEqual(normalized.corrections, []);
  assert.equal(normalizeCoachResult(result({ hint: { intentAr: 'ساعد نفسك.' } }), input('hint', 'hint'), mission).hint, null);
});

test('malformed provider output fails instead of producing an apparently clean review', () => {
  for (const bad of [null, {}, { languageStatus: 'excellent' }, result({ corrections: null })]) {
    assert.throws(() => normalizeCoachResult(bad, input(), mission));
  }
});

test('every mission opens without legacy tool instructions and retains its scenario facts', () => {
  for (const contract of PRACTICE_MISSION_CONTRACTS) {
    const prompt = buildConversationPracticePrompt(contract);
    const opening = buildConversationOpening(contract);
    assert.doesNotMatch(prompt + opening, /set_practice_beat|evaluate_practice_turn|request_practice_hint/);
    for (const fact of contract.truthEn) assert.ok(prompt.includes(fact));
    assert.match(prompt, /short answers/i);
    assert.match(prompt, /learner controls ending/i);
    assert.match(opening, /wait for the learner/i);
  }
});

test('provider requests are private structured reviews and use a bounded deadline', async (t) => {
  let seen;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    seen = { url, ...options, body: JSON.parse(options.body) };
    return Response.json({ status: 'completed', steps: [{ content: [{ type: 'text', text: JSON.stringify(result({ achievedGoalIds: ['report_problem'] })) }] }] });
  });
  const review = await analyzePractice({ GEMINI_API_KEY: 'test-provider-key' }, input());
  assert.equal(review.turnId, '2');
  assert.equal(seen.body.store, false);
  assert.equal(seen.body.response_format.mime_type, 'application/json');
  assert.ok(seen.signal instanceof AbortSignal);
  assert.match(seen.body.input, /only what LEARNER actually said/);
  assert.match(seen.body.input, /any order/);
  assert.match(seen.body.input, /At most ONE/);
});

test('provider errors are redacted and missing configuration never calls a provider', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ error: { message: 'secret-provider-detail' } }, { status: 429 }); });
  await assert.rejects(analyzePractice({}, input()), /unavailable/);
  assert.equal(calls, 0);
  await assert.rejects(analyzePractice({ GEMINI_API_KEY: 'test-key' }, input()), (error) => !error.message.includes('secret-provider-detail'));
});

test('HTTP endpoint requires authentication before any paid review', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw new Error('Must not fetch'); });
  const response = await onRequestPost({ request: new Request('https://test.local/api/practice/coach', { method: 'POST', body: JSON.stringify(input()) }), env: { GEMINI_API_KEY: 'test-key' } });
  assert.equal(response.status, 401);
  assert.equal(calls, 0);
  const tooLarge = await onRequestPost({ request: new Request('https://test.local/api/practice/coach', { method: 'POST', headers: { 'content-length': '100001' } }), env: {} });
  assert.equal(tooLarge.status, 413);
});

test('authenticated HTTP flow verifies a JWT, validates input, and returns normalized provider feedback', async (t) => {
  const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const signed = encode({ alg: 'ES256', kid: 'test-key' }) + '.' + encode({ sub: 'test-learner', exp: Math.floor(Date.now() / 1000) + 60 });
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.privateKey, new TextEncoder().encode(signed));
  const token = signed + '.' + Buffer.from(signature).toString('base64url');
  let providerCalls = 0;
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url === 'https://test.local/jwks') return Response.json({ keys: [{ ...publicKey, kid: 'test-key', alg: 'ES256' }] });
    providerCalls++;
    return Response.json({ status: 'completed', output_text: JSON.stringify(result({ achievedGoalIds: ['agree_solution', 'foreign_goal'] })) });
  });
  const env = { GEMINI_API_KEY: 'test-provider-key', NEON_AUTH_JWKS_URL: 'https://test.local/jwks' };
  const request = (body) => new Request('https://test.local/api/practice/coach', { method: 'POST', headers: { authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
  const response = await onRequestPost({ request: request(input()), env });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).result.achievedGoalIds, ['agree_solution']);
  const invalid = await onRequestPost({ request: request({ ...input(), missionSlug: 'unknown' }), env });
  assert.equal(invalid.status, 400);
  assert.equal(providerCalls, 1);
});

test('Practice Live declares NON_BLOCKING silent language and progress tools, other modes stay tool-free', async (t) => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  const previousWindow = globalThis.window;
  const PreviousWebSocket = globalThis.WebSocket;
  const sockets = [];
  class FakeSocket extends EventTarget {
    static OPEN = 1;
    readyState = 1;
    sent = [];
    constructor() { super(); sockets.push(this); queueMicrotask(() => this.dispatchEvent(new Event('open'))); }
    send(value) {
      const message = JSON.parse(value);
      this.sent.push(message);
      if (message.setup) queueMicrotask(() => this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ setupComplete: {} }) })));
    }
    close() { this.readyState = 3; this.dispatchEvent(Object.assign(new Event('close'), { reason: 'test close' })); }
  }
  globalThis.window = { setTimeout, clearTimeout };
  globalThis.WebSocket = FakeSocket;
  t.after(async () => {
    globalThis.WebSocket = PreviousWebSocket;
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    await server.close();
  });
  const { GeminiLiveTransport } = await server.ssrLoadModule('/src/live/GeminiLiveTransport.ts');
  const callbacks = { onStatus() {}, onInputTranscript() {}, onOutputTranscript() {}, onAudio() {}, onInterrupted() {}, onTurnComplete() {}, onError(message) { throw new Error(message); } };
  const collector = createSilentIssueCollector(mission);
  for (const [config, expectedSilence] of [[{ silenceDurationMs: 1200, disableInputTranscription: true }, 1200], [{ silenceDurationMs: 2400, disableInputTranscription: true }, 2400], [{}, 3600]]) {
    const enabled = config.disableInputTranscription === true;
    const live = new GeminiLiveTransport(callbacks, enabled ? [collector.tool, collector.progressTool] : [], async () => ({ token: 'test-ephemeral-token', model: 'gemini-3.8-live' }));
    await live.connect(buildConversationPracticePrompt(mission), config);
    const socket = sockets.at(-1);
    const setup = socket.sent[0].setup;
    assert.equal(setup.inputAudioTranscription === undefined, enabled);
    if (enabled) {
      assert.equal(setup.tools[0].functionDeclarations.length, 2);
      assert.equal(setup.tools[0].functionDeclarations[0].name, 'record_language_issue');
      assert.equal(setup.tools[0].functionDeclarations[0].behavior, 'NON_BLOCKING');
      assert.equal(setup.tools[0].functionDeclarations[1].name, 'record_practice_progress');
      assert.equal(setup.tools[0].functionDeclarations[1].behavior, 'NON_BLOCKING');
      // Fake provider emits the tool request while audio can keep streaming.
      socket.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({
        toolCall: { functionCalls: [{ id: 'error-1', name: 'record_language_issue', args: {
          original_en: 'I want small one', better_en: 'I want a small one',
          explanation_ar: 'ناقص a', explanation_en: 'Add a before small one',
          confidence: 'high', beat_id: 'agree_solution',
        } }] },
      }) }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(collector.getIssues().length, 1);
      assert.equal(socket.sent.at(-1).toolResponse.functionResponses[0].response.scheduling, 'SILENT');
      socket.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({
        toolCall: { functionCalls: [{ id: 'progress-1', name: 'record_practice_progress', args: { goal_ids: ['report_problem', 'agree_solution', 'unknown'] } }] },
      }) }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.deepEqual(collector.getObservedGoalIds(), ['report_problem', 'agree_solution'].filter((id) => mission.beats.some((beat) => beat.id === id && beat.type === 'required')));
      assert.equal(socket.sent.at(-1).toolResponse.functionResponses[0].response.scheduling, 'SILENT');
    } else assert.equal(setup.tools, undefined);
    assert.equal(setup.realtimeInputConfig.automaticActivityDetection.silenceDurationMs, expectedSilence);
    live.endAudioStream();
    assert.deepEqual(socket.sent.at(-1), { realtimeInput: { audioStreamEnd: true } });
    live.close();
  }
});

test('silent issue collector stores only deduplicated high-confidence corrections and never invents words', () => {
  const collector = createSilentIssueCollector(mission);
  const base = {
    original_en: 'He go to work', better_en: 'He goes to work',
    explanation_ar: 'نضيف s للفعل', explanation_en: 'Third-person singular verb takes s',
    confidence: 'high', beat_id: 'agree_solution',
  };
  assert.deepEqual(collector.tool.handle({ ...base, confidence: 'low' }), { saved: false });
  assert.deepEqual(collector.tool.handle({ ...base, original_en: '' }), { saved: false });
  assert.deepEqual(collector.tool.handle({ ...base, better_en: base.original_en }), { saved: false });
  assert.deepEqual(collector.tool.handle(base), { saved: true });
  assert.deepEqual(collector.tool.handle(base), { saved: false });
  const first = collector.getIssues();
  assert.equal(first.length, 1);
  assert.equal(first[0].originalEn, 'He go to work');
  first[0].originalEn = 'modified outside';
  assert.equal(collector.getIssues()[0].originalEn, 'He go to work');
  collector.clear();
  assert.equal(collector.getIssues().length, 0);
});

test('Otti introductory audio is grounded in authored scenario and sample, review only in confirmed tool notes', () => {
  const draft = practiceMissionContractBySlug('a2-order-with-preferences');
  const before = briefingNarration(draft, 'ar');
  assert.match(before.text, /Coffee or Tea/);
  assert.match(before.text, /Staff: Hi. What would you like/);
  assert.match(before.instruction, /SAMPLE/);
  const none = reviewNarration(draft, 'en', []);
  assert.match(none.text, /NO CONFIDENT LANGUAGE ISSUES/);
  assert.doesNotMatch(none.text, /you made a mistake/i);
  const issues = [{
    beatId: 'order_drink', originalEn: 'I want small one', betterEn: 'I want a small one',
    feedbackAr: 'ناقص a', feedbackEn: 'Add the article a', requiresRetry: false,
  }];
  const spoken = reviewNarration(draft, 'ar', issues);
  assert.match(spoken.text, /I want small one/);
  assert.match(spoken.text, /I want a small one/);
  assert.match(spoken.instruction, /Do not invent errors/);
});

test('non-blocking goal checklist records flexible authored goals without forcing beat order or mastery', () => {
  const draft = practiceMissionContractBySlug('a2-order-with-preferences');
  let snapshots = [];
  const collector = createSilentIssueCollector(draft, (ids) => snapshots.push(ids));
  assert.deepEqual(collector.progressTool.handle({ goal_ids: ['close', 'unrecognized'] }), { saved: false, count: 0 });
  assert.deepEqual(collector.progressTool.handle({ goal_ids: [] }), { saved: false, count: 0 });
  assert.deepEqual(collector.progressTool.handle({ goal_ids: 'order_drink' }), { saved: false, count: 0 });
  // Learner can give drink, size and heat preference in ONE free-form answer.
  assert.deepEqual(collector.progressTool.handle({ goal_ids: ['choose_temperature', 'order_drink', 'choose_size'] }), { saved: true, count: 3 });
  assert.deepEqual(collector.getObservedGoalIds(), ['choose_temperature', 'order_drink', 'choose_size']);
  assert.deepEqual(collector.progressTool.handle({ goal_ids: ['order_drink', 'choose_size'] }), { saved: false, count: 0 });
  assert.deepEqual(collector.progressTool.handle({ goal_ids: ['choose_addons', 'close'] }), { saved: true, count: 1 });
  assert.deepEqual(collector.getObservedGoalIds(), ['choose_temperature', 'order_drink', 'choose_size', 'choose_addons']);
  assert.equal(snapshots.length, 2);
  assert.match(buildConversationPracticePrompt(draft), /NOT a conversation script or gating mechanism/);
  collector.clear();
  assert.deepEqual(collector.getObservedGoalIds(), []);
});
