# Milestone 4.5 — Product Experience & Design System

Status: implementation in progress on `feat/m4-5-product-experience`.

## Goal

Replace the engineering/prototype UI with a premium, character-led product experience before native-device validation and before the curriculum runtime expands the surface area.

## Product direction

EnglishLive is not presented as an “AI app.” The visible promise is simple: speak English with a person-like conversation partner until speaking feels normal.

Visual direction: **warm editorial, calm, premium, character-led**.

The permanent rules live in `/DESIGN.md`.

## Delivered in this milestone

### Public landing

- single conversation-first promise;
- character art from the actual runtime, not stock imagery;
- restrained explanation of who the product is for;
- no fabricated social proof;
- direct onboarding CTA.

### Onboarding

Four short decisions:

1. optional first name;
2. one or two speaking goals;
3. self-described speaking comfort;
4. preferred conversation partner.

Profile data is stored locally for the prototype and is used by the first live prompt. Microphone permission is intentionally deferred until the learner presses Start conversation.

### Personalized home

- next conversation is the dominant object;
- selected partner appears alongside it;
- goal-specific warm-up copy;
- capability-oriented path language instead of chapter/module UI;
- no fake progress or scores.

### Partner selection

- personality-first cards;
- renderer/architecture terminology removed from learner-facing copy;
- partner preference persists into the local learner profile.

### Live session redesign

- character remains the hero;
- live status + mic feedback + start/end action are a quiet dock;
- transcripts are secondary;
- implementation/performance state moved behind optional session details;
- onboarding goal + comfort context feeds the real Gemini system prompt;
- first-conversation greeting differs from normal sessions.

## Design constraints

- no decorative purple/blue AI palette;
- no neon/glowing-orb visual language;
- no default glassmorphism;
- no decorative gradients;
- 44px minimum interaction targets;
- keyboard focus retained;
- reduced-motion respected;
- mobile layouts preserve hierarchy instead of shrinking desktop cards.

## Intentionally not implemented here

- learner memory across sessions beyond the local onboarding profile;
- skill/mastery scoring;
- curriculum mission state;
- post-session assessment or feedback claims;
- authentication/subscription;
- native-device audio validation.

Those belong to later milestones and must not be faked in the interface.

## Acceptance

Engineering:

1. `npm run check` passes;
2. live voice/performance wiring from M3/M4 remains intact;
3. landing, onboarding, home, partners, and session routes build successfully;
4. onboarding selections persist locally and affect the live prompt;
5. no microphone permission is requested during onboarding itself.

Visual/manual:

1. check desktop at narrow and wide widths;
2. check mobile browser layout;
3. verify all primary controls are comfortably tappable;
4. verify character art is not clipped in landing/home/partner/session contexts;
5. verify session controls remain reachable with mobile safe areas;
6. verify contrast and focus states by keyboard;
7. verify reduced-motion mode does not depend on animation for comprehension.

## Next

Milestone 5 remains the real-device checkpoint: iPhone + Android audio, WebSocket, interruption, Bluetooth/headphones, foreground/background behavior, safe areas, and the visual performance of the SVG character under real playback.
