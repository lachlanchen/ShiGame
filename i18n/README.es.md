[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · The Shape of Power / 《势》

*Un juego histórico sobre decisiones que cambian vidas.*

[Web](https://lachlanchen.github.io/ShiGame/) · [Story](https://lachlanchen.github.io/ShiGame/story/) · [App Store](https://apps.apple.com/us/app/id6816377548) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.shi) · [Sponsor](https://github.com/sponsors/lachlanchen)

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI](../docs/production/evidence/web-01-title-en.png)

## Juego

SHI comienza bajo la lluvia en Daze, en 209 a. C. Eres un encargado ficticio del registro de reclutas: grano, confianza, personas y exposición determinan qué promesas puedes cumplir. Elegir genera costes, oposición y recuperación, no una victoria inevitable. Zizhi Tongjian es la columna histórica; los diálogos reconstruidos y desenlaces alternativos se identifican como tales, no como citas.

## Clientes

La web usa React/Three.js y reglas deterministas TypeScript. iOS es nativo SwiftUI/SceneKit/Foundation; Android empaqueta el juego sin conexión. Unreal 5.8 es el cliente cinematográfico de escritorio; Unity 6 mantiene una base de contenido compartido. Consumen datos versionados, no historias independientes.

[Web](../apps/web/) · [iOS](../apps/mobile/ios/) · [Android](../apps/mobile/android/) · [Unreal](../apps/unreal/) · [Unity](../apps/unity/) · [Rules](../packages/game-core/) · [Content](../content/)

## Ejecución local

Requiere Node.js 22+. Ejecuta localmente y valida antes de compilar. Las carpetas de cada cliente documentan su preparación; compilar la web no certifica un paquete móvil firmado.

```bash
npm install
npm run dev
npm run validate
npm run build
```

http://127.0.0.1:5173

## Revisión cinematográfica

Fluidez significa órdenes ágiles, guardado duradero antes de una reacción coherente y continuación explícita. Música y vídeo deben conservar subtítulos, pausa, salto, consentimiento y movimiento reducido. Rostros y vestuario originales deben ser consistentes. Los estudios Musia, LocalVideoGen y Blender siguen privados hasta revisar procedencia, derechos, imagen y audio.

[Design](../docs/design/GAME_DESIGN_DOCUMENT.md) · [Sources](../docs/history/SOURCE_POLICY.md) · [Playtests](../docs/production/PLAYTESTING.md) · [Roadmap](../docs/production/ROADMAP.md)

## Límites de publicación

A 2 de octubre de 2026, la versión móvil publicada, build 1, sigue separada del desarrollo nuevo. La versión de Apple se puede descargar; Google Production publicó el build 1 el 2 de octubre, con la ficha estadounidense verificada a 0,99 USD y 169 mercados seleccionados. TestFlight sigue teniendo solo el build 1. Consejo, Fan Yang, retirada y refugio tienen pruebas delimitadas; parte de la continuación es solo QA. Los personajes no son arte cinematográfico final. Las pruebas no sustituyen revisión humana ni rendimiento físico. GitHub se actualiza tras controles; las betas requieren firma, prueba de actualización y disponibilidad confirmada. No hay programador diario automático.

[Beta workflow](../store/BETA_WORKFLOW.md) · [Native evidence](../docs/production/NATIVE_REFUGE_UI_20261001.md) · [Local video rights](../docs/production/LOCAL_VIDEO_RELEASE_GATE_20261001.md) · [Cloth study](../docs/production/COUNCIL_GUSSET_CLOTH_20261001.md)

## Cita

Cita CITATION.cff en investigación. La visibilidad pública no concede licencia de reutilización; libros privados, claves y cachés quedan fuera de Git.

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
