[English](README.md) · [العربية](i18n/README.ar.md) · [Español](i18n/README.es.md) · [Français](i18n/README.fr.md) · [日本語](i18n/README.ja.md) · [한국어](i18n/README.ko.md) · [Tiếng Việt](i18n/README.vi.md) · [中文 (简体)](i18n/README.zh-Hans.md) · [中文（繁體）](i18n/README.zh-Hant.md) · [Deutsch](i18n/README.de.md) · [Русский](i18n/README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · The Shape of Power / 《势》

*A history game about decisions that change lives.*

[Web](https://lachlanchen.github.io/ShiGame/) · [Story](https://lachlanchen.github.io/ShiGame/story/) · [App Store](https://apps.apple.com/us/app/id6816377548) · [Sponsor](https://github.com/sponsors/lachlanchen)

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI](docs/production/evidence/web-01-title-en.png)

## Game

SHI begins in rain at Daze in 209 BCE. You are a fictional levy-record keeper: grain, trust, people and exposure shape which promises you can keep. Choices create costs, opposition and recovery—not an inevitable victory. Zizhi Tongjian is the historical spine; reconstructed dialogue and alternate outcomes are labeled, not passed off as quotations.

## Clients

Web uses React/Three.js and deterministic TypeScript rules. iOS is native SwiftUI/SceneKit/Foundation; Android packages the offline web game. Unreal 5.8 is the cinematic desktop client; Unity 6 remains a shared-content baseline. They consume versioned campaign data, not independent historical stories.

[Web](apps/web/) · [iOS](apps/mobile/ios/) · [Android](apps/mobile/android/) · [Unreal](apps/unreal/) · [Unity](apps/unity/) · [Rules](packages/game-core/) · [Content](content/)

## Run locally

Use Node.js 22+. Start locally, then validate before building. Native and engine setup is documented in their directories; a web build does not certify a signed mobile package.

```bash
npm install
npm run dev
npm run validate
npm run build
```

http://127.0.0.1:5173

## Cinematic review

Smoothness means responsive orders, a durable save before a matching reaction, and an explicit continuation. Music/video must preserve captions, pause/skip, consent and reduced motion. Original faces and costumes must remain consistent. Musia, LocalVideoGen and Blender studies stay private until provenance, rights and visual/audio review pass.

[Design](docs/design/GAME_DESIGN_DOCUMENT.md) · [Sources](docs/history/SOURCE_POLICY.md) · [Playtests](docs/production/PLAYTESTING.md) · [Roadmap](docs/production/ROADMAP.md)

## Release boundaries

As of October 1, 2026, released mobile build 1 is separate from newer development. Apple publication was verified September 30; Google status needs live readback. Council/Fan Yang/retreat/refuge development has bounded tests, but some continuation content is QA-only. Character studies are not final film-quality art. Tests do not replace human review or physical-device performance. GitHub updates follow validated checkpoints; internal betas also require signing, upgrade tests and provider availability. No automatic daily scheduler is installed.

[Beta workflow](store/BETA_WORKFLOW.md) · [Native evidence](docs/production/NATIVE_REFUGE_UI_20261001.md) · [Local video rights](docs/production/LOCAL_VIDEO_RELEASE_GATE_20261001.md) · [Cloth study](docs/production/COUNCIL_GUSSET_CLOTH_20261001.md)

## Citation

Cite CITATION.cff when using SHI in research. Public visibility does not grant a reuse license; private books, keys and generated caches never belong in Git.

[CITATION.cff](CITATION.cff) · [LICENSE.md](LICENSE.md)

```bibtex
@software{chen_shi_2026,
  author = {Chen, Lachlan},
  title = {SHI: The Shape of Power},
  year = {2026},
  url = {https://github.com/lachlanchen/ShiGame}
}
```

Copyright © 2026 Lachlan Chen.
