[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · 权力之形 / 《势》

*一部关于人、地、时、信念、粮道与制度如何共同成为权力的美丽而严谨的历史策略叙事。*

[![Validate SHI](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml) [![Play pre-alpha](https://img.shields.io/badge/Play-Web_Pre--alpha-B8945B?style=flat-square)](https://lachlanchen.github.io/ShiGame/) [![Unity 6](https://img.shields.io/badge/Unity-6000.0.80f1-222?style=flat-square&logo=unity)](../apps/unity/) [![Sponsor](https://img.shields.io/github/sponsors/lachlanchen?style=flat-square)](https://github.com/sponsors/lachlanchen)

SHI 是正式制作中的游戏，而非一次性演示。第一段可玩章节始于公元前 209 年的大泽乡雨夜：玩家扮演一名虚构的戍卒名籍吏，决定一群受困之人如何成为政治运动。更长的战役将走向秦亡与楚汉相争，但不会把项羽、刘邦或后来的胜负写成必然命运。

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI 可玩标题画面](../docs/production/evidence/web-01-title-en.png)

## SHI 的独特之处

- 粮、信、势、民与险共同构成局面，不被压成一个“战力”数字。
- 每种选择都会制造反制与整顿问题：速度带来饥饿，合法性带来债务，隐秘保留选择也会削弱信心。
- 历史记载、后世编纂、兵学视角与戏剧性重构在界面中明确区分。
- 网页端与真正的 Unity 6 工程使用同一份版本化战役数据。
- 十一种界面语言与阿拉伯语 RTL 基础已经建立；每项生成资产均保留来源和审查记录。

## 当前内容

| 路径 | 已实现内容 |
| --- | --- |
| [`apps/web`](../apps/web/) | 可玩的 React/Vite/Three.js 网页端、存档、史料簿、决策记录、移动端与 RTL |
| [`apps/unity`](../apps/unity/) | 读取同一战役的 Unity 6 工程与 3D 军议图；Linux/WebGL 编辑器已安装，授权登录仍是公开阻塞项 |
| [`content`](../content/) | 6 场景、15 选择、5 资源、1 次整顿与 3 个结局 |
| [`docs`](../docs/) | 设计、史料、架构、本地化、美术、测试、发布与一年路线图 |

## 快速开始

需要 Node.js 22+。

```bash
npm install
npm run dev
npm run validate
npm run build
```

## 架构与研究基线

版本化战役 JSON 是唯一叙事真源，由确定性的 TypeScript 核心和 Unity 6 客户端共同读取。私人书籍、OCR、聊天记录、下载文件与完整工作备忘录不进入 Git。详见[游戏设计文档](../docs/design/GAME_DESIGN_DOCUMENT.md)、[史料政策](../docs/history/SOURCE_POLICY.md)和[一年路线图](../docs/production/ROADMAP.md)。

## 构建与验证

`npm run validate` 检查战役图、引用、翻译键、规则、类型和测试。可见 noVNC/Chrome 测试另有 21 项检查，覆盖游玩、史料分类、存档、阿拉伯语 RTL、移动端、WebGL 与控制台错误；证据见[测试说明](../docs/production/PLAYTESTING.md)。

## 引用

若在研究或教学中使用 SHI，请引用 [`CITATION.cff`](../CITATION.cff)。

```bibtex
@software{chen_shi_2026,
  author = {Chen, Lachlan},
  title = {SHI: The Shape of Power},
  year = {2026},
  url = {https://github.com/lachlanchen/ShiGame}
}
```

## 状态与范围

2026-08-08 前期版本。网页章节已构建并通过可见测试；真正的 Linux/WebGL Unity 编辑器已安装并由 Hub 识别。原生导入与编译仍需账户持有人登录并激活 Unity 许可证；Unity 6 生产版本锁定不变。项目将在一年内按质量关卡继续，不会在双端构建、史料、本地化、资产、试玩与发布检查真正通过前宣称完成。
