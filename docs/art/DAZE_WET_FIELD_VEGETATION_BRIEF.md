# SHI Daze wet-field vegetation brief

Status: production vegetation blockout contract · Daze Village rain-pressure setting · not a botanical or archaeological reconstruction.

## Production problem

The accepted wet field, command shelter and rain now establish weather and scale, but the full `24 × 24 m` field remains a uniformly open surface. That makes the terrain read as a stage and removes the near-ground silhouettes that make wind, waterlogging and maintained human space legible. This gate adds a restrained peripheral vegetation layer without hiding the council, inventing a surveyed Daze landscape or turning the command scene into a decorative garden.

## Historical boundary

- The sources support a late-Qin rural route and the project supports a dramatic rain reconstruction; they do **not** identify an exact plant community at Daze in 209 BCE.
- Assets are therefore named by visible form only: `field stalk clump` and `low blade tuft`. They make no exact species, season, crop, marsh, medicinal-use or cultivation claim.
- Placement, counts, bend, color and wind response are project-authored cinematic design. The in-engine disclosure must remain `GENERIC RAIN-FLATTENED FIELD-EDGE FORMS · NOT AN EXACT BOTANICAL RECONSTRUCTION · PRODUCTION VEGETATION BLOCKOUT`.
- No flowers, grain heads, distinctive modern ornamental forms, writing, baskets, cut sheaves or false agricultural evidence.

## Asset contract

Two identity-root static meshes share one texture-free material:

1. `SM_SHI_FieldStalkClump_01`: an irregular, open clump of narrow upright and rain-bent stalks; reference height no more than `135 cm`.
2. `SM_SHI_LowBladeTuft_01`: a low radial tuft of flattened narrow blades; reference height no more than `52 cm`.

Each mesh requires:

- LOD0 and a materially reduced LOD1;
- UV0 plus non-overlapping lightmap UV1;
- one corner-domain vertex-color layer named `ShiPlantWind`, with alpha fixed near zero at the rooted edge and reaching one only at free tips;
- one material slot named `M_SHI_RainDarkenedFieldPlant`;
- applied identity transform, no collision receipt, no animation, no armature and no texture dependency;
- Nanite deliberately off: the geometry and instance counts are too small to justify it.

The source is deterministic Blender geometry. Crossed and angled ribbons are accepted as a production blockout technique only after clean GLB/FBX round-trip inspection proves topology, material, UV, color and bounds.

## Material and wind contract

- Opaque, two-sided, default-lit, nonmetallic plant surfaces; dark olive-brown at rooted edges, slightly cooler/desaturated toward tips.
- Broad roughness and low specular response. No saturated emerald, translucent plastic, wet mirror, noisy camouflage, source texture, normal map or emissive edge.
- `ShiPlantWind.A` is the only deformation mask. A deterministic material graph applies a low-frequency sine offset in one reviewed horizontal direction.
- Reviewed defaults: `WindSpeed = 0.38`, `WindAmplitude = 2.4 cm`, direction `(1.0, 0.35, 0.0)`. No vertical lift, random storm thrashing, collision response, audio coupling or CPU per-instance tick.
- Wind is presentation only and may not enter save data, simulation authority, input, engagement calculation or replication.

## Placement and clearance contract

- One identity-root actor owns exactly `42` stalk-clump instances and `64` low-tuft instances (`106` total) from seed `0x5EED20A`.
- Every root stays inside the wet-field footprint with a `75 cm` edge margin: `X/Y ∈ [-1125, 1125] cm`.
- The shelter and command work area remain clear through an expanded central exclusion rectangle: `|X| > 520 cm` **or** `|Y| > 440 cm` for every root.
- A readable approach corridor remains open: reject roots inside `|Y - 0.28X| < 115 cm` when `|X| < 1000 cm`.
- Stalk scale is bounded to `[0.72, 1.06]`; low-tuft scale to `[0.70, 1.12]`. Z comes from the admitted wet-field presentation plane and remains `-7.6 cm` for this blockout; the plants do not pretend to conform to every authored rut.
- Instances are deterministic, static after construction and never added or removed in play. Hierarchical instancing, fixed cull distances, no collision/overlap/navigation, no decals and no dynamic shadows are required.
- The peripheral layer remains visible during council and Broken Crossing engagement. It must not intercept pointer rays, occlude the dialogue focus figures, cover engagement markers, enter the shelter footprint or alter the accepted camera transforms.

## Runtime fail-closed contract

Before spawn, validate exact asset/material paths, disclosure, identity transform, counts, seed, placement bounds, exclusion tests, scale envelopes, wind parameters and presentation-only flags. At runtime, reject missing assets, wrong mesh bounds, wrong material slots, count drift or a generated root outside the admitted region.

The vegetation actor cannot replicate, tick, receive player input, serialize state, affect navigation, generate overlap events or enable collision. Its material is the only motion mechanism.

## Rejection list

Reject species certainty, a crop field, ornamental repetition, a wall of reeds, waist-high vegetation beside the speaker lens, roots under the shelter, route blockage, floating blades, obvious card intersections, neon green, wind synchronized like a metronome, more than the fixed instance budget, CPU sway, interactive harvesting, fabricated historical claims, or a beauty render that fails the packaged council and engagement paths.

## Acceptance path

1. deterministic Blender source and oblique/profile preview;
2. clean GLB/FBX round trip with exact topology, LOD, UV, vertex-mask, material and bounds receipts;
3. isolated Unreal mesh import and exact texture-free material graph admission;
4. native positive and hostile-drift tests, plus deterministic placement receipts;
5. fresh compile, package and headless smoke;
6. isolated noVNC vegetation-review camera, normal council and Broken Crossing progression/return;
7. fresh physical-display performance and unchanged save receipt;
8. provenance, evidence and milestone documentation before commit/push.

This pass closes field-edge silhouette, clearance and bounded wind behavior only. It does not claim final vegetation art, production characters, formation silhouettes, sky treatment or final lighting.
