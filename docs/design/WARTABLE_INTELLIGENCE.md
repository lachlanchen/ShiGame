# Wartable intelligence contract

Status: implemented Chapter I contract · 2026-08-09 · owner: game director

## Player purpose

The wartable helps the player ask, “What does this position know, and how well does it know it?” It is not a decorative route map, a geographic measurement tool, or an omniscient preview of the winners of later history. Inspecting a place must clarify the current information horizon without changing campaign state.

## Intelligence classes

| Class | Meaning in play | Visual grammar | Chapter I examples |
| --- | --- | --- | --- |
| `known` | Ground directly occupied or operationally established in the current position | Solid marker; active position has the brightest bronze signal | Daze, Chen |
| `reported` | A place or network preserved in received accounts but not established as knowledge available to the opening council | Muted, dashed signal; panel states the hindsight boundary | Pei, Kuaiji |
| `reference` | A named orientation point outside the playable information horizon | Small hollow marker | Xianyang |

These are authored epistemic states, not dynamic fog-of-war simulation. A later chapter may change a site's class only through reviewed campaign data and player-visible events.

## Historical safety rules

1. A site must expose a concise summary, an explicit uncertainty statement, at least one source record and at least one claim record.
2. Every source required by a site claim must appear in that site's source list; validation rejects broken closure.
3. Coordinates are schematic UI coordinates. They never establish distance, route, seasonality, travel time, administrative boundary, or historical GIS precision.
4. Pei and Kuaiji may foreshadow reported networks, but they cannot imply that Daze characters knew Liu Bang's or Xiang Yu's later role, route, victory, or destiny.
5. Xianyang is reference-only in Chapter I. Its marker cannot be read as a reachable destination or promised campaign path.
6. Opening an inspector or evidence drawer never changes resources, seed, history, flags, route, or save state.

## Interaction parity

| Intent | Web keyboard | Standard gamepad | Pointer | Unity baseline |
| --- | --- | --- | --- | --- |
| Enter/leave map reading | `Alt+M` / `Escape` | `Y` / Triangle or east button | Inspect-map control / close | `M`, `Y` / Triangle, close |
| Select a site | Arrow keys | D-pad / left stick | Site marker | Arrow keys, D-pad/stick, 3D marker raycast |
| Open site evidence | `Enter` | South button | Evidence control | `Enter`, south button, evidence control |
| Return from evidence | `Escape` | East button | Close / scrim | `Escape`, east button, close |

Selection wraps across the authored site order. Closing site evidence returns to the same inspected place. Moving through sites does not move the campaign's active marker.

### Unreal priority slice

The Unreal source keeps the wartable continuously present in the Daze command space. The five canonical schematic coordinates project into one bounded table; `known`, `reported` and `reference` use cylinder, sphere and cone geometry so status survives color loss. Pointer marker clicks, `Tab`/Gamepad RB, `Shift+Tab` and `Home` all call the same focus state. A remote site opens only its own source/claim boundary and is labeled **intelligence only · not a destination**; returning to current ground restores the playable site's evidence scope. Inspection never resolves an order or mutates campaign state.

Site focus uses a short eased camera move. Order feedback starts from the exact focused transform and returns to that transform rather than accepting cumulative drift. Runtime validation rejects unsupported statuses, duplicate identities, non-finite or out-of-table positions and marker spacing below the pointer-target floor.

## Presentation rules

- Status is written in text and reinforced by marker shape/opacity; color is never the only carrier.
- The panel presents status, place, bounded summary, uncertainty, position index and evidence entry in that order.
- The current campaign position and inspected position remain visually distinct.
- Arabic retains RTL interface flow; fallback historical prose remains LTR when untranslated.
- On narrow screens the map column expands until the complete inspector is contained; horizontal overflow remains zero.
- The web map and inspector are lazy chunks so the title/startup bundle remains within the 100 KiB gzip budget.

## Verification and open gates

Schema, JavaScript, Unreal and Unity preflight validation cover status values, coordinate bounds, baseline text, references and claim/source closure. Unreal automation source additionally covers deterministic spatial projection, camera targeting, status geometry/stencil identity, wrap behavior, selected scale, overlap rejection and invalid-status rejection. Web unit/integration tests cover pointer, keyboard and standard-gamepad navigation. The dedicated visible Web gate covers known/reported/reference rendering, no state mutation, hindsight-boundary copy, filtered site evidence, return behavior, mobile containment and console errors.

Unreal native compilation, automation, marker picking, panel rendering and camera review remain unclaimed until the official Epic build is installed and those gates execute. Unity runtime/editor/EditMode-test sources pass the offline reference-assembly compile, but marker raycasting and native panel rendering are likewise not claimed as executed until the Unity account license gate permits official import, tests and player builds. Historical-GIS review remains P0; this implementation does not close it.
