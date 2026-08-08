# Pressure response system

Status: implementation contract · 2026-08-08 · owner: game director

## Player problem

Chapter I already makes immediate costs visible, but a choice currently resolves as if the world were passive. SHI needs counterplay without turning historical uncertainty into arbitrary dice rolls. The position must answer: officials redirect patrols, terrain fixes a marching pace, promises require verification, supplies run down, and witnesses carry more than one meaning.

## Turn contract

Every nonterminal decision has two deterministic layers:

1. **Player action.** The card states the intent, strategic reading and exact immediate resource effects.
2. **Pressure response.** Before commitment, a qualitative warning names the exposed weakness. After commitment, the authored response and its exact resource effects are revealed and recorded.

Pressure has one of four origins:

- `state`: administrative pursuit, posts, patrols or official legibility;
- `terrain`: weather, river, road or movement constraints;
- `supply`: food, transport, time and material limits;
- `network`: rumor, witnesses, trust and distributed coordination.

The engine applies the action first and the pressure second, clamps each stage to `0–100`, then checks capture or scattering. This ordering is part of the shared campaign contract and must match in TypeScript and Unity.

If pressure causes capture or scattering, the run ends on the decision node. The engine must not advance to or reveal the unearned next scene.

## Fairness rules

- Pressure is authored per choice and contains no runtime randomness.
- The warning is visible before commitment; the revealed wording and exact pressure deltas appear after.
- Immediate and pressure deltas remain visually separate so the player can learn why the position changed.
- Pressure cannot introduce a historical claim. It describes a plausible systemic response and inherits the node's dramatic-reconstruction label.
- A chapter cannot ship if exhaustive traversal finds an unavailable turn, an unreachable authored ending, or no recoverable route after pressure is applied.
- Future seeded uncertainty may choose among equivalent authored manifestations, but it may not silently change resource math or defeat save replay.

## Save and replay

Save format `2` treats decision history as the authority. Loading replays choice identifiers against the current campaign rules instead of trusting stored resource totals. This migrates version-1 saves, rejects impossible/tampered sequences, and makes pressure outcomes reproducible across clients. A campaign revision that removes a recorded choice must fail closed and offer a clean restart rather than inventing state.

## Presentation

- Choice card: one concise pressure warning, labelled as a forecast rather than certainty.
- Resolution panel: consequence, pressure response, action deltas and pressure deltas.
- Decision ledger: both the chosen action and the revealed response remain reviewable.
- Keyboard contract: `Shift+1`–`Shift+3` choose visible cards, `Alt+S` opens sources, `Alt+R` opens the record, and `Escape` closes transient layers. Shortcuts never fire while typing or using a select control.
