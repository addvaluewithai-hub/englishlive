# EnglishLive Product Design System

Status: source of truth for the product experience from Milestone 4.5 onward.

## Product feeling

EnglishLive should feel like a calm, premium place to have a real conversation — not an AI demo, a classroom dashboard, or a gamified worksheet.

The character is the visual hero. UI exists to support the conversation and then get out of the way.

## Visual direction

**Warm editorial + character-led.**

Use:

- warm paper backgrounds;
- near-black ink;
- restrained burnt-coral action color;
- muted character-specific accents;
- editorial serif display type paired with a neutral system sans for controls;
- visible structure from spacing, rules, alignment, and typography;
- solid surfaces instead of decorative effects.

Avoid:

- purple/blue AI branding as the product identity;
- neon glows and glowing orbs;
- glassmorphism as a default container style;
- decorative gradients;
- identical three-card SaaS sections;
- excessive pill UI;
- emoji used as interface icons;
- developer/runtime terminology in learner-facing copy;
- fake progress, fake scores, or fabricated learner insights.

## Core tokens

Defined in `src/styles.css`:

- `--paper` — main warm background;
- `--paper-strong` — elevated reading surface;
- `--paper-muted` — character/art surface;
- `--ink` — primary text and strong actions;
- `--muted` — secondary copy;
- `--line` / `--line-strong` — structure;
- `--action` — restrained burnt-coral emphasis;
- `--night` / `--night-soft` — immersive live-session environment.

Character accent colors are local to the character and must not become the global brand palette.

## Typography

Display headings use a system-available editorial serif stack beginning with Georgia. UI controls and body copy use the platform sans stack.

Rules:

- body copy is at least 16px where it carries primary information;
- line-height should normally be 1.5–1.65;
- large display type should use tight tracking and short line lengths;
- do not introduce an external font dependency until there is a clear brand reason.

## Interaction

- Minimum interactive target: 44×44px.
- Do not rely on hover to reveal required actions.
- Keep visible keyboard focus styles.
- Respect `prefers-reduced-motion`.
- Ask for microphone permission only at the moment the learner explicitly starts a conversation.
- Motion should communicate state, continuity, or character life — not decorate every click.

## Information hierarchy

### Landing

One promise, one primary CTA. Explain the conversation-first product without feature-grid overload.

### Onboarding

Four short decisions:

1. optional first name;
2. one or two real speaking goals;
3. self-described speaking comfort;
4. conversation partner.

The answers must affect the actual live experience. Do not add questionnaire fields that are not used.

### Home

The next conversation is the primary object. Secondary information explains the practice path; it must not compete with the start action.

### Partner selection

Lead with personality and interaction feel, not renderer technology or implementation details.

### Live session

The character owns the stage. Status, microphone feedback, and the start/end action form a quiet control dock. Transcripts are secondary. Technical performance/debug state belongs behind optional details only.

## Voice and copy

Use confident, human language. Prefer direct conversation language over education-platform jargon.

Good:

- “Start conversation”
- “Keep a conversation moving”
- “Say the version you have.”

Avoid:

- “Initialize AI tutor”
- “Module 3 unlocked”
- “Your fluency score is 87%” unless such a score is genuinely validated and meaningful.

## Product truth

The interface must not visually imply capabilities that are not implemented. In particular:

- do not claim durable memory before the memory system exists;
- do not show mastery/progress scores before the tutor runtime can support them;
- do not invent social proof or learner counts;
- do not present acoustic viseme analysis as pronunciation assessment.

## Responsive behavior

Desktop may use split layouts. Mobile should preserve the same hierarchy, not compress desktop cards into tiny columns. The live character should remain the dominant visual on phone screens, with controls reachable near the bottom and safe-area aware.

## Future design work

When the curriculum/runtime is ready, extend this system rather than introducing a new visual language for missions, reviews, progress, subscription, or settings.
