import { expect, it } from "vitest";
import canonical from "../../../content/campaigns/chapter-01-daze.json";
import gameplay from "./generated/chapter-01-gameplay.json";
import sources from "./generated/chapter-01-sources.json";

it("defers the complete source ledger without changing playable history or references", () => {
  expect(gameplay.sources).toEqual([]);
  expect(sources).toEqual(canonical.sources);
  expect(gameplay.nodes).toEqual(canonical.nodes);
  for (const node of gameplay.nodes) {
    for (const id of node.sourceRefs) expect(sources.some(source => source.id === id)).toBe(true);
  }
});
