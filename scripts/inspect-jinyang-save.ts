import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { restoreJinyang, type JinyangDefinition } from "../packages/game-core/src/jinyang-encounter";

const index = process.argv.indexOf("--save");
if (index < 0 || !process.argv[index + 1]) throw Error("Usage: vite-node scripts/inspect-jinyang-save.ts --save PATH");
const definition = JSON.parse(await readFile(resolve("content/encounters/jinyang.v1.json"), "utf8")) as JinyangDefinition;
const state = restoreJinyang(definition, await readFile(resolve(process.argv[index + 1]!), "utf8"));
console.log(JSON.stringify({ history: state.history, tick: state.tick, outcome: state.result?.outcome ?? null, estate: state.estate }, null, 2));
