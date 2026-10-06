# Practice conversation preview

## Problem and behavior

Practice used the Live voice model to evaluate language and advance authored beats before replying. Learners experienced a slow conversation, checklist-like progression, and a forced ending. This preview removes all tools from Practice's Live session. Otti responds in role to the actual meaning; an independent HTTP coach reviews transcript evidence in the background.

Learners can combine goals, change their choice, ask relevant questions, and use valid short answers. Goal observations are descriptive, never gates or mastery scores. A meaning-changing ambiguity still receives an in-role clarification. Notes appear in a closed notebook; learners choose when to read, pause, resume, or finish. Final review rechecks the transcript, including turns coalesced by the background queue.

The B1 wrong-order scenario has four flexible opportunities. Available remedies stay consistent: the original coffee in ten minutes, a medium now plus one dollar returned, or a full four-dollar refund. Solutions are discovered through conversation rather than prescribed learner sentences.

## Technical boundaries

- Only Practice uses the new runtime. Learn and other speaking modes retain their existing runtimes.
- Practice passes no Live tools and never sends legacy tool-opening instructions.
- Practice's automatic silence tolerance is 1,200 ms; the optional thinking-time setting is 2,400 ms. Other modes retain 3,600 ms. These are configuration values, not measured response-time promises.
- Done speaking sends audioStreamEnd to the existing automatic VAD session. Latency samples in Copy conversation are approximate client measurements from the last detected speech to the first received reply audio, not sound reaching the learner's ears.
- `/api/practice/coach` requires the existing verified user JWT. Provider keys remain server-side. It reuses the app's Gemini Interactions API pattern, sets `store: false`, and defaults to `gemini-3.5-flash-lite`. `PRACTICE_COACH_MODEL` can override this without changing Live's model.
- Background reviews are bounded to one in-flight request; newer pending turns coalesce. Recap reviews the most recent 80 transcript turns. Requests have size limits and bounded deadlines.
- Correction originals must occur in learner speech; single-turn feedback cannot borrow another turn or partner wording. Goal ids are whitelisted. Malformed provider output reports unavailable review, rather than pretending the learner was error-free.
- Transcripts are in-memory navigation state. Refreshing the review page does not restore a past conversation.
- Mission facts and curriculum references remain authored. This experimental app branch changes the execution protocol; publish accepted source-contract updates to `speaking-practice` after the preview has been tried.

## Validation

Run `npm run check`, `npm run test:ui`, and `npm run test:practice`. CI runs all three. The Practice tests exercise authenticated JWT verification with a mocked provider, transcript-source safeguards, malformed responses, goal filtering, multi-layer hints, every mission's opening, and Live wire configuration with a fake socket. They do not establish real provider judgement quality or real microphone latency. On this same-repository rescue branch, CI also runs a real Live provider trial with fictional typed A2/B1 dialogue through the app transport and verifies audio/transcript responses. It prints dialogue and text-to-first-audio timings without logging tokens. Microphone capture, audible playback latency, and the authenticated coach provider still require signed-in trials.

Try these conversations in the deployed preview:

1. A2: order a large hot coffee with milk and no sugar in one turn. Otti should retain all preferences and avoid asking questions already answered.
2. B1: explain the wrong order and five-minute limit together, then ask about remedies. Choose a medium or refund in your own wording. A short valid confirmation needs no invented reason.
3. B1: say “I prefer to give you one dollar back.” Otti should clarify the direction of the money. The notebook should review the learner's actual wording rather than attributing staff speech to them.
4. Open a hint, then speak a different valid answer. A late hint must not replace the newer conversation context.
5. Pause during Otti's speech and resume. Missed speech should be repeated, with the mic muted throughout the pause.
6. Finish before achieving every goal. The recap should describe the conversation, offer available corrections, and avoid awarding a false completion or proficiency score.
7. If background coaching fails, continue speaking and retry the final review. Voice must remain independent of coaching availability.
