# Milestone 8 — Memory + Learner Model

Status: implemented on `feat/m7-8-b1-memory`; behavioral/privacy UX validation still required.

## Goal

Give EnglishLive durable product memory without pretending the model's context window is memory and without creating fake mastery scores.

## Three layers

### Learner profile

Explicit onboarding state already stored separately: first name, goals, speaking comfort, and selected partner.

### Learning memory

Automatic, structured product state derived only from authoritative mission evidence. It stores capability attempts/successful session observations, whether recycle is suggested, and short semantic evidence summaries.

It does **not** store raw audio or raw transcripts and does not infer a numeric fluency score.

One successful mission observation is still one observation. It is never converted into `mastered`.

### Relationship memory

Personal continuity is consent-based. Gemini may propose one short non-sensitive future note such as a follow-up or interest. The proposal is not persistent until the learner explicitly presses Keep.

Sensitive categories are forbidden in the tool guidance and screened client-side. The learner can remove saved continuity notes from the product UI.

## Persistence

Milestone 8 uses versioned local storage (`englishlive.memory.v1`) so the full vertical slice works before auth/database work in the MVP shell milestone.

Stored session summaries contain only:

- stable session id;
- mission id/title;
- character id;
- start/end timestamps;
- completion flag;
- capability ids that had structured evidence.

Raw transcripts are intentionally not persisted.

## Prompt use

Only a compact relevant slice enters a new live session:

- observations for capabilities targeted by the current mission;
- up to three learner-approved continuity notes.

The character must never recite internal counts, ids, labels, or say that the learner previously failed. A recycle flag simply creates another natural opportunity.

## Acceptance

Engineering:

- session recording is idempotent by session id;
- incomplete sessions may record attempted evidence but cannot invent success;
- raw transcripts are not persisted;
- memory context is relevant and bounded;
- relationship proposals require explicit Keep before persistence;
- saved relationship notes can be removed;
- TypeScript and production build pass.

Manual/product:

- the second session can feel continuous without becoming creepy;
- the learner understands what optional personal note is being kept;
- rejecting a proposal leaves no persistent personal note;
- learning memory changes future practice without exposing rubric mechanics.
