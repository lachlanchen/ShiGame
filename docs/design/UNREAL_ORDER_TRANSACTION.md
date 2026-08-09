# Unreal fail-closed order transaction

Status: source-authored pre-alpha contract; native compilation, automation execution and deliberate failure injection in PIE remain open.

## Player guarantee

Pressing **Issue order** must never leave the chronicle, 3D command state, consequence cinema and local save describing different turns. An order either crosses one verified commit boundary or the current position remains authoritative. A missing actor, invalid world signal, corrupted cinematic plan or failed durable write is an **order held**, not a partially advanced turn.

## Prepared transaction

`FShiOrderTransactionModel` receives the immutable active `FShiCampaignSession`, canonical campaign, selected choice and locale. It prepares all downstream state on a copied session:

1. resolve exactly one legal decision through order → oath → pressure → pursuit → method read → field;
2. require exactly one appended history record and a representable post-order site;
3. choose the first legal post-order briefing without mutating the active selection;
4. build and spatially validate all five resource and four tactical world signals;
5. build the next node's canonical speaker/Keeper council stage and disclosure;
6. build and validate the complete six-or-seven-beat consequence plan;
7. independently recompute the candidate and compare its serialized authoritative session, full resolution record, selected briefing, every signal field, every council-staging field and every cinematic field.

Only then does the runtime check that the camera, all nine command-signal actors, every consequence focus actor and both initialized council figure slots are live. The output object is assigned only after the whole pure build succeeds, so an error cannot replace an earlier accepted transaction.

## Durable-first runtime commit

When local persistence is healthy, GameMode writes the prepared candidate through the existing temporary-file replacement before swapping active memory. If the write fails, it displays **Order not issued / Order held** and preserves resources, history, position, live world, selection, council cast and the previous save. After the durable write succeeds, the runtime moves the already-validated session/signals/selection/council stage into the active state and starts the already-validated cinematic; no fallible rule or presentation planning remains after that point.

A process failure between the durable write and the in-memory swap resumes the verified new turn on the next launch. This is intentional durable-first crash behavior, not a split state.

If an incompatible or tampered existing save was previously rejected, the player may continue only in the explicitly labeled **unsaved preview**. That mode never overwrites the rejected file. Its status is not represented as autosaved or transaction-durable.

The two-step **New chronicle** path uses the same turn-snapshot and live-actor preflight. It writes the replacement chronicle before replacing active memory; any snapshot, actor or file error preserves the current run and keeps the failure visible.

## Acceptance and attacks

`SHI.Campaign.OrderTransactionV1` authors native checks for source-session byte immutability, exactly-one-decision preparation, post-order position/selection, nine-signal and seven-beat opening output, independent revalidation, illegal-build atomicity and rejection of:

- altered resolution intermediates;
- altered live-world values;
- altered cinematic authorship;
- altered speaker identity, dialogue disclosure, blocking or council lens;
- invalid post-order selection;
- a hidden extra resolved decision.

`SHI.Campaign.CrossEngineReplayV1` now runs every turn of all 46 fixed-seed terminal routes through the same transaction, asserts the source history and position remain unchanged during preflight, independently revalidates the complete transaction, then commits the candidate for golden comparison. The repository validator also rejects source orderings that swap active memory before the candidate order or restart save is durable.

The detached clean build proves source closure and static contract coverage only. Native acceptance still requires the official Unreal compiler, both suites executing, PIE file-write failure injection, live-actor removal injection, successful restart/resume observation and a packaged-build crash/relaunch exercise.
