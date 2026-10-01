[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · The Shape of Power / 《势》

*사람의 운명을 바꾸는 결정을 다루는 역사 게임.*

[Web](https://lachlanchen.github.io/ShiGame/) · [Story](https://lachlanchen.github.io/ShiGame/story/) · [App Store](https://apps.apple.com/us/app/id6816377548) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.shi) · [Sponsor](https://github.com/sponsors/lachlanchen)

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI](../docs/production/evidence/web-01-title-en.png)

## 게임

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

2026년 10월 2일 기준 출시된 모바일 빌드 1과 새 개발판은 별개입니다. Apple 버전은 다운로드할 수 있습니다. Google Production 빌드 1은 10월 2일 출시되었으며, 미국 스토어의 US$0.99 가격과 169개 대상 시장을 확인했습니다. TestFlight에는 여전히 빌드 1만 있습니다. 회의, 범양, 후퇴, 피난 개발에는 제한된 테스트가 있지만 일부는 QA 전용입니다. 인물은 최종 영화 수준 미술이 아닙니다. 테스트는 사람의 검토나 실기기 성능을 대체하지 않습니다. GitHub는 검증한 단계마다 갱신하고 내부 베타에는 서명, 업그레이드 테스트와 배포 확인이 필요합니다. 매일 자동 배포하는 스케줄러는 설치하지 않았습니다.

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
