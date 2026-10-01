import { gzipSync } from "node:zlib";
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { initialAssets } from "./web-build-assets.mjs";

const root = resolve(import.meta.dirname, "..");
const internal = process.argv[2] === "--internal-crossing" && process.argv.length === 4;
if (process.argv.length !== 2 && !internal) throw new Error("Usage: validate-web-build.mjs [--internal-crossing PRIVATE_DIST]");
const dist = internal ? resolve(process.argv[3]) : resolve(root, "apps/web/dist");
if (internal && !dist.startsWith(resolve(root, ".runtime") + "/")) throw new Error("Internal candidate must remain below SHI .runtime.");

const limits = {
  initialJavaScriptGzip: 100 * 1024,
  initialCssGzip: 12 * 1024,
  lazyJavaScriptGzip: 200 * 1024,
  localeCssGzip: 50 * 1024,
  fontBytes: 24 * 1024 * 1024,
  fontFiles: 600,
  deployBytes: 30 * 1024 * 1024,
};

const fail = (message) => {
  throw new Error(`Web build budget failed: ${message}`);
};
const kib = (bytes) => `${(bytes / 1024).toFixed(2)} KiB`;
const mib = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
const assertAtMost = (label, actual, limit, format = kib) => {
  if (actual > limit) fail(`${label} is ${format(actual)}; limit is ${format(limit)}.`);
};

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
};
const resolveAsset = (url) => {
  const pathname = new URL(url, "https://build.invalid/").pathname.replace(/^\/+/, "");
  const assetRoot = pathname.indexOf("assets/");
  return resolve(dist, assetRoot >= 0 ? pathname.slice(assetRoot) : pathname);
};
const gzipBytes = async (path) => gzipSync(await readFile(path)).byteLength;

const indexPath = resolve(dist, "index.html");
const html = await readFile(indexPath, "utf8").catch(() => fail("apps/web/dist/index.html is missing; run the web build first."));
if (html.includes('name="shi-build-channel" content="internal-crossing-v2"') !== internal) fail("build channel does not match the requested validation boundary");
const { scripts: scriptUrls, styles: cssUrls, javascript: initialJavaScriptUrls } = initialAssets(html);
if (scriptUrls.length !== 1) fail(`expected one initial module script, found ${scriptUrls.length}.`);
if (cssUrls.length !== 1) fail(`expected one initial stylesheet, found ${cssUrls.length}.`);
for (const url of [...initialJavaScriptUrls, ...cssUrls]) {
  if (/^(?:https?:)?\/\//i.test(url)) fail(`initial asset is remote: ${url}`);
}

const initialJsPaths = new Set(initialJavaScriptUrls.map(resolveAsset));
const initialCss = resolveAsset(cssUrls[0]);
const initialJsGzip = (await Promise.all([...initialJsPaths].map(gzipBytes))).reduce((sum, size) => sum + size, 0);
const initialCssGzip = await gzipBytes(initialCss);
assertAtMost("initial JavaScript gzip", initialJsGzip, limits.initialJavaScriptGzip);
assertAtMost("initial CSS gzip", initialCssGzip, limits.initialCssGzip);

const files = await walk(dist);
const records = await Promise.all(files.map(async (path) => ({
  path,
  relative: relative(dist, path),
  bytes: (await stat(path)).size,
  extension: extname(path),
})));
const deploymentRecords = records.filter((record) => record.extension !== ".map");
// Only the isolated internal candidate admits the revised crossing. Private
// media and the later retreat draft remain excluded in both build channels.
const crossingMarkers = ["shi.development.crossing-campaign.v1", "chapter-01-crossing-campaign-v1", "shi.development.crossing-campaign.v2", "chapter-01-crossing-campaign-v2", "chapter-01-crossing-aftermath-v2", "shi.internal.crossing-campaign.v2", "crossing-retry-confirmation"];
const seenCrossingMarkers = new Set();
for (const record of deploymentRecords.filter(record => [".js", ".json", ".html"].includes(record.extension))) {
  const contents = await readFile(record.path, "utf8");
  if (contents.includes("149d0d7bf2974bc17693852a4207613eec88ea0cd09351cafdded96267b7daad")) fail(`private palm study leaked into production: ${record.relative}`);
  for (const marker of crossingMarkers) if (contents.includes(marker)) seenCrossingMarkers.add(marker);
  for (const marker of ["refuge-followup.v1", "先安顿眼前的人", "shi.dev.chen-retreat.v1", "chen-retreat-story-draft.v1", "chen-retreat-rules.v1", "__shi_private_score__", "7d28d185acd999637b19fd9eb0eb1bec778eff9f17c9507fff92519643cdada4", "__shi_private_council_film__", "__shi_private_rain_scene__", "ef86dc9babb6e073949b2285a75bd4cc82703cae8eef55a422b42fe476819345", ...(internal ? [] : crossingMarkers)]) {
    if (contents.includes(marker)) fail(`development story/rules leaked into production: ${record.relative}`);
  }
}
if (internal && !["shi.internal.crossing-campaign.v2", "chapter-01-crossing-campaign-v2", "chapter-01-crossing-aftermath-v2"].every(marker => seenCrossingMarkers.has(marker))) fail("internal candidate is missing its authoritative crossing rules or save namespace");
const deployBytes = deploymentRecords.reduce((sum, record) => sum + record.bytes, 0);
const sourceMapBytes = records.filter((record) => record.extension === ".map").reduce((sum, record) => sum + record.bytes, 0);
assertAtMost("deployable artifact", deployBytes, limits.deployBytes, mib);

const fontRecords = deploymentRecords.filter((record) => [".woff2", ".woff", ".ttf", ".otf"].includes(record.extension));
const fontBytes = fontRecords.reduce((sum, record) => sum + record.bytes, 0);
assertAtMost("self-hosted font artifact", fontBytes, limits.fontBytes, mib);
assertAtMost("self-hosted font file count", fontRecords.length, limits.fontFiles, (value) => String(value));

const javascriptRecords = deploymentRecords.filter((record) => record.extension === ".js" && !initialJsPaths.has(record.path));
let largestLazyJs = { relative: "none", gzip: 0 };
for (const record of javascriptRecords) {
  const gzip = await gzipBytes(record.path);
  if (gzip > largestLazyJs.gzip) largestLazyJs = { relative: record.relative, gzip };
}
assertAtMost(`largest lazy JavaScript (${largestLazyJs.relative})`, largestLazyJs.gzip, limits.lazyJavaScriptGzip);

const localeCssRecords = deploymentRecords.filter((record) => record.extension === ".css" && record.path !== initialCss);
let largestLocaleCss = { relative: "none", gzip: 0 };
for (const record of localeCssRecords) {
  const css = await readFile(record.path, "utf8");
  if (/url\(\s*["']?(?:https?:)?\/\//i.test(css)) fail(`stylesheet contains a remote asset URL: ${record.relative}`);
  const gzip = gzipSync(css).byteLength;
  if (gzip > largestLocaleCss.gzip) largestLocaleCss = { relative: record.relative, gzip };
}
assertAtMost(`largest on-demand font CSS (${largestLocaleCss.relative})`, largestLocaleCss.gzip, limits.localeCssGzip);
if (/(?:src|href)=["'](?:https?:)?\/\//i.test(html)) fail("index.html contains a remote script, style or asset origin.");

console.log([
  "Web build budgets valid:",
  `initial JS ${kib(initialJsGzip)}/${kib(limits.initialJavaScriptGzip)},`,
  `initial CSS ${kib(initialCssGzip)}/${kib(limits.initialCssGzip)},`,
  `largest lazy JS ${kib(largestLazyJs.gzip)}/${kib(limits.lazyJavaScriptGzip)},`,
  `largest locale CSS ${kib(largestLocaleCss.gzip)}/${kib(limits.localeCssGzip)},`,
  `fonts ${fontRecords.length} files and ${mib(fontBytes)}/${mib(limits.fontBytes)},`,
  `deploy ${mib(deployBytes)}/${mib(limits.deployBytes)},`,
  `optional source maps ${mib(sourceMapBytes)}.`,
].join(" "));
