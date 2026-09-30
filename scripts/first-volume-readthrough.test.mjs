import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const command = [resolve(root, "node_modules/vite-node/vite-node.mjs"), "scripts/first-volume-readthrough.ts"];
const run = (...args) => execFileSync(process.execPath, [...command, ...args], { cwd: root, encoding: "utf8" });

test("all four complete readings replay real campaign rules with matching closing prose", () => {
  for (const [ending, title] of Object.entries({ together: "仍可同行", remnant: "余部上路", dispersed: "各自的归路", scattered: "队伍散去" })) {
    const text = run("--ending", ending);
    assert.ok(text.includes("## 道路已成河"));
    assert.ok(text.includes("## 陈地议事"));
    assert.ok(text.includes("## 范阳：谁来保他不死"));
    assert.ok(text.includes(`## ${title}\n`));
    assert.ok(text.includes("## 历史参照"));
    assert.equal(text, run("--ending", ending), "Readthrough must be deterministic");
    if (ending === "scattered") {
      assert.ok(text.includes("物资归属：unresolved"));
      assert.ok(text.includes("账还没核完，路边已经有人背起行李"));
      assert.ok(!text.includes("愿结伴的结伴。先把能分的分清"), "Do not keep the orderly response in a scattered ending");
      assert.ok(!text.includes("## 各自的归路\n"));
    }
  }
});

test("default reading stays byte-identical and unsupported requests fail", () => {
  assert.match(run("--check"), /comparison passed/);
  for (const args of [["--ending", "victory"], ["--ending"], ["--ending", "scattered", "--check"], ["--unknown"], ["--reception"], ["--reception", "invented"], ["--reception", "open-reception", "--check"], ["--ending", "together", "--ending", "remnant"], ["--courier", "--check"], ["--courier", "--courier"]]) {
    const result = spawnSync(process.execPath, [...command, ...args], { cwd: root, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.ok(!result.stdout.includes("# 势"), "Invalid requests must not emit a misleading reading copy");
  }
});

test("courier reading earns the later letter through recruitment and road verification", () => {
  const text = run("--courier", "--ending", "remnant");
  assert.equal(text, run("--courier", "--ending", "remnant"));
  assert.ok(text.includes("verify-road → open-reception → escort-households"));
  assert.ok(text.includes("韩驿使来信："));
  assert.ok(text.includes("日后一查，找的是我"), "Recruitment must establish Han's personal exposure");
  assert.ok(text.indexOf("往后带回信来，还找不找得到人") < text.indexOf("韩驿使来信："), "Later correspondence answers an earlier request for continued contact");
  assert.ok(text.includes("韩驿使没有跟着来"));
  assert.ok(text.includes("没有带走一位本来就不在这里的驿使"));
  assert.ok(text.includes("实际结果：remnant"));
  assert.ok(!text.includes("领头的人肩上搭着一条旧布"), "Road verification does not invent Yu's reserve-dependent arrival");
  assert.ok(!run("--ending", "remnant").includes("韩驿使来信："), "Unrecruited default history must not receive his letter");
});

test("beacon reading carries pursuit into record custody without borrowing another opening", () => {
  const text = run("--beacon", "--ending", "remnant");
  assert.equal(text, run("--beacon", "--ending", "remnant"));
  assert.ok(text.includes("所选行动：夺取亭燧"));
  assert.ok(text.includes("所选行动：熄燧潜行"));
  assert.ok(text.includes("没有鼓声与灯火，后队两次走失"));
  assert.ok(text.includes("夺亭燧那回，我以为截住信号就能抢出时间"));
  assert.ok(text.includes("keep-reserve → open-reception → hold-formation → divide-records → move-with-remnant"));
  assert.ok(text.includes("实际结果：remnant"));
  for (const absent of ["韩驿使来信：", "想起雨棚里逐个念出名字的声音", "我怕你回来没得领"]) assert.ok(!text.includes(absent));
  for (const args of [["--beacon", "--courier"], ["--beacon", "--beacon"], ["--beacon", "--check"]]) {
    const result = spawnSync(process.execPath, [...command, ...args], { cwd: root, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.ok(!result.stdout.includes("# 势"));
  }
});

test("all Fan Yang outcomes survive into complete retreat readings without conflation", () => {
  const reports = {
    opened: "范阳受降了。这封信只说到交接，没说给我们送粮",
    withdrawn: "没开城。使者平安回去了，我们的人也撤了",
    deferred: "补过条件，还是没成。花掉的粮已经记在这封信后面",
  };
  for (const [outcome, report] of Object.entries(reports)) {
    const text = run("--fanyang", outcome, "--ending", "remnant");
    assert.equal(text, run("--fanyang", outcome, "--ending", "remnant"));
    assert.ok(text.includes(`实际结果：${outcome}`));
    assert.ok(text.includes("实际结果：remnant"));
    assert.ok(text.includes(report));
    for (const other of Object.values(reports).filter(value => value !== report)) assert.ok(!text.includes(other));
    if (outcome === "opened") assert.ok(text.includes("public-safety → guarded-escort → accept-transfer"));
    if (outcome === "deferred") {
      assert.ok(text.includes("public-safety → guarded-escort → amend-guarantee"));
      assert.ok(text.includes("那份账我不抹"));
    }
  }
  for (const args of [["--fanyang"], ["--fanyang", "victory"], ["--fanyang", "opened", "--fanyang", "deferred"], ["--fanyang", "withdrawn", "--check"]]) {
    const result = spawnSync(process.execPath, [...command, ...args], { cwd: root, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.ok(!result.stdout.includes("# 势"));
  }
});

test("complete readings expose reception-dependent character arcs without borrowing other branches", () => {
  for (const [reception, ending] of [["gather-own", "together"], ["open-reception", "scattered"], ["verify-with-partners", "remnant"], ["borrow-local-grain", "together"]]) {
    const text = run("--reception", reception, "--ending", ending);
    assert.equal(text, run("--reception", reception, "--ending", ending));
    assert.ok(text.includes(`→ ${reception} → escort-households →`));
    assert.ok(text.includes(`实际结果：${ending}`));
    assert.equal(text.includes("我怕你回来没得领，就一直带着"), reception === "open-reception");
    assert.equal(text.includes("没有阿衡的消息"), reception === "verify-with-partners");
    assert.equal(text.includes("粮数对上了，找人的事还没对上"), reception === "borrow-local-grain");
    if (reception === "open-reception") {
      assert.ok(text.indexOf("把两份都推回他面前") < text.indexOf("我怕你回来没得领"));
    }
  }
});

test("unreachable requested reception/endings fail without emitting a fabricated reading", () => {
  for (const [reception, ending] of [["open-reception", "together"], ["verify-with-partners", "together"], ["borrow-local-grain", "scattered"]]) {
    const result = spawnSync(process.execPath, [...command, "--reception", reception, "--ending", ending], { cwd: root, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes("No legal route"));
    assert.ok(!result.stdout.includes("# 势"));
  }
});
