# Council outcome preview checkpoint

The final council decision now previews its coalition outcome before the player
commits. This makes the existing logistics, trust and authority trade-offs easier
to read without changing the deterministic rules or revealing a new historical
claim. The preview uses the existing authored outcome title and the same resolver
as the committed decision. Selecting alternatives must not write a save.

## Scope and evidence

- Web regression checks select every available final offer from a deferred-title,
  joint-ledger council and verify the displayed outcome, unchanged saved bytes,
  and matching outcome after commitment.
- The checks cover all eleven locale selections. Council narrative is currently
  English and Simplified Chinese only; the other nine select English fallback.
  This is not eleven-language narrative completion or visual/RTL qualification.
- The historical-source ledger is loaded separately to reduce startup payload.
  Repository validation now recomposes that slice along with the other deferred
  slices, preserving exact canonical campaign equality. A unit test also asserts
  complete recomposition; existing tests check source references and node parity.
- A matching native SwiftUI presentation edit remains in the development
  worktree, pending native source reconciliation, compilation and device review.
  It is not part of this web source checkpoint or an uploaded iOS beta.

## Release boundaries and remaining review

No campaign text, rule, fingerprint or save format changed. No new image, film or
music was admitted. The live Apple 1.0.0 release and retained Android candidate 5
are unchanged; neither contains this preview. This checkpoint does not authorize
or claim a new upload.

`npm run validate` passed: repository/content checks, native content export,
cross-client conformance (77 council routes and 231 turns), type checks, 34 core
tests and 117 web tests. This does not compile native iOS or Unreal binaries.
Device
and screenshot review remain pending; local heavy runtimes are held while swap
usage exceeds the shared-workstation limit. Existing unrelated edits and runtime
services are preserved. Next qualification needs a complete final council route,
mobile layout and focus review, and native/web parity on the same saved choices.
