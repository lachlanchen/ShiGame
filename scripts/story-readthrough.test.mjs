import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { auditDraft, readRoute, validateDraft } from "./story-readthrough.mjs";

const draft = JSON.parse(await readFile(new URL("../content/story-drafts/chen-retreat.v1.json", import.meta.url), "utf8"));
const input = { fanyang: "opened", yu: "present", han: "cooperating" };
const together = ["keep-reserve", "open-reception", "escort-households", "divide-records", "stay-together"];

test("prose compatibility metadata refuses changed rules, malformed fingerprints and missing review", () => {
  for (const change of [
    item => { item.rulesSHA256 = "0".repeat(64); },
    item => { item.previousStorySHA256 = ["anything"]; },
    item => { item.previousStorySHA256.push(item.previousStorySHA256[0]); },
    item => { item.review = ""; }
  ]) {
    const copy = structuredClone(draft); change(copy.saveCompatibility);
    assert.throws(() => validateDraft(copy));
  }
});

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

test("the dispatched escort remains an unanswered responsibility at the finale, only when sent", () => {
  const callback = draft.scenes.find(scene => scene.id === "dawn").variants.find(variant => variant.when.reserves === "send-support");
  assert.ok(callback);
  for (const reserves of ["keep-reserve", "send-support", "verify-road", "decline-dispatch"]) {
    for (const records of ["divide-records", "carry-records", "strip-identities"]) {
      const result = readRoute(draft, input, [reserves, "gather-own", "hold-formation", records, "move-with-remnant"]);
      for (const beat of result.transcript) for (const line of callback.lines) {
        assert.equal(beat.lines.some(actual => actual.text === line.text), reserves === "send-support" && beat.sceneId === "dawn");
      }
      assert.equal(result.endingId, "remnant");
      assert.equal(result.facts.records, records);
    }
  }
});

test("death reports leave a human pause before duties and the final decision resume", () => {
  for (const reception of ["open-reception", "verify-with-partners", "borrow-local-grain", "gather-own"]) {
    const result = readRoute(draft, input, ["keep-reserve", reception, "escort-households", "carry-records", "stay-together"]);
    const badNews = result.transcript.find(beat => beat.sceneId === "bad-news");
    const report = badNews.reaction.findIndex(line => line.text.includes("吴广已遭杀害"));
    const pause = badNews.reaction.findIndex(line => line.text.includes("话停在半截"));
    const question = badNews.reaction.findIndex(line => line.text === "这上面的安排，还算么？");
    assert.ok(report >= 0 && pause === report + 1 && question > pause);
    const dawn = result.transcript.find(beat => beat.sceneId === "dawn");
    assert.ok(dawn.lines[0].text.includes("陈胜败亡"));
    assert.ok(dawn.lines[1].text.includes("被风掀起的简"));
    assert.equal(dawn.lines.at(-1).text, "还按原来的队么？");
    assert.equal(result.endingId, "together");
  }
});

test("western defeat arrives as staged external news before the soldier's personal account", () => {
  for (const dispatch of ["keep-reserve", "send-support", "verify-road", "decline-dispatch"]) {
    const result = readRoute(draft, input, [dispatch, "open-reception", "escort-households", "carry-records", "release-groups"]);
    const scene = result.transcript.find(beat => beat.sceneId === "bad-news");
    const report = scene.lines[0];
    assert.equal(report.speaker, "narrator", "The soldier is not an omniscient witness to the western campaign");
    assert.ok(report.text.includes("隔些时日"));
    assert.ok(report.text.indexOf("曹阳") < report.text.indexOf("渑池"));
    assert.ok(report.text.indexOf("渑池") < report.text.indexOf("败亡"));
    assert.ok(scene.lines[1].text.includes("伤卒把两份领取凭记"));
    assert.ok(!scene.lines.some(line => line.text.includes("吴广已遭杀害")), "The later death report must remain a separate arrival");
    assert.ok(scene.reaction.some(line => line.text.includes("又过了一段时日")));
    assert.ok(draft.scenes.find(item => item.id === "bad-news").sourceIds.includes("broken-command"));
  }
});

test("all nine opening/crossing pairs return only their own memories in the intended scenes", () => {
  assert.equal(draft.chapterCallbacks.length, 11);
  for (const opening of ["read-the-names", "take-the-beacon", "hide-the-register"]) {
    for (const crossing of ["families-first", "repair-the-ford", "cut-the-carts"]) {
      const prior = [opening, crossing];
      const before = JSON.stringify(prior);
      const result = readRoute(draft, input, together, [], prior);
      for (const callback of draft.chapterCallbacks) {
        for (const beat of result.transcript) {
          for (const line of callback.lines) {
            assert.equal(beat.lines.some(actual => actual.text === line.text),
              callback.sceneId === beat.sceneId && prior.includes(callback.afterChoice));
          }
        }
      }
      assert.equal(JSON.stringify(prior), before);
      assert.equal(result.endingId, "together");
    }
  }
  const unknown = readRoute(draft, input, together);
  for (const callback of draft.chapterCallbacks) {
    assert.ok(unknown.transcript.every(beat => callback.lines.every(line => !beat.lines.some(actual => actual.text === line.text))));
  }
});

test("the original grain bargain returns at records without changing the selected custody or ending", () => {
  for (const bargain of ["issue-grain-tallies", "voluntary-pots"]) {
    for (const records of ["divide-records", "carry-records", "strip-identities"]) {
      for (const end of ["stay-together", "move-with-remnant", "release-groups"]) {
        const choices = ["keep-reserve", "gather-own", "escort-households", records, end];
        const baseline = readRoute(draft, input, choices);
        const result = readRoute(draft, input, choices, [], ["read-the-names", bargain]);
        for (const callback of draft.chapterCallbacks.filter(item => ["issue-grain-tallies", "voluntary-pots"].includes(item.afterChoice))) {
          for (const beat of result.transcript) {
            for (const line of callback.lines) assert.equal(beat.lines.some(actual => actual.text === line.text),
              beat.sceneId === "records" && callback.afterChoice === bargain);
          }
        }
        assert.deepEqual(result.ending, baseline.ending);
        assert.deepEqual(result.transcript.map(beat => beat.reaction), baseline.transcript.map(beat => beat.reaction));
      }
    }
  }
});

test("chapter memories reject foreign choices, duplicate callbacks and conflicting prior orders", () => {
  const foreign = structuredClone(draft);
  foreign.chapterCallbacks[0].afterChoice = "hold-chen";
  assert.throws(() => validateDraft(foreign), /Unknown prior chapter choice/);
  const duplicate = structuredClone(draft);
  duplicate.chapterCallbacks.push(duplicate.chapterCallbacks[0]);
  assert.throws(() => validateDraft(duplicate), /Duplicate chapter callback/);
  const wrongScene = structuredClone(draft);
  wrongScene.chapterCallbacks[0].sceneId = "unwritten-scene";
  assert.throws(() => validateDraft(wrongScene), /Unknown chapter callback scene/);
  assert.throws(() => readRoute(draft, input, together, [], ["families-first", "cut-the-carts"]), /Conflicting prior chapter choices/);
});

test("opening strategy returns before the final question without choosing the ending for the player", () => {
  const strategies = ["root-in-villages", "race-for-chen", "send-two-envoys"];
  const memories = draft.chapterCallbacks.filter(callback => strategies.includes(callback.afterChoice));
  assert.equal(memories.length, 3);
  for (const strategy of strategies) for (const records of ["carry-records", "divide-records", "strip-identities"]) {
    for (const ending of ["stay-together", "move-with-remnant", "release-groups"]) {
      const choices = ["keep-reserve", "gather-own", "escort-households", records, ending];
      const baseline = readRoute(draft, input, choices);
      const result = readRoute(draft, input, choices, [], [strategy]);
      const dawn = result.transcript.at(-1);
      assert.equal(dawn.sceneId, "dawn");
      assert.equal(dawn.lines.at(-1).text, "还按原来的队么？");
      for (const callback of memories) for (const line of callback.lines) {
        assert.equal(dawn.lines.some(actual => actual.text === line.text), callback.afterChoice === strategy);
        assert.ok(result.transcript.slice(0, -1).every(beat => !beat.lines.some(actual => actual.text === line.text)));
      }
      assert.deepEqual(result.ending, baseline.ending);
      assert.deepEqual(result.transcript.map(beat => beat.reaction), baseline.transcript.map(beat => beat.reaction));
    }
  }
});

test("resource-triggered scattering has validated original prose without pretending the authoring graph predicts it", () => {
  assert.ok(draft.scatteredEnding.response.length >= 2);
  assert.deepEqual(draft.scatteredEnding.variants.filter(variant => variant.when.records).map(variant => variant.when.records).sort(), ["carry-records", "divide-records", "strip-identities"]);
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

test("orderly dispersal relinquishes command without borrowing the chaotic ending", () => {
  for (const records of ["divide-records", "carry-records", "strip-identities"]) {
    for (const evacuation of ["escort-households", "hold-formation", "split-routes"]) {
      const result = readRoute(draft, input, ["keep-reserve", "gather-own", evacuation, records, "release-groups"]);
      const text = result.ending.lines.map(line => line.text).join("\n");
      assert.ok(text.includes("还站着等你发话"));
      assert.ok(text.includes("没有再问他们何时归队"));
      assert.ok(text.indexOf("去处和同行的人，都说好了") < text.indexOf("你侧身让开"));
    }
  }
  for (const other of [draft.endings.together, draft.endings.remnant, draft.scatteredEnding]) {
    assert.ok(other.lines.every(line => !line.text.includes("没有再问他们何时归队")));
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

test("borrowed grain has a distinct unpaid obligation in each ending without leaking to other receptions", () => {
  const endings = { "stay-together": "together", "move-with-remnant": "remnant", "release-groups": "dispersed" };
  for (const [choice, outcome] of Object.entries(endings)) {
    const callback = draft.endings[outcome].variants.filter(variant => variant.when["bad-news"] === "borrow-local-grain");
    assert.equal(callback.length, 1);
    for (const reception of ["borrow-local-grain", "gather-own", "open-reception", "verify-with-partners"]) {
      for (const custody of ["carry-records", "divide-records", "strip-identities"]) {
        const result = readRoute(draft, input, ["keep-reserve", reception, "escort-households", custody, choice]);
        assert.equal(result.endingId, outcome);
        for (const line of callback[0].lines) assert.equal(result.ending.lines.some(actual => actual.text === line.text), reception === "borrow-local-grain");
        assert.ok(callback[0].lines.every(line => line.speaker !== "granary-holder"), "The lender stayed in Chen");
      }
    }
  }
  const scattered = draft.scatteredEnding.variants.filter(variant => variant.when["bad-news"] === "borrow-local-grain");
  assert.equal(scattered.length, 1);
  assert.ok(scattered[0].lines[0].text.includes("没有在欠数旁写下已清"));
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

test("the final decision follows arrivals and account reports instead of interrupting them", () => {
  const scene = draft.scenes.find(scene => scene.id === "dawn");
  assert.deepEqual(scene.decisionLeadIn, [{ speaker: "rear-guard", text: "还按原来的队么？" }]);
  for (const yu of draft.inputs.yu) {
    for (const reception of ["open-reception", "gather-own", "verify-with-partners", "borrow-local-grain"]) {
      for (const evacuation of ["escort-households", "hold-formation", "split-routes"]) {
        for (const records of ["divide-records", "carry-records", "strip-identities"]) {
          const result = readRoute(draft, { ...input, yu }, ["keep-reserve", reception, evacuation, records, "release-groups"]);
          const dawn = result.transcript.find(beat => beat.sceneId === "dawn");
          assert.deepEqual(dawn.lines.at(-1), scene.decisionLeadIn[0]);
          assert.equal(dawn.lines.filter(line => line.text === scene.decisionLeadIn[0].text).length, 1);
          const custody = scene.variants.find(variant => variant.when.records === records).lines;
          assert.ok(custody.every(line => dawn.lines.findIndex(actual => actual.text === line.text) < dawn.lines.length - 1));
          assert.equal([...dawn.reaction, ...result.ending.lines].filter(line => line.text.includes("没有再喊集合")).length, 1);
        }
      }
    }
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
        const searchPayoffs = draft.scenes.find(scene => scene.id === "dawn").variants.filter(variant =>
          variant.when["bad-news"] === reception && (!variant.when.evacuation || variant.when.evacuation === evacuation));
        assert.equal(searchPayoffs.length, 1, "Every reception/evacuation pair needs exactly one search payoff");
        for (const line of searchPayoffs[0].lines) assert.ok(dawn.some(actual => actual.text === line.text));
        const reunion = dawn.some(line => line.speaker === "wounded-soldier" && line.text.startsWith("阿衡。"));
        assert.equal(reunion, reception === "open-reception" && evacuation === "escort-households");
        const recognition = dawn.findIndex(line => line.text === "我怕你回来没得领，就一直带着。");
        assert.equal(recognition >= 0, reunion, "Personal reunion must not leak into unresolved searches");
        if (reunion) {
          const receptionBeat = result.transcript.find(beat => beat.sceneId === "bad-news");
          const tokenHandoff = receptionBeat.reaction.find(line => line.text.includes("把两份都推回他面前"));
          assert.ok(tokenHandoff?.text.includes("他收好了"), "The soldier must retain both original tokens before returning Aheng's at reunion");
          assert.ok(!receptionBeat.reaction.some(line => line.text.includes("留下同伴的凭记")), "Do not strand the reunion token at the grain station");
          assert.ok(dawn[recognition - 1].text.includes("两份凭记慢慢分开"));
          assert.ok(dawn[recognition + 1].text.includes("等他松了手"));
          assert.ok(dawn.some(line => line.text.includes("尚未凭它再领一份粮")), "Returning a token does not distribute grain twice");
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
