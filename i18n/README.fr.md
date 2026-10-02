[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · The Shape of Power / 《势》

*Un jeu historique où les décisions changent des vies.*

[Web](https://lachlanchen.github.io/ShiGame/) · [Story](https://lachlanchen.github.io/ShiGame/story/) · [App Store](https://apps.apple.com/us/app/id6816377548) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.shi) · [Sponsor](https://github.com/sponsors/lachlanchen)

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI](../docs/production/evidence/web-01-title-en.png)

## Conception par volumes — 2026-10-02

SHI se développe volume par volume, avec l’histoire du Zizhi Tongjian de 403 av. J.-C. à 959 comme fil conducteur, et le Shiji, le Zuo Zhuan, le Hanshu, le Hou Hanshu ainsi que les traductions fournies par le propriétaire comme références. Le volume I s’ouvre sur le siège antérieur de Jinyang, puis aborde le partage des terres et des charges, les relations du foyer et la succession.

Le joueur prend des décisions, mène des négociations diplomatiques et établit des contacts. Terres, richesse, charges et relations avec des épouses et des concubines adultes façonnent sa position. Chaque gain apporte des alliés, des revendications et des obligations. Personnages animés, scènes à commander, musique et transitions cinématographiques continues constituent l’objectif de production.

Il s’agit du nouveau projet et de sa cible visuelle ; aucune version jouable de Jinyang n’a encore été livrée. Le chapitre déjà publié et les justificatifs des bêtas sont décrits ci-dessous.

[Conception de la série](../docs/design/GAME_DESIGN_DOCUMENT.md) · [Volume I](../docs/design/JINYANG_CHAPTER_DESIGN.md) · [Critères de livraison](../docs/production/SHI_WORKABLE_GOAL.md)

![Concept de la scène de Jinyang — cible de production, pas une capture du jeu](../assets/art/lookdev/jinyang-scene-target-v1.png)

## Chapitre publié

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

Au 2 octobre 2026, le build mobile 1 publié reste distinct du développement. La version Apple est téléchargeable ; le build 1 de Google Production a été publié le 2 octobre, avec une fiche américaine vérifiée à 0,99 USD et 169 marchés ciblés. TestFlight 1.0.1 (2) et la version de test interne Google 1.0.0 (9) sont disponibles pour les testeurs existants ; les versions publiques restent inchangées. Conseil, Fan Yang, retraite et refuge ont des tests bornés, mais certaines suites restent QA. Les personnages ne sont pas un art cinématographique final. Tests, avis humains et performances physiques sont distincts. GitHub suit les points validés ; les bêtas exigent signature, test de mise à niveau et disponibilité confirmée. Aucun calendrier quotidien automatique n'est installé.

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
