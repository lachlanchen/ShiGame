[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · Форма власти / 《勢》

*Красивая и исторически добросовестная стратегическая история о том, как люди, местность, время, вера, снабжение и институты становятся властью.*

[![Validate SHI](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml) [![Play pre-alpha](https://img.shields.io/badge/Play-Web_Pre--alpha-B8945B?style=flat-square)](https://lachlanchen.github.io/ShiGame/) [![Unity 6](https://img.shields.io/badge/Unity-6000.0.80f1-222?style=flat-square&logo=unity)](../apps/unity/) [![Sponsor](https://img.shields.io/github/sponsors/lachlanchen?style=flat-square)](https://github.com/sponsors/lachlanchen)

SHI — настоящая игра в производстве, а не одноразовая демонстрация. Первая игровая глава начинается под дождём в Дацзэ в 209 году до н. э. В роли вымышленного хранителя списка мобилизованных игрок решает, как застрявшая группа становится политическим движением. Кампания ведёт от падения Цинь к противостоянию Чу и Хань, не объявляя Сян Юя, Лю Бана или будущую победу неизбежными.

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![Игровой экран SHI](../docs/production/evidence/web-01-title-en.png)

## Чем отличается SHI

- Зерно, доверие, порыв, люди и раскрытие создают положение, а не одну цифру силы.
- Скорость рождает голод, легитимность — долг, секретность — недоверие; выбор создаёт ответ и восстановление.
- Исторические свидетельства, поздние компиляции, трактаты и художественная реконструкция разделены.
- Веб и настоящий проект Unity 6 используют одну версионированную кампанию.
- Есть основа 11 языков UI, арабского RTL и проверяемого происхождения каждого созданного ресурса.

## Текущее содержимое

| Путь | Реализовано сейчас |
| --- | --- |
| [`apps/web`](../apps/web/) | Игровой веб, сохранение, реестры источников/решений, мобильный вид и RTL |
| [`apps/unity`](../apps/unity/) | Unity 6 и 3D-стол; редактор Linux/WebGL установлен, вход для лицензии остаётся открытым блокером |
| [`content`](../content/) | 6 сцен, 15 решений, 5 ресурсов, восстановление и 3 финала |
| [`docs`](../docs/) | Дизайн, история, архитектура, локализация, искусство, QA, релиз, годовой план |

## Быстрый старт

```bash
npm install
npm run dev
npm run validate
npm run build
```

## Архитектура и исследование

Версионированный JSON — единственный источник повествования для детерминированного ядра TypeScript и Unity 6. Частные книги, OCR, чаты и полный меморандум не попадают в Git. См. [геймдизайн](../docs/design/GAME_DESIGN_DOCUMENT.md), [политику источников](../docs/history/SOURCE_POLICY.md), [годовой план](../docs/production/ROADMAP.md).

## Сборка и проверка

Проверяются граф, ссылки, языковые ключи, правила, типы и тесты. Видимый тест noVNC/Chrome прошёл 21 проверку игры, источников, сохранения, RTL, мобильного вида, WebGL и консоли. [Доказательства](../docs/production/PLAYTESTING.md) включены.

## Цитирование

Для исследований и обучения цитируйте [`CITATION.cff`](../CITATION.cff).

```bibtex
@software{chen_shi_2026,
  author = {Chen, Lachlan},
  title = {SHI: The Shape of Power},
  year = {2026},
  url = {https://github.com/lachlanchen/ShiGame}
}
```

## Статус и границы

Пре-альфа от 2026-08-08. Веб-глава собрана и проверена визуально. Настоящий редактор Unity с модулями Linux/WebGL установлен и распознан Hub. Для нативного импорта и компиляции владелец аккаунта должен войти и активировать лицензию Unity; производственная фиксация Unity 6 сохранена. Проект не будет назван завершённым до проверки обоих клиентов, исследований, языков, ресурсов, плейтестов и релиза.
