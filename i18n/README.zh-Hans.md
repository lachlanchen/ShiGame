[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · The Shape of Power / 《势》

*让决策真正改变人的命运的历史游戏。*

[Web](https://lachlanchen.github.io/ShiGame/) · [Story](https://lachlanchen.github.io/ShiGame/story/) · [App Store](https://apps.apple.com/us/app/id6816377548) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.shi) · [Sponsor](https://github.com/sponsors/lachlanchen)

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI](../docs/production/evidence/web-01-title-en.png)

## 游戏

SHI从公元前209年大泽乡的雨夜开始。你是一位虚构的征发名册记录者：粮食、信任、同伴和暴露风险，决定哪些承诺能够兑现。选择带来代价、对手的应对和恢复机会，而非必然的胜利。《资治通鉴》是历史脊梁；重构对白和改写命运的分支明确标为戏剧创作，不冒充史书原文。

## 客户端

Web采用React/Three.js与确定性的TypeScript规则。iOS是SwiftUI/SceneKit/Foundation原生应用，Android封装离线Web游戏。Unreal 5.8负责电影式桌面体验；Unity 6保留共享内容基础。各端使用版本化战役数据，不各自编造独立的历史事实。

[Web](../apps/web/) · [iOS](../apps/mobile/ios/) · [Android](../apps/mobile/android/) · [Unreal](../apps/unreal/) · [Unity](../apps/unity/) · [Rules](../packages/game-core/) · [Content](../content/)

## 本地运行

需要Node.js 22+。先本地运行，再验证并构建。原生移动端与引擎的配置见对应目录；Web构建成功不等于移动签名包通过测试，也不能替代商店处理与测试者实际可用的回执。

```bash
npm install
npm run dev
npm run validate
npm run build
```

http://127.0.0.1:5173

## 电影式体验审查

流畅意味着命令响应及时、对应反应播放前完成可靠存档，并由玩家明确继续。音乐和视频必须保留字幕、暂停、跳过、同意和减少动态效果。原创角色的相貌与服装需要一致。Musia、LocalVideoGen和Blender试作在来源、授权、画面及声音审查通过前保持私有，不能只因为生成成功就进入游戏。

[Design](../docs/design/GAME_DESIGN_DOCUMENT.md) · [Sources](../docs/history/SOURCE_POLICY.md) · [Playtests](../docs/production/PLAYTESTING.md) · [Roadmap](../docs/production/ROADMAP.md)

## 发行边界

截至2026年10月2日，已发布的移动版build 1仍与新开发内容分开。Apple版可下载；Google Production build 1已于10月2日发布，美国商店页面确认售价US$0.99，目标市场为169个。TestFlight 1.0.1 (2) 与 Google 内部测试版 1.0.0 (9) 已向现有测试者开放；公开商店版本不变。议事、范阳、撤退与避难的开发已有范围限定的测试，但部分后续内容仅供QA。角色研究还不是最终电影级美术，测试不代替人工审查与实机性能。GitHub在验证通过的里程碑更新；内部测试还须签名、升级测试及确认测试者可安装。不承诺未经设置的每日自动上传。

[Beta workflow](../store/BETA_WORKFLOW.md) · [Native evidence](../docs/production/NATIVE_REFUGE_UI_20261001.md) · [Local video rights](../docs/production/LOCAL_VIDEO_RELEASE_GATE_20261001.md) · [Cloth study](../docs/production/COUNCIL_GUSSET_CLOTH_20261001.md)

## 引用

研究使用请引用CITATION.cff。公开可见不授予再利用许可；私有书籍、密钥和生成缓存不进入Git。请区分历史证据、游戏规则、视觉试作及正式发行的版本，不将工程通过称作艺术完成。

[CITATION.cff](../CITATION.cff) · [LICENSE.md](../LICENSE.md)

```bibtex
@software{chen_shi_2026,
  author = {Chen, Lachlan},
  title = {SHI: The Shape of Power},
  year = {2026},
  url = {https://github.com/lachlanchen/ShiGame}
}
```

Copyright © 2026 Lachlan Chen.
