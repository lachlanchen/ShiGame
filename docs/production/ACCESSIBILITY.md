# Accessibility contract

Status: implemented web pre-alpha baseline · 2026-08-09 · release owner: game director

SHI targets WCAG 2.2 AA for the web client and input/feedback parity in both clients. Passing automation is a minimum engineering condition, not a claim that disabled players have certified the game. Screen-reader sessions, physical adaptive/controller hardware, human high-contrast/forced-colors review and the licensed Unity client remain observed release gates.

## Interaction contract

- Pointer, touch, keyboard and standard-gamepad commands reach the same authored actions. No alternate input path may bypass requirements, resolution ordering or save history.
- Drawers use named modal-dialog semantics, receive initial focus, trap forward/reverse tab movement and make the underlying game stage inert.
- Closing a drawer returns focus to its connected invoker. Controller activation from the document body falls back to the current story position.
- While the three-stage consequence is visible, the decision region is inert and `choose` rejects pointer, keyboard and controller re-entry.
- Status, selection, danger, intelligence state and reconstruction class always have text or shape in addition to color.
- The production floor for a visible control is 24×24 CSS pixels. Large primary actions and decision cards intentionally exceed that minimum.

## Visual and motion contract

- Curated text/surface pairs must reach a 4.5:1 contrast ratio on the darkest conservative surface used by that component. `scripts/validate-accessibility.mjs` rejects regressions in the current 22-pair contract.
- Microcopy audited by the same script cannot fall below `0.6rem`; critical body and decision copy is larger.
- Browser text resized to 200% must retain every action, narrative block and scroll path without horizontal overflow. Frames around the title/game seals scale with their text instead of clipping it.
- A 320 CSS pixel layout viewport provides the automated WCAG reflow equivalent of a 1280 CSS pixel viewport at 400% zoom. Title, header, wartable, narrative, decisions and controls must fit horizontally and remain vertically reachable.
- The dedicated Chrome desktop must also pass browser-level `Ctrl++` zoom from a measured DPR 1 baseline to DPR 4. The 400% title/gameplay layouts must have zero horizontal overflow, preserve action reachability, pass semantic/target audits, produce visible overview/action evidence and reset to DPR 1 afterward. This agent-observed gate does not replace human zoom/magnifier review on release candidates.
- Forced-colors mode removes non-informational art/texture, uses operating-system colors, preserves focus/selection outlines, and distinguishes danger, reported/reference/active sites and disabled actions by border shape as well as color.
- The operating-system `prefers-reduced-motion` setting becomes the initial game preference and suppresses CSS animation, transitions and smooth controller scrolling. The player can also toggle the preference on the title screen.
- Runtime sound is opt-in, begins only after a player gesture and never carries exclusive information. The implemented Chapter I mixer persists independent ambience/effects values; speech and music controls remain gated until those categories exist. Deterministic and actual-browser engineering captures enforce pre-consent silence, conservative peak/loudness, DC, loop-boundary and channel-parity limits. Human listening, mono perception, physical-device, native Unity and sensory-load review remain open.
- Layered gradients, texture and key art prevent axe from computing some live color-contrast results. Those results stay visible as `incomplete`; the conservative static contrast contract and full-resolution screenshot review cover this boundary. It must not be silently reported as an axe pass.

## Localization and direction

The shell supports English, Arabic, German, Spanish, French, Japanese, Korean, Russian, Vietnamese, Simplified Chinese and Traditional Chinese. Missing UI strings fail validation. Arabic changes the document to RTL, while untranslated fallback narrative is isolated as LTR. Visible automation now proves the required self-hosted script face, localized control names, complete header geometry and zero horizontal overflow for all eleven locales at 800×650; English/Arabic mobile and modal states have additional coverage. Every locale still requires release-candidate mobile, zoom, linguistic and native-review passes.

## Automated evidence

| Gate | Current pre-alpha scope |
| --- | --- |
| `npm run validate:accessibility` | 22 contrast pairs, 30 microtype floors, 14 authored target dimensions, 14 forced-colors selectors and required system colors |
| jsdom + axe-core 4.12.1 | Title, field-guide modal, gameplay and wartable semantic scans |
| visible Chrome + axe-core | Twenty-six interaction/locale/audio/desktop/mobile/reflow/zoom/forced-colors states, WCAG 2.0/2.1/2.2 A/AA tags |
| visible target geometry | Eighteen interaction, audio, resize, reflow, browser-zoom and forced-colors states at the 24 CSS pixel floor |
| visible locale typography | Eleven real script samples, same-origin face availability, direction, header-child fit and zero overflow |
| visible privacy/network | Eleven-locale traversal, zero remote HTTP(S) requests/resources, zero non-cancelled failures and enforced CSP |
| visible reflow | Title and active gameplay at 200% text; 320×800 400%-equivalent title/gameplay; actual Chrome 400% title/gameplay/action frames; 390×844 gameplay/wartable/guide |
| visible forced colors | System palette, decorative-layer removal, structured meters, danger outline, selection outline and shape-distinct wartable markers |
| visible motion | OS reduced-motion startup and computed animation/transition suppression |
| visible audio | First-launch off state, gesture-gated runtime, independent bus extremes, persistence, lazy chunks, semantic preview, focus return, 390×844 mixer fit, exact pre-consent digital silence and 16-second actual-output peak/loudness/DC/channel capture |
| input isolation | Focus wrap/return, inert modal background and duplicate-choice rejection |

The browser report records the axe version, every audited state, incomplete rules, target counts, exact commit/URL and console errors in `docs/production/evidence/web-playtest-status.json`. The implementation uses the official [axe-core release](https://github.com/dequelabs/axe-core/releases/tag/v4.12.1), locked as a development dependency.

## Open release gates

- Observed screen-reader runs with at least NVDA/Firefox or Chrome on Windows, VoiceOver/Safari on Apple hardware, and a documented Linux/Orca smoke pass.
- Human-observed 400% browser zoom, magnifier, Windows high-contrast/forced-colors and keyboard-only completion on release candidates; the agent-observed Chrome zoom, 320 CSS pixel and emulated forced-colors contracts do not replace these sessions.
- Physical Xbox-layout, PlayStation-layout and representative adaptive/switch input, including reconnect and focus loss.
- Photosensitivity review of lightning/rain/transition content and auditory sensory-load review of the procedural rain bed.
- Human listening, mono perception, loudness appropriateness, sensory load and physical-device-matrix review for the objectively measured ambience/effects system.
- Caption, subtitle, dialogue-history and independent speech/music volume once voiced or music content exists.
- Licensed Unity import and runtime inspection, including semantic/accessibility plugin selection; offline C# compilation is not native accessibility evidence.
- Observed players from the target audience. Chapter II remains gated until first-minute comprehension and decision readability have player evidence.

Any failed item stays open in the release checklist. Automation may narrow risk; it cannot convert an unobserved human path into a pass.
