# ADR 001 — Character renderer strategy

Status: **accepted**  
Date: 2026-09-23

This ADR supersedes any renderer-specific wording in `docs/ARCHITECTURE.md` that says EnglishLive is Rive-first.

## Decision

EnglishLive is **renderer-agnostic and SVG-first for the initial product**.

The application depends only on the `CharacterRenderer` contract. Curriculum, Gemini Live, session state, memory, and Stage Director code must not know whether a character is SVG, Rive, HTML, Pixi, or a future renderer.

The first production implementation uses the SVG human engine extracted from `addvaluewithai-hub/pixilive` `feat/character-engine`, pinned to source commit:

`d1f0b1ba4c35867878d47b297bffb655f6e84d5c`

Only the minimum upstream runtime required for the initial adult characters is vendored:

- `geometry.js`
- `human-art.js`
- `human-motion.js`

EnglishLive owns the adapter around those files.

## Why SVG first

The current SVG engine already provides the capabilities the MVP needs:

- data-driven adult characters;
- continuous idle motion;
- multiple facial expressions;
- semantic gestures;
- 12 mouth/viseme poses;
- speech-energy body motion;
- cancellation and disposal;
- reduced-motion support;
- one shared rig for multiple characters.

That makes character expansion cheaper than requiring a custom Rive state machine for every new character.

## Why Rive remains supported conceptually

Rive is still a valid future renderer for characters that need highly authored, character-specific animation or richer art-direction than the shared SVG rig can provide.

A future `RiveRenderer` may be added behind the same `CharacterRenderer` interface. Doing so must not require curriculum, Live transport, or product-shell changes.

## Initial character set

Milestone 2 exposes four adult SVG characters already supported by the upstream human rig:

- Hakim
- Reem
- Marwan
- Amal

Additional adult characters should be added through the same character definition/renderer contract. Animal and mascot characters can be added later if product design calls for them.

## Acceptance boundary

Automated build/type checks validate integration contracts only. They do **not** prove animation quality.

Before treating the renderer as production-validated, EnglishLive must visually verify the character stage on real desktop and mobile devices, including:

- idle motion;
- expressions;
- gestures;
- mouth/viseme changes;
- resize/orientation behavior;
- reduced motion;
- long-running disposal/remount behavior.

Live audio synchronization is a Milestone 3/4 concern.
