# Edition and provenance register

This is the human-readable companion to `content/research/editions.json`. It records which edition or public transcription was inspected, where the project found its pinpoint locator, and what may be published. It does not certify a historical interpretation and it does not copy source-book text into the game.

## Publication rule

- Public runtime data contains work/edition metadata, a precise section locator, an HTTPS link, original SHI paraphrase, and uncertainty wording.
- Classical base works may be public domain while a transcription, annotation, scan, or modern translation has separate terms. SHI therefore links to public pages and stores metadata only.
- Sibling `Books` and `ZhJpBook` files are private discovery mirrors. Their hashes make internal comparison repeatable; their contents are not redistributed.
- `accessDate` is the date on which the public page and locator were checked, not an assertion that the edition is critical or definitive.

## Chapter I editions checked on 2026-08-09

| Edition ID | Runtime use | Public page | Discovery mirror and SHA-256 |
| --- | --- | --- | --- |
| `shiji-sanjiazhu-wikisource` | *Shiji* 48 for Daze; 7 for Xiang; 8 for Liu | [史記三家註](https://zh.wikisource.org/wiki/史記三家註) | `../Books/resources/curated-books/chinese-classics/shiji/zh-wikisource-sanjiazhu/wikisource/plain-text/0049-史記三家註__卷048.txt` · `15bdd0905b1403794fc371c662de3188324104bae5939c3c5979d040216f79cc`; volume 7 · `a14d37ba708ad8eb5406df3693bd8a16683fb625ff1c00e825d8c7556b856c51`; volume 8 · `471c0f03624328bc11bc9d01b30b922cd9310f0153ba8fd060c3c95bf14ae835` |
| `hanshu-wikisource` | *Hanshu* 31 parallel narrative | [漢書](https://zh.wikisource.org/wiki/漢書) | `../ZhJpBook/books/han-shu/markdown/wenyan.md` · `bde42aa5f6fb168ba91b638b760ceede15926ed74e5050d218a147b7828d441d` |
| `zizhi-tongjian-wikisource` | *Zizhi Tongjian* 7 comparative chronology | [資治通鑑](https://zh.wikisource.org/wiki/資治通鑑) | `../ZhJpBook/books/zizhi-tongjian/markdown/wenyan.md` · `8c38d75fe3dff92552ee6cb5fea6855ae71280eb9f2f4a38f0ba36d1d76daf17` |
| `sunzi-wikisource` | *Sunzi* 1 as a strategic design lens only | [孫子兵法](https://zh.wikisource.org/wiki/孫子兵法) | `../ZhJpBook/books/sunzi-bingfa/markdown/wenyan.md` · `f0cc284f2c6ca424fca05d4cfc3b6b21dd340344f750a1bc2a01c449ddf8aca6` |
| `shi-original-2026` | Fictional cast, councils, map and field conditions | n/a—project original | Versioned campaign payload and Git history |

Chapter I links directly to [*Shiji* 48](https://zh.wikisource.org/wiki/史記三家註/卷048), [*Shiji* 7](https://zh.wikisource.org/wiki/史記三家註/卷007), [*Shiji* 8](https://zh.wikisource.org/wiki/史記三家註/卷008), [*Hanshu* 31](https://zh.wikisource.org/wiki/漢書/卷031), and [*Zizhi Tongjian* 7](https://zh.wikisource.org/wiki/資治通鑑/卷007). Rights handling follows the [Chinese Wikisource copyright guidance](https://zh.wikisource.org/wiki/Wikisource:版权); SHI does not treat that page as legal advice.

## Integrity and review boundary

`scripts/validate-content.mjs` rejects an unknown edition, missing locator, non-HTTPS public link, rights mismatch, orphaned claim, missing claim source, or historical claim mislabeled as authored reconstruction. Those checks prove internal consistency. They do not replace legal, historical, archaeological, translation, or localization review.
