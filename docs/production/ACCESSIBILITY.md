# Accessibility contract

Status: implemented web pre-alpha baseline · 2026-08-09 · release owner: game director

SHI targets WCAG 2.2 AA for the web client and input/feedback parity in both clients. Passing automation is a minimum engineering condition, not a claim that disabled players have certified the game. Screen-reader sessions, physical adaptive/controller hardware, forced-colors review and the licensed Unity client remain observed release gates.

## Interaction contract

- Pointer, touch, keyboard and standard-gamepad commands reach the same authored actions. No alternate input path may bypass requirements, resolution ordering or save history.
- Drawers use named modal-dialog semantics, receive initial focus, trap forward/reverse tab movement and make the underlying game stage inert.
- Closing a drawer returns focus to its connected invoker. Controller activation from the document body falls back to the current story position.
- While the three-stage consequence is visible, the decision region is inert and `choose` rejects pointer, keyboard and controller re-entry.
- Status, selection, danger, intelligence state and reconstruction class always have text or shape in addition to color.
- The production floor for a visible control is 24×24 CSS pixels. Large primary actions and decision cards intentionally exceed that minimum.

## Visual and motion contract

- Curated text/surface pairs must reach a 4.5:1 contrast ratio on the darkest conservative surface used by that component. `scripts/validate-accessibility.mjs` rejects regressions in the current 16-pair contract.
- Microcopy audited by the same script cannot fall below `0.6rem`; critical body and decision copy is larger.
- Browser text resized to 200% must retain every action, narrative block and scroll path without horizontal overflow. Frames around the title/game seals scale with their text instead of clipping it.
- The operating-system `prefers-reduced-motion` setting becomes the initial game preference and suppresses CSS animation, transitions and smooth controller scrolling. The player can also toggle the preference on the title screen.
- Layered gradients, texture and key art prevent axe from computing some live color-contrast results. Those results stay visible as `incomplete`; the conservative static contrast contract and full-resolution screenshot review cover this boundary. It must not be silently reported as an axe pass.

## Localization and direction

The shell supports English, Arabic, German, Spanish, French, Japanese, Korean, Russian, Vietnamese, Simplified Chinese and Traditional Chinese. Missing UI strings fail validation. Arabic changes the document to RTL, while untranslated fallback narrative is isolated as LTR. Visible automation now proves the required self-hosted script face, localized control names, complete header geometry and zero horizontal overflow for all eleven locales at 800×650; English/Arabic mobile and modal states have additional coverage. Every locale still requires release-candidate mobile, zoom, linguistic and native-review passes.

## Automated evidence

| Gate | Current pre-alpha scope |
| --- | --- |
| `npm run validate:accessibility` | 16 contrast pairs, 24 microtype floors, 11 authored target dimensions |
| jsdom + axe-core 4.12.1 | Title, field-guide modal, gameplay and wartable semantic scans |
| visible Chrome + axe-core | Eighteen interaction/locale/desktop/mobile states, WCAG 2.0/2.1/2.2 A/AA tags |
| visible target geometry | Ten interaction and resize states at the 24 CSS pixel floor |
| visible locale typography | Eleven real script samples, same-origin face availability, direction, header-child fit and zero overflow |
| visible privacy/network | Eleven-locale traversal, zero remote HTTP(S) requests/resources, zero non-cancelled failures and enforced CSP |
| visible reflow | Title and active gameplay at 200% text, plus 390×844 gameplay/wartable/guide |
| visible motion | OS reduced-motion startup and computed animation/transition suppression |
| input isolation | Focus wrap/return, inert modal background and duplicate-choice rejection |

The browser report records the axe version, every audited state, incomplete rules, target counts, exact commit/URL and console errors in `docs/production/evidence/web-playtest-status.json`. The implementation uses the official [axe-core release](https://github.com/dequelabs/axe-core/releases/tag/v4.12.1), locked as a development dependency.

## Open release gates

- Observed screen-reader runs with at least NVDA/Firefox or Chrome on Windows, VoiceOver/Safari on Apple hardware, and a documented Linux/Orca smoke pass.
- 400% reflow, browser zoom, forced-colors/high-contrast mode, magnifier and keyboard-only completion on release candidates.
- Physical Xbox-layout, PlayStation-layout and representative adaptive/switch input, including reconnect and focus loss.
- Photosensitivity review of lightning/rain/transition content and audio accessibility once those assets exist.
- Caption, subtitle, dialogue-history, independent speech/music/effects volume and mono compatibility once voiced/audio content exists.
- Licensed Unity import and runtime inspection, including semantic/accessibility plugin selection; offline C# compilation is not native accessibility evidence.
- Observed players from the target audience. Chapter II remains gated until first-minute comprehension and decision readability have player evidence.

Any failed item stays open in the release checklist. Automation may narrow risk; it cannot convert an unobserved human path into a pass.
