# Scene Lesson Pilot — A1 Unit 1 Lessons 1–3

Status: engineering pilot on `feat/scene-runtime-a1-u1-l1`.

## Curriculum authority

This pilot consumes reviewed authoring briefs from `addvaluewithai-hub/english-course` branch `curriculum/level-source-of-truth-v1`.

### U1-L01 — Hello. I'm …
- performance: greet, exchange names, handle basic wellbeing/politeness
- core: `Hello/Hi`, `Good morning`, `I'm…`, `My name is…`, `What's your name?`, `How are you?`, simple wellbeing answers, `Thank you/Thanks`
- boundary: minimum first-/second-person `be`; no later reaction/news language
- evidence: fresh identity prompt, no complete script

### U1-L02 — How old are you?
- performance: give and understand age and basic functional numbers
- core: number patterns, `How old are you?`, `X years old`
- boundary: no large-number detour; no forced personal age disclosure
- evidence: fresh age/number prompts and a new profile exchange

### U1-L03 — Where are you from?
- performance: ask, say and understand origin and residence
- core: `Where are you from?`, `I'm from…`, `I live in…`, `come from…`
- boundary: origin and current residence stay distinct; no geography vocabulary dump
- evidence: fresh person/location context

EnglishLive is the delivery engine. It does not invent new required curriculum scope for these lessons.

## Scene architecture

Lessons are not hardcoded dialogues and they are not open-ended AI lesson plans. Each is an authored sequence of scene contracts.

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
- `finish_scene_lesson` — final completion gate after all scenes are met

The AI must stay in the current scene until the learner demonstrates every required criterion. It may vary phrasing and respond naturally, but it may not choose lesson order, add curriculum, mutate the board, or skip evidence.

The client checks that learner microphone/transcript evidence exists somewhere in the current scene before accepting scene completion. Evidence is cleared only when the scene advances, so a multi-turn repair loop can accumulate genuine scene evidence. This is only a necessary anti-fabrication guard; it is not pronunciation scoring or semantic VAD truth.

## Delivery shape

### Lesson 1
1. greet + introduce yourself
2. ask the other person's name
3. handle `How are you?` politely
4. guided first-meeting conversation
5. fresh first-contact transfer

### Lesson 2
1. build useful age-sized number patterns
2. ask `How old are you?`
3. give a real or invented age
4. guided two-way age/profile exchange
5. fresh profile exchange with new number evidence

### Lesson 3
1. ask/say origin with `Where are you from?` / `I'm from…`
2. ask/say current residence with `Where do you live?` / `I live in…`
3. distinguish origin from current residence
4. guided location-profile conversation
5. fresh new-person origin/residence exchange

## A1 delivery rules

- Explanations are mostly concise Egyptian Arabic.
- Target phrases, examples and roleplay remain English.
- Teach one small thing, then make the learner use it immediately.
- Use the board as visual support, not as a transcript.
- Corrections are selective and tied to the current scene.
- Support escalates from a functional Arabic cue → board cue → partial frame → one model + fresh retry.
- Final fresh-transfer scenes remove the board and complete model.
- Private profile facts may pace support but must never satisfy scene evidence for the learner.

## Compact copy log

The Scene Lesson screen exposes `Copy log` for manual live review. The copied text intentionally contains only:
- AI transcript
- learner transcript
- scene-runtime tool calls (`get_scene_state`, `complete_scene`, `finish_scene_lesson`)
- concise tool outcomes, criteria and evidence summaries

It intentionally excludes audio payloads, microphone levels, performance cues, WebSocket traffic, token/session metadata and other transport noise.

## Scope

This branch pilots the first three A1 lessons only. It does not migrate the existing B1 M9.5 course, persist pilot progress, author A1 U1-L04 onward, change Free Speak, or perform M10 mobile hardening.

## Engineering acceptance

- TypeScript and production build pass.
- Scene transitions are tool-gated.
- Only current-scene content is exposed to the model.
- Every lesson alternates bounded teaching with immediate spoken use.
- Guided scenes combine targets without a fixed dialogue script.
- Final scenes use a fresh context with reduced support and no authored board.
- `Copy log` produces a compact dialogue + tool trace suitable for pedagogical review.

## Manual/live acceptance still required

Real Gemini Live sessions must still verify:
- Arabic explanations are short and natural rather than lecture-like
- English/Arabic code-switching sounds good in the selected voice
- the model does not call `complete_scene` too early
- repair loops are patient but do not get stuck
- boards help rather than distract
- number comprehension in Lesson 2 is reliable enough for the live model
- origin/residence contrast in Lesson 3 is clear to a real A1 learner
- fresh transfer feels like a conversation, not a checklist
- copied logs are concise and ordered enough for review
- interruption, audio timing and A1 pacing work on real devices
