// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { supportedLocales } from "@shi/game-core";
import content from "../../../../content/presentation/viewpoints.v1.json";
import { ViewpointIntro } from "./ViewpointIntro";

afterEach(cleanup);
describe("shared viewpoint prose", () => {
  for (const scene of ["council", "fanyang"] as const) {
    it.each(supportedLocales)(`${scene} presents its actual language without controls or storage writes (%s)`, locale => {
      const before = JSON.stringify(localStorage);
      const view = render(<ViewpointIntro scene={scene} locale={locale} />);
      const language = locale === "zh-Hans" ? "zh-Hans" : "en";
      const section = view.getByTestId(`${scene}-viewpoint`);
      expect(section.lang).toBe(language);
      expect(section.dir).toBe("ltr");
      expect(section.textContent).toContain(content.scenes[scene].text[language]);
      expect(view.getByTestId(`${scene}-story-bridge`).textContent).toBe(content.scenes[scene].bridge[language]);
      expect(section.querySelectorAll("p")[0]?.textContent).toBe(content.scenes[scene].text[language]);
      expect(section.querySelector("button, a, input")).toBeNull();
      expect(JSON.stringify(localStorage)).toBe(before);
    });
  }
});
