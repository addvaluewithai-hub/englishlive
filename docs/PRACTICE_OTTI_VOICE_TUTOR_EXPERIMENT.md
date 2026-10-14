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

## Notebook reliability and the reported zero-note session

The earlier user test reported many mistakes but no saved observations. Its original
provider trace and authenticated microphone reproduction are unavailable here, so the
original root cause and model detection quality are not verified.

Concrete fixes:

- Removed the 12-issue collector cap and 8-issue review truncation.
- Deduplicate by original AND correction, preserving distinct fixes for the same phrase.
- Explicitly instruct Otti to record every clearly detected genuine error, including
  minor errors, while abstaining when exact words are uncertain.
- Own the notebook above the connection, so stop/reconnect cannot erase it. Reconnect
  includes prior teacher/typed context and observed goals without inventing voice text.
- Finish waits up to five seconds for an outstanding response, drains received frames,
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
- `npm run test:practice`: 20 tests passed, including token setup, mixed audio/tool
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
