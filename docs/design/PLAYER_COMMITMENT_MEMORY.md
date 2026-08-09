# Player commitment memory

Status: implementation contract · 2026-08-09 · owner: game director

## Player problem

SHI says that trust is the cost of promises, but Chapter I currently remembers the player's earlier decisions mainly through resource totals, route flags and Qin's strategic read. That makes an opening covenant legible to the opponent without making the player answer to the people who heard it. A serious political strategy game must let a promise become an operational constraint rather than flavor text.

Chapter I therefore carries one **player commitment** from the opening decision to the broken ford. The commitment remains visible while it is unresolved. At the ford, every legal choice discloses whether it will keep, strain or break that commitment, the exact resource effect, and the stakeholder who can judge the answer.

This is not a morality meter. Keeping a promise may cost tempo or supplies; breaking one may produce immediate tactical advantage while damaging trust or increasing Exposure. The useful question is not “which status is good?” but “which debt can this position still afford?”

## Authored commitments

All commitment copy and exact outcomes are project-authored dramatic reconstruction. They do not assert a documented private promise by Chen Sheng, Wu Guang, villagers or a Qin courier.

| Commitment | Established by | Stakeholder | Ford choice | Answer | Exact effect |
| --- | --- | --- | --- | --- | --- |
| Names under protection | Read every name aloud | Aunt Yu | Send households first | Kept | +4 Trust |
| Names under protection | Read every name aloud | Aunt Yu | Brace the ford | Strained | +1 Momentum, −2 Trust |
| Names under protection | Read every name aloud | Aunt Yu | Abandon the carts | Broken | −4 Trust, +2 Exposure |
| Movement before the posts answer | Seize the relay beacon | Wu Guang | Send households first | Strained | +1 Trust, −2 Momentum |
| Movement before the posts answer | Seize the relay beacon | Wu Guang | Brace the ford | Broken | −4 Momentum, +2 Exposure |
| Movement before the posts answer | Seize the relay beacon | Wu Guang | Abandon the carts | Kept | +4 Momentum, −1 Trust |
| The register stays dark | Hide the register | Courier Han | Send households first | Strained | +1 Trust, +2 Exposure |
| The register stays dark | Hide the register | Courier Han | Brace the ford | Broken | −2 Trust, +3 Exposure |
| The register stays dark | Hide the register | Courier Han | Abandon the carts | Kept | −4 Exposure, −1 Grain |

## Deterministic selection

Each commitment declares one establishing choice and a closed list of choice-specific outcomes. The engine considers a commitment active when its establishing choice is in authoritative history and no prior record has resolved that commitment.

For the current chapter:

- exactly one commitment may be active;
- council decisions carry it without silently changing it;
- every broken-ford choice resolves it exactly once;
- no route may reach an ending with an unresolved commitment;
- an outcome cannot resolve before its establishing choice;
- commitment outcome IDs, effects and status are authored data, never inferred from prose or generated at runtime.

If malformed future content creates two simultaneous commitments, the engine and validators fail closed instead of choosing one arbitrarily.

## Turn order

The current resolution order is:

```text
player action
  → disclosed commitment answer, when the pending choice resolves one
  → authored pressure response
  → disclosed Qin pursuit posture
  → disclosed Qin method read
  → disclosed seed-selected field condition
  → capture/scattering check and route transition
```

Every layer clamps resources to `0–100` before the next layer. Commitment effects are limited to ±4 per resource in Chapter I. They cannot create or remove routes, requirements, flags, sources, claims, characters or dialogue.

The commitment layer is absent rather than fabricated on decisions that merely carry the promise. The result panel and decision ledger show it only when an answer occurs.

## Presentation contract

- Selecting every opening choice reveals the commitment it will establish, its stakeholder and dramatic-reconstruction boundary in the focused reading before the player commits.
- An unresolved commitment appears in a compact, visually distinct band naming its stakeholder, promise and dramatic-reconstruction boundary.
- At the resolution node, the selected-order inspector states **keeps**, **strains** or **breaks**, includes the exact effects, and uses words plus geometry rather than color alone. Players can cycle every legal answer without changing campaign state.
- The consequence banner separates the commitment answer and deltas from action, pressure, pursuit, method-read and field layers.
- The decision ledger preserves the commitment title, answer and exact deltas.
- The ending summarizes the chapter's answered commitment without converting it into a global virtue score.
- At 400% zoom, the selected-order reading may scroll while the compact choice and separate confirmation remain fully reachable; no text may be silently removed to make the surface fit.

## Save and replay

Save format `6` adds `preCommitmentDecisionCount`. Versions 1–3 retain their pre-pursuit rules, version 4 retains its pre-method-read rules, and version 5 retains its pre-commitment rules. Migration replays the authoritative choice history under those boundaries rather than applying commitment effects retroactively.

Current-format records preserve the commitment ID, outcome ID, exact commitment delta and post-commitment resources. Loading rejects a commitment/outcome identity that does not match the establishing history and pending choice. Stored totals remain untrusted.

## Validation gates

- Commitment, establishing-choice, stakeholder and outcome IDs are unique and cross-reference valid content.
- Every commitment has exactly one `kept`, one `strained` and one `broken` outcome in Chapter I.
- Every outcome is reachable only after its establishing choice.
- Exhaustive route traversal proves every established commitment resolves exactly once and every authored outcome is reachable.
- TypeScript and C# apply identical selection, ordering, clamping, replay and tamper-rejection rules.
- Visible QA proves one carried promise, all three disclosed ford answers, one resolved answer, save-v6 reload, decision-ledger retention, ending summary, locale/RTL structure, mobile fit and actual Chrome 400% reachability.
