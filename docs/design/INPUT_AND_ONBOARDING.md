# Input and onboarding contract

Status: implementation contract · 2026-08-09 · owner: game director

## Player problem

SHI asks the player to read a changing position rather than hunt for a single “good” number. The first minute must explain that loop without a lore dump, a fake safe choice, or a modal sequence that delays returning players. Every input method must invoke the same authored decision and save path.

## First-run field guide

The first new chronicle opens a compact, dismissible field guide over the live opening position. It has three ideas:

1. **Read the field.** Grain, trust, momentum, people and exposure describe different forms of power; no one meter is victory.
2. **Make your move.** A decision card shows the player's immediate, exact effects and its strategic intent.
3. **Expect an answer.** A pressure forecast names the weakness exposed before commitment; the authored response and the already disclosed field condition resolve as separate second and third stages.

Closing the guide records a local onboarding preference, not campaign progress. It never alters resources, history, routing or the save contract. Returning saves do not open it automatically. A permanent header control reopens it, and all eleven UI locales carry the complete guide.

## Input parity

| Intent | Keyboard | Standard gamepad | Touch/pointer |
| --- | --- | --- | --- |
| Select decision | `Tab` or `Shift+1–3` | D-pad or left stick | Tap card |
| Commit decision | `Enter`/`Space` | South button (`A` / `Cross`) | Tap card |
| Close transient layer | `Escape` | East button (`B` / `Circle`) | Close or scrim |
| Decision record | `Alt+R` | Left shoulder | Header control |
| Source ledger | `Alt+S` | Right shoulder | Header control |
| Field guide | Header control | Start / Menu | Header control |
| Inspect wartable | `Alt+M`, arrows, `Enter` | `Y` / Triangle, D-pad/stick, south button | Site markers and evidence control |

Controller navigation wraps only across enabled choices. A held axis cannot run away: the direction must return through the dead zone before another move is emitted. A controller command calls the same `choose`, drawer and restart functions as keyboard/pointer input; it cannot write game state directly.

The title accepts the south button, and a completed/failed run exposes restart as the selected primary action. A transient result, guide or ledger consumes close/confirm before gameplay can receive another commitment.

Wartable inspection is a separate read mode. Directional input cycles sites rather than choices, confirm opens that site's filtered evidence, and close returns first from evidence to the inspected place and then to normal decision control. Inspection never writes campaign state.

## Feedback and accessibility

- Controller connection is indicated textually and never by color alone.
- The selected decision has the normal focus outline plus a restrained bronze inset marker.
- Focus follows controller selection and the selected card scrolls into view on small screens.
- Drawer close buttons receive initial focus; closing returns focus to the story position.
- Reduced-motion preference also disables smooth controller scrolling.
- Input hints name functions, not a platform-specific controller brand.

## Verification boundary

Unit tests cover edge-triggered buttons, axis dead zones, priority and disconnect/reconnect. Browser integration uses a synthetic standards-shaped `navigator.getGamepads()` device and drives the app only through that public input surface. Visible noVNC evidence must show the connected hint, selection movement, committed decision, guide, drawer controls and mobile fit.

Synthetic Gamepad API coverage is not physical hardware certification. Month 2 remains open until at least an Xbox-layout and a PlayStation-layout controller are exercised in observed sessions, including reconnect and focus-loss cases.
