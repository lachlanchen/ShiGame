[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# SHI · The Shape of Power / 《势》

*Trò chơi lịch sử về những quyết định thay đổi cuộc đời.*

[Web](https://lachlanchen.github.io/ShiGame/) · [Story](https://lachlanchen.github.io/ShiGame/story/) · [App Store](https://apps.apple.com/us/app/id6816377548) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.shi) · [Sponsor](https://github.com/sponsors/lachlanchen)

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

![SHI](../docs/production/evidence/web-01-title-en.png)

## Thiết kế theo từng tập — 2026-10-02

SHI được phát triển và hoàn thiện từng tập. Lịch sử trong Tư trị thông giám, từ năm 403 trước Công nguyên đến năm 959, là trục chính; Sử ký, Tả truyện, Hán thư, Hậu Hán thư và các bản dịch do chủ dự án cung cấp là tài liệu tham khảo. Tập I mở đầu bằng cuộc vây hãm Tấn Dương diễn ra trước đó, rồi chuyển sang phân chia đất đai và chức vị, quan hệ trong gia đình và kế vị.

Người chơi ra quyết định, tiến hành ngoại giao và liên lạc, gây dựng vị thế bằng đất đai, tài sản, chức vị cùng quan hệ với vợ và thiếp trưởng thành. Mỗi thành quả đem lại đồng minh, yêu sách và nghĩa vụ mới. Nhân vật chuyển động, cảnh có thể điều khiển, âm nhạc và chuyển cảnh điện ảnh liền mạch là mục tiêu sản xuất.

Đây là thiết kế mới và mục tiêu hình ảnh; bản Tấn Dương có thể chơi chưa được hoàn thành. Chương đã phát hành và bằng chứng phân phối bản thử nghiệm được trình bày bên dưới.

[Thiết kế toàn bộ loạt game](../docs/design/GAME_DESIGN_DOCUMENT.md) · [Tập I](../docs/design/JINYANG_CHAPTER_DESIGN.md) · [Tiêu chí bàn giao](../docs/production/SHI_WORKABLE_GOAL.md)

![Ý tưởng cảnh Tấn Dương — mục tiêu sản xuất, không phải ảnh chụp game](../assets/art/lookdev/jinyang-scene-target-v1.png)

## Chương đã phát hành

SHI bắt đầu trong mưa ở Đại Trạch năm 209 TCN. Bạn là người giữ sổ quân dịch hư cấu: lương thực, lòng tin, con người và mức lộ diện quyết định lời hứa nào có thể giữ. Lựa chọn tạo chi phí, đối kháng và cơ hội phục hồi, không bảo đảm thắng lợi. Tư trị thông giám là xương sống lịch sử; đối thoại tái dựng và kết quả thay thế được ghi rõ, không giả làm trích dẫn.

## Các bản

Web dùng React/Three.js và luật TypeScript xác định. iOS thuần SwiftUI/SceneKit/Foundation; Android đóng gói trò chơi ngoại tuyến. Unreal 5.8 là bản điện ảnh trên máy tính; Unity 6 duy trì nền tảng nội dung chung. Các bản dùng dữ liệu chiến dịch có phiên bản, không kể lịch sử riêng.

[Web](../apps/web/) · [iOS](../apps/mobile/ios/) · [Android](../apps/mobile/android/) · [Unreal](../apps/unreal/) · [Unity](../apps/unity/) · [Rules](../packages/game-core/) · [Content](../content/)

## Chạy cục bộ

Cần Node.js 22+. Chạy cục bộ rồi kiểm tra trước khi dựng. Hướng dẫn bản native và engine nằm trong thư mục tương ứng; bản dựng web không chứng nhận gói di động đã ký.

```bash
npm install
npm run dev
npm run validate
npm run build
```

http://127.0.0.1:5173

## Duyệt điện ảnh

Mượt mà nghĩa là lệnh phản hồi nhanh, lưu bền vững trước phản ứng tương ứng và tiếp tục rõ ràng. Nhạc và video giữ phụ đề, tạm dừng, bỏ qua, đồng ý và giảm chuyển động. Khuôn mặt và trang phục gốc phải nhất quán. Nghiên cứu Musia, LocalVideoGen và Blender vẫn riêng tư cho đến khi duyệt nguồn gốc, quyền, hình và âm.

[Design](../docs/design/GAME_DESIGN_DOCUMENT.md) · [Sources](../docs/history/SOURCE_POLICY.md) · [Playtests](../docs/production/PLAYTESTING.md) · [Roadmap](../docs/production/ROADMAP.md)

## Giới hạn phát hành

Ngày 2 tháng 10 năm 2026, bản di động đã phát hành số 1 vẫn tách biệt với phần phát triển mới. Bản Apple có thể tải xuống; Google Production đã phát hành bản số 1 ngày 2 tháng 10, với trang cửa hàng Mỹ được xác minh ở mức 0,99 USD và 169 thị trường mục tiêu. TestFlight 1.0.1 (2) và bản thử nghiệm nội bộ Google 1.0.0 (9) đã có cho những người thử nghiệm hiện tại; các bản trên cửa hàng công khai không thay đổi. Hội đồng, Phạm Dương, rút lui và trú ẩn có kiểm thử giới hạn; một số phần chỉ dành QA. Nhân vật chưa phải mỹ thuật điện ảnh cuối cùng. Kiểm thử không thay duyệt người thật và hiệu năng thiết bị. GitHub theo mốc đã kiểm tra; beta cần ký, thử nâng cấp và xác nhận khả dụng. Không cài bộ lịch tự động hằng ngày.

[Beta workflow](../store/BETA_WORKFLOW.md) · [Native evidence](../docs/production/NATIVE_REFUGE_UI_20261001.md) · [Local video rights](../docs/production/LOCAL_VIDEO_RELEASE_GATE_20261001.md) · [Cloth study](../docs/production/COUNCIL_GUSSET_CLOTH_20261001.md)

## Trích dẫn

Trích CITATION.cff khi nghiên cứu. Công khai không cấp quyền tái sử dụng; sách riêng, khóa và cache không đưa vào Git.

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
