#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
[[ $(uname -s) == Darwin ]] || { echo 'Requires the existing Mac/Xcode toolchain.' >&2; exit 1; }
[[ $# -le 1 ]] || { echo 'Optionally pass a fixture from refuge-conformance.ts --followup.' >&2; exit 1; }
mkdir -p "$root/.runtime"
output=$(mktemp -d "$root/.runtime/refuge-followup-check.XXXXXX")
fixture=${1:-"$output/fixture.json"}
if [[ $# == 0 ]]; then gzip -dc "$root/content/conformance/refuge-followup-replays.v1.json.gz" > "$fixture"; fi
[[ -f "$fixture" ]] || { echo 'Missing follow-up fixture.' >&2; exit 1; }
sources=(CampaignEngine CouncilEngine FanyangEngine RetreatEntry RetreatEngine RetreatSession RefugeContinuationEngine RefugeContinuationSession RefugeFollowupEngine RefugeFollowupSession)
files=()
for source in "${sources[@]}"; do files+=("$root/apps/mobile/ios/SHI/$source.swift"); done
xcrun swiftc -swift-version 5 "${files[@]}" "$root/apps/mobile/ios/Tests/RefugeFollowupChecks.swift" -o "$output/check"
"$output/check" "$fixture" "$root/content" "$output/saves"
