# B1 U1-L02: Otti teacher + interactive board lab

This is an **opt-in preview** of an authored teaching vertical slice. It does **not**
replace the live Practice screen, the official B1 lesson, or curriculum progress.

## Open

After deploying the branch preview, sign in and open:

`/scene-lesson/b1-u1-l02-keep-conversation-going?teacherLab=1`

Remove `teacherLab=1` to return to the existing full Scene Lesson.
This deliberately reuses the live Otti voice, stage and `complete_scene`
mechanics. It requires Gemini Live and a working microphone; it is **not**
a prerecorded mockup.

## Teaching storyline

A friend joined a photography club, met Lina there, and later kept in
contact after Lina moved away. Every initial teaching explanation and task
instruction is written **verbatim** in `src/lessonScenes/b1/teacherLabScript.ts`.
The app sends one `[READ AUTHORED LINE]` at a time, changes the linked visual
when audible playback begins, and only sends the next line after the last
PCM sample finishes. This follows New Learn's authored narration model;
Live speech is still model-generated, so verify wording fidelity by listening.
The teacher may improvise *briefly only after* a learner attempt, for feedback
or a requested explanation. It must never improvise the primary lesson. The story creates meaningful
reasons for two B1 phrases rather than showing a list of vocabulary cards.

| Scene | Teacher/board | Learner requirement |
| --- | --- | --- |
| Introduction | 3 written lines: club update, reaction examples, follow-up model; boards appear as audio starts | React and ask a relevant spoken follow-up **after instruction** |
| Get to know | Board introduces a relationship developing, then a two-choice contextual check | Correct board selection **and** fresh spoken example |
| Keep in touch | Lina moves but messaging continues; second graded board choice | Correct board selection **and** fresh spoken example |
| Compare | Side-by-side authored relationship meanings | Use each phrase in different spoken situations |
| Fresh transfer | No board; unrelated coworker/course conversation | Sustain multiple spoken turns without prompts giving away target phrases |

The lab is intentionally **partial**. The full B1 U1-L02 lesson additionally
covers `you see`, five planning words, emphasis, turn-holding,
confirmation, invitation and connected-speech listening. Those are for
a second authoring pass, **not** silently deleted from the official lesson.

## Safety and progress semantics

- The content uses a unique `-teacher-board-lab` lesson ID.
- `loadTeachingBundle({ preview: true })` bypasses published lesson loading
  and cloud session creation. `SceneLessonRuntime({ preview: true })`
  suppresses official course completion and cloud progress reporting.
- The preview does not create a resumable scene checkpoint.
- The application grades board choices against an authored answer key;
  the Live model cannot decide what the correct click was.
- A wrong choice offers an authored Arabic retry cue; the learner can
  try again.
- A correct choice gets a silent client-to-agent BOARD_CHECK message,
  **never counted as microphone evidence**. Earlier microphone activity is
  reset, so a *fresh* microphone observation after the correct choice and
  the teacher's pedagogical self-audit are required to complete that scene.
- A stale answer or choice from another scene is rejected.
- The completion mechanism is not a verified English pronunciation or
  semantic assessment. A live speaking acceptance test is required.

## Acceptance walkthrough (real device)

1. Start the lab. Otti reads the authored introduction in 3 short audio
   turns; the reaction and next-move visuals follow the exact teaching line.
   There is no improvised welcome and no unprepared question before the model.
2. In the first phrase scene, confirm the board choice is blocked
   until Otti finishes speaking and your turn begins.
3. Tap a wrong option: the board must show a reason without advancing.
4. Tap the correct option: see success and hear Otti ask for a **new**
   spoken example. Stay on the scene until the learner speaks.
5. Check the same for the second phrase, then verify the comparison.
6. Check the final transfer has no board, no model dialogue, and
   several genuine learner turns. Interrupt halfway through a written line
   and confirm the resume control replays that line rather than skipping it.
7. Verify reloading / leaving the preview does not update the
   official B1 lesson completion, and other Practice PR routes are
   unchanged.
8. Repeat on a 320px-width phone and with interruption/reconnection;
   the board must scroll within its surface without covering the mic.

Run `npm run check`, `npm run test:learn-pilot`,
`npm run test:ui` and `npm run test:practice`. Tests cover
activity order/gates but cannot replace real provider audio/phone QA.

## Next editorial review

Listen for short natural teacher turns, accurate Arabic explanations,
correct use of `get to know` vs `keep in touch`, and a *changed*
spoken context before marking a scene complete. If this succeeds,
extend the same director/board contract to vocabulary and contextual
grammar (not five separate flashcard scenes).
