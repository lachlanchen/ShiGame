#!/usr/bin/env bash
set -euo pipefail
shi_script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
shi_root="${SHI_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
shi_version="${SHI_VERSION:-1.0.0}"
shi_build="${SHI_BUILD:?Set SHI_BUILD to a new provider-verified build number}"
[[ "$shi_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "Invalid SHI_VERSION" >&2; exit 2; }
[[ "$shi_build" =~ ^[1-9][0-9]{0,9}$ ]] && (( shi_build <= 2100000000 )) || { echo "Invalid SHI_BUILD" >&2; exit 2; }
cd "$shi_root"
[[ -f package.json && -f apps/mobile/android/gradlew ]] || { echo "SHI_ROOT is not the Android source workspace" >&2; exit 2; }
shi_root="$PWD"
mkdir -p .runtime
shi_lock="$shi_root/.runtime/.shi-android-build-lock"
mkdir "$shi_lock" 2>/dev/null || { echo "SHI Android build lock exists; reconcile the active job" >&2; exit 2; }
trap 'rmdir "$shi_lock"' EXIT
shi_output="$shi_root/.runtime/android-release-$shi_version-$shi_build"
[[ ! -e "$shi_output" && ! -L "$shi_output" ]] || { echo "Refusing existing Android output: $shi_output" >&2; exit 2; }
# Inspect the result before credentials, payload generation or output reservation.
# This does not replace process/tmux/port ownership checks by the operator.
node "$shi_script_dir/check-workstation-resources.mjs"
# Atomic reservation also refuses partial attempts and symlinks. Never overwrite
# the retained build1 outputs under app/build or a prior numbered candidate.
mkdir "$shi_output" 2>/dev/null || { echo "Refusing existing Android output: $shi_output" >&2; exit 2; }
export ANDROID_HOME="${ANDROID_HOME:-/home/lachlan/Android/Sdk}"
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk-amd64}"
export SHI_ANDROID_KEYSTORE_FILE="${SHI_ANDROID_KEYSTORE_FILE:-$HOME/.config/shi/android/upload-keystore.jks}"
export SHI_ANDROID_KEY_ALIAS="${SHI_ANDROID_KEY_ALIAS:-shi-upload}"
if [[ -z "${SHI_ANDROID_KEYSTORE_PASSWORD:-}" ]]; then
  SHI_ANDROID_KEYSTORE_PASSWORD="$(< "$HOME/.config/shi/android/upload-keystore.password")"
  export SHI_ANDROID_KEYSTORE_PASSWORD
fi
export SHI_ANDROID_KEY_PASSWORD="${SHI_ANDROID_KEY_PASSWORD:-$SHI_ANDROID_KEYSTORE_PASSWORD}"
npm run build:android-web
npx cap sync android
node scripts/mobile-source-manifest.mjs > "$shi_output/source-manifest.json"
cd apps/mobile/android
./gradlew --no-daemon --max-workers=2 -PshiBuild="$shi_build" -PshiVersion="$shi_version" \
  -PshiAppBuildDir="$shi_output/app" :app:testReleaseUnitTest :app:lintRelease :app:assembleRelease :app:bundleRelease
shi_apk="$shi_output/app/outputs/apk/release/app-release.apk"
shi_aab="$shi_output/app/outputs/bundle/release/app-release.aab"
"$ANDROID_HOME/build-tools/36.0.0/apksigner" verify --print-certs "$shi_apk"
shi_badging="$("$ANDROID_HOME/build-tools/36.0.0/aapt" dump badging "$shi_apk")"
shi_package="${shi_badging%%$'\n'*}"
[[ "$shi_package" == *"name='art.lazying.shi'"* && "$shi_package" == *"versionCode='$shi_build'"* && "$shi_package" == *"versionName='$shi_version'"* ]]
cd "$shi_root"
node scripts/mobile-source-manifest.mjs > "$shi_output/source-manifest-after.json"
cmp "$shi_output/source-manifest.json" "$shi_output/source-manifest-after.json"
sha256sum "$shi_apk" "$shi_aab" | tee "$shi_output/artifact-sha256.txt"
