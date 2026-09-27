# Milestone 01 — App Foundation

Status: implementation started on `feat/m1-app-foundation`.

## Goal

Create the smallest production-shaped EnglishLive application shell that later milestones can build on without changing platform or deployment boundaries.

## Included

- React + TypeScript + Vite application.
- React Router product shell with Home, Character Select and Session routes.
- Cloudflare Pages/Workers configuration and `/api/health` boundary.
- Capacitor 8 configuration for the same web build to become iOS/Android apps.
- Explicit web/native API-origin contract through `VITE_API_BASE_URL`.
- Platform helper that hides Capacitor checks from product code.
- CI build/type-check workflow.
- Mobile-safe viewport and safe-area-aware shell styling.

## API origin rule

Web builds normally use same-origin `/api/*` and therefore leave `VITE_API_BASE_URL` empty.

Native builds must set `VITE_API_BASE_URL` to the public HTTPS origin that hosts the EnglishLive API. Provider secrets never enter Vite environment variables or the native bundle.

## Local setup

```sh
cp .env.example .env.local
npm install
npm run dev
```

Cloudflare Functions locally:

```sh
npm run cf:dev
```

Generate native projects after dependencies are installed:

```sh
npm run cap:add:ios
npm run cap:add:android
npm run cap:sync
```

Do not hand-edit generated native project files for shared product behavior. Put shared behavior in `src/`; native escape hatches belong behind explicit platform interfaces.

## Acceptance checks

- `npm run check` passes.
- `GET /api/health` returns JSON with `ok: true` under `wrangler pages dev dist`.
- Web routes render without coupling to character/live code.
- Native builds have an explicit API origin and do not assume `/api` resolves inside a WebView.
- Capacitor config points at `dist` and uses the stable app id `com.addvaluewithai.englishlive`.

## Deferred intentionally

- Rive assets and CharacterHost — Milestone 2.
- Gemini Live transport/audio — Milestone 3.
- Native audio plugin decision — Milestone 5 after real-device testing.
- Authentication, persistent user data and payments.
