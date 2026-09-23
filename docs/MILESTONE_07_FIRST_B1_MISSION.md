# Milestone 7 — First Real B1 Mission

Status: implemented on `feat/m7-8-b1-memory`; live learner validation still required.

## Goal

Replace the runtime-only `foundation-demo` route with the first production-authored conversation mission.

## Curriculum reference boundary

The old `english-course` repository is reference material, not delivery code. Its approved `LEVEL_EXIT_PROFILES_V1.md` defines B1 as **connected familiar independence**: connected narration of experiences/events, brief reasons, unprepared familiar conversation, chronological control, and comprehensible continuation despite pauses/repair.

Its B1 fresh-exit evidence includes an unscripted familiar problem, a connected narrative, and a reasoned response in more than one context.

EnglishLive therefore uses this mission to collect **one observation** of those abilities. Completing one mission never means the learner has mastered B1 or even mastered one capability.

## Mission

Stable id: `b1-unexpected-change-story`

The surface scenario adapts to the learner's onboarding goal (work, interviews, travel, everyday, or study) while the evidence contract stays stable.

Objectives:

1. establish enough context for the listener to understand the original situation/expectation;
2. connect the change and subsequent events into a comprehensible sequence;
3. explain a reason, reaction, consequence, or response;
4. handle one genuinely unprepared follow-up, clarification, or repair.

The mission does not require a specific tense, connector, vocabulary item, or memorized story shape. Language form supports communicative success rather than replacing it.

## Board policy

Board support is rescue-only. Context and follow-up objectives deliberately disable it. Sequencing/reason objectives may use brief support, but the board must not contain a model answer that supplies the learner's story.

## Acceptance

Engineering:

- production routes resolve the real mission instead of `foundation-demo`;
- mission id remains stable across goal variants;
- the runtime still owns evidence/progression;
- all four objectives have authored semantic evidence rules;
- completing the mission creates observations, not mastery claims;
- TypeScript and production build pass.

Manual/live:

- the conversation feels like one coherent story rather than four visible tests;
- a learner can succeed with imperfect grammar when connected meaning is clear;
- a one-word or model-supplied response cannot pass the narrative objectives;
- the final follow-up is genuinely responsive to what the learner said.
