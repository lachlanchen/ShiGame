[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · La forma del poder / 《勢》

*Una narrativa estratégica bella y rigurosa sobre cómo personas, terreno, tiempo, creencias, logística e instituciones se convierten en poder.*

[![Validate SHI](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml) [![Play pre-alpha](https://img.shields.io/badge/Play-Web_Pre--alpha-B8945B?style=flat-square)](https://lachlanchen.github.io/ShiGame/) [![Unity 6](https://img.shields.io/badge/Unity-6000.0.80f1-222?style=flat-square&logo=unity)](../apps/unity/) [![Sponsor](https://img.shields.io/github/sponsors/lachlanchen?style=flat-square)](https://github.com/sponsors/lachlanchen)

SHI es un juego real en producción, no una demo desechable. El primer capítulo jugable comienza bajo la lluvia de Daze en 209 a. C. Como responsable ficticio del registro de reclutas, el jugador decide cómo un grupo atrapado se convierte en movimiento político. La campaña avanza hacia la caída de Qin y la contienda Chu–Han sin presentar a Xiang Yu, Liu Bang ni la victoria posterior como inevitables.

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![Pantalla jugable de SHI](../docs/production/evidence/web-01-title-en.png)

## Qué distingue a SHI

- Grano, confianza, impulso, pueblo y exposición forman una posición, no una sola cifra de fuerza.
- La velocidad puede causar hambre, la legitimidad deuda y el secreto desconfianza: cada decisión crea respuesta y recuperación.
- Fuentes históricas, compilaciones tardías, textos estratégicos y reconstrucción dramática se distinguen claramente.
- Web y un proyecto real de Unity 6 comparten la misma campaña versionada.
- Hay base de interfaz para once idiomas, RTL árabe y procedencia/revisión de cada recurso generado.

## Contenido actual

| Ruta | Implementado ahora |
| --- | --- |
| [`apps/web`](../apps/web/) | Web jugable, guardado, registros de fuentes y decisiones, móvil y RTL |
| [`apps/unity`](../apps/unity/) | Unity 6 y mesa 3D; editor Linux/WebGL instalado, inicio de sesión de licencia aún bloqueante |
| [`content`](../content/) | 6 escenas, 15 decisiones, 5 recursos, recuperación y 3 finales |
| [`docs`](../docs/) | Diseño, historia, arquitectura, localización, arte, QA, publicación y plan anual |

## Inicio rápido

```bash
npm install
npm run dev
npm run validate
npm run build
```

## Arquitectura e investigación

El JSON versionado es la única fuente narrativa y lo comparten el núcleo determinista de TypeScript y Unity 6. Libros privados, OCR, chats y el memorando completo no entran en Git. Consulte el [diseño](../docs/design/GAME_DESIGN_DOCUMENT.md), la [política de fuentes](../docs/history/SOURCE_POLICY.md) y el [plan anual](../docs/production/ROADMAP.md).

## Compilación y validación

La validación comprueba grafo, referencias, claves lingüísticas, reglas, tipos y pruebas. La prueba visible noVNC/Chrome superó 43 controles de juego, respuestas de presión, teclado, fuentes, guardado, RTL, móvil, WebGL y consola. Véase la [evidencia](../docs/production/PLAYTESTING.md).

## Cita

Si usa SHI en investigación o docencia, cite [`CITATION.cff`](../CITATION.cff).

```bibtex
@software{chen_shi_2026,
  author = {Chen, Lachlan},
  title = {SHI: The Shape of Power},
  year = {2026},
  url = {https://github.com/lachlanchen/ShiGame}
}
```

## Estado y alcance

Prealfa de prueba de sistemas del 2026-08-09. El capítulo web incluye respuestas de presión deterministas, migración de guardado, control por teclado, validación de todas las rutas y 43 controles visibles. El editor Unity real para Linux/WebGL está instalado y reconocido por Hub. La importación y compilación nativas requieren que el titular de la cuenta inicie sesión y active una licencia de Unity; se mantiene la versión de producción fijada en Unity 6. No se considerará completo hasta superar ambos clientes, investigación, idiomas, recursos, pruebas de juego y lanzamiento.
