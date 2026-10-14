// Manual preview trial: fictional typed dialogue through the real Live transport.
// Does not exercise microphone capture or audible playback; never log tokens.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { practiceMissionContractBySlug } from '../src/practice/missions/catalog.ts';
import { buildConversationOpening, buildConversationPracticePrompt } from '../src/practice/conversationPrompt.ts';

const origin = process.env.PRACTICE_TRIAL_ORIGIN;
if (!origin || !/^https:\/\/[a-z0-9-]+\.englishlive-a04\.pages\.dev$/.test(origin)) throw new Error('Set the approved preview origin.');
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
globalThis.window = { setTimeout, clearTimeout };
const { GeminiLiveTransport } = await server.ssrLoadModule('/src/live/GeminiLiveTransport.ts');
const cases = [
  { slug: 'a2-order-with-preferences', turns: ["I'd like a large hot coffee with milk and no sugar, please.", 'Yes, thank you.'] },
  { slug: 'b1-resolve-wrong-order', turns: [
    'I ordered a hot coffee, but this is tea. I have to leave in five minutes. What can you do?',
    'I prefer to give you one dollar back.',
    'I mean I would like the medium coffee and one dollar back.',
    'Actually, you already gave me one dollar back. Can I return the medium coffee and have a full refund instead?',
    'Yes, please. Thank you.',
  ] },
];
function append(previous, incoming) {
  const value = incoming.trim();
  if (!previous || value.startsWith(previous)) return value;
  if (previous.endsWith(value)) return previous;
  return previous + ' ' + value;
}
try {
  for (const scenario of cases) {
    const mission = practiceMissionContractBySlug(scenario.slug);
    let pending = null;
    const live = new GeminiLiveTransport({
      onStatus() {}, onInputTranscript() {}, onInterrupted() {},
      onOutputTranscript(text) { if (pending) pending.output = append(pending.output, text); },
      onAudio() {
        if (!pending) return;
        pending.chunks++;
        pending.firstAudioMs ??= Math.round(performance.now() - pending.startedAt);
      },
      onTurnComplete() { if (pending) { const done = pending; pending = null; done.resolve(done); } },
      onError() { if (pending) { const done = pending; pending = null; done.reject(new Error('Live provider reported an error.')); } },
    }, [], async () => {
      const response = await fetch(origin + '/api/gemini-token', { method: 'POST', headers: { origin, accept: 'application/json' }, signal: AbortSignal.timeout(15_000) });
      const payload = await response.json();
      if (!response.ok || !payload.token || !payload.model) throw new Error('Preview token service unavailable: ' + response.status);
      return { token: payload.token, model: payload.model };
    });
    async function say(text, opening = false) {
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { pending = null; reject(new Error('Live reply exceeded 30 seconds.')); }, 30_000);
        pending = { output: '', chunks: 0, firstAudioMs: null, startedAt: performance.now(), resolve: (value) => { clearTimeout(timeout); resolve(value); }, reject: (error) => { clearTimeout(timeout); reject(error); } };
        live.sendText(text);
      });
      console.log(JSON.stringify({ mission: scenario.slug, learner: opening ? '[app opening]' : text, partner: response.output, firstAudioAfterTextMs: response.firstAudioMs, receivedAudioChunks: response.chunks }));
      assert.ok(response.output.trim(), 'The partner should respond with a transcript.');
      assert.ok(response.chunks > 0, 'The real provider should return audio.');
      if (scenario.slug === 'a2-order-with-preferences' && text === 'Yes, thank you.') assert.doesNotMatch(response.output, /\?/, 'A complete routine exchange should close without a new payment-method question.');
      if (scenario.slug === 'b1-resolve-wrong-order' && text.startsWith('Actually,')) assert.match(response.output, /three|3/i, 'One dollar was already returned; a full refund must return the remaining three.');
    }
    try {
      await live.connect(buildConversationPracticePrompt(mission), { silenceDurationMs: 1200 });
      await say(buildConversationOpening(mission), true);
      for (const turn of scenario.turns) await say(turn);
    } finally { live.close(); }
  }
} finally {
  delete globalThis.window;
  await server.close();
}
