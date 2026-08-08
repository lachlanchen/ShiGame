# Localization plan

Supported locales: English, Arabic, German, Spanish, French, Japanese, Korean, Russian, Vietnamese, Simplified Chinese, and Traditional Chinese.

## Current state

- All interface keys have all eleven translations and an automated equality/non-empty test.
- Campaign title and subtitle have all eleven translations.
- Chapter prose currently has English and Simplified Chinese, with selected Traditional Chinese/Japanese names. Other locales fall back to English.
- Arabic switches the document to RTL; untranslated fallback prose is explicitly LTR to prevent punctuation/order corruption.

This is localization infrastructure, not a claim that the entire narrative is translated.

## Production workflow

1. English and Simplified Chinese narrative source passes historical and narrative review.
2. Extract stable string IDs; never use English prose itself as the key.
3. Provide translators with scene, speaker, register, gender/number, length and source notes.
4. Translate; independent linguistic editor reviews.
5. Pseudo-localize for expansion and glyph coverage.
6. Capture desktop/mobile screenshots in every locale.
7. Native reviewer plays the full chapter and signs the locale matrix.

## Language-specific gates

- Arabic: RTL mirroring, bidi isolation for dates/names, Arabic-capable font, shaped punctuation and numerals.
- Chinese/Japanese: line-breaking, punctuation prohibition rules, name/term consistency, serif glyph coverage.
- Korean: particle/context review and Hangul font metrics.
- Vietnamese: full diacritic coverage and line-height inspection.
- German/Russian/French/Spanish: 30–40% expansion stress tests and grammatical agreement.
- Traditional Chinese: editorial conversion, never blind character substitution.

## Terminology

“势/勢” is context-sensitive. The title stays `SHI` plus the local-language subtitle. In mechanics it may mean configuration, momentum, positional force, or strategic potential; translators receive the precise mechanic definition rather than one universal gloss.

Machine translation or LLM drafts may accelerate a first pass, but no locale is released without native human review.
