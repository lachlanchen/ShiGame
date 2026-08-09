# Opposition posture system

Status: implementation contract · 2026-08-09 · owner: systems design

## Player problem

An isolated choice response explains what one order exposes, but it does not make the pursuing Qin administration feel like a persistent actor. SHI needs an opponent that reads the player's accumulated position, changes the next decision, and remains fair enough to plan against. It must not pretend that a precise patrol timetable is an attested fact.

Chapter I therefore models **Qin pursuit posture** as dramatic reconstruction. The posture is selected from the player's Exposure before commitment, shown with exact mechanical effects and a specific counterplay hint, then applied after the choice's authored pressure response. The player can see the danger threshold approaching and deliberately reshape the position.

## Chapter I posture table

| ID | Exposure before commitment | Effect | Strategic reading |
| --- | ---: | --- | --- |
| `scattered-watch` | 0–54 | none | Posts are alert but reports have not formed a usable cordon. |
| `road-search` | 55–74 | +2 Exposure | Patrols compare routes and witnesses; break signals or reduce exposure before the next order. |
| `closing-cordon` | 75–99 | +4 Exposure, −1 Grain | Search and blocked roads now reinforce each other; accept a slower recovery move or risk capture. |

The bands cover every playable Exposure value exactly once. They do not overlap, leave a gap, alter routes, invent a named person, or conceal a modifier.

## Resolution order

```text
position before commitment
  → select and disclose posture from current Exposure
  → apply player action
  → apply the disclosed answer to a carried commitment, when present
  → apply the choice's authored pressure response
  → apply the disclosed pursuit posture
  → apply the separately disclosed strategic-method read when it matches
  → apply the disclosed seed-selected field condition
  → check capture/scattering and otherwise advance
```

Each layer is clamped to `0–100` before the next layer. The consequence banner and decision record keep action, commitment answer, pressure, pursuit, method-read and field effects distinct. This is the same contract in TypeScript and C#; commitment selection is specified in [Player commitment memory](PLAYER_COMMITMENT_MEMORY.md), and method selection in [Opposition method read](OPPOSITION_METHOD_READ.md).

## Fairness and historical boundaries

- The current posture, exact modifier and actionable counterplay are visible before commitment.
- Posture depends only on the already-visible Exposure resource. It has no runtime randomness and cannot inspect the player's pending choice.
- Field conditions still use the chronicle seed; pursuit does not reroll or mutate them.
- All posture prose is labeled dramatic reconstruction. It describes a systemic response that is plausible within the researched late-Qin setting, not an attested event or quotation.
- An opponent effect may alter resources only. It cannot branch the story, change requirements, create claims, or generate text at runtime.
- A campaign revision must preserve full 0–99 band coverage and at least one reachable instance of every authored posture.

## Save and replay

Save format `6` continues to record the selected posture ID, its effects, and the resources after pursuit. Loading treats decision history as authority and replays every recorded decision. Version-4 through v6 history is rejected if its recorded posture no longer matches the pre-commit position.

Versions 1–3 remain playable through `legacyDecisionCount`: decisions already present in an older save replay under their original action → pressure → field rules, so an update cannot silently rewrite a player's resources or ending. Version-4 decisions keep their pursuit layer through `preMethodReadDecisionCount`; version-5 decisions keep their method-read layer through `preCommitmentDecisionCount`; only later decisions receive commitment establishment or answers. Unknown future versions fail closed.

## Validation and release evidence

- The content validator proves bounded effect direction, exact 0–99 coverage, unique IDs, required bilingual copy, dramatic-reconstruction classification and reachability of every posture.
- Exhaustive field-condition traversal currently produces 689 successful routes and 87 capture/scattering routes, with no deadlock, all three conclusions intact and every method counter selectable and hittable.
- Unit and integration tests cover ordering, escalation, records, localization keys, save migration and tamper rejection.
- Visible QA must show opening disclosure, escalation into `road-search`, the exact pursuit delta, persistence after reload, decision-record disclosure, mobile/reflow behavior, non-color identification and no duplicate commitment while the result is open.

## Future scope

This is the smallest persistent-opponent model, not the final AI. Later chapters may add named institutions, incomplete intelligence, competing commands and spatial patrol behavior only after their historical claims and player counterplay are reviewed. The system should become more expressive through readable state and motives, not hidden difficulty scaling.
