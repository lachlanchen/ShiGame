# Unreal command-space signal contract

Status: source-authored at implementation `ed4dcc6d3e4955f0115f6d98b7ccb83d4fe977c3`; native compilation, PIE interaction and visual review remain open.

## Purpose

The Unreal wartable must let a player read the position as a commander, not as a dashboard floating over scenery. Nine physical signals turn the authoritative campaign state into inspectable 3D objects. They never resolve an order, alter a save or invent historical evidence.

## Stable signal grammar

| Rail | Signal | World grammar | Exact information |
| --- | --- | --- | --- |
| Resource | Grain | brown cylinder, variable anchored height | current `grain` from 0–100 |
| Resource | Trust | green sphere, variable anchored height | current `trust` from 0–100 |
| Resource | Momentum | ochre cone, variable anchored height | current `momentum` from 0–100 |
| Resource | People | blue-grey block, variable anchored height | current `people` from 0–100 |
| Resource | Exposure | red narrow cone, variable anchored height | current `danger` from 0–100 |
| Tactical | Field | low blue-grey cylinder | current authored field title and signal |
| Tactical | Qin pursuit | red cone | posture, forecast and actionable counterplay; exact captured terminal state at Exposure 100 |
| Tactical | Method read | rotated violet block | neutral, counter-hit or counter-miss state for the selected order |
| Tactical | Active oath | gold sphere when active, small dark sphere when inactive | carried promise, or an explicit no-oath state |

Shape, position, relative height, text and selected outline/scale carry identity together; color is never the only distinction. Resource height uses one deterministic formula and every piece remains base-anchored to the table surface as its value or selected scale changes.

## Interaction contract

- Pointer selection raycasts against query-only visibility collision on site and signal actors.
- `Tab` or Gamepad RB cycles sites. `C` or Gamepad L3 cycles signals. Holding Shift reverses either rail; `Home` returns to current playable ground.
- A short eased camera transition aims at the selected piece. `Space` completes an active focus transition or order-response beat without changing state.
- Exactly one world object owns selected scale/color/stencil feedback. Site selection turns off while a command signal is focused.
- The Slate signal card exposes category, label, state and detail, and states that inspection is read-only. Previous/next signal and current-ground controls call the same focus model as physical input.
- Signal inspection resets historical-basis scope to the current node site. Dynamic mechanical/reconstruction state is never inserted into the historical source ledger.

## State and failure boundaries

`FShiCommandSignalModel::Build` receives only the campaign session's current resources, field condition, pursuit posture, method read, commitment and selected order. It builds into a temporary snapshot, validates the entire snapshot, and replaces the live snapshot only on success. Selection changes rebuild the method-read signal; resolved orders and chronicle restart rebuild all nine.

Validation fails closed when:

- any of the five exact resources is absent or outside 0–100;
- the stable nine-signal count, order, identifier, category, engine mesh, text or stencil identity drifts;
- a scale, position or table anchor is invalid;
- signal-to-signal or signal-to-site pointer spacing is below 42 Unreal units;
- a nonterminal state has no field, pursuit, method read or selected order.

Exposure 100 is a deliberate terminal exception: pursuit has ended because the position is captured, so a missing normal pursuit posture becomes the explicit `PURSUIT CLOSED · CAPTURED` signal rather than an invalid empty layer.

## Evidence classification

- Resource values are gameplay state.
- Field, pursuit, method-read and oath layers are authored dramatic reconstruction and strategy-system state.
- Site/source/claim records remain the only historical-evidence layer.
- Signal text contains no attributed quotation. Future quotations require the edition and claim-admission workflow before entering canonical content.

## Acceptance

Source validation and `SHI.CommandSpace.LiveSignalsV1` automation are authored for count/order, exact values, base anchoring, camera aim, selection, cycling, post-order refresh, active oath, captured terminal state, pointer spacing, missing inputs and atomic failure. This is not native proof. Acceptance still requires official Unreal C++ compilation, automation execution, visible PIE mouse/keyboard/gamepad traversal, selected-state and text review, camera-motion review, Linux packaging and an observed complete route.
