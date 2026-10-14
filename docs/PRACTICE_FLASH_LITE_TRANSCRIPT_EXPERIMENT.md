# Practice verbatim microphone transcript — Flash-Lite preview

**Status:** Experimental PR only; not production-certified. Dedicated to the Practice voice screen; other Live modes keep their old configuration.

## What changes

1. `PracticeLiveScreen` opts out of `inputAudioTranscription` in the **Live setup**; Otti still receives the original PCM stream, uses Live automatic voice activity detection and responds with Live audio. Otti's **output transcription** remains on for the AI text bubble.
2. The **identical** 16kHz mono PCM chunks already transmitted to Gemini Live are simultaneously retained **in memory only**. A small pre-roll retains initial phonemes; a hard 30s cap fails closed rather than submitting truncated speech.
3. On the first Otti output or the explicit **Done speaking** action, the completed learner mic turn is framed as a standard PCM WAV and sent to `POST /api/practice/transcribe` in the background.
4. The endpoint requires the existing verified Neon JWT, validates MIME by actual WAV header and limits, and forwards audio privately with the existing server-only `GEMINI_API_KEY` to **`gemini-3.1-flash-lite`** `generateContent`. No Files API, no Cloudflare R2, no database write and no server-side audio retention.
5. The prompt demands literal **word-for-word** learner speech, including A1 mistakes, hesitations, repetitions and false starts. It forbids grammatical correction, paraphrasing, translation, invented words and wrong-script rewriting. Temperature is 0. The model may still make errors; this is an empirically testable instruction, not a guarantee of word-level accuracy.
6. The resulting **Flash-Lite transcript** alone becomes the learner text in the conversation log and is sent to the existing authenticated Background Coach. **Otti never waits for the HTTP transcription request** to reply. Typed learner messages already contain exact words, so they bypass Flash-Lite.
7. Unreturned/failed audio has an empty pending slot; **never substitute guessed text or send an empty turn as language evidence**. The finish-and-review flow waits for bounded in-flight transcription before handing the transcript to recap.

## Expected impact / trade-offs

- **Positive:** eliminates the incorrect Gemini Live input transcription from Practice; grammar feedback refers to a separate transcription of the actual speech.
- **Unchanged:** Gemini Live still powers Otti, and its output transcription powers on-screen Otti messages. Non-Practice modes still request input transcription.
- **Different:** while the learner speaks, real-time recognized-word UI cannot show text because Flash-Lite is asynchronous. After the turn ends, the transcript can appear; the audio still streams to Otti immediately.
- **Extra spend / network:** one Flash-Lite multimodal call per recorded learner turn, plus the existing Background Coach cost, instead of free/included Live transcripts. Check Google pricing and watch real usage; set upstream per-user rate limits/quotas before wide release.
- **Potential fidelity:** model-generated verbatim is never guaranteed. Compare it against manually verified audio with intentionally malformed A1 English and Arabic code-switches.
- **Privacy:** each spoken segment is transmitted to the Gemini API twice (the existing Live connection plus this new Flash-Lite request). Audio buffers are erased after packaging; requests are not persisted by application code. Consent and privacy notices should disclose this extra processing. Confirm provider data-retention settings for the selected endpoint and account.
- **Bounds:** 30s per mic turn, 24s client deadline / 20s provider deadline; failures are visible and do not block Otti. No provider availability or user mic tests verified merely by CI.

## QA plan for preview (must run with real signed-in microphones)

Record controlled, consented test speech **with actual learner mistakes**; compare to manually transcribed truth. Suggested English cases:
- `I want small one please` **must not** become `I'd like a small one, please`.
- `He go to work every day` must retain `go`.
- `I no have money` must retain `no have`.
- `I, I want two… one coffee` must preserve self-correction.
- `I'd like tea, please` should remain Latin-script English rather than Devanagari.
- 1–2 words, hesitation, thinking-time setting, repeat, interruption, pause/resume and explicit Done speaking.
- Typed replies bypass transcription, and malformed/no provider response does not add false corrections.
- Check microphone quality, response fluidity, correct learner-turn to Otti-turn order, recap integrity, latency and provider spend.

## Gates

- `npm run check`, `npm run test:ui`, `npm run test:practice`; source tests mock Google response. No "provider quality" claim from mocks.
- Real signed-in preview session with provider `gemini-3.1-flash-lite` and recording consent.
- Monitor error volume, retries, average payload size and request costs; add rate-limiting and retention documentation before production rollout.
- **Do not merge to production** without the above empirical comparison against the current Live transcription.
