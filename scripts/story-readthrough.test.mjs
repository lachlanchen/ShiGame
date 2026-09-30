import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { auditDraft, readRoute, validateDraft } from "./story-readthrough.mjs";

const draft = JSON.parse(await readFile(new URL("../content/story-drafts/chen-retreat.v1.json", import.meta.url), "utf8"));
const input = { fanyang: "opened", yu: "present", han: "cooperating" };
const together = ["keep-reserve", "open-reception", "escort-households", "divide-records", "stay-together"];

test("every authored choice, conditional passage and ending is reachable without a narrative dead end", () => {
  const result = auditDraft(draft);
  assert.equal(result.inputContexts, 12);
  assert.equal(result.choices, 15);
  assert.equal(result.routes, 2268);
  assert.deepEqual(result.endings, { together: 324, remnant: 972, dispersed: 972 });
});

test("reading is deterministic and does not mutate draft, inputs or choices", () => {
  const before = JSON.stringify({ draft, input, together });
  assert.deepEqual(readRoute(draft, input, together), readRoute(draft, input, together));
  assert.equal(JSON.stringify({ draft, input, together }), before);
});

test("missing companions never speak; each Fan Yang outcome receives its own report", () => {
  const reports = new Set();
  for (const fanyang of draft.inputs.fanyang) {
    const result = readRoute(draft, { fanyang, yu: "absent", han: "unavailable" }, together);
    const lines = result.transcript.flatMap(beat => [...beat.lines, ...beat.reaction]);
    assert.ok(lines.every(line => !["yu-mu", "qin-courier"].includes(line.speaker)));
    reports.add(JSON.stringify(result.transcript[0].lines));
  }
  assert.equal(reports.size, 3);
  const presentLines = readRoute(draft, input, together).transcript.flatMap(beat => beat.lines);
  assert.ok(presentLines.some(line => line.speaker === "yu-mu"));
  assert.ok(presentLines.some(line => line.speaker === "qin-courier"));
});

test("earlier decisions remain facts and select later responses without restoring removed names", () => {
  const choices = ["send-support", "gather-own", "hold-formation", "strip-identities", "move-with-remnant"];
  const result = readRoute(draft, input, choices);
  assert.equal(result.facts.reserves, "send-support");
  assert.equal(result.facts.records, "strip-identities");
  assert.ok(result.transcript[2].lines.some(line => line.text.includes("押粮的人还没回")));
  assert.ok(result.transcript[4].lines.some(line => line.text.includes("没有补写那些被去掉的名字")));
  assert.equal(result.endingId, "remnant");
});

test("invalid, unavailable, incomplete and overlong reading routes are rejected", () => {
  assert.throws(() => readRoute(draft, { ...input, han: "unknown" }, together));
  assert.throws(() => readRoute(draft, { fanyang: "opened" }, together));
  assert.throws(() => readRoute(draft, input, ["invented-order"]));
  assert.throws(() => readRoute(draft, input, together.slice(0, 4)));
  assert.throws(() => readRoute(draft, input, [...together, "stay-together"]));
  assert.throws(() => readRoute(draft, input, ["keep-reserve", "open-reception", "split-routes", "divide-records", "stay-together"]));
});

test("authoring validation rejects unknown facts, future knowledge, bad destinations and publication promotion", () => {
  for (const mutate of [
    value => { value.scenes[0].variants[0].when.fanyang = "invented"; },
    value => { value.scenes[0].variants[0].when.records = "carry-records"; },
    value => { value.scenes[1].choices[0].next = "reserves"; },
    value => { value.scenes[0].choices[0].next = "missing"; },
    value => { value.scenes[0].choices[0].ending = "together"; },
    value => { value.scenes[0].sourceIds = ["missing-source"]; },
    value => { value.publicationApproved = true; }
  ]) {
    const copy = structuredClone(draft);
    mutate(copy);
    assert.throws(() => validateDraft(copy));
  }
});
