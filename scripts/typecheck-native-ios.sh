#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
shi_sdk=$(xcrun --sdk iphonesimulator --show-sdk-path)
shi_target="$(uname -m)-apple-ios16.0-simulator"
xcrun --sdk iphonesimulator swiftc -typecheck -swift-version 5 \
  -target "$shi_target" -sdk "$shi_sdk" "$root"/apps/mobile/ios/SHI/*.swift
xcrun --sdk iphonesimulator swiftc -typecheck -swift-version 5 -D SHI_RETREAT_PREVIEW \
  -target "$shi_target" -sdk "$shi_sdk" "$root"/apps/mobile/ios/SHI/*.swift
echo "Native app production and preview typechecks passed; no simulator was launched."
