# First-volume readthrough — editorial checkpoint

Priority: finish the story before cinematic production. This is an agent editorial pass, not human acceptance or proof that every branch has been read.

## Material read

Reviewed the shared opening/crossing narrative, Chen council and Fan Yang dialogue, viewpoint introductions, and all five retreat scenes and endings. Read the rendered retreat transcript for the actual previously tested together itinerary: read-the-names / issue-grain-tallies / repair-the-ford / root-in-villages; defer-title / joint-ledger / one-command; withdrawn; keep-reserve / gather-own / escort-households / carry-records / stay-together. Authoring transcript does not itself validate resources; the earlier visible playthrough supplies that narrower route evidence.

## Diagnosis and revision

The principal line is coherent: public names become promises; promises require provisions and cooperation; military defeat removes the distant authority; the player decides what obligations and people can still be held together. Fan Yang tests whether a promise protects even an unpopular recipient. The ending resolves the local group's form, not the entire Qin collapse.

The two major death reports moved directly into administration. Added two short, original dramatized pauses to `chen-retreat.v1.json`: a grain claimant falls silent at the report of Wu Guang's death; after Chen Sheng's death, the guard handles the already-established broken spear before helping hold down the records. Neither scene depicts the death, invents historical last words, forces the player's emotions, restores companions or changes a decision. The final question still follows the concrete search and custody reports.

The broken spear is introduced before every evacuation choice, so its return does not require a new branch or possession system. The wounded soldier remains in the shelter across the four reception choices; the pause does not assert that A Heng has returned. These details are authored staging, not newly sourced historical claims. Existing Tongjian anchors and external-war boundaries remain unchanged.

## Review result and next work

Read the revised together transcript through its ending. The pauses leave space without adding a eulogy or another mandatory decision. Added regression coverage across all four reception choices: Wu report → pause → question; Chen report → pause → subsequent reports → final question. All 21 authoring tests and 38 retreat component tests pass. This is a prose-only revision; new screenshot/native review is not yet recorded. Preview story fingerprints change, so old development saves retain the existing explicit-restart recovery path.

Remaining editorial concern: explanatory cautions are often embedded in dialogue and narration. Preserve their factual protections, but check with a human reader where repetition harms character voice. Do not silently remove historical boundaries or turn missing people into confirmed deaths. The opening is more aphoristic than the later dialogue; a cross-volume voice pass needs care because the released chapter is hash-bound.

Next is a human-readable complete route packet, using canonical text and clearly labelled decision points, followed by a human playtest. Ask about who the player controls at each transition, why each speaker wants something, the most difficult choice, where reading drags, and whether the chosen ending resolves the first volume. Do not ask leading questions that assume the story is already good. No media generation, store submission or release approval is part of this checkpoint.

The route packet is now available at [第一卷连续读稿](FIRST_VOLUME_CONTINUOUS_READING_ZH.md). `npm run validate:story-reading` replays the actual seed-zero chapter, council, Fan Yang and retreat rules with byte-derived source hashes, asserts the together ending, and compares the generated text exactly with the saved copy. It includes conditional memories and the revised death-report pauses. This proves one feasible route and source fidelity, not prose quality, rendered layout, all routes or human acceptance. The exporter only writes to stdout; it does not mutate player saves or source content. No GUI or heavy job was launched.
