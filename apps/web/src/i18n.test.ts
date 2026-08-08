import { describe, expect, it } from "vitest";
import { supportedLocales } from "@shi/game-core";
import { isRtl, ui } from "./i18n";
import { mapUi } from "./map-i18n";

describe("interface localization", () => {
  it("covers every interface key in every supported locale", () => {
    const keys = Object.keys(ui.en);
    for (const locale of supportedLocales) {
      expect(Object.keys(ui[locale]).sort(), locale).toEqual([...keys].sort());
      for (const key of keys) expect(ui[locale][key as keyof typeof ui.en].trim(), `${locale}.${key}`).not.toBe("");
    }
  });

  it("marks Arabic as right-to-left", () => {
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("en")).toBe(false);
  });

  it("covers every wartable intelligence label in every locale", () => {
    const keys = Object.keys(mapUi.en);
    for (const locale of supportedLocales) {
      expect(Object.keys(mapUi[locale]).sort(), locale).toEqual([...keys].sort());
      for (const key of keys) expect(mapUi[locale][key as keyof typeof mapUi.en].trim(), `${locale}.map.${key}`).not.toBe("");
    }
  });
});
