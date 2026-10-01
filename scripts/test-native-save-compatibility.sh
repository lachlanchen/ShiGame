#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
mkdir -p "$root/.runtime"
output=$(mktemp -d "$root/.runtime/native-save-compatibility.XXXXXX")
xcrun swiftc -swift-version 5 \
  "$root/apps/mobile/ios/SHI/CampaignSaveCompatibility.swift" \
  "$root/apps/mobile/ios/Tests/CampaignSaveCompatibilityChecks.swift" \
  -o "$output/policy-checks"
"$output/policy-checks" "$root/content/compatibility/chapter-01-save-compatibility.v1.json"
