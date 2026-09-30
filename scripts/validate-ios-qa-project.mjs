import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Pass JSON exported from the actual generated PBX projects with plutil.
// Source-spec string checks alone cannot establish XcodeGen merge behavior.
const [qaPath, productionPath] = process.argv.slice(2);
assert(qaPath && productionPath, "Pass generated QA and production PBX JSON paths");
const drafts = ["chen-retreat.rules.v1.json", "chen-retreat.v1.json"];
for (const [path, qa] of [[qaPath, true], [productionPath, false]]) {
  const { objects } = JSON.parse(readFileSync(path, "utf8"));
  const target = Object.values(objects).find(value => value.isa === "PBXNativeTarget" && value.name === "SHI");
  assert(target, "Missing app target");
  const files = phaseType => target.buildPhases.map(id => objects[id]).filter(phase => phase.isa === phaseType)
    .flatMap(phase => phase.files.map(id => objects[objects[id].fileRef]?.path));
  const sources = files("PBXSourcesBuildPhase"), resources = files("PBXResourcesBuildPhase");
  for (const name of ["SHIApp.swift", "NativeCouncilView.swift", "NativeFanyangView.swift", "NativeRetreatView.swift", "RetreatPreviewContent.swift"])
    assert(sources.includes(name), `Missing compiled source ${name}`);
  for (const name of ["campaign.json", "chen-council.v1.json", "fanyang-guarantee.v1.json", "viewpoints.v1.json", "ui.json", "Assets.xcassets"])
    assert(resources.includes(name), `Missing inherited resource ${name}`);
  for (const name of drafts) assert.equal(resources.includes(name), qa, `Wrong draft resource boundary: ${name}`);
  const configs = objects[target.buildConfigurationList].buildConfigurations.map(id => objects[id]);
  assert(configs.length >= 2, "Inspect both Debug and Release");
  for (const config of configs) {
    const settings = config.buildSettings;
    assert.equal(settings.PRODUCT_BUNDLE_IDENTIFIER, qa ? "art.lazying.shi.aftermathqa" : "art.lazying.shi");
    assert.equal(String(settings.SWIFT_ACTIVE_COMPILATION_CONDITIONS ?? "").includes("SHI_RETREAT_PREVIEW"), qa);
    if (qa) assert.equal(settings.CODE_SIGNING_ALLOWED, "NO");
  }
  if (!qa) {
    for (const config of Object.values(objects).filter(value => value.isa === "XCBuildConfiguration")) {
      assert(!String(config.buildSettings.SWIFT_ACTIVE_COMPILATION_CONDITIONS ?? "").includes("SHI_RETREAT_PREVIEW"), "Inherited production preview flag");
    }
  }
}
console.log("Generated native projects verified: inherited sources/resources retained; retreat drafts and flag only in unsigned QA, absent from production Debug/Release.");
