# Local video route: worldwide-release gate

Checked 2026-10-01 while the sole native QA job was running. This is a production
admission decision, not finished game footage or legal clearance.

## Existing LocalVideoGen route

The sibling README describes MiniMax H3 and a default two-second 864×480 preview.
Its MIT application licence does not establish rights for model-generated
assets. The [publisher's H3 licence](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/LICENSE)
was read directly, not inferred from a repository badge:

- Definition I.5 excludes the EU, UK, Republic of Korea and USA.
- Grant II is territorially limited. V.4 explicitly covers outputs, including
  their distribution and display outside the permitted territory.
- VI.4's disclaimer of ownership over generated outputs does not remove V.4.

Engineering decision: **do not admit H3 footage into SHI's all-eligible-markets
release under this licence alone**. Written applicable permission or another
qualified route is needed. Do not silently narrow the game's territories or
assume generation in Hong Kong resolves output distribution. No permission
request, payment or generation was made during this check.

## Alternative to qualify, not an installed solution

The official [Wan2.2 TI2V-5B model card](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B)
identifies its models as Apache 2.0; the [official repository licence](https://github.com/Wan-Video/Wan2.2/blob/main/LICENSE.txt)
provides the corresponding terms. The publisher documents single-4090 inference
with CPU/model offload and a 24 GB VRAM requirement. These claims are not a local
benchmark or proof of dependency/output clearance.

No Wan checkpoint was found in the inspected LocalVideoGen ComfyUI model tree.
This is a bounded directory check, not an inventory of every shared machine.
No model, SDK, environment or adapter was downloaded or modified. Before choosing
it, locate an existing shared install, pin exact weights/code and dependency
terms, verify reference-image rights, and qualify identity/motion with a small
scene-bound preview. Do not present a publisher demonstration as SHI footage.

## Concrete next scene and constraints

The rain/council opening already has a private consistent-image/Musia animatic;
it is not generated character motion. Its next moving shot must preserve the
approved face reference, costume, weather and screen direction, then return to
the unchanged playable decision. Review hands, face drift, repeated frames and
camera continuity at preview resolution before spending on final rendering.

Continue the existing original Blender performance lane while the generated
video route is qualified. Its shoulder seam remains a separate measured blocker;
do not substitute unreviewed AI footage to conceal it. Musia cues retain their
own listening and commercial-asset review gates.

Observed workstation GPUs: two RTX 4090 D, 24,564 MiB each; at the read-only probe
604 MiB and 4,570 MiB were in use. That is not an exclusive resource reservation.
The native route test remained the sole SHI heavy job; no video inference started
and no foreign service was stopped. Recheck resources and ownership when it is
actually time to generate. This gate changes the next production action, not the
definition of a complete cinematic game.
