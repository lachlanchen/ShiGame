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
- Qin pursuit is a persistent, readable opponent: the current Exposure band, exact added pressure and a concrete counterplay are disclosed before commitment and recorded afterward.
- Qin also forms a deterministic, disclosed read of repeated strategic methods. Every choice names its method and shows whether the prepared counter will hit; changing method makes the read miss.
- Every new chronicle receives a shareable seed that selects a small authored field condition. The exact signal and effects are disclosed before commitment, recorded afterward, and explicitly labeled dramatic reconstruction.
- Historical accounts, later compilations, strategic texts, and dramatic reconstructions are visibly separated.
- The wartable is playable intelligence, not decoration: known ground, reported networks and reference-only places expose uncertainty and claim-filtered evidence without leaking later victory into the opening scene.
- A shared opt-in soundscape gives rain, focus, inspection and consequence a restrained procedural language. Ambience and effects mix independently, sound never carries exclusive information, deterministic and actual-browser output pass objective audio gates, and human listening approval remains an open release gate.
- One versioned campaign payload drives both the polished web client and a real pinned Unity 6 project.
- English, Arabic, German, Spanish, French, Japanese, Korean, Russian, Vietnamese, Simplified Chinese, and Traditional Chinese UI foundations are present, including Arabic RTL.
- Every generated art or 3D asset keeps provenance and a review trail; rejected revisions remain documented.

## Current contents

| Path | What is real now |
| --- | --- |
| [`apps/web`](apps/web/) | Playable React/Vite client, lazy Three.js atmosphere/intelligence map and Web Audio soundscape, replayable save-v5 migration, persistent pursuit, strategic-method reads and seeded field signals, first-run guide, five-layer decision records, keyboard/gamepad/touch input, responsive and RTL layouts |
| [`apps/unity`](apps/unity/) | Unity 6 LTS project consuming the same campaign/audio contracts, selectable/raycasted 3D wartable markers, procedural rain/cues, localized mixer/intelligence/guide/record/gamepad UI, native preflight/build automation and EditMode tests; license/import gate is documented |
| [`content`](content/) | Chapter I with 6 scenes, 15 method-tagged choices, 12 pressure responses, 3 classified pursuit postures, 3 strategic methods, 3 prepared counters plus a neutral read, 12 classified field conditions, 5 resources, a recovery turn, 3 conclusions, 7 source records, 13 claim records, 5 registered editions, and one versioned procedural-audio contract |
| [`packages/game-core`](packages/game-core/) | Seed-reproducible five-layer resolution, authoritative save replay/migration, deterministic opponent memory, requirements, failure thresholds, exhaustive condition-route validation, localization fallback, and tests |
| [`assets`](assets/) | Reviewed Daze key art and AgenticApp/Blender wartable source, preview, `.blend`, GLB, FBX, and provenance |
| [`docs`](docs/) | Game design, history policy, architecture, localization, accessibility/audio contracts, art direction, engine status, release gates, measured QA evidence, and one-year roadmap |

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
historical claims + authored reconstruction + audio contract
                         ↓
       versioned shared JSON + validation + SHA-256
          ↙                                  ↘
TypeScript seed-reproducible core  Unity 6 runtime
          ↓                                  ↓
 React/Vite/Three.js/Web Audio     3D wartable/audio client
```

Private books, OCR collections, chat extracts, downloads, and the complete working memo remain outside Git. The project records pinpoint metadata and reviewed original prose rather than publishing source files. Read the [game design document](docs/design/GAME_DESIGN_DOCUMENT.md), [opposition posture contract](docs/design/OPPOSITION_POSTURE.md), [opposition method-read contract](docs/design/OPPOSITION_METHOD_READ.md), [wartable intelligence contract](docs/design/WARTABLE_INTELLIGENCE.md), [historical review system](docs/history/HISTORICAL_REVIEW_SYSTEM.md), [edition register](docs/history/EDITION_REGISTER.md), [seeded uncertainty contract](docs/design/SEEDED_UNCERTAINTY.md), [audio direction](docs/art/AUDIO_DIRECTION.md), [source policy](docs/history/SOURCE_POLICY.md), [accessibility contract](docs/production/ACCESSIBILITY.md), and [one-year roadmap](docs/production/ROADMAP.md).

## Build and validation

`npm run validate` checks the edition/rights register, campaign graph, source-to-claim-to-scene/site closure, intelligence states and coordinate bounds, reconstruction boundaries, identifiers, localization keys, pursuit/method-read/seeded rules, save migration, every field-condition branch, the exact audio/provenance/synchronization/measurement contract, curated contrast/microtype/target/forced-colors contracts, pinned font licenses/routes/CSP, types, 42 tests and representative axe scans. `npm run build` additionally enforces initial/lazy/font/deployment size budgets. The visible noVNC/Chrome gate adds 202 checks across gameplay, pursuit escalation, deterministic method memory, hit/miss counterplay, onboarding, modal focus/isolation, opt-in audio consent/mixing/persistence, duplicate-choice prevention, synthetic standard-gamepad input, wartable intelligence/evidence, five-layer pressure/pursuit/method/field resolution, save-v5 persistence, exact locators and uncertainty states, keyboard input, all eleven locale fonts/directions/header layouts, remote-network absence, Arabic RTL, 200% title/game text, 320 CSS pixel 400%-equivalent reflow, actual Chrome 400% page zoom/reset, forced colors, reduced motion, control geometry, mobile layout, WebGL and console errors. A second isolated visible-Chrome/PipeWire gate records actual output, proves exact silence before consent and enforces peak, EBU R128 loudness, DC and channel parity. Evidence and reproduction details are in [`docs/production/PLAYTESTING.md`](docs/production/PLAYTESTING.md).

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

Pre-alpha readable-opposition checkpoint, 2026-08-09. Exact implementation `d7afcd6bd7e838a64397f500e919af112221dcc8` passes a fresh-clone install and the complete local build/test/content-route/accessibility gates; the isolated noVNC browser repeats 202 checks against that same commit with zero console errors. Chapter I now discloses and records three reachable Qin pursuit postures plus a second deterministic opponent-memory layer: after two observations, a unique leading strategic method prepares one exact counter; a different method makes it miss. Save v5 preserves v1–v4 decisions under their original resolution rules and rejects method/read identity tampering. Exhaustive traversal covers 689 successful and 87 capture/scattering routes with every posture, read and hit reachable. The initial player remains inside the unchanged caps at 98.21 KiB JavaScript and 10.29 KiB CSS gzip; 178.95 KiB largest lazy JavaScript, 22.94 MiB complete fonts and 26.80 MiB deployable output also pass. The visible run covers twenty-eight axe states, twenty target states, eleven locale/font states and three audio-UI states; it also caught and corrected a 400%-zoom decision-card reachability regression. The prior objective-audio checkpoint remains valid. Unity runtime, editor-validation and EditMode-test sources—including schema v5, method selection, five-layer ordering and migrations—compile as separate warning-clean assemblies against the installed Unity 2022.3 reference set. Native import, EditMode execution and player builds still require Unity account licensing; public deployment of this checkpoint, human listening/sensory-load/physical-device/native-audio review, assistive-technology and physical-controller sessions, observed players, and Qin-law/historical-GIS specialists remain open. Those gates remain red rather than hidden. SHI is planned as a one-year quality-driven production, and this repository will not label the goal complete until both clients, research, localization, assets, observed player sessions, and release checks pass.

Copyright © 2026 Lachlan Chen. Public visibility does not grant a reuse license; see [LICENSE.md](LICENSE.md).
