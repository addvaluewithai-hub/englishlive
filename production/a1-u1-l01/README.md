# A1 U1-L01 — Gemini TTS Factory handoff

**Status:** factory job PREPARED. No paid TTS job has been dispatched, no audio URL/timestamp produced or approved. This is an opt-in, isolated pilot under [EnglishLive Draft PR #54](https://github.com/addvaluewithai-hub/englishlive/pull/54).

## Source of truth

- **English Course**: `curriculum/levels/a1/design-review/07-lesson-briefs/lesson-briefs.md`, `U1-L01 — Hello. I'm …`.
- **Authorized dialogue script**: `src/lessonScenes/a1/listeningAudioPilot.ts`.
- **Prebuilt TTS request**: [gemini-tts-request.json](gemini-tts-request.json).
- **Factory**: [addvaluewithai-hub/gemini-tts](https://github.com/addvaluewithai-hub/gemini-tts), read `docs/AGENT.md` and `docs/API.md`.
- **Stable factory job ID**: `englotti-a1-u1-l01-dialogue-pilot01`.

The six source utterances belong to *Maya* (Aoede) and *Leo* (Achird); both are named curated studio voices in the Factory's built-in registry. Target: **quality**, two speakers, **WAV 24 kHz**, English, Gemini transcription with per-word actual-audio timestamps, diarization and VTT, delivered to Cloudinary.

## Generation (requires owner-approved production and configured factory secrets)

In the **Gemini TTS Factory GitHub repository**:

1. Actions → **Gemini TTS Factory** → **Run workflow**.
2. Set `job_id` to `englotti-a1-u1-l01-dialogue-pilot01` (change edition on any regeneration to avoid Cloudinary overwrite).
3. Paste the **exact JSON object** from this folder's `gemini-tts-request.json` into `request_json`.
4. The workflow uses repository secrets `GEMINI_API_KEY_1…` and `CLOUDINARY_URL`; don't expose or copy them to EnglishLive frontend.
5. Wait for **status=completed** and **all three** `audio_url`, `transcript_url`, `vtt_url` in `result.json`. Dispatch accepted or a green workflow is not enough if transcription failed.
6. Download/listen to the WAV. Confirm: voices distinct and appropriate; names and contractions rendered exactly; no missing/extra words; natural pace; no unwanted pauses/truncated goodbye.
7. Inspect transcript JSON: `words[].start_ms`/`end_ms` are from the **rendered recording**, `source_turns` are the intended utterances. Speaker diarization may return `spk_1`, not `Maya`; check it before mapping speaker badges. VTT is for display; transcript words are the timing evidence.
8. Audit and store `startMs/endMs` for **all six turns**, then derive exact reviewed contiguous ranges for:
   - `full-conversation` — all six turns;
   - `name-exchange` — first two turns;
   - `wellbeing-exchange` — `how-are-you` + `fine-thanks`;
   - `leave-taking` — last two turns.
   Leave a small verified silence margin so no phoneme is cut. These are human/agent *audited* values, not guessed from transcript character positions.
9. Copy the three Cloudinary URLs and reviewed time bounds into `src/lessonScenes/a1/listeningAudioPilot.ts`; set `approved:true` **only after the listening audit**. The production audio controller refuses unapproved WAV. If an asset requires restricted access or delivery tokens, implement a backend-issued short-lived URL first instead of putting credentials in the frontend.
10. Test `play_lesson_audio({clipId:'name-exchange'})` and other excerpts in the real browser, including interruption, mic mute, PCM queue silence, loading failure and resume. Run Playwright frames and actual Live Otti separately.

### Critical tool architecture

- **This Factory is asynchronous and for content production**, not a low-latency audio serving function.
- **EnglishLive serves the approved recorded WAV from Cloudinary**. `play_lesson_audio` only looks up approved `clipId`, seeks the verified range, highlights the currently playing turn and resolves after audio finishes.
- **Otti and learner microphone must be muted/suspended** while the recorded WAV plays. No speaking overlap, no sending the recorded lesson as user microphone speech.
- **Browser speechSynthesis is not production audio** and is not used as fallback for approved lessons. A missing generated asset is a blocked recording, not false progress or fake listening evidence.

### Currently blocked

Gemini TTS audio hasn't actually been generated. The GitHub Issue gateway in `gemini-tts` is **locked to learn-curriculums' pinned lesson formats**; it does *not* accept EnglishLive A1 content. Don't try to trick that paid gateway using its Math/Statics modes. For this bounded pilot, use the Factory's native `workflow_dispatch` with an approved request and review `result.json`, or first extend the gateway explicitly in its own reviewed PR.

Status in English Course stays **in-progress**, not done. This folder cannot authorize bulk synthesis of other English Course lessons.
