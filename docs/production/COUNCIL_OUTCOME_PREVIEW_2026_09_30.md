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
- The subsequent native checkpoint compiled and tested the matching SwiftUI
  presentation. Reviewed native campaign/council rules, session, views and
  conformance runners are now versioned; these were existing development sources,
  not newly invented features. Native project/asset packaging reconciliation is
  still pending and no new iOS beta was uploaded.

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

## Native simulator follow-up

The available shared Apple Silicon Mac ran the existing isolated SHI QA project
on its owned iPad Pro 11-inch simulator, iOS 27.0 / Xcode 27.0. All 25 tests passed
(24 unit tests and one complete chapter/council UI route), with no skipped tests.
The UI route checks the final `common-front` preview, commits once, terminates
and relaunches, restores the saved reaction, and reaches the matching conclusion.
First and second rounds must not display a premature outcome preview.

All twelve app/unit/UI Swift files matched local source hashes. Independently
rebuilt Foundation conformance runners passed 77 council routes / 231 turns and
46 chapter fixture routes / 183 turns. These are fixture and simulator checks,
not proof of every possible campaign route or physical-device performance.

Two exported screenshots were inspected: the final offer shows the preview and
commit button without clipping; the conclusion shows the matching title and
support/resource requirements. Private evidence hashes:

- Preview PNG: `26f01e6ff032793cf76f4a5a44269469598d27b6d7494313411a7c0c610841bf`.
- Conclusion PNG: `92bd0688f1b616cd8ddc5eb25e5eee795a49a36fbfd03580dab66d34b85eef7c`.

The test result records one priority-inversion runtime warning; attribution and
performance impact remain unverified. XCTest linking also warns that the test
frameworks target iOS 17 while the project target is 16. This run on iOS 27 does
not establish minimum-OS compatibility. No release approval is inferred.

AgentLink ownership checks kept testing within the existing SHI staging checkout
and simulator. The simulator was already shut down at cleanup, with no remaining
SHI test/build process. Other projects and all signing/store state were untouched.
Physical QA, phone-sized preview review and beta archive/upload remain pending.
