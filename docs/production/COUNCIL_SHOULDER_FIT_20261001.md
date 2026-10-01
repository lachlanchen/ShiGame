# Council shoulder fit: rejected experiments

This is engineering evidence for the keeper's council offering gesture, not a
finished cinematic asset. No game footage, engine export or accepted source asset
was replaced. The connected elbow study remains the better starting point.

## Actual results

Three private variants were rendered in four poses each. Nearest-body projection
is not a reliable garment-fitting method for this shoulder/armpit transition:

| Variant | Method | Measured result | Decision |
| --- | --- | --- | --- |
| v1 | Rest-pose nearest surface and skin-weight transfer | 24.39 mm sampled penetration; 4.484 maximum edge change factor | Reject: rest fitting misses posed intersections and distorts the cloth |
| v2 | Neutral gesture surface mapped to rest geometry | Coincident rest edges; checker failed before a valid deformation report | Reject: projection collapses neighboring garment vertices |
| v3 | Neutral gesture mapping with preserved tangential offset | 46.70 mm sampled penetration; 8.726 maximum edge change factor | Reject: spacing correction still produces unacceptable deformation |

Private studies are `.runtime/council-shoulder-fit-20261001-v1`, `-v2` and `-v3`.
The retained builder reproduces v3, **not** a successful costume. Its source hash is
`653c46ac1f9d8c4c60d19bf17108d10b10bd9987f443fbeeb9354e576974f3c9`.
V3's saved blend hash is
`c02e6abbb2cf5f7a170ab7247b8296e7d1b00a6fc7095b66d2b727cace517939`.

## Verification boundary

The checker now explicitly rejects shoulder candidates with sampled penetration
or a maximum edge change factor above 3. This is a candidate engineering bound,
not a physical fabric model or an art-approval criterion. A passing sampled check
would still not prove exact triangle collision, self-collision or natural acting.
Collapsed rest edges fail independently. `--report` permits a fresh snapshot
without overwriting earlier verification evidence.

For v3, all 53 bone matrices remain identical across 121 frames, and the source
body basis and weights remain unchanged. Elbow/cuff sampled clearance remains
12.23 mm. These preserved invariants do **not** excuse the failed shoulder fit.

Regression on the retained continuous sleeve still passes the elbow checks:
12.23 mm elbow/cuff clearance and 1.967 maximum edge change factor. Its existing
64.86 mm shoulder penetration remains explicitly red. Historical verification
snapshots are preserved rather than relabeled as full costume acceptance.

Final checker SHA:
`c7a386bac070b4452dcc733151e931c7d50bb3e5400ccf7294ac75b4d2d9ef4d`.
The retained sleeve regression exited 0 and wrote
`verification-regression.json` (SHA
`56296d503afbf2175f73dc21b0a06125ca2e3eedc394f298bdc730b645956be7`).
V3 exited 1 **after** writing its numerical `verification-rejection.json`, with
status `rejected-shoulder-fit`; this was the expected admission rejection, not
a missing-input or provenance error. `npm run validate:repo` passed, including
27 story authoring tests. Those tests do not establish costume quality.

## Next production action

Stop repeating independent nearest-surface projection. Construct a coherent
torso-to-sleeve seam with controlled armpit spacing and deformation weights,
then compare the complete gesture against the same source body and rig. Review
the shoulder silhouette and strain before rendering another movie. Do not hide
the numerical problem by cropping or body masking without a separately justified
costume design. Preserve the existing elbow solution while changing the join.

No new book-derived assertions, narrative choices, third-party clothing, music
or generated video were added in this experiment. Body/rig/material provenance
remains in the source performance and character asset manifests. No human
full-speed performance approval, final historical costume approval, store
submission or public release is claimed.
