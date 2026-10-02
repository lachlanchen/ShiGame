import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { restoreJinyang, type JinyangDefinition } from "../packages/game-core/src/jinyang-encounter";

const index = process.argv.indexOf("--save");
if (index < 0 || !process.argv[index + 1]) throw Error("Usage: vite-node scripts/inspect-jinyang-save.ts --save PATH");
const save=await readFile(resolve(process.argv[index + 1]!),"utf8");
const revision=JSON.parse(save).revision;
if (revision!==1 && revision!==2) throw Error("Unsupported Jinyang save version");
const definition = JSON.parse(await readFile(resolve(`content/encounters/jinyang.v${revision}.json`), "utf8")) as JinyangDefinition;
const state = restoreJinyang(definition, save);
console.log(JSON.stringify({ revision, history: state.history, tick: state.tick, operation: state.operation ?? null,
  outcome: state.result?.outcome ?? null, estate: state.estate }, null, 2));
