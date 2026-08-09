# Martial-source review queue

Status: evidence discovery · no new runtime quotations approved · updated 2026-08-09

The machine-readable queue is `content/research/martial-source-review.v1.json`. It turns the named military classics into bounded research questions for SHI's historical martial-command system without importing a private book, generated translation or appealing passage directly into the game.

## Current boundary

- `Sunzi` is the only runtime-registered military-text lens. Chapter I uses its opening five-factor comparison as design vocabulary, not evidence that a Daze participant followed a named doctrine.
- `Sun Bin Bingfa`, `Sima Fa`, `Wei Liaozi`, `Guiguzi` and `Wuzi` remain `candidate-not-runtime`.
- Each candidate records a public Chinese Wikisource landing page, the hash of the private discovery mirror, an exact section locator, a game-system question and a player-facing evidence boundary.
- The queue stores no source text, excerpt, translation or quotation. Its validator rejects those fields.
- A candidate cannot move into `content/research/editions.json` or a playable node until the exact public edition, textual status, rights handling, original translation/paraphrase and named review role are recorded.

## Verified public landing pages

| Work | Public page inspected | Current risk | Runtime state |
| --- | --- | --- | --- |
| 《孫子兵法》 | [孫子](https://zh.wikisource.org/wiki/孫子) | Additional chapters require translation and intellectual-history review | Five-factor lens already registered; other sections candidate-only |
| 《孫臏兵法》 | [孫臏兵法](https://zh.wikisource.org/wiki/孫臏兵法) | Recovered text has lacunae and editorial restorations | Candidate-only |
| 《司馬法》 | [司馬法](https://zh.wikisource.org/wiki/司馬法) | Received-text layers and normative/actual-practice distinction | Candidate-only |
| 《尉繚子》 | [尉繚子](https://zh.wikisource.org/wiki/尉繚子) | Public landing page is explicitly incomplete; select a complete edition first | Candidate-only |
| 《鬼谷子》 | [四庫全書本](https://zh.wikisource.org/wiki/鬼谷子_(四庫全書本)) | Authorship, date and textual layers; persuasion only, not battle evidence | Candidate-only |
| 《吳子兵法》 | [吳子兵法](https://zh.wikisource.org/wiki/吳子兵法) | Received six-chapter text needs transmission and practice review | Candidate-only |

The links establish discovery targets and origins, not historical approval. Chinese Wikisource contributor and transcription terms remain governed by each source page. SHI stores metadata and links only until a separate decision records what may be published.

## P0 martial questions

| Candidate section | Design question | Gate before use |
| --- | --- | --- |
| 《孫子》〈兵勢〉 | Make force arise from formation, direction and timing rather than a hidden power score | Original-language and translation review; strategic-lens disclosure |
| 《孫子》〈軍爭〉 | Join speed, fatigue, baggage and arrival order in the broken crossing | Do not treat the authored Daze route as textual evidence |
| 《孫子》〈地形〉 | Let ground change legal orders and explain failure | Historical terrain terminology and GIS/material review |
| 《孫臏兵法》〈十陣〉 | Make formation footprints legible through frontage, depth and facing | Philological review of lacunae, restorations and formation naming |
| 《司馬法》〈仁本〉 | Make protection, restraint and political purpose operational | Normative text cannot be presented as universal practice |
| 《尉繚子》〈踵軍令〉 | Connect reserve timing, prepared food and route coordination | Complete edition, institutional history and metrology review |
| 《吳子》〈治兵〉 | Show training, signal consistency and mutual support before contact | Ethical review; coercive punishment cannot become a reward mechanic |

## Promotion checklist

1. Confirm a stable public edition or rights-cleared scan and its precise locator.
2. Compare the private discovery mirror against that edition; record variants and lacunae.
3. Establish textual date/authorship limits and whether the passage is descriptive, prescriptive, rhetorical or reconstructed.
4. Draft an original SHI paraphrase or translation and commission independent review.
5. State the mechanic it informs and the historical claim it does **not** establish.
6. Add an edition record, source record and claim record with source-to-scene closure.
7. Expose the classification and uncertainty in every client.
8. Pass historical, localization and accessibility review before the text appears in a playable build.

This queue is deliberately narrower than “use every classic.” A work enters play only when it makes a concrete player decision clearer and survives the same evidence boundary as the rest of SHI.
