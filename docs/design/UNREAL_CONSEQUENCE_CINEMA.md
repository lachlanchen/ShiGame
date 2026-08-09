# Unreal consequence-cinema contract

Status: source-authored at implementation `d7df7b6081adeed88a3108ad19218cd661fc2376`; native compilation, automation execution, PIE motion/input review and packaged-build review remain open.

## Purpose

An issued order should feel consequential without turning the deterministic campaign into an unskippable cutscene or hiding the result behind spectacle. Unreal therefore presents each completed resolution as a short, data-bound camera sentence over the command space. Gameplay, history and saving are outside this presentation layer: the campaign session resolves first, the live world snapshot rebuilds from that result, and only then may the camera sequence begin.

## Stable beat grammar

| Order | Beat | Required | World focus | Authored time |
| --- | --- | --- | --- | --- |
| 1 | Order resolved | yes | resource with the largest actual choice delta; final site if no resource changed | 0.34 s transition + 0.22 s hold |
| 2 | Oath established/answered | only when this order establishes or answers an oath | live oath signal | 0.32 s + 0.24 s |
| 3 | Exposed answer | yes | resource with the largest actual pressure delta; Exposure if none changed | 0.32 s + 0.22 s |
| 4 | Qin response | yes | live pursuit signal | 0.36 s + 0.24 s |
| 5 | Method read | yes | live method-read signal | 0.32 s + 0.20 s |
| 6 | Field | yes | live field signal | 0.32 s + 0.20 s |
| 7 | Position | yes | authoritative post-order site | 0.44 s + 0.34 s |

The sequence is 3.52 seconds without an oath beat and 4.08 seconds with one. Validation rejects any sequence over five seconds, any reordered or relabeled layer, a missing required layer, duplicate identity, unsafe shot timing, an unbound world focus or a final site that differs from the campaign position.

## State and truth boundaries

- `FShiCampaignSession` remains the only owner of gameplay mutation. Camera planning cannot append history, alter resources, change completion/failure or issue another order.
- Every displayed delta comes from the resolution record's actual intermediate snapshots/effect layers, including resource clamping. Authored nominal effects are not trusted as the observed result.
- The final five resources must agree simultaneously across session state, `Resolution.Record.After` and the live resource signals before a plan is accepted.
- The final beat always focuses the current campaign site. Only the supported terminal states `captured` and `scattered` may use a lost-position label, and only after completion.
- Field, pursuit, method-read and oath remain project-authored dramatic reconstruction/game-system state. The sequence creates no historical claim and packages no private source or quotation.
- Planning is atomic. A rejected candidate cannot replace a previously accepted plan, and runtime startup additionally requires a live actor for every planned focus.

## Control and presentation

During a consequence sequence, exactly one site or signal carries selected scale/color/stencil feedback. Slate names the current beat and exact detail, states that the gameplay result is already resolved and that presentation cannot change the chronicle, and exposes a dedicated skip control. `Space`, `Escape` or Gamepad B skips the entire sequence and returns immediately to the exact current-site camera.

All other pointer, keyboard, controller, evidence, order, restart and mixer commands are blocked at both the visible-control and GameMode command boundaries until the sequence completes or is skipped. Audio may have already emitted the semantic outcome cue, but cinema neither assumes nor claims that a local autosave succeeded; save status remains separately visible.

## Acceptance

`SHI.Cinematic.ResolutionGrammarV1` authors native tests for canonical order, oath establishment, neutral method read, exact final position, the five-second ceiling, non-mutation, focus closure, timing/order/layer attacks, terminal capture, resource drift and atomic failure. `SHI.Campaign.CrossEngineReplayV1` also builds a post-order world snapshot and consequence plan after every turn of all 46 fixed-seed golden routes, including six terminal failure routes.

The repository preflight and the exact detached clean build pass at the implementation above. This is source evidence, not native proof. Acceptance still requires the official Unreal 5.8 compiler, both native suites executing, visible PIE mouse/keyboard/gamepad traversal, natural completion and mid-beat skip capture, camera/Slate legibility and motion review, complete-route observation, performance capture and a clean packaged Linux launch.
