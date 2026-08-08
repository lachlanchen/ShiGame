[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · 힘의 형세 / 《勢》

*사람·지형·시간·믿음·병참·제도가 어떻게 힘의 형세를 만드는지 다루는 아름답고 역사에 성실한 전략 서사.*

[![Validate SHI](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml) [![Play pre-alpha](https://img.shields.io/badge/Play-Web_Pre--alpha-B8945B?style=flat-square)](https://lachlanchen.github.io/ShiGame/) [![Unity 6](https://img.shields.io/badge/Unity-6000.0.80f1-222?style=flat-square&logo=unity)](../apps/unity/) [![Sponsor](https://img.shields.io/github/sponsors/lachlanchen?style=flat-square)](https://github.com/sponsors/lachlanchen)

SHI는 일회성 데모가 아니라 실제 제작 중인 게임입니다. 첫 장은 기원전 209년 대택향의 비에서 시작합니다. 플레이어는 가상의 징발 명부 관리자로서 발이 묶인 사람들이 정치 운동이 되는 방식을 선택합니다. 진의 붕괴와 초한쟁패로 이어지지만 항우, 유방, 훗날의 승리를 필연으로 쓰지 않습니다.

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI 플레이 화면](../docs/production/evidence/web-01-title-en.png)

## SHI가 다른 점

- 군량·신뢰·기세·민심·노출이 관계를 만들며 하나의 전투력 수치로 축약되지 않습니다.
- 속도는 굶주림을, 정당성은 빚을, 비밀은 불신을 낳아 다음 반격과 회복 문제를 만듭니다.
- 역사 기록, 후대 편찬, 병법의 관점, 극적 재구성을 분리합니다.
- 웹과 실제 Unity 6 프로젝트가 같은 버전의 캠페인 데이터를 사용합니다.
- 11개 UI 언어, 아랍어 RTL, 생성 자산 출처·검수 기반이 있습니다.

## 현재 내용

| 경로 | 구현 상태 |
| --- | --- |
| [`apps/web`](../apps/web/) | 플레이 가능한 웹, 저장, 사료·결정 장부, 모바일, RTL |
| [`apps/unity`](../apps/unity/) | Unity 6과 3D 작전 탁자. Linux/WebGL 에디터는 설치됐으며 라이선스 로그인이 공개 차단 항목 |
| [`content`](../content/) | 6개 장면, 15개 선택, 5개 자원, 회복 국면, 3개 결말 |
| [`docs`](../docs/) | 설계·역사·기술·현지화·미술·QA·출시·1년 로드맵 |

## 빠른 시작

```bash
npm install
npm run dev
npm run validate
npm run build
```

## 아키텍처와 연구 기준

버전 관리 캠페인 JSON이 유일한 서사 원본이며 결정론적 TypeScript 코어와 Unity 6이 공유합니다. 개인 서적, OCR, 채팅, 전체 메모는 Git에 넣지 않습니다. [게임 설계](../docs/design/GAME_DESIGN_DOCUMENT.md), [사료 정책](../docs/history/SOURCE_POLICY.md), [1년 로드맵](../docs/production/ROADMAP.md)을 참고하세요.

## 빌드와 검증

캠페인 그래프, 인용, 번역 키, 규칙, 타입, 테스트를 자동 검증합니다. 보이는 noVNC/Chrome 시험은 플레이, 압력 응수, 키보드, 출처 분류, 저장, RTL, 모바일, WebGL, 콘솔 50개 항목을 통과했습니다. [시험 증거](../docs/production/PLAYTESTING.md)를 확인할 수 있습니다.

## 인용

연구·교육에 사용할 때는 [`CITATION.cff`](../CITATION.cff)를 인용해 주세요.

```bibtex
@software{chen_shi_2026,
  author = {Chen, Lachlan},
  title = {SHI: The Shape of Power},
  year = {2026},
  url = {https://github.com/lachlanchen/ShiGame}
}
```

## 상태와 범위

2026-08-09 시스템 증명 프리알파. 웹 장에는 결정론적 압력 응수, 저장 이전, 키보드 조작, 전체 경로 검증과 50개 가시 시험이 있습니다. 실제 Linux/WebGL Unity 에디터가 설치되어 Hub에 등록되었습니다. 네이티브 가져오기와 컴파일에는 계정 소유자의 로그인과 Unity 라이선스 활성화가 필요하며 Unity 6 프로덕션 핀은 유지됩니다. 두 클라이언트, 사료, 현지화, 자산, 플레이테스트, 출시 기준이 통과되기 전에는 완료라 부르지 않습니다.
