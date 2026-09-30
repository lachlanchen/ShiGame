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
  assert.equal(result.witnessedEvents, 2);
  assert.deepEqual(result.endings, { together: 1296, remnant: 3888, dispersed: 3888 });
});

test("reading is deterministic and does not mutate draft, inputs or choices", () => {
  const before = JSON.stringify({ draft, input, together });
  assert.deepEqual(readRoute(draft, input, together), readRoute(draft, input, together));
  assert.equal(JSON.stringify({ draft, input, together }), before);
});

test("resource-triggered scattering has validated original prose without pretending the authoring graph predicts it", () => {
  assert.ok(draft.scatteredEnding.response.length >= 2);
  assert.deepEqual(draft.scatteredEnding.variants.map(variant => variant.when.records).sort(), ["carry-records", "divide-records", "strip-identities"]);
  assert.ok(!Object.hasOwn(draft.endings, "scattered"));
  const broken = structuredClone(draft);
  broken.scatteredEnding.variants[0].when.records = "restored-every-name";
  assert.throws(() => validateDraft(broken), /Unknown fact/);
  const empty = structuredClone(draft);
  empty.scatteredEnding.response = [];
  assert.throws(() => validateDraft(empty), /Missing authored lines/);
});

test("each evacuation order has its own physical withdrawal before sorting records", () => {
  const evacuationScene = draft.scenes.find(scene => scene.id === "evacuation");
  for (const choice of evacuationScene.choices) {
    const result = readRoute(draft, input, ["keep-reserve", "gather-own", choice.id, "carry-records", "release-groups"]);
    const retreat = result.transcript.find(beat => beat.sceneId === "evacuation");
    assert.deepEqual(retreat.reaction, choice.response);
    assert.equal(result.transcript[result.transcript.indexOf(retreat) + 1].sceneId, "records");
    assert.ok(retreat.reaction.length >= 6);
    for (const other of evacuationScene.choices.filter(candidate => candidate.id !== choice.id)) {
      assert.ok(other.response.slice(3).every(line => !retreat.reaction.some(actual => actual.text === line.text)));
    }
  }
});

test("all nine ending memories preserve the chosen record custody without inventing carts or handoffs", () => {
  for (const records of ["divide-records", "carry-records", "strip-identities"]) {
    for (const end of ["stay-together", "move-with-remnant", "release-groups"]) {
      const result = readRoute(draft, input, ["keep-reserve", "gather-own", "escort-households", records, end]);
      const authored = draft.endings[result.endingId];
      const applicable = authored.variants.filter(variant => variant.when.records === records);
      assert.equal(applicable.length, 1);
      assert.deepEqual(result.ending.lines, [...authored.lines, ...applicable[0].lines]);
      for (const other of authored.variants.filter(variant => variant.when.records !== records)) {
        assert.ok(other.lines.every(line => !result.ending.lines.some(actual => actual.text === line.text)));
      }
    }
  }
  const onFoot = readRoute(draft, input, ["keep-reserve", "gather-own", "hold-formation", "carry-records", "move-with-remnant"]);
  assert.ok(onFoot.ending.lines.every(line => !line.text.includes("车")));
  const invalid = structuredClone(draft);
  invalid.endings.remnant.variants[0].when.records = "invented-records";
  assert.throws(() => validateDraft(invalid), /Unknown fact/);
});

test("the opening finishes the northern report before council reminders and ends on the actionable question", () => {
  for (const fanyang of draft.inputs.fanyang) {
    const result = readRoute(draft, { ...input, fanyang }, together, ["take-crown", "joint-ledger", "hold-chen"]);
    const opening = result.transcript[0].lines;
    const report = draft.scenes[0].variants.find(variant => variant.when.fanyang === fanyang).lines[0].text;
    const reminder = draft.councilCallbacks.find(callback => callback.afterChoice === "take-crown").lines[0].text;
    assert.ok(opening.findIndex(line => line.text === report) < opening.findIndex(line => line.text === reminder));
    assert.equal(opening.at(-1).speaker, "supply-officer");
    assert.equal(opening.at(-1).text, "西边催得急。你留在这里的人，今天能不能一起走？");
    assert.equal(opening.filter(line => line.text === opening.at(-1).text).length, 1);
  }
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

test("unestablished whereabouts require a new witnessed event before a recurring companion speaks", () => {
  const result = readRoute(draft, { fanyang: "withdrawn", yu: "unestablished", han: "unestablished" }, together);
  const lines = result.transcript.flatMap(beat => [...beat.lines, ...beat.reaction]);
  assert.ok(result.transcript.slice(0, 4).flatMap(beat => [...beat.lines, ...beat.reaction]).every(line => !["yu-mu", "qin-courier"].includes(line.speaker)));
  assert.ok(lines.every(line => line.speaker !== "qin-courier"));
  assert.deepEqual(result.witnessedEvents, ["yu-rendezvous-arrival"]);
  assert.ok(result.transcript[4].lines.some(line => line.speaker === "yu-mu"));
  assert.ok(lines.some(line => line.text.includes("没有韩驿使的新回信")));
  assert.ok(lines.some(line => line.text.includes("不是全部同行者的点名")));
  assert.ok(lines.every(line => !line.text.includes("离队的家户没有回来")));
});

test("Yu's new arrival requires a retained reserve and escort, and never overrides an authored absence", () => {
  for (const yu of ["present", "absent", "unestablished"]) {
    for (const reserves of ["keep-reserve", "send-support", "verify-road", "decline-dispatch"]) {
      for (const evacuation of ["escort-households", "hold-formation", "split-routes"]) {
        const result = readRoute(draft, { ...input, yu }, [reserves, "gather-own", evacuation, "strip-identities", "release-groups"]);
        assert.equal(result.witnessedEvents.includes("yu-rendezvous-arrival"), yu === "unestablished" && reserves === "keep-reserve" && evacuation === "escort-households");
        if (yu === "absent") assert.ok(result.transcript.flatMap(beat => beat.lines).every(line => line.speaker !== "yu-mu"));
        assert.ok(result.transcript.at(-1).lines.some(line => line.text.includes("没有补写那些被去掉的名字")));
      }
    }
  }
});

test("Yu receives a different answer for each authored orderly ending without promising future presence", () => {
  const answers = new Set();
  for (const final of ["stay-together", "move-with-remnant", "release-groups"]) {
    const result = readRoute(draft, { ...input, yu: "unestablished" }, ["keep-reserve", "gather-own", "escort-households", "carry-records", final]);
    const reaction = result.transcript.at(-1).reaction;
    assert.ok(reaction.some(line => line.speaker === "yu-mu"));
    answers.add(reaction.find(line => line.speaker === "yu-mu").text);
  }
  assert.equal(answers.size, 3);
  assert.ok(draft.witnessedEvents.find(event => event.id === "yu-rendezvous-arrival").endingResponses.scattered.some(line => line.text.includes("此后的去向仍须另问")));
});

test("Han replies only through an established channel after road verification, without appearing in person", () => {
  for (const prior of [[], ["turn-the-courier"], ["release-oldest"]]) {
    for (const reserve of ["keep-reserve", "verify-road", "send-support", "decline-dispatch"]) {
      const result = readRoute(draft, { fanyang: "opened", yu: "unestablished", han: "unestablished" },
        [reserve, "gather-own", "split-routes", "strip-identities", "release-groups"], [], prior);
      const expected = prior.includes("turn-the-courier") && reserve === "verify-road";
      assert.equal(result.witnessedEvents.includes("han-route-reply"), expected);
      assert.equal(result.transcript.some(beat => beat.lines.some(line => line.speaker === "han-letter")), expected);
      assert.ok(result.transcript.every(beat => beat.lines.every(line => line.speaker !== "qin-courier")));
      if (expected) {
        assert.ok(result.transcript[3].reaction.some(line => line.text.includes("匿名抄件已不够")));
        assert.ok(result.transcript[4].reaction.some(line => line.text.includes("别拿他的名字")));
      }
    }
  }
  assert.throws(() => readRoute(draft, input, together, [], ["invented"]));
  assert.throws(() => readRoute(draft, input, together, [], ["turn-the-courier", "release-oldest"]));
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
    value => { value.viewpoint.text = ""; },
    value => { value.witnessedEvents[0].when.dawn = "stay-together"; },
    value => { value.witnessedEvents[0].sceneId = "missing"; },
    value => { value.witnessedEvents.push(structuredClone(value.witnessedEvents[0])); }
  ]) {
    const copy = structuredClone(draft);
    mutate(copy);
    assert.throws(() => validateDraft(copy));
  }
});
