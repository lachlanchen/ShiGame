[English](README.md) · [العربية](i18n/README.ar.md) · [Español](i18n/README.es.md) · [Français](i18n/README.fr.md) · [日本語](i18n/README.ja.md) · [한국어](i18n/README.ko.md) · [Tiếng Việt](i18n/README.vi.md) · [中文 (简体)](i18n/README.zh-Hans.md) · [中文（繁體）](i18n/README.zh-Hant.md) · [Deutsch](i18n/README.de.md) · [Русский](i18n/README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · The Shape of Power / 《势》

*A beautiful, historically grounded strategy narrative about how people, terrain, time, belief, logistics, and institutions become power.*

[![Validate SHI](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml) [![Play pre-alpha](https://img.shields.io/badge/Play-Web_Pre--alpha-B8945B?style=flat-square)](https://lachlanchen.github.io/ShiGame/) [![Unity 6](https://img.shields.io/badge/Unity-6000.0.80f1-222?style=flat-square&logo=unity)](apps/unity/) [![Sponsor](https://img.shields.io/github/sponsors/lachlanchen?style=flat-square)](https://github.com/sponsors/lachlanchen)

SHI is a production game project—not a disposable demo. Its first playable chapter begins in the rain at Daze Village in 209 BCE, as a fictional levy-record keeper must decide how a stranded group becomes a political movement. The wider campaign follows the collapse of Qin toward the Chu–Han contention without treating Xiang Yu, Liu Bang, or later victory as inevitable.

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI playable title screen](docs/production/evidence/web-01-title-en.png)

## Why SHI is different

- Power is positional: grain, trust, momentum, people, and exposure create opportunities and obligations rather than a single “strength” score.
- Choices create counterplay and recovery problems. Every nonterminal decision warns about one exposed weakness, then reveals and records an authored state, terrain, supply, or network response.
- Every new chronicle receives a shareable seed that selects a small authored field condition. The exact signal and effects are disclosed before commitment, recorded afterward, and explicitly labeled dramatic reconstruction.
- Historical accounts, later compilations, strategic texts, and dramatic reconstructions are visibly separated.
- The wartable is playable intelligence, not decoration: known ground, reported networks and reference-only places expose uncertainty and claim-filtered evidence without leaking later victory into the opening scene.
- One versioned campaign payload drives both the polished web client and a real pinned Unity 6 project.
- English, Arabic, German, Spanish, French, Japanese, Korean, Russian, Vietnamese, Simplified Chinese, and Traditional Chinese UI foundations are present, including Arabic RTL.
- Every generated art or 3D asset keeps provenance and a review trail; rejected revisions remain documented.

## Current contents

| Path | What is real now |
| --- | --- |
| [`apps/web`](apps/web/) | Playable React/Vite client, lazy Three.js atmosphere and intelligence map, replayable save-v3 migration, seeded field signals, first-run guide, three-stage decision records, keyboard/gamepad/touch input, responsive and RTL layouts |
| [`apps/unity`](apps/unity/) | Unity 6 LTS project consuming the same campaign, selectable/raycasted 3D wartable markers, localized intelligence/guide/record/gamepad UI, native preflight/build automation and EditMode tests; license/import gate is documented |
| [`content`](content/) | Chapter I with 6 scenes, 15 choices, 12 pressure responses, 12 classified field conditions, 5 resources, a recovery turn, 3 conclusions, 7 source records, 13 claim records, and 5 registered editions |
| [`packages/game-core`](packages/game-core/) | Seed-reproducible three-stage resolution, authoritative save replay/migration, requirements, failure thresholds, exhaustive condition-route validation, localization fallback, and tests |
| [`assets`](assets/) | Reviewed Daze key art and AgenticApp/Blender wartable source, preview, `.blend`, GLB, FBX, and provenance |
| [`docs`](docs/) | Game design, history policy, architecture, localization, accessibility contract, art direction, engine status, release gates, QA evidence, and one-year roadmap |

## Quick start

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. To verify the production checkpoint:

```bash
npm run validate
npm run build
```

Unity instructions and the honest editor-status gate are in [`apps/unity/README.md`](apps/unity/README.md) and [`docs/production/ENGINE_STATUS.md`](docs/production/ENGINE_STATUS.md).

## Architecture and research baseline

```text
historical claim records + authored reconstruction
                    ↓
      versioned campaign JSON + SHA-256
          ↙                         ↘
TypeScript seed-reproducible core  Unity 6 runtime
          ↓                         ↓
 React/Vite/Three.js web        3D wartable client
```

Private books, OCR collections, chat extracts, downloads, and the complete working memo remain outside Git. The project records pinpoint metadata and reviewed original prose rather than publishing source files. Read the [game design document](docs/design/GAME_DESIGN_DOCUMENT.md), [wartable intelligence contract](docs/design/WARTABLE_INTELLIGENCE.md), [historical review system](docs/history/HISTORICAL_REVIEW_SYSTEM.md), [edition register](docs/history/EDITION_REGISTER.md), [seeded uncertainty contract](docs/design/SEEDED_UNCERTAINTY.md), [source policy](docs/history/SOURCE_POLICY.md), [accessibility contract](docs/production/ACCESSIBILITY.md), and [one-year roadmap](docs/production/ROADMAP.md).

## Build and validation

`npm run validate` checks the edition/rights register, campaign graph, source-to-claim-to-scene/site closure, intelligence states and coordinate bounds, reconstruction boundaries, identifiers, localization keys, seeded rules, save migration, every field-condition branch, curated contrast/microtype/target/forced-colors contracts, pinned font licenses/routes/CSP, types, 29 tests and representative axe scans. `npm run build` additionally enforces initial/lazy/font/deployment size budgets. The visible noVNC/Chrome gate adds 147 checks across gameplay, onboarding, modal focus/isolation, duplicate-choice prevention, synthetic standard-gamepad input, wartable intelligence/evidence, pressure/field counterplay, seeded persistence, exact locators and uncertainty states, keyboard input, all eleven locale fonts/directions/header layouts, remote-network absence, Arabic RTL, 200% title/game text, 320 CSS pixel 400%-equivalent reflow, forced colors, reduced motion, control geometry, mobile layout, WebGL and console errors. Evidence and reproduction details are in [`docs/production/PLAYTESTING.md`](docs/production/PLAYTESTING.md).

## Citation

If you use SHI in research or teaching, cite the repository. GitHub reads [CITATION.cff](CITATION.cff) and shows a **Cite this repository** panel.

```bibtex
@software{chen_shi_2026,
  author = {Chen, Lachlan},
  title = {SHI: The Shape of Power},
  year = {2026},
  url = {https://github.com/lachlanchen/ShiGame}
}
```

## Status and scope

Pre-alpha accessibility-resilience checkpoint, 2026-08-09. The existing schema-v3 Chapter I, wartable, self-hosted multilingual typography, CSP and network-privacy behavior remain intact. Exact localhost implementation `73792273c6cc2bb2f55378591af2147908a9d4fd` passes 147 visible checks, twenty-one semantic scans, eleven locale-font/layout audits and thirteen target audits with zero console errors, remote requests, remote resources or non-cancelled network failures. The web player now has visible 320 CSS pixel 400%-equivalent title/gameplay evidence and a forced-colors contract that removes ornament while retaining system-color text, structured meters, focus/selection outlines and shape-distinct danger/intelligence states. Actual browser-zoom, magnifier and human Windows High Contrast sessions remain open. The initial player code remains within its 100 KiB budget at 96.68 KiB gzip; 8.83 KiB CSS, complete font coverage and the 26.75 MiB deployment artifact also pass enforced caps. A real Unity editor with Linux and Web support is installed and visible in Hub on the corrected dedicated desktop, and the Unity runtime, editor and EditMode-test sources pass an offline reference-assembly type compile. A refreshed native preflight still stops before import because no account entitlement or valid license is available. Official project import, EditMode execution, assistive-technology and physical-controller sessions, and player builds remain stopped by Unity account licensing or require observed hardware; Qin-law and historical-GIS specialist gates also remain open. Those gates remain red rather than hidden. SHI is planned as a one-year quality-driven production, and this repository will not label the goal complete until both clients, research, localization, assets, observed player sessions, and release checks pass.

Copyright © 2026 Lachlan Chen. Public visibility does not grant a reuse license; see [LICENSE.md](LICENSE.md).
