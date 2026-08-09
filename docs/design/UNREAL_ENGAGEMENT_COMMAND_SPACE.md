# Unreal Broken Crossing command space

## Product boundary

The Broken Crossing exercise is SHI's first native three-pulse battlefield command layer. It makes the player set a main effort, react to changing ground and decide how to break contact without turning the campaign into an isolated combat minigame. The selected campaign choice supplies the plan; the campaign's already disclosed field condition supplies the disturbance. The exercise then resolves only encounter-local state.

This slice is deliberately non-authoritative. It may preview campaign effects, but it may not change campaign resources, history, node, condition or save data. Campaign migration requires a later reviewed transaction design and new cross-engine fixtures.

## Deterministic contract

`FShiEngagementModel` loads the byte-identical shared v1 payload. `FShiEngagementSession` initializes from only a plan ID and condition ID, exposes legal commands for the current pulse, applies the player's bounded effect before the authored field response, chooses the first matching ordered outcome and exports replay data. Replay reconstructs the complete position from plan, condition and three command IDs and rejects record, response, metric, outcome or campaign-preview drift.

The shared matrix contains:

- three campaign plans and two field conditions;
- three sequential pulses and nine authored commands;
- six local 0–100 metrics;
- four ordered outcomes;
- 76 legal terminal routes, of which 47 are success or costly success.

Every command and outcome is reachable, every nonterminal position has counterplay and at least two plans remain viable under each condition. Native automation traverses the same exact route matrix as Web and rebuilds the six-piece 3D state at every visited position.

## Runtime authority guard

Opening the exercise exports the active `FShiCampaignSession` save JSON and retains the exact bytes in memory. Before every pulse and before close, GameMode exports the campaign again and requires exact equality. A mismatch sets a visible fail-closed error and refuses to continue or close as if the preview were valid.

Each pulse resolves on a copied engagement session. The candidate metrics and all six live actors must be representable before the accepted engagement state is replaced. The campaign session is never passed to the engagement resolver, and the exercise never writes the campaign save. Visible testing additionally compares the on-disk save SHA-256 before the first pulse, after the outcome and after close.

## Spatial and interaction grammar

`FShiEngagementSignalModel` maps the six metrics in stable order to cone, cylinder, sphere, cube, cone and sphere silhouettes. Stable labels, shapes, locations and custom-depth stencil values keep identity independent of color. Height is a bounded pure function of the exact 0–100 value, every piece remains anchored to the table surface and pointer centers stay at least 64 Unreal units apart.

When the exercise opens, ordinary site, campaign-signal and council actors are hidden and have collision disabled. The engagement camera composes the six-piece formation into the unobstructed right 45% of the 1400×900 reference frame; the filled Slate surface occupies the left 55%. Closing reverses both visibility and collision and returns to the canonical council shot.

Controls share one command path:

- `X` or Gamepad X opens the exercise when the selected Broken Crossing plan is legal;
- Left/Right or D-pad selects a legal pulse order;
- Enter or Gamepad A issues the selected pulse;
- `X`, Escape, Gamepad X or Gamepad B closes and returns to the unchanged campaign.

Slate names the plan, main effort, withdrawal condition, field signal, current pulse objective, all six exact metrics, legal order intent/effects, the last player effect, the later authored response and the terminal campaign-effect preview. It repeats the non-authoritative and byte-guarded status at the mutation boundary rather than relying on documentation alone.

## Acceptance evidence and remaining gates

Official Unreal 5.8.1 compiles and links the implementation. The exact native engagement test and all eleven `SHI.` suites pass. The production repository build also passes 57 TypeScript/UI tests and the Web budgets.

A localhost-only noVNC session visibly completed a mixed three-order route to **Costly success · Crossing under pressure**. All six pieces were simultaneously visible after a framing correction, the UI showed each player effect before its authored field answer, and the save hash remained identical before play, at outcome and after close.

The fixed-window Vulkan standalone player is stable with rendering threads disabled on this host. Editor PIE is still red: the first visible PIE attempt reached the real command space, then NVIDIA userspace failed on an outdated Vulkan swapchain and crashed in `libnvidia-glcore.so.595.84`. Linux packaging, normal threaded rendering, performance capture, physical-controller review, native audio listening, final environment/formation art and observed human playability remain open.
