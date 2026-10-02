[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · The Shape of Power / 《势》

*人の運命を変える決断を描く歴史ゲーム。*

[Web](https://lachlanchen.github.io/ShiGame/) · [Story](https://lachlanchen.github.io/ShiGame/story/) · [App Store](https://apps.apple.com/us/app/id6816377548) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.shi) · [Sponsor](https://github.com/sponsors/lachlanchen)

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI](../docs/production/evidence/web-01-title-en.png)

## 巻ごとの設計 — 2026-10-02

SHIは巻ごとに完成させていきます。『資治通鑑』が扱う紀元前403年から959年までの歴史を軸に、『史記』『左伝』『漢書』『後漢書』と、所有者が提供した翻訳を参照します。第1巻はそれ以前の晋陽の包囲戦から始まり、領地と官職の分配、家の人間関係、後継者の問題へと進みます。

プレイヤーは決断、外交、連絡・仲介を行い、領地、財産、官職、成人の配偶者・側室との関係を通じて立場を築きます。得たものには、新たな味方、権利の主張、義務が伴います。動く人物、指揮できる場面、音楽、連続した映画的な場面転換を制作目標としています。

これは新しい設計と画面の目標です。晋陽のプレイ可能なビルドはまだ完成していません。既存の公開済みの章とベータ配信の記録は下記にまとめています。

[シリーズ設計](../docs/design/GAME_DESIGN_DOCUMENT.md) · [第1巻](../docs/design/JINYANG_CHAPTER_DESIGN.md) · [納品の判定基準](../docs/production/SHI_WORKABLE_GOAL.md)

![晋陽の場面コンセプト — 制作目標であり、ゲーム画面ではありません](../assets/art/lookdev/jinyang-scene-target-v1.png)

## 公開済みの章

SHIは紀元前209年、大沢の雨から始まります。主人公は創作された徴発名簿の記録係です。食糧、信頼、人々、露見の危険が守れる約束を左右します。選択は代償、対抗策、立て直しを生み、勝利を保証しません。『資治通鑑』を歴史の軸とし、再構成した台詞や別の結末は史料の引用と明確に区別します。

## クライアント

WebはReact/Three.jsと決定的なTypeScriptルールを使用。iOSはSwiftUI/SceneKit/Foundationのネイティブ実装、AndroidはオフラインWebゲームのパッケージです。Unreal 5.8は映画的なデスクトップ版、Unity 6は共通コンテンツの基盤です。各版はバージョン付きキャンペーンデータを共有し、歴史の内容を別々にしません。

[Web](../apps/web/) · [iOS](../apps/mobile/ios/) · [Android](../apps/mobile/android/) · [Unreal](../apps/unreal/) · [Unity](../apps/unity/) · [Rules](../packages/game-core/) · [Content](../content/)

## ローカル起動

Node.js 22+が必要です。ローカル起動後、ビルド前に検証してください。ネイティブ版とエンジンの設定は各ディレクトリに記載。Webビルド成功だけで署名済みモバイル版の品質を証明することはできません。

```bash
npm install
npm run dev
npm run validate
npm run build
```

http://127.0.0.1:5173

## 映像審査

滑らかさは、応答のよい命令、対応する反応より先に完了する永続保存、明確な続行で実現します。音楽と動画には字幕、一時停止、スキップ、同意、動きを減らす設定を残します。独自の顔と衣装は一貫させます。Musia、LocalVideoGen、Blenderの試作は、由来・権利・映像・音の審査が済むまで非公開です。

[Design](../docs/design/GAME_DESIGN_DOCUMENT.md) · [Sources](../docs/history/SOURCE_POLICY.md) · [Playtests](../docs/production/PLAYTESTING.md) · [Roadmap](../docs/production/ROADMAP.md)

## 公開の境界

2026年10月2日現在、公開済みモバイルビルド1と新しい開発版は別です。Apple版はダウンロード可能です。Google Productionのビルド1は10月2日に公開され、米国ストアのUS$0.99表示と169の対象市場を確認しました。TestFlight 1.0.1 (2) とGoogle内部テスト版1.0.0 (9) は既存のテスターが利用できます。公開ストア版は変更していません。評議、范陽、撤退、避難の開発には限定的なテストがあり、一部の続きはQA専用です。人物は最終的な映画品質の美術ではありません。テストは人の審査や実機性能を代替しません。GitHubは検証済み節目で更新し、内部ベータには署名、更新テスト、配信確認も必要です。毎日の自動配信スケジューラは設定していません。

[Beta workflow](../store/BETA_WORKFLOW.md) · [Native evidence](../docs/production/NATIVE_REFUGE_UI_20261001.md) · [Local video rights](../docs/production/LOCAL_VIDEO_RELEASE_GATE_20261001.md) · [Cloth study](../docs/production/COUNCIL_GUSSET_CLOTH_20261001.md)

## 引用

研究利用ではCITATION.cffを引用してください。公開は再利用許可を意味しません。非公開の書籍、鍵、生成キャッシュをGitに含めません。

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
