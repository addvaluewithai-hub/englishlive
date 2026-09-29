# Otti / Octo engine sync

Upstream source of truth for this sync:

- Repository: `addvaluewithai-hub/pixilive`
- Commit: `ee91c77f75687c7543a3ae278bab49a20cd80f64`
- Upstream preset: `octo`
- Upstream `speechMotionScale`: `0.5`

## What is synced verbatim

The Otti-specific drawing and motion engine are copied from that exact commit:

- `public/character-engine/octopus.js`
- `public/character-engine/octopus-motion.js`

The other bundled character-engine files were compared by Git blob SHA before this sync. `geometry.js`, `engine.js`, `flight.js`, `motion.js`, `human-art.js`, `human-motion.js`, `mascot-art.js`, `mascot-motion.js`, and `master.svg` already matched the upstream commit, so they were intentionally left untouched.

## Englotti adapter rules

`src/character/otti/OttiRenderer.ts` stays the app-facing adapter. It now forwards semantic `idle`, `listening`, `thinking`, and `speaking` modes to the dedicated Octo rig and keeps `speechMotionScale` at `0.5` by default.

Mouth motion still comes from Englotti's actual PCM playback path (`PcmPlaybackQueue` -> `VisemeAnalyzer` -> `CharacterPerformanceController` -> `CharacterHost` -> `OttiRenderer`). The rig therefore receives real playback-derived `viseme`, `energy`, `open`, and, when available, `width` / `round` frames. Speaking mode by itself does not manufacture mouth motion.

Interrupt/unmount paths continue to call `cancelActions`, clear the external mouth frame, and destroy the rig so the soft-body motion can settle or dispose without a second animation loop fighting it.

## Intentionally not copied

We did **not** replace Englotti's live Gemini transport, microphone stack, playback queue, or session controller with PixiLive's equivalents. Englotti already has product-specific lesson gates, microphone turn-taking, interruption semantics, Cloudflare token flow, scene tools, progress persistence, and Free Speak behavior. Replacing those wholesale would couple an Otti visual upgrade to unrelated product logic and create unnecessary regression risk.

Likewise, we did not add a second speech/gesture scheduler on top of Otti. Deliberate semantic gestures still flow through Englotti's existing `perform_character` tool, while ordinary speech motion is owned by the new Octo rig and driven by actual playback audio.

## Future upstream sync checklist

1. Pin an exact PixiLive commit, never a moving branch head.
2. Compare Git blob SHAs first; copy only files that actually changed.
3. Preserve script order in `index.html`: geometry -> engine -> flight -> motion -> human art/motion -> octopus art/motion -> mascot art/motion.
4. Keep `speechMotionScale: 0.5` unless the upstream Octo preset changes it deliberately.
5. Verify `setMode` is forwarded for all four semantic modes.
6. Verify mouth frames are sourced from scheduled playback audio, not from a `speaking` boolean.
7. Verify interrupt and unmount call cancellation / cleanup before destroying the rig.
8. Run CI and Visual QA, then manually smoke-test Otti in both a structured lesson and Free Speak before merging.
