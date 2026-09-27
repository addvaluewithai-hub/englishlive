# Neon authoring and learner-data foundation

This milestone separates Englotti's teaching engine from editable product content and establishes Neon Postgres as the intended source of truth.

## What is database-backed after activation

A live lesson requests one published teaching bundle before Gemini Live connects:

1. exact published lesson revision
2. exact published character revision
3. exact published global teaching-policy revision

The bundle is fixed for that live session. Publishing a newer revision does not change an already-running lesson.

Published revision content is JSONB so the authoring schema can evolve without turning every new lesson field into a database migration. Stable identities, ordering, progress, sessions and relationships remain relational.

## Revision rule

Published lesson, character and teaching-policy revisions are immutable. To change published content:

1. create a new draft revision
2. edit and test the draft
3. publish it
4. move the identity row's `published_revision_id` to the new revision

Never edit a published revision in place. Database triggers enforce this.

## Current editable content model

### Lesson revision

The JSONB content currently mirrors `SceneLessonDefinition`, including:

- title / subtitle / practical performance
- core language and lesson boundaries
- ordered micro-scenes
- scene goal
- Arabic teaching guidance
- English targets
- constraints
- authored board
- interaction setup and learner task
- teacher moves
- support ladder

### Character revision

Character revision JSON supports:

- display name
- learner-facing copy
- persona prompt
- optional teaching-style prompt
- optional Gemini Live `voiceName`

Renderer executable code remains app-owned and is selected through the relational `renderer_key`. Database content cannot inject renderer code.

### Global teaching policy

The default policy controls cross-lesson behavior such as:

- Egyptian Arabic in Arabic script; no Arabizi
- short calm teacher turns
- moderate praise
- current-target-only correction
- no unsupported pronunciation / accent / intonation claims
- no invented completion evidence
- opening behavior
- anti-stall decision nudge

## API boundary

The browser does not receive a Neon connection string.

```text
Englotti app
  -> Cloudflare Pages Functions (/api/content/*)
  -> Neon Postgres
```

Cloudflare receives `DATABASE_URL` as a server-side secret. It must never use a `VITE_*` prefix.

Structured lessons load lesson + character + policy together. Free Speak loads the same published character persona/voice through the character endpoint.

## Temporary local fallback

Until a Neon project is migrated, seeded and `DATABASE_URL` is configured, the app falls back to the current local first-three-lesson definitions and local character persona. Debug/technical output records either:

- `Content source: neon`
- `Content source: local-fallback`

This fallback is migration safety, not the intended long-term production source of truth.

## Seed

Apply every SQL file in `db/migrations/` in numeric order first, then with a server-side `DATABASE_URL`:

```bash
npm run db:seed
```

The seed creates identity rows and revision 1 for:

- Englotti English / A1 / Unit 1
- U1-L01, U1-L02, U1-L03
- all current character identities
- the default teaching policy

The seed deliberately does not overwrite an identity that already has a published revision.

## Learner-data schema status

The migrations also create the intended relational tables for:

- learner profiles
- lesson progress
- version-pinned lesson sessions
- scene results
- learning observations
- per-character relationship memories

Learner-owned rows use foreign keys back to `learner_profiles`, with cascade deletion so profile removal does not leave orphaned progress, session or memory rows.

These tables are schema-ready but the current app still stores profile, progress and memory locally. Remote learner writes should be connected together with authentication rather than inventing anonymous production identities in this milestone.

A future authenticated `lesson_sessions` row must pin:

- lesson revision ID
- character revision ID
- teaching-policy revision ID

so historical sessions remain interpretable after authoring changes.

## Auth

Authentication is intentionally separate from the learner profile. Neon Auth can provide account/session identity; Englotti-owned learner data references that stable auth user ID. Auth provisioning and login UI are a follow-up milestone.

## Activation checklist

1. choose/create the Neon project
2. apply every migration under `db/migrations/` in numeric order
3. seed revision 1 content
4. configure Cloudflare secret `DATABASE_URL`
5. verify `/api/content/bundle` and `/api/content/character` return `source: neon`
6. run a structured live lesson and confirm the compact log says `Content source: neon`
7. start Free Speak and confirm the character config source is `neon`
8. only then begin building the Studio draft/edit/publish UI

## Validation scope

Current CI validates TypeScript, including TypeScript database seed scripts, and the production Vite build. Browser Visual QA validates the product shell using the local fallback when CI has no database secret.

Neither CI nor browser QA proves physical-device microphone/audio behavior, and they do not validate a real Neon connection until the deployment secret is configured.
