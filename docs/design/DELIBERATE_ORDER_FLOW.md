# Deliberate order flow

Status: implementation contract · 2026-08-09 · owner: game director

## Player problem

Chapter I exposes enough information to support a reasoned decision, but repeating every strategic reading, promise, opponent read and pressure warning inside every card makes comparison visually noisy. A pointer click also commits immediately, so an attempt to inspect a card can become an irreversible order.

SHI therefore separates **selection** from **commitment**. The player first selects one compact order, then reads one focused inspection surface containing every choice-specific forecast, then uses a distinct **Issue order** action. Nothing in the focused surface is new hidden information: it is a calmer presentation of the same authored contract.

## Interaction contract

```text
read the shared position
  → compare compact order silhouettes
  → select one order without changing campaign state
  → inspect its intent, immediate effects, strategic reading,
    promise establishment or answer, Qin method hit/miss and pressure warning
  → issue the selected order once
  → resolve through the shared six-layer engine
```

- One enabled order is selected when a position opens so keyboard and controller users have a deterministic starting point.
- Selecting another order changes only ephemeral UI state. It cannot change resources, history, seed, routes, audio consent or saved campaign state.
- The selected card uses text, `aria-pressed`, border geometry and focus—not color alone.
- The focused inspector names the selected order and preserves every choice-specific disclosure required by the commitment, method-read and pressure contracts.
- The **Issue order** action is the only pointer/keyboard control that commits. It repeats the selected order's name so the final action is unambiguous.
- A disabled order can neither become selected nor be issued. Its unmet requirements remain visible on the compact card.
- Once an order resolves, the choice region becomes inert until the consequence closes. Re-entry remains rejected by the shared engine-facing guard.

## Input parity

| Intent | Pointer/touch | Keyboard | Standard gamepad |
| --- | --- | --- | --- |
| Select order | Activate compact card | `Tab`, arrows through browser focus, or `Shift+1–3` | D-pad or stick |
| Read forecast | Focused inspector updates immediately | Inspector follows selection | Inspector follows selection |
| Issue order | Activate **Issue order** | Focus and activate **Issue order** | South button (`A` / `Cross`) |
| Change selection | Activate another card | Focus/shortcut another card | D-pad or stick |

Gamepad confirmation may issue the currently selected order directly because directional selection has already updated the complete visible inspector. Pointer activation of a card never issues an order.

## Information hierarchy

Compact cards carry only what is needed for comparison: order letter, title, one-line intent, immediate effects and unmet requirements. The single focused inspector carries method identity, the prose-heavy strategic reading and all choice-specific forecasts. Shared position layers—resources, current pursuit, current method memory, carried commitment and field signal—remain above the decision region and are not duplicated.

The inspector must remain visually subordinate to the story but unmistakably connected to the selected card. At narrow widths it becomes one vertical reading path. At actual Chrome 400% zoom, the selected card, focused forecast and final issue action must all remain reachable without horizontal scrolling.

## Verification gates

- Unit/UI tests prove card activation changes no campaign history, selection changes the inspected order, the explicit issue action commits exactly once, keyboard shortcuts select without committing, and controller confirmation still reaches the same resolver.
- Static accessibility validation covers selected/unselected surfaces, inspector copy, confirmation action, forced-colors geometry and 24 CSS pixel targets.
- Visible QA proves initial selection, pointer selection without mutation, complete forecast switching, explicit confirmation, duplicate-choice rejection, mobile/RTL layout, 320-pixel reflow and actual Chrome 400% reachability.
- Unity source tests and offline warning-as-error compilation cover localized keys and the select/review/confirm state transition. Licensed native interaction evidence remains a separate open gate.
