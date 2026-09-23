# EnglishLive

EnglishLive is a conversation-first English learning product built around live AI characters.

The product is **not** a traditional lesson app with voice added on top. The default experience is a natural conversation with a persistent character. A hidden curriculum engine chooses what the learner needs to practice, observes evidence from the conversation, and advances the learner without turning the session into a scripted class.

## Product thesis

> You already know some English. EnglishLive gives you a person to actually speak it with every day — and quietly moves your speaking ability forward.

Initial target: adults around **CEFR B1 → B2** who understand English better than they can comfortably speak it.

## Architecture

The base technical/product architecture is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Accepted ADRs supersede conflicting implementation details in that document. The active renderer decision is [`docs/ADR_001_CHARACTER_RENDERER.md`](docs/ADR_001_CHARACTER_RENDERER.md).

The most important boundaries are:

- **Renderer-agnostic, SVG-first character layer** — characters are visual/performance implementations, never owners of curriculum state. Rive remains an optional future renderer behind the same contract.
- **Gemini Live transport** — low-latency bidirectional audio, interruption and tool calling behind an adapter.
- **Conversation Tutor Runtime** — the application, not the model, owns mission state, curriculum progression and assessment evidence.
- **Stage Director** — the character is the visual hero by default; the board appears only when useful, with the character shrinking/moving rather than disappearing.
- **Hidden conversation curriculum** — missions are capability/evidence contracts, not dialogue scripts.
- **Memory is product state** — learner profile, learning memory and relationship memory are explicit application data, not accidental model context.
- **Web-first + Capacitor** — one React application ships to web, iOS and Android; native escape hatches stay behind platform interfaces.

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

## Reference repositories

EnglishLive is a new product and owns its runtime contracts. Existing repositories are references/upstreams, not authorities that may leak their product architecture into this app.

- `addvaluewithai-hub/pixilive`
  - The initial SVG human runtime is extracted from `feat/character-engine` at pinned commit `d1f0b1ba4c35867878d47b297bffb655f6e84d5c`.
  - Rive experiments remain useful reference material, but EnglishLive does not require Rive for every character.
- `addvaluewithai-hub/learn`
  - Reference for Gemini Live lifecycle, interruption, output gating, application-owned lesson state and board/presentation patterns.
- `addvaluewithai-hub/english-course`
  - Curriculum research/reference only: CEFR progression, capability maps and level exit profiles.
  - Do **not** migrate its old lesson delivery model into EnglishLive.

## First complete vertical slice

Build one complete vertical slice before expanding the catalog:

1. choose one of the initial adult characters;
2. start one B1 conversation mission;
3. hold a real interruptible voice conversation;
4. drive lip-sync and natural character performance through the renderer contract;
5. let the Stage Director temporarily reveal a teaching board when needed;
6. collect structured evidence for the mission capability;
7. finish with a short useful review;
8. persist learner + relationship memory;
9. resume naturally in a second session;
10. verify the same flow on web, a real iPhone and a real Android device.

Do not build a large curriculum, payments, streak systems or a large social shell before this slice feels good.
