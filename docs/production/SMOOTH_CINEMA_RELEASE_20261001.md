# Smooth cinema and checkpoint publication

October 1, 2026. Owner requests regular GitHub and internal-test upgrades,
with a smooth, astonishing playable experience. This is a quality contract,
not a claim that final cinematic quality or new store delivery is achieved.

## What the player should feel

Keep one coherent chain: inspect an order → deliberately commit → save it
durably → see the matching consequence → continue into the next playable scene.
Never choose for the player, replay a cost on resume, or replace an established
character's fate to make a prettier shot. The Tongjian spine governs historical
claims; alternate outcomes and reconstructed dialogue remain labeled.

Review one bounded scene at a time. Keep cast/face, costume, weather, prop custody,
lighting and music motif consistent across cuts. Preserve readable subtitles,
pause, skip, consent and reduced motion. If media is unavailable, the same
consequence must remain playable as readable text, without a black-screen wait.
Do not swap today's functioning scene for an unloaded successor.

## Research applied to SHI

[OpenAI's Astra game workflow](https://learn.chatgpt.com/blog/how-to-build-games-with-astra)
uses repeatable scenes, exposed state/render counters, real-control journey
tests and visual review. It distinguishes software-rendered timing from GPU
performance. Apply that separation here: measure transition frames, draw calls,
asset readiness and input-to-response latency on the actual target device;
do not present a headless pass or an isolated Blender frame as smooth gameplay.

[Epic's mobile optimization overview](https://dev.epicgames.com/documentation/unreal-engine/performance-and-optimization-for-mobile-in-unreal-engine)
provides device profiles, profiling, PSO caching, instancing and animation
budgeting. These inform the Unreal lane; they are not a reason to replace
the owner's native SwiftUI iOS app with Unreal or a browser wrapper.

For the next playable scene review, target 60 FPS where supported and report
p50/p95/p99 frame intervals plus frames above 50 ms, with hardware, resolution,
thermal state and motion setting. A proposed fallback budget is p95 ≤33.3 ms;
this is a target, not a measured result. Compare identical routes before/after.
Test normal and reduced motion, background/foreground, cold resume during a
reaction, failed media loading and upgrade without erasing the prior save.

## Publication cadence and current boundary

GitHub: publish meaningful validated checkpoints, not every rejected render.
Internal betas: batch user-visible improvements; qualify each platform separately.
Retain existing owner-only groups, price/territories and production associations.
No unattended daily scheduler is installed. Record immutable source/artifact
hashes, test results and exact provider states for each upgrade.

[Apple upload documentation](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds)
describes delivery; an upload is not proof of TestFlight availability. Confirm
processing, internal-group association and tester access after upload.

Today's read-only App Store Connect query returned only build 1, VALID and not
expired, with no next page. The signing host lists the distribution identity,
but its existing keychain reports `User interaction is not allowed`. Owner
unlock/authorization is needed before another signing attempt. No password,
private key, keychain ACL or store production state was changed; no beta uploaded.

The clean publication checkout revealed broken draft links and obsolete source
equality checks. Repair the links without publishing private/uncommitted drafts.
Keep the original eight historical compiled-source hashes immutable: the two
changed receipt entries were checked against commit `e0074c4`, not rehashed to
pretend a newer package was compiled. Current Unreal source still requires its
own build/runtime qualification. Validate the actual atomic UTF-8 save helper
instead of requiring a superseded `ForceUTF8WithoutBOM` token in GameMode.

Eleven README summaries are synchronized and distinguish released mobile build
1 from draft continuation and unfinished character/media studies. A bounded
history audit inspected 207 commits / 1,714 distinct blobs: no forbidden private
paths or tested private-key/GitHub-token/API-key patterns were found. This is
not an exhaustive security certification. Dependency installation reported five
moderate advisories; no forced or unreviewed dependency upgrades were applied.

The dirty main development checkout is preserved. This publication uses an
isolated worktree; do not blanket-stage the inherited Unreal/cinematic work.
The pending attached-trim study remains unadmitted and is not release material.
