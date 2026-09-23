# Milestone 04 — Audio → Character Performance

Status: implementation complete on `feat/m4-character-performance`; live visual/device validation required.

## Goal

Make the character feel like the source of the live voice without letting Gemini become a low-level animation controller.

The rule is:

> Audio owns continuous motion. Gemini may occasionally add semantic acting intent.

## Reused deliberately

This milestone adapts proven work already present in Learn/PixiLive:

- acoustic viseme analysis;
- transcript hints as a secondary signal, not ground truth;
- mouth frames scheduled against the actual AudioContext playback clock;
- interruption cancelling both queued sound and queued visual work;
- non-blocking semantic performance tool calls;
- `FunctionResponse.scheduling = SILENT` as a sibling field, not nested in the JSON response.

## Delivered

### Audio-driven performance

`PcmPlaybackQueue` now analyzes the actual PCM that will be heard and schedules mouth poses against the same playback start time.

The SVG human rig already uses mouth energy to add bounded head/body/hand speech motion, so feeding real PCM energy also makes the body react without an extra model call.

Output transcription is allowed to guide difficult mouth classes such as MBP/FV/L/CH/WQ when it arrives in time, but acoustic playback remains the primary signal.

This is intentionally **not** a phoneme-accuracy or pronunciation-scoring system.

### Semantic performance tool

Gemini receives one optional tool: `perform_character`.

It can request:

- a supported emotion;
- a supported high-level gesture;
- bounded intensity;
- a short bounded visual hold duration.

Policy:

- normal talking requires no tool call;
- at most one deliberate cue per spoken turn;
- the model never controls SVG nodes, bones, coordinates, visemes or frame timing;
- a cue arriving before speech waits for audible playback to begin;
- a cue arriving during speech applies immediately;
- interruption/cancellation clears pending performance;
- tool responses use `scheduling: SILENT` to avoid the tool response itself causing conversational delay/repetition.

### Playback ownership

Transport no longer claims `speaking` merely because an audio packet arrived, and it no longer claims `listening` at server `turnComplete` while queued sound may still be audible.

The playback queue owns audible start/end state. This keeps UI and character state aligned with what the learner actually hears.

## Acceptance

Engineering:

1. `npm run check` passes;
2. audio frames are scheduled from the same clock as audio playback;
3. interruption clears audio sources, timers, transcript hints and mouth pose;
4. Live transport exposes semantic performance only, not renderer internals;
5. duplicate performance directions are limited to one per turn;
6. tool cancellation resets the visible cue;
7. no model tool is required for ordinary lip/body motion.

Live visual validation still required:

1. hear a response while mouth movement visibly tracks voiced/silent energy;
2. observe speech energy add subtle body motion without tool calls;
3. ask for a greeting and verify a sparse wave can accompany speech;
4. interrupt mid-response and verify audio + mouth + gesture stop together;
5. verify expressions settle back to neutral;
6. repeat with all four initial adult characters;
7. repeat on real iPhone/Android during Milestone 5.

## Known limitation

The analyzer is an acoustic heuristic with optional transcript guidance. It is designed for believable character animation, not exact word/phoneme recognition. EnglishLive must never reuse these viseme guesses as learner pronunciation evidence.

## Next

Milestone 5 is the mobile reality check: real iPhone/Android microphone, playback, WebSocket, interruption, Bluetooth/headphones, foreground/background and Capacitor behavior.
