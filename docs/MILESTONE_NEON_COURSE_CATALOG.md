# Milestone — Neon-backed course catalog

## Goal

Make the published Neon authoring hierarchy the source of truth for learner navigation, while retaining the reviewed TypeScript lessons only as an offline/dev fallback.

## Runtime path

`courses → course_levels → course_units → lessons → lesson_revisions`

`GET /api/content/catalog` returns only active hierarchy rows whose lesson identity points at a published revision. The learner app groups those rows into levels, units and ordered lessons.

The catalog is cached in `sessionStorage` for route-safe synchronous lesson lookup. Authenticated bootstrap preloads it before protected learner screens render, so a lesson newly published in Neon can be opened without adding that lesson to the local TypeScript catalog.

## Screens moved to the cloud catalog

- Home continuation card
- Learn / level browser
- Level / unit browser
- Unit / lesson list
- Progress
- Lesson completion next-step
- Onboarding first-lesson handoff

## Deliberate fallback

The first three reviewed A1 lessons and the existing A1 presentation copy remain in the bundle as a resilience fallback. They are no longer the primary navigation authority when the Neon catalog endpoint is available.

## Current production content

The current production hierarchy contains one active course (`englotti-english`), A1, Unit 1, and three published lessons. Therefore the learner UI should currently show 1 published unit and 3 available lessons rather than the old hard-coded 10-unit / 62-slot planning outline.

## Acceptance target

1. Signed-in learner opens Home/Learn and sees the published Neon counts.
2. Unit 1 shows exactly the three currently published lessons.
3. Starting those lessons still loads the pinned lesson + character + teaching-policy revisions.
4. Publishing a future lesson into the same unit should make it appear in navigation without a frontend deploy, provided its identity is active and `published_revision_id` points at a published revision.
5. CI, Vite build, Visual QA and Cloudflare preview remain green.

No production schema migration is required for this milestone.
