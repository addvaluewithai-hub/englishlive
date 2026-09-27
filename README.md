# Englotti

Englotti is an Arabic-first, mobile-first English speaking course taught through live AI characters.

The repository name is still `englishlive`, but the learner-facing product is **Englotti**.

The product combines a structured authored course with real-time voice teaching:

```text
Course → Level → Unit → Lesson → Scene
```

The application owns curriculum order, progression and completion. Gemini Live teaches naturally inside the current authored scene; it does not decide what lesson comes next.

A separate **Free Speak** path is available for open conversation and does not complete course lessons.

## Current product baseline

The current stable implementation is on `main`.

Production content currently includes:

- A1 as the active learner level;
- Unit 1;
- the first 3 published lessons;
- 12 selectable teachers/characters;
- a published global teaching policy;
- Neon-backed learner accounts, profile, progress and lesson sessions.

Course navigation and published lesson content are read from Neon. The old TypeScript course data exists only as limited fallback/legacy support and must not become the primary source of truth again.

## Learner journey

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

The intended Learn experience is:

- `/learn` — level overview;
- `/learn/level/:levelId` — one long Duolingo-style journey containing the Units and Lessons for the level;
- `/learn/unit/:unitId` — compatibility redirect/legacy route rather than the primary UX.

Free Speak lives under `/speak` and remains isolated from course completion.

## Englotti Studio

Authenticated admins can author production content through:

- `/studio` — JSON-first Lesson / Character / Teaching Policy authoring;
- `/studio/curriculum` — create/archive/restore Levels, Units and Lessons.

The authoring model is deliberately revision-based:

```text
Draft
→ Preview
→ Publish
→ published pointer moves to the new immutable revision
```

Published revisions are never edited in place. Existing learner sessions remain pinned to the exact lesson, character and teaching-policy revisions they started with.

JSON-first authoring is intentional because curriculum/content editing is expected to happen with AI assistance.

## Architecture

The main boundaries are:

- **React + TypeScript + Vite** — learner and Studio web application.
- **Cloudflare Pages + Functions** — hosting and trusted server/API boundary.
- **Neon Postgres** — course identities, authored revisions, learner profile/progress/session state.
- **Neon Auth** — email/password and Google account identity.
- **Gemini Live** — low-latency bidirectional voice behind the application runtime.
- **Renderer-neutral character layer** — current SVG/PixiLive-derived renderers stay separate from curriculum state.
- **Capacitor** — shared web code can be packaged for iOS/Android; native release still requires real-device validation.

More detail:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/ADR_001_CHARACTER_RENDERER.md`](docs/ADR_001_CHARACTER_RENDERER.md)
- [`docs/ADR_002_STRUCTURED_COURSE_RUNTIME.md`](docs/ADR_002_STRUCTURED_COURSE_RUNTIME.md)
- [`docs/TEAM_HANDOFF.md`](docs/TEAM_HANDOFF.md)

When an older milestone document conflicts with current code, current `main` wins.

## Data/source-of-truth rules

### Neon owns

- Course → Level → Unit → Lesson identities and ordering.
- Published Lesson JSON revisions.
- Published Character JSON revisions.
- Published Teaching Policy revisions.
- Learner profiles.
- Lesson progress.
- Version-pinned lesson sessions and scene results.

### The frontend owns

- presentation/layout;
- renderer implementation details;
- local cache/resilience;
- application-owned runtime state for the current live scene.

The browser must never receive a privileged `DATABASE_URL` or provider API key.

## Development

Requires Node 22.18+.

```sh
cp .env.example .env.local
npm install
npm run dev
```

Primary validation:

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

## Environment variables

The canonical template is [`.env.example`](.env.example).

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

Never put real secrets into `VITE_*`, source control, browser bundles or screenshots/logs.

## Database

Migrations live under:

```text
db/migrations/
```

The production authoring foundation uses relational identities plus JSONB revisions. Published lesson, character and teaching-policy revisions are protected by immutability triggers.

Do not manually mutate published revisions. Create a new draft/revision and publish it.

## CI / visual QA

Pull requests run TypeScript/Vite validation. The repository also contains Playwright-based screenshot QA for important learner flows.

Automated browser QA is regression protection; it is **not** a substitute for physical-device validation of:

- microphone permissions;
- speaker/audio routes;
- interruption latency;
- background/foreground lifecycle;
- native safe areas.

## Branch workflow

The earlier stacked-feature development phase is finished. New work should use short branches from `main`:

```text
main
→ feature branch
→ PR to main
→ CI + relevant Visual QA
→ review / smoke test
→ merge
→ verify production deploy
```

Do not rebuild a long chain of dependent PRs.

Before handing repository write access to a larger team, protect `main` in GitHub and require PR/checks rather than direct pushes.

## Handoff

Start with [`docs/TEAM_HANDOFF.md`](docs/TEAM_HANDOFF.md). It documents the current runtime, deployment boundaries, authoring flow, database rules, environment variables, release discipline and known production-readiness items.
