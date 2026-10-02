import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { jinyangFingerprint, jinyangCommandIds, type JinyangDefinition } from "../packages/game-core/src/jinyang-encounter";
for (const version of [1, 2]) {
const d = JSON.parse(await readFile(resolve(`content/encounters/jinyang.v${version}.json`), "utf8"));
jinyangFingerprint(d as JinyangDefinition);
const check = (condition: unknown, message: string) => { if (!condition) throw Error(message); };
check(d.status === "development-blockout" && d.classification === "gameplay-reconstruction", "Jinyang release/source boundary");
check(d.review.status === "agent-design-review" && d.review.releaseApproved === false, "Jinyang review boundary");
const sites = new Set<string>();
for (const site of d.sites) {
  check(typeof site.id === "string" && !sites.has(site.id), "Duplicate/malformed site");
  sites.add(site.id);
  check(Array.isArray(site.position) && site.position.length === 3 && site.position.every((n: number) => Number.isFinite(n) && Math.abs(n) <= 5000), "Unbounded site geometry");
  for (const locale of ["en", "zh-Hans"])
    check(typeof site.label[locale] === "string" && site.label[locale].length > 0 && site.label[locale].length <= 160, "Site label incomplete");
}
check(sites.size === 7 && ["wall","embankment","route","han","wei","zhi","zhao"].every(id => sites.has(id)), "Jinyang sites changed without a scene revision");
for (const command of d.commands) {
  check(sites.has(command.site), "Command references absent site");
  for (const locale of ["en", "zh-Hans"])
    check(typeof command.label[locale] === "string" && command.label[locale].length > 0 && command.label[locale].length <= 160, "Command label incomplete");
}
check(jinyangCommandIds(d).every(id => d.commands.filter((c: { id: string }) => c.id === id).length === 1), "Command set mismatch");
check(d.sourceReferences.length === 2 && d.sourceAnchors.every((id: string) => d.sourceReferences.some((s: { id: string }) => s.id === id)), "Unresolved historical anchors");
check(d.sourceReferences.every((s: { publicParallel: string }) => s.publicParallel.startsWith("https://zh.wikisource.org/wiki/")), "Primary-source reference missing");
for (const target of ["apps/web/src/generated", "apps/unity/Assets/StreamingAssets", "apps/unreal/Content/StreamingAssets"]) {
  const copy = JSON.parse(await readFile(resolve(target, `jinyang.v${version}.json`), "utf8"));
  check(JSON.stringify(copy) === JSON.stringify(d), "Jinyang client export differs: " + target);
}
console.log(`Jinyang v${version}: ${d.commands.length} performed orders, 7 bounded sites, two reviewed UI lanes, resolved source anchors, identical client exports; development only.`);
}
