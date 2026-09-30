import test from "node:test";
import assert from "node:assert/strict";
import { initialAssets } from "./web-build-assets.mjs";

test("initial JavaScript includes deduplicated eager dependencies, not only the entry", () => {
  const result = initialAssets(`<script type="module" src="/assets/main.js"></script>
    <link rel="modulepreload" href="/assets/react.js">
    <link href='/assets/locale.js' crossorigin rel='modulepreload'>
    <link rel="modulepreload" href="/assets/react.js">
    <link href="/assets/main.js" rel="modulepreload">
    <link rel="stylesheet" href="/assets/main.css">
    <link rel="icon" href="/favicon.svg">`);
  assert.deepEqual(result, { scripts: ["/assets/main.js"], styles: ["/assets/main.css"],
    javascript: ["/assets/main.js", "/assets/react.js", "/assets/locale.js"] });
});

test("remote preloads remain visible to origin validation and empty pages stay empty", () => {
  assert.deepEqual(initialAssets('<link rel="modulepreload" href="https://other.invalid/a.js">').javascript,
    ["https://other.invalid/a.js"]);
  assert.deepEqual(initialAssets("<html></html>"), { scripts: [], styles: [], javascript: [] });
});
