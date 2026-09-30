// Full catalog for native export and localization validation; not the web entry.
import { ui as coreUi } from "./i18n";
import { endingLabels } from "./ending-labels";
import { guideLabels } from "./guide-labels";

export const ui = {
  "en": { ...coreUi["en"], ...guideLabels["en"], ...endingLabels["en"] },
  "ar": { ...coreUi["ar"], ...guideLabels["ar"], ...endingLabels["ar"] },
  "de": { ...coreUi["de"], ...guideLabels["de"], ...endingLabels["de"] },
  "es": { ...coreUi["es"], ...guideLabels["es"], ...endingLabels["es"] },
  "fr": { ...coreUi["fr"], ...guideLabels["fr"], ...endingLabels["fr"] },
  "ja": { ...coreUi["ja"], ...guideLabels["ja"], ...endingLabels["ja"] },
  "ko": { ...coreUi["ko"], ...guideLabels["ko"], ...endingLabels["ko"] },
  "ru": { ...coreUi["ru"], ...guideLabels["ru"], ...endingLabels["ru"] },
  "vi": { ...coreUi["vi"], ...guideLabels["vi"], ...endingLabels["vi"] },
  "zh-Hans": { ...coreUi["zh-Hans"], ...guideLabels["zh-Hans"], ...endingLabels["zh-Hans"] },
  "zh-Hant": { ...coreUi["zh-Hant"], ...guideLabels["zh-Hant"], ...endingLabels["zh-Hant"] },
};
