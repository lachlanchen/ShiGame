[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · Hình của quyền lực / 《勢》

*Một tự sự chiến lược đẹp và nghiêm túc với lịch sử về cách con người, địa thế, thời gian, lòng tin, hậu cần và thể chế trở thành quyền lực.*

[![Validate SHI](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/ShiGame/actions/workflows/ci.yml) [![Play pre-alpha](https://img.shields.io/badge/Play-Web_Pre--alpha-B8945B?style=flat-square)](https://lachlanchen.github.io/ShiGame/) [![Unity 6](https://img.shields.io/badge/Unity-6000.0.80f1-222?style=flat-square&logo=unity)](../apps/unity/) [![Sponsor](https://img.shields.io/github/sponsors/lachlanchen?style=flat-square)](https://github.com/sponsors/lachlanchen)

SHI là một trò chơi thật đang được sản xuất, không phải bản trình diễn dùng một lần. Chương đầu bắt đầu trong mưa ở Đại Trạch năm 209 TCN. Trong vai người giữ sổ trưng binh hư cấu, người chơi quyết định cách một nhóm bị mắc kẹt trở thành phong trào chính trị. Chiến dịch đi từ sự sụp đổ của Tần đến tranh chấp Sở–Hán mà không coi Hạng Vũ, Lưu Bang hay chiến thắng về sau là định mệnh.

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![Màn hình chơi SHI](../docs/production/evidence/web-01-title-en.png)

## Điểm khác biệt của SHI

- Lương, tín, thế, dân và bại lộ tạo nên thế cục, không bị gộp thành một điểm sức mạnh.
- Tốc độ có thể gây đói, chính danh tạo nợ, bí mật làm mất tin; mỗi lựa chọn sinh ra phản ứng và hồi phục.
- Sử liệu, biên soạn đời sau, binh thư và tái dựng kịch tính được phân biệt rõ.
- Web và dự án Unity 6 thật dùng chung một chiến dịch có phiên bản.
- Có nền tảng UI 11 ngôn ngữ, RTL tiếng Ả Rập và hồ sơ nguồn/kiểm duyệt cho mọi tài sản tạo sinh.

## Nội dung hiện tại

| Đường dẫn | Đã có |
| --- | --- |
| [`apps/web`](../apps/web/) | Web chơi được, lưu, sổ nguồn/quyết định, di động và RTL |
| [`apps/unity`](../apps/unity/) | Unity 6 và bàn chiến lược 3D; trình biên tập Linux/WebGL đã cài, đăng nhập giấy phép vẫn là chặn công khai |
| [`content`](../content/) | 6 cảnh, 15 lựa chọn, 5 tài nguyên, hồi phục và 3 kết thúc |
| [`docs`](../docs/) | Thiết kế, lịch sử, kiến trúc, bản địa hóa, mỹ thuật, QA, phát hành, kế hoạch năm |

## Bắt đầu nhanh

```bash
npm install
npm run dev
npm run validate
npm run build
```

## Kiến trúc và nghiên cứu

JSON chiến dịch có phiên bản là nguồn tự sự duy nhất cho lõi TypeScript tất định và Unity 6. Sách riêng, OCR, trò chuyện và bản ghi nhớ đầy đủ không vào Git. Xem [thiết kế](../docs/design/GAME_DESIGN_DOCUMENT.md), [chính sách nguồn](../docs/history/SOURCE_POLICY.md), [lộ trình một năm](../docs/production/ROADMAP.md).

## Build và xác nhận

Xác nhận tự động kiểm tra đồ thị, tham chiếu, khóa ngôn ngữ, luật, kiểu và test. Bài test noVNC/Chrome hiển thị đã qua 43 mục về chơi, phản ứng áp lực, bàn phím, nguồn, lưu, RTL, di động, WebGL và console. Xem [bằng chứng](../docs/production/PLAYTESTING.md).

## Trích dẫn

Khi dùng SHI trong nghiên cứu hoặc giảng dạy, hãy trích [`CITATION.cff`](../CITATION.cff).

```bibtex
@software{chen_shi_2026,
  author = {Chen, Lachlan},
  title = {SHI: The Shape of Power},
  year = {2026},
  url = {https://github.com/lachlanchen/ShiGame}
}
```

## Trạng thái và phạm vi

Tiền alpha chứng minh hệ thống ngày 2026-08-09. Chương web có phản ứng áp lực tất định, chuyển đổi bản lưu, điều khiển bàn phím, kiểm tra mọi tuyến và 43 kiểm tra trực quan. Trình biên tập Unity Linux/WebGL thật đã được cài và Hub nhận diện. Việc nhập và biên dịch bản gốc cần chủ tài khoản đăng nhập, kích hoạt giấy phép Unity; ghim sản xuất Unity 6 vẫn được giữ nguyên. Chưa gọi là hoàn tất trước khi hai client, nghiên cứu, ngôn ngữ, tài sản, chơi thử và phát hành đều đạt.
