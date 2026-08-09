[English](README.md) · [العربية](i18n/README.ar.md) · [Español](i18n/README.es.md) · [Français](i18n/README.fr.md) · [日本語](i18n/README.ja.md) · [한국어](i18n/README.ko.md) · [Tiếng Việt](i18n/README.vi.md) · [中文 (简体)](i18n/README.zh-Hans.md) · [中文（繁體）](i18n/README.zh-Hant.md) · [Deutsch](i18n/README.de.md) · [Русский](i18n/README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · The Shape of Power / 《势》

*A beautiful, historically grounded strategy narrative about how people, terrain, time, belief, logistics, and institutions become power.*

[![Validate SHI](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml) [![Play pre-alpha](https://img.shields.io/badge/Play-Web_Pre--alpha-B8945B?style=flat-square)](https://lachlanchen.github.io/ShiGame/) [![Unreal 5.8](https://img.shields.io/badge/Unreal-5.8-222?style=flat-square&logo=unrealengine)](apps/unreal/) [![Unity 6](https://img.shields.io/badge/Unity-6000.0.80f1-222?style=flat-square&logo=unity)](apps/unity/) [![Sponsor](https://img.shields.io/github/sponsors/lachlanchen?style=flat-square)](https://github.com/sponsors/lachlanchen)

SHI is a production game project—not a disposable demo. Its first playable chapter begins in the rain at Daze Village in 209 BCE, as a fictional levy-record keeper must decide how a stranded group becomes a political movement. The wider campaign follows the collapse of Qin toward the Chu–Han contention without treating Xiang Yu, Liu Bang, or later victory as inevitable.

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI playable title screen](docs/production/evidence/web-01-title-en.png)

## Why SHI is different

- Power is positional: grain, trust, momentum, people, and exposure create opportunities and obligations rather than a single “strength” score.
- Decisions are deliberate orders: compact cards select a doctrine without changing the campaign; one focused reading then discloses its full method, promise, pressure and exact effects before a separately named **Issue order** action commits it.
- Opening choices establish a named promise to a visible stakeholder. The promise travels through the chapter, and every choice at the broken ford discloses whether it will keep, strain, or break it—and the exact operational cost—before commitment.
- Choices create counterplay and recovery problems. Every nonterminal decision warns about one exposed weakness, then reveals and records an authored state, terrain, supply, or network response.
- Qin pursuit is a persistent, readable opponent: the current Exposure band, exact added pressure and a concrete counterplay are disclosed before commitment and recorded afterward.
- Qin also forms a deterministic, disclosed read of repeated strategic methods. The selected-order reading names its method and shows whether the prepared counter will hit; changing method makes the read miss.
- Every new chronicle receives a shareable seed that selects a small authored field condition. The exact signal and effects are disclosed before commitment, recorded afterward, and explicitly labeled dramatic reconstruction.
- Historical accounts, later compilations, strategic texts, and dramatic reconstructions are visibly separated.
- The wartable is playable intelligence, not decoration: known ground, reported networks and reference-only places expose uncertainty and claim-filtered evidence without leaking later victory into the opening scene.
- A shared opt-in soundscape gives rain, focus, inspection and consequence a restrained procedural language. Ambience and effects mix independently, sound never carries exclusive information, deterministic and actual-browser output pass objective audio gates, and human listening approval remains an open release gate.
- One versioned campaign payload drives the polished web client, priority Unreal 5.8 cinematic client and maintained Unity 6 baseline.
- English, Arabic, German, Spanish, French, Japanese, Korean, Russian, Vietnamese, Simplified Chinese, and Traditional Chinese UI foundations are present, including Arabic RTL.
- Every generated art or 3D asset keeps provenance and a review trail; rejected revisions remain documented.

## Current contents

| Path | What is real now |
| --- | --- |
| [`apps/web`](apps/web/) | Playable React/Vite client, compact select-only orders with a complete focused reading and explicit confirmation, lazy Three.js atmosphere/intelligence map and Web Audio soundscape, replayable save-v6 migration, carried player commitments, persistent pursuit, strategic-method reads and seeded field signals, first-run guide, six-layer decision records, keyboard/gamepad/touch input, responsive and RTL layouts |
| [`apps/unreal`](apps/unreal/) | Priority Unreal Engine 5.8 C++ cinematic client: canonical schema-v7 loader, six-layer resolver, reversible command surface, requirements, all-scene progression, art-directed runtime command space, motivated skippable camera beat, automation source and official Linux build wrapper; native compile/play evidence remains open until the official installed build is obtained |
| [`apps/unity`](apps/unity/) | Unity 6 LTS project consuming the same campaign/audio contracts, matching select/inspect/issue-order flow, selectable/raycasted 3D wartable markers, procedural rain/cues, localized mixer/intelligence/guide/record/gamepad UI, native preflight/build automation and EditMode tests; license/import gate is documented |
| [`content`](content/) | Chapter I with 6 scenes, 15 method-tagged choices, 3 carried commitments and 9 exact answers, 12 pressure responses, 3 classified pursuit postures, 3 strategic methods, 3 prepared counters plus a neutral read, 12 classified field conditions, 5 resources, a recovery turn, 3 conclusions, 7 source records, 13 claim records, 5 registered editions, and one versioned procedural-audio contract |
| [`packages/game-core`](packages/game-core/) | Seed-reproducible six-layer resolution, authoritative save replay/migration, player and opponent memory, requirements, failure thresholds, exhaustive condition-route validation, localization fallback, and tests |
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

Unreal and Unity instructions plus the honest native-editor gates are in [`apps/unreal/README.md`](apps/unreal/README.md), [`apps/unity/README.md`](apps/unity/README.md), and [`docs/production/ENGINE_STATUS.md`](docs/production/ENGINE_STATUS.md).

## Architecture and research baseline

```text
historical claims + authored reconstruction + audio contract
                         ↓
              versioned shared JSON + validation + SHA-256
              ↙                 ↓                    ↘
TypeScript rules + Web       Unreal 5.8 C++       Unity 6 C#
React/Three/Web Audio    priority cinematic 3D    maintained baseline
```

Private books, OCR collections, chat extracts, downloads, and the complete working memo remain outside Git. The project records pinpoint metadata and reviewed original prose rather than publishing source files. Read the [game design document](docs/design/GAME_DESIGN_DOCUMENT.md), [deliberate-order contract](docs/design/DELIBERATE_ORDER_FLOW.md), [player commitment contract](docs/design/PLAYER_COMMITMENT_MEMORY.md), [opposition posture contract](docs/design/OPPOSITION_POSTURE.md), [opposition method-read contract](docs/design/OPPOSITION_METHOD_READ.md), [wartable intelligence contract](docs/design/WARTABLE_INTELLIGENCE.md), [historical review system](docs/history/HISTORICAL_REVIEW_SYSTEM.md), [edition register](docs/history/EDITION_REGISTER.md), [seeded uncertainty contract](docs/design/SEEDED_UNCERTAINTY.md), [audio direction](docs/art/AUDIO_DIRECTION.md), [source policy](docs/history/SOURCE_POLICY.md), [accessibility contract](docs/production/ACCESSIBILITY.md), and [one-year roadmap](docs/production/ROADMAP.md).

## Build and validation

`npm run validate` checks the edition/rights register, campaign graph and three-act chronology, source-to-claim-to-scene/site closure, intelligence states, reconstruction boundaries, localization, six-layer rules, save migration, every field-condition branch, synchronized Web/Unreal/Unity payloads, the Unreal project contract, audio/provenance, accessibility and font/privacy contracts, types, 47 tests and representative axe scans. `npm run build` additionally enforces initial/lazy/font/deployment size budgets. The visible noVNC/Chrome gate adds 248 checks, including the complete campaign-horizon rail, to the prior selection, commitment, opposition, accessibility, localization, input, audio and network checks. A second isolated visible-Chrome/PipeWire gate records actual output, proves exact silence before consent and enforces peak, EBU R128 loudness, DC and channel parity. Evidence and reproduction details are in [`docs/production/PLAYTESTING.md`](docs/production/PLAYTESTING.md).

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

Pre-alpha schema-v7/Unreal-priority checkpoint, 2026-08-09. Exact implementation `a11e173a58d9290f1368f1596e730a13ccb5e820` passes a detached fresh-clone install and complete build: 47 tests, 689 successful and 87 capture/scattering condition routes, synchronized Web/Unreal/Unity payloads, Unreal project preflight, accessibility/audio/font/privacy gates and all bundle budgets. The isolated noVNC browser repeats 248 checks against that same commit: three authored acts and all six scenes advance with site/date/time orientation while the deliberate six-layer order flow remains intact on desktop, mobile, all eleven locales, forced colors, 320px reflow and actual Chrome 400% zoom. Thirty-two axe states, twenty-four target states, eleven locale/font states and three audio states pass; 249 requests and 166 same-origin font slices produce zero console errors, cross-origin requests/resources or failed requests. The initial player remains inside the caps at 99.47 KiB JavaScript, 11.94 KiB CSS, 178.95 KiB largest lazy JavaScript, 22.94 MiB fonts and 26.84 MiB deployable output. Unreal now has a real 5.8 C++ project, schema/chronology loader, six-layer resolver, reversible command surface, all-scene progression and a cinematic command-space/camera foundation. It is **not yet claimed native-playable or film quality**: official editor acquisition, native compile/automation, PIE interaction, Linux packaging, performance and human review remain red. Unity remains a maintained baseline with its existing license gate. Human listening, assistive-technology, physical-controller, observed-player, Qin-law, geography and translation review also remain open. SHI is a one-year quality-driven production; no source-only engine boundary is allowed to masquerade as a shipped game.

Copyright © 2026 Lachlan Chen. Public visibility does not grant a reuse license; see [LICENSE.md](LICENSE.md).
