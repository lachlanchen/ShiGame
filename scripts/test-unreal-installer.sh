#!/usr/bin/env bash
set -euo pipefail

SHI_TEST_REPO_ROOT="$(realpath -e "$(dirname "${BASH_SOURCE[0]}")/..")"
SHI_TEST_INSTALLER="$SHI_TEST_REPO_ROOT/scripts/install-official-unreal-linux.sh"
SHI_TEST_ROOT="$(mktemp -d /tmp/shi-unreal-installer-test.XXXXXX)"

cleanup_test_root() {
  if [[ "$SHI_TEST_ROOT" == /tmp/shi-unreal-installer-test.* && -d "$SHI_TEST_ROOT" ]]; then
    rm -rf -- "$SHI_TEST_ROOT"
  fi
}
trap cleanup_test_root EXIT

make_mock_archive() {
  local archive="$1" minor="$2" patch="$3"
  local tree="$SHI_TEST_ROOT/tree-$minor-$patch"
  mkdir -p "$tree/UE/Engine/Build/BatchFiles/Linux" "$tree/UE/Engine/Binaries/Linux"
  cat >"$tree/UE/Engine/Build/Build.version" <<EOF
{"MajorVersion":5,"MinorVersion":$minor,"PatchVersion":$patch,"Changelist":5801001}
EOF
  printf '#!/usr/bin/env bash\nexit 0\n' >"$tree/UE/Engine/Binaries/Linux/UnrealEditor"
  printf '#!/usr/bin/env bash\nexit 0\n' >"$tree/UE/Engine/Binaries/Linux/UnrealEditor-Cmd"
  printf '#!/usr/bin/env bash\nexit 0\n' >"$tree/UE/Engine/Build/BatchFiles/Linux/Build.sh"
  chmod +x "$tree/UE/Engine/Binaries/Linux/UnrealEditor" \
    "$tree/UE/Engine/Binaries/Linux/UnrealEditor-Cmd" \
    "$tree/UE/Engine/Build/BatchFiles/Linux/Build.sh"
  (cd "$tree" && zip -qr "$archive" UE)
}

SHI_TEST_GOOD_ARCHIVE="$SHI_TEST_ROOT/Linux_Unreal_Engine_5.8.1.zip"
SHI_TEST_BAD_ARCHIVE="$SHI_TEST_ROOT/Linux_Unreal_Engine_5.7.9.zip"
make_mock_archive "$SHI_TEST_GOOD_ARCHIVE" 8 1
make_mock_archive "$SHI_TEST_BAD_ARCHIVE" 7 9

"$SHI_TEST_INSTALLER" verify "$SHI_TEST_GOOD_ARCHIVE" >/dev/null
if "$SHI_TEST_INSTALLER" verify "$SHI_TEST_BAD_ARCHIVE" >/dev/null 2>&1; then
  printf '%s\n' "Installer accepted an Unreal 5.7 archive." >&2
  exit 1
fi

if "$SHI_TEST_INSTALLER" install "$SHI_TEST_GOOD_ARCHIVE" "$SHI_TEST_REPO_ROOT/apps/unreal/forbidden-engine" >/dev/null 2>&1; then
  printf '%s\n' "Installer accepted a destination inside Git." >&2
  exit 1
fi

SHI_TEST_DESTINATION="$SHI_TEST_ROOT/installed/UE_5.8.1"
"$SHI_TEST_INSTALLER" install "$SHI_TEST_GOOD_ARCHIVE" "$SHI_TEST_DESTINATION" >/dev/null
[[ -x "$SHI_TEST_DESTINATION/Engine/Binaries/Linux/UnrealEditor" ]]
[[ -f "$SHI_TEST_DESTINATION/.shi-official-install" ]]
grep -q '^version=5.8.1$' "$SHI_TEST_DESTINATION/.shi-official-install"

if "$SHI_TEST_INSTALLER" install "$SHI_TEST_GOOD_ARCHIVE" "$SHI_TEST_DESTINATION" >/dev/null 2>&1; then
  printf '%s\n' "Installer overwrote an existing destination." >&2
  exit 1
fi

printf '%s\n' "Official Unreal installer contract passed."
