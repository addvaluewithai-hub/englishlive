# Milestone 5 — Conversation Tutor Runtime

Status: implemented on `feat/m5-6-tutor-stage-board`; live/manual validation still required.

## Goal

Turn EnglishLive from a free-form voice character into a curriculum-controlled conversation product without making the learner feel like they are taking a scripted lesson.

## Core rule

**The application owns progression and evidence. Gemini owns the conversation.**

The model may explain, ask, clarify, recast, and improvise naturally inside the current objective, but it cannot advance the mission by simply deciding that the learner is ready.

## Runtime contract

`ConversationMission` contains:

- stable mission id;
- CEFR level;
- purpose and scenario;
- opening brief;
- ordered conversation objectives.

Each `ConversationObjective` contains:

- capability id;
- natural conversation brief;
- authored success evidence;
- accepted response kinds;
- repair hints;
- whether brief board support is allowed.

## Authoritative tools

The runtime exposes three blocking client tools:

1. `get_mission_state` — returns only the authoritative current objective;
2. `assess_current_objective` — records semantic evidence and may advance one objective;
3. `finish_mission` — mandatory completion gate after every objective has evidence.

Future objectives are deliberately hidden from the model while it is working on the current one.

## Evidence rules

- live audio meaning is valid evidence when clearly understood;
- automatic transcription is an audit hint, not ground truth;
- a pass requires a response kind, rubric verdict, evidence source, and semantic summary;
- keyword presence alone cannot pass an objective;
- help requests, unusable audio, or unsupported response kinds cannot be passed accidentally;
- stale objective ids are rejected;
- the model must clarify uncertainty instead of inventing evidence.

## Live integration

`GeminiLiveTransport` now supports application-owned client tools in addition to the character performance tool. Tool handlers run before processing subsequent content from the same server message and return structured tool responses to Gemini.

The live session:

- creates a `ConversationTutorRuntime` when practice starts;
- records automatic input transcription against the current objective;
- injects the runtime system policy alongside character + learner context;
- sends runtime tools to Gemini Live;
- keeps learner-facing curriculum mechanics hidden.

## Integration fixture

`src/tutor/demoMission.ts` is intentionally a small integration fixture with two objectives. It exists only to verify runtime behavior before Milestone 7 authors the first real B1 mission.

It must not be expanded into the MVP curriculum.

## Acceptance

Engineering:

1. TypeScript/build passes;
2. custom Gemini Live tools are registered and receive structured responses;
3. stale objective assessments are rejected;
4. a pass cannot occur without authored semantic evidence fields;
5. the runtime alone owns objective progression and mission completion;
6. automatic transcript text cannot silently become truth.

Manual/live:

1. Gemini calls `get_mission_state` before the opening turn;
2. a learner response can pass or stay through `assess_current_objective`;
3. after a pass, Gemini continues from the newly returned objective rather than memory;
4. a side question does not advance progress;
5. `finish_mission` is required before the model treats the practice as complete.

## Not included

- persistence between sessions;
- long-term learner model;
- real B1 curriculum authoring;
- post-session scoring;
- authentication/cloud progress.

Those belong to later milestones.
