# AGENTS — EnglishLive product workspace

This is the application repo. The **authoritative English curriculum and interactive lesson production queue** are in `addvaluewithai-hub/english-course`, not in this repository.

## When the owner says "شوف إحنا واقفين فين في A1 وكمل"

1. Open `addvaluewithai-hub/english-course` on **main**, read `AGENTS.md`, `interactive-content-production/AGENTS.md` and the target `interactive-content-production/status/{A1,A2,B1,B2,C1,C2}.md`.
2. Run `python3 interactive-content-production/tools/production_status.py next A1` in that repo (change level as requested). Confirm exact lesson title and source brief, semantic locks and delivery gates. Search recent/open PRs before claiming; status is not a distributed lock.
3. **Mandatory P0.5:** read `english-course/interactive-content-production/coverage/<LEVEL>/<LESSON>.json` and run `python3 interactive-content-production/tools/coverage_gate.py check <LEVEL> <LESSON>` in the course repo. Every canonical Coverage Ledger ID must have a semantic role, a teach/contextual/bounded/escalate decision, rationale and real scene/beat evidence if active. Unknown or conflicting scope is an owner review, NEVER silent omission or an irrelevant flashcard. `ready` remains blocked until curriculum, screenshots, live audio, Speaking and owner reviews all pass.
4. Read `english-course/interactive-content-production/WORKFLOW.md`, `LESSON_CONTRACT.md`, `FRAME_QA.md` and the registered production Skill. Claim the lesson in a scoped Draft PR/branch and link evidence in the English Course status row. Do not falsely mark partial pilots done.
5. In **this product repo**, reuse the live Otti/Scene Lesson runtime; do not build a second player. Script teaching beats, bespoke SVGs, authored MC right/wrong voice feedback and independent final Speaking. Keep *Practice* untouched unless the owner explicitly requests it.
6. Register its lesson data in `src/qa/lessonQaRegistry.ts` and bespoke visual component in `src/qa/lessonQaVisuals.ts`. Run `npm run test:learn-qa-registry` and `npm run qa:learn:frames -- <lesson-id>`. The screenshot suite generates every authored beat, every question state and final Speaking across three viewports automatically. Also run `npm run qa:learn:frames:all` for existing registered lessons.
7. **Open and critique** the resulting `test-results/learn-frames/<lesson-id>/*CONTACT.png` and inspect `REPORT.md`. Fix actual UI issues and rerun; screenshots do not prove actual Gemini speech quality. Check SCRIPT vs AI, interruptions, wrong MC explanations and genuine final Speaking separately.
8. Return Draft PR, SHA, exact tests, frame evidence, live audio results and gaps. Only update status to `done` with explicit owner acceptance plus evidence. No self-authorized merge or deploy on the agent's own initiative.

## Other requests

These Learn production directions **do not override** separate Practice workstreams or the owner's explicit requests for other features. Follow normal project tests and review boundaries, use separate branches, avoid touching concurrent PRs.

The deterministic QA entry `qa.html` is development-only and must not be exposed as a student production feature.

## Listening audio authoring (for conversations)

Produce static source-accurate dialogue via `addvaluewithai-hub/gemini-tts` using an approved versioned job. Consume only the completed reviewed WAV + actual-audio timed transcript + VTT and fixed `clipId` offsets; `play_lesson_audio` must not speak over PCM or open the learner mic. Don't use Browser TTS as the production recording; don't mark the lesson complete if the audio is missing. Scoped paid synthesis, actual device testing, and owner approvals are independent gates. A `check` audit pass only proves no source IDs fell out of the mapping, not that each learner mastered them.
