# Unreal canonical council staging

Status: official UE 5.8.1 automation and the packaged native runtime are accepted. Stable editor PIE, final character art, physical-controller review, voice and human cinematic review remain open.

## Purpose

SHI's strategy loop is about giving consequential orders to people, not manipulating an anonymous spreadsheet. Every playable node therefore has one canonical speaking character and the Keeper as the player viewpoint. Unreal must read those identities from the shared campaign, preserve their historical classification, block them in the same command space and return control to a legible dialogue composition after each consequence sentence.

The stage is presentation data, not new story authority. Unreal may choose transforms, lens and proxy geometry; it may not invent a speaker, change dialogue, hide whether a person is fictional or imply that authored words are a transcript.

## Canonical boundary

`FShiCampaignModel` now loads and validates the shared `characters` register and every node's `speakerId`. Chapter I requires:

- unique, non-empty character IDs, names and roles;
- the fictional Keeper player-character;
- one registered non-Keeper speaker and non-empty dialogue per node;
- the canonical `historical` flag without engine-specific reinterpretation.

For each turn, `FShiCouncilStagingModel` derives exactly two participants:

1. the node's speaker at the far side of the wartable;
2. the Keeper at the player side.

The model owns deterministic slot IDs, character identity, localized name/role/dialogue, provenance label, floor transform, non-exclusive visual style, stencil identity, a 44° dialogue lens and an exact camera transform aimed at the speaker. Historical speakers are labeled **Historical figure · words are authored dramatization, not transcript**. Fictional speakers are labeled **Fictional character · project-authored dramatic reconstruction**.

## Runtime behavior

Two persistent `AShiCouncilFigure` actors represent the validated speaker and Keeper slots. They are deliberate engine-native performance proxies built from separate body, head and mantle components, not final character assets. The separation establishes silhouette, eyeline, lighting, clicking, camera and asset-swap contracts without pretending that blockout geometry is film-quality art.

- Startup rejects the command space if either figure, its required engine-native mesh/material or the canonical opening stage cannot initialize.
- Clicking either council figure, pressing `D`, Gamepad R3 or the Slate **Return to council** control restores the authored dialogue shot without changing gameplay.
- Site and signal inspection remain reversible; `Home` returns to current ground.
- The consequence camera still resolves the exact order layers. After its final position beat—or a player skip—the camera hands control to the newly staged speaker.
- Reduced-motion mode changes the handoff to a cut without removing dialogue time or information.

The Slate council card exposes speaker name, role and provenance, and repeats the non-transcript/reconstruction disclosure next to the authored dialogue. Historical identity is never communicated by color alone.

## Fail-closed order integration

Council staging is part of `FShiOrderTransactionData`, not a fallible afterthought. Order preflight now:

1. resolves exactly one decision on a copied session;
2. builds the next legal selection and nine command signals;
3. builds the next node's canonical council stage;
4. builds the complete consequence cinema;
5. independently recomputes and exactly compares the save, resolution, selection, signals, every council field and every cinematic field;
6. verifies that the live camera and both initialized figure slots can present the candidate;
7. writes the candidate save before active memory or world staging changes.

Cast, dialogue, disclosure, transform, color, stencil, lens or camera drift rejects the whole transaction. Restart uses the same prepared council boundary. Once the durable write succeeds, applying the already-validated participant data to the two persistent figures introduces no new asset load or rule computation.

## Verification and open gates

`SHI.Cinematic.CouncilStagingV1` authors native automation for the opening Chen Sheng scene, exact speaker/Keeper occupancy, lens/eyeline, historical non-transcript disclosure, Aunt Yu's fictional classification, cast/dialogue/camera attacks and atomic failure. Order-transaction automation attacks stage drift, and all 46 golden-route turns require the prepared council node to match the authoritative post-order position.

Official UE 5.8.1 compilation and `SHI.Cinematic.CouncilStagingV1` automation now pass. Before this can be called native-playable or cinematic-quality, visible PIE review must prove:

- body/head/mantle components, collision and stencil render correctly;
- mouse, `D`, R3 and Slate focus agree;
- every route changes to the correct named speaker;
- historical/reconstruction disclosures remain readable at supported display scales;
- consequence-to-dialogue handoff and reduced-motion cuts are comfortable;
- final reviewed character assets preserve the same slot, scale, collision, eyeline, LOD, material, provenance and performance contracts;
- facial performance, lip sync or voice—if later added—cannot obscure subtitles or change canonical wording.
