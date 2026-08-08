[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · La forme du pouvoir / 《勢》

*Un récit stratégique beau et historiquement rigoureux sur la manière dont personnes, terrain, temps, croyance, logistique et institutions deviennent pouvoir.*

[![Validate SHI](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml) [![Play pre-alpha](https://img.shields.io/badge/Play-Web_Pre--alpha-B8945B?style=flat-square)](https://lachlanchen.github.io/ShiGame/) [![Unity 6](https://img.shields.io/badge/Unity-6000.0.80f1-222?style=flat-square&logo=unity)](../apps/unity/) [![Sponsor](https://img.shields.io/github/sponsors/lachlanchen?style=flat-square)](https://github.com/sponsors/lachlanchen)

SHI est un véritable jeu en production, pas une démo jetable. Le premier chapitre jouable commence sous la pluie de Daze en 209 av. J.-C. Dans le rôle fictif du gardien d'un registre de conscription, le joueur décide comment un groupe bloqué devient mouvement politique. La campagne mène à la chute des Qin puis au conflit Chu–Han sans rendre Xiang Yu, Liu Bang ni la victoire ultérieure inévitables.

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![Écran jouable de SHI](../docs/production/evidence/web-01-title-en.png)

## Ce qui distingue SHI

- Grain, confiance, élan, peuple et exposition forment une position, pas une unique statistique de force.
- Vitesse, légitimité et secret créent faim, dette ou méfiance : chaque choix engendre riposte et récupération.
- Sources historiques, compilations tardives, textes stratégiques et reconstruction dramatique sont distingués.
- Le Web et un vrai projet Unity 6 partagent la même campagne versionnée.
- Onze langues d'interface, RTL arabe et provenance/revue de chaque ressource générée sont en place.

## Contenu actuel

| Chemin | Réalisé maintenant |
| --- | --- |
| [`apps/web`](../apps/web/) | Web jouable, sauvegarde, registres sources/décisions, mobile et RTL |
| [`apps/unity`](../apps/unity/) | Unity 6 et table 3D ; import/build éditeur reste un blocage publié |
| [`content`](../content/) | 6 scènes, 15 choix, 5 ressources, récupération et 3 fins |
| [`docs`](../docs/) | Design, histoire, architecture, localisation, art, QA, publication et feuille de route |

## Démarrage rapide

```bash
npm install
npm run dev
npm run validate
npm run build
```

## Architecture et recherche

Le JSON versionné est l'unique source narrative, partagée par le cœur déterministe TypeScript et Unity 6. Livres privés, OCR, discussions et mémo complet n'entrent pas dans Git. Lire le [design](../docs/design/GAME_DESIGN_DOCUMENT.md), la [politique des sources](../docs/history/SOURCE_POLICY.md) et la [feuille de route annuelle](../docs/production/ROADMAP.md).

## Build et validation

La validation couvre graphe, références, clés linguistiques, règles, types et tests. Le test visible noVNC/Chrome a réussi 21 contrôles de jeu, sources, sauvegarde, RTL, mobile, WebGL et console. Voir les [preuves](../docs/production/PLAYTESTING.md).

## Citation

Pour un usage en recherche ou enseignement, citez [`CITATION.cff`](../CITATION.cff).

```bibtex
@software{chen_shi_2026,
  author = {Chen, Lachlan},
  title = {SHI: The Shape of Power},
  year = {2026},
  url = {https://github.com/lachlanchen/ShiGame}
}
```

## État et périmètre

Pré-alpha du 2026-08-08. Le chapitre Web est construit et testé visuellement. Unity n'est pas encore compilé à cause du point de téléchargement Linux officiel ; ce feu rouge est explicite. Le projet ne sera pas déclaré achevé avant validation des deux clients, de la recherche, des langues, des ressources, des playtests et de la publication.
