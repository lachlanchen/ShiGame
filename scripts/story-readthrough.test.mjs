import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { auditDraft, readRoute, validateDraft } from "./story-readthrough.mjs";

const draft = JSON.parse(await readFile(new URL("../content/story-drafts/chen-retreat.v1.json", import.meta.url), "utf8"));
const input = { fanyang: "opened", yu: "present", han: "cooperating" };
const together = ["keep-reserve", "open-reception", "escort-households", "divide-records", "stay-together"];

test("every authored choice, conditional passage and ending is reachable without a narrative dead end", () => {
  const result = auditDraft(draft);
  assert.equal(result.inputContexts, 27);
  assert.equal(result.choices, 17);
  assert.equal(result.routes, 9072);
  assert.deepEqual(result.endings, { together: 1296, remnant: 3888, dispersed: 3888 });
});

test("reading is deterministic and does not mutate draft, inputs or choices", () => {
  const before = JSON.stringify({ draft, input, together });
  assert.deepEqual(readRoute(draft, input, together), readRoute(draft, input, together));
  assert.equal(JSON.stringify({ draft, input, together }), before);
});

test("council promises return only in their intended scenes and never invent another prior choice", () => {
  for (const authority of ["take-crown", "recognize-allies", "defer-title"]) {
  for (const provisions of ["army-rations", "joint-ledger", "buy-convoys"]) {
    for (const dispatch of ["one-command", "many-banners", "hold-chen"]) {
      const prior = [authority, provisions, dispatch];
      const before = JSON.stringify(prior);
      const result = readRoute(draft, input, together, prior);
      for (const callback of draft.councilCallbacks) {
        for (const beat of result.transcript) {
          const included = beat.lines.some(line => line.text === callback.lines[0].text);
          assert.equal(included, callback.sceneId === beat.sceneId && prior.includes(callback.afterChoice));
        }
      }
      assert.equal(JSON.stringify(prior), before);
    }
  }
  }
  assert.throws(() => readRoute(draft, input, together, ["made-up-order"]));
  assert.throws(() => readRoute(draft, input, together, ["hold-chen", "one-command"]));
  assert.throws(() => readRoute(draft, input, together, ["joint-ledger", "joint-ledger"]));
  const withoutPrior = readRoute(draft, input, together);
  assert.ok(withoutPrior.transcript.every(beat => beat.lines.every(line => !draft.councilCallbacks.some(callback => callback.lines[0].text === line.text))));
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

test("unestablished whereabouts neither conjure speakers nor assert their departure", () => {
  const result = readRoute(draft, { fanyang: "withdrawn", yu: "unestablished", han: "unestablished" }, together);
  const lines = result.transcript.flatMap(beat => [...beat.lines, ...beat.reaction]);
  assert.ok(lines.every(line => !["yu-mu", "qin-courier"].includes(line.speaker)));
  assert.ok(lines.some(line => line.text.includes("没有韩驿使的新回信")));
  assert.ok(lines.some(line => line.text.includes("不是全部同行者的点名")));
  assert.ok(lines.every(line => !line.text.includes("离队的家户没有回来")));
});

test("invalid, unavailable, incomplete and overlong reading routes are rejected", () => {
  assert.throws(() => readRoute(draft, { ...input, han: "unknown" }, together));
  assert.throws(() => readRoute(draft, { fanyang: "opened" }, together));
  assert.throws(() => readRoute(draft, input, ["invented-order"]));
  assert.throws(() => readRoute(draft, input, together.slice(0, 4)));
  assert.throws(() => readRoute(draft, input, [...together, "stay-together"]));
  assert.throws(() => readRoute(draft, input, ["keep-reserve", "open-reception", "split-routes", "divide-records", "stay-together"]));
});

test("the wounded soldier's reunion needs reception and escort, not a restored identity register", () => {
  for (const reception of ["open-reception", "verify-with-partners", "borrow-local-grain", "gather-own"]) {
    for (const evacuation of ["escort-households", "hold-formation", "split-routes"]) {
      for (const records of ["divide-records", "carry-records", "strip-identities"]) {
        const result = readRoute(draft, { fanyang: "opened", yu: "unestablished", han: "unestablished" },
          ["keep-reserve", reception, evacuation, records, "release-groups"]);
        const dawn = result.transcript.at(-1).lines;
        const reunion = dawn.some(line => line.speaker === "wounded-soldier" && line.text.startsWith("阿衡。"));
        assert.equal(reunion, reception === "open-reception" && evacuation === "escort-households");
        if (reunion) {
          assert.ok(dawn.some(line => line.text.includes("亲眼见到了人")));
          assert.ok(dawn.some(line => line.text.includes("其他失散者仍没有消息")));
        }
        if (records === "strip-identities") assert.ok(dawn.some(line => line.text.includes("没有补写那些被去掉的名字")));
      }
    }
  }
});

test("authoring validation rejects unknown facts, future knowledge, bad destinations and publication promotion", () => {
  for (const mutate of [
    value => { value.scenes[0].variants[0].when.fanyang = "invented"; },
    value => { value.scenes[0].variants[0].when.records = "carry-records"; },
    value => { value.scenes[1].choices[0].next = "reserves"; },
    value => { value.scenes[0].choices[0].next = "missing"; },
    value => { value.scenes[0].choices[0].ending = "together"; },
    value => { value.scenes[0].sourceIds = ["missing-source"]; },
    value => { value.publicationApproved = true; },
    value => { value.councilCallbacks[0].afterChoice = "invented"; },
    value => { value.councilCallbacks[0].sceneId = "missing"; },
    value => { value.councilCallbacks.push(structuredClone(value.councilCallbacks[0])); },
    value => { value.viewpoint.text = ""; }
  ]) {
    const copy = structuredClone(draft);
    mutate(copy);
    assert.throws(() => validateDraft(copy));
  }
});
