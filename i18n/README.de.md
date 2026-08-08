[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · Die Gestalt der Macht / 《勢》

*Eine schöne, historisch gewissenhafte Strategieerzählung darüber, wie Menschen, Gelände, Zeit, Glaube, Logistik und Institutionen Macht formen.*

[![Validate SHI](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml) [![Play pre-alpha](https://img.shields.io/badge/Play-Web_Pre--alpha-B8945B?style=flat-square)](https://lachlanchen.github.io/ShiGame/) [![Unity 6](https://img.shields.io/badge/Unity-6000.0.80f1-222?style=flat-square&logo=unity)](../apps/unity/) [![Sponsor](https://img.shields.io/github/sponsors/lachlanchen?style=flat-square)](https://github.com/sponsors/lachlanchen)

SHI ist ein echtes Spiel in Produktion, keine Wegwerf-Demo. Das erste spielbare Kapitel beginnt 209 v. Chr. im Regen von Daze. Als fiktiver Verwalter einer Einberufungsliste entscheidet der Spieler, wie aus einer festsitzenden Gruppe eine politische Bewegung wird. Die Kampagne führt vom Zerfall Qins zum Chu–Han-Konflikt, ohne Xiang Yu, Liu Bang oder den späteren Sieg als unvermeidlich darzustellen.

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![Spielbarer SHI-Bildschirm](../docs/production/evidence/web-01-title-en.png)

## Was SHI unterscheidet

- Getreide, Vertrauen, Dynamik, Menschen und Entdeckung bilden eine Lage statt eines einzigen Stärkewerts.
- Tempo kann Hunger, Legitimität Schulden und Geheimhaltung Misstrauen schaffen; Entscheidungen erzeugen Gegenwehr und Erholung.
- Historische Berichte, spätere Kompilationen, Strategietexte und dramatische Rekonstruktion bleiben getrennt.
- Web und ein echtes Unity-6-Projekt nutzen dieselbe versionierte Kampagne.
- Elf UI-Sprachen, arabisches RTL und Herkunft/Prüfung jedes generierten Assets sind angelegt.

## Aktueller Inhalt

| Pfad | Jetzt umgesetzt |
| --- | --- |
| [`apps/web`](../apps/web/) | Spielbares Web, Speicherung, Quellen-/Entscheidungsregister, Mobil und RTL |
| [`apps/unity`](../apps/unity/) | Unity 6 und 3D-Kartentisch; Linux/WebGL-Editor installiert, Lizenzanmeldung bleibt offen dokumentiert |
| [`content`](../content/) | 6 Szenen, 15 Entscheidungen, 5 Ressourcen, Erholung und 3 Enden |
| [`docs`](../docs/) | Design, Geschichte, Architektur, Lokalisierung, Kunst, QA, Veröffentlichung, Jahresplan |

## Schnellstart

```bash
npm install
npm run dev
npm run validate
npm run build
```

## Architektur und Forschung

Das versionierte Kampagnen-JSON ist die einzige Erzählquelle für den deterministischen TypeScript-Kern und Unity 6. Private Bücher, OCR, Chats und das vollständige Memo bleiben außerhalb von Git. Siehe [Gamedesign](../docs/design/GAME_DESIGN_DOCUMENT.md), [Quellenrichtlinie](../docs/history/SOURCE_POLICY.md) und [Jahresplan](../docs/production/ROADMAP.md).

## Build und Prüfung

Die Validierung prüft Graph, Verweise, Sprachschlüssel, Regeln, Typen und Tests. Der sichtbare noVNC/Chrome-Test bestand 21 Prüfungen zu Spiel, Quellen, Speicherung, RTL, Mobil, WebGL und Konsole. [Nachweise](../docs/production/PLAYTESTING.md) sind enthalten.

## Zitieren

Für Forschung oder Lehre bitte [`CITATION.cff`](../CITATION.cff) zitieren.

```bibtex
@software{chen_shi_2026,
  author = {Chen, Lachlan},
  title = {SHI: The Shape of Power},
  year = {2026},
  url = {https://github.com/lachlanchen/ShiGame}
}
```

## Status und Umfang

Pre-Alpha vom 2026-08-08. Das Web-Kapitel ist gebaut und sichtbar getestet. Der echte Unity-Editor mit Linux/WebGL ist installiert und von Hub erkannt. Nativer Import und Kompilierung erfordern noch die Anmeldung des Kontoinhabers und die Aktivierung einer Unity-Lizenz; der Unity-6-Produktionsstand bleibt fixiert. Vollständig ist das Projekt erst nach beiden Clients, Forschung, Sprachen, Assets, Playtests und Releaseprüfungen.
