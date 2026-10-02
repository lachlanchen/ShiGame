# Jinyang: performed orders to a saved outcome

Development checkpoint, 2026-10-02. **G1 remains open.** This is an interactive Unreal motion blockout, not the requested final cinematic game, a packaged beta, or an update to the public mobile stores. The SHI production skill kept this work focused on the full action-to-ending sequence before detailed asset polish.

## Player-visible change

The player can brace defenses, prepare a flood operation or escape route, dispatch missions to Han and Wei, relay their conditional pledges, agree or correct a date, and execute or withdraw. Work parties, a separate envoy and camp forces move in the same scene. The command view shows the agreed operation date alongside each ally's readiness; outcome feedback uses plain language rather than internal IDs.

Thirteen performed orders update one deterministic contract. Han and Wei remain independent: receiving a proposal is not accepting a pledge, and agreeing is not being ready to act. A movie or movement skip cannot repair an invalid plan. Two winning plans have different time, reserve and available-force costs; an early date can be corrected before final commitment.

The estate/career record retains reserves, available remnant, office status, contacted houses, obligations and a **claim** on the settlement. It does not grant measured acreage, minted gold, a new historical office or household partners. Land/office settlement and adult spouse/concubine relationships belong to the following authored chapters. The legacy field `survivingForce` currently represents the remaining commandable force; escort assignments are not a modeled death toll. All numerical units and route geometry are gameplay reconstruction.

## Evidence actually observed

| Route in the Unreal player | Performed ledger | Recorded consequence |
| --- | --- | --- |
| Quiet coordination | brace → diversion → quiet Han → quiet Wei → relay → aligned date → execute | Window 14; reserves 21; available force 100; Zhao command; settlement claim; Han/Wei contacts and obligations |
| Prepared withdrawal | escape → withdraw | Window 2; reserves 36; remnant 60; displaced command; no land claim |
| Deadline defeat | diversion → escape → quiet Han → quiet Wei → relay → early date → execute | Window 13 exceeds hold deadline 12; estate force/reserves 0; command lost; prior contacts retained |

These were actual mouse/keyboard orders, not injected ending snapshots. A later repaired build repeated the quiet route. Its cold restart reported seven restored orders and retained the ending, claims and reserves. Save SHA-256 before/after restart: `bbd3fd4c0e5e481aec8241fb1a409ec8e60d96c2ad05f2faf3899a7493e0abbe`.

Pause-to-inspect, skip of the active pledge-relay movement, and cancellation of restart preserved byte-identical committed ledgers. Two-step confirmed restart archived the old route before opening a fresh one. The new save path is separate from every released Qin/Daze save.

![Readable operation and readiness dates](evidence/jinyang-20261002/date-readable.png)

![Development blockout after the coordinated operation — not final art](evidence/jinyang-20261002/victory-blockout.png)

Private recordings include a 65-second envoy review, a withdrawal recording, and a 65-second minimized-interface operation review. The operation visibly advances the participating forces, but movement ends before the recording does. **There is not yet one uninterrupted, unskipped 15–20-minute accepted chapter recording.** Selected frames were reviewed; neither a contact sheet nor these stills qualify final animation.

The first review exposed transparent HUD contrast, camp/building intersections, a worker inside the embankment, and troops crossing floodwater. The successor adds opaque panels, raised movement lanes, offset contact/work points, explicit Han/Wei/Zhi role ordering and separated formation destinations. Observed final formations are on dry terrain. Remaining movement concerns include converging group paths, walking turn snaps, and skipped/resumed work facing/contact.

Audio is **not qualified**. The procedural sound component is wired, but engine-only and isolated-sink captures contained silent PCM despite the in-game setting. The host output was muted; SDL selected that output even with the requested isolated sink. Linking the owned stream to the owned null sink still did not establish audible output. No physical-device mute or shared default was changed. Investigate the actual mixer/capture path once; no Musia audition or soundtrack integration is claimed.

## Shared authority and validation

- Contract: `content/encounters/jinyang.v1.json`, explicitly development/reconstruction, source-linked to Tongjian volume 1 and Shiji volume 43. The local original/supplied translation authority is preserved privately.
- Reference model: `packages/game-core/src/jinyang-encounter.ts`; C++ port: `ShiJinyangModel`. Persistence stores the exact mechanical fingerprint and performed-order ledger, then derives the estate by replay.
- Golden fixture: seven routes, 52 complete-state checkpoints. C++ compares every field and replays each prefix; malformed/missing geography is rejected before scene construction.
- `npm run validate`: passed, including TypeScript, 105 core tests, 416 web tests, existing release/save compatibility, source/content, audio-contract, accessibility and repository checks. New Jinyang semantic/conformance checks are part of this command. Existing web accessibility checks do not qualify this new Unreal interface.
- UE 5.8.1 Linux SHIEditor build: succeeded after spatial/readability repairs. Native `SHI.Jinyang.PerformedOrderParity`: Success. Its process exits 1 because Linux's forced `TestExit` calls `_exit(1)`, as checked in the installed engine source; no clean exit-0 claim.
- Existing released campaign hash remains `0144569248b6`. New contract copies match across web, Unity and Unreal; that does not mean Jinyang is playable in the web/Unity/native-mobile clients.

## Reproduce the development scene

Use the verified shared Unreal installation; do not duplicate it. Synchronize content, build SHIEditor, then run:

```bash
npm run sync:content
npm run validate:jinyang
node scripts/launch-jinyang-review.mjs
```

The launcher defaults to the verified shared workstation installation; set `SHI_UNREAL_ROOT` for another UE 5.8.1 installation. It uses the engine Entry map with `/Script/SHI.ShiJinyangGameMode`, a separate chronicle, one isolated display and localhost-only review ports. If another SHI review is running, reuse it; do not launch a duplicate. Ctrl-C owns exact player/desktop cleanup. This is an editor-backed development player, not an installer.

Select a site and use its buttons or 1–4. Tab cycles sites; Space pauses; Escape skips movement or cancels restart; H hides the interface; M controls sound. Site-button position currently moves with the panel height, which still needs usability repair. Source inspection does not advance strategic time.

Inspect a real ledger without changing it:

```bash
npx vite-node scripts/inspect-jinyang-save.ts --save PATH
```

## Next bounded work

Do not restart design or expand to a new volume. First stabilize the interaction/presentation loop: fixed navigation, exact skipped/resumed endpoints, meaningful ally response staging, and verified provisional audio. Record one full start-to-ending route and a materially different replay at normal pacing. Only then qualify G1 and proceed to original consistent Blender casting, Musia themes and low-resolution reference-locked LocalVideoGen/MiniMax shots for G2.

Novice understanding, final period-specific art, dialogue/performance, 15–20-minute pacing, formal encounter schema, full localization/RTL, measured frame times, physical-device tests and new signed beta delivery remain unmet. All review players and their GUI stacks were closed after evidence capture; the temporary owned audio sink was removed. No paid generation, store upload or public rollout occurred.
