import type { Locale } from "@shi/game-core";

const labels = {
  en: ["Sound", "Sound on", "Sound off"], ar: ["الصوت", "الصوت مفعّل", "الصوت متوقف"],
  de: ["Ton", "Ton an", "Ton aus"], es: ["Sonido", "Sonido activo", "Sonido desactivado"],
  fr: ["Son", "Son activé", "Son coupé"], ja: ["サウンド", "サウンド オン", "サウンド オフ"],
  ko: ["사운드", "사운드 켜짐", "사운드 꺼짐"], ru: ["Звук", "Звук включён", "Звук выключен"],
  vi: ["Âm thanh", "Đã bật âm thanh", "Đã tắt âm thanh"],
  "zh-Hans": ["声音", "声音已开", "声音已关"], "zh-Hant": ["聲音", "聲音已開", "聲音已關"],
} satisfies Record<Locale, [string, string, string]>;

export const translateSound = (locale: Locale, key: "sound" | "on" | "off") => labels[locale][key === "sound" ? 0 : key === "on" ? 1 : 2];
