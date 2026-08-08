# SHI game design document

Status: living baseline · 2026-08-08 · owner: game director

## Product promise

SHI (《势》) is a historical strategy narrative about how power emerges from relationships among people, supply, terrain, time, institutions, stories, and force. The player should finish a session feeling that history was contingent, that every victory changed the board, and that moral commitments had operational consequences.

The first campaign begins with the late-Qin crisis, the Daze Village uprising, and the road toward the Chu–Han contention. Xiang Yu and Liu Bang are major later actors, not predestined protagonists who erase the agency of everyone around them.

## Audience and format

- Primary audience: players who enjoy consequential narrative, political strategy, readable systems, and history without requiring prior specialist knowledge.
- Session shape: 20–35 minute chapter decisions inside a 10–15 hour campaign arc.
- Platforms: modern web client for reach and iteration; Unity 6 client for the authored 3D experience and later desktop/mobile distribution.
- Rating target: teen, with violence conveyed through aftermath, testimony, logistics, and decisions rather than spectacle.
- Business model is undecided. No monetization mechanics may be added without a separate ethical/economic review.

## Design pillars

1. **Power is positional.** Resources matter because of their relationships and timing, not because a larger number always wins.
2. **History is contingent.** Outcomes are plausible within constraints; later dynastic success never becomes retroactive destiny.
3. **People are infrastructure, not currency.** Civilian support and trust change what actions are possible. They are never presented as disposable hit points.
4. **Choices are legible, not solved.** Intent and likely effects are visible, but second-order consequences and new opponents keep the decision interesting.
5. **Loss creates play.** Exposure, hunger, and fragmentation produce recovery decisions before terminal failure. A setback should change the strategy rather than simply waste time.
6. **Sources remain visible.** Historical claims, later compilations, classical strategic lenses, and dramatic reconstructions are distinguishable in play.

## Core loop

```text
Read the position
  → inspect people, supplies, momentum, trust, exposure and sources
  → choose a doctrine and accept its opportunity cost
  → see immediate movement on the shared state
  → face a countermove or recovery problem created by that doctrine
  → preserve, transform or abandon the network
  → record the decision and carry flags into the next chapter
```

## Strategic resources

| Resource | Meaning | Failure pressure | Counterplay |
| --- | --- | --- | --- |
| Grain | Food, transport capacity, reserve time | Low grain makes fast plans brittle | Requisition with debt, ration, abandon weight, build local supply |
| Trust | Belief that commitments will be honored | Low trust closes voluntary and diplomatic options | Visible limits, restitution, shared risk, credible institutions |
| Momentum | Ability to set the next problem for others | Low momentum lets opponents consolidate | Signal, move, narrate, make a political fact |
| People | Cohesion, households, skilled hands, messengers | Zero people ends the movement | Protect families, release people into networks, recruit through consent |
| Exposure | How precisely the state can see and contain the network | 100 exposure causes capture | Misdirect, split channels, control signals, sacrifice tempo |

All values are clamped to 0–100. Exposure is deliberately not a moral score. High momentum can be dangerous; high trust can make obligations expensive.

## Chapter I: Rain at Daze Village

The player is a fictional keeper of a Qin levy register. This point of view makes bureaucracy, legibility, and collective identity playable without overwriting Chen Sheng or Wu Guang.

The vertical slice has three acts:

1. **The register:** public covenant, forcing move, or concealed probe.
2. **The cost of organization:** each opening creates a different council about food, signals, or information.
3. **The broken crossing:** every doctrine encounters logistics and pursuit before choosing deep roots, wildfire, or watchful connection to emerging forces around Pei and Kuaiji.

The current slice contains six scenes, fifteen choices, three conclusions, save/resume, explicit source records, and deterministic effects. It is a pre-alpha chapter, not the complete campaign.

## Conflict model

The campaign does not use a conventional “attack for damage” loop as its strategic center. Conflict is resolved through overlapping fields:

- **Legibility:** who knows where people, grain, and messages are?
- **Commitment:** which promises cannot be withdrawn without losing trust?
- **Tempo:** who defines what must happen next?
- **Network shape:** concentrated command, federated cells, household ties, official routes.
- **Narrative authority:** whose account makes action seem legitimate or inevitable?
- **Material constraint:** weather, river crossings, harvest, weapons, distance, animal power.

Later tactical encounters will use spatial command and indirect control, but must feed these campaign fields rather than become disconnected combat minigames.

## Failure and recovery

- Terminal capture occurs at 100 exposure.
- Terminal scattering occurs at zero people.
- Before those boundaries, authored recovery turns offer asymmetric repair: reduce exposure by consuming grain, preserve people by surrendering tempo, or regain supplies by creating debt.
- Restarts are immediate, but the decision ledger shows the player why the position collapsed.
- A future “chronicle memory” mode may reveal counterfactual insights after completion; it must never secretly change the deterministic result.

## Onboarding and feedback

- The title communicates the thesis in one sentence.
- Five resources appear before the first choice.
- Every choice shows intent, strategic reading, and first-order deltas.
- The consequence persists after transition so players can connect action to state change.
- Source and decision ledgers are available without leaving play.
- Keyboard, touch, reduced-motion, text scaling, color-independent meters, RTL, and screen-reader labels are release gates.

## Narrative standards

- Attested persons keep their known constraints and do not become mouthpieces for modern conclusions.
- Fictional composite characters are labeled.
- Dialogue is concise, situation-specific, and never quoted as if sourced.
- Names, dates, geography, ranks, law, clothing, food, travel, and material culture require individual claim records.
- Violence must preserve its human cost and cannot be aestheticized as proof of strategic brilliance.

## Campaign arc

| Arc | Strategic question | Tentative chapters |
| --- | --- | --- |
| Qin fracture | When does administration become vulnerability? | Daze, Chen, county reactions |
| Many Chus | Can restored names coordinate incompatible interests? | Kuaiji, Xiang clan, rival Chu claims |
| Pei network | How does a flexible coalition become governable? | Pei companions, marches, local compacts |
| Entering the passes | Can restraint be made credible under victory? | Guanzhong, surrender, competing orders |
| Chu–Han contest | Does concentrated force defeat distributed legitimacy? | Feasts, supply fronts, defections, command crises |
| Settlement | What survives the winner? | Institutions, memory, households, costs of unification |

This arc is a research and prototyping map, not permission to write unreviewed chapters in bulk.

## Quality bar

A chapter is shippable only when it has a playable tension curve, meaningful counterplay, an auditable source matrix, reviewed localization layout, approved asset provenance, passing deterministic tests, keyboard/touch coverage, performance evidence, and at least two observed playtest reports. “More generated content” is never a substitute for these gates.
