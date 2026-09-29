# Speaking Hub v1

This branch implements the screenshot-driven speaking experience around the unified course decision.

## Routes

- `/speak` — Speak Home / practice hub
- `/speak/world/:worldId` — scenario explorer, not a second curriculum path
- `/speak/scenario/:scenarioId` — scenario start sheet and difficulty choice
- `/speak/live/:scenarioId` — live conversation UI shell
- `/speak/progress` — conversation analytics/progress view

## Product rules encoded

- Speak is practice/application over the same course, not a separate progression.
- Course-linked recommendations can expose `courseLessonIds` and `courseSourceAr` without surfacing internal IDs to learners.
- World readiness is expressed as `ready`, `challenge`, or `later`.
- Difficulty is learner-facing `easier`, `recommended`, or `challenge`.
- Progress is skill evidence/analytics, not a separate speaking level.

## Assets

Screenshot-derived transparent UI assets are hosted under the Englotti Cloudinary folders `englotti-speaking` and `englotti-speaking-icons`. URLs are centralized in `src/speaking/assets.ts`.

## Current integration boundary

The visual product flow is implemented with a typed in-app speaking catalog so frontend work can proceed while curriculum authoring continues. The live scenario screen is currently the product UI shell; the next backend step is to connect it to the unified `speaking_sessions` runtime rather than legacy Free Speak persistence.
