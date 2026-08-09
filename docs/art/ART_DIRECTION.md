# Art direction and asset review

## Visual thesis

SHI should feel like wet earth, worked wood, oxidized bronze, ink, fire seen at distance, and information impressed into matter. It is neither museum beige nor fantasy imperial gold.

## Palette

- Charcoal/ink: structure and negative space.
- Clay and dark wood: the material world.
- Aged bronze: action, focus and institutional value.
- Cinnabar: irreversible commitment, danger and seal marks.
- Muted river jade: water, uncertainty and network flow.

## Composition

- Use large calm fields around a small number of high-information objects.
- Build hierarchy through light, spacing and material contrast before ornament.
- Maps are instruments, not wallpaper.
- Motion should convey rain, breath, signal, or changing control; never add particles merely to make a screen “game-like.”
- Chinese characters are meaningful marks, not exotic texture.

## Historical images

Concept art can establish mood but cannot serve as reconstruction evidence. Clothing, armor, towers, lamps, slips, vehicles, settlements, weapons and crops require item-level review. Any final marketing image with identifiable historical objects needs an art-history checklist and named reviewer.

## Current reviewed assets

| Asset | Status | Decision |
| --- | --- | --- |
| `daze-village-rain-v1.png` | Approved for pre-alpha | First revision rejected for a glass-pane lantern; corrected to an earthenware oil lamp. Not reconstruction evidence. |
| `shi-daze-wartable-v1` | Approved as pre-alpha blockout | First render rejected for gray studio floor, loose framing and low exposure. Revision 2 passes silhouette/palette; not final environment art. |
| `broken-crossing-command-space-v1.png` | Approved for look development | Initial generation rejected because a red cylinder read as a modern canister; the accepted revision replaces only it with an irregular fired-clay disk. The table → crossing → pursuit sentence, tactile palette and modular layers pass. Historical-specialist and 3D translation review remain required. |
| `shi-command-weight-v1` | Approved runtime-presented Unreal production blockout with authored materials; not final art | The neural precursor was rejected. Deterministic Blender GLB/FBX LODs pass scale, naming, two-material, two-UV, collision, manifold, winding and fallback-color gates. Unreal 5.8.1 preserves those contracts, adds compile-clean authored blockout stone/bronze graphs, exact contact/clearance/44° placement and development-only front/back review, force-cooks all three assets into a clean-launching 499-package archive, and visibly advances the story to Act II. The white BasicShape surface, proxy figures/terrain/formations, final physical performance and human review remain open. It is a fictional signal, not a reconstructed artifact. |

Full machine-readable records live in `assets/provenance/`.

The bounded generation and rejection contract for the Broken Crossing candidate is in [`BROKEN_CROSSING_ENVIRONMENT_BRIEF.md`](BROKEN_CROSSING_ENVIRONMENT_BRIEF.md). Approval means it can guide modular environment, material and lighting work; it does not make any depicted prop a late-Qin fact or approve the bitmap as final marketing art.

Production silhouettes, hand-object actions, face/gaze gates and the exact six council moments are specified in [`COUNCIL_FIGURINE_DIRECTION.md`](COUNCIL_FIGURINE_DIRECTION.md). That contract keeps figurine and cinematic work tied to the authored people and choices instead of admitting attractive but generic character output.

The first usable object produced under that contract is the command weight in [`COMMAND_WEIGHT_PROP_BRIEF.md`](COMMAND_WEIGHT_PROP_BRIEF.md). Its editable source, LODs, collision, Blender inspection views, authored Unreal materials, council/front/back/runtime frames and machine validation are recorded under `assets/3d/`, `apps/unreal/Content/SHI/Art/Props/CommandWeight/`, `assets/provenance/shi-command-weight-v1.json`, `docs/production/evidence/unreal-command-weight-import-status.json` and `docs/production/evidence/unreal-command-weight-presentation-status.json`. “Approved runtime-presented engine production blockout” closes scale/LOD/UV/material-slot/collision/material-graph/contact/clearance/lens/cook/launch admission only; it does not waive final surface, character, environment, physical-performance, cinematic or final-art gates.

## Generation rules

1. Write a bounded art brief tied to a game need.
2. Preserve prompt/tool/date and all reference rights.
3. Reject text artifacts, anachronism, visual plagiarism, inconsistent anatomy/materials, or unclear provenance.
4. Compare against the art bible and historical checklist at full resolution.
5. Mark use as blockout, in-game, marketing, or rejected.
6. Keep generated source separate from final composited/retouched work.
7. Never treat a model's confidence as review.

Xiaoyunque/LALACHAN video may be used for approved trailers, chapter animatics or atmospheric reference. It is paid generation: show cost, mode and prompt plan and receive explicit approval before submission.

## 3D standards

- Meters in engine; named objects and materials; origin/pivot conventions documented.
- GLB as web/tool interchange, FBX as the current Unreal static-mesh import path, `.blend` and scene JSON as editable source.
- Validate mesh count, normals, scale, material assignment and round-trip import.
- LODs, collision, lightmap UVs, texture channel packing and draw-call budgets are mandatory before production approval.
