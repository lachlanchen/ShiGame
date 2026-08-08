import type { Locale } from "@shi/game-core";

export const oppositionUi = {
  en: { posture: "Pursuit posture", response: "Pursuit acts", counterplay: "Counterplay", noModifier: "No added pressure" },
  ar: { posture: "وضع المطاردة", response: "المطاردة تتحرك", counterplay: "إجراء مضاد", noModifier: "لا ضغط إضافي" },
  de: { posture: "Verfolgungslage", response: "Die Verfolgung reagiert", counterplay: "Gegenmittel", noModifier: "Kein Zusatzdruck" },
  es: { posture: "Postura de persecución", response: "La persecución responde", counterplay: "Contrajuego", noModifier: "Sin presión añadida" },
  fr: { posture: "Dispositif de poursuite", response: "La poursuite agit", counterplay: "Contre-jeu", noModifier: "Aucune pression ajoutée" },
  ja: { posture: "追撃態勢", response: "追撃の応手", counterplay: "対抗策", noModifier: "追加圧力なし" },
  ko: { posture: "추격 태세", response: "추격의 응수", counterplay: "대응책", noModifier: "추가 압박 없음" },
  ru: { posture: "Состояние погони", response: "Погоня действует", counterplay: "Контрмера", noModifier: "Без дополнительного давления" },
  vi: { posture: "Thế truy đuổi", response: "Truy đuổi đáp trả", counterplay: "Cách hóa giải", noModifier: "Không thêm áp lực" },
  "zh-Hans": { posture: "追捕态势", response: "追捕应手", counterplay: "反制", noModifier: "无追加压力" },
  "zh-Hant": { posture: "追捕態勢", response: "追捕應手", counterplay: "反制", noModifier: "無追加壓力" },
} satisfies Record<Locale, Record<string, string>>;

export type OppositionUiKey = keyof typeof oppositionUi.en;
export const translateOpposition = (locale: Locale, key: OppositionUiKey): string => oppositionUi[locale][key];
