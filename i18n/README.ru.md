[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · The Shape of Power / 《势》

*Историческая игра о решениях, меняющих жизнь.*

[Web](https://lachlanchen.github.io/ShiGame/) · [Story](https://lachlanchen.github.io/ShiGame/story/) · [App Store](https://apps.apple.com/us/app/id6816377548) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.shi) · [Sponsor](https://github.com/sponsors/lachlanchen)

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI](../docs/production/evidence/web-01-title-en.png)

## Замысел томов — 2026-10-02

SHI разрабатывается последовательно, том за томом. Основой служит история «Цзы чжи тун цзянь» с 403 года до н. э. по 959 год н. э.; дополнительные источники — «Ши цзи», «Цзо чжуань», «Хань шу», «Хоу Хань шу» и переводы, предоставленные владельцем. Первый том начинается с более ранней осады Цзиньяна, затем переходит к разделу земель и должностей, отношениям в доме и наследованию власти.

Игрок принимает решения, ведёт дипломатию и устанавливает связи. Земли, богатство, должности и отношения с совершеннолетними супругами и наложницами определяют его положение. Каждый успех приносит новых союзников, притязания и обязательства. Движущиеся персонажи, управляемые сцены, музыка и непрерывные кинематографические переходы — цель производства.

Для Цзиньяна создан интерактивный макет движений в Unreal: исполняемые приказы, дипломатия, три типа исхода и сохраняемая запись имущества и карьеры. См. [отчёт о разработке](../docs/production/JINYANG_BLOCKOUT_20261002.md). Это не готовое кинематографическое оформление и не новая мобильная бета. Опубликованные главы и подтверждения бета-выпусков описаны ниже.

[Замысел серии](../docs/design/GAME_DESIGN_DOCUMENT.md) · [Том I](../docs/design/JINYANG_CHAPTER_DESIGN.md) · [Критерии поставки](../docs/production/SHI_WORKABLE_GOAL.md)

![Концепция сцены Цзиньяна — производственный ориентир, не снимок игры](../assets/art/lookdev/jinyang-scene-target-v1.png)

## Опубликованная глава

SHI начинается под дождём в Дазэ в 209 году до н. э. Вы — вымышленный хранитель списка призывников: зерно, доверие, люди и заметность определяют выполнимые обещания. Решения создают затраты, противодействие и пути восстановления, а не неизбежную победу. Историческая основа — «Цзы чжи тун цзянь»; реконструированные диалоги и альтернативные исходы помечены, а не выданы за цитаты.

## Клиенты

Веб использует React/Three.js и детерминированные правила TypeScript. iOS — нативный SwiftUI/SceneKit/Foundation; Android упаковывает офлайн-игру. Unreal 5.8 — кинематографический настольный клиент; Unity 6 сохраняет общую основу. Версионированные данные кампании исключают независимые исторические сюжеты.

[Web](../apps/web/) · [iOS](../apps/mobile/ios/) · [Android](../apps/mobile/android/) · [Unreal](../apps/unreal/) · [Unity](../apps/unity/) · [Rules](../packages/game-core/) · [Content](../content/)

## Локальный запуск

Нужен Node.js 22+. Запустите локально и проверьте перед сборкой. Настройка описана в каталогах клиентов; веб-сборка не подтверждает подписанный мобильный пакет.

```bash
npm install
npm run dev
npm run validate
npm run build
```

http://127.0.0.1:5173

## Кинематографическая проверка

Плавность означает отзывчивые приказы, надёжное сохранение до соответствующей реакции и явное продолжение. Музыка и видео сохраняют субтитры, паузу, пропуск, согласие и уменьшение движения. Оригинальные лица и костюмы должны быть едиными. Материалы Musia, LocalVideoGen и Blender остаются частными до проверки происхождения, прав, изображения и звука.

[Design](../docs/design/GAME_DESIGN_DOCUMENT.md) · [Sources](../docs/history/SOURCE_POLICY.md) · [Playtests](../docs/production/PLAYTESTING.md) · [Roadmap](../docs/production/ROADMAP.md)

## Границы выпуска

На 2 октября 2026 года опубликованная мобильная сборка 1 отделена от новой разработки. Версия Apple доступна для загрузки; сборка 1 в Google Production опубликована 2 октября. Проверены страница магазина США с ценой 0,99 USD и 169 выбранных рынков. TestFlight 1.0.1 (2) и внутренняя версия Google 1.0.0 (9) доступны существующим тестировщикам; публичные версии в магазинах не изменены. Совет, Фаньян, отступление и убежище имеют ограниченные тесты; часть продолжения только для QA. Персонажи ещё не финальное киноискусство. Тесты не заменяют человека и реальные устройства. GitHub обновляется после проверенных этапов; беты требуют подписи, проверки обновления и подтверждения доступности. Ежедневный автоматический планировщик не установлен.

[Beta workflow](../store/BETA_WORKFLOW.md) · [Native evidence](../docs/production/NATIVE_REFUGE_UI_20261001.md) · [Local video rights](../docs/production/LOCAL_VIDEO_RELEASE_GATE_20261001.md) · [Cloth study](../docs/production/COUNCIL_GUSSET_CLOTH_20261001.md)

## Цитирование

Для исследований цитируйте CITATION.cff. Публичность не даёт лицензии на повторное использование; частные книги, ключи и кэши не входят в Git.

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
