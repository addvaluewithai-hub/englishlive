# Englotti UI foundation

The first migration is `/home`. It uses the existing A1 roadmap, learner profile,
evidence-backed completion store, lesson URLs, and auth gate. Teaching, audio,
Gemini Live, curriculum, and cloud synchronization are unchanged.

## Boundaries

- `src/i18n`: interface catalogs, locale metadata, formatting, and `LocaleProvider`.
- `src/ui/theme`: semantic tokens and `ExperienceProvider` (`adult`, `teen`).
- `src/ui/primitives`: buttons, icon actions, cards, and native progress.
- `src/ui/product`: navigation, Otti presence, lesson continuation, unit progress,
  empty state, and quick actions.
- `src/ui/layouts`: scoped application shell and RTL/LTR layout.
- `src/screens/HomeScreen.tsx`: existing data selection and component composition.

UI styling uses CSS Modules. AppLayout applies theme tokens, `lang`, and `dir`
to its own boundary. Neither provider changes global document attributes or
`:root` tokens while Arabic legacy screens remain active. Migrated screens must
not be wrapped by `app-shell is-product-v2`; that would reintroduce CSS overrides.
Opt the next route into AppLayout in `App.tsx` when its presentation is ready.

## Ten-language architecture

The ten launch languages still need to be specified. Only Arabic and English
are currently translated and enabled; the interface does not advertise eight
untranslated languages. Arabic remains the default. Adding a language requires:

1. Add a complete catalog in `src/i18n/catalogs`, satisfying
   `Record<MessageKey, Message>`.
2. Register its native name, BCP 47 Intl locale, direction, and catalog in
   `src/i18n/locales.ts`. The selector and SupportedLocale type derive from this
   registry, rather than a fixed list in each screen.
3. Supply every plural category needed by that locale, always including `other`.
   Messages are full sentences, not concatenated translated fragments. Parameter
   names belong to the shared MessageParams contract. React renders plain text.
4. Run catalog tests and check long translations at 320px and at 200% text size.
   Use logical CSS properties, flexible grids, and no fixed-height text containers.
5. Translate curriculum metadata through the canonical content pipeline. The
   current title adapter uses existing `titleAr` for Arabic and authored English
   for other UI locales until that content has approved translations.

UI locale is distinct from English as the language being taught, learner
onboarding preferences, and the runtime's explanation/intent language. This
foundation does not claim that live Arabic explanations are multilingual. Those
require a separately reviewed domain change when language requirements are set.

Preferences are versioned, validated, and resilient to unavailable localStorage:
`englotti.ui.locale.v1` and `englotti.ui.experience.v1`, with
`{ "version": 1, "value": "en" }` / `"adult"` / `"teen"`. They currently belong
to the device. Cloud/account preference synchronization is a later migration.

## Themes and art

Screens consume the presentation profile; they never infer it from age. The
same Home works for adult and teen. Colors, radii, spacing, typography, shadows,
motion durations, and mascot size come from the theme. Significant motion is
not introduced; reduced-motion users get zero transition duration.

OttiHero selects art through the profile's mascotFamily. Existing approved neutral
and waving assets are temporary fallbacks. Dedicated mature/teen artwork and
localized copy-tone variants are future assets/content, not fabricated here.

## Migration and validation

Home's dedicated `home-redesign.css` import is retired; delete the file after
Home validation passes. Shared legacy sheets remain for unmigrated routes.
The foundation is not another global override sheet.

Run `npm run check`, `npm run test:ui`, and the Home browser suite with the existing
`VITE_VISUAL_QA=1` test build. The QA flag is never used in production builds.
Check first lesson, partial progress, all available lessons completed, missing
profile, language changes/reload, both themes, RTL/LTR, navigation, and overflow.
Authentication/cloud loading and errors remain owned by the existing RequireAuth
gate and are outside this first screen's localization migration.
