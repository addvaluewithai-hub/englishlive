# Practice: whole-session verbatim transcript + final-only coach (experimental)

**Status:** Draft PR #44 preview; NOT merged, NOT released as a certified speaking assessment.

## Decision from live user trial (2026-10-14)

The earlier PR #44 preview transcribed and coached individual voice turns. A real A2 session showed correct context-aware Otti replies but several missing learner lines and some poor transcriptions. Critically, the transcript had consecutive Otti replies across selected size/temperature even though Otti evidently received an answer. Delaying the **coach alone** cannot recover audio that was never saved; microphone capture and turn boundaries must be fixed first.

### New pipeline

1. Gemini Live still receives **all of the same original microphone PCM** to understand speech and generate Otti audio. Live **inputAudioTranscription is disabled only in Practice**, while output transcription for Otti stays on. Other voice modes are not modified.
2. A Practice-only in-memory recorder collects **all 16kHz PCM frames sent to Otti while the mic is enabled**, including quiet utterances and the beginnings/ends of speech. There is **no loudness threshold to admit voice to the recorder**.
3. Recording is partitioned at the first Otti reply, an explicit Done speaking action, or a safe audio-size rotation. If a mic interval exceeds 30 seconds, the recorder rotates to another ordered WAV segment *before* hitting the provider limit: it does not silently drop the first segment. The session is limited to **24 audio segments / 180 seconds of learner microphone PCM**. Beyond that, the session marks its final review incomplete; raise those limits only with cost/QA evidence.
4. **No Flash-Lite transcription and no grammar coach run during the conversation.** The segments are kept only in the browser's in-memory route state. Typed replies are recorded as text and skip Flash-Lite.
5. On **Finish and review**, the Live voice session stops. We then submit the saved WAV segments over authenticated `POST /api/practice/transcribe` to **`gemini-3.1-flash-lite`**, using at most three parallel requests. Each result fills its original chronological slot *before* the corresponding Otti response, even when API requests return out of order. A visible progress indicator shows completion. Failed segments are not replaced with guessed words.
6. The Flash-Lite prompt explicitly requests **word-for-word** learner speech, including grammar errors, false starts and hesitations; English uses Latin script and actual Arabic is rendered as Arabic. **No repair, correction or translation.** Completely silent chunks should yield `[no speech]`.
7. A **single final Background Coach recap** runs on the full ordered transcript, on the completion screen, **only if all recorded segments were captured and transcribed**. If any audio was lost, overflowed or failed, the review is marked **incomplete** and no claims of corrected English or completed goals are made; the available transcript is still copyable. Hints are still intentionally learner-triggered during the Live dialogue; until the final transcript exists they have authored scenario facts and Otti output, not a fabricated learner transcript.

### Technical and privacy boundaries

- Mic is still disabled during Otti playback, as in the existing app, except when the learner explicitly interrupts using the app control; **simultaneous speech while disabled is not captured or sent to Live**. This preview does not pretend to solve true simultaneous full-duplex speech.
- The original PCM is not written to a database, disk, Cloudflare R2 or a Files API. WAV data is held temporarily in memory until review/cancellation/unmount. Each segment is transmitted to Google Live during dialogue and to Flash-Lite on review; the additional processing is disclosed in the speaking UI.
- A 30-second PCM segment (960,000 bytes) is the maximum server payload. The endpoint verifies a signed-in Neon JWT, WAV headers and frame format, and uses the existing server-side `GEMINI_API_KEY`. Requests are limited to 24s on client / 20s on server; there is no automatic retry storm.
- A 180-second total mic-audio limit and 24-segment limit bound memory and cost. **These are experiment limits, not a CEFR or lesson-duration target**. They may reject very long learner speaking sessions; the user sees a clear incomplete-review message, not invented feedback.
- This preview uses extra Flash-Lite multimodal API calls; rate limiting, quotas, privacy notice, cost monitoring and provider-retention configuration need approval before production.
- The recorded audio is the same post-processed (echo-cancelled, noise-suppressed) PCM sent to Otti, not a second independent raw mic device. No guarantee of absolute transcription accuracy.

### QA and acceptance

- Deterministic test suites: `npm run check`, `npm run test:ui`, `npm run test:practice`. Mocked provider tests prove serialization, authentication, ordered async results, explicit no-speech and no fabrication. They do **not** prove verbatim recognition quality.
- On real signed-in preview, say `I want small one please`, `He go to work every day`, `I no have money`, or a natural sentence containing repetition; the verbatim transcript **must preserve actual mistakes**, not infer grammatical fixes.
- Speak *quietly* and in several short turns across Otti's questions, including a size and hot/cold choice. Copy the final conversation and check that each learner response is present in the right slot.
- Test Done speaking, pause/resume, app interruption of Otti, typed replies, a long response split at 30 seconds, recap and missing-network handling.
- Verify Otti's responsiveness doesn't depend on transcription or coach throughput. Record cost/latency from the finish click to the completed transcript and then the final recap.
- Confirm failure/incomplete UX and no score/mastery claims.

**Do not merge PR #44 to main until real mic, signed-in transcription and final coach QA pass.**
