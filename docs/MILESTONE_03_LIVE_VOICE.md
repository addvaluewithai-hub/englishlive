# Milestone 03 — Live Voice Core

Status: implementation complete on `feat/m3-live-voice-core`; real Gemini/device validation required.

## Goal

Turn the animated character runtime into a real interruptible voice conversation without coupling product state to Gemini internals.

## Reused deliberately

This milestone reuses proven patterns from `addvaluewithai-hub/learn`:

- `MicrophonePcmStream` capture/downsample design;
- PCM playback queue and starvation handling;
- automatic activity detection and interruption;
- input/output transcription;
- session resumption handles and `goAway` recovery;
- ephemeral token issuance from the server.

The code is adapted rather than copied blindly. In particular, EnglishLive uses the current Gemini ephemeral-token WebSocket endpoint on **v1beta**.

## Delivered

- provider-neutral `LiveTransport` contract;
- `GeminiLiveTransport` implementation;
- Gemini Live `v1beta` constrained WebSocket connection;
- server-side one-use ephemeral token endpoint;
- microphone capture through AudioWorklet;
- 16 kHz PCM upload;
- queued 24 kHz (or MIME-declared) PCM playback;
- hybrid server VAD with start-of-activity interruption;
- input and output transcription;
- playback cancellation when the learner interrupts;
- session-resumption handle tracking;
- automatic reconnect on `goAway` or an unclean resumable close;
- simple live session controls and microphone meter.

## Security boundary

`GEMINI_API_KEY` exists only in Cloudflare server-side environment/secrets. The browser/mobile app receives a one-use short-lived token constrained to the configured Live model and audio modality.

The current token route is suitable for development/vertical-slice validation, but **authentication + durable rate limiting are still required before public production exposure**. Origin checks alone are not user authentication.

## Cloudflare setup

Add `GEMINI_API_KEY` as an encrypted Cloudflare secret. Do not create `VITE_GEMINI_API_KEY`.

## Acceptance

Engineering:

1. `npm run check` passes;
2. no provider key ships client-side;
3. transport connects through the v1beta constrained endpoint;
4. mic/audio/transcript lifecycle is behind explicit classes;
5. interruption clears queued playback;
6. session-resumption state remains inside the transport.

Real-session acceptance still required:

1. start a session against the deployed token endpoint;
2. hear the character greet the learner;
3. speak and see input transcription;
4. hear output audio and see output transcription;
5. interrupt the character mid-sentence and confirm playback stops;
6. verify a reconnect/resumption path;
7. repeat on a real iPhone and Android device in Milestone 5.

## Next

Milestone 4 connects actual playback audio to mouth/performance state and adds sparse semantic performance cues without making the model a low-level animation controller.
