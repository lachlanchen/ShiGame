# SHI Daze council performance blockout brief

Status: implementation gate · 2026-08-10 · shared-skeleton body performance only

## Purpose

The first council-character checkpoint proved five distinct skeletal identities in the packaged Unreal story, but the neutral reference pose is not a performance. This gate adds two restrained, reusable body clips to the exact admitted 53-bone skeleton so a listening participant and the current speaker no longer read as mannequins.

This is a performance blockout, not final acting. It must prove clean shoulder, elbow, wrist, neck, torso and finger deformation; stable looping; zero root motion; exact engine reuse; and readable wide/medium council framing. It does not authorize lip sync, facial acting, weapon handling, heroic gesturing, interaction contact, historically specific etiquette or promotional cinema.

## Authored clips

| Clip | Runtime role | Duration | Intent | Prohibited read |
| --- | --- | ---: | --- | --- |
| `attentive-idle` | non-speaking Keeper/listener | 4.0 s loop at 30 fps | quiet breath, small weight response and restrained head attention | sleep sway, military guard idle, synchronized crowd motion |
| `speaker-measured` | current council speaker | 4.0 s loop at 30 fps | contained forward intention and one open-hand emphasis that settles fully | pointing command, weapon draw, fist salute, victory pose |

Both clips begin and end on an identical sample, keep the authored `Root` stationary, contain no morph target, facial, cloth, hair, camera, audio, event or gameplay track, and may drive only the existing council presentation component. The campaign, choice, save, engagement, collision, navigation and replication systems remain authoritative and unchanged.

## Motion limits

- Exact source rate: 30 fps, frames 1–121 inclusive, 4.0 seconds between first and last sample. Clean interchange may losslessly reduce an unchanged translation/scale curve to its two identical endpoints; every changing curve retains all 121 samples.
- Exact skeleton: `SK_SHI_DazeCouncil_Skeleton`, 53 existing bones, no added control, IK, socket or leaf bones.
- `Root` translation and rotation remain identity at every sample. Pelvis translation remains zero; body intention comes from bounded local rotation only.
- Torso and head authored rotations stay within 4 degrees per local axis; arm/wrist rotations stay within 16 degrees; finger rotations stay within 10 degrees.
- Speaker hand displacement must be visible but contained: at least 3 cm and no more than 18 cm from the first sample. Listener hand displacement must remain below 6 cm.
- Start/end transforms must close within numerical tolerance for every bone. Sampled mesh vertices must remain finite and every evaluated triangle must retain nonzero area.
- No animation may move the figure's actor transform, change the existing x100 presentation scale or create root motion.

## Admission and fallback

Unreal may play a clip only after exact object path, exact shared skeleton, 4-second duration, 30 fps/121-sample boundary, no root motion, and role mapping pass. `speaker` receives only `speaker-measured`; the listening `keeper` slot receives only `attentive-idle`. Unknown roles, assets or skeletons fail closed.

If a valid skeletal character exists but its exact performance clip is unavailable or drifts, the character remains visible in the known-good reference pose and carries an explicit performance-fallback tag. It must never borrow the other role's clip, disappear, gain gameplay authority or pretend the animation is admitted.

## Review gates

1. deterministic editable Blender source plus clean FBX and GLB animation round trips;
2. machine report for exact skeleton, samples, duration, root closure, bounded motion and finite deformation;
3. neutral-gray source renders at attentive and emphasis samples, checking shoulder, elbow, wrist, fingers, garment penetration and silhouette;
4. isolated Unreal import with exact shared-skeleton binding and immutable asset receipts;
5. native hostile tests for path, role, sample, duration, root-motion, authority and fallback drift;
6. clean package/cook and headless smoke;
7. visible packaged review at multiple animation phases plus a real input-driven story transaction;
8. human character-animation, historical/cultural, cinematic, accessibility and physical-display review before final performance status.

The red gates remain: generic faces are not portraits; broad layers are not exact 209 BCE costume; these loops are not reconstructed historical etiquette; facial performance, speech, interaction hands, cloth/hair response, authored LODs, final formations and close cinema remain open.
