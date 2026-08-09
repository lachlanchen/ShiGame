import type { Locale } from "@shi/game-core";

type DecisionUiKey = "selectedOrder" | "issueOrder" | "reviewHint";

export const decisionUi: Record<Locale, Record<DecisionUiKey, string>> = {
  en: { selectedOrder: "Selected order", issueOrder: "Issue order", reviewHint: "Review every disclosed effect before commitment." },
  ar: { selectedOrder: "الأمر المختار", issueOrder: "أصدر الأمر", reviewHint: "راجع كل أثر معلن قبل الالتزام." },
  de: { selectedOrder: "Gewählter Befehl", issueOrder: "Befehl erteilen", reviewHint: "Prüfe vor der Festlegung jede offengelegte Folge." },
  es: { selectedOrder: "Orden seleccionada", issueOrder: "Dar la orden", reviewHint: "Revisa cada efecto revelado antes de comprometerte." },
  fr: { selectedOrder: "Ordre sélectionné", issueOrder: "Donner l’ordre", reviewHint: "Examinez chaque effet annoncé avant de vous engager." },
  ja: { selectedOrder: "選択中の命令", issueOrder: "命令を下す", reviewHint: "決定前に、開示されたすべての効果を確認する。" },
  ko: { selectedOrder: "선택한 명령", issueOrder: "명령 내리기", reviewHint: "결정하기 전에 공개된 모든 효과를 검토하십시오." },
  ru: { selectedOrder: "Выбранный приказ", issueOrder: "Отдать приказ", reviewHint: "Перед решением проверьте все раскрытые последствия." },
  vi: { selectedOrder: "Mệnh lệnh đã chọn", issueOrder: "Ban lệnh", reviewHint: "Xem lại mọi hệ quả đã công bố trước khi cam kết." },
  "zh-Hans": { selectedOrder: "已选命令", issueOrder: "下达命令", reviewHint: "落子前，复核所有已经明示的影响。" },
  "zh-Hant": { selectedOrder: "已選命令", issueOrder: "下達命令", reviewHint: "落子前，複核所有已經明示的影響。" },
};

export const translateDecision = (locale: Locale, key: DecisionUiKey): string => decisionUi[locale][key];
