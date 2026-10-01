// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { engagementMetricKeys, supportedLocales, type EngagementState } from "@shi/game-core";
import field from "../../../../content/presentation/crossing-field.v1.json";
import { CrossingField, crossingFieldProjection } from "./CrossingField";

afterEach(cleanup);
const metrics = (value: number) => Object.fromEntries(engagementMetricKeys.map(key => [key, value])) as EngagementState["metrics"];

describe("read-only crossing schematic", () => {
  it("projects indices, not literal people, with fixed geography and bounded endpoints", () => {
    expect(crossingFieldProjection(metrics(0))).toEqual({ progressX: 24, rearSpread: 8, pursuitX: 6 });
    expect(crossingFieldProjection(metrics(50))).toEqual({ progressX: 52, rearSpread: 5, pursuitX: 12.5 });
    expect(crossingFieldProjection(metrics(100))).toEqual({ progressX: 80, rearSpread: 2, pursuitX: 19 });
    expect(crossingFieldProjection(metrics(-100))).toEqual(crossingFieldProjection(metrics(0)));
    expect(crossingFieldProjection(metrics(200))).toEqual(crossingFieldProjection(metrics(100)));
    expect(crossingFieldProjection(metrics(NaN))).toEqual(crossingFieldProjection(metrics(0)));
    const frozen = Object.freeze(metrics(23)); crossingFieldProjection(frozen);
    expect(frozen).toEqual(metrics(23));
  });
  it("updates from committed state without exposing commands or mutating a save", () => {
    const view = render(<CrossingField metrics={metrics(20)} locale="en" />);
    expect(view.getByTestId("crossing-field").querySelectorAll("button,input,a")).toHaveLength(0);
    expect(view.container.querySelector("[data-field-progress]")?.getAttribute("data-field-progress")).toBe("35.2");
    view.rerender(<CrossingField metrics={metrics(80)} locale="en" />);
    expect(view.container.querySelector("[data-field-progress]")?.getAttribute("data-field-progress")).toBe("68.8");
    expect(view.container.querySelectorAll("li")).toHaveLength(3);
    expect(view.container.textContent).toContain("not headcounts or exact positions");
    expect(view.container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
  it("provides all eleven readable language alternatives without mirroring geography", () => {
    expect(Object.keys(field.labels).sort()).toEqual([...supportedLocales].sort());
    for (const locale of supportedLocales) {
      const view = render(<CrossingField metrics={metrics(50)} locale={locale} />);
      expect(view.container.textContent).toContain(field.labels[locale].boundary);
      expect(view.container.querySelector(".crossing-field-banks")?.getAttribute("dir")).toBe("ltr");
      expect(view.container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 100 60");
      view.unmount();
    }
  });
});
