# Seeded uncertainty contract

Status: implementation contract · 2026-08-09 · owner: systems design

## Design purpose

SHI needs replay variation, but strategy collapses when an undisclosed die roll reverses a reasoned choice. Chapter I therefore uses **authored field conditions**: the chronicle seed selects one condition for the current position, the player sees its exact rule before committing, and the same seed plus decision history always reconstructs the same result.

The system models incomplete control, not historical counterfactual truth. Every condition is dramatic reconstruction and may describe rain, rumor, movement, supply or observation only within the chapter's researched constraints.

## Player contract

1. A field signal is visible above the decision cards before any order.
2. Its exact resource effects are visible; no percentage or “lucky” language is used.
3. The player's effects resolve first, the authored choice response resolves second, the already-disclosed pursuit posture resolves third, and the known field condition resolves fourth.
4. The result and decision record keep those four stages separate.
5. Reloading cannot reroll. Restarting the same chronicle retains its seed; starting a new chronicle creates a new seed.
6. A hexadecimal seed can be shared in the URL for reproduction and playtest comparison.

This preserves uncertainty about which position a new chronicle will present while keeping each actual decision legible and fair.

## Data contract

Every campaign node owns at least two conditions. A condition contains:

- a globally unique ASCII identifier;
- localized title and signal text, with English and Simplified Chinese required;
- a positive integer weight;
- one or more bounded resource effects.

Selection uses unsigned 32-bit FNV-1a over `campaignId|seed|nodeId|turn`, followed by a weighted modulo. IDs are constrained to ASCII so TypeScript and C# hash the same bytes. `turn` is the authoritative history length; this keeps the contract valid if a later campaign permits revisiting a node.

Save format 4 stores the unsigned seed and, for every current-rules decision, the selected condition and pursuit IDs, their deltas, intermediate resources and final resources. Migration never trusts stored totals: versions 1 and 2 replay under documented legacy seed `00000000`; version 3 verifies its recorded condition and keeps all pre-migration decisions under the original three-layer rules; every later choice uses the four-layer contract. Unknown future versions are rejected rather than guessed.

## Balance and validation

- Field effects are deliberately small beside authored decisions; Chapter I uses an absolute per-resource cap of 6.
- Conditions cannot alter flags, routes, requirements directly or conceal text.
- Content validation branches over every condition at every reachable node, not merely a handful of seeds. Every resulting playable path must avoid deadlock, retain all three conclusions and retain at least one genuine failure route.
- Tests pin cross-engine hash vectors, weighted selection, four-stage deltas, seed migration and tamper rejection.
- Visible QA must prove the signal is present before commitment, its effects are applied and recorded separately, the seed survives reload, and a seeded public URL reproduces the same condition.

## Stop rules

- Do not add hit/miss rolls to narrative choices.
- Do not hide a field effect behind flavor copy.
- Do not call procedural text or an LLM during play.
- Do not use randomness to manufacture historical claims, named people or quotations.
- Reject a condition if players cannot explain why its effect followed from the visible signal.
