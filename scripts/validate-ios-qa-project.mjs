import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Pass JSON exported from the actual generated PBX projects with plutil.
// Source-spec string checks alone cannot establish XcodeGen merge behavior.
const [qaPath, productionPath, crossingPath, upgradePath] = process.argv.slice(2);
assert(qaPath && productionPath, "Pass generated QA and production PBX JSON paths");
const drafts = ["chen-retreat.rules.v1.json", "chen-retreat.v1.json", "refuge.rules.v1.json", "refuge.v1.json", "refuge-morning.v1.json", "refuge-contact.v1.json"];
const crossingFiles = ["chapter-01-broken-crossing.v1.json", "chapter-01-crossing-campaign.rules.v2.json", "chapter-01-crossing-aftermath.v2.json", "crossing-field.v1.json", "crossing-establishing.v1.json", "broken-crossing-establishing-v1.jpg"];
const projects = [[qaPath, "retreat"], [productionPath, "production"]];
if (crossingPath) projects.push([crossingPath, "crossing"]);
if (upgradePath) projects.push([upgradePath, "upgrade"]);
for (const [path, mode] of projects) {
  const qa = mode === "retreat", crossing = mode === "crossing", upgrade = mode === "upgrade";
  const { objects } = JSON.parse(readFileSync(path, "utf8"));
  const target = Object.values(objects).find(value => value.isa === "PBXNativeTarget" && value.name === "SHI");
  assert(target, "Missing app target");
  const files = phaseType => target.buildPhases.map(id => objects[id]).filter(phase => phase.isa === phaseType)
    .flatMap(phase => phase.files.map(id => objects[objects[id].fileRef]?.path));
  const sources = files("PBXSourcesBuildPhase"), resources = files("PBXResourcesBuildPhase");
  for (const name of ["SHIApp.swift", "NativeCouncilView.swift", "NativeFanyangView.swift", "NativeRetreatView.swift", "RetreatPreviewContent.swift", "NativeRefugeView.swift", "RefugeContinuationSession.swift"])
    assert(sources.includes(name), `Missing compiled source ${name}`);
  for (const name of ["campaign.json", "chapter-01-save-compatibility.v1.json", "chen-council.v1.json", "fanyang-guarantee.v1.json", "viewpoints.v1.json", "ui.json", "Assets.xcassets"])
    assert(resources.includes(name), `Missing inherited resource ${name}`);
  for (const name of drafts) assert.equal(resources.includes(name), qa, `Wrong draft resource boundary: ${name}`);
  for (const name of crossingFiles) assert.equal(resources.includes(name), crossing, `Wrong crossing resource boundary: ${name}`);
  assert(!resources.includes("chapter-01-replays.v1.json"), "Test fixture leaked into the app bundle");
  for (const name of ["CampaignSaveCompatibility.swift", "CrossingCampaignSession.swift", "CrossingPreviewContent.swift", "NativeCrossingCampaignView.swift", "CrossingFieldPresentation.swift", "NativeCrossingField.swift", "NativeCrossingEstablishing.swift"])
    assert(sources.includes(name), `Missing crossing source ${name}`);
  const configs = objects[target.buildConfigurationList].buildConfigurations.map(id => objects[id]);
  assert(configs.length >= 2, "Inspect both Debug and Release");
  for (const config of configs) {
    const settings = config.buildSettings;
    assert.equal(settings.PRODUCT_BUNDLE_IDENTIFIER, qa ? "art.lazying.shi.aftermathqa" : crossing ? "art.lazying.shi.crossingqa" : upgrade ? "art.lazying.shi.upgradeqa" : "art.lazying.shi");
    assert.equal(String(settings.SWIFT_ACTIVE_COMPILATION_CONDITIONS ?? "").includes("SHI_RETREAT_PREVIEW"), qa);
    assert.equal(String(settings.SWIFT_ACTIVE_COMPILATION_CONDITIONS ?? "").includes("SHI_CROSSING_PREVIEW"), crossing);
    assert(!String(settings.SWIFT_ACTIVE_COMPILATION_CONDITIONS ?? "").includes("SHI_UPGRADE_QA"), "Upgrade test flag must not alter app code");
    if (qa || crossing || upgrade) assert.equal(settings.CODE_SIGNING_ALLOWED, "NO");
  }
  if (!qa && !crossing) {
    for (const config of Object.values(objects).filter(value => value.isa === "XCBuildConfiguration")) {
      assert(!String(config.buildSettings.SWIFT_ACTIVE_COMPILATION_CONDITIONS ?? "").includes("SHI_RETREAT_PREVIEW"), "Inherited production preview flag");
      assert(!String(config.buildSettings.SWIFT_ACTIVE_COMPILATION_CONDITIONS ?? "").includes("SHI_CROSSING_PREVIEW"), "Inherited production crossing flag");
    }
  }
  const uiTests = Object.values(objects).find(value => value.isa === "PBXNativeTarget" && value.name === "SHIUITests");
  assert(uiTests, "Missing UI test target");
  for (const id of objects[uiTests.buildConfigurationList].buildConfigurations) {
    const settings = objects[id].buildSettings;
    assert.equal(String(settings.SWIFT_ACTIVE_COMPILATION_CONDITIONS ?? "").includes("SHI_UPGRADE_QA"), upgrade,
      "Installed-upgrade phases must only compile in the dedicated QA test target");
    if (upgrade) {
      assert.equal(settings.PRODUCT_BUNDLE_IDENTIFIER, "art.lazying.shi.upgradeqa.uitests");
      assert.equal(settings.CODE_SIGNING_ALLOWED, "NO");
    }
  }
}
console.log("Generated native projects verified: inherited sources/resources retained; preview and upgrade-test resources, flags and identities isolated from production Debug/Release.");
