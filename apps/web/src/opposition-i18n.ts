import type { Locale } from "@shi/game-core";

export const oppositionUi = {
  en: { posture: "Pursuit posture", response: "Pursuit acts", counterplay: "Counterplay", noModifier: "No added pressure", methodRead: "Method read", method: "Method", observed: "Observed methods", readHits: "Read hits", readMisses: "Read misses" },
  ar: { posture: "وضع المطاردة", response: "المطاردة تتحرك", counterplay: "إجراء مضاد", noModifier: "لا ضغط إضافي", methodRead: "قراءة الأسلوب", method: "الأسلوب", observed: "الأساليب المرصودة", readHits: "القراءة تصيب", readMisses: "القراءة تخطئ" },
  de: { posture: "Verfolgungslage", response: "Die Verfolgung reagiert", counterplay: "Gegenmittel", noModifier: "Kein Zusatzdruck", methodRead: "Methodenanalyse", method: "Methode", observed: "Beobachtete Methoden", readHits: "Analyse trifft", readMisses: "Analyse verfehlt" },
  es: { posture: "Postura de persecución", response: "La persecución responde", counterplay: "Contrajuego", noModifier: "Sin presión añadida", methodRead: "Lectura del método", method: "Método", observed: "Métodos observados", readHits: "La lectura acierta", readMisses: "La lectura falla" },
  fr: { posture: "Dispositif de poursuite", response: "La poursuite agit", counterplay: "Contre-jeu", noModifier: "Aucune pression ajoutée", methodRead: "Lecture de méthode", method: "Méthode", observed: "Méthodes observées", readHits: "La lecture vise juste", readMisses: "La lecture échoue" },
  ja: { posture: "追撃態勢", response: "追撃の応手", counterplay: "対抗策", noModifier: "追加圧力なし", methodRead: "手筋の読み", method: "手筋", observed: "観測した手筋", readHits: "読みが的中", readMisses: "読みが外れる" },
  ko: { posture: "추격 태세", response: "추격의 응수", counterplay: "대응책", noModifier: "추가 압박 없음", methodRead: "수법 판독", method: "수법", observed: "관측한 수법", readHits: "판독 적중", readMisses: "판독 빗나감" },
  ru: { posture: "Состояние погони", response: "Погоня действует", counterplay: "Контрмера", noModifier: "Без дополнительного давления", methodRead: "Разбор метода", method: "Метод", observed: "Замеченные методы", readHits: "Расчёт верен", readMisses: "Расчёт неверен" },
  vi: { posture: "Thế truy đuổi", response: "Truy đuổi đáp trả", counterplay: "Cách hóa giải", noModifier: "Không thêm áp lực", methodRead: "Đọc thủ pháp", method: "Thủ pháp", observed: "Thủ pháp đã thấy", readHits: "Đọc trúng", readMisses: "Đọc trượt" },
  "zh-Hans": { posture: "追捕态势", response: "追捕应手", counterplay: "反制", noModifier: "无追加压力", methodRead: "手法识势", method: "手法", observed: "已见手法", readHits: "识势命中", readMisses: "识势落空" },
  "zh-Hant": { posture: "追捕態勢", response: "追捕應手", counterplay: "反制", noModifier: "無追加壓力", methodRead: "手法識勢", method: "手法", observed: "已見手法", readHits: "識勢命中", readMisses: "識勢落空" },
} satisfies Record<Locale, Record<string, string>>;

export type OppositionUiKey = keyof typeof oppositionUi.en;
export const translateOpposition = (locale: Locale, key: OppositionUiKey): string => oppositionUi[locale][key];
