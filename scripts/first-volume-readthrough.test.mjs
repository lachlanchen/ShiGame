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
  for (const args of [["--ending", "victory"], ["--ending"], ["--ending", "scattered", "--check"], ["--unknown"], ["--reception"], ["--reception", "invented"], ["--reception", "open-reception", "--check"], ["--ending", "together", "--ending", "remnant"]]) {
    const result = spawnSync(process.execPath, [...command, ...args], { cwd: root, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.ok(!result.stdout.includes("# 势"), "Invalid requests must not emit a misleading reading copy");
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
