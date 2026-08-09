import { readFile } from "node:fs/promises";
import { generateConformanceFixture, fixturePath } from "./generate-conformance-fixtures";

const expected = `${JSON.stringify(await generateConformanceFixture(), null, 2)}\n`;
const actual = await readFile(fixturePath, "utf8");
if (actual !== expected) {
  console.error("Cross-engine replay fixtures are stale. Run npm run conformance:write and review the gameplay diff.");
  process.exit(1);
}
const fixture = JSON.parse(actual) as { routeCount: number; successfulRoutes: number; failureRoutes: number; campaignSha256: string };
if (fixture.routeCount < 20 || fixture.successfulRoutes < 1 || fixture.failureRoutes < 1)
  throw new Error("Cross-engine fixture coverage does not include enough success and failure routes.");
console.log(`Cross-engine replay fixtures valid: ${fixture.routeCount} fixed-seed routes (${fixture.successfulRoutes} success, ${fixture.failureRoutes} failure), campaign ${fixture.campaignSha256.slice(0, 12)}.`);
