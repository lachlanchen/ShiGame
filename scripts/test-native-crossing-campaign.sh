#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
if [[ $(uname -s) != Darwin ]]; then
  echo "Native campaign checks require the existing Mac/Xcode toolchain." >&2
  exit 1
fi
mkdir -p "$root/.runtime"
output=$(mktemp -d "$root/.runtime/native-crossing-campaign.XXXXXX")
xcrun swiftc -swift-version 5 \
  "$root/apps/mobile/ios/SHI/CampaignEngine.swift" \
  "$root/apps/mobile/ios/SHI/EngagementEngine.swift" \
  "$root/apps/mobile/ios/SHI/CrossingCampaignEngine.swift" \
  "$root/apps/mobile/ios/Tests/CrossingCampaignConformance.swift" \
  -o "$output/campaign-conformance" 2>&1 | tee "$output/compile.log"
gzip -dc "$root/content/conformance/crossing-campaign-replays.v2.json.gz" > "$output/fixtures.json"
"$output/campaign-conformance" "$root" "$output/fixtures.json" | tee "$output/conformance.log"
xcrun swiftc -swift-version 5 \
  "$root/apps/mobile/ios/SHI/CampaignEngine.swift" \
  "$root/apps/mobile/ios/Tests/Conformance.swift" \
  -o "$output/legacy-conformance" 2>&1 | tee "$output/legacy-compile.log"
"$output/legacy-conformance" "$root/content/campaigns/chapter-01-daze.json" \
  "$root/content/conformance/chapter-01-replays.v1.json" | tee "$output/legacy-conformance.log"
