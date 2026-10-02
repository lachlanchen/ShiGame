import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createJinyang, commitJinyang, exportJinyangSave, restoreJinyang, type JinyangDefinition, type JinyangCommandId } from "../packages/game-core/src/jinyang-encounter";
const d = JSON.parse(await readFile(resolve("content/encounters/jinyang.v1.json"), "utf8")) as JinyangDefinition;
const routes: [string, JinyangCommandId[]][] = [
  ["quiet-coordination", ["brace","diversion","quiet-han","quiet-wei","relay","aligned-date","execute"]],
  ["compressed-coordination", ["diversion","escort-han","escort-wei","relay","aligned-date","execute"]],
  ["prepared-withdrawal", ["escape","quiet-han","withdraw"]],
  ["early-unready-wei", ["diversion","quiet-han","quiet-wei","relay","early-date","execute"]],
  ["corrected-date", ["brace","diversion","quiet-han","quiet-wei","relay","early-date","aligned-date","execute"]],
  ["expired-position", ["diversion","quiet-han","quiet-wei","relay","early-date","aligned-date","wait"]],
  ["failed-operation-with-exit", ["brace","diversion","escape","quiet-han","quiet-wei","relay","early-date","execute"]],
];
const fixture = {
  revision: 1, definitionFingerprint: createJinyang(d).definitionFingerprint,
  scope: "Development rule/replay parity, not runtime, duration, animation or human acceptance",
  routes: routes.map(([id, commands]) => {
    let state = createJinyang(d);
    const checkpoints = [structuredClone(state)];
    for (const command of commands) {
      state = commitJinyang(d, state, command);
      const restored = restoreJinyang(d, exportJinyangSave(state));
      if (JSON.stringify(restored) !== JSON.stringify(state)) throw Error("Replay changed state: " + id);
      checkpoints.push(structuredClone(state));
    }
    return { id, commands, checkpoints };
  }),
};
if (process.argv.includes("--print")) process.stdout.write(JSON.stringify(fixture));
else {
  const saved = JSON.parse(await readFile(resolve("content/conformance/jinyang-replays.v1.json"), "utf8"));
  if (JSON.stringify(saved) !== JSON.stringify(fixture)) throw Error("Jinyang conformance fixture drift");
  console.log("Jinyang replay fixture: " + fixture.routes.length + " routes, "
    + fixture.routes.reduce((n, r) => n + r.checkpoints.length, 0) + " complete-state checkpoints.");
}
