import type { Locale } from "@shi/game-core";

export const mapUi = {
  en: { mapIntel: "Strategic intelligence map", inspectMap: "Inspect map", knownGround: "Known ground", reportedGround: "Reported network", referenceOnly: "Reference only", uncertainty: "Uncertainty" },
  ar: { mapIntel: "خريطة الاستخبارات الاستراتيجية", inspectMap: "تفحّص الخريطة", knownGround: "أرض معروفة", reportedGround: "شبكة منقولة", referenceOnly: "مرجع فقط", uncertainty: "موضع الشك" },
  de: { mapIntel: "Strategische Lagekarte", inspectMap: "Karte prüfen", knownGround: "Bekanntes Gebiet", reportedGround: "Gemeldetes Netzwerk", referenceOnly: "Nur Orientierung", uncertainty: "Unsicherheit" },
  es: { mapIntel: "Mapa de inteligencia estratégica", inspectMap: "Examinar mapa", knownGround: "Terreno conocido", reportedGround: "Red informada", referenceOnly: "Solo referencia", uncertainty: "Incertidumbre" },
  fr: { mapIntel: "Carte de renseignement stratégique", inspectMap: "Examiner la carte", knownGround: "Terrain connu", reportedGround: "Réseau signalé", referenceOnly: "Repère seulement", uncertainty: "Incertitude" },
  ja: { mapIntel: "戦略情報図", inspectMap: "地図を調べる", knownGround: "既知の地", reportedGround: "伝聞の勢力", referenceOnly: "参照のみ", uncertainty: "不確実性" },
  ko: { mapIntel: "전략 정보 지도", inspectMap: "지도 살피기", knownGround: "알려진 땅", reportedGround: "전해진 세력망", referenceOnly: "참조 전용", uncertainty: "불확실성" },
  ru: { mapIntel: "Карта стратегических сведений", inspectMap: "Изучить карту", knownGround: "Известная местность", reportedGround: "Сеть по донесениям", referenceOnly: "Только ориентир", uncertainty: "Неопределённость" },
  vi: { mapIntel: "Bản đồ tình báo chiến lược", inspectMap: "Xem xét bản đồ", knownGround: "Địa bàn đã biết", reportedGround: "Mạng lưới được báo", referenceOnly: "Chỉ để tham chiếu", uncertainty: "Điều chưa chắc" },
  "zh-Hans": { mapIntel: "战略情报图", inspectMap: "查看地图", knownGround: "已知地点", reportedGround: "传闻网络", referenceOnly: "仅作参照", uncertainty: "不确定之处" },
  "zh-Hant": { mapIntel: "戰略情報圖", inspectMap: "查看地圖", knownGround: "已知地點", reportedGround: "傳聞網絡", referenceOnly: "僅作參照", uncertainty: "不確定之處" },
} satisfies Record<Locale, Record<string, string>>;

export type MapUiKey = keyof typeof mapUi.en;
export const translateMap = (locale: Locale, key: MapUiKey): string => mapUi[locale][key] ?? mapUi.en[key];
