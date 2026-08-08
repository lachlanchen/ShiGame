import type { Locale } from "@shi/game-core";

const evidence = {
  en: { received: "Received historical account", claimRegister: "Claim register", evidenceLocated: "Evidence located", specialistReview: "Specialist review required", authoredClaim: "Authored reconstruction", openEdition: "Open public edition", publicSource: "Evidence & uncertainty" },
  ar: { received: "رواية تاريخية منقولة", claimRegister: "سجل الادعاءات", evidenceLocated: "تم تحديد الدليل", specialistReview: "مراجعة مختص مطلوبة", authoredClaim: "إعادة بناء مؤلفة", openEdition: "فتح الطبعة العامة", publicSource: "الأدلة وعدم اليقين" },
  de: { received: "Überlieferter Bericht", claimRegister: "Aussagenregister", evidenceLocated: "Belegstelle gefunden", specialistReview: "Fachprüfung erforderlich", authoredClaim: "Verfasste Rekonstruktion", openEdition: "Öffentliche Ausgabe öffnen", publicSource: "Belege & Unsicherheit" },
  es: { received: "Relato histórico transmitido", claimRegister: "Registro de afirmaciones", evidenceLocated: "Evidencia localizada", specialistReview: "Revisión especialista requerida", authoredClaim: "Reconstrucción de autor", openEdition: "Abrir edición pública", publicSource: "Evidencia e incertidumbre" },
  fr: { received: "Récit historique transmis", claimRegister: "Registre des affirmations", evidenceLocated: "Preuve localisée", specialistReview: "Examen spécialiste requis", authoredClaim: "Reconstruction d’auteur", openEdition: "Ouvrir l’édition publique", publicSource: "Preuves et incertitude" },
  ja: { received: "伝世史料", claimRegister: "史実主張台帳", evidenceLocated: "根拠箇所確認済み", specialistReview: "専門家の確認が必要", authoredClaim: "創作再構成", openEdition: "公開版を開く", publicSource: "根拠と不確実性" },
  ko: { received: "전승 사료", claimRegister: "역사 주장 장부", evidenceLocated: "근거 위치 확인", specialistReview: "전문가 검토 필요", authoredClaim: "창작 재구성", openEdition: "공개 판본 열기", publicSource: "근거와 불확실성" },
  ru: { received: "Переданный исторический рассказ", claimRegister: "Реестр утверждений", evidenceLocated: "Источник найден", specialistReview: "Нужна проверка специалиста", authoredClaim: "Авторская реконструкция", openEdition: "Открыть публичное издание", publicSource: "Свидетельства и неопределённость" },
  vi: { received: "Sử liệu lưu truyền", claimRegister: "Sổ luận điểm", evidenceLocated: "Đã xác định chứng cứ", specialistReview: "Cần chuyên gia thẩm định", authoredClaim: "Tái dựng do tác giả", openEdition: "Mở bản công khai", publicSource: "Chứng cứ và bất định" },
  "zh-Hans": { received: "传世史籍记载", claimRegister: "史实主张簿", evidenceLocated: "已定位证据", specialistReview: "需要专家审阅", authoredClaim: "原创重构", openEdition: "打开公开版本", publicSource: "证据与不确定性" },
  "zh-Hant": { received: "傳世史籍記載", claimRegister: "史實主張簿", evidenceLocated: "已定位證據", specialistReview: "需要專家審閱", authoredClaim: "原創重構", openEdition: "打開公開版本", publicSource: "證據與不確定性" },
} satisfies Record<Locale, Record<string, string>>;

export type EvidenceKey = keyof typeof evidence.en;
export const translateEvidence = (locale: Locale, key: EvidenceKey): string => evidence[locale][key] ?? evidence.en[key];
