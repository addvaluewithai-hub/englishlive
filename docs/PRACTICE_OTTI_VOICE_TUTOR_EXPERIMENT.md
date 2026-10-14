# Interactive Otti practice tutor

Experimental draft PR #45, updated 2026-10-14. Do not merge before real voice QA.

## Learner experience

One lesson with Otti in three phases. Every phase uses the existing speaking screen
(`fs-live` / `sp-scenario-live` / `practice-live`): Otti's caption bubble, the animated
`CharacterHost` with speech-synchronized mouth, the turn status pill, and the bottom dock
(type / microphone / one phase action). A `1/3 · 2/3 · 3/3` pill in the header shows the phase.

1. **Lesson** (`/practice/mission/:slug`). Press *Start lesson*: Otti greets, says what we
   will learn today, sets the scene, demonstrates at most two sample exchanges, then answers
   questions by voice or text. A compact *Today's lesson* card (goal, steps, facts, pace
   toggle) sits under Otti on phones and beside him on desktop. Samples are never evaluated.
   No readiness ritual: *Start the conversation* in the dock moves on whenever the learner wants.
2. **Conversation** (`/practice/live/:slug`). Starts automatically. Otti stays in role, never
   corrects aloud, and silently notes goals and mistakes. Goal chips are informational only.
3. **Review** (`/practice/complete/:slug`). Starts automatically on the same stage. Otti goes
   through the saved notes one at a time, asks the learner to say the better sentence, answers
   follow-up questions and practises any phrase. Written notes sit beside Otti on desktop and
   in a bottom sheet (*Notes (n)*) on phones; *Practise this* hands a note to Otti by voice.

Each phase owns a disposable Live connection; the continuity is the shared stage and runtime.

## Why the earlier test saved zero corrections

The user's trace: setup accepted with both tools, three `record_practice_progress` calls,
zero `record_language_issue` calls, zero rejections, `finishTimedOut: true`.

- Nothing was rejected or lost: the model never called the error tool.
- That build never asked for an end-of-roleplay review. "Finish" only waited 5 s for a
  `turnComplete`, and timed out.
- Google's Live API reference states that audio input and output reduce the model's
  function-calling ability. Silent per-turn grammar notes while acting a role are the weakest
  possible case, so per-turn notes alone cannot be the capture mechanism.
- A public forum report for `gemini-3.8-live` describes turns whose `turnComplete` never
  arrives. The old runtime waited for it before reopening the mic (felt "stuck").

## Capture design now

- **Primary: dedicated final review in the same connection.** *Done* closes the mic, mutes
  playback, sends `PRIVATE_FINISH_NOTES`, and waits for one `submit_final_review` call
  (`status` + `issues`). The connection has heard the whole roleplay and now has a single
  job. Wait 15 s, send one reminder, wait 10 s more. The UI shows "Otti is reviewing what
  you said…" on the same stage. Received messages are drained before the notebook freezes.
- **Bonus: per-turn notes.** `record_practice_progress` takes `goal_ids` (required) and
  optional `issues`. Both tools are `NON_BLOCKING` and answered with `scheduling: SILENT`.
- **Evidence rules.** An issue needs the exact heard words and a different correction;
  explanations are optional so a real error is never dropped for a missing field. Explicit
  non-`high` confidence is rejected. No cap; only identical original→correction pairs are
  grouped. Valid short replies, accents and style are not errors. Nothing is invented.
- **Honest empty states.** If the final review is `missing`/`offline`, the review says the
  notes may be incomplete (to the learner and to Otti) instead of implying clean English.

## Turn-taking fixes

- `generationComplete` is handled. If playback drains and `turnComplete` never arrives, the
  turn returns to the learner after a 1.4 s quiet gap (logged as `missing_turn_complete`).
- The 25 s watchdog only runs while Otti owes a reply. An open mic is the learner's thinking
  time and never times out (previously any noise + 25 s of thinking killed the session).
- Interrupting a reply that was already fully generated no longer mutes Otti's next reply.

## Diagnostics (no tokens, audio or learner words)

*Details for support → Copy details* in the review includes: model, API version and offered
tools; setup acceptance; tool calls/results by name; `missing_turn_complete`; finish events
(`finish_requested`, `finish_reminder`, `finish_received`/`finish_missing` with wait ms); and
notebook counts (`turnNotes`, `finalReviewCalls`, `finalStatus`, `fromTurns`, `fromFinal`,
`rejected` with reasons). This separates "never called" from "rejected" from "lost".

## Code map

- `src/practice/silentIssues.ts`: notebook and both tools; `notebook/issueEvidence.ts`: validation.
- `src/practice/tutor/finishRoleplay.ts`: final-review request, reminder, drain.
- `TutorSession.ts`, `tutorCallbacks.ts`, `turnTimers.ts`, `tutorPlayback.ts`: media and turn-taking.
- `PracticeTutor.tsx` composes `TutorStage`, `TutorDock`, `LessonCard`, `GoalStrip`, `ReviewNotesPanel`.
- `tutorCopy.ts` (all ar/en strings), `tutorView.ts` (state → status/mic action), `phaseScript.ts`.
- `src/live/`: transport split into `liveToken`, `serverContent`, `functionCalls`, `setupGate`.

## Privacy and evidence

No extra microphone recording, WAV upload, separate STT or automatic Coach. Input
transcription stays disabled. Hints use the existing endpoint only on request. Notes live in
route state, not new database writes. Zero notes never proves error-free speech. If the
connection drops and the learner reconnects, the new connection has not heard earlier speech,
so the final review only covers speech after the reconnect (per-turn notes are kept).

## Validation

- `npm run check`: passed (existing chunk-size warnings).
- `npm run test:practice`: 29 passed. Covers both tool declarations and SILENT responses with
  audio in the same frame, final review with reminder and honest `missing` outcome, early
  final calls not counting as finalization, no-cap retention, missing `turnComplete`
  hand-back, thinking time never timing out, interrupt muting, pause, cancel and note retention.
- `npm run test:ui`: 8 passed.
- Existing `visual-qa-live-layout.mjs` (40 scenarios) and `visual-qa-home.mjs` (20 scenarios)
  passed locally against a visual-QA build after updating selectors. Screenshots of all three
  phases in ar/en at 390 and 1280 px were inspected.

## Still needs a real signed-in microphone test

Mocks do not prove Live behaviour. Please check: Otti actually calls `submit_final_review`
after *Done* (copy details: `finish_received`, `fromFinal`); small errors appear in the notes;
the mic reopens promptly after each Otti turn; the review conversation answers questions and
reacts to practice; Arabic/English voice and mouth animation in all three phases.

References: Google Gemini Live API tool use and Gemini 3.8 Live model pages
(ai.google.dev/gemini-api/docs/live-api/tools, ai.google.dev/gemini-api/docs/models/gemini-3.8-live).
