# Milestone 9.5 — Structured Course Runtime

Status: implemented on `feat/m9-5-structured-course-runtime`; live/product validation still required.

## Goal

Pivot EnglishLive from a mission-first primary journey into a real authored course delivered by a live AI teacher, while preserving an explicit Free Speak path beside the course.

```text
Home
  ├── Learn
  │    └── B1
  │         └── Unit 1
  │              ├── Lesson 1
  │              ├── Lesson 2
  │              ├── Lesson 3
  │              ├── Lesson 4
  │              ├── Lesson 5
  │              └── Live challenge
  └── Free Speak
       ├── Just chat
       ├── Work
       ├── Travel
       └── Interview
```

## Runtime

`src/course/CourseLessonRuntime.ts` adapts the strongest pattern from `addvaluewithai-hub/learn`:

- application-owned authored order;
- one current beat only;
- blocking semantic assessment before evidence beats advance;
- transcripts are audit hints, not truth;
- completion requires application state;
- the model teaches naturally inside current authored state.

Teacher-only beats advance only after the audible teacher turn finishes. If playback is interrupted, the beat remains current.

Evidence beats require semantic evidence through `assess_current_beat` and independently observed microphone activity for `live_audio` evidence.

## Authored board

Boards in Learn are application-owned authored data. Gemini does not generate the canonical lesson visual.

The Stage Director queues the beat board and reveals it only with audible speech, then returns the character to hero mode after the turn.

## B1 Unit 1

Unit 1 is **Tell stories people can follow**.

It is grounded in the approved B1 boundary from `english-course`: connected familiar independence, connected narrative, reasons, unprepared familiar interaction, and repair.

### Lesson 1 — Set the scene

- time/place anchors;
- background activity;
- moving from background to the first event.

### Lesson 2 — Put events in order

- first / then / after that / eventually;
- chronological control;
- connected sequence rather than isolated sentences.

### Lesson 3 — Explain why it happened

- because;
- so / that’s why;
- reason → event → consequence.

### Lesson 4 — React and add useful detail

- reactions and feelings;
- one useful concrete detail;
- developing why a story moment mattered.

### Lesson 5 — Handle follow-up questions

- clarification and repair;
- circumlocution;
- developing an answer to an unprepared follow-up.

### Lesson 6 — Live story challenge

Combines the Unit in one unscripted familiar narrative:

- scene;
- sequence;
- reason/consequence/reaction;
- genuine follow-up and repair.

Completing the challenge is one authored course completion and one fresh story observation. It is not a claim of B1 mastery.

## Product shell

Primary navigation is now:

- Home
- Learn
- Speak
- Progress

Character selection remains available contextually but does not decide curriculum order.

### Home

Home now prioritizes **Continue Learning** and exposes **Free Speak** as a second clear action.

### Learn

Learn shows the authored Unit and sequential Lessons. The next incomplete Lesson is unlocked. Completed Lessons may be replayed.

### Progress

Progress reports deterministic course completion such as `3/6 lessons completed` and resumable current lesson state. It explicitly does not convert Lesson completion into a proficiency percentage.

### Lesson Review

A paused or completed Lesson routes to a dedicated review:

- evidence beats observed in that run;
- useful attempts that did not yet meet authored evidence;
- continue/replay/next-Lesson action;
- optional relationship-memory consent.

## Free Speak boundary

Free Speak reuses:

- Gemini Live;
- microphone/playback;
- character performance;
- learner profile;
- partner-specific learner-approved relationship memory.

Free Speak does not instantiate the Course Lesson Runtime and never writes Course Progress.

It also does not claim a score or Lesson completion.

## Course persistence

A separate `englishlive.course.v1` local store contains only privacy-minimized course state:

- lesson completion statuses;
- current beat for resume;
- lesson run counts;
- recent content-minimized observations.

No raw audio, transcript, or personal story summary is persisted by the course store.

A completed lesson is a floor: stopping an incomplete replay cannot erase a previous completion.

## Legacy mission runtime

M9 mission contracts are not deleted in this milestone. They remain useful as:

- assessment/challenge research;
- future optional practice packs;
- migration compatibility.

They are no longer the primary Home/Learn/Progress journey.

## Acceptance

Engineering:

1. Course → Level → Unit → Lesson → Beat contracts exist independently from Gemini/UI.
2. B1 Unit 1 contains six authored live lessons.
3. Lesson order is application-owned.
4. Evidence beats cannot advance without valid semantic evidence.
5. Teacher-only beats advance only after audible playback completion.
6. Authored boards are controlled by the app and synced to the current beat.
7. Partial Lessons resume from privacy-minimized beat state.
8. Incomplete replay cannot erase a prior Lesson completion.
9. Home/Learn/Progress use Course state rather than M9 mission planner state.
10. Onboarding starts Lesson 1.
11. Free Speak never writes Course Progress.
12. Character switching does not change Unit/Lesson state.
13. TypeScript and production build pass.

Manual/live:

1. Lesson 1 feels like a live teacher, not a narrated form.
2. Board timing feels intentional and character-first.
3. Spoken checks feel like questions inside teaching, not exposed rubric steps.
4. Interruption during a teacher explanation does not silently advance the Lesson.
5. Resume returns to the correct authored beat.
6. The six Unit 1 Lessons feel like one coherent progression.
7. The challenge feels meaningfully freer than the guided Lessons.
8. Free Speak feels open-ended and visibly separate from Learn.
9. Mobile layout is usable enough for M10 real-device hardening.

## Explicit non-goals

- authoring the remaining B1 Units;
- B2 authoring;
- CEFR certification;
- cloud persistence/auth migration;
- payments/subscriptions;
- native audio hardening;
- a pronunciation score;
- automatic AI-generated course structure.
