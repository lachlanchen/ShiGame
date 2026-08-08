import { describe, expect, it } from "vitest";
import { supportedLocales } from "@shi/game-core";
import { localeFontContracts } from "./fontLoader";

describe("locale font contract", () => {
  it("covers every supported locale with a real sample and family", () => {
    expect(Object.keys(localeFontContracts).sort()).toEqual([...supportedLocales].sort());
    for (const locale of supportedLocales) {
      const contract = localeFontContracts[locale];
      expect(contract.family, locale).toMatch(/ Variable$/);
      expect(contract.sample.trim().length, locale).toBeGreaterThan(4);
    }
  });

  it("loads dedicated Arabic and CJK script faces on demand", () => {
    for (const locale of ["ar", "ja", "ko", "zh-Hans", "zh-Hant"] as const) {
      expect(localeFontContracts[locale].load, locale).toBeTypeOf("function");
    }
    for (const locale of ["en", "de", "es", "fr", "ru", "vi"] as const) {
      expect(localeFontContracts[locale].load, locale).toBeUndefined();
    }
  });
});
