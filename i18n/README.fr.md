[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · The Shape of Power / 《势》

*Un jeu historique où les décisions changent des vies.*

[Web](https://lachlanchen.github.io/ShiGame/) · [Story](https://lachlanchen.github.io/ShiGame/story/) · [App Store](https://apps.apple.com/us/app/id6816377548) · [Sponsor](https://github.com/sponsors/lachlanchen)

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI](../docs/production/evidence/web-01-title-en.png)

## Jeu

SHI commence sous la pluie à Daze en 209 avant notre ère. Vous incarnez un gardien fictif du registre des conscrits : grain, confiance, personnes et exposition déterminent les promesses tenables. Les choix créent coûts, opposition et possibilités de reprise, jamais une victoire inévitable. Zizhi Tongjian est le fil historique ; dialogues reconstruits et issues alternatives sont signalés, pas présentés comme citations.

## Clients

Le web utilise React/Three.js et des règles TypeScript déterministes. iOS est natif SwiftUI/SceneKit/Foundation ; Android embarque le jeu hors ligne. Unreal 5.8 est le client cinématographique de bureau ; Unity 6 conserve une base commune. Les clients utilisent des données versionnées, pas des récits historiques indépendants.

[Web](../apps/web/) · [iOS](../apps/mobile/ios/) · [Android](../apps/mobile/android/) · [Unreal](../apps/unreal/) · [Unity](../apps/unity/) · [Rules](../packages/game-core/) · [Content](../content/)

## Lancement local

Node.js 22+ est requis. Lancez localement puis validez avant compilation. Les dossiers des clients documentent leur préparation ; une compilation web ne certifie pas un paquet mobile signé.

```bash
npm install
npm run dev
npm run validate
npm run build
```

http://127.0.0.1:5173

## Revue cinématographique

La fluidité exige des commandes réactives, une sauvegarde durable avant une réaction correspondante et une continuation explicite. Musique et vidéo gardent sous-titres, pause, saut, consentement et réduction des mouvements. Visages et costumes originaux restent cohérents. Les études Musia, LocalVideoGen et Blender restent privées jusqu'à validation des sources, droits, images et sons.

[Design](../docs/design/GAME_DESIGN_DOCUMENT.md) · [Sources](../docs/history/SOURCE_POLICY.md) · [Playtests](../docs/production/PLAYTESTING.md) · [Roadmap](../docs/production/ROADMAP.md)

## Limites de publication

Au 1 octobre 2026, la version mobile publiée, build 1, reste distincte du développement. Apple a été vérifié le 30 septembre ; Google exige une lecture actuelle. Conseil, Fan Yang, retraite et refuge ont des tests bornés, mais certaines suites restent QA. Les personnages ne sont pas un art cinématographique final. Tests, avis humains et performances physiques sont distincts. GitHub suit les points validés ; les bêtas exigent signature, test de mise à niveau et disponibilité confirmée. Aucun calendrier quotidien automatique n'est installé.

[Beta workflow](../store/BETA_WORKFLOW.md) · [Native evidence](../docs/production/NATIVE_REFUGE_UI_20261001.md) · [Local video rights](../docs/production/LOCAL_VIDEO_RELEASE_GATE_20261001.md) · [Cloth study](../docs/production/COUNCIL_GUSSET_CLOTH_20261001.md)

## Citation

Citez CITATION.cff pour la recherche. La visibilité publique n'accorde aucun droit de réutilisation ; livres privés, clés et caches restent hors de Git.

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
