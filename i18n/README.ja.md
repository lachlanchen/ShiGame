[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · 力のかたち / 《勢》

*人・地形・時・信・兵站・制度が、いかに力の形を作るかを描く、美しく史料に誠実な戦略物語。*

[![Validate SHI](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml) [![Play pre-alpha](https://img.shields.io/badge/Play-Web_Pre--alpha-B8945B?style=flat-square)](https://lachlanchen.github.io/ShiGame/) [![Unity 6](https://img.shields.io/badge/Unity-6000.0.80f1-222?style=flat-square&logo=unity)](../apps/unity/) [![Sponsor](https://img.shields.io/github/sponsors/lachlanchen?style=flat-square)](https://github.com/sponsors/lachlanchen)

SHI は使い捨てのデモではなく、本制作中のゲームです。最初の章は紀元前209年、大沢郷の雨から始まります。架空の徴発名簿係として、足止めされた人々が政治運動へ変わる道を選びます。秦の崩壊から楚漢戦争へ進みますが、項羽や劉邦の勝敗を最初から必然とは描きません。

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI プレイ画面](../docs/production/evidence/web-01-title-en.png)

## SHI の特徴

- 兵糧・信頼・勢い・民・露見が相互作用し、単一の戦力値にはなりません。
- 速度は飢えを、正統性は負債を、秘密は不信を生み、選択が次の反撃と立て直しを作ります。
- 史書、後世の編纂、兵法の視点、劇的再構成を明示的に分けます。
- Web と実体のある Unity 6 プロジェクトが同じ戦役データを読みます。
- 11言語のUI、アラビア語RTL、生成資産の来歴・審査基盤があります。

## 現在の内容

| パス | 実装済み |
| --- | --- |
| [`apps/web`](../apps/web/) | 遊べるWeb版、保存、史料・決断台帳、モバイル、RTL |
| [`apps/unity`](../apps/unity/) | Unity 6 と3D軍議卓。Linux/WebGLエディタは導入済みで、ライセンスログインが公開ゲート |
| [`content`](../content/) | 6場面、15選択、5資源、回復局面、3結末 |
| [`docs`](../docs/) | 設計、史料、技術、多言語、アート、QA、公開、一年計画 |

## クイックスタート

```bash
npm install
npm run dev
npm run validate
npm run build
```

## アーキテクチャと研究基準

版管理された戦役JSONが唯一の物語ソースで、決定論的TypeScriptコアとUnity 6が共有します。私蔵書、OCR、チャット、完全メモはGitに含めません。[ゲーム設計](../docs/design/GAME_DESIGN_DOCUMENT.md)、[史料方針](../docs/history/SOURCE_POLICY.md)、[一年計画](../docs/production/ROADMAP.md)を参照してください。

## ビルドと検証

戦役グラフ、参照、翻訳キー、ルール、型、テストを自動検証します。可視noVNC/Chrome試験では遊び、圧力応手、キーボード、史料分類、保存、RTL、モバイル、WebGL、コンソールを31項目確認しました。[証拠](../docs/production/PLAYTESTING.md)も公開しています。

## 引用

研究・教育で使用する場合は [`CITATION.cff`](../CITATION.cff) を引用してください。

```bibtex
@software{chen_shi_2026,
  author = {Chen, Lachlan},
  title = {SHI: The Shape of Power},
  year = {2026},
  url = {https://github.com/lachlanchen/ShiGame}
}
```

## 状態と範囲

2026-08-09 システム実証プレアルファ。Web章には決定論的な圧力応手、セーブ移行、キーボード操作、全ルート検証、31項目の可視試験があります。実体のあるLinux/WebGL Unityエディタは導入され、Hubにも認識されています。ネイティブのインポートとコンパイルにはアカウント所有者によるログインとライセンス有効化が必要で、Unity 6の本番ピンは維持しています。両クライアント、史料、多言語、資産、プレイテスト、公開基準を満たすまで完成とはしません。
