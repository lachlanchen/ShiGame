import test from "node:test";
import assert from "node:assert/strict";
import { readFile,mkdtemp,rm,symlink } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { overrideIni,renderQaConfig,prepareQaConfig,qaIdentifier } from "./jinyang-native-qa-config.mjs";

const root=resolve(import.meta.dirname,"..");
const source=resolve(root,"apps/unreal/Config");
const engine=await readFile(resolve(source,"DefaultEngine.ini"),"utf8");
const game=await readFile(resolve(source,"DefaultGame.ini"),"utf8");
const hash=s=>createHash("sha256").update(s).digest("hex");
function values(text,section,key) {
  let active=false;const output=[];
  for(const line of text.split("\n")) {
    const header=line.match(/^\[([^\]]+)\]$/);
    if(header)active=header[1]===section;
    const field=line.match(/^([+!.-]?)([^=]+)=(.*)$/);
    if(active && field?.[2]===key) {
      if(field[1]==="!")output.length=0;
      else output.push(field[3]);
    }
  }
  return output;
}
const one=(text,section,key)=>{const all=values(text,section,key);assert.equal(all.length,1);return all[0];};

test("QA configuration selects Jinyang and isolated identity for all native targets",()=>{
  for(const platform of ["IOS","Android","Mac"]) {
    const output=renderQaConfig(engine,game,platform);
    assert.equal(one(output.engine,"/Script/EngineSettings.GameMapsSettings","GlobalDefaultGameMode"),"/Script/SHI.ShiJinyangGameMode");
    assert.equal(one(output.game,"SHI.Jinyang","StartInExploration"),"True");
    assert.equal(one(output.game,"SHI.Jinyang","InitialLocale"),"zh-Hans");
    assert.equal(one(output.game,"SHI.Jinyang","NativeQATarget"),platform);
    assert.equal(one(output.engine,"/Script/IOSRuntimeSettings.IOSRuntimeSettings","BundleIdentifier"),qaIdentifier);
    assert.equal(one(output.engine,"/Script/AndroidRuntimeSettings.AndroidRuntimeSettings","PackageName"),qaIdentifier);
    assert.notEqual(qaIdentifier,"art.lazying.shi");
    assert.equal(one(output.engine,"/Script/AndroidRuntimeSettings.AndroidRuntimeSettings","bUseExternalFilesDir"),"True");
    assert.equal(one(output.game,"/Script/UnrealEd.ProjectPackagingSettings","ForDistribution"),"False");
    assert.equal(one(output.game,"/Script/UnrealEd.ProjectPackagingSettings","BuildConfiguration"),"PPBC_Development");
    assert.doesNotMatch(output.engine,/SigningCertificate|MobileProvision|SDKPath|NDKPath|TeamID|Secret|Password/);
  }
});
test("mobile rendering and landscape scope do not change the desktop baseline",()=>{
  for(const platform of ["IOS","Android"]) {
    const output=renderQaConfig(engine,game,platform);
    assert.equal(one(output.engine,"/Script/Engine.RendererSettings","r.DynamicGlobalIlluminationMethod"),"0");
    assert.equal(one(output.engine,"/Script/Engine.RendererSettings","r.ReflectionMethod"),"0");
    assert.equal(one(output.engine,"/Script/AndroidRuntimeSettings.AndroidRuntimeSettings","Orientation"),"SensorLandscape");
    assert.equal(one(output.engine,"/Script/IOSRuntimeSettings.IOSRuntimeSettings","bSupportsPortraitOrientation"),"False");
  }
  assert.equal(one(renderQaConfig(engine,game,"Mac").engine,"/Script/Engine.RendererSettings","r.DynamicGlobalIlluminationMethod"),"1");
  assert.equal(one(engine,"/Script/EngineSettings.GameMapsSettings","GlobalDefaultGameMode"),"/Script/SHI.ShiGameMode");
});
test("modern Apple identity and signing stay isolated from store configuration",()=>{
  const section="/Script/MacTargetPlatform.XcodeProjectSettings";
  const seeded=engine+`\n[${section}]\nBundleIdentifier=art.lazying.shi\nbUseAutomaticCodeSigning=True\nbUseAppStoreConnect=True\nCodeSigningTeam=old-team\nIOSProvisioningProfile=old-profile\nIOSSigningIdentity=old-identity\n`;
  for(const platform of ["IOS","Mac"]) {
    const output=renderQaConfig(seeded,game,platform);
    assert.equal(one(output.engine,section,"BundleIdentifier"),qaIdentifier);
    assert.equal(one(output.engine,section,"ApplicationDisplayName"),"SHI Jinyang QA");
    assert.equal(one(output.engine,section,"bUseAutomaticCodeSigning"),"False");
    assert.equal(one(output.engine,section,"bUseAppStoreConnect"),"False");
    assert.equal(one(output.engine,section,"bMacSignToRunLocally"),"True");
    for(const key of ["CodeSigningTeam","IOSProvisioningProfile","IOSSigningIdentity"])
      assert.equal(one(output.engine,section,key),"");
    assert.doesNotMatch(output.engine,/old-team|old-profile|old-identity/);
  }
  assert.deepEqual(values(renderQaConfig(engine,game,"Android").engine,section,"BundleIdentifier"),values(engine,section,"BundleIdentifier"));
  assert.doesNotMatch(engine,/bMacSignToRunLocally=True/);
});
test("cook profile retains world, shapes, touch UI and canonical non-UFS content",()=>{
  const output=renderQaConfig(engine,game,"IOS");
  assert.deepEqual(values(output.game,"/Script/UnrealEd.ProjectPackagingSettings","DirectoriesToAlwaysCook"),[
    '(Path="/Engine/BasicShapes")','(Path="/Engine/MobileResources/HUD")','(Path="/Game/SHI/Art/JinyangWorld")',
  ]);
  assert.deepEqual(values(output.game,"/Script/UnrealEd.ProjectPackagingSettings","DirectoriesToAlwaysStageAsNonUFS"),['(Path="StreamingAssets")']);
  assert.doesNotMatch(output.game,/DirectoriesToAlwaysCook=.*Daze/);
});
test("Chinese-first QA packages English and Simplified Chinese language data explicitly",()=>{
  for(const platform of ["IOS","Android","Mac"]) {
    const output=renderQaConfig(engine,game,platform);
    const section="/Script/UnrealEd.ProjectPackagingSettings";
    assert.equal(one(output.game,section,"InternationalizationPreset"),"EFIGSCJK");
    assert.deepEqual(values(output.game,section,"CulturesToStage"),["en","zh-Hans"]);
    assert.match(output.game,/!CulturesToStage=ClearArray/);
  }
  assert.doesNotMatch(game,/InternationalizationPreset=EFIGSCJK/);
});
test("INI override preserves unrelated sections and rejects multiline injection",()=>{
  const output=overrideIni("; kept\n[A]\nKey=old\n+List=old\nKeep=yes\n[B]\nKey=other\n[A]\nKey=again\n","A",{Key:"new",List:["one","two"]});
  assert.equal(one(output,"A","Key"),"new");
  assert.equal(one(output,"B","Key"),"other");
  assert.equal(one(output,"A","Keep"),"yes");
  assert.deepEqual(values(output,"A","List"),["one","two"]);
  assert.match(output,/; kept/);
  assert.throws(()=>overrideIni("","A",{Key:"x\n[B]"}),/Invalid value/);
  assert.throws(()=>renderQaConfig(engine,game,"Production"),/Choose/);
  assert.throws(()=>renderQaConfig("unexpected",game,"IOS"),/unchanged base/);
});
test("preparation is exclusive, hash-receipted and never writes canonical or existing configs",async()=>{
  const stage=await mkdtemp(resolve(tmpdir(),"shi-native-qa-config-test-"));
  try {
    const destination=resolve(stage,"new");
    const receipt=await prepareQaConfig(destination,"IOS");
    assert.equal(receipt.profile,"jinyang-native-qa-v3");
    assert.equal(receipt.sourceConfig.engine,hash(engine));
    assert.equal(receipt.sourceConfig.game,hash(game));
    for(const [name,expected] of Object.entries(receipt.outputs))
      assert.equal(hash(await readFile(resolve(destination,name))),expected);
    await assert.rejects(()=>prepareQaConfig(destination,"Android"),{code:"EEXIST"});
    assert.equal(hash(await readFile(resolve(destination,"DefaultEngine.ini"))),receipt.outputs["DefaultEngine.ini"]);
    await assert.rejects(()=>prepareQaConfig(resolve(source,"new-qa-config"),"IOS"),/canonical/);
    await symlink(source,resolve(stage,"linked-config"),"dir");
    await assert.rejects(()=>prepareQaConfig(resolve(stage,"linked-config/new-qa-config"),"IOS"),/canonical/);
    await assert.rejects(()=>prepareQaConfig("relative","IOS"),/absolute/);
    assert.equal(await readFile(resolve(source,"DefaultEngine.ini"),"utf8"),engine);
    assert.equal(await readFile(resolve(source,"DefaultGame.ini"),"utf8"),game);
  } finally {await rm(stage,{recursive:true,force:true});}
});
test("unsigned iOS companion scopes every override to the device SDK, never Mac helpers",async()=>{
  const stage=await mkdtemp(resolve(tmpdir(),"shi-native-qa-signing-test-"));
  try {
    for(const platform of ["IOS","Mac","Android"]) {
      const destination=resolve(stage,platform);
      const receipt=await prepareQaConfig(destination,platform);
      assert.equal(Object.hasOwn(receipt.outputs,"UnsignedIOS.xcconfig"),platform==="IOS");
      if(platform!=="IOS") {
        await assert.rejects(()=>readFile(resolve(destination,"UnsignedIOS.xcconfig")),{code:"ENOENT"});
        continue;
      }
      const text=await readFile(resolve(destination,"UnsignedIOS.xcconfig"),"utf8");
      const settings=text.split("\n").filter(line=>line && !line.startsWith("//"));
      assert.deepEqual(settings,[
        "CODE_SIGNING_ALLOWED[sdk=iphoneos*] = NO","CODE_SIGNING_REQUIRED[sdk=iphoneos*] = NO",
        "CODE_SIGN_IDENTITY[sdk=iphoneos*] =","PROVISIONING_PROFILE_SPECIFIER[sdk=iphoneos*] =",
        "DEVELOPMENT_TEAM[sdk=iphoneos*] =","CODE_SIGN_STYLE[sdk=iphoneos*] = Manual",
      ]);
      assert.equal(hash(text),receipt.outputs["UnsignedIOS.xcconfig"]);
      assert.match(receipt.signing,/Unset it before separately signing/);
    }
  } finally {await rm(stage,{recursive:true,force:true});}
});
test("static native entry wiring retains config and explicit desktop launch overrides",async()=>{
  const cpp=await readFile(resolve(root,"apps/unreal/Source/SHI/ShiJinyangGameMode.cpp"),"utf8");
  assert.match(cpp,/GConfig->GetString\(TEXT\("SHI.Jinyang"\),TEXT\("InitialLocale"\),Locale,GGameIni\)/);
  assert.match(cpp,/GConfig->GetBool\(TEXT\("SHI.Jinyang"\),TEXT\("StartInExploration"\),StartInExploration,GGameIni\)/);
  assert.match(cpp,/StartInExploration \|\| FParse::Param\(FCommandLine::Get\(\),TEXT\("ShiExplore"\)\)/);
});
