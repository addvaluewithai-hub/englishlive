# Milestone 02 — Character Runtime

Status: implementation complete on `feat/m2-character-runtime`; visual device validation still required.

## Goal

Replace Milestone 1 character placeholders with a real renderer-neutral character runtime and prove the product can mount, switch, animate, and manually drive adult characters before Gemini Live is introduced.

## Delivered

- renderer-neutral `CharacterRenderer` contract;
- `CharacterHost` React boundary with imperative performance methods;
- SVG human renderer adapter;
- pinned SVG human engine provenance from PixiLive;
- four adult characters: Hakim, Reem, Marwan, Amal;
- real generated portraits on character selection;
- real full-body animated hero character in the session screen;
- expression controls;
- gesture controls;
- local silent viseme/speech-motion preview;
- renderer lifecycle/disposal on character changes;
- reduced-motion behavior inherited from the pinned human rig;
- ADR locking EnglishLive to renderer-agnostic, SVG-first architecture.

## Runtime boundary

Product code calls only:

```ts
CharacterRenderer {
  mount(container)
  unmount()
  setMode(mode)
  setEmotion(emotion, intensity?)
  setGesture(gesture, durationSeconds?)
  setMouth(pose)
  cancel()
}
```

The curriculum and future Live transport do not manipulate SVG nodes.

## Upstream provenance

The initial human engine is pinned from:

`addvaluewithai-hub/pixilive`  
branch at extraction time: `feat/character-engine`  
commit: `d1f0b1ba4c35867878d47b297bffb655f6e84d5c`

Vendored files are intentionally limited to:

- `public/character-engine/geometry.js`
- `public/character-engine/human-art.js`
- `public/character-engine/human-motion.js`

Do not silently replace these files from a moving PixiLive branch. Update deliberately and record the new source revision.

## Manual runtime check

Open:

`/characters`

Choose a character, then on the session screen verify:

1. the selected character is mounted full-body in hero mode;
2. idle motion continues without input;
3. expression buttons visibly change face/head behavior;
4. gesture buttons perform and settle;
5. `Preview speech motion` visibly drives mouth/voice movement;
6. stopping the preview settles the mouth;
7. navigating away and back does not leave duplicate animation loops.

## Not included yet

- Gemini Live connection;
- microphone capture;
- real audio-driven viseme analysis;
- semantic performance tool calls;
- Stage Director board transitions;
- Rive renderer;
- persistence of selected character.

## Exit criteria

Engineering exit:

- TypeScript and production build pass in CI.
- The session screen uses `CharacterHost`, not renderer-specific DOM code.
- Four initial adult characters are selectable and use one shared runtime contract.

Product/visual exit requires human inspection on desktop and real mobile devices. This remains explicitly open until performed.

## PR flow

Milestone 2 is a stacked PR based on `feat/m1-app-foundation`. After Milestone 1 merges, retarget Milestone 2 to `main` before merge. CI on the stacked PR is the engineering gate for this milestone.

## Next milestone

Milestone 3: Live Voice Core.

Connect Gemini Live behind a provider adapter, issue ephemeral credentials server-side, stream mic/audio, support interruption/resumption, and feed playback events toward the character runtime without letting Gemini own character internals.
