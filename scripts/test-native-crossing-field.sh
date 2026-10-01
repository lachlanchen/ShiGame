#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
[[ $(uname -s) == Darwin ]] || { echo 'Requires the existing Mac/Xcode toolchain.' >&2; exit 1; }
mkdir -p "$root/.runtime"
output=$(mktemp -d "$root/.runtime/crossing-field-check.XXXXXX")
xcrun swiftc -swift-version 5 \
  "$root/apps/mobile/ios/SHI/CampaignEngine.swift" \
  "$root/apps/mobile/ios/SHI/EngagementEngine.swift" \
  "$root/apps/mobile/ios/SHI/CrossingFieldPresentation.swift" \
  "$root/apps/mobile/ios/Tests/CrossingFieldChecks.swift" -o "$output/check"
"$output/check" "$root/content/presentation/crossing-field.v1.json"
