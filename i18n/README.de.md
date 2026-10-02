[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · The Shape of Power / 《势》

*Ein Geschichtsspiel über Entscheidungen, die Leben verändern.*

[Web](https://lachlanchen.github.io/ShiGame/) · [Story](https://lachlanchen.github.io/ShiGame/story/) · [App Store](https://apps.apple.com/us/app/id6816377548) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.shi) · [Sponsor](https://github.com/sponsors/lachlanchen)

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI](../docs/production/evidence/web-01-title-en.png)

## Spiel

SHI beginnt im Regen in Daze, 209 v. Chr. Du spielst einen erfundenen Hüter des Einberufungsregisters: Getreide, Vertrauen, Menschen und Sichtbarkeit bestimmen erfüllbare Versprechen. Entscheidungen erzeugen Kosten, Gegenwehr und Erholung statt sicheren Sieg. Zizhi Tongjian bildet das historische Rückgrat; rekonstruierte Dialoge und alternative Ausgänge sind gekennzeichnet, keine angeblichen Zitate.

## Clients

Web nutzt React/Three.js und deterministische TypeScript-Regeln. iOS ist nativ mit SwiftUI/SceneKit/Foundation; Android enthält das Offline-Webspiel. Unreal 5.8 ist der filmische Desktop-Client; Unity 6 bleibt eine gemeinsame Inhaltsbasis. Versionierte Kampagnendaten verhindern getrennte historische Erzählungen.

[Web](../apps/web/) · [iOS](../apps/mobile/ios/) · [Android](../apps/mobile/android/) · [Unreal](../apps/unreal/) · [Unity](../apps/unity/) · [Rules](../packages/game-core/) · [Content](../content/)

## Lokal starten

Node.js 22+ ist erforderlich. Lokal starten und vor dem Bauen validieren. Einrichtungshinweise stehen in den Client-Verzeichnissen; ein Web-Build zertifiziert kein signiertes Mobilpaket.

```bash
npm install
npm run dev
npm run validate
npm run build
```

http://127.0.0.1:5173

## Filmische Prüfung

Flüssigkeit bedeutet schnelle Befehle, dauerhafte Speicherung vor der passenden Reaktion und ausdrückliche Fortsetzung. Musik und Video behalten Untertitel, Pause, Überspringen, Zustimmung und reduzierte Bewegung. Originalgesichter und Kleidung bleiben konsistent. Musia-, LocalVideoGen- und Blender-Studien bleiben privat, bis Herkunft, Rechte, Bild und Ton geprüft sind.

[Design](../docs/design/GAME_DESIGN_DOCUMENT.md) · [Sources](../docs/history/SOURCE_POLICY.md) · [Playtests](../docs/production/PLAYTESTING.md) · [Roadmap](../docs/production/ROADMAP.md)

## Veröffentlichungsgrenzen

Stand 2. Oktober 2026: Der veröffentlichte Mobil-Build 1 bleibt vom neuen Entwicklungsstand getrennt. Die Apple-Version ist herunterladbar; Google Production Build 1 wurde am 2. Oktober veröffentlicht. Der US-Store-Eintrag wurde mit 0,99 USD verifiziert, bei 169 Zielmärkten. TestFlight 1.0.1 (2) und Google Internal 1.0.0 (9) stehen den bestehenden Testern zur Verfügung; die öffentlichen Store-Versionen bleiben unverändert. Rat, Fan Yang, Rückzug und Zuflucht haben begrenzte Tests; Teile der Fortsetzung sind nur QA. Figuren sind keine endgültige Filmkunst. Tests ersetzen weder menschliche Prüfung noch reale Geräteleistung. GitHub folgt geprüften Meilensteinen; Betas brauchen Signierung, Upgrade-Test und bestätigte Verfügbarkeit. Kein automatischer Tagesplaner ist installiert.

[Beta workflow](../store/BETA_WORKFLOW.md) · [Native evidence](../docs/production/NATIVE_REFUGE_UI_20261001.md) · [Local video rights](../docs/production/LOCAL_VIDEO_RELEASE_GATE_20261001.md) · [Cloth study](../docs/production/COUNCIL_GUSSET_CLOTH_20261001.md)

## Zitation

In Forschung CITATION.cff zitieren. Öffentliche Sichtbarkeit gewährt keine Wiederverwendungslizenz; private Bücher, Schlüssel und Caches gehören nicht in Git.

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
