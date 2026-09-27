# Milestone 9 — MVP Curriculum + Product Shell

Status: implemented on `feat/m9-mvp-curriculum-shell`; live/product validation still required.

## Goal

Turn the proven vertical slice into a small usable B1 speaking product without pretending to ship a complete B1 course.

Milestone 9 deliberately focuses on the product loop around live conversation:

```text
Home recommendation
  → live mission
  → structured evidence
  → session review
  → learner memory
  → next mission / recycle
  → progress path
```

It does **not** add B2, payments, authentication/cloud sync, streaks, social features, a large curriculum catalog, or mobile hardening. Mobile reality is Milestone 10.

## Curriculum boundary

The MVP contains six authored B1 conversation missions:

1. **Tell me what happened** — connected familiar narration, sequencing, reasons, follow-up/repair.
2. **Recommend something — and make the case** — position, reason/example, response to another view, follow-up.
3. **Compare the options and decide** — relevant comparison, supported choice, adjusting a plan, simple compromise.
4. **Explain the problem clearly** — problem explanation, impact/detail, clarification, practical next step.
5. **Keep the conversation moving** — reaction, asking back, developed turn, conversational repair.
6. **Explain it so someone can follow** — overview, connected explanation, concrete example, unprepared question.

These missions are new EnglishLive delivery contracts. They use the approved B1 boundary in `addvaluewithai-hub/english-course` as curriculum reference only: connected familiar independence, connected narration, brief reasons, unprepared familiar interaction, clarification/repair, and comprehensible continuation despite pauses.

This is an **MVP coverage loop**, not a claim that six conversations equal B1 mastery or full CEFR coverage.

## Goal adaptation

The evidence contract of each mission stays stable while the surface situation adapts to the learner's selected goal:

- work;
- interviews;
- travel;
- everyday conversation;
- study/ideas.

Changing the surface topic must not silently change what counts as evidence.

## Planner rules

`src/curriculum/planner.ts` is application-owned. Gemini never chooses curriculum order.

### First pass

The learner sees each of the six different speaking jobs once before the planner starts deliberate recycle.

A mission attempt opens the next mission even when the session collected little or incomplete evidence. The path is not an exam gate and must not trap a learner on one prompt.

### Recycle

After the first pass, the planner prioritizes:

1. missions with capabilities marked `recycleSuggested`;
2. missions that were attempted but never produced usable structured evidence;
3. otherwise the least recently practised mission.

The most recent mission is deprioritized when another suitable recycle exists, reducing immediate repetition.

Recycle means **a fresh conversation opportunity**, not repeating the same exercise until a score changes.

## Mission-level product memory

Milestone 9 adds mission-level state alongside capability memory:

```ts
interface MissionMemory {
  missionId: string;
  attemptedSessions: number;
  observedSessions: number;
  completedSessions: number;
  lastPractisedAt: string;
}
```

This prevents the curriculum path from depending on the bounded recent-session window.

Mission completion remains separate from capability evidence. A learner may produce useful evidence without finishing every objective, and completing a mission is still not a CEFR mastery claim.

## Session Review

Ending a live conversation now routes to a dedicated review screen.

The review shows only structured, content-minimized observations:

- objectives whose authored evidence was met;
- objectives that were attempted and deserve another natural observation;
- a recommended next conversation.

It does not replay or persist the transcript and does not show numeric fluency, percentage-to-B1, or a fabricated proficiency score.

Relationship-memory proposals also move to Review. They remain ephemeral navigation state until the learner presses **Keep**. Navigating/reloading without approval safely drops the proposal.

## Progress screen

`/progress` shows the six speaking jobs with statuses:

- New conversation;
- Tried — more evidence needed;
- Evidence collected;
- Worth revisiting.

The screen explicitly describes this as coverage/evidence, not a level percentage.

The user can manually practise any mission; the Home recommendation remains planner-driven.

## Home and partner shell

Home now shows:

- the planner-selected next conversation;
- why it was selected;
- a compact six-job path summary;
- partner-specific approved continuity notes.

Changing conversation partner keeps the same planned curriculum mission. Character choice changes relationship/style, not curriculum truth.

## Privacy boundary

Milestone 9 preserves the Milestone 8 split:

- learning memory stores deterministic learning observations, not personal story details;
- relationship memory requires explicit consent and is scoped to one character;
- raw audio/transcripts are not persisted by this product memory layer.

Session Review does not weaken these rules.

## Acceptance

Engineering:

1. all six mission ids resolve through one catalog;
2. Home, Partners, Session, Review, and Progress consume the same catalog/planner state;
3. an attempted mission opens the next first-pass mission without requiring a pass;
4. recycle is evidence-driven and avoids unnecessary immediate repetition;
5. mission-level progress survives the bounded recent-session list;
6. Review uses structured observations only;
7. relationship-memory proposals remain unsaved until explicit Keep;
8. no overall numeric proficiency/mastery score is introduced;
9. TypeScript and production build pass.

Manual/live:

1. each mission feels like a real conversation rather than four visible rubric questions;
2. the six missions feel meaningfully different in conversational job, not just topic wording;
3. goal variants remain natural for work/interview/travel/everyday/study learners;
4. the model can repair and use board support without exposing curriculum mechanics;
5. Review is useful and brief rather than school-report-like;
6. after one pass, recycle feels spaced and intentional;
7. manual mission choice does not corrupt planner state;
8. partner switching preserves curriculum continuity and relationship-memory separation.

## Explicit non-goals

- full B1 syllabus claim;
- B2 catalog;
- CEFR certification;
- pronunciation scoring;
- auth/account/backend migration;
- cloud cross-device progress;
- payments/subscriptions;
- streaks, XP, leaderboards;
- notifications;
- real-device iOS/Android hardening.

Those must not be pulled into M9 merely because the shell now looks more complete.
