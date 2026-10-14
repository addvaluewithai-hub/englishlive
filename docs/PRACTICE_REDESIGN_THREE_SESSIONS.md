# Practice redesign — 3 implementation sessions

Goal: simplify EnglishLive Practice into **understand → listen → speak → review**. Protect the proven Gemini Live mistake notebook (PR #46 on main). Screens must remain fully bilingual, responsive, and accessible.

## Session 1 — Scenario and two-speaker listening (this PR)

- Replace Live/Otti briefing with a **scenario card** that identifies the learner role, conversation partner, the situation and non-gating opportunities.
- Separate **listening page** with example WAV from Gemini 3.8 Flash TTS using **only canonicalDialogue** (two distinct speakers, style/emotion per turn), audio controls (play/pause/seek/speed), original English script, optional authored Arabic translation.
- Allow skipping listening and starting live speaking at any time. Preserve relaxed pace preference. No Live connection, notebook calls, mic permission, or learner transcription in these screens.
- Authenticated server endpoint derives text from mission slug; Cloudflare edge caches WAV by immutable-ish mission revision and model; handle slow first generation, errors, retry, and skip honestly.
- **Shipping gap**: first uncached request still synthesizes audio; to reach instant playback globally, publish and editorially QA a static/R2 recording per lesson revision (or prewarm each deployment). Draft Arabic translations must be checked by a human editor before production.

**Acceptance**: scenario and sample screens render across seven missions, two speaker voices on real device, sample words match authored script, audio controls and skip work, no Live session until user begins roleplay, no changes to mistake collector. Verify mobile Safari, Android and RTL layout. QA real Gemini provider audio before merge.

## Session 2 — Live roleplay and Hold to Speak

- Redesign Otti stage, put turn-state and microphone first, collapse optional goals and hints.
- Replace current mic toggle with accessible **press and hold to speak** (pointerdown/up/cancel/blur, keyboard Space/Enter, touch action, slide-out cancel).
- On down **immediately stop audible Otti playback and suppress late streaming audio**, acquire mic/open microphone only when ready, keep Otti silent during the hold; on release mute mic and end audio input, *then* allow agent reply.
- Prewarm audio permissions at connection/start; do not lose the first phoneme waiting for getUserMedia. Prevent empty/accidental short holds being submitted. Handle WebSocket reconnect and out-of-order provider messages. Test rapid presses, lost pointer capture, overlapping audio, screen lock, and interruptions. Be honest about Live model turn races; test real provider not just mocks.
- Display hints progressively: intent → useful chunks → optional example. Goals are observations, never a grade or required sequence.

**Acceptance**: no self-interruption/overlap on real mobile devices, user can barge in with one hold; no missing audio due to permissions, learner speech never sent during Otti playback except deliberate barge-in; tool mistake capture remains accurate.

## Session 3 — Review and final polish

- Distinguish **actual English mistake** vs **optional style/politeness improvement**; never mark correct wording such as “I want a refund” as wrong.
- Save exact heard original, minimal correction and **WHY** grammar/usage explanation. Keep explanation optional for notebook saving (missing why must never drop a mistake).
- Show typed correction cards, bilingual explanation, and practice-with-Otti action; don't invent unobserved learner phrases. Redesign mobile notes and post-session summary.
- Accessibility, localizations, low bandwidth, logging, and end-to-end tests across all seven missions. Resolve or supersede obsolete PR #47 before merging.

**Acceptance**: saved notes still match words heard in Live, mistakes and better expressions are distinct, correct phrases are not given red crosses, review actions are practical, and no regression in PR #46.
