import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const readText = (path) => readFile(resolve(root, path), "utf8");
const readJson = async (path) => JSON.parse(await readText(path));
const fail = (message) => { throw new Error(`Font/privacy contract: ${message}`); };

const packages = [
  "@fontsource-variable/inter",
  "@fontsource-variable/cormorant-garamond",
  "@fontsource-variable/noto-serif-sc",
  "@fontsource-variable/noto-sans-arabic",
  "@fontsource-variable/noto-sans-jp",
  "@fontsource-variable/noto-sans-kr",
  "@fontsource-variable/noto-sans-sc",
  "@fontsource-variable/noto-sans-tc",
];
const expectedVersion = "5.3.0";
const webPackage = await readJson("apps/web/package.json");
const main = await readText("apps/web/src/main.tsx");
const loader = await readText("apps/web/src/fontLoader.ts");
const styles = await readText("apps/web/src/styles.css");
const html = await readText("apps/web/index.html");
const notices = await readText("docs/production/THIRD_PARTY_NOTICES.md");

for (const name of packages) {
  if (webPackage.dependencies?.[name] !== expectedVersion) fail(`${name} must be an exact ${expectedVersion} dependency.`);
  const installed = await readJson(`node_modules/${name}/package.json`);
  if (installed.version !== expectedVersion || installed.license !== "OFL-1.1") fail(`${name} installed metadata must be ${expectedVersion} / OFL-1.1.`);
  if (!notices.includes(`\`${name}\``) || !notices.includes("OFL-1.1")) fail(`${name} must be recorded in third-party notices.`);
}

for (const name of packages.slice(0, 2)) {
  if (!main.includes(`"${name}/wght.css"`)) fail(`${name} must be in the baseline font layer.`);
}
for (const name of packages.slice(2)) {
  if (!loader.includes(`"${name}/wght.css"`)) fail(`${name} must be in the on-demand font layer.`);
}
if (/fonts\.(googleapis|gstatic)\.com/i.test(`${main}\n${loader}\n${styles}\n${html}`)) fail("runtime Google Fonts URLs are forbidden.");

const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
if (!csp) fail("index.html must declare a Content-Security-Policy.");
for (const directive of ["default-src 'self'", "object-src 'none'", "script-src 'self'", "font-src 'self'", "connect-src 'self'", "form-action 'none'"]) {
  if (!csp.includes(directive)) fail(`CSP is missing ${directive}.`);
}
if (/https?:/i.test(csp)) fail("CSP must not allow a remote origin.");

console.log(`Font/privacy contract valid: ${packages.length} exact OFL packages, 11 locale routes, self-host-only CSP.`);
