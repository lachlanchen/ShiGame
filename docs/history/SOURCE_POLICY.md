# Historical source and citation policy

SHI is historical fiction with an inspectable evidence layer. The project aims for disciplined uncertainty, not a false claim of reconstructing the past exactly.

## Evidence classes

1. **Event or institutional evidence:** received historical works, excavated/legal/archaeological evidence, and current scholarship. Each claim records work, section, date, edition/translation, access conditions, and uncertainty.
2. **Later compilation:** texts such as the *Shiji* and *Zizhi Tongjian* are indispensable but written after the events they narrate. The interface identifies that distance.
3. **Strategic lens:** works such as the *Sunzi* can frame a mechanic; they do not become evidence that a specific character applied that doctrine in a particular scene.
4. **Dramatic reconstruction:** invented characters, private councils, exact words, motives, and player alternatives. These are always labeled.

Schema v4 retains the explicit replacement for the ambiguous `primary-account` label. Runtime source records use `received-account`, `later-compilation`, `strategic-text`, or `dramatic-reconstruction`. A source classification describes how SHI uses a record; it never converts a later text into an eyewitness account.

## Corpus workflow

- Private collections in `../Books`, `../ZhJpBook`, downloads, and `references/private/` are discovery aids only.
- Never copy a private book, scan, OCR dump, chat export, or long excerpt into this repository.
- Before public use, identify an edition or translation whose copyright and redistribution status are known.
- Prefer public-domain Chinese base texts and licensed scholarly translations. Write original translations when appropriate and record the translator/reviewer.
- Store metadata and pinpoint citations, not source books.
- Compare at least two textual traditions or modern studies for disputed high-impact claims.
- Record uncertainty in player-facing language rather than silently resolving it.

## Planned classical corpus

The research register includes: 《史记》, 《资治通鉴》, 《左传》, 《战国策》, 《国语》, 《汉书》, 《后汉书》, 《三国志》, 《孟子》, 《论语》, 《韩非子》, 《孙子兵法》, 《孙膑兵法》, 《庄子》, and 《淮南子》. Inclusion in this list is not evidence that a work is relevant to every chapter.

## Claim record

Every material claim should eventually have:

```yaml
claim_id: qin-delay-penalty
claim: "The received Daze narrative says delayed conscripts expected death."
scene: chapter-01-daze/rain-order
source:
  work: 史记
  section: 卷四十八 陈涉世家
  edition: pending
  locator: pending
classification: later-compilation
confidence: medium
dispute: "Uniform legal application and wording require legal-historical review."
game_use: "Creates the commitment crisis; UI states the uncertainty."
reviewer: pending
```

No claim advances from `evidence-located` or `specialist-review-required` to a future approval state without a pinpoint locator, edition record, named reviewer, decision date, and player-facing wording check. The current schema intentionally has no `approved` value.

The machine-readable edition register is `content/research/editions.json`; its human-readable provenance and local discovery hashes are in [EDITION_REGISTER.md](EDITION_REGISTER.md). The status workflow and Chapter I risk queue are in [HISTORICAL_REVIEW_SYSTEM.md](HISTORICAL_REVIEW_SYSTEM.md).

## Quotation and translation

- Do not use unattributed modern translations.
- Keep quotations short and necessary; paraphrase for gameplay.
- Mark original project translations and have them reviewed independently.
- Do not modernize a speech and then present it in quotation marks as a historical utterance.
- Localized editions translate the game's own prose, not a copyrighted source translation, unless that license explicitly allows it.

## AI use

AI may help locate variants, normalize metadata, or draft a research question. It may not establish a historical fact, license status, transcription, translation, or citation. A human-visible review must compare the claim to the actual source before release.
