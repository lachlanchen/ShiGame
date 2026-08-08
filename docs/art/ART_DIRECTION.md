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

Full machine-readable records live in `assets/provenance/`.

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
- GLB as web/tool interchange, FBX as current Unity interchange, `.blend` and scene JSON as editable source.
- Validate mesh count, normals, scale, material assignment and round-trip import.
- LODs, collision, lightmap UVs, texture channel packing and draw-call budgets are mandatory before production approval.
