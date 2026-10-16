# A1 U1-L01 — Listening-first Teacher Lab (Draft Pilot)

**Source authority:** `addvaluewithai-hub/english-course` `main` → `curriculum/levels/a1/design-review/07-lesson-briefs/lesson-briefs.md` → **U1-L01 — Hello. I'm …**. Do not follow older `src/lessonScenes/a1/u1l1.ts` wording, which belongs to a prior curriculum scope.

## What is implemented

An opt-in, separate prototype. Existing published Learn and Practice are unchanged.

Open the pilot in a deployed PR preview:

`/scene-lesson/a1-u1-l01-hello-im?listeningLab=1`

or `/scene-lesson/a1-u1-l01-listening-lab`.

The lesson has four phases:

1. **First listening:** brief authored Arabic setup, entire six-line Maya/Leo English conversation, broad multiple-choice understanding check. Do not show the full transcript before first listening.
2. **Name exchange:** Otti replays only the two name lines using the stable `name-exchange` clip ID, then teaches `I'm`, `My name is`, `What's your name?` in context, followed by a comprehension check.
3. **Wellbeing and politeness:** Otti replays `wellbeing-exchange`, teaches `How are you?`, `I'm fine, thanks`, `And you?` in context, followed by comprehension MC.
4. **Unprompted final Speaking:** new person Sam at a community course (not Maya/Leo), with no model answer or quiz visible. Otti leads the conversation and decides completion. A generic goodbye cannot prove the main objective.

All Otti teaching lines, MC feedback, audio segment IDs, transcript, speaker names and visual beats are authored, not improvised. Incorrect MC answers retain their incorrect status and still receive an explanation before the next scene.

## Audio contract and quality gate

`src/lessonScenes/a1/listeningAudioPilot.ts` defines exact turn text, speaker labels and clip IDs:
- `full-conversation`
- `name-exchange`
- `wellbeing-exchange`
- `leave-taking` (available for optional teacher-requested replay)

`play_lesson_audio({clipId})` is an approved **BLOCKING Gemini client tool**. Unknown clip IDs are rejected, rather than accepting arbitrary URLs or time ranges. The same `LessonAudioController` drives the authored playback gates and voluntary replay. Microphone remains closed during playback and the scripted director advances only on actual playback completion. Missing audio is an error requiring retry, never a silent skip.

**PRODUCTION AUDIO IS NOT YET APPROVED OR DELIVERED.** The source dialogue and production request are staged at [production/a1-u1-l01/](../production/a1-u1-l01/README.md). The Gemini TTS Factory will create an actual two-speaker WAV and timestamped transcript/VTT. Until that job is run and its output listened to, audited and mapped into the lesson manifest with `approved:true`, **there is no browser-voice fallback**. The app deliberately blocks listening progression rather than counting unplayed audio as a comprehension attempt.

Before public release, commission/approve a two-speaker recording, publish the real audio on an approved asset host, and fill `audioUrl`, `transcriptUrl`, `vttUrl` and reviewed `startMs/endMs` for every line and clip; approve only after listening. Do not invent timecodes or silently replace the transcript. Check playback after the first tap on iOS and Android. Verify exact start/end in real audio, no overlap with Gemini PCM, clip interrupts/retries, tools and microphone state.

## Technical/testing contract

- `npm run test:a1-listening`: lesson boundary, keyed MC, final speaking, clip metadata, fail-closed unknown IDs, speaker order and blocking client tool behavior.
- `npm run test:learn-qa-registry`: whole authoring registry correctness, including A1 beat-to-clip references.
- `npm run qa:learn:frames -- a1-u1-l01-listening-lab`: real browser screenshots of every teaching beat, each `audio-playing` state, every MC question and its right/wrong feedback, speaking/listening and completion. Each viewport 320x640 / 400x860 / 1280x900; actual frame contact sheets must be opened and judged.
- CI `qa:learn:frames:all` covers A1 and existing B1. Screenshot fixtures mock **UI state only**, not actual sound or latency.
- Test live Gemini separately with required first listening, replay, wrong choice, final speaking, weak/nonsense reply and interrupted playback.

## Release status

**IN PROGRESS — Draft PR, NO MERGE/DEPLOY**. The canonical English Course status row is linked in a separate status PR. Screenshots cannot certify microphone and real voice interaction. The audio master and owner acceptance are outstanding.
