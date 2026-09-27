# Englotti visual QA

This branch uses a screenshot-driven UI review loop for the current product journey.

## Automated coverage

GitHub Actions builds the production bundle, starts the Vite preview, installs Chromium for QA only, seeds deterministic local learner/course state, and captures screenshots at:

- mobile: 390 × 844
- desktop: 1440 × 1000

Covered product states:

- landing
- onboarding: name, goals, comfort, teacher
- home
- Learn level browser
- A1 level
- Unit 1
- live Scene lesson: idle + help sheet
- lesson completion
- Free Speak browser
- Free Speak session
- progress
- teacher selection

Selected long pages also get full-page captures.

## What this verifies

The loop is useful for catching layout regressions, clipping, navigation overlap, responsive composition, bidi problems, stale developer copy, inconsistent chrome, and visual drift between screens.

The workflow also runs the production TypeScript/Vite build before screenshots.

## What this does not verify

Screenshots are not physical-device QA and do not prove microphone routing, native safe-area behavior, Gemini Live timing, real interruption latency, foreground/background lifecycle, or platform audio behavior. Those remain part of the later mobile reality check and live manual validation.
