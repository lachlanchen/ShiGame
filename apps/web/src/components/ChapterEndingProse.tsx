import type { Locale } from "@shi/game-core";
import { endingLabels } from "../ending-labels";

export function ChapterEndingProse({ locale, textKey }: { locale: Locale; textKey: keyof typeof endingLabels.en }) {
  return <p data-testid="chapter-ending-prose">{endingLabels[locale][textKey]}</p>;
}
