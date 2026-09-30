// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { supportedLocales } from "@shi/game-core";
import { EndingText } from "./EndingText";
afterEach(cleanup);

it.each(supportedLocales)("recovers text explicitly without changing the saved decision in %s", async locale => {
  const saved = '{"choices":["race-for-chen"]}';
  localStorage.setItem("shi.chapter-01.save.v6", saved);
  const Component = () => <p>Loaded ending</p>;
  const loader = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ ChapterEndingProse: Component });
  const view = render(<EndingText locale={locale} textKey="capturedText" loader={loader} />);
  expect(view.getByRole("status")).toBeTruthy();
  await view.findByRole("alert");
  expect(loader).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(saved);
  fireEvent.click(view.getByRole("button"));
  await view.findByText("Loaded ending");
  expect(loader).toHaveBeenCalledTimes(2);
  expect(view.queryByRole("alert")).toBeNull();
  expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(saved);
});

it("does not publish a late result after leaving the ending", async () => {
  let finish!: (value: { ChapterEndingProse: () => React.ReactNode }) => void;
  const loader = vi.fn(() => new Promise<{ ChapterEndingProse: () => React.ReactNode }>(resolve => { finish = resolve; }));
  const view = render(<EndingText locale="en" textKey="capturedText" loader={loader} />);
  view.unmount();
  await act(async () => finish({ ChapterEndingProse: () => <p>Late ending</p> }));
  expect(document.body.textContent).not.toContain("Late ending");
});
