import type { Locale } from "@shi/game-core";

// Presentation labels only. Story text always comes from the canonical campaign.
const labels = {
  en: ["After the order", "What changed", "Play scene", "Pause", "Skip scene", "The film is unavailable. You can read the outcome and continue.", "Scene finished"],
  ar: ["بعد إصدار الأمر", "ما الذي تغيّر", "تشغيل المشهد", "إيقاف مؤقت", "تخطي المشهد", "الفيلم غير متاح. يمكنك قراءة النتيجة والمتابعة.", "انتهى المشهد"],
  de: ["Nach dem Befehl", "Was sich verändert hat", "Szene abspielen", "Pause", "Szene überspringen", "Der Film ist nicht verfügbar. Du kannst das Ergebnis lesen und fortfahren.", "Szene beendet"],
  es: ["Tras la orden", "Qué ha cambiado", "Reproducir escena", "Pausar", "Saltar escena", "El vídeo no está disponible. Puedes leer el resultado y continuar.", "Escena terminada"],
  fr: ["Après l’ordre", "Ce qui a changé", "Lire la scène", "Pause", "Passer la scène", "Le film est indisponible. Vous pouvez lire le résultat et continuer.", "Scène terminée"],
  ja: ["命令のあと", "何が変わったか", "場面を再生", "一時停止", "場面をスキップ", "映像を再生できません。結果を読んで先へ進めます。", "場面が終了しました"],
  ko: ["명령 이후", "달라진 점", "장면 재생", "일시 정지", "장면 건너뛰기", "영상을 재생할 수 없습니다. 결과를 읽고 계속할 수 있습니다.", "장면이 끝났습니다"],
  ru: ["После приказа", "Что изменилось", "Смотреть сцену", "Пауза", "Пропустить сцену", "Видео недоступно. Вы можете прочитать результат и продолжить.", "Сцена завершена"],
  vi: ["Sau mệnh lệnh", "Điều gì đã thay đổi", "Phát cảnh", "Tạm dừng", "Bỏ qua cảnh", "Không thể phát phim. Bạn có thể đọc kết quả và tiếp tục.", "Cảnh đã kết thúc"],
  "zh-Hans": ["令出之后", "局势的变化", "播放片段", "暂停", "跳过片段", "片段暂时无法播放。你仍可阅读结果，继续故事。", "片段已结束"],
  "zh-Hant": ["令出之後", "局勢的變化", "播放片段", "暫停", "跳過片段", "片段暫時無法播放。你仍可閱讀結果，繼續故事。", "片段已結束"],
} satisfies Record<Locale, [string, string, string, string, string, string, string]>;

export const cinemaKeys = { aftermath: 0, changes: 1, play: 2, pause: 3, skip: 4, unavailable: 5, finished: 6 } as const;
export const cinemaLabel = (locale: Locale, key: keyof typeof cinemaKeys) => labels[locale][cinemaKeys[key]];
