[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · 權力之形 / 《勢》

*一部關於人、地、時、信念、糧道與制度如何共同成為權力的美麗而嚴謹的歷史策略敘事。*

[![Validate SHI](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml) [![Play pre-alpha](https://img.shields.io/badge/Play-Web_Pre--alpha-B8945B?style=flat-square)](https://lachlanchen.github.io/ShiGame/) [![Unity 6](https://img.shields.io/badge/Unity-6000.0.80f1-222?style=flat-square&logo=unity)](../apps/unity/) [![Sponsor](https://img.shields.io/github/sponsors/lachlanchen?style=flat-square)](https://github.com/sponsors/lachlanchen)

SHI 是正式製作中的遊戲，而非一次性展示。第一段可玩章節始於公元前 209 年的大澤鄉雨夜：玩家扮演一名虛構的戍卒名籍吏，決定一群受困之人如何成為政治運動。更長的戰役將走向秦亡與楚漢相爭，但不會把項羽、劉邦或後來的勝負寫成必然命運。

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI 可玩標題畫面](../docs/production/evidence/web-01-title-en.png)

## SHI 的獨特之處

- 糧、信、勢、民與險共同構成局面，不被壓成一個「戰力」數字。
- 選擇會製造反制與整頓：速度帶來飢餓，合法性帶來債務，隱秘也會削弱信心。
- 歷史記載、後世編纂、兵學視角與戲劇性重構明確分開。
- 網頁端與真正的 Unity 6 工程讀取同一份戰役資料。
- 十一種介面語言、阿拉伯語 RTL 和資產來源審查已建立。

## 當前內容

| 路徑 | 已實現內容 |
| --- | --- |
| [`apps/web`](../apps/web/) | 可玩網頁端、存檔、史料簿、決策記錄、移動端與 RTL |
| [`apps/unity`](../apps/unity/) | Unity 6 與 3D 軍議圖；Linux/WebGL 編輯器已安裝，授權登入仍是公開阻塞項 |
| [`content`](../content/) | 6 場景、15 選擇、5 資源、整頓與 3 個結局 |
| [`docs`](../docs/) | 設計、史料、架構、本地化、美術、測試、發布與一年路線圖 |

## 快速開始

```bash
npm install
npm run dev
npm run validate
npm run build
```

## 架構與研究基線

戰役 JSON 是唯一敘事真源，由確定性 TypeScript 核心與 Unity 6 共用。私人書籍、OCR、聊天與完整備忘錄不進入 Git。詳見[遊戲設計](../docs/design/GAME_DESIGN_DOCUMENT.md)、[史料政策](../docs/history/SOURCE_POLICY.md)與[一年路線圖](../docs/production/ROADMAP.md)。

## 構建與驗證

自動驗證涵蓋戰役圖、引用、翻譯鍵、規則、型別與測試；可見 noVNC/Chrome 另通過 31 項玩法、壓力應手、鍵盤、RTL、行動版與存檔檢查。證據見[測試說明](../docs/production/PLAYTESTING.md)。

## 引用

研究或教學使用請引用 [`CITATION.cff`](../CITATION.cff)。

```bibtex
@software{chen_shi_2026,
  author = {Chen, Lachlan},
  title = {SHI: The Shape of Power},
  year = {2026},
  url = {https://github.com/lachlanchen/ShiGame}
}
```

## 狀態與範圍

2026-08-09 前期系統版本。網頁章節現有確定性的壓力應手、存檔遷移、鍵盤操作、全路線驗證與 31 項可見測試；真正的 Linux/WebGL Unity 編輯器已安裝並由 Hub 識別。原生導入與編譯仍需帳戶持有人登入並啟用 Unity 授權；Unity 6 生產版本鎖定不變。雙端構建、史料、本地化、資產、試玩與發布關卡真正通過前，專案不會宣稱完成。
