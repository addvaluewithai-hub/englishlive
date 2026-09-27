# Milestone: Englotti Studio MVP

This slice adds the first production-safe authoring console on top of the revision model already in Neon.

## Access model

`/studio` requires a normal Neon Auth session and the server independently checks a Cloudflare-side allowlist before any authoring data or write is returned.

Configure at least one of these server-side variables in Preview and Production:

- `STUDIO_ADMIN_EMAILS` — comma-separated Neon Auth emails
- `STUDIO_ADMIN_USER_IDS` — comma-separated exact Neon Auth user ids

If neither allowlist is configured, Studio is closed by default.

## Supported authoring records

- Lessons
- Characters
- Teaching policies

The Studio reads the same identity and revision rows used by the learner application.

## Revision workflow

1. Open the current published revision.
2. Create a draft; Studio copies the published JSON into the next revision number.
3. Edit JSON and add an optional change note.
4. Save the draft to Neon.
5. Preview a structured rendering of the current editor JSON.
6. Publish the draft.

Publishing updates the draft revision from `draft` to `published` and atomically moves the parent identity's `published_revision_id` pointer to it. Existing published revisions remain untouched and continue to be protected by the production immutability triggers.

## Validation

The API rejects non-object JSON and applies a small minimum shape check before saving:

- lesson: `id` plus a non-empty `scenes` array
- character: `displayName` and `personaPrompt`
- policy: `prompt`

This is intentionally minimum validation for the MVP; richer schema-aware field editors can be layered on top without changing the database model.

## Preview scope

The first Studio slice includes an in-console structured preview for lesson scenes, character prompts and teaching policy text. Live voice/session preview of an unpublished revision is intentionally not exposed through the public content APIs and is a follow-up slice.

## Safety properties

- Browser clients never receive `DATABASE_URL`.
- Studio APIs require a verified Neon Auth bearer JWT.
- Studio authorization is enforced again server-side with the admin allowlist.
- Published revisions cannot be edited by the Studio API.
- Publish reuses the existing immutable revision history instead of overwriting published JSON.
- No production schema migration is required for this milestone.
