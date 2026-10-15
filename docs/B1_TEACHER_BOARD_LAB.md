# Teacher-led B1 lesson lab · 4 visual checks + final Speaking

This is an **opt-in Draft PR experiment**; do not merge into published Learn yet. It uses a distinct lesson ID, no official course progress, no Practice code changes.

Open a deployed preview: `/scene-lesson/b1-u1-l02-keep-conversation-going?teacherLab=1`.

## Learning model

- The application owns the authored narration: one `READ:` line and one premium vector board at a time, aligned to actual audible PCM playback, **not** fake timing or model-generated slides.
- Otti reads each line aloud. The student sees a single fixed board in the upper classroom with Otti anchored at its lower-right corner. **No inner board scroll**. On narrow phones the vector scales down.
- Four **multiple-choice comprehension checkpoints** follow the teaching sections: React/Pick/Continue, get to know, keep in touch, compare.
- Questions reveal only after the last spoken lesson line. The microphone is disabled during quiz stages. Options and correct answer IDs are authored in source, not graded by Gemini.
- Student taps once. The application records the option and its correct/incorrect status (an incorrect result is **not** recorded as mastery), highlights the right answer and sends Otti a prewritten correct/wrong explanation to read aloud.
- Only after Otti's feedback audio drains does the application notify the model to call `complete_scene`. Otti initiates the tool call; the runtime enforces ordering but **does not semantically grade free speech** in teaching scenes.
- A wrong quiz answer **does not trap** the student: explain it, retain wrong result, continue. Later review should revisit weak concepts.
- The **fifth and final scene is real unscripted Speaking**, in a changed workplace situation, no MC and no answer-bearing board. Otti controls when the learner has sustained enough meaningful interaction to call `complete_scene`; greetings alone and generic goodbyes should not count.

## Scenes and illustrations

| Step | Exact narrated teaching topic | Full-board authored SVG | Assessment |
| --- | --- | --- | --- |
| 1 | React, pick the detail, ask a connected question | Three illustrated progression cards, plus photography update | Choose the response that continues a conversation |
| 2 | Gradually develop a relationship with `get to know` | A three-point relationship timeline with two characters | Choose the new-relationship sentence |
| 3 | Stay connected despite distance with `keep in touch` | People in separate cities with messaging route | Choose the continuing-contact sentence |
| 4 | Compare first acquaintance vs. ongoing contact | Two large annotated comparison panels | Choose the pair with correct contexts |
| 5 | New work-team update | No board, large reactive Otti | Live multi-turn conversation with teacher judgment |

## Acceptance checks

1. Open the preview in a **real mobile browser**, including at 320px width. Check large board, readable options, no clipped text, no internal board scrollbar and stable footer.
2. Confirm each board changes only when the corresponding narrated audio **actually starts**.
3. Confirm questions stay hidden until Otti finishes the last explanation.
4. Pick a **wrong answer** on each quiz in different test runs; Otti should explain why and clearly give the right answer, then call `complete_scene` once after speaking. The log must preserve `incorrect`, not mastery.
5. Pick a correct option: Otti explains the reason, then advances. No forced spoken retry in a comprehension quiz.
6. In the last scene the microphone opens, no quiz is shown and Otti asks for substantive follow-up. Test vague and incoherent replies: Otti should help or extend the conversation, not instantly call completion.
7. Interrupt narration: resume should replay, not silently skip, the authored line.
8. Copy the compact log and compare `SCRIPT:` vs. `AI:` for fidelity.
9. Confirm no cloud course progress or Practice flows are affected.

## Engineering validation

Run `npm run check`, `npm run test:learn-pilot`, `npm run test:ui`, and `npm run test:practice`. These tests cannot verify Gemini's audible compliance, teaching judgment, Arabic pronunciation, mobile screenshots or real microphone behavior; those remain launch gates.

## Scope

This is the **first chapter pilot**, intentionally using five scenes rather than replacing the entire official B1 U1-L02 curriculum. The complete editorial storyboard (phrases, planning vocabulary, integrated grammar, listening, invitations) remains a separate draft for the next implementation pass. **Do not claim the full B1 lesson has been shipped.**
