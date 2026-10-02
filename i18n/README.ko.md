[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · The Shape of Power / 《势》

*사람의 운명을 바꾸는 결정을 다루는 역사 게임.*

[Web](https://lachlanchen.github.io/ShiGame/) · [Story](https://lachlanchen.github.io/ShiGame/story/) · [App Store](https://apps.apple.com/us/app/id6816377548) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.shi) · [Sponsor](https://github.com/sponsors/lachlanchen)

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI](../docs/production/evidence/web-01-title-en.png)

## 권별 설계 — 2026-10-02

SHI는 한 권씩 완성해 나갑니다. 『자치통감』의 기원전 403년부터 서기 959년까지의 역사를 중심으로, 『사기』『좌전』『한서』『후한서』와 소유자가 제공한 번역을 참고합니다. 제1권은 그보다 앞선 진양 포위전으로 시작해 영지와 관직의 분배, 가문 내 관계, 후계 문제로 이어집니다.

플레이어는 결정을 내리고 외교와 연락·중개를 수행하며, 영지·재산·관직과 성인 배우자 및 첩과의 관계를 통해 입지를 쌓습니다. 얻는 것마다 새로운 동맹, 권리 주장과 의무가 따릅니다. 움직이는 인물, 지휘할 수 있는 장면, 음악과 연속적인 영화적 전환이 제작 목표입니다.

진양에는 이제 명령 실행, 외교, 세 가지 결말 유형, 저장되는 영지·경력 기록을 갖춘 Unreal의 조작 가능한 동작 검증판이 있습니다. [개발 검토](../docs/production/JINYANG_BLOCKOUT_20261002.md)를 확인하세요. 완성된 영화 수준의 그래픽이나 새로운 모바일 베타는 아닙니다. 기존 출시 장과 베타 배포 기록은 아래에 설명되어 있습니다.

[시리즈 설계](../docs/design/GAME_DESIGN_DOCUMENT.md) · [제1권](../docs/design/JINYANG_CHAPTER_DESIGN.md) · [납품 기준](../docs/production/SHI_WORKABLE_GOAL.md)

![진양 장면 콘셉트 — 제작 목표이며 게임 스크린샷이 아닙니다](../assets/art/lookdev/jinyang-scene-target-v1.png)

## 출시된 장

SHI는 기원전 209년 대택의 비 속에서 시작합니다. 주인공은 창작된 징발 명부 기록관입니다. 식량, 신뢰, 사람과 노출 위험이 지킬 수 있는 약속을 결정합니다. 선택은 비용과 대응, 회복의 기회를 만들며 승리를 보장하지 않습니다. 자치통감을 역사적 뼈대로 삼되 재구성한 대사와 대체 결말은 사료 인용과 구분합니다.

## 클라이언트

Web은 React/Three.js와 결정론적 TypeScript 규칙을 사용합니다. iOS는 SwiftUI/SceneKit/Foundation 네이티브 구현이고 Android는 오프라인 웹 게임을 패키징합니다. Unreal 5.8은 영화적 데스크톱 클라이언트, Unity 6은 공통 콘텐츠 기반입니다. 버전이 지정된 캠페인 데이터를 공유하며 독립된 역사 이야기를 만들지 않습니다.

[Web](../apps/web/) · [iOS](../apps/mobile/ios/) · [Android](../apps/mobile/android/) · [Unreal](../apps/unreal/) · [Unity](../apps/unity/) · [Rules](../packages/game-core/) · [Content](../content/)

## 로컬 실행

Node.js 22+가 필요합니다. 로컬로 실행하고 빌드 전에 검증하세요. 네이티브 및 엔진 설정은 각 디렉터리에 있습니다. 웹 빌드 성공은 서명된 모바일 패키지를 인증하지 않습니다.

```bash
npm install
npm run dev
npm run validate
npm run build
```

http://127.0.0.1:5173

## 영상 검토

매끄러움은 반응 빠른 명령, 알맞은 반응 이전의 영구 저장, 명확한 계속하기에서 나옵니다. 음악과 영상에는 자막, 일시 정지, 건너뛰기, 동의와 동작 줄이기를 유지합니다. 독창적인 얼굴과 의상은 일관되어야 합니다. Musia, LocalVideoGen, Blender 연구는 출처, 권리, 영상과 음향 검토를 통과하기 전까지 비공개입니다.

[Design](../docs/design/GAME_DESIGN_DOCUMENT.md) · [Sources](../docs/history/SOURCE_POLICY.md) · [Playtests](../docs/production/PLAYTESTING.md) · [Roadmap](../docs/production/ROADMAP.md)

## 출시 범위

2026년 10월 2일 기준 출시된 모바일 빌드 1과 새 개발판은 별개입니다. Apple 버전은 다운로드할 수 있습니다. Google Production 빌드 1은 10월 2일 출시되었으며, 미국 스토어의 US$0.99 가격과 169개 대상 시장을 확인했습니다. TestFlight 1.0.1 (2)와 Google 내부 테스트 1.0.0 (9)는 기존 테스터가 이용할 수 있으며, 공개 스토어 버전은 변경하지 않았습니다. 회의, 범양, 후퇴, 피난 개발에는 제한된 테스트가 있지만 일부는 QA 전용입니다. 인물은 최종 영화 수준 미술이 아닙니다. 테스트는 사람의 검토나 실기기 성능을 대체하지 않습니다. GitHub는 검증한 단계마다 갱신하고 내부 베타에는 서명, 업그레이드 테스트와 배포 확인이 필요합니다. 매일 자동 배포하는 스케줄러는 설치하지 않았습니다.

[Beta workflow](../store/BETA_WORKFLOW.md) · [Native evidence](../docs/production/NATIVE_REFUGE_UI_20261001.md) · [Local video rights](../docs/production/LOCAL_VIDEO_RELEASE_GATE_20261001.md) · [Cloth study](../docs/production/COUNCIL_GUSSET_CLOTH_20261001.md)

## 인용

연구에는 CITATION.cff를 인용하세요. 공개가 재사용 허가를 뜻하지 않습니다. 비공개 책, 키와 생성 캐시는 Git에 넣지 않습니다.

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
