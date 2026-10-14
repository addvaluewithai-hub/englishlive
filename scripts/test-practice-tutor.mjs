import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

// Exercise the actual session/callback state machine with fake media, not a real provider.
let server;
let mod;
const connects = [];
const texts = [];
const counts = { stop: 0, close: 0 };
const priorWindow = globalThis.window;

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
  const load = (path) => server.ssrLoadModule(path);
  mod = {
    ...(await load('/src/practice/tutor/TutorSession.ts')),
    ...(await load('/src/practice/tutor/finishRoleplay.ts')),
    ...(await load('/src/practice/silentIssues.ts')),
    ...(await load('/src/practice/missions/catalog.ts')),
    GeminiLiveTransport: (await load('/src/live/GeminiLiveTransport.ts')).GeminiLiveTransport,
    MicrophonePcmStream: (await load('/src/audio/MicrophonePcmStream.ts')).MicrophonePcmStream,
    PcmPlaybackQueue: (await load('/src/audio/PcmPlaybackQueue.ts')).PcmPlaybackQueue,
  };
  globalThis.window = { setTimeout, clearTimeout };
  const proto = (name) => mod[name].prototype;
  Object.defineProperty(proto('GeminiLiveTransport'), 'connected', { configurable: true, get() { return !this.closedForTest; } });
  Object.assign(proto('GeminiLiveTransport'), {
    async connect(instruction, config) { connects.push({ instruction, config }); this.callbacks.onStatus('listening'); },
    sendText(text) { texts.push(text); },
    endAudioStream() {},
    async flushPendingMessages() {},
    close() { this.closedForTest = true; counts.close++; },
  });
  Object.assign(proto('MicrophonePcmStream'), { async start() {}, async stop() { counts.stop++; }, setEnabled() {} });
  Object.assign(proto('PcmPlaybackQueue'), {
    async unlock() {}, async close() {}, interrupt() {}, async enqueue() {}, markTurnComplete() {}, pushTranscript() {},
  });
  globalThis.fetch = async () => Response.json({ source: 'neon', character: { slug: 'otti', revisionId: 'published-voice', content: { voiceName: 'Puck' } } });
});

after(async () => {
  if (priorWindow === undefined) delete globalThis.window; else globalThis.window = priorWindow;
  await server.close();
});

function make(tools = [], extra = {}) {
  const events = [];
  const session = new mod.TutorSession({ host: () => null, update() {}, turns: [], onTurn() {},
    diagnostic: (event) => events.push(event.event), tools, ...extra });
  return { session, events };
}

test('turn-taking: audio plays before the mic opens, text-only replies and pause never deadlock', async () => {
  const { session } = make();
  await session.start('review instructions', 'explain one correction', 2400);
  assert.equal(connects.at(-1).config.voiceName, 'Charon', 'same published-character voice normalization as Speaking');
  assert.equal(connects.at(-1).config.disableInputTranscription, true);
  const callbacks = session.live.callbacks;
  callbacks.onOutputTranscript('Try: I want a small one.');
  callbacks.onAudio('AAAA', 'audio/pcm;rate=24000');
  callbacks.onTurnComplete();
  assert.equal(session.state.micOpen, false, 'server completion must not open the mic before playback finishes');
  session.queue.callbacks.onTurnComplete();
  assert.equal(session.state.micOpen, true);
  session.send('Why do I need a?');
  assert.equal(texts.at(-1), 'Why do I need a?');
  callbacks.onOutputTranscript('Because one is countable.');
  callbacks.onGenerationComplete();
  assert.equal(session.state.micOpen, true, 'a text-only generation hands the turn back');
  session.togglePause();
  assert.equal(session.state.micOpen, false);
  session.togglePause();
  assert.equal(session.state.micOpen, true);
  session.update({ status: 'speaking' });
  session.interrupt();
  assert.equal(session.state.micOpen, true);
  callbacks.onAudio('AAAA', 'audio/pcm');
  callbacks.onGenerationComplete();
  session.interrupt();
  assert.equal(session.suppressOutput, false, 'interrupting a fully generated reply must not mute the next reply');
  callbacks.onOutputTranscript('Next reply.');
  assert.equal(session.state.text.endsWith('Next reply.'), true);
  await session.close();
  callbacks.onOutputTranscript('late frame');
  assert.notEqual(session.state.text, 'late frame');
});

test('a reply whose turnComplete never arrives still hands the turn back after playback drains', async () => {
  const { session, events } = make();
  await session.start('roleplay', 'start', 1200);
  const callbacks = session.live.callbacks;
  callbacks.onAudio('AAAA', 'audio/pcm');
  session.queue.callbacks.onSpeechStart();
  session.queue.callbacks.onSpeechEnd();
  assert.equal(session.state.micOpen, false);
  await new Promise((resolve) => setTimeout(resolve, 1600));
  assert.equal(session.state.micOpen, true, 'learner is not stranded by a missing turnComplete');
  assert.ok(events.includes('missing_turn_complete'));
  callbacks.onAudio('AAAA', 'audio/pcm');
  callbacks.onGenerationComplete();
  session.queue.callbacks.onSpeechEnd();
  assert.equal(session.state.micOpen, true, 'generationComplete + drained playback opens the mic at once');
  await session.close();
});

test('learner thinking time on an open mic never triggers the reply timeout', async (t) => {
  const { session } = make();
  await session.start('roleplay', 'start', 1200);
  session.live.callbacks.onGenerationComplete();
  assert.equal(session.state.micOpen, true);
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  session.awaitReply();
  session.setMic(true);
  t.mock.timers.tick(60_000);
  assert.notEqual(session.state.status, 'error');
  session.setMic(false);
  session.awaitReply();
  t.mock.timers.tick(26_000);
  assert.equal(session.state.status, 'error', 'a reply Otti owes does time out');
  t.mock.timers.reset();
});

test('finish asks the same connection for the final review, keeps the mic closed and freezes notes after it', async () => {
  const collector = mod.createSilentIssueCollector(mod.practiceMissionContractBySlug('a2-order-with-preferences'));
  const { session, events } = make(collector.tools);
  await session.start('roleplay', 'start', 1200);
  collector.progressTool.handle({ goal_ids: [], issues: [{ original_en: 'I want small one', better_en: 'I want a small one' }] });
  collector.beginFinalReview();
  const finishing = mod.finishRoleplay(session, collector.isFinalized);
  assert.match(texts.at(-1), /PRIVATE_FINISH_NOTES/);
  assert.equal(session.state.micOpen, false);
  session.live.callbacks.onTurnComplete();
  assert.equal(session.state.micOpen, false, 'finishing never reopens the mic');
  collector.finalReviewTool.handle({ status: 'issues', issues: [{ original_en: 'Me no like sugar', better_en: "I don't like sugar" }] });
  const result = await finishing;
  assert.equal(result.outcome, 'received');
  assert.deepEqual(events.filter((event) => event.startsWith('finish_')), ['finish_requested', 'finish_received']);
  await session.close();
  assert.equal(collector.getIssues().length, 2);
});

test('a silent provider gets one reminder, then the review is honestly marked missing; retry keeps notes', async (t) => {
  const collector = mod.createSilentIssueCollector(mod.practiceMissionContractBySlug('a2-order-with-preferences'));
  collector.progressTool.handle({ goal_ids: [], issues: [{ original_en: 'He go', better_en: 'He goes' }] });
  const { session, events } = make(collector.tools);
  await session.start('roleplay', 'start', 1200);
  collector.beginFinalReview();
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const finishing = mod.finishRoleplay(session, collector.isFinalized);
  for (let i = 0; i < 30; i++) { t.mock.timers.tick(1_000); await Promise.resolve(); await Promise.resolve(); }
  t.mock.timers.reset();
  const result = await finishing;
  assert.equal(result.outcome, 'missing');
  assert.ok(events.includes('finish_reminder'));
  assert.equal(collector.getIssues().length, 1, 'per-turn notes survive a missing final review');
  assert.deepEqual(await mod.finishRoleplay(null, collector.isFinalized), { outcome: 'offline', waitedMs: 0 });
  await session.close();
});

test('cancel during the initial await never opens a socket', async () => {
  const before = connects.length;
  const { session } = make();
  const starting = session.start('intro', 'introduce', 1200);
  await session.close();
  await starting;
  assert.equal(connects.length, before);
});
