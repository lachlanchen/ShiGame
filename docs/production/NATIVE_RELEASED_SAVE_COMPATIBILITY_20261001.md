# Native released-save continuity

October 1, 2026. Fix for the next native candidate; no store upload.

## Player-facing defect and correction

The current native loader required an exact campaign-file hash. Release 1 used
`445974ec77d789adc0bd54b147c924fffd1fc440668f900667b1086341a2ef0c`;
the current file uses
`0144569248b68b056d3d711ec87242a19a13eb3fbe5ede9c4a7cd6a6dd8fba58`.
Consequently, an existing chronicle would be preserved but unplayable after an
upgrade, even though only fourteen English/Chinese dialogue/echo strings changed.

The loader now accepts that exact reviewed earlier revision. It replays the
same choices, seed, resource effects, opposition, promises and endings. Merely
loading does not write a file, acknowledge a reaction or invent tactical orders.
The next explicit order or acknowledgement writes the current hash atomically
through the existing transaction. Unknown revisions, invalid orders and malformed
saves still require recovery. Inputs larger than 2 MB are preserved and rejected
before decoding.

## Evidence, not a broad allowlist

The versioned [compatibility manifest](../../content/compatibility/chapter-01-save-compatibility.v1.json)
records an inverse patch restricted to dialogue and echo text. Validation applies
that patch to the exact current bytes and recovers the **exact released SHA-256**,
not merely an approximate rules projection. All non-prose bytes remain unchanged.
The original reference replay file is also reconstructed by changing only its
campaign hash, yielding its original SHA-256
`7bc8d1ba6692dcf7849acd879b4ad24963c104ccf9aab72f381d0259f95f9e20`.
The historical source is commit `f443d6a5be7ea3bc16bfe1aa39a28dcdbf79d960`,
whose campaign bytes match the retained release-1 receipt. This is not a claim
that this later source commit itself produced store build 1.

Future content changes cannot silently extend this policy. Stale target hashes,
changed rules, changed replay expectations, duplicate patches, non-prose paths
and fabricated previous text fail validation. Runtime policy comes only from the
bundled canonical resource, never from the save. It is bound to the exact current
campaign hash. Missing policy does not block an already-current save but cannot
admit an earlier one. Intermediate unreleased campaign hashes are not admitted.

## Verified scope

- Full local build, 83 core / 390 web tests and deployment budgets passed.
- Four compatibility-verifier tests passed, including deliberate corruption.
- All native source typechecks passed: production, retreat and crossing.
- Generated production/QA project resources were inspected: policy and Swift
  implementation present, replay fixture test-only, preview isolation retained.
- Actual Xcode result: **17 passed, 0 failed, 0 skipped**, comprising five new
  released-chronicle tests and twelve existing aftermath tests. Hosted on the
  isolated crossing QA app in an iPhone SE3 / iOS 26.3.1 x86_64 simulator.
- The new loader test restores all **183 checkpoints across 46 reference routes**
  from recreated release-format saves, compares every recorded turn field and
  final flags/ending, and asserts unchanged saved bytes after loading. Separate
  tests cover unread scenes, stale acknowledgements, first subsequent order,
  current-hash rewrite, cold restoration and preserved invalid/oversized inputs.
- Thirteen Foundation policy checks passed separately; the same runner is added
  to existing macOS CI. All owned simulators were shut down; no GUI retained.

These are recreated save-format tests, not reads of the owner's private saves or
an actual signed store-app upgrade. Physical-device installation, retained app
container upgrade, signing and TestFlight availability remain open. No historical
story text, deterministic rules, tactical save boundary or media admission changed.
See [source and test receipt](evidence/native-released-save-compatibility-20261001.json).
