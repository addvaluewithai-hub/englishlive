# Practice lesson example audio (Gemini 3.8 TTS)

Practice briefing now plays the mission's **reviewed canonical English conversation** as an actual two-speaker WAV before Otti explains the lesson. This applies **only to the briefing phase**. The established roleplay and its mistake-recording tools remain unchanged.

## Runtime flow

1. Learner presses Start lesson; the existing user-unlocked WebAudio context and Gemini Live session initialize.
2. The briefing prompt asks Otti to invoke `play_lesson_dialogue` *before saying the authored example aloud*.
3. The Live client tool is `BLOCKING`; it POSTs the authored mission slug with Neon authentication to `/api/practice/lesson-audio`.
4. The Cloudflare Pages Function looks up the known mission, not model-supplied text, and generates a two-speaker WAV via the REST Interactions API `gemini-3.8-flash-tts`. The voices are Partner=Puck and Learner=Kore, with concise, scene-specific delivery styles.
5. The same WebAudio output used for Live plays the WAV. The tool resolves `played: true` **only on source.onended**, then the Live transport sends its FunctionResponse to Gemini. Otti continues the lesson after that acknowledgement.
6. If generation, decoding, cancellation or playback fails, the tool returns `played: false`; Otti must not claim the learner heard the sample. Browser interrupt/close cancels playback. An edge cache keyed by mission slug, revision and model avoids repeated synthesis where supported.

This endpoint does not transmit microphone recordings or learner speech to the TTS service. It requires the existing `GEMINI_API_KEY` and Neon Auth JWKS configuration. First playback on a cache miss may take longer than later plays. Edge caching is best-effort, not an immutable asset store; pre-generated CDN-hosted WAV/Opus assets would be a separate production optimization.

## Test checklist before rollout

- Run `npm run check` and `npm run test:practice`.
- On a real authenticated device: use each mission's Start lesson; listen for **two** speakers, realistic delivery, and the exact authored situation facts.
- Verify Otti does not recite any example lines, that the mic stays shut throughout sample playback, and that his post-example explanation starts **after** the audio finishes.
- Try Pause / Interrupt / Close mid-clip, browser back, and a connection drop. Confirm no stuck loader, unexpected microphone opening or overlap.
- Test a deliberately failing TTS key/rate limit and verify the teaching conversation degrades honestly.
- In review, confirm Otti gives the **reason and grammar/usage rule** for each saved correction. A missing optional explanation must not prevent the correction from being saved.

Google docs: https://ai.google.dev/gemini-api/docs/speech-generation
