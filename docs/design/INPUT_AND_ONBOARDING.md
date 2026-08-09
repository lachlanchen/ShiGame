# Input and onboarding contract

Status: implementation contract · 2026-08-09 · owner: game director

## Player problem

SHI asks the player to read a changing position rather than hunt for a single “good” number. The first minute must explain that loop without a lore dump, a fake safe choice, or a modal sequence that delays returning players. Every input method must invoke the same authored decision and save path.

## First-run field guide

The first new chronicle opens a compact, dismissible field guide over the live opening position. It has three ideas:

1. **Read the field.** Grain, trust, momentum, people and exposure describe different forms of power; no one meter is victory.
2. **Make your move.** A decision card shows the player's immediate, exact effects and its strategic intent.
3. **Carry commitments.** An opening move may establish a named promise to a stakeholder. It stays visible until a later choice explicitly keeps, strains or breaks it.
4. **Expect an answer.** A pressure forecast names the weakness exposed before commitment; the authored response remains distinct from the pursuing administration's disclosed posture.
5. **Read the opponent.** Repeated strategic methods can prepare a disclosed Qin counter; the pending card says whether that read will hit or miss.
6. **Read circumstance.** The chronicle seed selects one disclosed field condition, whose exact effects resolve as the final layer.

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
- Drawer close buttons receive initial focus; tab movement is contained inside the modal and the underlying game stage is inert. Closing returns focus to the connected invoker, or to the story when controller activation began from the document body.
- A visible consequence makes the decision region inert, and the shared commit guard rejects a second pointer, keyboard or controller choice until it closes.
- Reduced-motion preference also disables smooth controller scrolling.
- Input hints name functions, not a platform-specific controller brand.

## Verification boundary

Unit tests cover edge-triggered buttons, axis dead zones, priority, disconnect/reconnect, modal focus containment/return and decision isolation. Browser integration uses a synthetic standards-shaped `navigator.getGamepads()` device and drives the app only through that public input surface. Visible noVNC evidence must show the connected hint, selection movement, committed decision, guide, drawer controls, focus restoration, mobile fit, 200% text and reduced motion. The complete automated/manual boundary is in [`../production/ACCESSIBILITY.md`](../production/ACCESSIBILITY.md).

Synthetic Gamepad API coverage is not physical hardware certification. Month 2 remains open until at least an Xbox-layout and a PlayStation-layout controller are exercised in observed sessions, including reconnect and focus-loss cases.
