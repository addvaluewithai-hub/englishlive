# ADR 002 — Structured Course Runtime as the Primary Product Journey

Status: accepted  
Date: 2026-09-23

## Decision

EnglishLive's primary learning journey is now a structured authored course:

```text
Course
  → Level
    → Unit
      → Lesson
        → Lesson Beat
```

A live AI character teaches that authored structure in real time. The application owns lesson order, beat order, boards, evidence and completion. The model owns natural delivery inside the current authored beat.

A separate **Free Speak** mode remains available beside Learn. Free Speak does not complete Lessons or advance Unit progress.

This ADR supersedes earlier architecture language that described independent conversation missions and a hidden capability planner as the primary learner journey. Those contracts remain useful for live challenges, assessment tasks and legacy experimentation, but they are no longer the main navigation or progression model.

## Why this changes

The mission-first design solved the blank-chat problem better than a generic voice assistant, but it still left the learner without the strongest possible mental model for long-term progression.

The structured course gives the learner a clear answer to:

- what am I learning now?
- what comes next?
- what have I completed?
- where can I just talk freely?

It also lets EnglishLive reuse the strongest architectural pattern from `addvaluewithai-hub/learn`: application-owned authored progression with model-owned natural teaching.

## Product split

### Learn

Learn is the authoritative course path.

```text
B1
  Unit 1 — Tell stories people can follow
    Lesson 1 — Set the scene
    Lesson 2 — Put events in order
    Lesson 3 — Explain why it happened
    Lesson 4 — React and add useful detail
    Lesson 5 — Handle follow-up questions
    Lesson 6 — Live story challenge
```

Lessons may contain:

- teacher-led explanation beats;
- authored board moments;
- guided spoken checks;
- short conversation tasks;
- recap beats;
- end-of-unit live challenges.

The learner should experience a live teacher, not a sequence of visible rubric cards.

### Free Speak

Free Speak is deliberately outside Course Progress.

Initial modes:

- Just chat
- Work conversation
- Travel & everyday situations
- Interview practice

Free Speak may use the selected character, learner profile and learner-approved relationship memory. It must not mark Lessons complete, claim CEFR progression, or silently mutate Unit progress.

## Curriculum boundary

The course uses `addvaluewithai-hub/english-course` as curriculum research and CEFR performance reference, not as a runtime or UI dependency.

The approved B1 boundary remains **connected familiar independence**: connected narration, brief reasons, unprepared familiar interaction, clarification/repair, and comprehensible continuation despite pauses.

Unit and Lesson authoring should organize grammar, vocabulary and useful chunks under communicative jobs. Do not make the top-level course a grammar table.

Example:

```text
Unit: Tell stories people can follow

communicative job
  ├── time/place anchors
  ├── past-event language
  ├── sequencing
  ├── because / so
  ├── reactions
  └── repair language
```

Language forms are teachable authored content. They are not the product navigation hierarchy.

## Lesson runtime

`CourseLessonRuntime` owns the authoritative Lesson state.

Each beat declares:

- `kind`
- `completion`
- `teachingBrief`
- optional authored `board`
- optional spoken `prompt`
- optional `capability`
- optional `successEvidence`
- accepted response kinds
- repair hints

Two completion modes exist initially:

### `teacher_turn`

The application marks the beat delivered only after the teacher's audible turn completes. A tool call alone cannot certify that the learner actually heard the authored explanation.

If the learner interrupts before playback completion, the beat stays current.

### `evidence`

The learner must produce a content-bearing spoken attempt. Gemini must call `assess_current_beat` before responding. The application validates:

- current beat id;
- accepted response kind;
- semantic rubric verdict;
- evidence source;
- observed microphone activity for live-audio evidence.

The model cannot skip to a future beat or finish the Lesson itself.

## Board ownership

Lesson boards are authored application data.

The model receives only the current beat brief. It does not author the canonical Lesson board and does not mutate the DOM.

The Stage Director keeps the existing behavior:

```text
hero character
  → authored board queued
  → board appears with audible teacher speech
  → spoken turn ends
  → hero returns
```

This preserves the character-first product while allowing explicit teaching moments.

## Progress semantics

EnglishLive distinguishes two truths:

1. **Course completion** — which authored Lessons the learner completed.
2. **Language proficiency evidence** — what speaking capabilities have been demonstrated repeatedly across fresh contexts.

It is valid to say:

> Unit 1: 6/6 lessons completed.

It is not valid to convert that automatically into:

> B1: 100% mastered.

Course completion is deterministic product state. CEFR-level claims require broader fresh evidence.

## Persistence and privacy

Course progress uses a separate privacy-minimized local store during the pre-auth MVP.

Persistent resumable state contains only:

- lesson id;
- current beat id;
- beat completion statuses;
- lesson completion timestamp;
- aggregate run metadata;
- content-minimized run observations.

It does **not** persist:

- raw audio;
- raw transcripts;
- personal story summaries;
- Gemini context dumps.

Relationship memory remains separate, learner-approved and scoped to one character.

A completed Lesson creates a completion floor. An incomplete replay may not erase a previous completion.

## Navigation

Primary product navigation becomes:

```text
Home
Learn
Speak
Progress
```

Conversation-partner selection remains available from contextual links but is no longer a primary curriculum tab.

Legacy mission routes remain temporarily available for compatibility while the structured course becomes the active product journey.

## Initial authored vertical slice

M9.5 ships one complete Unit, not a pretend full B1 catalog:

**B1 Unit 1 — Tell stories people can follow**

1. Set the scene
2. Put events in order
3. Explain why it happened
4. React and add useful detail
5. Handle follow-up questions
6. Live story challenge

The purpose of this Unit is to validate the Course runtime and teaching experience before authoring dozens of Lessons.

## Non-goals

This ADR does not authorize:

- claiming a complete B1 syllabus from one Unit;
- auto-generating course units at runtime;
- model-owned curriculum order;
- Free Speak completing Lessons;
- numeric fluency or CEFR percentage scores;
- migration of the old `english-course` delivery architecture;
- mobile hardening before M10.
