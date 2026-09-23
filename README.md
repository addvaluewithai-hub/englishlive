# EnglishLive

EnglishLive is a structured English speaking course delivered through live AI characters.

The primary experience is **not** a blank chatbot and it is not a traditional tap-through lesson app with voice bolted on. EnglishLive owns an authored course path — Level → Unit → Lesson → Lesson Beat — while a live character teaches that path naturally through speech, board moments, questions, guided practice and real conversation challenges.

A separate **Free Speak** path is always available for open conversation without changing Course Progress.

## Product thesis

> Structure like a real course. Delivery like a private live teacher.

Initial target: adults around **CEFR B1 → B2** who understand English better than they can comfortably speak it.

The first authored vertical slice is **B1 Unit 1 — Tell stories people can follow**.

## Architecture

The base technical/product architecture is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Accepted ADRs supersede conflicting implementation details in that document.

Current authoritative decisions:

- [`docs/ADR_001_CHARACTER_RENDERER.md`](docs/ADR_001_CHARACTER_RENDERER.md) — renderer-agnostic, SVG-first character runtime.
- [`docs/ADR_002_STRUCTURED_COURSE_RUNTIME.md`](docs/ADR_002_STRUCTURED_COURSE_RUNTIME.md) — structured Course → Level → Unit → Lesson → Beat is the primary learning journey; Free Speak is separate.

The most important boundaries are:

- **Renderer-agnostic, SVG-first character layer** — characters own visual identity/performance, never curriculum state. Rive remains an optional future renderer behind the same contract.
- **Gemini Live transport** — low-latency bidirectional audio, interruption and tool calling behind an adapter.
- **Course Lesson Runtime** — the application, not the model, owns Lesson order, current Beat, authored board, semantic evidence and completion.
- **Conversation Tutor Runtime** — remains available for challenge/assessment/legacy mission flows, but is no longer the primary product navigation model.
- **Stage Director** — the character is the visual hero by default; authored teaching boards appear only when useful and are synchronized with audible speech.
- **Memory is product state** — learner profile, learning/course progress and relationship memory are explicit application data, not accidental model context.
- **Free Speak is isolated from Course Progress** — open conversation may use the selected character and learner-approved relationship memory, but it cannot complete Lessons.
- **Web-first + Capacitor** — one React application ships to web, iOS and Android; native escape hatches stay behind platform interfaces.

## Current learning experience

### Learn

```text
B1
└── Unit 1 — Tell stories people can follow
    ├── Lesson 1 — Set the scene
    ├── Lesson 2 — Put events in order
    ├── Lesson 3 — Explain why it happened
    ├── Lesson 4 — React and add useful detail
    ├── Lesson 5 — Handle follow-up questions
    └── Lesson 6 — Live story challenge
```

A Lesson can combine:

- concise teacher-led explanation;
- an authored board moment;
- a spoken question or guided practice;
- semantic assessment of the learner's live answer;
- a short conversation task;
- a recap.

Teacher-only Beats advance only after the audible teaching turn completes. Evidence Beats advance only through application-owned semantic assessment. Gemini never chooses or skips curriculum steps itself.

### Free Speak

Initial modes:

- Just chat
- Work conversation
- Travel & everyday situations
- Interview practice

Free Speak reuses the live voice and character stack, but it does **not** instantiate the Course Lesson Runtime and never writes Course Progress.

## Progress semantics

EnglishLive deliberately separates:

1. **Course completion** — deterministic product state such as `4/6 lessons completed`.
2. **Speaking proficiency evidence** — broader repeated evidence across fresh contexts.

Completing a Lesson or Unit does not automatically become a CEFR mastery claim or numeric fluency score.

## Development

Requires Node 22.18+.

```sh
cp .env.example .env.local
npm install
npm run dev
```

Useful commands:

```sh
npm run check
npm run cf:dev
npm run cap:add:ios
npm run cap:add:android
npm run cap:sync
```

Web deployments may use same-origin `/api`. Native builds must set `VITE_API_BASE_URL` to the public HTTPS API origin. Never place provider secrets in `VITE_*` values.

Milestone implementation notes:

- [`docs/MILESTONE_01_FOUNDATION.md`](docs/MILESTONE_01_FOUNDATION.md)
- [`docs/MILESTONE_02_CHARACTER_RUNTIME.md`](docs/MILESTONE_02_CHARACTER_RUNTIME.md)
- [`docs/MILESTONE_03_LIVE_VOICE.md`](docs/MILESTONE_03_LIVE_VOICE.md)
- [`docs/MILESTONE_04_CHARACTER_PERFORMANCE.md`](docs/MILESTONE_04_CHARACTER_PERFORMANCE.md)
- [`docs/MILESTONE_04_5_PRODUCT_EXPERIENCE.md`](docs/MILESTONE_04_5_PRODUCT_EXPERIENCE.md)
- [`docs/MILESTONE_05_CONVERSATION_TUTOR_RUNTIME.md`](docs/MILESTONE_05_CONVERSATION_TUTOR_RUNTIME.md)
- [`docs/MILESTONE_06_STAGE_DIRECTOR_BOARD.md`](docs/MILESTONE_06_STAGE_DIRECTOR_BOARD.md)
- [`docs/MILESTONE_07_FIRST_B1_MISSION.md`](docs/MILESTONE_07_FIRST_B1_MISSION.md)
- [`docs/MILESTONE_08_MEMORY_LEARNER_MODEL.md`](docs/MILESTONE_08_MEMORY_LEARNER_MODEL.md)
- [`docs/MILESTONE_09_MVP_CURRICULUM_PRODUCT_SHELL.md`](docs/MILESTONE_09_MVP_CURRICULUM_PRODUCT_SHELL.md)
- [`docs/MILESTONE_09_5_STRUCTURED_COURSE_RUNTIME.md`](docs/MILESTONE_09_5_STRUCTURED_COURSE_RUNTIME.md)

## Reference repositories

EnglishLive owns its runtime contracts. Existing repositories are references/upstreams, not authorities that may leak their old product architecture into this app.

- `addvaluewithai-hub/pixilive`
  - The initial SVG human runtime is extracted from `feat/character-engine` at pinned commit `d1f0b1ba4c35867878d47b297bffb655f6e84d5c`.
  - Rive experiments remain useful reference material, but EnglishLive does not require Rive for every character.
- `addvaluewithai-hub/learn`
  - Reference for Gemini Live lifecycle, interruption, output gating, authoritative Lesson state and board/presentation patterns.
  - EnglishLive reuses the architectural principle that the app owns progression while the model teaches naturally inside current state; it does not clone Learn's classroom product.
- `addvaluewithai-hub/english-course`
  - Curriculum research/reference only: CEFR progression, capability maps and approved level exit profiles.
  - Do **not** migrate its old lesson delivery model into EnglishLive.

## Current MVP loop

```text
Onboarding
  → B1 Unit 1
  → authored live Lesson
  → spoken evidence + board support
  → Lesson Review
  → saved Course Progress
  → next Lesson
```

At any point the learner can leave the course path for:

```text
Free Speak
  → open live conversation
  → optional learner-approved relationship continuity
  → no Course Progress mutation
```

M9.5 intentionally proves one complete Unit before authoring dozens of Lessons. The next release gate is real-device validation and mobile hardening, not pretending that one Unit is a complete B1 syllabus.
