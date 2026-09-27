# Milestone 6 — Stage Director + Board

Status: implemented on `feat/m5-6-tutor-stage-board`; visual/live validation still required.

## Goal

Keep the character as the default visual hero while allowing short teaching moments to use a board without turning EnglishLive into a classroom layout.

## Core rule

**The AI requests semantic support. The client owns presentation.**

Gemini never controls DOM structure, SVG geometry, layout coordinates, or curriculum progression.

## Stage states

The initial stage has two product states:

- `hero` — character is large and owns the stage;
- `board` — support board becomes dominant and the character moves to a secondary position.

More states such as roleplay/review can be added later without changing the tutor runtime.

## StageDirector

`StageDirector` owns presentation timing.

A board request is queued first. It becomes visible only when audible playback begins. At the end of the played turn, the stage returns automatically to hero mode.

On interruption, pending/visible support is cancelled immediately and hero mode is restored.

This keeps visual transitions synchronized with what the learner actually hears rather than with model generation timing.

## present_support tool

`ConversationPresentation` exposes one blocking semantic tool:

`present_support`

Supported visual types in this milestone:

- note;
- compare;
- examples;
- steps.

The tool requires the exact current objective id. Stale objective requests are rejected, and objectives can disable board support entirely.

The board is supplementary teaching support only. Calling it does not advance the mission and cannot create evidence.

## UI behavior

Desktop:

- hero mode keeps the character centered and large;
- board mode gives the board the main surface and reduces the character to a secondary column.

Mobile:

- board remains dominant;
- the character becomes a compact bottom-right presence instead of forcing a two-column desktop layout into the phone.

The design follows `/DESIGN.md`: solid warm editorial surfaces, no neon AI visual language, and reduced-motion support.

## Playback integration

`PcmPlaybackQueue` is the presentation clock:

- `onSpeechStart` → `StageDirector.speechStarted()`;
- played turn completion → `StageDirector.turnPlayed()`;
- Live interruption → `StageDirector.interrupt()`.

Therefore a support visual follows audible speech rather than raw transcript/tool timing.

## Acceptance

Engineering:

1. TypeScript/build passes;
2. `present_support` is available in the same Gemini Live session as tutor tools;
3. stale objective ids cannot show support;
4. board state cannot modify tutor progression;
5. interruption clears pending/visible support;
6. a completed played turn restores hero mode.

Manual/visual:

1. character begins large in hero mode;
2. a model-requested explanation can open a board before the audible explanation;
3. character visibly becomes secondary while the board is active;
4. board disappears after the turn without a learner action;
5. interrupting the explanation immediately restores the conversation stage;
6. layout remains usable on narrow/mobile screens.

## Not included

- curriculum-authored mandatory boards;
- interactive exercises on the board;
- roleplay scene backgrounds;
- post-session review presentation.

Those can be layered onto the same stage contract later.
