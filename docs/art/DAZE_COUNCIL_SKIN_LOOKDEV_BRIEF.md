# SHI Daze council skin look-development brief

Status: active component plan · 2026-08-10 · no generated skin admitted · not final character art or close-camera approval

## Purpose and boundary

The accepted Daze council facial package proves shared-skeleton deformation and deterministic silent intent, but all five characters still use one flat clay skin material and essentially one generic face. This brief defines a reversible route from that engineering blockout to physically coherent, identity-specific skin without overwriting accepted evidence, fabricating historical likenesses or mistaking an attractive generated image for a game-ready material.

The first slice is deliberately **Chen Sheng only**. It must prove source → deterministic PBR reconstruction → isolated Unreal import → package → watched material review before the material system is offered to the other four characters. The current `SkinClay` material and five accepted facial meshes remain the fail-closed baseline.

Codex image generation may create reviewed visual references and low-amplitude color ideas. It may not author an authoritative face, UV atlas, normal, roughness, ambient occlusion, specular, subsurface or thickness map. No generated candidate is currently approved or tracked as a public asset.

## Exact current technical state

- Each character's body section has `26,756` triangles. A clean FBX import has `13,380` body vertices; a clean GLB import has `14,517` split render vertices. Across the five GLBs, the raw float32 `TEXCOORD_0` accessor bytes are identical, SHA-256 `f60fd8442a4fd04bb090f467838786d200fea99432d99a205eca74c846ef1ab6`, and all values are bounded inside `[0,1]`. The GLB has no UV1 or tangent attribute; no current receipt establishes a final production tangent basis for the FBX/Unreal lane.
- The shared low-poly eyes have `172` triangles and `96` clean-import vertices. Across the five GLBs, the raw float32 eye `TEXCOORD_0` accessor bytes are identical, SHA-256 `49b51c0219c603cb20be3710fbee262f564090b0e34e6129910b056365c6ae66`. The tracked CC0 1024×1024 brown-eye image is the only current bitmap texture in this facial-character lane.
- Procedural garments, bindings, hair cap/knot and role-prop meshes have no UV channel. Skin may advance independently; those surfaces cannot quietly inherit this texture milestone.
- The inherited whole-body UV gives the face approximately `470×519` pixels of a 2048 map. This can support medium-close material development, not a film-close hero face. Film-close work later requires a reviewed head-specific topology/UV/material allocation rather than simply enlarging the whole-body map.
- All five roles currently share opaque Default-Lit `M_SHI_Character_SkinClay`, with a constant base color and no skin albedo, normal, roughness, AO, specular, cavity, thickness or detail map. The accepted engineering package deliberately keeps mouth interior, teeth, tongue, brows, lashes, final hair and final character identity red.
- The exact 53-bone hierarchy, 21 facial controls, participant mapping and accepted package receipts defined by [`DAZE_COUNCIL_FACIAL_PERFORMANCE_BRIEF.md`](DAZE_COUNCIL_FACIAL_PERFORMANCE_BRIEF.md) remain authoritative. Skin work cannot alter gameplay, collision, story, save data, skeleton or morph weights.

## Historical and cultural casting contract

The primary histories support the late-Qin Daze conscript crisis and Chen Sheng/Wu Guang as participants. They do not preserve an exact portrait, complexion, ancestry, age, scar, grooming pattern, fatigue mark or skin response for any SHI character. The Keeper, Aunt Yu, Courier Han, the private council and their exact circumstances remain authored reconstruction. A license-clean source or generated output establishes neither historical nor anatomical truth.

Skin and face decisions are dramatic casting choices and must be labeled as such. The five-person group should show credible individual variation in complexion, undertone, facial proportions, age cues, asymmetry and small marks, but must not project one homogeneous “ancient Chinese” face or a modern ethnic taxonomy onto 209 BCE. Complexion may never encode rank, loyalty, intelligence, competence, virtue, villainy, fear or poverty.

| Role | Safe authored direction | Reject |
| --- | --- | --- |
| Keeper | indeterminate working adult; quiet observational presence; light hand/forearm wear; broad player identification | hard-coded sex, chosen-hero beauty, privileged complexion or scholar refinement shorthand |
| Chen Sheng | seasoned working adult under travel/rain pressure; grounded presence through posture, gaze and blocking | emperor hindsight, square-jaw hero coding, heroic scars or darker-skin labor shorthand |
| Wu Guang | adult identity distinct through silhouette, rhythm and individual asymmetry | younger-sidekick coding, permanent anger lines, weapon/scar shorthand |
| Aunt Yu | mature, vigorous household authority; direct regard; work cues expressed especially in hands | bent or haggard elder, saintly mother, mystical healer, porcelain beautification or suffering-villager coding |
| Courier Han | adult traveler; subtle wind/rain/strap/sleeplessness cues; fear performed through breath, eyes and posture | pale cowardice, narrow/sly “spy face,” sweating caricature or reduced agency |

Weather and labor are scene-driven layers. Sun/wind response, callus, pressure, water film, chafing and mud must be anatomically and occupationally coherent and separately controllable; do not bake wet highlights, directional soot or “poor person dirt” into identity albedo. Missing teeth, brands, battle scars, disease, starvation, bruises or severe lesions require a named story need and specialist/human review.

The source and adaptation boundaries in [`SOURCE_POLICY.md`](../history/SOURCE_POLICY.md), [`CHAPTER_01_RESEARCH.md`](../history/CHAPTER_01_RESEARCH.md), [`COUNCIL_FIGURINE_DIRECTION.md`](COUNCIL_FIGURINE_DIRECTION.md) and [`DAZE_COUNCIL_CHARACTER_BLOCKOUT_BRIEF.md`](DAZE_COUNCIL_CHARACTER_BLOCKOUT_BRIEF.md) remain in force.

## Image-generation contract

### Admitted use

- Generate one role or one anatomy-free material idea at a time under neutral illumination, with explicit non-portrait and non-historical-evidence language.
- Prefer two or three adjacent casting/look variants over a single purportedly “correct” face.
- Record tool/mode/date, full prompt, input and output hashes/bytes/dimensions/color profile, intended use, rights uncertainty, rejection reasons and human decision.
- Keep raw output outside Git. Only a reviewed full-resolution candidate may enter a tracked `assets/art/lookdev/` lane with provenance; only deliberately reconstructed and validated derivatives may enter a shipping texture lane.
- Use a generated image only for restrained visual reference or low-amplitude chroma. Preserve identity through reviewed geometry, rig, acting and art direction.

### Prohibited use

- Do not project a generated portrait directly onto the accepted body or call it a UV texture.
- Do not derive tangent normal, roughness, AO, specular, cavity, thickness or subsurface channels from generated luminance.
- Do not claim an exact likeness, phenotype, age, ethnicity, complexion, scar or medical condition for Chen Sheng, Wu Guang or any late-Qin person.
- Do not imitate a real actor, famous artwork or unrecorded private portrait.
- Do not admit baked shadows/highlights, beauty grading, modern cosmetics, facial piercing, tattoo, glamor grime, text/watermark, identity drift between views or unstable anatomy.
- Do not upscale an output and claim that interpolation created authentic pore detail.

## Reversible asset lane

The first asset ID is `shi-daze-council-skin-lookdev-v1`. It uses an isolated engine path such as `/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1` and may override only Chen Sheng's `SkinClay` slot in an explicit development review mode. Inspect-only is the default; creation/replacement requires an explicit environment gate. Removing the isolated lane must restore the accepted baseline without changing any existing mesh, material, skeleton or evidence hash.

### Small proof texture tier

| Payload | Initial tier | Color/encoding | Authority |
| --- | --- | --- | --- |
| whole-body base color | 2048², non-tiling UV0 | sRGB on; BC7-quality engine path; no baked lighting/AO/specular | reviewed color design plus deterministic cleanup |
| packed material mask | 2048², non-tiling UV0 | linear; R=weak geometry-baked AO, G=roughness, B=thickness/SSS, A=approved cavity or unused | geometry bake and calibrated procedural authoring |
| canonical detail height | 1024² seamless, 16-bit linear source | source of truth for engine-specific normals | independently authored/procedural; not generated-image luminance |
| detail normal | 1024² repeating | linear BC5; Unreal/DirectX convention explicitly derived from canonical height | deterministic build output |

Base/mask islands require `16–32` pixel dilation and sensible opaque padding for mips. Metallic is exactly zero. AO stays separate from albedo and deliberately weak around deforming eye/mouth regions. Roughness is calibrated independently rather than inferred from color. Specular begins as a bounded scalar. Detail tiling is selected from `16/24/32` repeat tests against measured physical scale and seam visibility, not taste alone.

A 4K whole-body texture is not the film-close answer: it costs roughly four times the 2K memory while leaving face allocation constrained by the inherited UV. The later hero tier should separate a reviewed 4K head map from a 2K body and 1K tiled detail, with explicit Unreal, Unity and Web derivatives under one canonical manifest.

### Unreal material contract

- Create an isolated Subsurface Profile parent with BaseColor, tangent-space Normal, Roughness, AO, bounded Specular and thickness/SSS input; derive role instances only after the parent passes.
- Preserve `SkeletalMesh` and `MorphTargets` usage where the body section requires them. Reject shader repair at package/runtime and any Default Material substitution.
- Before admitting a normal map, prove imported UV-channel count, reproducible finite tangent basis, no degenerate/NaN tangent and the intended green-channel convention. The current exports do not carry tangent attributes, so this is an explicit gate.
- Record exact source/import asset inventory, settings, sizes and SHA-256 receipts. A second inspect-only process must prove saved asset hashes stable.
- No review material gains gameplay authority, dynamic network dependency, uncontrolled shader permutation, per-frame random variation or hidden generated texture.

## Chen Sheng vertical-slice sequence

1. **Target approval:** review two or three identity/look boards under neutral light; select or reject the material intent without claiming portrait accuracy.
2. **Deterministic authoring:** preserve the accepted UV hash; build base color, canonical height, material masks and engine normal with pinned tools/settings; retain editable sources and derivation receipts.
3. **Source validation:** reject clipping/banding, alpha leakage, text/watermark, baked illumination, periodic pattern, edge discontinuity, wrong color-space flags, insufficient gutters and anatomy/identity motifs.
4. **Deformation review:** inspect ears, nose, lips, lids, neck, wrists and fingers in neutral plus all six admitted facial states; reject seams, texture swim, baked-shadow movement or morph tearing.
5. **Engine admission:** explicitly import to the isolated path, bind by material-slot name only, compile shaders, inspect inventory/usage/tangents and prove baseline assets unchanged.
6. **Package exercise:** cook a successor review build, require a positive Chen Sheng skin-route marker, reject missing-material/shader/fallback/fatal signatures and preserve a clean controlled shutdown receipt.
7. **Watched review:** capture front, three-quarter and profile under neutral daylight, warm council fire, cool wet exterior and a high-contrast rim, at gameplay and material-QA distances. Compare exposure levels, SDR/HDR intent, normal/reduced-motion presentation and skin values in grayscale.
8. **Human decision:** character/anatomy, late-Qin material culture, Chinese cultural performance, cinematic lighting/color and accessibility reviewers accept or reject the same in-engine package. Material-QA close views do not authorize narrative close framing.
9. **Scale decision:** only an accepted slice may yield bounded instances for Keeper, Wu Guang, Aunt Yu and Courier Han. Each identity receives its own casting/material review; palette multiplication is not identity design.

## Candidate rubric and hard gates

Score each dimension `0–4`. All hard gates must pass and the total must reach at least `28/36` before an isolated PBR trial; the score never substitutes for named human approval.

1. role truth without stereotype;
2. Chen Sheng remains distinguishable from the other four roles in a same-exposure cast-context board, without relying on complexion alone;
3. age and anatomy coherence;
4. labor/weather plausibility;
5. skin value, color and undertone realism;
6. PBR separability and absence of baked light;
7. exact rig/morph continuity;
8. readability across council lighting and admitted skin values;
9. provenance, rights and review completeness.

Hard rejection applies to identifiable actor/copied portrait; unclear input rights; a historical-likeness or complexion claim; physiognomic morality/class/fear coding; gender/age caricature; baked illumination or weather; anatomy/identity drift; generated text; modern styling; texture seam; morph tear; clipped/invalid channel; unstable Unreal import; Default Material fallback; or an unreviewed output presented as final.

## Film-level red gates

This component cannot close film-level character quality by itself. The current generic face, inherited whole-body face texel density, gray/unresolved mouth, missing teeth/tongue/brows/lashes, hair cap, interaction hands, identity topology, costume, voice/lip synchronization, close framing, acting, final lighting, LOD/performance and human historical/cultural/accessibility review remain red. A still image, shader pass or generated material cannot overrule those gates.

Success for this slice means one honest, reversible, packaged Chen Sheng material candidate that survives deterministic, technical, visual and human review while the game remains playable. It does not mean “final skin,” “historically accurate face” or “film-level character.”
