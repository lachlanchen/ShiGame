# Council motion-film review

Development engineering checkpoint, 2026-10-01. No shipping asset admission.

The previous goal turn inspected the project but did not change implementation
or deliver a verified wait. This checkpoint executes the next safe action rather
than repeating the cinematic plan.

## Named scene and result

The upcoming Daze/Chen council presentation needs consistent, readable character
performance. The existing keeper carrier and measured-speaker action now have a
repeatable, source-preserving low-resolution movie inspection path. Blender
4.5.12 LTS rendered 48 frames at 640×360, resampled from the unchanged 30 fps
action; H.264 encoding produces a silent four-second movie. The validator checks
all frame hashes, all 121 source landmark samples, unchanged source/script
identity, movie dimensions/rate/count/duration, absence of audio, and a complete
decode. Both sampled feet have zero displacement.

This removes uncertainty about the bounded Blender-to-movie export path. It
does **not** complete council footage, add a playable scene or replace game text.
Unused generated output is not counted as finished game content.

## Visual review decision

Inspected source frame 46 (render index 18) and the eight-frame contact sheet.
The full figure remains in frame. The arm silhouette is reference-like, the
garment geometry is conspicuously blocky, and the small gesture is weakly readable
at this framing. The sampled stationary feet do not prove weight or natural
acting. No hand–prop contact, facial performance, weather, council geography or
historical costume fidelity is demonstrated here.

**Reject for narrative integration and public release.** Keep this private movie
as engineering evidence. The next production task is a relaxed arm pose and
readable council gesture, with costume deformation review, followed by a genuine
temporal performance review and scene staging. Do not upscale or dress this
blockout with music to disguise those defects. The existing score candidate stays
separate and needs listening acceptance.

The model/action remain original SHI engineering work using the previously
recorded CC0 carrier provenance in
`assets/provenance/shi-daze-council-performance-v1.json`. No neural generation,
private portrait, new historical claim, paid service or public deployment occurs.

## Reproduction

Use the existing shared installation, not a duplicate SDK. Output must be a new
directory; the renderer fails rather than overwrite an existing review.

```bash
/home/lachlan/.local/share/shi-tools/blender-4.5.12-linux-x64/blender \
  --background --disable-autoexec --threads 2 \
  assets/3d/rendered/shi-daze-council-performance-v1.blend \
  --python scripts/render-council-motion-film.py -- \
  --output .runtime/council-motion-film-20261001
ffmpeg -nostdin -v error -framerate 12 \
  -i .runtime/council-motion-film-20261001/frame-%03d.png \
  -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -movflags +faststart \
  .runtime/council-motion-film-20261001/speaker-study.mp4
node scripts/validate-council-motion-film.mjs
```

Renderer session 13883 exited 0. Validation exited 0 after correcting the
validator's JavaScript/Python ties-to-even sampling mismatch; source render
sampling was unchanged. Only two threads and one serial job were used. No GUI,
player or noVNC stack was started or retained. Post-run memory: 60 GiB available,
64/71 GiB swap; no SHI Blender process remains. Existing unrelated runtimes and
dirty files were preserved. No game rules, save formats or release build changed.

Private outputs remain under `.runtime/council-motion-film-20261001/`; hashes and
review boundaries are recorded in the companion evidence manifest. Human
temporal review, game integration, native playback and release remain open.
