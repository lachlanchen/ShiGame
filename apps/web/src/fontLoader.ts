import type { Locale } from "@shi/game-core";

interface LocaleFontContract {
  family: string;
  sample: string;
  load?: () => Promise<unknown>;
}

const interContract = (sample: string): LocaleFontContract => ({ family: "Inter Variable", sample });

export const localeFontContracts: Record<Locale, LocaleFontContract> = {
  en: interContract("Power, position, and trust"),
  de: interContract("Macht, Gelände und Vertrauen"),
  es: interContract("Poder, terreno y confianza"),
  fr: interContract("Pouvoir, terrain et confiance"),
  ru: interContract("Власть, местность и доверие"),
  vi: interContract("Quyền lực, địa thế và niềm tin"),
  ar: {
    family: "Noto Sans Arabic Variable",
    sample: "القوة والأرض والثقة",
    load: () => import("@fontsource-variable/noto-sans-arabic/wght.css"),
  },
  ja: {
    family: "Noto Sans JP Variable",
    sample: "力・地勢・信頼",
    load: () => import("@fontsource-variable/noto-sans-jp/wght.css"),
  },
  ko: {
    family: "Noto Sans KR Variable",
    sample: "힘·지세·신뢰",
    load: () => import("@fontsource-variable/noto-sans-kr/wght.css"),
  },
  "zh-Hans": {
    family: "Noto Sans SC Variable",
    sample: "权力、地势与信任",
    load: () => import("@fontsource-variable/noto-sans-sc/wght.css"),
  },
  "zh-Hant": {
    family: "Noto Sans TC Variable",
    sample: "權力、地勢與信任",
    load: () => import("@fontsource-variable/noto-sans-tc/wght.css"),
  },
};

const loaded = new Map<Locale, Promise<void>>();

export function ensureLocaleFont(locale: Locale): Promise<void> {
  const current = loaded.get(locale);
  if (current) return current;
  const contract = localeFontContracts[locale];
  const task = Promise.all([
    import("@fontsource-variable/noto-serif-sc/wght.css"),
    Promise.resolve(contract.load?.()),
  ])
    .then(() => Promise.all([
      document.fonts.load(`400 1em "${contract.family}"`, contract.sample),
      document.fonts.load('500 1em "Noto Serif SC Variable"', "勢势"),
    ]))
    .then(() => {
      if (!document.fonts.check(`400 1em "${contract.family}"`, contract.sample)) {
        throw new Error(`Required locale font did not become available: ${locale} / ${contract.family}`);
      }
      if (!document.fonts.check('500 1em "Noto Serif SC Variable"', "勢势")) {
        throw new Error("Required SHI seal font did not become available.");
      }
    });
  loaded.set(locale, task);
  return task;
}
