[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · The Shape of Power / 《势》

*讓決策真正改變人的命運的歷史遊戲。*

[Web](https://lachlanchen.github.io/ShiGame/) · [Story](https://lachlanchen.github.io/ShiGame/story/) · [App Store](https://apps.apple.com/us/app/id6816377548) · [Sponsor](https://github.com/sponsors/lachlanchen)

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI](../docs/production/evidence/web-01-title-en.png)

## 遊戲

SHI從公元前209年大澤鄉的雨夜開始。你是一位虛構的徵發名冊記錄者：糧食、信任、同伴和暴露風險，決定哪些承諾能夠兌現。選擇帶來代價、對手的應對和恢復機會，而非必然的勝利。《資治通鑑》是歷史脊梁；重構對白和改寫命運的分支明確標為戲劇創作，不冒充史書原文。

## 客戶端

Web採用React/Three.js與確定性的TypeScript規則。iOS是SwiftUI/SceneKit/Foundation原生應用，Android封裝離線Web遊戲。Unreal 5.8負責電影式桌面體驗；Unity 6保留共享內容基礎。各端使用版本化戰役資料，不各自編造獨立的歷史事實。

[Web](../apps/web/) · [iOS](../apps/mobile/ios/) · [Android](../apps/mobile/android/) · [Unreal](../apps/unreal/) · [Unity](../apps/unity/) · [Rules](../packages/game-core/) · [Content](../content/)

## 本地執行

需要Node.js 22+。先本地執行，再驗證並建置。原生行動端與引擎的設定見對應目錄；Web建置成功不等於行動簽名套件通過測試，也不能替代商店處理與測試者實際可用的回執。

```bash
npm install
npm run dev
npm run validate
npm run build
```

http://127.0.0.1:5173

## 電影式體驗審查

流暢意味著命令回應及時、對應反應播放前完成可靠存檔，並由玩家明確繼續。音樂和影片必須保留字幕、暫停、跳過、同意和減少動態效果。原創角色的相貌與服裝需要一致。Musia、LocalVideoGen和Blender試作在來源、授權、畫面及聲音審查通過前保持私有，不能只因為生成成功就進入遊戲。

[Design](../docs/design/GAME_DESIGN_DOCUMENT.md) · [Sources](../docs/history/SOURCE_POLICY.md) · [Playtests](../docs/production/PLAYTESTING.md) · [Roadmap](../docs/production/ROADMAP.md)

## 發行邊界

截至2026年10月1日，已發布行動build 1與新開發內容分開。Apple發布於9月30日核實；Google需要讀取最新狀態。議事、范陽、撤退與避難的開發已有範圍限定的測試，但部分後續內容僅供QA。角色研究還不是最終電影級美術，測試不代替人工審查與實機效能。GitHub在驗證通過的里程碑更新；內部測試還須簽名、升級測試及確認測試者可安裝。不承諾未經設定的每日自動上傳。

[Beta workflow](../store/BETA_WORKFLOW.md) · [Native evidence](../docs/production/NATIVE_REFUGE_UI_20261001.md) · [Local video rights](../docs/production/LOCAL_VIDEO_RELEASE_GATE_20261001.md) · [Cloth study](../docs/production/COUNCIL_GUSSET_CLOTH_20261001.md)

## 引用

研究使用請引用CITATION.cff。公開可見不授予再利用許可；私有書籍、密鑰和生成快取不進入Git。請區分歷史證據、遊戲規則、視覺試作及正式發行的版本，不將工程通過稱作藝術完成。

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
