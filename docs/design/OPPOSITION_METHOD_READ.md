# Opposition method-read system

Status: implementation contract · 2026-08-09 · owner: systems design

## Player problem

Exposure makes Qin pursuit persistent, but an Exposure band alone does not notice *how* the player keeps solving problems. A credible strategic opponent should form a readable hypothesis, prepare against repetition, and sometimes be wrong. The player must be able to see that hypothesis before committing and break it by changing the shape of play.

Chapter I therefore adds a **Qin method read** beside pursuit posture. Every authored choice declares one of three strategic methods. Before each commitment, the game counts methods in the recorded decision history. After at least two observations, a unique most-used method produces one disclosed countermeasure. Repeating the targeted method activates its exact effect; choosing another method makes the prepared read miss.

The system is dramatic reconstruction. It is a game model of institutional learning under pursuit, not a claim that a surviving Qin record documents these exact searches, thresholds, or labels.

## Strategic methods

| ID | Player meaning | Distinct opportunity cost |
| --- | --- | --- |
| `witnessed-compact` | Make power legible through witnessed promises, public restraint, names, or shared obligation. | Builds legitimacy but leaves testimony that can be compared. |
| `forced-tempo` | Seize the initiative through signals, direct command, speed, or material abandonment. | Creates facts quickly but gives posts a direction to block. |
| `distributed-cover` | Divide information, provisions, routes, or authority across smaller channels. | Reduces a single point of failure but consumes reserve and coordination. |

A method is a strategic reading of an authored choice, not a moral alignment, historical fact, pressure kind, or player personality score. It cannot be assigned at runtime by generated text.

## Selection rule

```text
count the method on every recorded choice
  → if fewer than two choices have been observed: unresolved pattern
  → find the highest method count
  → if two or more methods tie for highest: unresolved pattern
  → otherwise prepare the countermeasure for the unique leading method
```

Selection uses only history that already exists before the current choice. It does not inspect the pending choice, seed, locale, ending, or hidden resource. The UI shows all three counts, the prepared countermeasure, its target, exact effect and the tie/change-method counterplay.

## Countermeasure table

| Read ID | Target | Effect only on a match | Strategic reading |
| --- | --- | --- | --- |
| `unresolved-pattern` | none | none | Reports do not yet support one prepared answer. |
| `witness-chain` | `witnessed-compact` | +3 Exposure | Posts compare names and public commitments. |
| `relay-block` | `forced-tempo` | +1 Exposure, −3 Momentum | Neighboring posts prepare to interrupt the expected direction and signal. |
| `channel-squeeze` | `distributed-cover` | +2 Exposure, −2 Grain | Patrols pressure several small channels, forcing detours and reserve use. |

Every effect is bounded to the same 0–100 resource space and cannot benefit the player. A nonmatching choice receives no method-read effect. The prepared read remains visible in the consequence and decision record whether it hits or misses, so changing method is acknowledged as an intentional success rather than silently treated as zero.

## Chapter I assignment

| Method | Choices |
| --- | --- |
| `witnessed-compact` | `read-the-names`, `issue-grain-tallies`, `declare-great-chu`, `release-oldest`, `families-first`, `root-in-villages` |
| `forced-tempo` | `take-the-beacon`, `cut-the-carts`, `race-for-chen` |
| `distributed-cover` | `hide-the-register`, `voluntary-pots`, `extinguish-and-move`, `turn-the-courier`, `repair-the-ford`, `send-two-envoys` |

Assignments are reviewed authored metadata. Validation requires every choice to have exactly one known method, every method to occur, and every countermeasure to be both selectable and capable of hitting on at least one legal exhaustive route.

## Resolution order

```text
position before commitment
  → select and disclose pursuit posture from current Exposure
  → select and disclose method read from prior decisions
  → apply player action
  → apply authored choice pressure
  → apply pursuit posture
  → apply method-read effects only when the chosen method matches its target
  → apply disclosed seed-selected field condition
  → check capture/scattering and otherwise advance
```

Each layer clamps before the next one. Action, authored pressure, pursuit, method read and field condition remain separate in the consequence and record. Web and Unity must use this exact ordering.

## Save and replay

Save format 5 records the choice method, prepared read ID, whether it matched, actual method-read deltas and resources after the layer. Loading rebuilds state from the decision history and rejects a current-format record whose method, read or match identity disagrees with deterministic replay.

Versions 1–3 retain their original action → pressure → field outcomes. Version 4 retains action → pressure → pursuit → field. `legacyDecisionCount` preserves the pre-pursuit boundary and `preMethodReadDecisionCount` preserves the pre-method-read boundary. Only new decisions receive the v5 layer; prior choices may inform the next visible read without rewriting their stored outcomes. Unknown future formats fail closed.

## Fairness and historical boundaries

- No runtime randomness, machine learning, telemetry, difficulty scaling or secret weight affects the read.
- A tie is intentionally unresolved; deterministic array order never breaks it in Qin's favor.
- Every choice card names its method and whether the current read will hit it.
- Changing method has no hidden penalty and can force a tie on the next turn.
- Method-read effects alter resources only. They cannot create routes, requirements, source claims, dialogue, flags or endings.
- Method titles and countermeasures are labeled dramatic reconstruction wherever the system is explained.
- A later revision may add decay or competing institutions only after it provides equally legible counterplay and migration evidence.

## Release evidence

- Schema/content validation: known method IDs, unique counter IDs, bounded adverse effects, target closure, authored text and reachability/hit coverage.
- Engine tests: unique leader, minimum observation count, tie behavior, match/miss application, five-layer ordering and v1–v5 replay/tamper rejection.
- Web tests: method/count disclosure, per-choice hit/miss forecast, resolution and decision-record persistence, keyboard/modal isolation and save-v5 reload.
- Unity: matching selection/application, preflight closure, immediate-mode presentation and EditMode source tests.
- Visible QA: a route that creates `witness-chain`, one matching choice with +3 Exposure, one changed-method miss, mobile fit, RTL direction, 320-pixel reflow, actual 400% browser zoom and zero console/network errors.
