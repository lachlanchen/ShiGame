# Cross-engine replay conformance

SHI treats the TypeScript rules package as the current behavioral oracle while Unreal and Unity mature. That authority is not an excuse for hand-waved parity: the oracle emits a reviewed, versioned replay corpus that native clients must execute exactly.

## Golden corpus

`content/conformance/chapter-01-replays.v1.json` exhaustively traverses every legal decision path for Chapter I at seed `5EED2026`. The current corpus contains 46 terminal routes: 40 completed positions and 6 captured/scattered failures. Each turn records:

- node, choice, field condition, pursuit posture, strategic method and prepared-read identity;
- carried commitment and answer identity when applicable;
- player, commitment, pressure, pursuit, method-read and field deltas;
- resources after every one of the six resolution layers;
- next node, completion/failure state and active commitment;
- final resources, flags, failure and ending.

The fixture includes the canonical campaign SHA-256. `npm run validate:conformance` regenerates it in memory and byte-compares the reviewed file; any narrative, balance, route or rule change must deliberately regenerate and review the resulting diff with `npm run conformance:write`. Content sync stages the exact fixture for Unreal and Unity, and repository validation rejects stale mirrors.

## Unreal boundary

`FShiCampaignSession` is a pure C++ gameplay state machine separated from camera, Slate and world actors. It owns legal-choice checks, deterministic FNV field selection, opponent posture and method memory, carried commitments, the six-layer resolution order, failure/completion and detailed history.

The Unreal automation suite is authored to run every golden route and compare every intermediate snapshot and delta. A separate save test exports version 6, rebuilds the position only from authoritative decisions, verifies terminal state, rejects an altered condition identity and proves failed replay cannot mutate the live session. Runtime saves use the same replay path, write through a temporary file, and preserve a rejected local save until the player explicitly confirms a new chronicle.

The separate Broken Crossing contract remains non-authoritative but now has exact native parity. Unreal initializes from plan/condition identifiers, traverses the same 76 legal and 47 viable routes as TypeScript, reaches all nine commands and four outcomes, rebuilds every save from identifiers and rejects invented field responses or stored-state drift. Its six-piece spatial model is rebuilt at every native position. The visible runtime additionally snapshots the authoritative campaign save and refuses any pulse or close after byte drift.

## Evidence status

| Boundary | Status |
| --- | --- |
| Fixture generation and byte/hash validation | Green |
| Unreal fixture staging and static contract | Green |
| Unreal C++ automation source for all 46 routes | Green |
| Unreal native compilation and exact `SHI.` automation execution | Green on official UE 5.8.1; all twelve suites pass, including command-weight presentation |
| Unreal Broken Crossing TypeScript/native route parity | Green; exact 76/47 matrix, replay/tamper and six-piece spatial states pass |
| Unreal visible campaign/engagement/save observation | Green in archived normal-thread package; engagement preview preserves bytes and the four-decision chapter seals/cold-replays |
| Unreal Linux package and performance | Green for the fixed-window development player; BuildCookRun exits 0 and real-display chart records 195.18 FPS average with zero hitches |
| Unreal packaged transaction/runtime faults | Green for unwritable order, failed restart, missing council figures and missing command signals; exact save and active state remain unchanged |
| Unreal reduced-motion/audio-device boundary | Green for cuts-only order/skip/restart and measured PipeWire silence/active/disable; human review remains open |
| Unreal editor PIE and physical-controller observation | Red; PIE hit an NVIDIA Vulkan swapchain crash and physical-controller review remains open |
| Unity consumption of the fixture | Staged; native parity test remains open |

Static validation never substitutes for native compiler and runtime evidence. The official native run proves both the C++ campaign corpus and the non-authoritative Broken Crossing parity boundary; the archived normal-thread route proves interaction, save isolation, fixed-window performance, three fail-closed faults, cuts-only persistence and native audio gating on this host. It still does not prove stable editor PIE, physical-controller feel, human audio/comfort approval, final art or human enjoyment.
