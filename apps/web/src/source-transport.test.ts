import { expect, it } from "vitest";
import canonical from "../../../content/campaigns/chapter-01-daze.json";
import gameplay from "./generated/chapter-01-gameplay.json";
import sources from "./generated/chapter-01-sources.json";
import acts from "./generated/chapter-01-horizon.json";
import claims from "./generated/chapter-01-claims.json";
import commitments from "./generated/chapter-01-commitments.json";
import opposition from "./generated/chapter-01-opposition.json";

it("reconstructs the exact canonical campaign from every deferred slice", () => {
  expect({ ...gameplay, acts, claims, sources, commitments, opposition }).toEqual(canonical);
});

it("defers the complete source ledger without changing playable history or references", () => {
  expect(gameplay.sources).toEqual([]);
  expect(sources).toEqual(canonical.sources);
  expect(gameplay.nodes).toEqual(canonical.nodes);
  for (const node of gameplay.nodes) {
    for (const id of node.sourceRefs) expect(sources.some(source => source.id === id)).toBe(true);
  }
});
