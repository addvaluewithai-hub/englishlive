# Milestone — Neon Auth + Cloud Learner State

This milestone turns Englotti from a device-local learner prototype into an account-backed product while preserving local storage as a cache for fast UI and temporary resilience.

## Identity

- Neon Auth (`better_auth`) is the account authority.
- Email/password and Google sign-in are exposed in the app.
- App routes are protected by authenticated session state.
- New accounts complete onboarding before entering the learner product.
- Returning accounts hydrate their learner profile and progress from Neon before protected screens render.

## Security boundary

The browser talks directly to Neon Auth only for authentication. Learner application data still flows through Cloudflare Pages Functions:

```text
Browser
  ├─ Neon Auth → session/JWT
  └─ Cloudflare /api/me/* → JWT verification → Neon Postgres
```

The application never receives `DATABASE_URL`.

Cloudflare verifies bearer JWTs against the production Neon Auth JWKS before using the privileged Postgres connection.

## Learner profile

`/api/me/profile`

- `GET` loads the current learner profile.
- `PUT` creates or updates first name, learning goals, speaking comfort and selected character.
- The auth user id is used as `learner_profiles.user_id`.

The onboarding UI writes the profile to Neon first and then updates the browser cache.

## Progress and version-pinned sessions

`/api/me/progress` returns lesson progress for the signed-in user.

When a structured lesson starts from a Neon-published bundle, `/api/me/session` creates a `lesson_sessions` row pinned to:

- lesson revision
- character revision
- teaching-policy revision

The same transaction starts/updates `lesson_progress` and increments the attempt count.

Each successful `complete_scene` writes a content-minimized `scene_results` row. Finishing the final scene marks both the session and lesson progress complete.

Raw conversation transcripts are not written to Postgres by this milestone.

## Local storage policy

The existing profile/progress stores remain for immediate UI state, but authenticated cloud state is authoritative:

- after sign-in, cloud profile/progress replace local cache;
- a new account with no cloud profile clears stale device learner state;
- sign-out clears account-specific local cache.

## Current course-content split

Published lesson content, characters and teaching policy already come from Neon through `/api/content/*`.

Course navigation metadata is still the existing TypeScript product catalog. Moving levels/units/lesson availability fully to Neon is the next step after this auth/cloud-state slice is stable.

## End-to-end acceptance target

1. Create an account.
2. Complete onboarding.
3. Start and complete Lesson 1.
4. Sign out or switch browser/device.
5. Sign back in.
6. Confirm profile, selected character, completed lesson, and next lesson are restored from Neon.
7. Confirm `lesson_sessions` records the exact lesson/character/policy revisions used.
