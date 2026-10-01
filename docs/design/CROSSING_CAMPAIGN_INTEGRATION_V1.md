# Crossing: action, consequence and continuation

Status: development rules and opt-in web client checkpoint. The current public/store game is unchanged; native and Unreal adoption remains pending.

## Player experience being built

The player selects whom the crossing should protect, issues three field orders under the disclosed condition, sees the opposing response, and carries the actual outcome into the next scene. A successful crossing is not automatically a painless crossing. A withdrawal is not automatically a campaign-ending defeat. The people, supplies and credibility preserved here affect what the player can do later.

This encounter is fictional dramatization within the existing sourced Qin-collapse narrative. It does not rewrite a recorded historical battle or promise that Chen Sheng or Wu Guang can survive their recorded deaths. Local lives, promises, alliances and the keeper's future can branch. Larger historical counterfactual campaigns would need separate, explicit framing.

## Shared rules boundary

`content/engagements/chapter-01-crossing-campaign.rules.v1.json` opts into a new development-only integration of the existing three-pulse encounter. Its campaign and encounter SHA-256 pins are checked by `scripts/validate-crossing-campaign.ts`. Changing those inputs requires reviewed versioning/migration; the validator must not merely be repinned to hide a behavioral change.

`packages/game-core/src/crossing-campaign.ts` owns a separate version-one identifier ledger. It reconstructs the campaign and active battle from seed and ordered events. Do not persist its derived `GameState` through the old version-six loader: that loader cannot reconstruct the tactical commands.

- Ordinary scenes accept `decision` events.
- Crossing accepts `begin-crossing` for a legal campaign plan. The field condition comes from the campaign seed and turn, never a caller-selected favorable condition.
- Selection can be cancelled before issuing the first command. Issued orders cannot be undone by closing the interface or changing plans.
- Each legal `crossing-command` is saved for exact mid-battle resume. It does not yet mutate campaign resources.
- After all three pulses, `finish-crossing` commits the encounter once. Plan-plus-outcome effects **replace** the old abstract choice's player effects. Oath, pressure, pursuit, prepared method read and field layers retain their existing order. Original choice identity, flags and promises remain traceable.
- The next ordinary decision uses the resulting resources. Completed chapters still derive the existing Chen council entry from the actual result.

Transactions are pure. Client integration must durably write the returned ledger before installing the derived UI state; a storage failure must preserve the previous committed state. The caller must use the build-validated canonical content matching the pinned hashes. The ledger rejects malformed events, illegal commands, foreign revisions, premature/double finishes and direct crossing-choice bypasses. It is replay validation, not anti-cheat cryptography.

## Verified rules checkpoint

The six-seed audit exhausts 3,368 terminal routes and cold-replays all 6,480 visited checkpoints. Both crossing conditions and all four tactical outcomes occur; no audited branch deadlocks. There are 424 capture routes, and successful routes reach all three existing Chen arrival categories. These counts describe the enumerated authored branches, not real-player probabilities or a balance approval.

In 56 fixed-seed strategic routes, changing only tactical commands changes the eventual ending/Chen-arrival signature. One example keeps seed zero and `read-the-names → issue-grain-tallies → repair-the-ford → send-two-envoys`, but can reach either a pressed or divided Chen arrival depending on field orders. This demonstrates downstream consequence, not yet emotional resonance or fun.

## Required next checkpoints

1. The development web client now uses this ledger under `?crossing=campaign` on a non-native Vite development server (for example `http://127.0.0.1:5173/?crossing=campaign&seed=00000000` after `npm run dev`). Normal URLs retain the original game. Existing release saves are not converted or deleted: the preview starts/resumes a separate rules edition, explicitly disclosed on its title. Historical abstract crossings never acquire invented tactical commands. A corrupt development save stops initialization instead of silently creating a new one. New labels currently cover English and Simplified Chinese; full localization and native durable-writing review are still release gates.
2. Pause/reload, explicit finish feedback and storage-failure retry are implemented. An active battle hides abstract orders and offers resume; before the first command, explicit cancellation permits reselection. The existing main App, consequence and Chen screens are reused rather than creating divergent narrative scenes. A real-pointer desktop/390px route passed 33 checks with no runtime exceptions; all three commands appear in the chronicle and its consequence matches the tactical outcome. Other tactical routes, actual offline reload, physical controller, assistive technology and native-device playtests remain pending.
3. Port the same contract and replay fixtures to native SwiftUI, Android and Unreal before enabling a release path. Do not give one client divergent battle costs or narrative truth.
4. Review balance and the campaign pressure prose: the existing field/pursuit layers remain, so they must not describe a second copy of a loss already shown in the battle.
5. Author outcome-specific physical reactions and continuous shots. Match approved faces, clothing, props, river geography, rain and musical motif. Use reviewed Musia/LocalVideoGen/Blender materials; no new audiovisual assets were generated or accepted by this rules checkpoint.
6. Let the people carry the consequence: show who crossed, what was left behind, and who remembers the promise. Keep uncertainty where an individual's fate was not observed. Human playtests must assess clarity, agency, resonance and pacing.

Completion remains unproven until the playable client flow, cross-client replay, audiovisual continuity and human acceptance are verified.

## Web checkpoint evidence

`docs/production/evidence/crossing-campaign-web-20261001.json` pins the reviewed source and screenshot hashes for the visible run in `.runtime/story-review/2026-10-01T00-08-34.353Z`. The representative route ends with grain48/trust89/momentum10/people97/danger96 and a supplied Chen arrival. The first browser run incorrectly expected divided; an independent ledger replay exposed the harness mistake, and the corrected run compares all five visible resource values as well as the arrival. The supplied entry prioritizes grain under the existing council rule; high pursuit is not evidence that the arrival must be pressed.

Storage failures preserve both the durable ledger and the live state. Failed reaction acknowledgement now returns a refusal to the consequence panel, which keeps Continue retryable and displays its error outside collapsed details. The new module is absent from the production artifact, enforced by build-marker checks. No new music, video or image asset was generated, accepted or integrated by this checkpoint. Visual review still finds the battle and reaction text-heavy.
