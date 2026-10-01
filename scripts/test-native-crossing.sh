#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
if [[ $(uname -s) != Darwin ]]; then
  echo "Native crossing checks require the existing Mac/Xcode toolchain." >&2
  exit 1
fi
mkdir -p "$root/.runtime"
output=$(mktemp -d "$root/.runtime/native-crossing-check.XXXXXX")
xcrun swiftc -swift-version 5 \
  "$root/apps/mobile/ios/SHI/CampaignEngine.swift" \
  "$root/apps/mobile/ios/SHI/EngagementEngine.swift" \
  "$root/apps/mobile/ios/Tests/EngagementConformance.swift" \
  -o "$output/crossing-conformance" 2>&1 | tee "$output/compile.log"
"$output/crossing-conformance" \
  "$root/content/engagements/chapter-01-broken-crossing.v1.json" \
  "$root/content/conformance/crossing-tactical-replays.v1.json" | tee "$output/conformance.log"
echo "Native tactical-only evidence: $output"
