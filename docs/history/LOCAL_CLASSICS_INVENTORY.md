# Local classical-source inventory

Status: research inventory, 2026-08-09. This file records what is actually available in the sibling research workspaces. It does not copy those works into the public repository and does not grant publication rights to any modern edition or translation.

## Historical backbone

Chapter I already uses a traceable comparison set rather than a blended “ancient history” voice:

| Work | Local material located | Campaign use |
| --- | --- | --- |
| 《史記》 | Bilingual chunk manifest with 4,622 chunks; Chinese and Japanese Markdown; local paragraph/chapter alignment | Primary received narrative for 《陳涉世家》卷 48, with later Xiang Yu and Liu Bang routes anchored in 卷 7 and 卷 8 |
| 《資治通鑑》 | Comment-aware source, classical Markdown and quadrilingual manifest with 4,146 chunks across 301 chapter numbers | Much later chronological comparison for 卷 7, explicitly not an eyewitness source |
| 《漢書》 | Public-edition locator already registered in campaign content | Early imperial parallel account and wording comparison |

The local text contains the Daze sequence at `books/shiji/markdown/zh.md:4657–4663` and the corresponding *Zizhi Tongjian* account at `books/zizhi-tongjian/markdown/wenyan.md:2657–2665`. These are research-workspace locators, not player citations. Player-facing records continue to use edition, volume, section and public URL locators.

Chronology policy:

1. Use *Shiji* for the main received sequence and named actors.
2. Compare *Hanshu* and *Zizhi Tongjian* for chronology, wording and later political framing.
3. Never combine parallel accounts into a falsely certain composite.
4. Treat reported speeches, omens, the exact Qin penalty and causal interpretation as claims with uncertainty—not neutral scene dressing.
5. Adapt the decision space, minor characters and counterfactual outcomes as visibly labeled dramatic reconstruction.

## Strategic-text corpus located

The local `../ZhJpBook` workspace contains launchable classical-text packages and chunk manifests for every work requested for the first strategic pass:

| Work | Local ID | Located structure | Initial game-design lens |
| --- | --- | --- | --- |
| 《孫子兵法》 | `sunzi-bingfa` | 74 chunks, 13 chapters; classical Markdown and Chinese/English/Japanese references | five factors, cost of prolonged war, preparation, momentum, emptiness/solidity, adaptation, terrain and intelligence |
| 《孫臏兵法》 | `sunbin-bingfa` | 70 chunks; excavated/fractured text with supplied readings | indirect approach, force ratio, terrain, formation, morale and command under uncertainty |
| 《司馬法》 | `simafa` | 68 chunks; classical text plus reference editions | political legitimacy, restraint, discipline and the civil purpose of military force |
| 《尉繚子》 | `weiliaozi` | 86 chunks; classical text plus reference editions | organization, institutions, mobilization, rewards, punishment and logistics |
| 《吳子》 | `wuzi` | 44 chunks across 圖國、料敵、治兵、論將、應變、勵士 | governing before fighting, reading enemies, training, command character, adaptation and morale |
| 《鬼谷子》 | `guiguzi` | 128 chunks across seven numbered divisions plus appendices | persuasion, coalition reading, diplomacy, agents and information asymmetry |

These counts come from each package’s committed chunk manifest. “Launchable” describes the sibling book pipeline, not historical certainty, translation approval or shipping permission.

## Quotation and mechanic gate

No classical sentence enters player-facing prose merely because it appears in a local PDF, EPUB, OCR result or generated chunk. Every excerpt must pass all of these checks:

- exact base-language wording matched against a registered public-domain or otherwise permitted edition;
- work, chapter/section and stable public locator recorded;
- received-text, excavated-text, later-compilation and disputed-attribution limits stated where relevant;
- project translation written independently or separately licensed, then reviewed by a qualified reader;
- quotation kept short and connected to a concrete mechanic or decision, never used as ornamental “ancient wisdom”;
- source text distinguished from SHI’s interpretation and from reconstructed dialogue;
- source and claim IDs exposed by the active scene in Web, Unity and Unreal;
- no private sibling-workspace file copied into Git or a packaged build.

For *Sun Bin’s Art of War*, lacunae and editorial restorations require an additional fragment/edition check. For *Guiguzi* and other received strategic compilations, attribution and dating must not be projected into a scene as contemporary speech without specialist review.

## First mechanic mapping

The first ingestion pass should deepen systems already present instead of attaching seven unrelated quotations to one short chapter:

| Mechanic | Priority lens | Player-facing question |
| --- | --- | --- |
| field estimate | 《孫子》始計 | What do people, season, ground, command and organization make possible now? |
| supply clock | 《孫子》作戰; 《尉繚子》 | What does delay consume, and who bears that cost? |
| method/countermethod | 《孫子》虛實、九變; 《孫臏兵法》 | Has Qin prepared for the method you keep repeating? |
| terrain and route | 《孫子》行軍、地形; 《吳子》料敵、應變 | Which route preserves options rather than merely shortening distance? |
| army cohesion | 《吳子》治兵、勵士; 《司馬法》 | Will orders remain credible when grain, danger and obligations diverge? |
| polity and legitimacy | 《司馬法》; 《吳子》圖國; 《尉繚子》 | What kind of authority is the player creating while trying to survive? |
| diplomacy/intelligence | 《鬼谷子》; 《孫子》用間 | Which report, envoy or alliance is trustworthy, and what does revealing knowledge cost? |

The next content checkpoint will register these works as strategic-text sources with exact public locators, then attach them only to scenes and mechanics that genuinely use them. Qin-law, excavated-text and translation-specialist gates remain open.
