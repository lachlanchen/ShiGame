import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const queue = JSON.parse(await readFile(resolve(root, "content/research/martial-source-review.v1.json"), "utf8"));
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const requiredWorks = new Set(["sunzi", "sunbin-bingfa", "simafa", "weiliaozi", "guiguzi", "wuzi"]);
const verifyPrivateMirrors = process.argv.includes("--verify-private");
const forbiddenKeys = new Set(["text", "excerpt", "translation", "quote", "quotation"]);
const visit = (value, path = "queue") => {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert(!forbiddenKeys.has(key), `${path} contains forbidden source-content field ${key}`);
    visit(child, `${path}.${key}`);
  }
};
const localized = (value, label) => {
  assert(typeof value?.en === "string" && value.en.trim(), `${label} requires English`);
  assert(typeof value?.["zh-Hans"] === "string" && value["zh-Hans"].trim(), `${label} requires Simplified Chinese`);
};

assert(queue.schemaVersion === 1, "martial source queue schemaVersion must be 1");
assert(queue.publicationMode === "metadata-review-queue-only", "martial source queue must remain metadata-only");
assert(queue.allowedPublicOrigin === "https://zh.wikisource.org", "martial source queue public origin drifted");
assert(/^\d{4}-\d{2}-\d{2}$/.test(queue.accessDate ?? ""), "martial source queue accessDate must use YYYY-MM-DD");
assert(Array.isArray(queue.works) && queue.works.length === requiredWorks.size, "martial source queue must contain exactly the six reviewed candidate works");
visit(queue);

const workIds = new Set();
const sectionIds = new Set();
for (const work of queue.works ?? []) {
  assert(requiredWorks.has(work.id), `unexpected martial source work ${work.id}`);
  assert(!workIds.has(work.id), `duplicate martial source work ${work.id}`);
  workIds.add(work.id);
  assert(typeof work.title === "string" && work.title.trim(), `work ${work.id} requires a title`);
  assert(["registered-strategic-lens", "candidate-not-runtime"].includes(work.runtimeStatus), `work ${work.id} has invalid runtimeStatus`);
  assert(typeof work.publicPageStatus === "string" && work.publicPageStatus.trim(), `work ${work.id} requires publicPageStatus`);
  try {
    const publicUrl = new URL(work.publicPage);
    assert(publicUrl.origin === queue.allowedPublicOrigin, `work ${work.id} public page leaves the allowlisted origin`);
    assert(publicUrl.protocol === "https:", `work ${work.id} public page must use HTTPS`);
  } catch {
    assert(false, `work ${work.id} has an invalid public page URL`);
  }
  assert(/^\.\.\/ZhJpBook\/books\/[a-z0-9-]+\/markdown\/wenyan\.md$/.test(work.privateMirror ?? ""), `work ${work.id} private mirror path is outside the discovery boundary`);
  assert(/^[a-f0-9]{64}$/.test(work.privateMirrorSha256 ?? ""), `work ${work.id} requires a SHA-256 discovery hash`);
  localized(work.textualStatusNote, `work ${work.id}.textualStatusNote`);
  assert(Array.isArray(work.candidateSections) && work.candidateSections.length >= 3, `work ${work.id} requires at least three candidate sections`);
  for (const section of work.candidateSections ?? []) {
    assert(typeof section.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(section.id), `work ${work.id} has an invalid candidate section id`);
    assert(!sectionIds.has(section.id), `duplicate martial candidate section ${section.id}`);
    sectionIds.add(section.id);
    assert(typeof section.locator === "string" && section.locator.trim(), `section ${section.id} requires a locator`);
    assert(typeof section.systemTarget === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(section.systemTarget), `section ${section.id} has invalid systemTarget`);
    assert(["p0", "p1", "p2"].includes(section.priority), `section ${section.id} has invalid priority`);
    localized(section.gameQuestion, `section ${section.id}.gameQuestion`);
    localized(section.evidenceBoundary, `section ${section.id}.evidenceBoundary`);
  }
}
for (const required of requiredWorks) assert(workIds.has(required), `martial source queue is missing ${required}`);
assert(queue.works?.filter((work) => work.runtimeStatus === "registered-strategic-lens").map((work) => work.id).join(",") === "sunzi", "only the already registered Sunzi lens may be runtime-active");
assert(queue.works?.find((work) => work.id === "weiliaozi")?.publicPageStatus === "landing-page-marked-incomplete", "Weiliaozi public transcription risk must remain explicit");

if (verifyPrivateMirrors) {
  for (const work of queue.works ?? []) {
    try {
      const bytes = await readFile(resolve(root, work.privateMirror));
      const digest = createHash("sha256").update(bytes).digest("hex");
      assert(digest === work.privateMirrorSha256, `work ${work.id} private discovery mirror hash drifted`);
    } catch {
      assert(false, `work ${work.id} private discovery mirror is unavailable`);
    }
  }
}

if (errors.length) {
  console.error(`Martial source review validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Martial source queue valid: ${workIds.size} works, ${sectionIds.size} candidate sections, metadata-only with one registered runtime lens${verifyPrivateMirrors ? ", private discovery hashes verified" : ""}.`);
