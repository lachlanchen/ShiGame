#!/usr/bin/env bash
# Run on the established Mac host after source/content sync. Does not upload.
set -euo pipefail
shi_root="${SHI_ROOT:-$HOME/Projects/SHI}"
shi_version="${SHI_VERSION:-1.0.0}"
shi_build="${SHI_BUILD:?Set SHI_BUILD to a new provider-verified build number}"
[[ "$shi_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "Invalid SHI_VERSION" >&2; exit 2; }
[[ "$shi_build" =~ ^[1-9][0-9]*$ ]] || { echo "Invalid SHI_BUILD" >&2; exit 2; }
[[ -f "$shi_root/apps/mobile/ios/project.yml" && -f "$shi_root/apps/mobile/ios/ExportOptions.plist" ]] || {
  echo "SHI_ROOT must contain the formal store project and export options" >&2; exit 2;
}
shi_archive="$shi_root/release/SHI-$shi_version-$shi_build.xcarchive"
shi_export="$shi_root/release/export-$shi_version-$shi_build"
for shi_target in "$shi_archive" "$shi_export"; do
  [[ ! -e "$shi_target" && ! -L "$shi_target" ]] || {
    echo "Refusing to overwrite retained artifact: $shi_target" >&2; exit 2;
  }
done
mkdir -p "$shi_root/release"
shi_lock="$shi_root/release/.shi-ios-build-lock"
mkdir "$shi_lock" 2>/dev/null || { echo "SHI iOS build lock exists; reconcile the active job before retrying" >&2; exit 2; }
trap 'rmdir "$shi_lock"' EXIT
# Recheck under the lock: another build could finish between the first check
# and acquiring the lock. A failed attempt retains its partial artifacts.
for shi_target in "$shi_archive" "$shi_export"; do
  [[ ! -e "$shi_target" && ! -L "$shi_target" ]] || {
    echo "Refusing to overwrite retained artifact: $shi_target" >&2; exit 2;
  }
done
# Signing setup belongs to the shared-host owner. A routine SHI build must not
# read another project's password file or rewrite shared key access controls.
# Prepare/unlock the existing keychain separately before invoking this script.
shi_keychain="${SHI_SIGNING_KEYCHAIN:-$HOME/Library/Keychains/landn-release.keychain-db}"
[[ -f "$shi_keychain" ]] || {
  echo "Signing keychain missing; prepare the existing signing keychain and set SHI_SIGNING_KEYCHAIN. No signing settings were changed." >&2; exit 2;
}
shi_profiles="$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles"
mkdir -p "$shi_profiles" "$HOME/Library/MobileDevice/Provisioning Profiles" "$shi_root/release"
cp "$HOME/.config/shi/apple/SHI_App_Store.mobileprovision" "$shi_profiles/SHI_App_Store.mobileprovision"
cp "$HOME/.config/shi/apple/SHI_App_Store.mobileprovision" "$HOME/Library/MobileDevice/Provisioning Profiles/SHI_App_Store.mobileprovision"
cd "$shi_root/apps/mobile/ios"
"${SHI_XCODEGEN:-$HOME/.local/xcodegen-2.46.0/bin/xcodegen}" generate
xcodebuild -quiet -project SHI.xcodeproj -scheme SHI -configuration Release \
  -destination generic/platform=iOS -archivePath "$shi_archive" \
  -derivedDataPath "$shi_root/build/release" -jobs 2 archive \
  MARKETING_VERSION="$shi_version" CURRENT_PROJECT_VERSION="$shi_build" \
  CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY="Apple Distribution" \
  PROVISIONING_PROFILE_SPECIFIER=SHI_App_Store \
  "OTHER_CODE_SIGN_FLAGS=--keychain $shi_keychain"
shi_info="$shi_archive/Products/Applications/SHI.app/Info.plist"
[[ "$(plutil -extract CFBundleIdentifier raw -o - "$shi_info")" == "art.lazying.shi" ]]
[[ "$(plutil -extract CFBundleShortVersionString raw -o - "$shi_info")" == "$shi_version" ]]
[[ "$(plutil -extract CFBundleVersion raw -o - "$shi_info")" == "$shi_build" ]]
xcodebuild -quiet -exportArchive -archivePath "$shi_archive" \
  -exportOptionsPlist ExportOptions.plist -exportPath "$shi_export"
codesign --verify --deep --strict "$shi_archive/Products/Applications/SHI.app"
shasum -a 256 "$shi_export/SHI.ipa"
