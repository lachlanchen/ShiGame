// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { supportedLocales } from "@shi/game-core";
import content from "../../../../content/presentation/viewpoints.v1.json";
import { ViewpointIntro } from "./ViewpointIntro";

afterEach(cleanup);
describe("shared viewpoint prose", () => {
  it("separates the keeper's arrival from the council's policy role", () => {
    const view = render(<ViewpointIntro scene="council" locale="zh-Hans" chapterChoices={["root-in-villages"]} />);
    const prose = view.getByTestId("council-viewpoint").textContent!;
    expect(prose).toContain("不是让掌简人登上王位");
    expect(prose).toContain("隔了一段时日，陈地已经易手");
    expect(prose).toContain("掌简人随粮队入城");
    expect(prose.indexOf("掌简人随粮队入城")).toBeLessThan(prose.indexOf("你先前选了从乡里立约"));
  });
  it("does not invent a strategic memory for absent, conflicting or foreign choices", () => {
    for (const chapterChoices of [[], ["take-crown"], ["root-in-villages", "race-for-chen"]]) {
      const view = render(<ViewpointIntro scene="council" locale="en" chapterChoices={chapterChoices} />);
      expect(view.queryByTestId("council-chapter-bridge")).toBeNull();
      view.unmount();
    }
    const view = render(<ViewpointIntro scene="fanyang" locale="en" chapterChoices={["root-in-villages"]} />);
    expect(view.queryByTestId("council-chapter-bridge")).toBeNull();
  });
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
