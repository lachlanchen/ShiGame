# Martial-source review queue

Status: evidence discovery · one exact transcription audit complete · no new runtime quotations approved · updated 2026-08-09

The machine-readable queue is `content/research/martial-source-review.v1.json`. It turns the named military classics into bounded research questions for SHI's historical martial-command system without importing a private book, generated translation or appealing passage directly into the game.

## Current boundary

- `Sunzi` is the only runtime-registered military-text lens. Chapter I uses its opening five-factor comparison as design vocabulary, not evidence that a Daze participant followed a named doctrine.
- `Sun Bin Bingfa`, `Sima Fa`, `Wei Liaozi`, `Guiguzi` and `Wuzi` remain `candidate-not-runtime`.
- Each candidate records a public Chinese Wikisource page, the hash of the private discovery mirror, an exact section locator, a game-system question and a player-facing evidence boundary. The `Sunzi` `軍爭第七` candidate additionally pins the canonical page revision and a hash-only whole-section correspondence audit.
- The queue stores no source text, excerpt, translation or quotation. Its validator rejects those fields.
- A candidate cannot move into `content/research/editions.json` or a playable node until the exact public edition, textual status, rights handling, original translation/paraphrase and named review role are recorded.

## Verified public landing pages

| Work | Public page inspected | Current risk | Runtime state |
| --- | --- | --- | --- |
| 《孫子兵法》 | [孫子兵法](https://zh.wikisource.org/wiki/孫子兵法) | Additional chapters require translation and intellectual-history review | Five-factor lens already registered; other sections candidate-only |
| 《孫臏兵法》 | [孫臏兵法](https://zh.wikisource.org/wiki/孫臏兵法) | Recovered text has lacunae and editorial restorations | Candidate-only |
| 《司馬法》 | [司馬法](https://zh.wikisource.org/wiki/司馬法) | Received-text layers and normative/actual-practice distinction | Candidate-only |
| 《尉繚子》 | [尉繚子](https://zh.wikisource.org/wiki/尉繚子) | Public landing page is explicitly incomplete; select a complete edition first | Candidate-only |
| 《鬼谷子》 | [四庫全書本](https://zh.wikisource.org/wiki/鬼谷子_(四庫全書本)) | Authorship, date and textual layers; persuasion only, not battle evidence | Candidate-only |
| 《吳子兵法》 | [吳子兵法](https://zh.wikisource.org/wiki/吳子兵法) | Received six-chapter text needs transmission and practice review | Candidate-only |

The links establish discovery targets and origins, not historical approval. Chinese Wikisource contributor and transcription terms remain governed by each source page. SHI stores metadata and links only until a separate decision records what may be published.

## Exact transcription audit: `Sunzi` 軍爭第七

The former `孫子` URL was a redirect. The queue now names the canonical `孫子兵法` page and pins Wikisource page `11779`, revision `7906064` at `2026-07-02T02:39:46Z` (`sha1:459d8e5fd0f5b1b8676b20e39befdd3e76877be8`). The complete `軍爭第七` body in that revision and private mirror lines 89–101 produce the same SHA-256 after removing only heading syntax and Unicode whitespace: `b852ba062804cf88541d6d01ef58e54de9f4a377d4f412a9d552f368c204a10b`. The private section including its Markdown heading is separately pinned as `fc6d71cf1f7cfaf2abfeac025fd75ca070a1080212ef0ee23a32f5b8618c92b0`.

This establishes transcription correspondence only. It does not establish the received work's authorship/date, choose a translation, settle disputed interpretation, prove late-Qin practice or authorize a quotation. Its bounded design questions—baggage versus arrival order, reserve readiness and signal unity—map to existing encounter metrics without granting a bonus or attributing a doctrine to any Daze character. Runtime wording remains held for independent intellectual-history and original-translation review.

## P0 martial questions

| Candidate section | Design question | Gate before use |
| --- | --- | --- |
| 《孫子》〈兵勢〉 | Make force arise from formation, direction and timing rather than a hidden power score | Original-language and translation review; strategic-lens disclosure |
| 《孫子》〈軍爭〉 | Join speed, fatigue, baggage and arrival order in the broken crossing | Base transcription matched; independent intellectual-history and original-translation review still required; do not treat the authored Daze route as textual evidence |
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
