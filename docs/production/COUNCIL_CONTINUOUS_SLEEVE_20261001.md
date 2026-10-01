# Keeper sleeve deformation checkpoint

The council offering gesture now has a connected elbow sleeve candidate. The
old upper/lower rigid cylinders remain in the study, hidden for comparison;
accepted source assets and the existing performance are unchanged.

Each sleeve has 600 vertices, 576 quads, normalized two-bone weights and two
open boundary loops. A rounded centerline prevents the almost coincident inner
elbow rows found in the first attempt. Across 121 checked poses, all 53 bone
matrices agree exactly with the existing gesture; body basis and weights also
agree. Sampled elbow/cuff clearance is at least 12.23 mm.

The shoulder/armpit fit remains unresolved: global samples still measure
64.86 mm penetration. The maximum local edge change is 1.967 times the rest
length, improved from 6.421 but not evidence of physically credible cloth.
The study does not simulate cloth or check exact triangle/self collisions.
These red results are retained alongside the positive topology checks.

A four-second, 1280×720, 30 fps silent clip contains all 120 rendered movie
frames and passes full decode. Agent inspected selected initial, offer and
return frames. The torso/arm diagnostic camera crops the head; no full-speed
human acting or final costume review is claimed. This is the Keeper blockout,
not the Chen Sheng image identity. Exact hashes and decisions are recorded in
`content/research/council-continuous-sleeve-review.v1.json`.

## Reproduction

Set `SHI_BLENDER_BIN` to the existing verified Blender 4.5.12 installation.
Use a fresh output path; the builder refuses an existing directory:

```bash
"${SHI_BLENDER_BIN:?Set the shared Blender executable}" \
  --background --disable-autoexec --python-exit-code 1 --threads 2 \
  assets/3d/rendered/shi-daze-council-performance-v1.blend \
  --python scripts/build-council-continuous-sleeve-study.py -- \
  --output .runtime/council-continuous-sleeve-review --movie
"${SHI_BLENDER_BIN}" --background --disable-autoexec \
  --python-exit-code 1 --threads 2 \
  --python scripts/test-council-continuous-sleeve.py -- \
  --study .runtime/council-continuous-sleeve-review
ffmpeg -nostdin -n -v error -framerate 30 -start_number 1 \
  -i .runtime/council-continuous-sleeve-review/frame-%03d.png \
  -frames:v 120 -c:v libx264 -threads 2 -preset medium -crf 18 \
  -pix_fmt yuv420p -movflags +faststart \
  .runtime/council-continuous-sleeve-review/keeper-sleeve-motion.mp4
```

The accepted private working study is revision 2. Its four pose images were
reviewed before rendering the saved blend's full movie into a `movie` folder;
that Blender render uses four-digit frame names. Revision 1 remains failed
comparison evidence. No binaries entered Git, engine imports, playback catalog
or release builds. No model weights/SDKs were duplicated and no paid service
was used. All Blender jobs ran serially and exited; no GUI runtime was retained.

Next fit the shoulder join and torso, then review cloth shape and the complete
performance in its council setting before admitting an engine or video asset.
