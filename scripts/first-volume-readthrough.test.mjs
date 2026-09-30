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
  for (const args of [["--ending", "victory"], ["--ending"], ["--ending", "scattered", "--check"], ["--unknown"]]) {
    const result = spawnSync(process.execPath, [...command, ...args], { cwd: root, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.ok(!result.stdout.includes("# 势"), "Invalid requests must not emit a misleading reading copy");
  }
});
