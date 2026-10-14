# Practice Session 2 — Hold to Speak

The Practice roleplay and interactive review now use **explicit push-to-talk** instead of an automatically open mic. Other Gemini Live modes (Free Speak, etc.) retain their current automatic VAD behavior. Work is stacked on Session 1 / PR #48.

## Exact protocol

- Gemini Live setup: `realtimeInputConfig.automaticActivityDetection.disabled: true` only for Practice.
- On press: the client **immediately stops Web Audio Otti output** and mutes any arriving provider PCM/transcripts. The local mic is prewarmed (getUserMedia granted when Live started), then enabled.
- The first PCM chunks are held for ~140ms. A brief accidental press sends **nothing** to Gemini. Once a deliberate hold is confirmed, the client sends `{realtimeInput:{activityStart:{}}}`, forwards buffered PCM (16kHz mono), and continues streaming while held.
- On release: mute mic, send `{realtimeInput:{activityEnd:{}}}`. Otti may respond *only* after release. Do **not** send `audioStreamEnd` in this manual VAD mode.
- Provider speech/end callbacks cannot open the mic mid-hold, nor can they force an early `activityEnd`. Background note tools (`record_practice_progress`, `submit_final_review`) remain unchanged.
- User input controls: pointer capture, pointerup, pointercancel, slide-out cancels gesture, keyboard Space/Enter holds, window blur/tab visibility cleanup; same behavior during review.
- Timestamped metadata diagnostics record `hold_started`, `hold_released` and cancellations; no raw learner audio captured in logs.

## Manual acceptance before making PR ready

1. iOS Safari and Android Chrome with **real Gemini Live**: hold while Otti is speaking and verify speaker audio stops immediately and the first learner phoneme is not clipped.
2. Hold for 3–6 seconds with long pauses: ensure Gemini does not speak back until release. Test multiple very short taps: no empty learner turns.
3. Barge-in mid-sentence, rapidly press/release repeatedly, pause/resume, typed input, finish during an active hold.
4. Lock screen, switch app, deny microphone permission, lose network / trigger session resumption. Ensure mic does not remain open, users aren't stranded, and never emit spurious extra responses.
5. Verify note captures and final notebook remain as good as PR #46. The provider may send in-flight responses out of order: inspect debug timeline when testing.
6. Check mobile responsive layout, keyboard Space/Enter accessibility, RTL text, and expanded/collapsed opportunities.
7. Run CI (`npm run check`, `npm run test:ui`, `npm run test:practice`) and visual browser QA.

## Limits

These tests exercise fake media and Gemini transport, **not the real mobile audio timing**. There is still a provider/network interval between client `activityStart` and server interruption; the local UI prevents overlapping *playback*, not every possible stale server message. Do not claim perfect real-device behavior before a microphone test.

Refs: https://ai.google.dev/gemini-api/docs/live-api/capabilities and https://ai.google.dev/api/live
