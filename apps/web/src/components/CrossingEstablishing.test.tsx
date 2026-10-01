// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { supportedLocales } from "@shi/game-core";
import scene from "../../../../content/presentation/crossing-establishing.v1.json";
import { CrossingEstablishing } from "./CrossingEstablishing";
afterEach(cleanup);
describe("optional pre-order crossing still", () => {
  it("has a complete readable alternative in each UI locale", () => {
    expect(Object.keys(scene.labels).sort()).toEqual([...supportedLocales].sort());
    for (const locale of supportedLocales) {
      const view = render(<CrossingEstablishing locale={locale} />);
      const image = view.getByRole("img", { name: scene.labels[locale].alt });
      expect(image.getAttribute("width")).toBe("1672");
      expect(image.getAttribute("height")).toBe("941");
      expect(view.container.textContent).toContain(scene.labels[locale].caption);
      expect(view.container.querySelectorAll("button,a,video,audio")).toHaveLength(0);
      view.unmount();
    }
  });
  it("fails open to the playable text UI without an action or save callback", () => {
    localStorage.setItem("shi.scenery-test", "unchanged");
    const view = render(<CrossingEstablishing locale="en" />);
    fireEvent.error(view.getByRole("img"));
    expect(view.queryByTestId("crossing-establishing")).toBeNull();
    expect(localStorage.getItem("shi.scenery-test")).toBe("unchanged");
    localStorage.removeItem("shi.scenery-test");
  });
});
