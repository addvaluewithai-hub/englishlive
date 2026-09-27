# Englotti — Team Handoff

This document is the operational starting point for the next engineering team.

## Stable baseline

- Repository: `addvaluewithai-hub/englishlive`
- Default branch: `main`
- Baseline integration commit: `4b304851723a465ae866aa1acf15c2151b601a7a`
- Integration PR: `#20 — Englotti: stabilize current product baseline on main`
- CI and Visual QA were green before the integration merge; the post-merge `main` CI also passed.
- The earlier stacked PRs are historical only. Do not merge them independently.

From this point forward, branch new work from `main`.

## What the product is today

Englotti is an Arabic-first, mobile-first English speaking course delivered by live AI teachers.

The primary learner journey is:

```text
Landing
→ Sign up / Sign in
→ Onboarding
→ Home
→ Learn
→ Level journey
→ Live lesson
→ Completion / Progress
```

Free Speak is a separate path and does not complete course lessons.

Production content currently contains:

- one active A1 course path;
- A1 Unit 1;
- the first 3 published lessons;
- 12 selectable characters;
- one published global teaching policy.

The course catalog, lesson content, character behavior and teaching policy are read from Neon. Do not reintroduce hard-coded course content as the primary source of truth.

## Core stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- mobile-first responsive web UI
- Capacitor configuration exists for iOS / Android packaging

### Hosting / APIs

- Cloudflare Pages serves the web app.
- Cloudflare Pages Functions are the server/API boundary.
- The browser must never connect to Postgres with a privileged connection string.

### Data / auth

- Neon Postgres is the durable product database.
- Neon Auth is the learner identity authority.
- Email/password and Google sign-in are supported.
- Learner profile, progress, lesson sessions and scene results are cloud-backed.

### Live AI

- Gemini Live provides bidirectional voice.
- The client receives only short-lived/ephemeral live-session credentials.
- `GEMINI_API_KEY` stays server-side.
- The application owns curriculum order and scene completion; the model teaches inside the current authored scene.

## Important runtime boundaries

1. **The app owns progression.** Gemini does not choose the next lesson or silently skip authored scenes.
2. **Published content is versioned.** Lesson, character and teaching-policy sessions pin exact published revision ids.
3. **Published revisions are immutable.** Create a new revision instead of editing published rows.
4. **Studio is an authoring UI, not a direct DB console.** Keep server-side admin authorization intact.
5. **Free Speak does not mutate course completion.**
6. **Raw secrets never enter `VITE_*`.**
7. **Local storage is cache / resilience, not learner identity truth.**

## Englotti Studio

Routes:

- `/studio` — JSON authoring for Lessons, Characters and Teaching Policy.
- `/studio/curriculum` — create/archive/restore Levels, Units and Lessons.

Authoring flow:

```text
Create/Edit draft
→ Preview
→ Publish
→ parent published_revision_id moves to the new revision
→ old published revision remains immutable
```

The JSON-first workflow is intentional: content is expected to be authored/reviewed with AI assistance, not manually entered through dozens of form fields.

For a new Lesson created from Curriculum, Studio creates an initial draft skeleton. It does not appear to learners until a revision is published.

Archive is used instead of destructive deletion for curriculum identities that may already be referenced by sessions/progress.

## Database

Migrations live in:

```text
db/migrations/
```

Current foundation includes relational identities for course hierarchy plus JSONB revision payloads for authored content.

Key product tables include:

```text
courses
course_levels
course_units
lessons
lesson_revisions
characters
character_revisions
teaching_policies
teaching_policy_revisions
learner_profiles
lesson_progress
lesson_sessions
scene_results
learning_observations
relationship_memories
```

Production has immutability triggers protecting published lesson/character/policy revisions.

Do not modify production schema manually without adding a migration to the repository.

The existing seed command is:

```sh
npm run db:seed
```

It is intended for the authored foundation and must be run with the correct server-side `DATABASE_URL`. Do not place a real connection string in git or frontend environment variables.

## Environment variables

See `.env.example` for the canonical list.

Client-safe configuration:

```text
VITE_API_BASE_URL
VITE_NEON_AUTH_URL
```

Server-only configuration:

```text
GEMINI_API_KEY
DATABASE_URL
NEON_AUTH_JWKS_URL
STUDIO_ADMIN_EMAILS
STUDIO_ADMIN_USER_IDS
```

`DATABASE_URL` is required by the Cloudflare APIs that read/write Neon. Studio is denied by default unless an admin allowlist is configured.

## API areas

The important server boundaries are under `functions/api/`.

The current application uses APIs for:

- published course/catalog content;
- lesson/character/policy bundles;
- authenticated learner profile and progress;
- version-pinned lesson session writes;
- Studio authoring and curriculum operations;
- Gemini Live ephemeral session setup.

Always authenticate privileged learner/Studio actions server-side; do not trust a user id sent by the browser without validating the Neon Auth token.

## Character system

The application has 12 current characters. Published character JSON in Neon owns learner-editable/authorable behavior such as:

- display name;
- tagline / description;
- persona prompt;
- teaching style prompt;
- voice name where configured;
- accent/theme metadata.

The local character registry remains responsible for renderer implementation details and safe fallback behavior. Do not duplicate published display/persona data back into the local registry as a second source of truth.

## Current learner UI

Current important routes include:

```text
/
/auth/sign-in
/auth/sign-up
/onboarding
/home
/learn
/learn/level/:levelId
/scene-lesson/:lessonId
/lesson-complete/:lessonId
/speak
/speak/:modeId
/progress
/characters
/account
/studio
/studio/curriculum
```

`/learn/unit/:unitId` remains a compatibility route; the intended learner experience is the long Level journey page containing the Units and Lessons.

## Development

Node 22.18+ is required.

```sh
cp .env.example .env.local
npm install
npm run dev
```

Validation before opening/merging a PR:

```sh
npm run check
```

Useful commands:

```sh
npm run build
npm run preview
npm run cf:dev
npm run db:seed
npm run cap:sync
```

There is also automated Playwright screenshot QA in GitHub Actions. Treat screenshot QA as regression protection, not proof that live microphone/audio behavior works on a physical phone.

## Recommended branch / release workflow

The old long-lived stacked-PR phase is over.

Use this workflow now:

```text
main
→ short feature branch
→ PR into main
→ CI + Visual QA
→ review / smoke test
→ merge
→ verify production deployment
```

Do not create a new chain of 10+ dependent feature branches.

For curriculum production, prefer small batches (for example one Unit or a small lesson set) so content changes remain reviewable.

## Production readiness items the next team should keep visible

The current baseline is strong enough to continue product/content work, but these are still release disciplines rather than assumptions:

- perform real-device iOS/Android microphone, audio routing, interruption and safe-area testing before native/public launch;
- run signed-in production smoke tests after meaningful deploys;
- verify Google + email auth after auth configuration/domain changes;
- test Studio publish on a draft before large curriculum batches;
- keep database migrations reversible/forward-safe and review them separately;
- review dependency/security audit findings before public release;
- add monitoring/error reporting and operational alerts if not already handled externally;
- confirm rate limiting / abuse controls for public Gemini usage;
- confirm privacy/legal copy and data-retention policy before broad public acquisition.

## Repository hygiene

At the handoff baseline:

- the current product is consolidated on `main`;
- stale stacked PRs have been closed;
- new work should start from `main`;
- historical milestone docs remain useful context, but the current runtime/code and this handoff doc win when an older milestone document describes a superseded product direction.

### Important GitHub setting

At the baseline merge, the `main` branch was not protected by GitHub branch protection. Before giving a larger team write access, enable protection/rules for `main` so normal contributors cannot accidentally push directly or merge red builds. A sensible minimum is:

- require pull requests;
- require the CI check to pass;
- preferably require the Visual QA check for learner-facing UI changes;
- prevent force pushes and branch deletion;
- keep administrator bypass limited to emergencies.

## Where to read next

- `README.md` — product/repo orientation.
- `docs/ARCHITECTURE.md` — deeper architecture history and boundaries.
- `docs/ADR_001_CHARACTER_RENDERER.md` — character renderer decision.
- `docs/ADR_002_STRUCTURED_COURSE_RUNTIME.md` — structured learning-runtime decision.
- `docs/MILESTONE_NEON_AUTHORING_FOUNDATION.md` — Neon revision/data foundation.
- `docs/MILESTONE_AUTH_CLOUD_PROGRESS.md` — auth + learner cloud state.
- `docs/MILESTONE_NEON_COURSE_CATALOG.md` — Neon-backed catalog.
- `docs/MILESTONE_ENGLOTTI_STUDIO.md` — Studio authoring model.

When old docs conflict with the current implementation, inspect `main` and prefer the current code path.