#!/usr/bin/env bash
# Simulator evidence only, not a signed-store or physical-device upgrade claim.
set -euo pipefail
[[ $# == 3 ]] || { echo 'Usage: test-ios-installed-upgrade.sh HISTORICAL_ROOT CANDIDATE_ROOT SHI_SIMULATOR_UDID' >&2; exit 2; }
baseline=$(cd "$1" && pwd)
candidate=$(cd "$2" && pwd)
device=$3
bundle=art.lazying.shi.upgradeqa
[[ "$baseline" != "$candidate" ]] || exit 2
[[ "$device" =~ ^[A-Fa-f0-9-]{36}$ ]] || exit 2
for root in "$baseline" "$candidate"; do
  [[ -f "$root/apps/mobile/ios/SHIUpgradeQA.xcodeproj/project.pbxproj" ]] || exit 2
done
# Never control a generic or already-running simulator. The operator coordinates
# ownership and memory first; this adds an independent accidental-target guard.
xcrun simctl list devices --json | python3 -c '
import json,sys
device=sys.argv[1]
matches=[d for rows in json.load(sys.stdin)["devices"].values() for d in rows if d["udid"]==device]
assert len(matches)==1 and matches[0]["name"].startswith("SHI ") and matches[0]["state"]=="Shutdown", matches
' "$device"
mkdir -p "$candidate/.runtime"
evidence=$(mktemp -d "$candidate/.runtime/installed-upgrade.XXXXXX")
echo "Evidence: $evidence"
trap 'xcrun simctl shutdown "$device" >/dev/null 2>&1 || true' EXIT
common=(-scheme SHI -destination "platform=iOS Simulator,id=$device" -jobs 2
  -parallel-testing-enabled NO -collect-test-diagnostics never
  -maximum-test-execution-time-allowance 300 CODE_SIGNING_ALLOWED=NO)
build_app() {
  local root=$1 label=$2
  xcodebuild -project "$root/apps/mobile/ios/SHIUpgradeQA.xcodeproj" \
    -derivedDataPath "$root/.runtime/upgrade-build" "${common[@]}" \
    build-for-testing >"$evidence/$label-build.log" 2>&1
  local app="$root/.runtime/upgrade-build/Build/Products/Debug-iphonesimulator/SHI.app"
  [[ "$(/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$app/Info.plist")" == "$bundle" ]]
  shasum -a 256 "$app/SHI" "$app/campaign.json" >>"$evidence/artifact-hashes.txt"
  # Modern Xcode Debug builds put app code here; SHI itself may be only a stub.
  if [[ -f "$app/SHI.debug.dylib" ]]; then
    shasum -a 256 "$app/SHI.debug.dylib" >>"$evidence/artifact-hashes.txt"
  fi
}
run_ui() {
  local root=$1 label=$2 method=$3
  # Unsigned simulator test runners can be reused by Xcode despite changed test
  # code. Explicitly install this phase's built runner; never uninstall app data.
  xcrun simctl install "$device" "$root/.runtime/upgrade-build/Build/Products/Debug-iphonesimulator/SHIUITests-Runner.app"
  xcodebuild -project "$root/apps/mobile/ios/SHIUpgradeQA.xcodeproj" \
    -derivedDataPath "$root/.runtime/upgrade-build" "${common[@]}" \
    -only-testing:"SHIUITests/UpgradeUITests/$method" \
    -resultBundlePath "$evidence/$label.xcresult" test-without-building \
    >"$evidence/$label-test.log" 2>&1
  xcrun xcresulttool get test-results summary --path "$evidence/$label.xcresult" >"$evidence/$label-summary.json"
  python3 -c 'import json,sys; r=json.load(open(sys.argv[1])); assert r["passedTests"]==1 and r["failedTests"]==0 and r["skippedTests"]==0,r' "$evidence/$label-summary.json"
}
build_app "$baseline" historical
# Xcode may shut down a simulator it booted itself after the test. Own the boot
# explicitly so the two phases can inspect the same live installation container.
xcrun simctl boot "$device"
xcrun simctl bootstatus "$device" -b
xcrun simctl install "$device" "$baseline/.runtime/upgrade-build/Build/Products/Debug-iphonesimulator/SHI.app"
run_ui "$baseline" historical testPrepareHistoricalUnreadSave
before=$(xcrun simctl get_app_container "$device" "$bundle" data)
save='Library/Application Support/SHI/chronicle-v1.json'
cp "$before/$save" "$evidence/historical-save.json"
build_app "$candidate" candidate
xcrun simctl install "$device" "$candidate/.runtime/upgrade-build/Build/Products/Debug-iphonesimulator/SHI.app"
after=$(xcrun simctl get_app_container "$device" "$bundle" data)
[[ "$before" == "$after" ]]
cmp "$evidence/historical-save.json" "$after/$save"
cp "$after/$save" "$evidence/installed-unlaunched-save.json"
echo 'Same data container and byte-identical unread save after in-place install.'
run_ui "$candidate" candidate testResumeInstalledCandidateWithoutReset
# Xcode's own test installation can relocate the data container. Resolve its
# current path again rather than retaining an obsolete filesystem location.
final_container=$(xcrun simctl get_app_container "$device" "$bundle" data)
cp "$final_container/$save" "$evidence/completed-save.json"
python3 - "$evidence" <<'PY'
import json,sys,pathlib
p=pathlib.Path(sys.argv[1])
old=json.loads((p/'historical-save.json').read_text())
new=json.loads((p/'completed-save.json').read_text())
assert old['campaignSHA256']=='445974ec77d789adc0bd54b147c924fffd1fc440668f900667b1086341a2ef0c'
assert old['choices']==['hide-the-register'] and old['pendingAftermath'] is True
assert new['campaignSHA256']=='0144569248b68b056d3d711ec87242a19a13eb3fbe5ede9c4a7cd6a6dd8fba58'
assert new['choices']==['hide-the-register','release-oldest','cut-the-carts','race-for-chen']
assert new['seed']==old['seed'] and new['pendingAftermath'] is False
print('PASS: historical UI save -> unchanged installed container -> candidate cold resume -> four distinct orders, same seed, acknowledged ending.')
PY
echo "Completed: $evidence"
