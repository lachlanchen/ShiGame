# Unreal consequence-cinema contract

Status: bounded motion/lens grammar is integrated into the fail-closed transaction and canonical council staging; official UE 5.8.1 compilation and native automation pass. PIE motion/input/handoff/failure review and packaged-build review remain open.

## Purpose

An issued order should feel consequential without turning the deterministic campaign into an unskippable cutscene or hiding the result behind spectacle. Unreal therefore prepares each resolution as a short, data-bound camera sentence over the command space. Gameplay remains owned by the campaign session, but commit is transactional: a copied session resolves, the live-world snapshot and camera sentence build and independently revalidate, runtime actor closure and the candidate save pass, and only then does the active chronicle advance and presentation begin.

## Stable beat grammar

| Order | Beat | Required | World focus | Lens | Authored time |
| --- | --- | --- | --- | --- | --- |
| 1 | Order resolved | yes | resource with the largest actual choice delta; final site if no resource changed | 44° | 0.34 s arrival + 0.22 s hold |
| 2 | Oath established/answered | only when this order establishes or answers an oath | live oath signal | 48° | 0.32 s + 0.24 s |
| 3 | Exposed answer | yes | resource with the largest actual pressure delta; Exposure if none changed | 40° | 0.32 s + 0.22 s |
| 4 | Qin response | yes | live pursuit signal | 52° | 0.36 s + 0.24 s |
| 5 | Method read | yes | live method-read signal | 43° | 0.32 s + 0.20 s |
| 6 | Field | yes | live field signal | 54° | 0.32 s + 0.20 s |
| 7 | Position | yes | authoritative post-order site | 58° | 0.44 s + 0.34 s |

The sequence is 3.52 seconds without an oath beat and 4.08 seconds with one. The first shot always cuts because the preceding player inspection is deliberately unconstrained. Every later shot eases only when the exact camera targets are no more than 100 Unreal units and 6° apart; a farther move becomes a cut while preserving the same total reading time. Validation recomputes this decision from world transforms and rejects motion authorship or the fixed 40°–58° lens grammar if either drifts. It also rejects any sequence over five seconds, any reordered or relabeled layer, a missing required layer, duplicate identity, unsafe shot timing, an unbound world focus or a final site that differs from the campaign position.

## State and truth boundaries

- `FShiCampaignSession` remains the only owner of gameplay mutation. Camera planning cannot append history, alter resources, change completion/failure or issue another order.
- Every displayed delta comes from the resolution record's actual intermediate snapshots/effect layers, including resource clamping. Authored nominal effects are not trusted as the observed result.
- The final five resources must agree simultaneously across session state, `Resolution.Record.After` and the live resource signals before a plan is accepted.
- The final beat always focuses the current campaign site. Only the supported terminal states `captured` and `scattered` may use a lost-position label, and only after completion.
- Field, pursuit, method-read and oath remain project-authored dramatic reconstruction/game-system state. The sequence creates no historical claim and packages no private source or quotation.
- Planning is part of the [fail-closed order transaction](UNREAL_ORDER_TRANSACTION.md). A rejected rule/world/council/cinema candidate cannot replace a previously accepted transaction; runtime preflight additionally requires the camera, all nine command actors, every planned focus actor and both initialized [council figure slots](UNREAL_COUNCIL_STAGING.md) before the candidate save or active state can advance.

## Control and presentation

During a consequence sequence, exactly one site or signal carries selected scale/color/stencil feedback. Slate names the current beat and exact detail, states that the gameplay result is already resolved and that presentation cannot change the chronicle, and exposes a dedicated skip control. Natural completion, `Space`, `Escape` or Gamepad B skip all hand control to the exact canonical next speaker at the validated 44° council lens. `Home` remains the explicit non-mutating return to current ground.

The command surface exposes **Camera motion · restrained** / **Reduced motion · cuts only** through its button, `V`, or the standard-gamepad Menu button. The preference is stored separately in Unreal's user settings. Cuts-only applies to council/site/signal inspection, every consequence shot and the final speaker handoff; it preserves each consequence beat's reading time and semantic lens rather than shortening or deleting information. Enabling it during an ordinary eased inspection completes that move immediately. The control is isolated during evidence and consequence modes and does not wake an armed audio preference.

All other pointer, keyboard, controller, evidence, order, restart and mixer commands are blocked at both the visible-control and GameMode command boundaries until the sequence completes or is skipped. The semantic outcome cue and camera start occur only after a healthy-persistence candidate has been durably written and committed; explicitly labeled unsaved-preview play remains the sole persistence exception.

## Acceptance

`SHI.Cinematic.ResolutionGrammarV1` authors native tests for canonical order, oath establishment, neutral method read, exact final position, the five-second ceiling, non-mutation, focus closure, first-shot cut, bounded near-target ease, fixed semantic lenses, hostile motion/lens drift, timing/order/layer attacks, terminal capture, resource drift and atomic failure. `SHI.Cinematic.CouncilStagingV1` separately proves the post-sequence named speaker, disclosure, blocking and lens. `SHI.Campaign.OrderTransactionV1` attacks cinematic and council drift inside the complete rule/world/save boundary. `SHI.Campaign.CrossEngineReplayV1` prepares, independently revalidates and commits the complete transaction after every turn of all 46 fixed-seed golden routes, including six terminal failure routes.

Repository preflight, the detached clean build, the official Unreal 5.8.1 compiler and the exact native consequence/campaign suites pass. Acceptance still requires visible PIE mouse/keyboard/gamepad traversal, natural completion and mid-beat skip capture, camera/Slate legibility and motion review, complete-route observation, performance capture and a clean packaged Linux launch.
