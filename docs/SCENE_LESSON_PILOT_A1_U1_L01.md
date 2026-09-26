# Scene Lesson Pilot — A1 U1-L01

Status: engineering pilot on `feat/scene-runtime-a1-u1-l1`.

## Curriculum authority

This pilot consumes the reviewed authoring brief from `addvaluewithai-hub/english-course` branch `curriculum/level-source-of-truth-v1`:

- source lesson: `U1-L01 — Hello. I'm …`
- primary performance: greet, exchange names, handle basic wellbeing/politeness
- core language: `Hello/Hi`, `Good morning`, `I'm…`, `My name is…`, `What's your name?`, `How are you?`, simple wellbeing answers, `Thank you/Thanks`
- boundary: minimum first-/second-person `be`; no later reaction/news language
- evidence: fresh identity prompt, no complete script

EnglishLive is the delivery engine. It does not invent new required curriculum scope for this lesson.

## Scene architecture

The lesson is not a hardcoded dialogue and it is not an open-ended AI lesson plan. It is an authored sequence of scene contracts:

1. greet + introduce yourself
2. ask the other person's name
3. handle `How are you?` politely
4. guided first-meeting conversation
5. fresh first-contact transfer

Each scene contains:

- a bounded learner goal
- specific points to explain mostly in Egyptian Arabic
- authorized English targets
- an application-owned board when useful
- one interaction kind
- ordered teacher moves
- explicit success criteria
- an ordered support ladder
- constraints that prevent curriculum expansion

Future scenes are hidden from Gemini until the application advances them.

## Runtime contract

`SceneLessonRuntime` exposes three blocking tools:

- `get_scene_state` — returns only the authoritative current scene
- `complete_scene` — the only scene transition; rejected for stale scene ids, invalid response kinds, missing required criteria, or unsupported audio/transcript evidence
- `finish_scene_lesson` — the final completion gate after all scenes are met

The AI must stay in the current scene until the learner demonstrates every required criterion. It may vary phrasing and respond naturally, but it may not choose lesson order, add curriculum, mutate the board, or skip evidence.

The client separately checks that learner microphone activity exists before accepting `live_audio` evidence. This is only a necessary guard against fabricated evidence; it is not pronunciation scoring or semantic VAD truth.

## A1 delivery rules

- Explanations are mostly concise Egyptian Arabic.
- Target phrases, examples and roleplay remain English.
- Teach one small thing, then make the learner use it immediately.
- Use the board as visual support, not as a transcript.
- Corrections are selective and tied to the current scene.
- Support escalates from a functional Arabic cue → board cue → partial frame → one model + fresh retry.
- The final scene removes the board and complete model so evidence is fresher than guided practice.
- Profile memory must not supply the learner's name during name evidence.

## Scope

This branch intentionally pilots one lesson only. It does not migrate the existing B1 M9.5 course, author later A1 lessons, change Free Speak, or perform M10 mobile hardening.

## Engineering acceptance

- TypeScript and production build pass.
- Scene transitions are tool-gated.
- Only current-scene content is exposed to the model.
- The first three scenes teach and immediately elicit use.
- The guided scene integrates the lesson language without a fixed dialogue script.
- The final scene is a new context with reduced support and no authored board.

## Manual/live acceptance still required

A real Gemini Live session must still verify:

- Arabic explanations are short and natural rather than lecture-like
- English/Arabic code-switching sounds good in the selected voice
- the model does not call `complete_scene` too early
- repair loops are patient but do not get stuck
- the persistent board helps instead of distracting
- the fresh transfer feels like a conversation, not a checklist
- interruption, audio timing and A1 pacing work on real devices
