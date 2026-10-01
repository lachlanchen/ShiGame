#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
if [[ $(uname -s) != Darwin ]]; then
  echo "Native session checks require the existing Mac/Xcode toolchain." >&2
  exit 1
fi
mkdir -p "$root/.runtime"
output=$(mktemp -d "$root/.runtime/native-crossing-session.XXXXXX")
xcrun swiftc -swift-version 5 \
  "$root/apps/mobile/ios/SHI/CampaignEngine.swift" \
  "$root/apps/mobile/ios/SHI/CouncilEngine.swift" \
  "$root/apps/mobile/ios/SHI/EngagementEngine.swift" \
  "$root/apps/mobile/ios/SHI/CrossingCampaignEngine.swift" \
  "$root/apps/mobile/ios/SHI/CrossingCampaignSession.swift" \
  "$root/apps/mobile/ios/Tests/CrossingCampaignSessionChecks.swift" \
  -o "$output/session-checks" 2>&1 | tee "$output/compile.log"
gzip -dc "$root/content/conformance/crossing-campaign-replays.v2.json.gz" > "$output/fixtures.json"
"$output/session-checks" "$root" "$output/saves" "$output/fixtures.json" | tee "$output/session.log"
check_gate() {
  local shi_mode="$1"
  shift
  xcrun swiftc -swift-version 5 "$@" \
    "$root/apps/mobile/ios/SHI/CampaignEngine.swift" \
    "$root/apps/mobile/ios/SHI/EngagementEngine.swift" \
    "$root/apps/mobile/ios/SHI/CrossingCampaignEngine.swift" \
    "$root/apps/mobile/ios/SHI/CrossingPreviewContent.swift" \
    "$root/apps/mobile/ios/Tests/CrossingPreviewGateChecks.swift" \
    -o "$output/gate-$shi_mode"
  "$output/gate-$shi_mode"
}
check_gate production
check_gate crossing -D SHI_CROSSING_PREVIEW
xcrun swiftc -swift-version 5 \
  "$root/apps/mobile/ios/SHI/CampaignEngine.swift" \
  "$root/apps/mobile/ios/SHI/CouncilEngine.swift" \
  "$root/apps/mobile/ios/Tests/CouncilConformance.swift" \
  -o "$output/council-conformance"
"$output/council-conformance" "$root/content/councils/chen-council.v1.json" \
  "$root/content/conformance/chen-council-replays.v1.json" | tee "$output/council.log"
