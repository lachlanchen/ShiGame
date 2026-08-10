# SHI Daze council facial-performance engineering brief

Status: source and clean-interchange engineering gate · 2026-08-10 · not final acting, lip sync, voice or close-dialogue approval

## Purpose

The admitted Chapter I council figures share a 53-bone body skeleton and two restrained body-performance loops, but their generic faces cannot yet carry the council direction's regard, interruption, silent pressure or held breath. This gate adds a bounded facial and eye deformation payload to all five canonical character exports without changing story truth, participant identity, body-animation authority or gameplay.

The asset is deliberately a facial-performance **engineering blockout**. It proves an exact morph vocabulary, independently deforming brown-eye geometry, deterministic target poses and clean FBX/GLB interchange. It does not claim a historical likeness, a finished face, natural speech, transcript synchronization, final cultural performance or a camera-ready cinematic close-up.

Runtime disclosure:

`FACIAL PERFORMANCE ENGINEERING BLOCKOUT · SILENT INTENT CADENCE · GENERIC NON-PORTRAIT FACE · NOT FINAL ACTING, LIP SYNC OR VOICE`

## Identity, skeleton and authority boundary

- The canonical export order remains `keeper`, `chen-sheng`, `wu-guang`, `yu-mu`, `qin-courier`.
- Every export uses the existing `SK_SHI_DazeCouncil_Skeleton` rest pose and its exact 53 bones. This gate adds no face bone, control bone, socket, root motion, animation clip or actor transform.
- The body mesh exposes exactly the 21 controls below. The separate 96-vertex eye mesh exposes exactly the eight gaze controls below. Garment, hair and role-prop meshes expose no morph target.
- Facial values are presentation only. They cannot change campaign state, dialogue text, choice availability, engagement, collision, navigation, save data, replication or speaker identity.
- A missing character, wrong skeleton, missing or extra morph, non-finite value, wrong object path or unknown state fails closed to the admitted neutral/reference presentation. It must not borrow another role's asset or silently substitute a differently named control.

## Exact morph contract

The body mesh must contain exactly these 21 case-sensitive names, with no aliasing or prefix repair:

| Group | Exact controls |
| --- | --- |
| eyelids | `eyeBlinkLeft`, `eyeBlinkRight` |
| gaze support on face | `eyeLookDownLeft`, `eyeLookDownRight`, `eyeLookInLeft`, `eyeLookInRight`, `eyeLookOutLeft`, `eyeLookOutRight`, `eyeLookUpLeft`, `eyeLookUpRight` |
| brow | `browInnerUp`, `browDownLeft`, `browDownRight` |
| cheek | `cheekSquintLeft`, `cheekSquintRight` |
| jaw and mouth | `jawOpen`, `mouthFunnel`, `mouthPressLeft`, `mouthPressRight`, `mouthUpperUpLeft`, `mouthUpperUpRight` |

The separate eye mesh must contain exactly the following eight case-sensitive controls and no eyelid, brow, cheek, jaw or mouth control:

`eyeLookDownLeft`, `eyeLookDownRight`, `eyeLookInLeft`, `eyeLookInRight`, `eyeLookOutLeft`, `eyeLookOutRight`, `eyeLookUpLeft`, `eyeLookUpRight`.

The duplicated gaze names intentionally move compatible face/eyelid support topology and the separate eye geometry together. Runtime must apply the same gaze value to both meshes; it may not drive only the iris/eye geometry or only the surrounding face.

## Deterministic silent-intent target poses

Each row is a complete target pose. Every omitted control is exactly `0.0`. Listed values are bounded maxima, not phonemes, emotion labels or a transcript timeline.

| State | Exact nonzero weights | Engineering intent |
| --- | --- | --- |
| `neutral` | none | Rest/return pose; blocking and camera placement, not a morph, own the Keeper eyeline. |
| `blink` | `eyeBlinkLeft = 0.82`; `eyeBlinkRight = 0.82` | Bilateral eyelid closure test without a random blink layer. |
| `object-glance` | `eyeLookOutLeft = 0.18`; `eyeLookInRight = 0.18` | One bounded lateral glance toward scene evidence; not autonomous eye wandering. |
| `interrupted-return` | `browInnerUp = 0.12`; `mouthPressLeft = 0.06`; `mouthPressRight = 0.06`; `cheekSquintLeft = 0.04`; `cheekSquintRight = 0.04` | Gaze controls return to zero while restrained interruption remains readable. |
| `silent-speech` | `jawOpen = 0.28`; `mouthFunnel = 0.10`; `mouthUpperUpLeft = 0.06`; `mouthUpperUpRight = 0.06` | Silent speech-intent deformation test only; not lip sync, viseme output or authored words. |
| `held-breath` | `browDownLeft = 0.05`; `browDownRight = 0.05`; `cheekSquintLeft = 0.08`; `cheekSquintRight = 0.08`; `mouthPressLeft = 0.16`; `mouthPressRight = 0.16` | Closed-mouth pressure/held-breath test without generic agitation noise. |

A runtime cadence may interpolate only `neutral → one named target → neutral`, clamped between zero and the listed values. Selection and phase must derive from an authored scene/role clock or explicit story beat, never a random number, audio amplitude, generated emotion classifier or hidden transcript. It must reset every one of the 21 controls before applying the selected target, so stale values cannot accumulate. Until a later review admits layering, two named target poses cannot be combined.

Reduced-motion presentation preserves the same informational order with cuts or held target poses and suppresses repeated mouth/eye cycling. It cannot remove the object/evidence beat or make the face the only carrier of information.

## Engineering review gates

### Neutral

- all 21 body controls and all eight eye controls resolve to zero;
- five identities retain the exact shared skeleton, rest pose, bounds, silhouette layers and role shapes;
- brown-eye texture resolves locally with no browser, network or private-file dependency;
- no face or eye mesh gains gameplay collision or authority.

### Blink

- both eyelids respond to the exact `0.82` target and return to neutral without a residual value;
- the cornea cannot visibly pierce the lid, and the lid cannot tear into the brow or cheek at the admitted medium development camera;
- a fixed authored blink event is required; procedural random blinking is not admitted.

### Object glance

- the face-support and eye meshes receive the same two `0.18` gaze values;
- the eye remains inside the lid volume and the glance remains legible without an exaggerated head snap;
- the target object and enough ground/context remain in frame. The state cannot become ambient eye noise.

### Interrupted return

- every gaze control is zero while the five listed brow, mouth and cheek weights are exact;
- the eye line returns to the blocking-defined Keeper direction, with no stale object-glance weight;
- the state reads as restrained interrupted intent, not surprise comedy or villainous suspicion.

### Silent speech intent

- jaw, lips and upper-mouth topology remain finite and do not tear at the exact bounded weights;
- no audio, voice, dialogue string, phoneme, viseme or subtitle timing is consumed or inferred;
- authored text and its dramatization/source disclosure remain independently authoritative;
- the gray/unresolved inner mouth cannot be framed or lit as finished anatomy.

### Held breath

- cheek, brow and bilateral mouth press remain symmetric at the exact weights and return fully to neutral;
- the state contains no jaw opening or gaze motion;
- body breath, neck response and facial pressure must be reviewed together before the pose may support close dialogue.

## Source, rights and historical boundary

- Blender `4.5.12 LTS` and MPFB `2.0.17` at commit `80919fa4682335c41847f761a4d79dcad4124732` are offline authoring tools. MPFB program code is GPL-3.0-or-later and is not shipped in the game.
- The inherited MakeHuman system basemesh/`game_engine` rig, official Faceunits 01 targets, low-poly eye geometry/material and brown-eye texture are CC0 inputs. The exact archive/source hashes and the scope of embedded license evidence are recorded in `assets/provenance/shi-daze-council-facial-performance-v1.json`.
- The tracked eye PNG is the exact CC0 source texture, not neural or hand-painted historical evidence. CC0 rights do not establish anatomical, ethnic, cultural or period accuracy.
- SHI authors the bounded target selection, weights, scripts, generic clay material treatment, character layers, exports, renders and review contract. No community character, private portrait, neural model, mocap, voice, transcript or private-book payload enters this asset.
- Chen Sheng and Wu Guang remain historical participants represented by a shared generic non-portrait blockout. The Keeper, Aunt Yu and Courier Han remain fictional/dramatized roles. No face in this set is evidence for how a named person looked.

## Accepted engineering evidence and open red gates

The current machine evidence accepts deterministic editable source, five FBX and five GLB exports, exact canonical IDs, one shared 53-bone rest pose, exact body/eye morph sets, bounded topology/material/weight checks, a local 1024×1024 brown-eye payload, source review renders and clean-FBX neutral/blink/gaze/silent-speech renders. This is an interchange and deformation-engineering acceptance only.

Cross-format morph amplitude is explicitly proven rather than inferred from whole-character bounds. Blender's clean FBX import represents world bounds as a centimetre payload under an armature transform, while its mesh and shape-key coordinates are already metre-valued; GLB bounds and morph coordinates are metre-valued. The validator compares every admitted body and eye target for every character against source, FBX and GLB values at `0.000005 m` tolerance. The observed maximum absolute error is `0.000000011284961771475255 m`. For example, source/FBX `jawOpen` is `0.038738342036593244 m`, GLB is `0.038738349549518714 m`, and `eyeLookInLeft` is `0.005825805689479947 m` in all three. GLB vertex splitting makes changed-vertex count equality invalid, so amplitude—not raw split-vertex count—is the cross-format invariant.

These gates remain **red**:

- Unreal import, exact morph admission, deterministic runtime state sequencing, hostile drift tests, cook/package, headless smoke and visible input-driven story review;
- final portrait/anatomy and identity variation, retopology review, facial asymmetry and culturally informed human performance direction;
- teeth, tongue, final inner mouth, eyebrows, eyelashes, final skin/eye/hair/cloth/wet materials and cinematic lighting response;
- corneal aim, eyelid contact, jaw/lip/cheek/neck deformation reviewed at normal speed for every one of the five characters;
- authored interaction hands, object contact, cloth/hair response, LODs and measured performance budgets;
- final close-dialogue or marketing framing;
- lip sync, phoneme/viseme timing, voice, pronunciation, loudness and the full eleven-locale human listening/subtitle coexistence matrix;
- human character-animation, historical/cultural, cinematic, accessibility, reduced-motion and physical-display acceptance.

No attractive still, successful import, machine pass or source license turns this engineering blockout into final acting. Close dialogue remains prohibited until the facial, gaze, neck, mouth, voice/accessibility and human-review gates in `COUNCIL_FIGURINE_DIRECTION.md` are deliberately closed.
