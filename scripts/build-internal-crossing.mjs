// Build a private, production-compiled crossing candidate without touching dist.
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";

const root = resolve(import.meta.dirname, "..");
if (process.argv.length !== 2) throw new Error("Usage: node scripts/build-internal-crossing.mjs");
const privateFlags = ["VITE_SHI_NATIVE", "VITE_SHI_PRIVATE_SCORE_AUDITION", "VITE_SHI_PRIVATE_COUNCIL_FILM", "VITE_SHI_PRIVATE_RAIN_SCENE"];
if (privateFlags.some(key => process.env[key] === "1")) throw new Error("Unset native/private media flags before building this web candidate.");
await mkdir(resolve(root, ".runtime"), { recursive: true });
const output = await mkdtemp(resolve(root, ".runtime/internal-crossing-"));
const dist = resolve(output, "dist");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const run = (command, args, env = {}) => {
  const result = spawnSync(command, args, { cwd: root, env: { ...process.env, ...env }, stdio: "inherit" });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message ?? result.status}; retained ${output}`);
};
const files = async directory => {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === "generated" || entry.name === "__pycache__") continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await files(path));
    else if (entry.isFile()) paths.push(path);
    else throw new Error(`Unexpected source/output link: ${path}`);
  }
  return paths.sort();
};
const sourcePaths = [
  ...await files(resolve(root, "apps/web/src")), ...await files(resolve(root, "packages/game-core/src")),
  ...await files(resolve(root, "content")),
  ...["apps/web/vite.config.ts", "apps/web/index.html", "package.json", "package-lock.json", "scripts/build-internal-crossing.mjs", "scripts/validate-web-build.mjs", "scripts/sync-unity-content.mjs"].map(path => resolve(root, path)),
];
const sources = async () => Promise.all(sourcePaths.map(async path => ({ file: relative(root, path), sha256: sha(await readFile(path)) })));
const before = await sources();
run("npm", ["run", "validate"]);
run("npm", ["--workspace", "@shi/web", "run", "build", "--", "--mode", "internal-crossing"], { SHI_INTERNAL_CROSSING_OUT: dist });
run(process.execPath, ["scripts/validate-web-build.mjs", "--internal-crossing", dist]);
if (JSON.stringify(before) !== JSON.stringify(await sources())) throw new Error("Source changed during the candidate build; do not admit this output.");
const artifacts = await Promise.all((await files(dist)).map(async path => ({ file: relative(dist, path), sha256: sha(await readFile(path)) })));
const receipt = {
  status: "built-not-playtest-qualified", channel: "internal-crossing-v2", gitHead: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
  sourceTreeSHA256: sha(JSON.stringify(before)), sources: before, artifacts, artifactTreeSHA256: sha(JSON.stringify(artifacts)),
  createdAt: new Date().toISOString(), saveNamespace: "shi.internal.crossing-campaign.v2", dist: "dist",
  boundary: "Private web candidate only; no upload, native parity, human review or cinematic media admission.",
};
await writeFile(resolve(output, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
console.log(`SHI_INTERNAL_CROSSING ${JSON.stringify({ output, sourceTreeSHA256: receipt.sourceTreeSHA256, artifactTreeSHA256: receipt.artifactTreeSHA256 })}`);
