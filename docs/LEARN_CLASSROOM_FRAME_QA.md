# B1 Teacher Lab — real classroom screenshot QA

**Scope:** development-only deterministic *rendering* QA for Draft Learn PR #51, via stacked QA PR #52. No API key, microphone, official progress, Practice changes or curriculum reauthorization. This is an implementation of the editorial production contract in [english-course PR #7](https://github.com/addvaluewithai-hub/english-course/pull/7).

## What is actually shared

- `src/lessonScenes/TeacherLabBoardLayer.tsx` renders the **same** `TeacherBoardActivity` for Live and QA, not an illustrated mock.
- `src/qa/teacherLabQa.tsx` uses the real `CharacterHost` (bundled Octo engine), original 37 production CSS imports and production lesson data. It recreates the shell markup deterministically, without calling Live APIs. Changing shell JSX should update both or extract further shared shell parts.
- `qa.html` runs in development; its component refuses production access except explicit `VITE_ENABLE_LESSON_QA=1` for an isolated audit build. Do **not** expose this QA state override to real students.
- `src/qa/lessonQaRegistry.ts` is the shared lesson manifest/registry. Agents register exact lesson definition, authored beat map, final Speaking ID and bespoke visual key. `src/qa/lessonQaVisuals.ts` registers the visual component. The runner derives cases from these definitions; it has **no B1-specific scene/beat IDs**.
- `scripts/capture-learn-frame-sheets.mjs` uses Vite + Playwright Chromium to open **all scripted beats** and 4 quiz states (initial question / right / wrong), then final Speaking (listening / Otti / complete) at 320x640, 400x860 and 1280x900.
- The [frame workflow](../.github/workflows/learn-classroom-frames.yml) uploads PNGs, per-scene contact sheets and a JSON/Markdown warning report as 30-day GitHub artifacts. The 78 screenshots include repeated chapter boundary states to exercise both UI variants.

Run on a local machine with Node 22+, installed npm dependencies and Chromium:
```bash
npm install --no-audit --no-fund
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
npm run qa:learn:frames -- b1-u1-l02-teacher-board-lab
```
Review `test-results/learn-frames/<lesson-id>/REPORT.md` and open **every** `*CONTACT.png`, not just the four representative JPEG images printed by CI. The runner returns nonzero on structural warnings; semantic/visual critique is a separate human/agent check.

## Initial actual browser findings

Baseline browser run: [GitHub Actions #38694479748](https://github.com/addvaluewithai-hub/englishlive/actions/runs/38694479748). It captured **78 states and 15 contact sheets**. Diagnostic warning count was **36**, but many were false positives (all question panels share a flex box with lower-right Otti, and some canonical MC questions have only 2 options). The original warnings were **not** a valid acceptance score.

**Visually observed defects from real 400x860 rendered screenshots:**
1. Obsolete `product-v8-pixel-perfect.css` positioned the `premium-live-status` pill absolutely at ~45% of the screen and masked quiz options. Its after-content also shouted `دورك الآن / قل الجملة بصوتك` during touch-only MC.
2. The SVG canvas inherited RTL direction and pushed English labels beyond its left edge.
3. A desktop 720x360 SVG was letterboxed inside the phone, making labels very small.
4. Old `premium-lesson-stage::after` pseudo-element drew a blank whiteboard behind the final Speaking scene.
5. Old `premium-scene-caption` bottom alignment overlaid the bottom choice and feedback after the pill was removed.
6. The center control still resembled an enabled speaking mic during MC.
7. Several choice buttons measured under 44px high.
8. Screenshot runner's first revision hard-coded 3 quiz options and flagged overlap against a flex container's unused whitespace.

**Repairs (subject to final re-inspection):**
- Learn-only scoped CSS removes the pseudo wooden board and floating legacy voice pill, repositions caption above the stage and restores a normal author-controlled teaching status.
- Touch-only quiz state now has a neutral `اختار / اسمع` control, never a misleading mic.
- Separate **portrait SVG compositions** present larger text and meaningful scenes, not just a shrunk desktop 16:9 board.
- Options have 44px touch size; compact phone quiz prioritizes question over repeated graphic. Board has no inner scroll.
- Runner compares option count with the authored scene and tests actual content/mascot intersections, avoiding the baseline false positives.
- Final Speaking retains a live Otti stage (no wooden fake board) and its actual voice mode.

## Known limits / open gate

- CI screenshots are deterministic **rendering** only; they do not prove real Gemini Live narration, audio/beat timing, microphone permissions, external fonts/network dependencies or Otti's semantic judgment on incoherent spoken replies.
- Opening every actual contact sheet and verifying 320/400/1280 viewports is required before claiming visual review complete. A pass is **not** human acceptance or merge authorization.
- Production shell JSX and old CSS layers have drifted over multiple style versions; longer-term refactor should co-locate the shared Learn shell rather than relying on ever more global overrides.

## Onboarding the next lesson

In the product repo, add its authored `SceneLessonDefinition` and beat map, supply a **bespoke** visual component, and register both in `src/qa/lessonQaRegistry.ts` and `src/qa/lessonQaVisuals.ts`. The QA fixture accepts `/qa.html?lesson=<id>&scene=<id>&beat=<id>&state=<state>`; use `npm run qa:learn:frames -- <id>`. The runner enumerates all beats, quizzes and final speaking states automatically. Registering a lesson for QA does **not** publish it or mark curriculum delivery complete. Existing B1 art remains B1-only; do not display relationship diagrams in A1 by default.

To capture **every registered lesson** for a release PR, run `npm run qa:learn:frames:all` (CI uses this). This currently runs lessons sequentially; when the registry becomes large, split the jobs by lesson ID in a CI matrix to keep execution bounded rather than removing per-lesson inspection. For a scoped agent developing just one new lesson, `npm run qa:learn:frames -- <id>` is faster but must be repeated for every affected lesson before acceptance.
