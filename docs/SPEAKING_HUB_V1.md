# Speaking Hub v1

This branch implements the screenshot-driven speaking experience around the unified course decision and connects scenario practice to the production Gemini Live + Neon runtime.

## Routes

- `/speak` — Speak Home / practice hub
- `/speak/world/:worldId` — scenario explorer, not a second curriculum path
- `/speak/scenario/:scenarioId` — scenario start sheet and difficulty choice
- `/speak/live/:scenarioId` — real Gemini Live scenario conversation
- `/speak/scenario-recap/:sessionId` — scenario recap and interaction evidence
- `/speak/progress` — accumulated conversation evidence view
- `/speak/:modeId` and `/speak/recap/:sessionId` — existing open Free Speak runtime remains separate

## Product rules encoded

- Speak is practice/application over the same course, not a separate progression.
- Course-linked recommendations can expose `courseLessonIds` and `courseSourceAr` without surfacing internal IDs to learners.
- World readiness is expressed as `ready`, `challenge`, or `later`.
- Difficulty is learner-facing `easier`, `recommended`, or `challenge`; it changes interaction support, not the learner's CEFR level.
- Productive expectations are constrained by the scenario's taught/recycled language. The partner may use small amounts of comprehensible incidental English but may not require unfamiliar specialist language for success.
- Progress is accumulated interaction evidence, not a separate speaking level or one-session mastery judgment.
- `not_observed` means the conversation did not provide enough evidence; it is not treated as weakness.
- The runtime never claims pronunciation/accent quality from transcript-only evidence.

## Live runtime

`SpeakingLiveScreen` uses the same production voice primitives as Free Speak:

- `GeminiLiveTransport`
- `MicrophonePcmStream`
- `PcmPlaybackQueue`
- published Otti character/voice configuration from Neon

A scenario creates a dedicated `speaking_sessions` row after Gemini connects. The runtime autosaves transcript and duration while the conversation is active. Ending the scenario marks the session complete and runs a structured transcript analysis.

The Gemini partner receives a scenario contract rather than a written dialogue: learner role, partner role, practical goal, recycled course abilities, interaction targets, difficulty behavior and a short partner brief. Conversation remains generative inside those constraints.

`VITE_VISUAL_QA=1` never starts Gemini, the microphone or a cloud session; the live screen renders a deterministic fixture for screenshot QA.

## Neon model

Migration `db/migrations/0004_speaking_sessions.sql` adds:

- `speaking_sessions` — version-pinned character, scenario snapshot, difficulty, transcript and recap analysis
- `speaking_session_evidence` — one evidence record per targeted interaction skill per session

The scenario snapshot preserves the course references, target language descriptions and interaction focus used for that historical run even if the frontend catalog later changes.

Evidence outcomes are deliberately small and non-numeric:

- `demonstrated`
- `emerging`
- `not_observed`

`/api/speaking/progress` aggregates repeated evidence across sessions. A single completed scenario does not produce a mastery claim.

## Recap analysis

`functions/_shared/speakingAnalysis.ts` uses Gemini structured output to produce a concise recap containing:

- grounded strengths
- at most two high-value language improvements
- vocabulary that actually occurred in the transcript
- one next focus when evidence supports it
- interaction evidence only for the scenario's declared target skills

Evidence excerpts must come from learner turns. The analyzer is explicitly prohibited from assigning CEFR, numeric scores, mastery, pronunciation, accent or intonation judgments.

## Assets

Screenshot-derived transparent UI assets are hosted under the Englotti Cloudinary folders `englotti-speaking` and `englotti-speaking-icons`. URLs are centralized in `src/speaking/assets.ts`.

## Deployment requirement

Before deploying the merged runtime, apply database migrations in numeric order so production Neon includes `0004_speaking_sessions.sql`. `DATABASE_URL` and `GEMINI_API_KEY` remain server-side secrets. `SPEAKING_ANALYSIS_MODEL` is optional and falls back to the Free Speak analysis model, then `gemini-3.5-flash-lite`.
