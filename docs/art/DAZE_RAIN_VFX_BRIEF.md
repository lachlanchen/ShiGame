# SHI Daze rain-VFX brief

Status: production VFX blockout contract · motivated rain around the accepted Daze command shelter · dramatic reconstruction, not evidence of exact weather in 209 BCE.

## Production problem

The accepted wet field and open shelter imply weather but the Unreal scene currently contains no visible precipitation. A generic full-screen rain overlay would flatten depth, ignore the shelter, obscure the command interface and add spectacle without meaning. This increment must make exposure legible: rain occupies the cold field, stops at the roof, leaves the working council volume readable and produces short-lived contact only where the wet ground can receive it.

This asset closes bounded visible precipitation only. It does not approve final storm lighting, cloud/sky, runoff, cloth/skin response, vegetation motion, characters, formations, physical performance or historical weather claims.

## Narrative and gameplay purpose

The rain must communicate three relations without changing rules:

1. the command position is temporarily protected while the road and field remain exposed;
2. distance, supply and pursuit decisions occur under sustained environmental pressure;
3. the tactical exercise shares the same weathered place while remaining non-authoritative over the campaign.

Visible rain is presentation, not hidden simulation. It may never modify resources, outcomes, save data, pointer targets, navigation or collision. The existing opt-in rain audio remains an independent accessibility control; muting sound must not make the authored weather disappear, and changing sound level must not imply a gameplay-weather change.

## Rendering decision

- Use one instanced streak component and one instanced ripple component under a dedicated runtime actor. This keeps the first bounded pass deterministic, shelter-aware, texture-free and independent of copied sample content.
- The reviewed runtime budget is `384` streak instances plus `72` pooled ripple instances: two materials and two instanced draw families, never one actor or component per drop.
- The actor uses original project-authored meshes and materials. It does not copy Niagara samples, Marketplace content, neural textures or third-party model weights.
- Niagara remains an allowed later implementation only if final-scene profiling, scalability or platform work demonstrates a material benefit and the exact shelter exclusion, disclosure and accessibility contracts survive migration.

## Spatial and motion contract

- Identity-root rain actor aligned to the accepted `24 × 24 m` wet-field bounds: `X/Y = ±1,200 cm`.
- Streak spawn ceiling `Z = 1,050 cm`; exposed ground intercept approximately `Z = -5 cm`.
- Reviewed wind velocity `(+130, +45, -1,900) cm/s`, with deterministic per-drop speed, length and width variation inside narrow bounds.
- Shelter exclusion uses the admitted roof footprint `X = ±420 cm`, `Y = ±336.7437 cm` and intercept `Z = 340 cm`. A streak whose center enters this footprint may not render below the roof intercept and may not produce a ground ripple beneath the roof.
- Exposed streaks recycle only after reaching the field. Each exposed impact may activate one pooled ripple for no more than `0.70 s`; ripples expand and recede without collision, light emission or decals.
- Runtime delta time is clamped for visual stability after stalls. The visual state is deterministic from a fixed seed and elapsed time, but it is never serialized because it has no gameplay authority.
- The system remains visible through council, consequence cinema and all three Broken Crossing pulses. Development review may freeze or inspect it but may not change the normal player contract.

## Mesh contract

### Rain streak

- Two crossed camera-independent ribbons aligned along local `Z`, authored at a one-metre reference length.
- Soft vertex-alpha taper at both ends; no texture, collision, thickness extrusion, cast shadow or close-up droplet claim.
- LOD0 no more than `16` triangles; LOD1 no more than `8` triangles; UV0 plus non-overlapping lightmap UV1 even though the translucent unlit material does not bake lighting.

### Ground ripple

- Thin horizontal annulus with vertex-alpha feathering across its radial width.
- LOD0 no more than `400` triangles; LOD1 no more than `120` triangles; UV0 plus non-overlapping lightmap UV1.
- No filled disk, hard white ring, collision, decal authority or emission that reads as magic.

## Material contract

### Streak material

- Texture-free, translucent and unlit with restrained cold gray-blue emissive response and vertex-alpha opacity.
- Per-instance random may vary opacity narrowly; it may not create sparkle, bright white lines or color noise.
- Two-sided only because the crossed ribbons must remain legible from the bounded cameras. No depth-test disable, refraction, normal map or shadow casting.

### Ripple material

- Texture-free, translucent and unlit; vertex alpha and pooled scale carry the contact/readability sentence.
- Darker and less opaque than streaks. No additive neon, foam texture, normal pretence or persistent puddle mark.

## Camera, accessibility and quality contract

- Rain must be visible against the cold field and shelter edge, but the left Slate surface, speaker silhouette, command weight, selected order and field tallies remain readable.
- The protected command volume must visibly contain fewer/no falling streaks below the roof. Rain cannot cut through the reed mat or appear to originate inside the shelter.
- Streaks and ripples provide no exclusive information and never require color discrimination.
- No flash, lightning, abrupt opacity pulse or camera-attached sheet. Reduced-motion mode continues to remove eased camera travel; environmental rain remains bounded ambient motion pending human sensory review.
- The normal review set must include the dedicated rain view, council/story progression, completed engagement and unchanged campaign return.

## Rejection list

Reject any pass that reads as white scratches, star field, snow, sparks, magical particles, screen-space overlay, rain beneath the roof, ripples on the command surface, hard neon rings, synchronized falling rows, visibly repeating grid, opaque rods, excessive UI occlusion, collision authority, per-drop actors, copied sample content, unsupported weather fact or final-film-quality claim.

## Acceptance path

1. deterministic Blender source plus clean streak/ripple GLB/FBX round trips;
2. topology, UV, vertex-alpha, bounds, LOD, material-slot and zero-collision receipts;
3. isolated Unreal import and exact translucent-material inspection with read-only hash preservation;
4. pure presentation-model positive and hostile automation, including roof exclusion and authority checks;
5. stable runtime actor with two instanced components, bounded instance pools and no per-drop allocation after initialization;
6. clean Linux package and headless smoke proving the exact asset delta;
7. visible rain review, normal story progression, complete Broken Crossing and unchanged campaign return;
8. later physical-display performance, photosensitivity/sensory review and human cinematic/art review on the assembled scene.

Approval is deliberately narrow: usable motivated rain production VFX, not final weather, final lighting, an exact historical-weather claim or a substitute for human review.
