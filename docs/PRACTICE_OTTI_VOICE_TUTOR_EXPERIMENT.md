# Interactive Otti practice tutor

Experimental draft PR #45, updated 2026-10-14. Do not merge before real voice QA.

## Learner experience

All three phases use the same `PracticeTutor` presentation, animated `CharacterHost`,
speech-synchronized mouth playback, shared character loader, and Live layout.

1. Introduction: use Talk with Otti to hear the scenario, learning goal, facts and
   sample dialogue. Ask questions by microphone or text. Samples are demonstrations,
   never evidence of learner errors. No scripted readiness answer is required.
2. Start roleplay: the introduction connection closes and the roleplay connection
   starts automatically. Otti acts in the scenario and records clearly detected
   genuine errors, including small ones, through NON_BLOCKING tools with SILENT
   acknowledgements. Valid short replies, accents and style preferences are not errors.
3. Finish and review: final received messages are drained before the notebook is
   frozen and passed to review. The same animated tutor starts an interactive review.
   Ask questions, discuss corrections and rehearse corrected phrases. Rehearsal is new
   practice and cannot change the original report. Written corrections remain below.

Each phase owns a disposable connection. Microphone, playback, pause, interruption,
stop/reconnect and cancellation share one runtime. The mic opens after audible playback
finishes. A failed automatic start exposes the same Talk with Otti retry control.
Arabic tutoring uses friendly Egyptian Arabic with English examples.

## Follow-up after the user microphone test

The user provided a real session diagnostic: setup accepted, three successful
`record_practice_progress` calls, zero `record_language_issue` calls, zero collector
rejections, and finishTimedOut=true. This confirms the provider dispatched progress
calls while the separate language-issue path was never invoked. It does NOT establish
why the model omitted detecting/recording errors; no original microphone audio exists.

The follow-up changes the observation contract, not just the prompt wording:

- `record_practice_progress` now requires `language_review` alongside goal IDs on
  every actual learner turn. It can save multiple precise errors in the same call,
  even with zero new goals. The standalone issue tool remains compatible.
- The review distinguishes explicit `no_clear_issue`, uncertain words, and missing
  language reviews. Communicative success is never evidence of correct grammar.
- Finishing sends a private event in the SAME roleplay connection asking for a final
  actual-heard-language audit. A structurally valid `final_review:true` acknowledgement
  is awaited for at most eight seconds. Finalization audio is suppressed, the mic stays
  closed, and received tool messages are drained before the notebook is frozen.
- Malformed or missing final reviews cannot count as an acknowledged finalization.
  Timeout and missing-language-review counts remain visible in copied diagnostics.
- Fixed the playback starvation case: audio may drain before server turnComplete.
  The runtime now checks drained playback when that late signal arrives, so it does
  not wait forever for an audio-completion callback that already happened.
- The lesson room now has a phase heading, compact animated conversation area and
  working microphone actions. Removed the inert more button and detached report.
  Review notes sit beside Otti on desktop and expand in the same lesson on mobile.
  Each note can be selected for interactive discussion/rehearsal. Raw JSON is absent
  from the normal learner UI; a details action copies original and review diagnostics.

Validation: build/check passed; 24 practice tests and 8 UI tests passed. Tests cover
batched language+goal observations, explicit/missing/uncertain reviews, late final
notes, acknowledgement validity, and already-drained playback. Existing visual QA
selectors were updated to the new structure but browser tests were NOT run at the
user's request. Actual model detection, final acknowledgement reliability, audio
fluency and final UI appearance require another user test; they are not proven fixed.

## Notebook reliability and the original zero-note report

The earlier report lacked a trace. The subsequent trace above narrows the failure
to absent language recording calls, not collector rejection. Detection quality and
the model reason for omitting those calls remain unverified.

Concrete fixes:

- Removed the 12-issue collector cap and 8-issue review truncation.
- Deduplicate by original AND correction, preserving distinct fixes for the same phrase.
- Explicitly instruct Otti to record every clearly detected genuine error, including
  minor errors, while abstaining when exact words are uncertain.
- Own the notebook above the connection, so stop/reconnect cannot erase it. Reconnect
  includes prior teacher/typed context and observed goals without inventing voice text.
- Finish waits up to eight seconds for explicit notebook finalization, drains received frames,
  closes the connection, then snapshots notes. A timeout is reported in diagnostics;
  this cannot guarantee receipt of future provider frames.
- Review exposes metadata-only notebook diagnostics and includes them in Copy Otti
  report: model/API version and offered tools, setup acceptance, received tool calls,
  save/rejection counts and rejection reasons, unknown tools/errors, finish timeout.
  No tokens, audio or rejected phrases enter diagnostics. No calls is not error-free.

The checked-in token route requests `v1beta/auth_tokens`, model `gemini-3.8-live`, and
locks only model and audio modality. Browser setup may supply function declarations.
The transport handles audio and tool calls in the same frame and uses the documented
`response.scheduling = SILENT` shape. Actual deployed token/model behavior still needs
verification from a real session's diagnostics.

References checked on 2026-10-14:
- https://ai.google.dev/gemini-api/docs/live-api/tools
- https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens

Google's current tool guide documents NON_BLOCKING/SILENT but includes model-specific
async support caveats. Documentation and mocked dispatch alone do not establish actual
Gemini 3.8 Live detection or fluency.

## Evidence and privacy

No extra microphone recording, WAV upload, separate STT or automatic Coach assessment.
Input transcription remains disabled. Only explicit Hint requests use the existing
hint endpoint. Goals are informational observations: multiple/out-of-order goals are
allowed and do not gate conversation or imply mastery. Notes are browser route state,
not new app database writes. Zero notes never proves error-free speech.

## Validation

- `npm run check`: passed (existing asset/chunk-size warnings).
- `npm run test:practice`: 24 tests passed, including token setup, mixed audio/tool
  frames, notebook limits/rejections, interactive runtime, playback/listening,
  interruption, pause/resume, cancellation, draining and retry-note retention.
- `npm run test:ui`: 8 tests passed.
- Source files changed/added remain below 300 lines.
- An already-running mock browser smoke completed six introduction/roleplay/review
  journeys. Further browser checks were cancelled at the user's request; the user
  will test the real UI and audio.
- Real signed-in microphone/provider QA is still required. Confirm actual detected
  errors and small errors are recorded, inspect diagnostics on a zero-note result,
  verify late notes/reconnect, ask review follow-up questions and rehearse phrases,
  and listen to Arabic/English voice and animation across all three phases.
