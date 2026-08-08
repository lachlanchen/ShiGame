# Pressure response system

Status: implementation contract · updated 2026-08-09 · owner: game director

## Player problem

Chapter I already makes immediate costs visible, but a choice currently resolves as if the world were passive. SHI needs counterplay without turning historical uncertainty into arbitrary dice rolls. The position must answer: officials redirect patrols, terrain fixes a marching pace, promises require verification, supplies run down, and witnesses carry more than one meaning.

## Turn contract

Every nonterminal decision begins with two choice-specific deterministic layers:

1. **Player action.** The card states the intent, strategic reading and exact immediate resource effects.
2. **Pressure response.** Before commitment, a qualitative warning names the exposed weakness. After commitment, the authored response and its exact resource effects are revealed and recorded.

Pressure has one of four origins:

- `state`: administrative pursuit, posts, patrols or official legibility;
- `terrain`: weather, river, road or movement constraints;
- `supply`: food, transport, time and material limits;
- `network`: rumor, witnesses, trust and distributed coordination.

The engine applies the action first and the pressure second, then applies the separately disclosed persistent opponent posture and seed-selected field condition. It clamps every stage to `0–100`, then checks capture or scattering. This ordering is part of the shared campaign contract and must match in TypeScript and Unity. See [Opposition posture](OPPOSITION_POSTURE.md) and [Seeded uncertainty](SEEDED_UNCERTAINTY.md).

If any resolution layer causes capture or scattering, the run ends on the decision node. The engine must not advance to or reveal the unearned next scene.

## Fairness rules

- Pressure is authored per choice and contains no runtime randomness.
- The warning is visible before commitment; the revealed wording and exact pressure deltas appear after.
- Immediate and pressure deltas remain visually separate so the player can learn why the position changed.
- Pressure cannot introduce a historical claim. It describes a plausible systemic response and inherits the node's dramatic-reconstruction label.
- A chapter cannot ship if exhaustive traversal finds an unavailable turn, an unreachable authored ending, or no recoverable route after pressure is applied.
- Disclosed pursuit and field layers may add pressure, but they may not silently change their resource math or defeat save replay.

## Save and replay

Save format `4` treats decision history as the authority. Loading replays choice identifiers against the applicable versioned rules instead of trusting stored resource totals. Older decisions migrate without retroactively receiving pursuit effects; new decisions use the current four-layer contract. Impossible or tampered sequences are rejected. A campaign revision that removes a recorded choice must fail closed and offer a clean restart rather than inventing state.

## Presentation

- Choice card: one concise pressure warning, labelled as a forecast rather than certainty.
- Resolution panel: consequence plus separately identified action, pressure, pursuit and field responses/deltas.
- Decision ledger: the chosen action and every revealed response remain reviewable.
- Keyboard contract: `Shift+1`–`Shift+3` choose visible cards, `Alt+S` opens sources, `Alt+R` opens the record, and `Escape` closes transient layers. Shortcuts never fire while typing or using a select control.
